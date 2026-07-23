import { request } from "../../../core/api.js";

let dashboardAtual = null;

export async function abrirDashboardAluno(container) {
  const usuario = obterUsuarioLogado();

  container.innerHTML = montarDashboard({
    carregando: true,
    dashboard: montarDashboardFallback()
  });

  try {
    const [dashboard, desempenhoDisciplinas] = usuario?.id
      ? await Promise.all([
          request(`/aluno/dashboard/${usuario.id}`),
          carregarDesempenhoDisciplinas(usuario.id)
        ])
      : [montarDashboardFallback(), []];

    const dashboardNormalizado = normalizarDashboard({
      ...dashboard,
      disciplinas: desempenhoDisciplinas
    });
    dashboardAtual = dashboardNormalizado;

    container.innerHTML = montarDashboard({
      carregando: false,
      dashboard: dashboardNormalizado
    });

    configurarControlesDashboard(dashboardNormalizado);
  } catch (erro) {
    console.error("Erro ao carregar dashboard do aluno:", erro);

    const fallback = montarDashboardFallback();
    dashboardAtual = fallback;

    container.innerHTML = `
      ${montarDashboard({
        carregando: false,
        dashboard: fallback
      })}
      <div class="dashboard-alerta-erro">
        Não foi possível carregar os dados atualizados do dashboard. Exibindo dados demonstrativos.
      </div>
    `;

    configurarControlesDashboard(fallback);
  }
}

function montarDashboard({ carregando, dashboard }) {
  return `
    <div class="dashboard-page">
      ${carregando ? `<div class="dashboard-loading">Carregando seus dados...</div>` : ""}

      <section class="dashboard-layout dashboard-layout--modern">
        <div class="dashboard-main-column">
          <div class="dashboard-stats dashboard-stats--four">
            ${cardStat("♙", "Sua média", formatarPercentual(dashboard.frequencia), textoRisco(dashboard.risco))}
            ${cardStat("♙", "Faltas no mês", dashboard.faltasMes, "No mês atual")}
            ${cardStat("▦", "Aulas assistidas", formatarAulasAssistidas(dashboard), "Total de aulas")}
            ${cardStat("◎", "Frequência geral", formatarPercentual(dashboard.frequencia), situacaoCurta(dashboard.frequencia))}
          </div>

          <article class="card chart-card chart-card--modern" id="dashboardPainelDinamico">
            <div class="chart-toolbar">
              <div>
                <h3>Visão geral de frequência</h3>
                <p>Acompanhe presenças, atrasos e faltas em tempo real.</p>
              </div>

              <div class="dashboard-controls" aria-label="Filtros do desempenho">
                <label>
                  <span>Visão</span>
                  <select id="dashboardVisaoSelect">
                    <option value="geral">Desempenho geral</option>
                    <option value="mes">Resumo do mês</option>
                    <option value="situacao">Situação da frequência</option>
                  </select>
                </label>

                <label>
                  <span>Período</span>
                  <select id="dashboardPeriodoSelect">
                    <option value="todos">Todos os registros</option>
                    <option value="mes">Último mês</option>
                  </select>
                </label>
              </div>
            </div>

            <div id="dashboardPainelConteudo">
              ${montarPainelDashboard(dashboard, "geral", "todos")}
            </div>
          </article>

          ${montarCardDisciplinas(dashboard)}
        </div>

        <aside class="dashboard-right-column dashboard-right-column--modern">
          <article class="card today-card today-card--modern">
            <div class="side-card-header">
              <h3>Horário de Hoje</h3>
              <button type="button">Ver agenda completa</button>
            </div>

            <div class="timeline">
              <div class="timeline-item is-current">
                <span class="timeline-dot"></span>
                <div>
                  <strong>ACONTECENDO AGORA</strong>
                  <h4>Projetos <span>(Wesley)</span></h4>
                  <p>10h00 - 14h00 • Sala 01</p>
                </div>
              </div>

              <div class="timeline-item">
                <span class="timeline-dot"></span>
                <div>
                  <strong>PRÓXIMA AULA</strong>
                  <h4>PDM <span>(Paulo)</span></h4>
                  <p>14h00 - 17h00 • Sala 02</p>
                </div>
              </div>
            </div>
          </article>

          <article class="card notice-card notice-card--modern">
            <div class="side-card-header">
              <h3>📣 Mural de Avisos</h3>
              <button type="button">Ver todos</button>
            </div>

            <div class="notice-list-compact">
              <div class="notice-item">
                <strong>27 ABR • SECRETARIA</strong>
                <p><b>Renovação de matrícula</b><br>A renovação estará disponível até sexta.</p>
              </div>

              <div class="notice-item">
                <strong>25 ABR • COORDENAÇÃO</strong>
                <p><b>Palestra de IA às 19h</b><br>Hoje no auditório principal.</p>
              </div>

              <div class="notice-item notice-item--warning">
                <strong>24 ABR • FREQUÊNCIA</strong>
                <p><b>Atenção à frequência</b><br>Acompanhe seus registros para evitar inconsistências.</p>
              </div>
            </div>
          </article>

          <article class="card biometric-list-card biometric-list-card--modern">
            <div class="side-card-header side-card-header--border">
              <h3>◉ Últimos Registros Biométricos</h3>
              <button type="button">Ver todos</button>
            </div>

            <div class="bio-records bio-records--list">
              ${registroBioLinha("27 ABR • 10:02", "Projetos", "Wesley Pescoraro", "Presente", "green")}
              ${registroBioLinha("27 ABR • 14:00", "PDM", "Paulo Netto", "Presente", "green")}
              ${registroBioLinha("26 ABR • 08:12", "Banco de Dados", "Marcos Vinícius", "Atraso", "yellow")}
            </div>
          </article>
        </aside>
      </section>
    </div>
  `;
}

function configurarControlesDashboard(dashboard) {
  const visaoSelect = document.getElementById("dashboardVisaoSelect");
  const periodoSelect = document.getElementById("dashboardPeriodoSelect");
  const painel = document.getElementById("dashboardPainelConteudo");

  if (!visaoSelect || !periodoSelect || !painel) return;

  const atualizarPainel = () => {
    const visao = visaoSelect.value;
    const periodo = periodoSelect.value;

    periodoSelect.disabled = visao !== "geral";
    painel.innerHTML = montarPainelDashboard(dashboardAtual || dashboard, visao, periodo);
  };

  visaoSelect.addEventListener("change", atualizarPainel);
  periodoSelect.addEventListener("change", atualizarPainel);

  atualizarPainel();
}

function montarPainelDashboard(dashboard, visao = "geral", periodo = "todos") {
  if (visao === "mes") {
    return montarPainelResumoMes(dashboard);
  }

  if (visao === "situacao") {
    return montarPainelSituacao(dashboard);
  }

  return montarPainelGeral(dashboard, periodo);
}

function montarPainelGeral(dashboard, periodo) {
  const dadosGrafico = calcularGraficoPorPeriodo(dashboard, periodo);
  const tituloPeriodo = periodo === "mes" ? "Último mês" : "Todos os registros";

  return `
    <div class="chart-main-view">
      <div class="chart-view-copy">
        <span>VISÃO GERAL</span>
        <h3>${escaparHtml(tituloPeriodo)}</h3>
      </div>

      <div class="chart-content chart-content--modern">
        <div class="pie-chart pie-chart--donut" style="--presencas:${dadosGrafico.presencasPercentual}; --atrasos:${dadosGrafico.atrasosPercentual}; --faltas:${dadosGrafico.faltasPercentual};">
          <div class="donut-center">
            <span>Total de aulas</span>
            <strong>${dadosGrafico.total}</strong>
          </div>
        </div>

        <div class="chart-legend chart-legend--modern">
          <p><span class="legend-dot blue"></span> Presenças <b>${dadosGrafico.presencas} (${dadosGrafico.presencasPercentual}%)</b></p>
          <p><span class="legend-dot yellow"></span> Atrasos <b>${dadosGrafico.atrasos} (${dadosGrafico.atrasosPercentual}%)</b></p>
          <p><span class="legend-dot red"></span> Faltas <b>${dadosGrafico.faltas} (${dadosGrafico.faltasPercentual}%)</b></p>
          <p class="chart-total">Total de aulas registradas: ${dadosGrafico.total}</p>
        </div>
      </div>
    </div>
  `;
}

function montarPainelResumoMes(dashboard) {
  const presencasMes = inteiroValido(dashboard.presencasMes, 0);
  const faltasMes = inteiroValido(dashboard.faltasMes, 0);
  const atrasosMes = inteiroValido(dashboard.atrasosMes, 0);
  const totalMes = presencasMes + faltasMes + atrasosMes;
  const frequenciaMes = totalMes > 0 ? ((presencasMes + atrasosMes) * 100) / totalMes : 0;

  return `
    <div class="summary-panel">
      <div class="chart-header-row">
        <div>
          <span>RESUMO DO MÊS</span>
          <h3>Dados do mês atual</h3>
        </div>
        <strong>${formatarPercentual(frequenciaMes)}</strong>
      </div>

      <div class="month-summary-grid">
        ${resumoMesItem("Presenças", presencasMes, "Aulas confirmadas", "blue")}
        ${resumoMesItem("Faltas", faltasMes, "No mês atual", "red")}
        ${resumoMesItem("Atrasos", atrasosMes, "Registros no mês", "yellow")}
        ${resumoMesItem("Total", totalMes, "Aulas no período", "neutral")}
      </div>

      <div class="month-message">
        <strong>${mensagemFrequencia(frequenciaMes)}</strong>
        <p>${textoOrientacao(frequenciaMes)}</p>
      </div>
    </div>
  `;
}

function montarPainelSituacao(dashboard) {
  const frequencia = numeroValido(dashboard.frequencia, 0);
  const progresso = Math.max(0, Math.min(100, Math.round(frequencia)));

  return `
    <div class="situation-panel">
      <div class="chart-header-row">
        <div>
          <span>SITUAÇÃO DA FREQUÊNCIA</span>
          <h3>Acompanhamento acadêmico</h3>
        </div>
        <strong>${formatarPercentual(frequencia)}</strong>
      </div>

      <div class="frequency-progress-card">
        <div class="progress-ring" style="--progress:${progresso};">
          <strong>${formatarPercentual(frequencia)}</strong>
          <span>frequência</span>
        </div>

        <div class="frequency-status-copy">
          <strong>${mensagemFrequencia(frequencia)}</strong>
          <p>${textoOrientacao(frequencia)}</p>

          <div class="linear-progress">
            <span style="width:${progresso}%"></span>
          </div>

          <div class="frequency-meta-row">
            <span>Mínimo exigido</span>
            <strong>75%</strong>
          </div>

          <div class="frequency-meta-row">
            <span>Status</span>
            <strong>${escaparHtml(textoRisco(dashboard.risco) || "Regular")}</strong>
          </div>
        </div>
      </div>

      <div class="situation-list">
        ${linhaSituacao("Presenças", dashboard.presencas, calcularGrafico(dashboard).presencasPercentual, "blue")}
        ${linhaSituacao("Atrasos", dashboard.atrasos, calcularGrafico(dashboard).atrasosPercentual, "yellow")}
        ${linhaSituacao("Faltas", dashboard.faltas, calcularGrafico(dashboard).faltasPercentual, "red")}
      </div>
    </div>
  `;
}

function montarDashboardFallback() {
  return {
    frequencia: 0,
    presencas: 0,
    faltas: 0,
    atrasos: 0,
    atrasosMes: 0,
    aulasAssistidas: 0,
    totalAulas: 0,
    faltasMes: 0,
    presencasMes: 0,
    ocorrencias: 0,
    risco: "baixo",
    disciplinas: []
  };
}

function normalizarDashboard(dados = {}) {
  const fallback = montarDashboardFallback();

  const presencas = inteiroValido(dados.presencas, fallback.presencas);
  const faltas = inteiroValido(dados.faltas, fallback.faltas);
  const atrasos = inteiroValido(dados.atrasos, fallback.atrasos);
  const totalAulas = inteiroValido(dados.totalAulas, presencas + faltas + atrasos);

  return {
    nome: dados.nome ?? "Aluno",
    turma: dados.turma ?? "Não informada",
    matricula: dados.matricula ?? "Não informada",
    frequencia: numeroValido(dados.frequencia ?? dados.media ?? dados.mediaFrequencia, fallback.frequencia),
    presencas,
    faltas,
    atrasos,
    atrasosMes: inteiroValido(dados.atrasosMes, fallback.atrasosMes),
    aulasAssistidas: inteiroValido(dados.aulasAssistidas, presencas + atrasos),
    totalAulas,
    faltasMes: inteiroValido(dados.faltasMes, faltas),
    presencasMes: inteiroValido(dados.presencasMes, presencas),
    ocorrencias: inteiroValido(dados.ocorrencias, fallback.ocorrencias),
    risco: dados.risco ?? fallback.risco,
    disciplinas: normalizarDisciplinas(dados.disciplinas ?? fallback.disciplinas)
  };
}

function calcularGraficoPorPeriodo(dashboard, periodo) {
  if (periodo === "mes") {
    const presencas = inteiroValido(dashboard.presencasMes, 0);
    const faltas = inteiroValido(dashboard.faltasMes, 0);
    const atrasos = inteiroValido(dashboard.atrasosMes, 0);
    const total = presencas + faltas + atrasos;
    const frequencia = total > 0 ? ((presencas + atrasos) * 100) / total : 0;

    return calcularPercentuais({ presencas, faltas, atrasos, total, frequencia });
  }

  const presencas = inteiroValido(dashboard.presencas, 0);
  const faltas = inteiroValido(dashboard.faltas, 0);
  const atrasos = inteiroValido(dashboard.atrasos, 0);
  const total = inteiroValido(dashboard.totalAulas, presencas + atrasos + faltas);
  const frequencia = numeroValido(dashboard.frequencia, 0);

  return calcularPercentuais({ presencas, faltas, atrasos, total, frequencia });
}

function calcularGrafico(dashboard) {
  return calcularGraficoPorPeriodo(dashboard, "todos");
}

function calcularPercentuais({ presencas, faltas, atrasos, total, frequencia }) {
  if (total <= 0) {
    return {
      presencas,
      faltas,
      atrasos,
      total,
      frequencia: 0,
      presencasPercentual: 0,
      atrasosPercentual: 0,
      faltasPercentual: 0
    };
  }

  const presencasPercentual = Math.round((presencas * 100) / total);
  const atrasosPercentual = Math.round((atrasos * 100) / total);
  let faltasPercentual = 100 - presencasPercentual - atrasosPercentual;

  if (faltasPercentual < 0) {
    faltasPercentual = Math.round((faltas * 100) / total);
  }

  return {
    presencas,
    faltas,
    atrasos,
    total,
    frequencia,
    presencasPercentual,
    atrasosPercentual,
    faltasPercentual
  };
}

function cardStat(icon, label, value, badge = "") {
  return `
    <article class="card stat-card">
      <span class="stat-card__icon">${escaparHtml(icon)}</span>

      <div>
        <span class="stat-card__label">${escaparHtml(label)}</span>
        <strong class="stat-card__value">${escaparHtml(value)}</strong>
      </div>

      ${badge ? `<span class="stat-card__badge">${escaparHtml(badge)}</span>` : ""}
    </article>
  `;
}

function registroBio(data, disciplina, professor, horario, color) {
  return `
    <div class="bio-record bio-record--${escaparHtml(color)}">
      <strong>${escaparHtml(data)}</strong>
      <h4>${escaparHtml(disciplina)}</h4>
      <div>
        <span>${escaparHtml(professor)}</span>
        <span>${escaparHtml(horario)}</span>
      </div>
    </div>
  `;
}

function miniInsight(rotulo, valor) {
  return `
    <div class="mini-insight">
      <span>${escaparHtml(rotulo)}</span>
      <strong>${escaparHtml(valor)}</strong>
    </div>
  `;
}

function resumoMesItem(titulo, valor, subtitulo, cor) {
  return `
    <div class="month-summary-item month-summary-item--${escaparHtml(cor)}">
      <span>${escaparHtml(titulo)}</span>
      <strong>${escaparHtml(valor)}</strong>
      <small>${escaparHtml(subtitulo)}</small>
    </div>
  `;
}

function linhaSituacao(titulo, valor, percentual, cor) {
  return `
    <div class="situation-row situation-row--${escaparHtml(cor)}">
      <div>
        <strong>${escaparHtml(titulo)}</strong>
        <span>${escaparHtml(valor)} registros</span>
      </div>
      <b>${escaparHtml(percentual)}%</b>
    </div>
  `;
}


function montarCardDisciplinas(dashboard) {
  const linhas = Array.isArray(dashboard.disciplinas) ? dashboard.disciplinas : [];

  return `
    <article class="card disciplines-card">
      <div class="disciplines-header">
        <div>
          <h3>Desempenho por disciplina</h3>
          <p>Resumo real de frequência por unidade curricular.</p>
        </div>
        <button type="button">Ver todas as disciplinas</button>
      </div>

      <div class="disciplines-table">
        <div class="disciplines-row disciplines-row--head">
          <span>Disciplina</span>
          <span>Presenças</span>
          <span>Faltas</span>
          <span>Atrasos</span>
          <span>Frequência</span>
        </div>

        ${linhas.length
          ? linhas.map((linha) => `
            <div class="disciplines-row">
              <span class="discipline-name"><i>${escaparHtml(linha.icone)}</i>${escaparHtml(linha.nome)}</span>
              <span>${linha.presencas}<small>(${linha.presencasPct}%)</small></span>
              <span>${linha.faltas}<small class="danger">(${linha.faltasPct}%)</small></span>
              <span>${linha.atrasos}<small class="warn">(${linha.atrasosPct}%)</small></span>
              <span class="discipline-progress"><b style="width:${linha.frequencia}%"></b><strong>${linha.frequencia}%</strong></span>
            </div>
          `).join("")
          : `
            <div class="disciplines-empty">
              Nenhum desempenho por disciplina encontrado ainda.
            </div>
          `
        }
      </div>
    </article>
  `;
}

async function carregarDesempenhoDisciplinas(usuarioId) {
  try {
    const dados = await request(`/aluno/desempenho-disciplinas/${usuarioId}`);
    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.warn("Não foi possível carregar desempenho por disciplina:", erro);
    return [];
  }
}

function normalizarDisciplinas(disciplinas = []) {
  if (!Array.isArray(disciplinas)) return [];

  const icones = ["▣", "◇", "⬡", "✣", "✦", "◎"];

  return disciplinas.map((item, indice) => {
    const presencas = inteiroValido(item.presencas, 0);
    const faltas = inteiroValido(item.faltas, 0);
    const atrasos = inteiroValido(item.atrasos, 0);
    const total = presencas + faltas + atrasos;
    const frequencia = Math.round(numeroValido(item.frequencia, total > 0 ? ((presencas + atrasos) * 100) / total : 0));

    return {
      nome: item.disciplina ?? item.nome ?? "Disciplina",
      icone: icones[indice % icones.length],
      presencas,
      faltas,
      atrasos,
      frequencia,
      presencasPct: total > 0 ? Math.round((presencas * 100) / total) : 0,
      faltasPct: total > 0 ? Math.round((faltas * 100) / total) : 0,
      atrasosPct: total > 0 ? Math.round((atrasos * 100) / total) : 0
    };
  });
}

function registroBioLinha(dataHora, disciplina, professor, status, cor) {
  return `
    <div class="bio-record-line bio-record-line--${escaparHtml(cor)}">
      <span></span>
      <div>
        <small>${escaparHtml(dataHora)}</small>
        <strong>${escaparHtml(disciplina)}</strong>
        <p>${escaparHtml(professor)}</p>
      </div>
      <b>${escaparHtml(status)}</b>
    </div>
  `;
}

function situacaoCurta(frequencia) {
  const valor = numeroValido(frequencia, 0);
  if (valor < 50) return "Crítica";
  if (valor < 75) return "Atenção";
  return "Boa situação";
}

function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || null;
  } catch (erro) {
    console.error("Erro ao ler usuário logado:", erro);
    return null;
  }
}

function textoRisco(risco) {
  const valor = String(risco || "").toLowerCase();

  if (valor === "alto") return "Risco alto";
  if (valor === "medio" || valor === "médio") return "Atenção";
  if (valor === "baixo") return "Regular";

  return "";
}

function mensagemFrequencia(frequencia) {
  const valor = numeroValido(frequencia, 0);

  if (valor < 50) return "Risco alto de frequência";
  if (valor < 75) return "Abaixo do mínimo exigido";
  if (valor === 75) return "Exatamente no limite mínimo";
  return "Acima do mínimo exigido";
}

function textoOrientacao(frequencia) {
  const valor = numeroValido(frequencia, 0);

  if (valor < 50) return "Procure o professor ou a coordenação para regularizar sua situação.";
  if (valor < 75) return "Evite novas faltas e acompanhe seus registros com atenção.";
  if (valor === 75) return "Você está no limite mínimo. Uma nova falta pode deixar sua frequência crítica.";
  return "Continue registrando presença por biometria para manter sua situação regular.";
}

function formatarPercentual(valor) {
  return `${numeroValido(valor, 0).toFixed(1).replace(".0", "")}%`;
}

function formatarAulasAssistidas(dashboard) {
  const assistidas = inteiroValido(dashboard.aulasAssistidas, 0);
  const total = inteiroValido(dashboard.totalAulas, 0);

  if (total <= 0) {
    return String(assistidas);
  }

  return `${assistidas}/${total}`;
}

function numeroValido(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function inteiroValido(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : fallback;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
