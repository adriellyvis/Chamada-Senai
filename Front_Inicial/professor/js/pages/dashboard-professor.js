import { request } from "../../../core/api.js";

let turmasCache = [];
let dashboardCache = null;

export async function abrirDashboardProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  conteudo.innerHTML = `
    <section class="page-shell professor-dashboard">
      ${montarTopo("GERENCIAMENTO DE TURMAS", "Aqui está o resumo das suas turmas.", "Buscar turmas, alunos...")}

      <div class="content-area section-center dashboard-final">
        <div class="stats-grid stats-grid-home">
          ${cardStat("MÉDIA DA TURMA", "statMedia", "0%", "+2.4% ↗", "chart-no-axes-column", "blue")}
          ${cardStat("ALUNOS TOTAIS", "statAlunos", "0", "+4 ↗", "users-round", "purple")}
          ${cardStat("AULAS DADAS", "statAulas", "0", "Realizadas", "calendar-days", "lilac")}
        </div>

        <div class="home-dashboard-grid">
          <article class="dashboard-panel chart-card chart-card-home">
            <div class="chart-header">
              <div>
                <div class="chart-title">DESEMPENHO POR TURMA</div>
                <div class="chart-sub">Dados referente ao último mês</div>
              </div>

              <div class="chart-controls horizontal-controls">
                <select class="select-pill" id="selectTurmaProfessor" aria-label="Selecionar turma">
                  <option value="">Todas as turmas</option>
                </select>
                <select class="select-pill" id="selectPeriodoProfessor" aria-label="Selecionar período">
                  <option value="mes">Último mês</option>
                  <option value="semana">Última semana</option>
                  <option value="bimestre">Bimestre</option>
                </select>
              </div>
            </div>

            <div class="legend legend-home">
              <div class="legend-item presencas">● <span>Presenças</span></div>
              <div class="legend-item atrasos">● <span>Atrasos</span></div>
              <div class="legend-item faltas">● <span>Faltas</span></div>
            </div>

            <div id="graficoProfessor" class="grafico-placeholder grafico-home"></div>
          </article>

          <aside class="dashboard-panel activity-card activity-card-home">
            <div class="activity-title">ATIVIDADES RECENTES</div>
            <div id="activityList" class="activity-list-home"></div>
            <button class="btn-relatorio-home" type="button">Ver relatório completo</button>
          </aside>
        </div>
      </div>
    </section>
  `;

  configurarFiltrosGrafico();
  await carregarTurmasDoProfessor();
  await carregarDashboardProfessor();
  atualizarIcones();
  
}

function montarTopo(titulo, subtitulo, placeholder) {
  return `
    <header class="page-topbar">
      <div>
        <h1 class="page-title">${titulo}</h1>
        <p class="page-sub">${subtitulo}</p>
      </div>
      <div class="topbar-actions">
        <button class="bell-btn" type="button" aria-label="Notificações">🔔</button>
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
        <div class="stat-number-wrap">
          <strong class="stat-number" id="${id}">${valor}</strong>
          <span class="stat-caption ${cor === "orange" ? "warn" : cor === "purple" ? "purple" : ""}">
            ${caption}
          </span>
        </div>
      </div>
    </article>
  `;
}

function configurarFiltrosGrafico() {
  document.getElementById("selectTurmaProfessor")?.addEventListener("change", carregarGraficoTurmas);
  document.getElementById("selectPeriodoProfessor")?.addEventListener("change", carregarGraficoTurmas);
}

async function carregarTurmasDoProfessor() {
  const select = document.getElementById("selectTurmaProfessor");
  if (!select) return;

  try {
    const turmas = await request("/professor/turmas");
    turmasCache = Array.isArray(turmas) ? turmas : [];

    select.innerHTML = `
      <option value="">Todas as turmas</option>
      ${turmasCache.map(item => {
        const dados = normalizarTurma(item);
        return `<option value="${dados.turmaId}">${dados.nomeTurma}</option>`;
      }).join("")}
    `;

    atualizarAlunosTotaisPelasTurmas();
  } catch (error) {
    console.error(error);
    select.innerHTML = `<option value="">Erro ao carregar turmas</option>`;
  }
}

async function carregarDashboardProfessor() {
  try {
    dashboardCache = await request("/professor/dashboard");
    const data = dashboardCache || {};
    const frequenciaMedia = Number(data.frequenciaMedia ?? data.mediaPresenca ?? data.mediaTurma ?? 0);

    setTexto("statMedia", `${frequenciaMedia.toFixed(1).replace(".0", "")}%`);
    setTexto("statAlunos", data.alunosTotais ?? data.totalAlunos ?? data.quantidadeAlunos ?? calcularTotalAlunosTurmas());
    setTexto("statAulas", data.aulasRealizadas ?? data.aulasDadas ?? data.totalAulas ?? 0);

    renderizarAtividadesRecentes(data.atividadesRecentes || data.aulasRecentes || data.notificacoes || []);
    await carregarGraficoTurmas();
  } catch (error) {
    console.error(error);
    renderizarAtividadesRecentes([]);
    await carregarGraficoTurmas();
  }
}

async function carregarGraficoTurmas() {
  const grafico = document.getElementById("graficoProfessor");
  try {
    const turmaId = document.getElementById("selectTurmaProfessor")?.value ?? "";
    const periodo = document.getElementById("selectPeriodoProfessor")?.value ?? "mes";
    const query = new URLSearchParams();
    if (turmaId) query.append("turmaId", turmaId);
    query.append("periodo", periodo);

    if (grafico) grafico.innerHTML = `<p class="empty-state">Carregando desempenho...</p>`;
    const dados = await request(`/professor/desempenho-turmas?${query.toString()}`);
    renderizarGraficoTurmas(Array.isArray(dados) ? dados : []);
  } catch (error) {
    console.error(error);
    if (grafico) grafico.innerHTML = `<p class="empty-state">Erro ao carregar desempenho das turmas.</p>`;
  }
}

function renderizarGraficoTurmas(turmas) {
  const grafico = document.getElementById("graficoProfessor");
  if (!grafico) return;

  if (!turmas.length) {
    grafico.innerHTML = `<p class="empty-state">Nenhum dado encontrado.</p>`;
    return;
  }

  const maiorValor = Math.max(...turmas.flatMap(t => [t.presencas ?? 0, t.atrasos ?? 0, t.faltas ?? 0]), 1);
  const escalaMaxima = calcularEscalaMaxima(maiorValor);
  const linhas = gerarLinhasEscala(escalaMaxima);

  grafico.innerHTML = `
    <div class="bar-chart bar-chart-home">
      <div class="chart-scale">${linhas.map(v => `<span>${v}</span>`).join("")}</div>
      <div class="chart-area">
        ${linhas.map(() => `<div class="chart-line"></div>`).join("")}
        <div class="chart-bars">
          ${turmas.slice(0, 5).map(turma => {
            const presencas = Number(turma.presencas ?? 0);
            const atrasos = Number(turma.atrasos ?? 0);
            const faltas = Number(turma.faltas ?? 0);
            const total = presencas + atrasos + faltas;
            return `
              <div class="bar-group">
                <div class="bars">
                  ${barraGrafico(turma, "Presenças", presencas, total, escalaMaxima, "presencas")}
                  ${barraGrafico(turma, "Atrasos", atrasos, total, escalaMaxima, "atrasos")}
                  ${barraGrafico(turma, "Faltas", faltas, total, escalaMaxima, "faltas")}
                </div>
                <span class="bar-label">${turma.turma ?? turma.nomeTurma ?? "Turma"}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function barraGrafico(turma, tipo, valor, total, escalaMaxima, classe) {
  return `
    <div class="bar-wrapper" style="height:${(Number(valor) / escalaMaxima) * 100}%">
      <div class="bar ${classe}"></div>
      <div class="bar-tooltip">
        <strong>${turma.turma ?? turma.nomeTurma ?? "Turma"}</strong>
        <span>${tipo}: ${valor} de ${total}</span>
        <b>${total ? ((Number(valor) / total) * 100).toFixed(1) : 0}%</b>
      </div>
    </div>
  `;
}

function renderizarAtividadesRecentes(atividades) {
  const lista = document.getElementById("activityList");

  if (!lista) return;

  if (!atividades || !atividades.length) {
    lista.innerHTML = `
      <p class="empty-state">
        Nenhuma atividade recente encontrada.
      </p>
    `;
    return;
  }

  lista.innerHTML = atividades.slice(0, 4).map((item, index) => {
    const dados = normalizarAtividadeRecente(item);
    const iniciais = gerarIniciais(dados.nomeTurma);

    return `
      <button class="atividade-linha-home" type="button">
        <span class="atividade-avatar ${corAtividade(index)}">
          ${iniciais}
        </span>

        <span class="atividade-texto">
          <strong>${dados.nomeTurma}</strong>
          <small>${dados.disciplina}</small>
        </span>

        <span class="atividade-seta">›</span>
      </button>
    `;
  }).join("");
}

function normalizarAtividadeRecente(item) {
  const nomeTurma =
    item.nomeTurma ??
    item.turma ??
    item.turmaNome ??
    item.nome ??
    item.aula?.turma ??
    item.aula?.nomeTurma ??
    "Turma";

  let disciplina =
    item.disciplina ??
    item.nomeDisciplina ??
    item.disciplinaNome ??
    item.turmaDisciplina?.disciplina?.nome ??
    item.aula?.disciplina ??
    item.aula?.nomeDisciplina ??
    item.aula?.turmaDisciplina?.disciplina?.nome ??
    "";

  if (!disciplina) {
    const turmaEncontrada = turmasCache.find(turma => {
      const dados = normalizarTurma(turma);

      return String(dados.nomeTurma).toLowerCase()
        === String(nomeTurma).toLowerCase();
    });

    disciplina = turmaEncontrada
      ? normalizarTurma(turmaEncontrada).disciplina
      : "Disciplina não informada";
  }

  const status =
    item.status ??
    item.statusAula ??
    item.situacao ??
    "Encerrada";

  return {
    nomeTurma,
    disciplina,
    status
  };
}

function gerarIniciais(texto) {
  return String(texto || "T")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join("");
}

function corAtividade(index) {
  const cores = ["purple", "blue", "green", "yellow", "pink", "orange"];
  return cores[index % cores.length];
}

function hashTexto(texto) {
  return String(texto).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function atualizarAlunosTotaisPelasTurmas() {
  const atual = document.getElementById("statAlunos")?.textContent;
  if (atual && atual !== "0") return;
  setTexto("statAlunos", calcularTotalAlunosTurmas());
}

function calcularTotalAlunosTurmas() {
  return turmasCache.reduce((total, turma) => {
    const qtd = Number(turma.totalAlunos ?? turma.quantidadeAlunos ?? turma.alunos ?? 0);
    return total + (Number.isFinite(qtd) ? qtd : 0);
  }, 0);
}

function normalizarTurma(item) {
  return {
    turmaId: item.turmaId ?? item.id ?? item.turma?.id ?? "",
    nomeTurma: item.nomeTurma ?? item.nome ?? item.turma?.nome ?? "Turma sem nome",
    disciplina:
      item.disciplina ??
      item.nomeDisciplina ??
      item.disciplinaNome ??
      item.turmaDisciplina?.disciplina?.nome ??
      item.disciplina?.nome ??
      "Disciplina não informada"
  };
}

function formatarStatus(status) {
  const chave = String(status).toLowerCase();
  const mapa = { encerrada: "Encerrada", em_andamento: "Em andamento", agendada: "Agendada", cancelada: "Cancelada" };
  return mapa[chave] ?? status;
}

function calcularEscalaMaxima(valor) {
  if (valor <= 10) return 10;
  if (valor <= 25) return 25;
  if (valor <= 50) return 50;
  if (valor <= 100) return 100;
  return Math.ceil(valor / 100) * 100;
}

function gerarLinhasEscala(maximo) {
  const partes = 6;
  const passo = maximo / partes;
  return Array.from({ length: partes + 1 }, (_, index) => Math.round(maximo - passo * index));
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