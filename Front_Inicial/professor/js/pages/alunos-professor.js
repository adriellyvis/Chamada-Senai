import { request } from "../../../core/api.js";

let alunosCache = [];

export async function abrirAlunosProfessor(turmaId = "") {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  conteudo.innerHTML = `
    <section class="page-shell">
      ${montarTopo("GERENCIAMENTO DE ALUNOS", "Aqui está o resumo dos seus alunos.", "Buscar alunos e turmas...")}

      <div class="content-area section-center alunos-page-content">
        <div class="stats-grid">
          ${cardStat("ALUNOS LISTADOS", "statAlunosListados", "0", "Matriculados ativos", "users-round", "blue")}
          ${cardStat("MÉDIA DE FREQUÊNCIA", "statMediaAlunos", "0%", "Excelente", "circle-check", "green")}
          ${cardStat("FREQUÊNCIA CRÍTICA", "statCriticosAlunos", "0", "Abaixo de 75%", "triangle-alert", "orange")}
          ${cardStat("BIOMETRIA ATIVA", "statBiometriaAlunos", "0", "cadastros", "fingerprint", "purple")}
        </div>

        <div class="filters-row filtros-alunos-professor">
          <span class="filter-label">⌁ Filtro:</span>
          <select id="filtroTurmaAlunos" class="select-pill"><option value="">Todas as Turmas</option></select>
          <select id="filtroRendimentoAlunos" class="select-pill">
            <option value="">Todos os Rendimentos</option>
            <option value="regular">Regular</option>
            <option value="atencao">Atenção</option>
            <option value="risco">Risco</option>
          </select>
          <input id="buscaAlunoProfessor" class="input-busca-aluno" type="text" placeholder="Buscar aluno..." />
        </div>

        <div id="listaAlunosProfessor" class="alunos-professor-lista">
          <p class="empty-state">Carregando alunos...</p>
        </div>
      </div>
    </section>
  `;

  await carregarTurmasFiltro(turmaId);
  await carregarAlunosProfessor(turmaId);
  configurarBuscaAlunos();
  configurarFiltroRendimento();
  aplicarBuscaPendenteAluno();
}

function montarTopo(titulo, subtitulo, placeholder) {
  return `
    <header class="page-topbar">
      <div>
        <h1 class="page-title">${titulo}</h1>
        <p class="page-sub">${subtitulo}</p>
      </div>
      <div class="topbar-actions">
        <button class="bell-btn" type="button">🔔</button>
        <div class="search-pill busca-global-professor">
          <input class="busca-global-professor-input" type="search" placeholder="Buscar alunos e turmas..." autocomplete="off" />
          <span aria-hidden="true">⌕</span>
        </div>
      </div>
    </header>
  `;
}

function cardStat(titulo, id, valor, caption, icone, cor) {
  return `
    <article class="stat-card ${cor}">
      <div class="stat-icon">
        <i data-lucide="${icone}"></i>
      </div>

      <h3>${titulo}</h3>

      <div class="stat-row">
        <strong class="stat-number" id="${id}">${valor}</strong>
        <span class="stat-caption ${cor === "orange" ? "warn" : cor === "purple" ? "purple" : ""}">
          ${caption}
        </span>
      </div>
    </article>
  `;
}

async function carregarTurmasFiltro(turmaIdSelecionada = "") {
  const select = document.getElementById("filtroTurmaAlunos");
  if (!select) return;

  try {
    const turmas = await request("/professor/turmas");
    select.innerHTML = `
      <option value="">Todas as Turmas</option>
      ${(turmas || []).map(item => {
        const id = item.turmaId ?? item.turma?.id ?? item.id ?? "";
        const nome = item.nomeTurma ?? item.turma?.nome ?? item.nome ?? "Turma sem nome";
        return `<option value="${id}" ${String(id) === String(turmaIdSelecionada) ? "selected" : ""}>${nome}</option>`;
      }).join("")}
    `;
    select.addEventListener("change", async () => carregarAlunosProfessor(select.value));
  } catch (error) {
    console.error(error);
    select.innerHTML = `<option value="">Erro ao carregar turmas</option>`;
  }
}

async function carregarAlunosProfessor(turmaId = "") {
  const lista = document.getElementById("listaAlunosProfessor");
  if (!lista) return;

  try {
    lista.innerHTML = `<p class="empty-state">Carregando alunos...</p>`;
    const query = new URLSearchParams();
    if (turmaId) query.append("turmaId", turmaId);
    const endpoint = query.toString() ? `/professor/alunos?${query.toString()}` : "/professor/alunos";
    const alunos = await request(endpoint);
    alunosCache = alunos || [];
    atualizarCardsAlunos(alunosCache);
    renderizarAlunosProfessor(alunosCache);
  } catch (error) {
    console.error(error);
    lista.innerHTML = `<p class="empty-state">Erro ao carregar alunos.</p>`;
  }
}

function atualizarCardsAlunos(alunos) {
  const normalizados = alunos.map(normalizarAlunoProfessor);
  const total = normalizados.length;
  const media = total ? normalizados.reduce((soma, aluno) => soma + aluno.frequencia, 0) / total : 0;
  const criticos = normalizados.filter(aluno => aluno.frequencia < 75).length;
  const biometria = normalizados.filter(aluno => aluno.biometriaAtiva).length;

  setTexto("statAlunosListados", total);
  setTexto("statMediaAlunos", `${media.toFixed(1).replace(".0", "")}%`);
  setTexto("statCriticosAlunos", criticos);
  setTexto("statBiometriaAlunos", biometria);
}

function renderizarAlunosProfessor(alunos) {
  const lista = document.getElementById("listaAlunosProfessor");
  if (!lista) return;

  const normalizados = alunos.map(normalizarAlunoProfessor);

  if (!normalizados.length) {
    lista.innerHTML = `<p class="empty-state">Nenhum aluno encontrado.</p>`;
    return;
  }

  lista.innerHTML = `
    <div class="alunos-table-card">
      <table class="alunos-table">
        <thead>
          <tr>
            <th>Aluno / RA</th>
            <th>Turma</th>
            <th>Frequência</th>
            <th>Média Acadêmica</th>
            <th>Leitor Biométrico</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${normalizados.map(dados => {
            const classeStatus = definirClasseFrequencia(dados.frequencia);
            return `
              <tr data-aluno-nome="${dados.nome.toLowerCase()}" data-rendimento="${classeStatus}">
                <td>
                  <div class="aluno-info">
                    <div class="aluno-avatar">${dados.nome.charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>${dados.nome}</strong>
                      <span>RA: ${dados.matricula}</span>
                    </div>
                  </div>
                </td>
                <td><span class="turma-label">${dados.turma}</span></td>
                <td>
                  <div class="freq-cell ${classeStatus}">
                    <strong>${dados.frequencia.toFixed(1)}%</strong>
                    <div class="freq-bar"><div style="width:${Math.min(dados.frequencia, 100)}%"></div></div>
                  </div>
                </td>
                <td>🏅 ${dados.mediaAcademica}</td>
                <td>
                  <span class="aluno-status ${dados.biometriaAtiva ? "regular" : "atencao"}">
                    ${dados.biometriaAtiva ? "Ativo" : "Cadastrar"}
                  </span>
                </td>
                <td>
                  <div class="aluno-acoes-wrap">
                    <button
                      class="aluno-acao-btn perfil"
                      type="button"
                      data-acao="perfil"
                      data-aluno-id="${dados.id}"
                      data-aluno-nome="${dados.nome}"
                    >Ver Perfil</button>
                    <button
                      class="aluno-acao-btn ocorrencia"
                      type="button"
                      data-acao="ocorrencia"
                      data-aluno-id="${dados.id}"
                      data-aluno-nome="${dados.nome}"
                    >Ocorrência</button>
                  </div>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
atualizarIcones();
  configurarAcoesAlunos();
}

function normalizarAlunoProfessor(item) {
  const usuario = item.usuario && typeof item.usuario === "object" ? item.usuario : item;
  const turma = item.turma && typeof item.turma === "object" ? item.turma : item;
  const frequencia = Number(item.frequencia ?? item.percentualFrequencia ?? item.mediaFrequencia ?? 0);

  return {
    id: item.id ?? item.alunoId ?? "",
    nome: usuario.nome ?? item.nomeAluno ?? item.nome ?? "Aluno",
    email: usuario.email ?? item.email ?? "-",
    matricula: item.matricula ?? item.ra ?? item.registroAcademico ?? "-",
    turma: turma.nome ?? item.nomeTurma ?? item.turma ?? "-",
    frequencia,
    mediaAcademica: Number(item.mediaAcademica ?? item.media ?? item.notaMedia ?? 0).toFixed(1),
    biometriaAtiva: Boolean(item.biometriaAtiva ?? item.leitorBiometricoAtivo ?? item.embeddingFacial ?? item.digitalColetada)
  };
}

function definirClasseFrequencia(frequencia) {
  if (frequencia < 50) return "risco";
  if (frequencia < 75) return "atencao";
  return "regular";
}

function configurarBuscaAlunos() {
  const input = document.getElementById("buscaAlunoProfessor");
  if (!input) return;
  input.addEventListener("input", aplicarFiltrosVisuais);
}

function configurarFiltroRendimento() {
  document.getElementById("filtroRendimentoAlunos")?.addEventListener("change", aplicarFiltrosVisuais);
}

function aplicarBuscaPendenteAluno() {
  const nomePendente = sessionStorage.getItem("professorAlunoBuscaPendente");
  if (!nomePendente) return;

  sessionStorage.removeItem("professorAlunoBuscaPendente");

  const input = document.getElementById("buscaAlunoProfessor");
  if (!input) return;

  input.value = nomePendente;
  aplicarFiltrosVisuais();
  input.focus();
}

function aplicarFiltrosVisuais() {
  const termo = document.getElementById("buscaAlunoProfessor")?.value.toLowerCase().trim() ?? "";
  const rendimento = document.getElementById("filtroRendimentoAlunos")?.value ?? "";

  document.querySelectorAll("[data-aluno-nome]").forEach(linha => {
    const nome = linha.dataset.alunoNome ?? "";
    const classe = linha.dataset.rendimento ?? "";
    const nomeOk = !termo || nome.includes(termo);
    const rendimentoOk = !rendimento || classe === rendimento;
    linha.style.display = nomeOk && rendimentoOk ? "" : "none";
  });
}

function configurarAcoesAlunos() {
  document.querySelectorAll(".aluno-acao-btn").forEach(botao => {
    botao.addEventListener("click", () => {
      const alunoId = botao.dataset.alunoId;
      const alunoNome = botao.dataset.alunoNome;
      const acao = botao.dataset.acao;

      if (acao === "perfil") {
        abrirPerfilAluno(alunoId);
        return;
      }

      if (acao === "ocorrencia") {
        abrirOcorrenciaAluno(alunoId, alunoNome);
      }
    });
  });
}

function abrirPerfilAluno(alunoId) {
  const aluno = alunosCache
    .map(normalizarAlunoProfessor)
    .find(item => String(item.id) === String(alunoId));

  if (!aluno) {
    alert("Não foi possível localizar os dados desse aluno.");
    return;
  }

  removerModalPerfilAluno();

  const classeFrequencia = definirClasseFrequencia(aluno.frequencia);
  const situacao = obterSituacaoFrequencia(aluno.frequencia);
  const iniciais = obterIniciais(aluno.nome);
  const frequenciaSegura = Math.max(0, Math.min(aluno.frequencia, 100));

  const modal = document.createElement("div");
  modal.className = "perfil-aluno-overlay";
  modal.id = "perfilAlunoOverlay";

  modal.innerHTML = `
    <section class="perfil-aluno-modal" role="dialog" aria-modal="true" aria-labelledby="perfilAlunoTitulo">
      <header class="perfil-aluno-header">
        <div>
          <span class="perfil-aluno-eyebrow">PERFIL DO ALUNO</span>
          <h2 id="perfilAlunoTitulo">Informações acadêmicas</h2>
          <p>Consulta dos dados disponíveis para o professor.</p>
        </div>

        <button class="perfil-aluno-fechar" id="btnFecharPerfilAluno" type="button" aria-label="Fechar perfil">
          <i data-lucide="x"></i>
        </button>
      </header>

      <div class="perfil-aluno-conteudo">
        <section class="perfil-aluno-identidade">
          <div class="perfil-aluno-avatar">${escapeHtml(iniciais)}</div>

          <div class="perfil-aluno-nome">
            <h3>${escapeHtml(aluno.nome)}</h3>
            <p>RA: ${escapeHtml(aluno.matricula)} • ${escapeHtml(aluno.turma)}</p>
          </div>

          <span class="perfil-aluno-situacao ${classeFrequencia}">${escapeHtml(situacao)}</span>
        </section>

        <section class="perfil-aluno-indicadores">
          ${montarIndicadorPerfil("Frequência", `${aluno.frequencia.toFixed(1)}%`, "calendar-check", classeFrequencia)}
          ${montarIndicadorPerfil("Média acadêmica", aluno.mediaAcademica, "award", "regular")}
          ${montarIndicadorPerfil(
            "Biometria facial",
            aluno.biometriaAtiva ? "Ativa" : "Não cadastrada",
            "scan-face",
            aluno.biometriaAtiva ? "regular" : "atencao"
          )}
        </section>

        <section class="perfil-aluno-dados">
          <div class="perfil-aluno-dado">
            <span>E-mail</span>
            <strong>${escapeHtml(aluno.email)}</strong>
          </div>
          <div class="perfil-aluno-dado">
            <span>Matrícula</span>
            <strong>${escapeHtml(aluno.matricula)}</strong>
          </div>
          <div class="perfil-aluno-dado">
            <span>Turma</span>
            <strong>${escapeHtml(aluno.turma)}</strong>
          </div>
          <div class="perfil-aluno-dado">
            <span>Situação de frequência</span>
            <strong>${escapeHtml(situacao)}</strong>
          </div>
        </section>

        <section class="perfil-aluno-progresso ${classeFrequencia}">
          <div class="perfil-aluno-progresso-topo">
            <div>
              <span>Frequência geral</span>
              <strong>${aluno.frequencia.toFixed(1)}%</strong>
            </div>
            <p>${escapeHtml(obterOrientacaoFrequencia(aluno.frequencia))}</p>
          </div>
          <div class="perfil-aluno-barra" aria-label="Frequência de ${aluno.frequencia.toFixed(1)}%">
            <div style="width: ${frequenciaSegura}%"></div>
          </div>
        </section>
      </div>

      <footer class="perfil-aluno-footer">
        <button class="perfil-aluno-btn secundario" id="btnCancelarPerfilAluno" type="button">Fechar</button>
        <button class="perfil-aluno-btn primario" id="btnOcorrenciaPerfilAluno" type="button">
          <i data-lucide="file-warning"></i>
          Registrar ocorrência
        </button>
      </footer>
    </section>
  `;

  document.body.appendChild(modal);
  document.body.classList.add("perfil-aluno-aberto");
  atualizarIcones();

  document.getElementById("btnFecharPerfilAluno")?.addEventListener("click", removerModalPerfilAluno);
  document.getElementById("btnCancelarPerfilAluno")?.addEventListener("click", removerModalPerfilAluno);
  document.getElementById("btnOcorrenciaPerfilAluno")?.addEventListener("click", () => {
    removerModalPerfilAluno();
    abrirOcorrenciaAluno(aluno.id, aluno.nome);
  });

  modal.addEventListener("click", event => {
    if (event.target === modal) removerModalPerfilAluno();
  });

  document.addEventListener("keydown", fecharPerfilAlunoComEscape);
}

function montarIndicadorPerfil(titulo, valor, icone, classe) {
  return `
    <article class="perfil-aluno-indicador ${classe}">
      <div class="perfil-aluno-indicador-icone"><i data-lucide="${icone}"></i></div>
      <div>
        <span>${titulo}</span>
        <strong>${escapeHtml(String(valor))}</strong>
      </div>
    </article>
  `;
}

function abrirOcorrenciaAluno(alunoId, alunoNome) {
  localStorage.setItem("ocorrenciaAlunoId", alunoId ?? "");
  localStorage.setItem("ocorrenciaAlunoNome", alunoNome ?? "");
  localStorage.setItem("abrirModalOcorrencia", "true");
  document.querySelector('[data-page="ocorrencias"]')?.click();
}

function removerModalPerfilAluno() {
  document.getElementById("perfilAlunoOverlay")?.remove();
  document.body.classList.remove("perfil-aluno-aberto");
  document.removeEventListener("keydown", fecharPerfilAlunoComEscape);
}

function fecharPerfilAlunoComEscape(event) {
  if (event.key === "Escape") removerModalPerfilAluno();
}

function obterSituacaoFrequencia(frequencia) {
  if (frequencia < 50) return "Risco alto";
  if (frequencia < 75) return "Atenção necessária";
  return "Frequência regular";
}

function obterOrientacaoFrequencia(frequencia) {
  if (frequencia < 50) return "Acompanhamento prioritário recomendado.";
  if (frequencia < 75) return "Aluno abaixo do mínimo de 75%.";
  return "Aluno dentro do percentual esperado.";
}

function obterIniciais(nome) {
  const partes = String(nome ?? "A")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) return "A";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function escapeHtml(valor) {
  return String(valor ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}


function atualizarIcones() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

