import { request } from "../../../core/api.js";

let alunosCache = [];

export async function abrirAlunosProfessor(turmaId = "") {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  conteudo.innerHTML = `
    <section class="page-shell">
      ${montarTopo("GERENCIAMENTO DE ALUNOS", "Aqui está o resumo dos seus alunos.", "Procurar aluno...")}

      <div class="content-area section-center">
        <div class="stats-grid">
          ${cardStat("ALUNOS LISTADOS", "statAlunosListados", "0", "Matriculados ativos", "users-round", "blue")}
          ${cardStat("MÉDIA DE FREQUÊNCIA", "statMediaAlunos", "0%", "Excelente", "circle-check", "green")}
          ${cardStat("FREQUÊNCIA CRÍTICA", "statCriticosAlunos", "0", "Abaixo de 75%", "triangle-alert", "orange")}
          ${cardStat("BIOMETRIA ATIVA", "statBiometriaAlunos", "0", "cadastros", "fingerprint", "purple")}
        </div>
      </div>

        <div class="filters-row">
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
        <label class="search-pill">
          <input type="text" placeholder="${placeholder}" />
          <span>⌕</span>
        </label>
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
                  <button class="aluno-acao-btn" data-aluno-id="${dados.id}" data-aluno-nome="${dados.nome}">Ver Perfil</button>
                  <button class="aluno-acao-btn" data-aluno-id="${dados.id}" data-aluno-nome="${dados.nome}">Ocorrência</button>
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
      localStorage.setItem("ocorrenciaAlunoId", alunoId);
      localStorage.setItem("ocorrenciaAlunoNome", alunoNome);
      localStorage.setItem("abrirModalOcorrencia", "true");
      document.querySelector('[data-page="ocorrencias"]')?.click();
    });
  });
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

