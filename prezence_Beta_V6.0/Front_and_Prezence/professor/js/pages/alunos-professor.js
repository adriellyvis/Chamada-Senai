import { request } from "../../../core/api.js";
import { enviarFeedbackProfessor } from "../../../core/avisos-api.js";
import { abrirFormularioOcorrencia } from "./ocorrencias-professor.js";

let alunosCache = [];
let vinculosProfessorCache = [];
let mediasAcademicasCache = new Map();
let frequenciasAlunosCache = new Map();

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
        <button class="bell-btn" type="button" aria-label="Notificações"><span class="material-symbols-rounded" aria-hidden="true">notifications</span></button>
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
    vinculosProfessorCache = (Array.isArray(turmas) ? turmas : []).map(normalizarVinculoProfessor);

    // /professor/turmas devolve um item por vínculo turma-disciplina.
    // Para o filtro visual, mostramos cada turma somente uma vez.
    const turmasUnicas = new Map();
    vinculosProfessorCache.forEach(item => {
      if (item.turmaId != null && !turmasUnicas.has(String(item.turmaId))) {
        turmasUnicas.set(String(item.turmaId), item.turmaNome);
      }
    });

    select.innerHTML = `
      <option value="">Todas as Turmas</option>
      ${[...turmasUnicas.entries()].map(([id, nome]) =>
        `<option value="${id}" ${String(id) === String(turmaIdSelecionada) ? "selected" : ""}>${nome}</option>`
      ).join("")}
    `;

    select.addEventListener("change", async () => carregarAlunosProfessor(select.value));
  } catch (error) {
    console.error(error);
    vinculosProfessorCache = [];
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

    // A listagem de alunos não traz todos os indicadores calculados pelo back.
    // Montamos a média acadêmica pelas notas e recalculamos a frequência a partir
    // do histórico/detalhes das chamadas do professor, evitando exibir 0% quando
    // já existem presenças registradas por biometria ou manualmente.
    await Promise.all([
      carregarMediasAcademicas(alunosCache, turmaId),
      carregarFrequenciasAlunos(alunosCache, turmaId)
    ]);

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
                <td>
                  <span class="media-academica-cell ${classeMediaAcademica(dados.mediaAcademica)}">
                    <span aria-hidden="true">🏅</span>
                    <strong>${dados.mediaAcademica != null ? dados.mediaAcademica : "—"}</strong>
                    ${dados.mediaAcademica != null ? `<small>/ 10</small>` : ""}
                  </span>
                </td>
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
                      class="aluno-acao-btn feedback"
                      type="button"
                      data-acao="feedback"
                      data-aluno-id="${dados.id}"
                      data-aluno-nome="${dados.nome}"
                    >Feedback</button>
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
  const turmaObjeto = item.turma && typeof item.turma === "object" ? item.turma : null;
  const turmaTexto = typeof item.turma === "string" ? item.turma : null;
  const alunoId = item.id ?? item.alunoId ?? "";
  const frequenciaCalculada = frequenciasAlunosCache.get(String(alunoId));
  const frequencia = normalizarPercentualFrequencia(
    frequenciaCalculada
      ?? item.frequencia
      ?? item.percentualFrequencia
      ?? item.mediaFrequencia
      ?? item.frequenciaGeral
      ?? item.percentualPresenca
      ?? 0
  );
  const mediaCalculada = mediasAcademicasCache.get(String(alunoId));

  return {
    id: alunoId,
    nome: usuario.nome ?? item.nomeAluno ?? item.nome ?? "Aluno",
    email: usuario.email ?? item.email ?? "-",
    matricula: item.matricula ?? item.ra ?? item.registroAcademico ?? "-",
    turmaId: item.turmaId ?? turmaObjeto?.id ?? item.idTurma ?? null,
    turma: turmaObjeto?.nome ?? item.nomeTurma ?? item.turmaNome ?? turmaTexto ?? "-",
    frequencia,
    mediaAcademica: normalizarMediaAcademica(
      mediaCalculada ?? item.mediaAcademica ?? item.media ?? item.notaMedia
    ),
    biometriaAtiva: Boolean(item.biometriaAtiva ?? item.leitorBiometricoAtivo ?? item.embeddingFacial ?? item.digitalColetada)
  };
}

async function carregarMediasAcademicas(alunos, turmaId = "") {
  mediasAcademicasCache = new Map();

  try {
    if (!vinculosProfessorCache.length) {
      const respostaVinculos = await request("/professor/turmas");
      vinculosProfessorCache = (Array.isArray(respostaVinculos) ? respostaVinculos : [])
        .map(normalizarVinculoProfessor);
    }

    const idsAlunos = new Set(
      (Array.isArray(alunos) ? alunos : [])
        .map(item => String(item.id ?? item.alunoId ?? ""))
        .filter(Boolean)
    );

    const vinculos = vinculosProfessorCache.filter(vinculo =>
      vinculo.turmaDisciplinaId != null &&
      (!turmaId || String(vinculo.turmaId) === String(turmaId))
    );

    if (!idsAlunos.size || !vinculos.length) return;

    const resultados = await Promise.allSettled(
      vinculos.map(vinculo => request(`/professor/notas/vinculo/${vinculo.turmaDisciplinaId}`))
    );

    // Para cada aluno guardamos a média de cada disciplina separadamente.
    // Depois fazemos a média entre disciplinas, dando o mesmo peso a cada uma.
    const mediasPorAluno = new Map();

    resultados.forEach((resultado, indice) => {
      if (resultado.status !== "fulfilled") {
        console.warn(
          `Não foi possível carregar notas do vínculo ${vinculos[indice]?.turmaDisciplinaId}:`,
          resultado.reason
        );
        return;
      }

      const notas = Array.isArray(resultado.value) ? resultado.value : [];
      const valoresPorAluno = new Map();

      notas.forEach(nota => {
        const alunoId = String(nota.alunoId ?? "");
        if (!alunoId || !idsAlunos.has(alunoId)) return;

        const notaNormalizada = normalizarNotaParaDez(nota);
        if (!Number.isFinite(notaNormalizada)) return;

        if (!valoresPorAluno.has(alunoId)) valoresPorAluno.set(alunoId, []);
        valoresPorAluno.get(alunoId).push(notaNormalizada);
      });

      valoresPorAluno.forEach((valores, alunoId) => {
        if (!valores.length) return;
        const mediaDisciplina = valores.reduce((soma, valor) => soma + valor, 0) / valores.length;

        if (!mediasPorAluno.has(alunoId)) mediasPorAluno.set(alunoId, []);
        mediasPorAluno.get(alunoId).push(mediaDisciplina);
      });
    });

    mediasPorAluno.forEach((mediasDisciplinas, alunoId) => {
      if (!mediasDisciplinas.length) return;
      const mediaGeral = mediasDisciplinas.reduce((soma, valor) => soma + valor, 0) / mediasDisciplinas.length;
      mediasAcademicasCache.set(alunoId, mediaGeral);
    });
  } catch (error) {
    // A falha nas notas não deve impedir a tela de alunos de abrir.
    console.warn("Não foi possível calcular as médias acadêmicas dos alunos:", error);
  }
}

async function carregarFrequenciasAlunos(alunos, turmaId = "") {
  frequenciasAlunosCache = new Map();

  const listaAlunos = Array.isArray(alunos) ? alunos : [];
  const idsAlunos = new Set(
    listaAlunos
      .map(item => String(item.id ?? item.alunoId ?? ""))
      .filter(Boolean)
  );

  if (!idsAlunos.size) return;

  try {
    const historicoResposta = await request("/professor/historico");
    const historico = Array.isArray(historicoResposta) ? historicoResposta : [];

    const aulas = historico.filter(aula => {
      if (!turmaId) return aula?.id != null;

      const aulaTurmaId = aula?.turmaId ?? aula?.turma?.id ?? aula?.idTurma;
      if (aulaTurmaId != null) {
        return String(aulaTurmaId) === String(turmaId);
      }

      const nomeTurmaSelecionada = vinculosProfessorCache.find(
        vinculo => String(vinculo.turmaId) === String(turmaId)
      )?.turmaNome;

      if (!nomeTurmaSelecionada) return false;
      const nomeTurmaAula = typeof aula?.turma === "string"
        ? aula.turma
        : aula?.turma?.nome ?? aula?.nomeTurma ?? aula?.turmaNome ?? "";

      return normalizarTextoFrequencia(nomeTurmaAula) === normalizarTextoFrequencia(nomeTurmaSelecionada);
    });

    const aulasUnicas = [...new Map(
      aulas
        .filter(aula => aula?.id != null)
        .map(aula => [String(aula.id), aula])
    ).values()];

    if (!aulasUnicas.length) return;

    const acumuladoPorAluno = new Map();
    const resultados = await Promise.allSettled(
      aulasUnicas.map(aula => request(`/professor/aula/${aula.id}/detalhes`))
    );

    resultados.forEach((resultado, indice) => {
      if (resultado.status !== "fulfilled") {
        console.warn(
          `Não foi possível carregar os detalhes da aula ${aulasUnicas[indice]?.id}:`,
          resultado.reason
        );
        return;
      }

      const resposta = resultado.value;
      const detalhes = resposta?.alunos ?? resposta?.presencas ?? resposta ?? [];
      if (!Array.isArray(detalhes)) return;

      detalhes.forEach(item => {
        const alunoId = String(item?.alunoId ?? item?.aluno?.id ?? item?.idAluno ?? item?.id ?? "");
        if (!alunoId || !idsAlunos.has(alunoId)) return;

        const status = normalizarStatusFrequencia(
          item?.status ?? item?.presencaStatus ?? item?.situacao ?? item?.statusPresenca
        );

        // Só entram no cálculo registros com situação acadêmica definida.
        // Itens "não registrados" não são tratados como falta automaticamente.
        if (status === "ignorar") return;

        if (!acumuladoPorAluno.has(alunoId)) {
          acumuladoPorAluno.set(alunoId, { validos: 0, presentes: 0 });
        }

        const acumulado = acumuladoPorAluno.get(alunoId);
        acumulado.validos += 1;
        if (status === "presente") acumulado.presentes += 1;
      });
    });

    acumuladoPorAluno.forEach((acumulado, alunoId) => {
      if (!acumulado.validos) return;
      const percentual = (acumulado.presentes / acumulado.validos) * 100;
      frequenciasAlunosCache.set(alunoId, percentual);
    });
  } catch (error) {
    // Se o histórico falhar, mantemos o valor que veio da listagem de alunos.
    console.warn("Não foi possível recalcular as frequências dos alunos:", error);
  }
}

function normalizarStatusFrequencia(valor) {
  const status = normalizarTextoFrequencia(valor).replaceAll(" ", "_");

  if (status.includes("presen") || status.includes("atras") || status.includes("saida")) {
    return "presente";
  }

  if (status.includes("ausen") || status.includes("falta")) {
    return "ausente";
  }

  return "ignorar";
}

function normalizarPercentualFrequencia(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;

  // Aceita tanto percentual (ex.: 82.5) quanto proporção (ex.: 0.825).
  const percentual = numero > 0 && numero <= 1 ? numero * 100 : numero;
  return Math.max(0, Math.min(percentual, 100));
}

function normalizarTextoFrequencia(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizarVinculoProfessor(item) {
  const turma = item?.turma && typeof item.turma === "object" ? item.turma : {};
  return {
    turmaDisciplinaId: item?.turmaDisciplinaId ?? item?.vinculoId ?? item?.id ?? null,
    turmaId: item?.turmaId ?? turma.id ?? null,
    turmaNome: item?.nomeTurma ?? item?.turmaNome ?? turma.nome ?? item?.nome ?? "Turma"
  };
}

function normalizarNotaParaDez(nota) {
  const valor = Number(nota?.nota);
  const maxima = Number(nota?.notaMaxima ?? 10);
  if (!Number.isFinite(valor) || !Number.isFinite(maxima) || maxima <= 0) return NaN;
  return (valor / maxima) * 10;
}

function classeMediaAcademica(mediaFormatada) {
  if (mediaFormatada == null || mediaFormatada === "") return "sem-media";
  const numero = Number(String(mediaFormatada).replace(",", "."));
  if (!Number.isFinite(numero)) return "sem-media";
  if (numero < 6) return "baixa";
  if (numero < 7) return "media";
  return "boa";
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

      if (acao === "feedback") {
        abrirFeedbackAluno(alunoId);
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
          ${montarIndicadorPerfil("Média acadêmica", aluno.mediaAcademica != null ? `${aluno.mediaAcademica} / 10` : "—", "award", "regular")}
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
        <button class="perfil-aluno-btn feedback" id="btnFeedbackPerfilAluno" type="button">
          <i data-lucide="message-square-heart"></i>
          Enviar feedback
        </button>
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
  document.getElementById("btnFeedbackPerfilAluno")?.addEventListener("click", () => {
    removerModalPerfilAluno();
    abrirFeedbackAluno(aluno.id);
  });
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


function abrirFeedbackAluno(alunoId) {
  const aluno = alunosCache
    .map(normalizarAlunoProfessor)
    .find(item => String(item.id) === String(alunoId));

  if (!aluno) {
    alert("Não foi possível localizar o aluno.");
    return;
  }

  removerModalFeedbackAluno();

  const modal = document.createElement("div");
  modal.className = "feedback-aluno-overlay";
  modal.id = "feedbackAlunoOverlay";

  modal.innerHTML = `
    <section class="feedback-aluno-modal" role="dialog" aria-modal="true" aria-labelledby="feedbackAlunoTitulo">
      <header class="feedback-aluno-header">
        <div>
          <span>FEEDBACK ACADÊMICO</span>
          <h2 id="feedbackAlunoTitulo">Enviar acompanhamento ao aluno</h2>
          <p>A frequência é preenchida com o valor atual do sistema. A nota é informada pelo professor.</p>
        </div>
        <button id="btnFecharFeedbackAluno" type="button" aria-label="Fechar">
          <i data-lucide="x"></i>
        </button>
      </header>

      <form id="formFeedbackAluno" class="feedback-aluno-form">
        <div class="feedback-aluno-destinatario">
          <div class="feedback-aluno-avatar">${escapeHtml(obterIniciais(aluno.nome))}</div>
          <div>
            <strong>${escapeHtml(aluno.nome)}</strong>
            <span>${escapeHtml(aluno.turma)} • RA ${escapeHtml(aluno.matricula)}</span>
          </div>
        </div>

        <div class="feedback-aluno-grid">
          <label>
            Frequência atual
            <div class="feedback-readonly ${definirClasseFrequencia(aluno.frequencia)}">
              <strong>${aluno.frequencia.toFixed(1)}%</strong>
              <span>${escapeHtml(obterSituacaoFrequencia(aluno.frequencia))}</span>
            </div>
          </label>

          <label>
            Nota / média informada
            <input id="feedbackNotaAluno" type="number" min="0" step="0.1" placeholder="Ex.: 85 ou 8,5" />
            <small>Use a escala adotada na sua turma.</small>
          </label>
        </div>

        <label>
          Título
          <input id="feedbackTituloAluno" type="text" maxlength="150" value="Feedback acadêmico" required />
        </label>

        <label>
          Comentário
          <textarea id="feedbackMensagemAluno" rows="4" maxlength="1000" placeholder="Faça um resumo do desempenho atual..."></textarea>
        </label>

        <div class="feedback-melhoria-opcional">
          <label class="feedback-melhoria-toggle" for="feedbackAdicionarMelhoria">
            <input id="feedbackAdicionarMelhoria" type="checkbox" />
            <span class="feedback-melhoria-check" aria-hidden="true"></span>
            <span>
              <strong>Adicionar orientação de melhoria</strong>
              <small>Ative somente quando quiser deixar uma recomendação específica para o aluno.</small>
            </span>
          </label>

          <div id="feedbackMelhoriaContainer" class="feedback-melhoria-container" hidden>
            <label>
              Orientação / sugestão de melhoria
              <textarea id="feedbackMelhoriasAluno" rows="5" maxlength="1200" placeholder="Ex.: revisar o conteúdo da última unidade, participar mais das atividades práticas..."></textarea>
            </label>
          </div>
        </div>

        <div id="feedbackAlunoStatus" class="feedback-aluno-status" hidden></div>

        <footer class="feedback-aluno-acoes">
          <button class="secundario" id="btnCancelarFeedbackAluno" type="button">Cancelar</button>
          <button class="primario" id="btnEnviarFeedbackAluno" type="submit">
            <i data-lucide="send"></i>
            Enviar ao aluno
          </button>
        </footer>
      </form>
    </section>
  `;

  document.body.appendChild(modal);
  document.body.classList.add("feedback-aluno-aberto");
  atualizarIcones();

  document.getElementById("btnFecharFeedbackAluno")?.addEventListener("click", removerModalFeedbackAluno);
  document.getElementById("btnCancelarFeedbackAluno")?.addEventListener("click", removerModalFeedbackAluno);
  document.getElementById("formFeedbackAluno")?.addEventListener("submit", event => enviarFeedbackAluno(event, aluno));

  const checkboxMelhoria = document.getElementById("feedbackAdicionarMelhoria");
  const containerMelhoria = document.getElementById("feedbackMelhoriaContainer");
  const campoMelhorias = document.getElementById("feedbackMelhoriasAluno");

  checkboxMelhoria?.addEventListener("change", () => {
    const ativo = checkboxMelhoria.checked;

    if (containerMelhoria) {
      containerMelhoria.hidden = !ativo;
    }

    if (ativo) {
      window.setTimeout(() => campoMelhorias?.focus(), 0);
    } else if (campoMelhorias) {
      campoMelhorias.value = "";
    }
  });

  modal.addEventListener("click", event => {
    if (event.target === modal) removerModalFeedbackAluno();
  });
}

async function enviarFeedbackAluno(event, aluno) {
  event.preventDefault();

  const notaCampo = document.getElementById("feedbackNotaAluno")?.value.trim() ?? "";
  const nota = notaCampo === "" ? null : Number(notaCampo);
  const titulo = document.getElementById("feedbackTituloAluno")?.value.trim();
  const mensagem = document.getElementById("feedbackMensagemAluno")?.value.trim() ?? "";
  const adicionarMelhoria = document.getElementById("feedbackAdicionarMelhoria")?.checked ?? false;
  const melhoriasCampo = document.getElementById("feedbackMelhoriasAluno")?.value.trim() ?? "";
  const melhorias = adicionarMelhoria ? melhoriasCampo : null;
  const botao = document.getElementById("btnEnviarFeedbackAluno");
  const status = document.getElementById("feedbackAlunoStatus");

  if (nota !== null && (!Number.isFinite(nota) || nota < 0)) {
    mostrarStatusFeedback("Informe uma nota válida ou deixe o campo vazio.", "erro");
    return;
  }

  if (!titulo) {
    mostrarStatusFeedback("Informe um título para o feedback.", "erro");
    return;
  }

  if (adicionarMelhoria && !melhoriasCampo) {
    mostrarStatusFeedback("Escreva a orientação de melhoria ou desmarque a opção.", "erro");
    document.getElementById("feedbackMelhoriasAluno")?.focus();
    return;
  }

  const dados = {
    alunoId: Number(aluno.id),
    turmaId: aluno.turmaId ? Number(aluno.turmaId) : null,
    turmaNome: aluno.turma,
    titulo,
    mensagem,
    frequencia: Number(aluno.frequencia.toFixed(2)),
    nota,
    melhorias,
    categoria: "FEEDBACK",
    prioridade: aluno.frequencia < 75 ? "IMPORTANTE" : "NORMAL"
  };

  try {
    if (botao) {
      botao.disabled = true;
      botao.innerHTML = '<span class="feedback-mini-spinner"></span> Enviando...';
    }

    await enviarFeedbackProfessor(dados);
    mostrarStatusFeedback("Feedback enviado ao aluno com sucesso.", "sucesso");
    window.setTimeout(removerModalFeedbackAluno, 1100);
  } catch (error) {
    console.error(error);
    mostrarStatusFeedback(error.message || "Erro ao enviar feedback.", "erro");
    if (botao) {
      botao.disabled = false;
      botao.innerHTML = '<i data-lucide="send"></i> Enviar ao aluno';
      atualizarIcones();
    }
  }

  function mostrarStatusFeedback(texto, tipo) {
    if (!status) return;
    status.hidden = false;
    status.textContent = texto;
    status.className = `feedback-aluno-status ${tipo}`;
  }
}

function removerModalFeedbackAluno() {
  document.getElementById("feedbackAlunoOverlay")?.remove();
  document.body.classList.remove("feedback-aluno-aberto");
}

function normalizarMediaAcademica(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function abrirOcorrenciaAluno(alunoId, alunoNome) {
  if (!alunoId) {
    alert("Não foi possível identificar o aluno para registrar a ocorrência.");
    return;
  }

  // Abre o formulário sobre a tela atual. O professor não perde o contexto
  // da listagem de alunos ao registrar uma ocorrência.
  abrirFormularioOcorrencia(null, alunoId);
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

