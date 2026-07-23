import { request } from "../../../core/api.js";
import { definirDadosNotificacoesProfessor } from "../components/notificacoes-professor.js";

let turmasCache = [];
let dashboardCache = null;
const detalhesAulasCache = new Map();

export async function abrirDashboardProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  conteudo.innerHTML = `
    <section class="page-shell professor-dashboard">
      ${montarTopo("GERENCIAMENTO DE TURMAS", "Aqui está o resumo das suas turmas.", "Buscar alunos e turmas...")}

      <div class="content-area section-center dashboard-final">
        <div class="stats-grid stats-grid-home">
          ${cardStat("MÉDIA DAS TURMAS", "statMedia", "0%", "Frequência", "chart-no-axes-column", "blue")}
          ${cardStat("ALUNOS TOTAIS", "statAlunos", "0", "Vinculados", "users-round", "purple")}
          ${cardStat("TURMAS", "statTurmas", "0", "Ativas", "book-open", "green")}
          ${cardStat("AULAS DADAS", "statAulas", "0", "Realizadas", "calendar-days", "lilac")}
        </div>

        <div class="home-dashboard-grid">
          <article class="dashboard-panel chart-card chart-card-home">
            <div class="chart-header">
              <div>
                <div class="chart-title">DESEMPENHO POR TURMA</div>
                <div class="chart-sub" id="chartSubPeriodoProfessor">Dados referentes ao último mês</div>
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
            <button class="btn-relatorio-home" id="btnRelatorioCompleto" type="button">
              Ver relatório completo
            </button>
          </aside>
        </div>
      </div>
    </section>
  `;

  configurarFiltrosGrafico();
  configurarBotaoRelatorio();
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
    <article class="stat-card stat-card-home ${cor}">
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
  document
    .getElementById("selectTurmaProfessor")
    ?.addEventListener("change", carregarGraficoTurmas);
  document
    .getElementById("selectPeriodoProfessor")
    ?.addEventListener("change", carregarGraficoTurmas);
}

function configurarBotaoRelatorio() {
  document
    .getElementById("btnRelatorioCompleto")
    ?.addEventListener("click", () => abrirRelatorioCompleto());
}

async function carregarTurmasDoProfessor() {
  const select = document.getElementById("selectTurmaProfessor");
  if (!select) return;

  try {
    const turmas = await request("/professor/turmas");
    turmasCache = Array.isArray(turmas) ? turmas : [];

    select.innerHTML = `
      <option value="">Todas as turmas</option>
      ${turmasCache
        .map((item) => {
          const dados = normalizarTurma(item);
          return `<option value="${dados.turmaId}">${dados.nomeTurma}</option>`;
        })
        .join("")}
    `;

    setTexto("statTurmas", turmasCache.length);
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
    definirDadosNotificacoesProfessor(data);
    const frequenciaMedia = Number(
      data.frequenciaMedia ?? data.mediaPresenca ?? data.mediaTurma ?? 0,
    );

    const totalAlunos =
      data.alunosTotais ??
      data.totalAlunos ??
      data.quantidadeAlunos ??
      calcularTotalAlunosTurmas();
    const totalTurmas =
      data.turmasTotais ??
      data.totalTurmas ??
      data.quantidadeTurmas ??
      turmasCache.length;
    const aulasDadas =
      data.aulasRealizadas ??
      data.aulasDadas ??
      data.totalAulas ??
      data.chamadasEncerradas ??
      0;

    setTexto("statMedia", `${frequenciaMedia.toFixed(1).replace(".0", "")}%`);
    setTexto("statAlunos", totalAlunos);
    setTexto("statTurmas", totalTurmas);
    setTexto("statAulas", aulasDadas);

    renderizarAtividadesRecentes(obterAtividadesDashboard(data));
    await carregarGraficoTurmas();
  } catch (error) {
    console.error(error);
    setTexto("statAlunos", calcularTotalAlunosTurmas());
    setTexto("statTurmas", turmasCache.length);
    renderizarAtividadesRecentes([]);
    await carregarGraficoTurmas();
  }
}

function obterAtividadesDashboard(data = dashboardCache || {}) {
  const atividades =
    data.atividadesRecentes ?? data.aulasRecentes ?? data.notificacoes ?? [];

  return Array.isArray(atividades) ? atividades : [];
}

async function carregarGraficoTurmas() {
  const grafico = document.getElementById("graficoProfessor");
  try {
    const turmaId =
      document.getElementById("selectTurmaProfessor")?.value ?? "";

    const periodo =
      document.getElementById("selectPeriodoProfessor")?.value ?? "mes";
    atualizarSubtituloPeriodo(periodo);

    const query = new URLSearchParams();

    if (turmaId) query.append("turmaId", turmaId);
    query.append("periodo", periodo);

    if (grafico)
      grafico.innerHTML = `<p class="empty-state">Carregando desempenho...</p>`;
    const dados = await request(
      `/professor/desempenho-turmas?${query.toString()}`,
    );
    renderizarGraficoTurmas(Array.isArray(dados) ? dados : []);
  } catch (error) {
    console.error(error);
    if (grafico)
      grafico.innerHTML = `<p class="empty-state">Erro ao carregar desempenho das turmas.</p>`;
  }
}

function renderizarGraficoTurmas(turmas) {
  const grafico = document.getElementById("graficoProfessor");
  if (!grafico) return;

  if (!turmas.length) {
    grafico.innerHTML = `<p class="empty-state">Nenhum dado encontrado.</p>`;
    return;
  }

  const maiorValor = Math.max(
    ...turmas.flatMap((t) => [t.presencas ?? 0, t.atrasos ?? 0, t.faltas ?? 0]),
    1,
  );
  const escalaMaxima = calcularEscalaMaxima(maiorValor);
  const linhas = gerarLinhasEscala(escalaMaxima);

  grafico.innerHTML = `
    <div class="bar-chart bar-chart-home">
      <div class="chart-scale">${linhas.map((v) => `<span>${v}</span>`).join("")}</div>
      <div class="chart-area">
        ${linhas.map(() => `<div class="chart-line"></div>`).join("")}
        <div class="chart-bars">
          ${turmas
            .slice(0, 5)
            .map((turma) => {
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
            })
            .join("")}
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

  const atividadesExibidas = atividades.slice(0, 4);

  lista.innerHTML = atividadesExibidas
    .map((item, index) => {
      const dados = normalizarAtividadeRecente(item);
      const iniciais = gerarIniciais(dados.nomeTurma);
      const identificacaoAula = [
        dados.disciplina,
        dados.aulaId ? `Aula #${dados.aulaId}` : "",
      ]
        .filter(Boolean)
        .join(" • ");
      const dataHorario = formatarDataHoraRelatorio(
        dados.data,
        dados.horaInicio,
        dados.horaFim,
      );

      return `
      <button
        class="atividade-linha-home"
        type="button"
        data-atividade-index="${index}"
        aria-label="Abrir detalhes da aula ${dados.aulaId ?? dados.nomeTurma}"
      >
        <span class="atividade-avatar ${corAtividade(index)}">
          ${iniciais}
        </span>

        <span class="atividade-texto">
          <strong>${dados.nomeTurma}</strong>
          <span class="atividade-identificacao">${identificacaoAula}</span>
          <small>${[dataHorario, formatarStatus(dados.status)]
            .filter(Boolean)
            .join(" • ")}</small>
        </span>

        <span class="atividade-seta" aria-hidden="true">›</span>
      </button>
    `;
    })
    .join("");

  lista.querySelectorAll("[data-atividade-index]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const index = Number(botao.dataset.atividadeIndex);
      const atividade = atividadesExibidas[index];

      if (atividade) abrirRelatorioCompleto(atividade);
    });
  });
}

async function abrirRelatorioCompleto(atividadeSelecionada = null) {
  fecharRelatorioCompleto();

  const atividades = atividadeSelecionada
    ? [atividadeSelecionada]
    : obterAtividadesDashboard();
  const dadosSelecionados = atividadeSelecionada
    ? normalizarAtividadeRecente(atividadeSelecionada)
    : null;
  const tituloModal = dadosSelecionados?.aulaId
    ? `Aula #${dadosSelecionados.aulaId}`
    : "Relatório completo";
  const subtituloModal = dadosSelecionados
    ? [dadosSelecionados.nomeTurma, dadosSelecionados.disciplina]
        .filter(Boolean)
        .join(" • ")
    : "Resumo das chamadas recentes e dos registros de presença.";
  const kickerModal = dadosSelecionados
    ? "DETALHES DA CHAMADA"
    : "CHAMADAS DO PROFESSOR";
  const modal = document.createElement("div");
  modal.className = "relatorio-modal-overlay";
  modal.id = "relatorioProfessorModal";

  modal.innerHTML = `
    <section class="relatorio-modal" role="dialog" aria-modal="true" aria-labelledby="relatorioProfessorTitulo">
      <header class="relatorio-modal-header">
        <div>
          <span class="relatorio-modal-kicker">${kickerModal}</span>
          <h2 id="relatorioProfessorTitulo">${tituloModal}</h2>
          <p>${subtituloModal}</p>
        </div>

        <button class="relatorio-modal-fechar" id="btnFecharRelatorio" type="button" aria-label="Fechar relatório">
          ×
        </button>
      </header>

      <div class="relatorio-modal-body" id="relatorioProfessorBody">
        ${atividades.length ? montarCarregamentoRelatorio() : montarConteudoRelatorio([])}
      </div>
    </section>
  `;

  document.body.appendChild(modal);
  document.body.classList.add("modal-aberto");

  modal.addEventListener("click", (event) => {
    if (event.target === modal) fecharRelatorioCompleto();
  });

  document
    .getElementById("btnFecharRelatorio")
    ?.addEventListener("click", fecharRelatorioCompleto);

  document.addEventListener("keydown", fecharRelatorioComEscape);
  atualizarIcones();

  if (atividades.length) {
    await carregarDetalhesRelatorio(atividades);
  }
}

function montarCarregamentoRelatorio() {
  return `
    <div class="relatorio-carregando" role="status" aria-live="polite">
      <span class="relatorio-spinner" aria-hidden="true"></span>
      <strong>Carregando dados das chamadas...</strong>
      <p>Consultando presenças, ausências e métodos de registro.</p>
    </div>
  `;
}

async function carregarDetalhesRelatorio(atividades) {
  const atividadesDetalhadas = await Promise.all(
    atividades.map((atividade) => enriquecerAtividadeComDetalhes(atividade)),
  );

  const body = document.getElementById("relatorioProfessorBody");
  if (!body) return;

  body.innerHTML = montarConteudoRelatorio(atividadesDetalhadas);
  atualizarIcones();
}

async function enriquecerAtividadeComDetalhes(atividade) {
  const dados = normalizarAtividadeRecente(atividade);

  if (!dados.aulaId) {
    return {
      ...atividade,
      erroDetalhes: true,
      mensagemErro: "A chamada não possui um identificador de aula.",
    };
  }

  try {
    const chaveCache = String(dados.aulaId);
    let registros = detalhesAulasCache.get(chaveCache);

    if (!registros) {
      registros = await request(`/professor/aula/${dados.aulaId}/detalhes`);

      if (!Array.isArray(registros)) {
        throw new Error("Formato inesperado nos detalhes da aula.");
      }

      detalhesAulasCache.set(chaveCache, registros);
    }

    return {
      ...atividade,
      ...resumirDetalhesAula(registros),
      erroDetalhes: false,
    };
  } catch (error) {
    console.error(`Erro ao carregar detalhes da aula ${dados.aulaId}:`, error);

    return {
      ...atividade,
      erroDetalhes: true,
      mensagemErro: error?.message || "Não foi possível carregar os detalhes.",
    };
  }
}

function resumirDetalhesAula(registros) {
  const registrosPorAluno = new Map();

  registros.forEach((registro, index) => {
    const alunoId = registro.alunoId ?? registro.aluno?.id ?? `sem-id-${index}`;
    registrosPorAluno.set(String(alunoId), registro);
  });

  const registrosUnicos = [...registrosPorAluno.values()];
  const contarStatus = (statusEsperado) =>
    registrosUnicos.filter(
      (registro) => normalizarChave(registro.status) === statusEsperado,
    ).length;

  const contarMetodo = (metodosEsperados) =>
    registrosUnicos.filter((registro) => {
      const status = normalizarChave(registro.status);
      const registroValido = ["PRESENTE", "ATRASADO"].includes(status);

      return (
        registroValido &&
        metodosEsperados.includes(normalizarChave(registro.metodo))
      );
    }).length;

  return {
    totalAlunos: registrosUnicos.length,
    presentes: contarStatus("PRESENTE"),
    ausentes: contarStatus("AUSENTE"),
    atrasados: contarStatus("ATRASADO"),
    biometria: contarMetodo(["BIOMETRIA", "BIOMETRICO", "FACIAL"]),
    manual: contarMetodo(["MANUAL"]),
  };
}

function normalizarChave(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function montarConteudoRelatorio(atividades) {
  if (!atividades.length) {
    return `
      <div class="relatorio-vazio">
        <strong>Nenhuma chamada recente encontrada.</strong>
        <p>Quando houver chamadas no dashboard, elas aparecerão aqui.</p>
      </div>
    `;
  }

  return `
    <div class="relatorio-lista">
      ${atividades
        .map((item, index) => montarCardRelatorio(item, index))
        .join("")}
    </div>
  `;
}

function montarCardRelatorio(item, index) {
  const dados = normalizarAtividadeRecente(item);
  const dataHora = formatarDataHoraRelatorio(
    dados.data,
    dados.horaInicio,
    dados.horaFim,
  );
  const contextoAula = [
    dados.aulaId ? `Aula #${dados.aulaId}` : "",
    dataHora,
  ]
    .filter(Boolean)
    .join(" • ");

  return `
    <article class="relatorio-chamada-card">
      <div class="relatorio-chamada-topo">
        <span class="atividade-avatar ${corAtividade(index)}">
          ${gerarIniciais(dados.nomeTurma)}
        </span>

        <div class="relatorio-chamada-identificacao">
          <strong>${dados.nomeTurma}</strong>
          <span>${dados.disciplina}</span>
          ${contextoAula ? `<small>${contextoAula}</small>` : ""}
        </div>

        <span class="relatorio-status ${classeStatus(dados.status)}">
          ${formatarStatus(dados.status)}
        </span>
      </div>

      <div class="relatorio-metricas">
        ${metricaRelatorio("Alunos", dados.totalAlunos, "users-round")}
        ${metricaRelatorio("Presentes", dados.presentes, "user-check")}
        ${metricaRelatorio("Ausentes", dados.ausentes, "user-x")}
        ${metricaRelatorio("Atrasados", dados.atrasados, "clock-3")}
        ${metricaRelatorio("Biometria", dados.biometria, "scan-face")}
        ${metricaRelatorio("Manual", dados.manual, "hand")}
      </div>

      ${
        dados.erroDetalhes
          ? `<p class="relatorio-erro-detalhes">
              Não foi possível carregar os indicadores desta chamada.
              ${dados.mensagemErro ? `<small>${dados.mensagemErro}</small>` : ""}
            </p>`
          : ""
      }
    </article>
  `;
}

function metricaRelatorio(rotulo, valor, icone) {
  return `
    <div class="relatorio-metrica">
      <i data-lucide="${icone}"></i>
      <span>${rotulo}</span>
      <strong>${valorOuTraco(valor)}</strong>
    </div>
  `;
}

function fecharRelatorioCompleto() {
  document.getElementById("relatorioProfessorModal")?.remove();
  document.body.classList.remove("modal-aberto");
  document.removeEventListener("keydown", fecharRelatorioComEscape);
}

function fecharRelatorioComEscape(event) {
  if (event.key === "Escape") fecharRelatorioCompleto();
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
    const turmaEncontrada = turmasCache.find((turma) => {
      const dados = normalizarTurma(turma);

      return (
        String(dados.nomeTurma).toLowerCase() ===
        String(nomeTurma).toLowerCase()
      );
    });

    disciplina = turmaEncontrada
      ? normalizarTurma(turmaEncontrada).disciplina
      : "Disciplina não informada";
  }

  const presentes = primeiroNumero(
    item.presentes,
    item.totalPresentes,
    item.quantidadePresentes,
    item.resumo?.presentes,
  );
  const ausentes = primeiroNumero(
    item.ausentes,
    item.faltas,
    item.totalAusentes,
    item.quantidadeAusentes,
    item.resumo?.ausentes,
  );
  const atrasados = primeiroNumero(
    item.atrasados,
    item.atrasos,
    item.totalAtrasados,
    item.quantidadeAtrasados,
    item.resumo?.atrasados,
  );

  return {
    aulaId: item.aulaId ?? item.id ?? item.aula?.id ?? null,
    nomeTurma,
    disciplina,
    status: item.status ?? item.statusAula ?? item.situacao ?? "Encerrada",
    data:
      item.dataAula ?? item.data ?? item.aula?.dataAula ?? item.criadoEm ?? null,
    horaInicio:
      item.horaInicio ?? item.horarioInicio ?? item.aula?.horaInicio ?? null,
    horaFim: item.horaFim ?? item.horarioFim ?? item.aula?.horaFim ?? null,
    erroDetalhes: Boolean(item.erroDetalhes),
    mensagemErro: item.mensagemErro ?? "",
    totalAlunos: primeiroNumero(
      item.totalAlunos,
      item.quantidadeAlunos,
      item.alunos,
      item.resumo?.totalAlunos,
      somarQuandoCompleto(presentes, ausentes, atrasados),
    ),
    presentes,
    ausentes,
    atrasados,
    biometria: primeiroNumero(
      item.biometria,
      item.totalBiometria,
      item.registrosBiometricos,
      item.quantidadeBiometria,
      item.resumo?.biometria,
    ),
    manual: primeiroNumero(
      item.manual,
      item.totalManual,
      item.registrosManuais,
      item.quantidadeManual,
      item.resumo?.manual,
    ),
  };
}

function primeiroNumero(...valores) {
  for (const valor of valores) {
    if (valor === null || valor === undefined || valor === "") continue;

    const numero = Number(valor);
    if (Number.isFinite(numero)) return numero;
  }

  return null;
}

function somarQuandoCompleto(...valores) {
  if (valores.some((valor) => valor === null)) return null;
  return valores.reduce((total, valor) => total + valor, 0);
}

function valorOuTraco(valor) {
  return valor === null || valor === undefined ? "—" : valor;
}

function formatarDataHoraRelatorio(data, horaInicio, horaFim = null) {
  if (!data && !horaInicio && !horaFim) return "";

  let dataFormatada = "";

  if (data) {
    const texto = String(data);
    const somenteData = texto.includes("T") ? texto.split("T")[0] : texto;
    const partes = somenteData.split("-");

    dataFormatada =
      partes.length === 3
        ? `${partes[2]}/${partes[1]}/${partes[0]}`
        : somenteData;
  }

  const inicioFormatado = horaInicio ? String(horaInicio).slice(0, 5) : "";
  const fimFormatado = horaFim ? String(horaFim).slice(0, 5) : "";
  const intervalo =
    inicioFormatado && fimFormatado
      ? `${inicioFormatado}–${fimFormatado}`
      : inicioFormatado || fimFormatado;

  return [dataFormatada, intervalo].filter(Boolean).join(" • ");
}

function classeStatus(status) {
  const chave = String(status || "").toLowerCase();

  if (chave === "em_andamento" || chave === "em andamento") return "em-andamento";
  if (chave === "agendada") return "agendada";
  if (chave === "cancelada") return "cancelada";
  return "encerrada";
}

function gerarIniciais(texto) {
  return String(texto || "T")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

function corAtividade(index) {
  const cores = ["purple", "blue", "green", "yellow", "pink", "orange"];
  return cores[index % cores.length];
}

function atualizarAlunosTotaisPelasTurmas() {
  const atual = document.getElementById("statAlunos")?.textContent;
  if (atual && atual !== "0") return;
  setTexto("statAlunos", calcularTotalAlunosTurmas());
}

function calcularTotalAlunosTurmas() {
  return turmasCache.reduce((total, turma) => {
    const qtd = Number(
      turma.totalAlunos ?? turma.quantidadeAlunos ?? turma.alunos ?? 0,
    );
    return total + (Number.isFinite(qtd) ? qtd : 0);
  }, 0);
}

function normalizarTurma(item) {
  return {
    turmaId: item.turmaId ?? item.id ?? item.turma?.id ?? "",
    nomeTurma:
      item.nomeTurma ?? item.nome ?? item.turma?.nome ?? "Turma sem nome",
    disciplina:
      item.disciplina ??
      item.nomeDisciplina ??
      item.disciplinaNome ??
      item.turmaDisciplina?.disciplina?.nome ??
      item.disciplina?.nome ??
      "Disciplina não informada",
  };
}

function formatarStatus(status) {
  const chave = String(status).toLowerCase();
  const mapa = {
    encerrada: "Encerrada",
    em_andamento: "Em andamento",
    "em andamento": "Em andamento",
    agendada: "Agendada",
    cancelada: "Cancelada",
  };
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
  return Array.from({ length: partes + 1 }, (_, index) =>
    Math.round(maximo - passo * index),
  );
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

function atualizarSubtituloPeriodo(periodo) {
  const elemento = document.getElementById("chartSubPeriodoProfessor");
  if (!elemento) return;

  const textos = {
    mes: "Dados referentes ao último mês",
    semana: "Dados referentes à última semana",
    bimestre: "Dados referentes ao bimestre",
  };

  elemento.textContent =
    textos[periodo] || "Dados referentes ao período selecionado";
}
