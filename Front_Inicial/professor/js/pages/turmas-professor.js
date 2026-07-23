import { request } from "../../../core/api.js";
import { abrirAlunosProfessor } from "./alunos-professor.js";
import { abrirChamadaProfessor } from "./chamada-professor.js";

let turmasProfessorCache = [];
let historicoProfessorCache = null;
let historicoProfessorCacheEm = 0;
const detalhesAulasCache = new Map();
let turmaRelatorioAtual = null;
let periodoRelatorioAtual = "todas";

export async function abrirTurmasProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  conteudo.innerHTML = `
    <section class="page-shell">
      ${montarTopo("GERENCIAMENTO DE TURMAS", "Aqui está o resumo das suas turmas.", "Buscar alunos e turmas...")}

      <div class="content-area section-center turmas-page-content">
        <div class="stats-grid">
          ${cardStat("TURMAS ATIVAS", "statTurmasAtivas", "0", "+ esse semestre", "book-open", "blue")}
          ${cardStat("MÉDIA DE PRESENÇA", "statMediaTurmas", "0%", "meta", "circle-check", "green")}
          ${cardStat("FALTAS CRÍTICAS", "statFaltasTurmas", "0", "Alunos", "triangle-alert", "orange")}
          ${cardStat("CHAMADAS", "statChamadasTurmas", "0", "Aulas", "fingerprint", "purple")}
        </div>

        <div class="filters-row">
          <span class="filter-label">⌁ Filtro:</span>
          <button class="filter-chip active" type="button" data-filtro-turno="todas">Todas</button>
          <button class="filter-chip" type="button" data-filtro-turno="manha">Manhã</button>
          <button class="filter-chip" type="button" data-filtro-turno="tarde">Tarde</button>
          <button class="filter-chip" type="button" data-filtro-turno="noite">Noite</button>
        </div>

        <div class="turmas-layout">
          <div id="listaTurmas" class="turmas-professor-grid">
            <p class="empty-state">Carregando turmas...</p>
          </div>

          <aside class="day-card">
            <h3>CRONOGRAMA DO DIA</h3>
            <p>Suas aulas agendadas para hoje</p>
            <div id="cronogramaDia"><p class="empty-state">Carregando...</p></div>
          </aside>
        </div>
      </div>
    </section>
  `;

  await carregarTurmas();
  configurarFiltrosTurno();
  aplicarBuscaPendenteTurma();
  await carregarResumo();
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

async function carregarResumo() {
  try {
    const data = await request("/professor/dashboard");
    setTexto("statMediaTurmas", `${Number(data?.frequenciaMedia ?? 0).toFixed(1).replace(".0", "")}%`);
    setTexto("statFaltasTurmas", (data?.alunosRisco || []).length || 0);
    setTexto("statChamadasTurmas", data?.aulasRealizadas ?? 0);
    renderizarCronograma(data?.aulasRecentes || []);
  } catch (error) {
    console.error(error);
    renderizarCronograma([]);
  }
}

async function carregarTurmas() {
  const lista = document.getElementById("listaTurmas");
  if (!lista) return;

  try {
    const turmas = await request("/professor/turmas");
    turmasProfessorCache = Array.isArray(turmas) ? turmas : [];
    setTexto("statTurmasAtivas", turmasProfessorCache.length);
    renderizarTurmas(turmasProfessorCache);
  } catch (error) {
    console.error(error);
    lista.innerHTML = `<p class="empty-state">Erro ao carregar turmas.</p>`;
  }
}

function renderizarTurmas(turmas, mensagemVazia = "Nenhuma turma vinculada ao professor.") {
  const lista = document.getElementById("listaTurmas");
  if (!lista) return;

  if (!turmas.length) {
    lista.innerHTML = `<p class="empty-state">${mensagemVazia}</p>`;
    return;
  }

  lista.innerHTML = turmas.map(item => {
    const dados = normalizarTurmaProfessor(item);
    const progresso = Math.min(100, Math.round((Number(dados.aulasRealizadas) / Math.max(Number(dados.totalAulas), 1)) * 100)) || 0;

    return `
      <article class="turma-professor-card" data-turma-id="${dados.turmaId}" data-turma-nome="${dados.nomeTurma}" data-turma-periodo="${normalizarTextoTurma(dados.periodo)}">
        <div class="turma-card-topo">
          <div>
            <span class="turma-label">${dados.sala}</span>
            <h2>${dados.nomeTurma}</h2>
            <p>${dados.disciplina}</p>
          </div>
          <span class="turma-status">${dados.periodo}</span>
        </div>

        <div class="turma-card-info">
          <div><span>Alunos</span><strong>${dados.totalAlunos}</strong></div>
          <div><span>Frequência</span><strong>${dados.frequencia}%</strong></div>
          <div><span>Aulas</span><strong>${dados.aulasRealizadas}/${dados.totalAulas}</strong></div>
        </div>

        <div class="turma-progress-label">
          <span>Progresso do cronograma</span>
          <strong>${progresso}%</strong>
        </div>
        <div class="progress-bar"><div style="width:${progresso}%"></div></div>

        <div class="turma-card-footer">
          <button class="btn-primario" data-acao="chamada" data-turma-disciplina-id="${dados.turmaDisciplinaId}">Fazer Chamada</button>
          <button class="btn-secundario" data-acao="alunos" data-turma-id="${dados.turmaId}">Lista de Alunos</button>
          <button class="btn-secundario" data-acao="relatorio" data-turma-id="${dados.turmaId}">Relatório</button>
        </div>
      </article>
    `;
  }).join("");

  configurarAcoesTurmas();
}

function renderizarCronograma(aulas) {
  const cronograma = document.getElementById("cronogramaDia");
  if (!cronograma) return;

  if (!aulas || !aulas.length) {
    cronograma.innerHTML = `<p class="empty-state">Nenhuma aula para hoje.</p>`;
    return;
  }

  cronograma.innerHTML = aulas.slice(0, 3).map((aula, index) => {
    const horario = obterHorarioAula(aula);
    const periodo = periodoAula(aula, index);

    return `
      <div class="day-item">
        <div class="day-time">
          <span class="day-period">${periodo}</span>
          <span class="day-hour">${horario}</span>
          <i data-lucide="move-right" class="day-time-icon"></i>
        </div>

        <div class="day-info">
          <strong>${aula.turma ?? aula.nomeTurma ?? "Turma"}</strong>
          <small>${aula.disciplina ?? aula.nomeDisciplina ?? "Disciplina"}</small>
        </div>
      </div>
    `;
  }).join("");

  atualizarIcones();
}

function obterHorarioAula(aula) {
  const valor =
    aula.horario ??
    aula.hora ??
    aula.horaInicio ??
    aula.horarioInicio ??
    aula.inicio ??
    aula.dataHoraInicio ??
    aula.dataInicio ??
    "";

  if (!valor) return "--:--";

  if (typeof valor === "string") {
    // Ex: "13:30:00"
    if (/^\d{2}:\d{2}/.test(valor)) {
      return valor.slice(0, 5);
    }

    // Ex: "2026-06-01T13:30:00"
    if (valor.includes("T")) {
      const hora = valor.split("T")[1];
      return hora ? hora.slice(0, 5) : "--:--";
    }

    return valor.slice(0, 5);
  }

  return "--:--";
}

function periodoAula(aula, index = 0) {
  const texto = String(aula.periodo ?? aula.turno ?? "").toLowerCase();

  if (texto.includes("man")) return "MANHÃ";
  if (texto.includes("tar")) return "TARDE";
  if (texto.includes("noi")) return "NOITE";

  const horario = obterHorarioAula(aula);
  const hora = Number(horario.split(":")[0]);

  if (!Number.isNaN(hora)) {
    if (hora < 12) return "MANHÃ";
    if (hora < 18) return "TARDE";
    return "NOITE";
  }

  return index === 2 ? "NOITE" : "TARDE";
}

function normalizarTurmaProfessor(item) {
  const totalAulas = item.totalAulas ?? item.aulasTotais ?? item.aulasPrevistas ?? 40;
  const aulasRealizadas = item.aulasRealizadas ?? item.aulasDadas ?? item.aulas ?? 0;
  return {
    turmaDisciplinaId: item.turmaDisciplinaId ?? item.id ?? "",
    turmaId: item.turmaId ?? item.turma?.id ?? item.id ?? "",
    nomeTurma: item.nomeTurma ?? item.nome ?? item.turma?.nome ?? "Turma sem nome",
    disciplina: item.disciplina ?? item.nomeDisciplina ?? "Disciplina não informada",
    totalAlunos: item.totalAlunos ?? item.quantidadeAlunos ?? 0,
    sala: item.sala || item.laboratorio || "LAB DE INFORMÁTICA",
    periodo: item.periodo ?? item.turno ?? "Tarde",
    frequencia: Number(item.frequencia ?? item.mediaFrequencia ?? item.percentualFrequencia ?? 0).toFixed(1).replace(".0", ""),
    aulasRealizadas,
    totalAulas
  };
}


function configurarFiltrosTurno() {
  const botoes = [...document.querySelectorAll("[data-filtro-turno]")];
  if (!botoes.length) return;

  botoes.forEach(botao => {
    botao.addEventListener("click", () => {
      const turno = botao.dataset.filtroTurno;
      botoes.forEach(item => item.classList.toggle("active", item === botao));

      if (turno === "todas") {
        renderizarTurmas(turmasProfessorCache);
        return;
      }

      const filtradas = turmasProfessorCache.filter(item => {
        const dados = normalizarTurmaProfessor(item);
        return normalizarTurno(dados.periodo) === turno;
      });

      renderizarTurmas(
        filtradas,
        `Nenhuma turma encontrada no período da ${turno === "manha" ? "manhã" : turno}.`
      );
    });
  });
}

function normalizarTurno(valor) {
  const texto = normalizarTextoTurma(valor);
  if (texto.includes("man")) return "manha";
  if (texto.includes("noi")) return "noite";
  return "tarde";
}


function aplicarBuscaPendenteTurma() {
  const valorPendente = sessionStorage.getItem("professorTurmaBuscaPendente");
  if (!valorPendente) return;

  sessionStorage.removeItem("professorTurmaBuscaPendente");

  let busca = {};
  try {
    busca = JSON.parse(valorPendente);
  } catch {
    busca = { nome: valorPendente };
  }

  const cards = [...document.querySelectorAll(".turma-professor-card")];
  const alvo = cards.find(card => {
    const mesmoId = busca.id && String(card.dataset.turmaId) === String(busca.id);
    const mesmoNome = busca.nome && normalizarTextoTurma(card.dataset.turmaNome) === normalizarTextoTurma(busca.nome);
    return mesmoId || mesmoNome;
  });

  if (!alvo) return;

  alvo.classList.add("turma-busca-destaque");
  alvo.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => {
    alvo.classList.remove("turma-busca-destaque");
  }, 4000);
}

function normalizarTextoTurma(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function configurarAcoesTurmas() {
  document.querySelectorAll("[data-acao]").forEach(botao => {
    botao.addEventListener("click", async () => {
      const acao = botao.dataset.acao;
      if (acao === "alunos") {
        await abrirAlunosProfessor(botao.dataset.turmaId);
        ativarMenu("alunos");
      }
      if (acao === "chamada") {
        await abrirChamadaProfessor(botao.dataset.turmaDisciplinaId);
        ativarMenu("chamada");
      }
      if (acao === "relatorio") {
        await abrirRelatorioTurma(botao.dataset.turmaId);
      }
    });
  });
}


async function abrirRelatorioTurma(turmaId) {
  const itemTurma = turmasProfessorCache.find(item => {
    const dados = normalizarTurmaProfessor(item);
    return String(dados.turmaId) === String(turmaId);
  });

  if (!itemTurma) {
    alert("Não foi possível identificar a turma selecionada.");
    return;
  }

  const turmaSelecionada = normalizarTurmaProfessor(itemTurma);

  // Remove um modal anterior antes de definir a turma atual, pois a função
  // de remoção também limpa o estado do relatório.
  removerModalRelatorioTurma();
  turmaRelatorioAtual = turmaSelecionada;
  periodoRelatorioAtual = "todas";

  const overlay = document.createElement("div");
  overlay.className = "relatorio-turma-overlay";
  overlay.id = "modalRelatorioTurma";
  overlay.innerHTML = `
    <section class="relatorio-turma-modal" role="dialog" aria-modal="true" aria-labelledby="tituloRelatorioTurma">
      <header class="relatorio-turma-header">
        <div>
          <span>RELATÓRIO DA TURMA</span>
          <h2 id="tituloRelatorioTurma">${escaparHtmlTurma(turmaRelatorioAtual.nomeTurma)}</h2>
          <p>${escaparHtmlTurma(turmaRelatorioAtual.disciplina)} • ${escaparHtmlTurma(turmaRelatorioAtual.periodo)}</p>
        </div>
        <button class="relatorio-turma-fechar" id="btnFecharRelatorioTurma" type="button" aria-label="Fechar relatório">×</button>
      </header>

      <div class="relatorio-turma-toolbar" aria-label="Período do relatório">
        <span>Período:</span>
        <button type="button" data-periodo-relatorio="semana">Última semana</button>
        <button type="button" data-periodo-relatorio="mes">Último mês</button>
        <button type="button" data-periodo-relatorio="bimestre">Bimestre</button>
        <button type="button" data-periodo-relatorio="todas" class="active">Todas</button>
      </div>

      <div class="relatorio-turma-conteudo" id="conteudoRelatorioTurma">
        ${montarCarregamentoRelatorioTurma()}
      </div>
    </section>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add("relatorio-turma-aberto");

  document.getElementById("btnFecharRelatorioTurma")?.addEventListener("click", removerModalRelatorioTurma);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) removerModalRelatorioTurma();
  });

  overlay.querySelectorAll("[data-periodo-relatorio]").forEach(botao => {
    botao.addEventListener("click", async () => {
      periodoRelatorioAtual = botao.dataset.periodoRelatorio;
      overlay.querySelectorAll("[data-periodo-relatorio]").forEach(item => {
        item.classList.toggle("active", item === botao);
      });
      await atualizarRelatorioTurma();
    });
  });

  document.addEventListener("keydown", fecharRelatorioTurmaComEsc);
  await atualizarRelatorioTurma();
}

async function atualizarRelatorioTurma() {
  const conteudo = document.getElementById("conteudoRelatorioTurma");
  if (!conteudo || !turmaRelatorioAtual) return;

  conteudo.innerHTML = montarCarregamentoRelatorioTurma();

  try {
    const historico = await carregarHistoricoProfessorRelatorio();
    const aulasTurma = filtrarHistoricoDaTurma(historico, turmaRelatorioAtual);
    const aulasPeriodo = filtrarAulasPorPeriodo(aulasTurma, periodoRelatorioAtual);
    const aulasComDetalhes = await Promise.all(
      aulasPeriodo.map(async aula => ({
        ...aula,
        detalhes: await carregarDetalhesAulaRelatorio(aula.id)
      }))
    );

    conteudo.innerHTML = montarConteudoRelatorioTurma(aulasComDetalhes, turmaRelatorioAtual);
    configurarDetalhesRelatorioTurma();
    atualizarIcones();
  } catch (erro) {
    console.error("Erro ao carregar relatório da turma:", erro);
    conteudo.innerHTML = `
      <div class="relatorio-turma-estado erro">
        <strong>Não foi possível carregar o relatório.</strong>
        <span>${escaparHtmlTurma(erro.message || "Verifique a conexão com o servidor.")}</span>
        <button type="button" id="btnTentarRelatorioTurma">Tentar novamente</button>
      </div>
    `;
    document.getElementById("btnTentarRelatorioTurma")?.addEventListener("click", atualizarRelatorioTurma);
  }
}

async function carregarHistoricoProfessorRelatorio() {
  const cacheValido = historicoProfessorCache && Date.now() - historicoProfessorCacheEm < 30000;
  if (cacheValido) return historicoProfessorCache;

  const dados = await request("/professor/historico");
  historicoProfessorCache = Array.isArray(dados) ? dados : [];
  historicoProfessorCacheEm = Date.now();
  return historicoProfessorCache;
}

function filtrarHistoricoDaTurma(historico, turma) {
  return historico
    .filter(aula => {
      const idAulaTurma = aula.turmaId ?? aula.turma?.id;
      if (idAulaTurma !== undefined && idAulaTurma !== null && String(idAulaTurma) === String(turma.turmaId)) {
        return true;
      }

      const nomeAula = aula.turma ?? aula.nomeTurma ?? aula.turma?.nome ?? "";
      return normalizarTextoTurma(nomeAula) === normalizarTextoTurma(turma.nomeTurma);
    })
    .sort((a, b) => obterDataAula(b).getTime() - obterDataAula(a).getTime());
}

function filtrarAulasPorPeriodo(aulas, periodo) {
  if (periodo === "todas") return aulas;

  const agora = new Date();
  agora.setHours(23, 59, 59, 999);
  let inicio = new Date(agora);

  if (periodo === "semana") {
    inicio.setDate(inicio.getDate() - 7);
  } else if (periodo === "mes") {
    inicio.setDate(inicio.getDate() - 30);
  } else if (periodo === "bimestre") {
    const mesInicial = Math.floor(agora.getMonth() / 2) * 2;
    inicio = new Date(agora.getFullYear(), mesInicial, 1, 0, 0, 0, 0);
  }

  return aulas.filter(aula => {
    const data = obterDataAula(aula);
    return !Number.isNaN(data.getTime()) && data >= inicio && data <= agora;
  });
}

async function carregarDetalhesAulaRelatorio(aulaId) {
  const chave = String(aulaId);
  if (detalhesAulasCache.has(chave)) return detalhesAulasCache.get(chave);

  try {
    const resposta = await request(`/professor/aula/${aulaId}/detalhes`);
    const detalhes = normalizarDetalhesAulaRelatorio(resposta);
    detalhesAulasCache.set(chave, detalhes);
    return detalhes;
  } catch (erro) {
    console.error(`Erro nos detalhes da aula ${aulaId}:`, erro);
    const detalhes = [];
    detalhesAulasCache.set(chave, detalhes);
    return detalhes;
  }
}

function normalizarDetalhesAulaRelatorio(resposta) {
  const lista = resposta?.alunos ?? resposta?.presencas ?? resposta ?? [];
  if (!Array.isArray(lista)) return [];

  const unicos = new Map();

  lista.forEach(item => {
    const alunoId = item.alunoId ?? item.aluno?.id ?? item.id ?? "";
    const nome = item.nomeAluno ?? item.nome ?? item.aluno?.usuario?.nome ?? item.aluno?.nome ?? "Aluno";
    const chave = String(alunoId || nome);

    unicos.set(chave, {
      alunoId,
      nome,
      matricula: item.matricula ?? item.ra ?? item.aluno?.matricula ?? "—",
      status: normalizarStatusRelatorio(item.status ?? item.presencaStatus ?? item.situacao),
      metodo: normalizarMetodoRelatorio(item.metodo ?? item.tipoRegistro ?? item.registro),
      horario: item.horarioRegistro ?? item.horaRegistro ?? item.horario ?? null
    });
  });

  return [...unicos.values()];
}

function montarConteudoRelatorioTurma(aulas, turma) {
  const resumo = calcularResumoRelatorioTurma(aulas, turma);
  const periodoTexto = obterTextoPeriodoRelatorio(periodoRelatorioAtual);

  return `
    <section class="relatorio-turma-resumo">
      ${cardResumoRelatorio("Alunos", resumo.totalAlunos, "Matriculados", "users-round")}
      ${cardResumoRelatorio("Frequência", `${resumo.frequencia}%`, periodoTexto, "chart-no-axes-column-increasing")}
      ${cardResumoRelatorio("Aulas", resumo.aulas, "Chamadas registradas", "calendar-days")}
      ${cardResumoRelatorio("Presentes", resumo.presentes, "Registros", "user-round-check")}
      ${cardResumoRelatorio("Ausentes", resumo.ausentes, "Registros", "user-round-x")}
      ${cardResumoRelatorio("Atrasados", resumo.atrasados, "Registros", "clock-3")}
      ${cardResumoRelatorio("Biometria", resumo.biometria, "Confirmações", "scan-face")}
      ${cardResumoRelatorio("Manual", resumo.manual, "Confirmações", "hand")}
    </section>

    <section class="relatorio-turma-historico">
      <div class="relatorio-turma-historico-topo">
        <div>
          <h3>Chamadas da turma</h3>
          <p>${escaparHtmlTurma(periodoTexto)} • ${aulas.length} ${aulas.length === 1 ? "aula encontrada" : "aulas encontradas"}</p>
        </div>
      </div>

      <div class="relatorio-turma-aulas">
        ${aulas.length
          ? aulas.map(aula => montarAulaRelatorioTurma(aula)).join("")
          : `<div class="relatorio-turma-estado"><strong>Nenhuma chamada encontrada.</strong><span>Não há aulas dessa turma no período selecionado.</span></div>`}
      </div>
    </section>
  `;
}

function cardResumoRelatorio(titulo, valor, legenda, icone) {
  return `
    <article class="relatorio-turma-stat">
      <span class="relatorio-turma-stat-icone"><i data-lucide="${icone}"></i></span>
      <div>
        <small>${escaparHtmlTurma(titulo)}</small>
        <strong>${escaparHtmlTurma(valor)}</strong>
        <span>${escaparHtmlTurma(legenda)}</span>
      </div>
    </article>
  `;
}

function montarAulaRelatorioTurma(aula) {
  const resumo = calcularResumoDetalhes(aula.detalhes);
  const status = formatarStatusRelatorioAula(aula.status);
  const statusClasse = normalizarTextoTurma(aula.status || "encerrada").replaceAll("_", "-");
  const horario = `${formatarHoraRelatorio(aula.horaInicio)}–${formatarHoraRelatorio(aula.horaFim)}`;

  return `
    <article class="relatorio-turma-aula">
      <button class="relatorio-turma-aula-resumo" type="button" data-abrir-detalhes-turma="${escaparHtmlTurma(aula.id)}" aria-expanded="false">
        <span class="relatorio-turma-aula-id">#${escaparHtmlTurma(aula.id)}</span>
        <span class="relatorio-turma-aula-identificacao">
          <strong>${formatarDataRelatorio(aula.data)}</strong>
          <small>${horario} • ${status}</small>
        </span>
        <span class="relatorio-turma-aula-numeros">
          <span><b>${resumo.presentes}</b> presentes</span>
          <span><b>${resumo.ausentes}</b> ausentes</span>
          <span><b>${resumo.atrasados}</b> atrasados</span>
          <span><b>${resumo.biometria}</b> biometria</span>
          <span><b>${resumo.manual}</b> manual</span>
        </span>
        <span class="relatorio-turma-status ${statusClasse}">${status}</span>
        <i data-lucide="chevron-down" class="relatorio-turma-chevron"></i>
      </button>

      <div class="relatorio-turma-detalhes" data-detalhes-aula-turma="${escaparHtmlTurma(aula.id)}" hidden>
        ${montarAlunosDetalhesRelatorio(aula.detalhes)}
      </div>
    </article>
  `;
}

function montarAlunosDetalhesRelatorio(detalhes) {
  if (!detalhes.length) {
    return `<div class="relatorio-turma-sem-registros">Nenhum registro de aluno encontrado para esta aula.</div>`;
  }

  return `
    <div class="relatorio-turma-alunos-cabecalho">
      <span>Aluno</span><span>Status</span><span>Método</span><span>Horário</span>
    </div>
    ${detalhes.map(item => {
      const confirmado = item.status === "presente" || item.status === "atrasado";
      return `
        <div class="relatorio-turma-aluno-linha">
          <span class="relatorio-turma-aluno-info">
            <b>${escaparHtmlTurma(obterIniciaisRelatorio(item.nome))}</b>
            <span><strong>${escaparHtmlTurma(item.nome)}</strong><small>${escaparHtmlTurma(item.matricula)}</small></span>
          </span>
          <span class="relatorio-turma-presenca status-${item.status}">${formatarStatusPresencaRelatorio(item.status)}</span>
          <span>${confirmado ? formatarMetodoRelatorio(item.metodo) : "—"}</span>
          <span>${item.horario ? formatarHoraRelatorio(item.horario) : "—"}</span>
        </div>
      `;
    }).join("")}
  `;
}

function configurarDetalhesRelatorioTurma() {
  document.querySelectorAll("[data-abrir-detalhes-turma]").forEach(botao => {
    botao.addEventListener("click", () => {
      const aulaId = botao.dataset.abrirDetalhesTurma;
      const detalhes = document.querySelector(`[data-detalhes-aula-turma="${cssEscapeTurma(aulaId)}"]`);
      if (!detalhes) return;

      const abrir = detalhes.hidden;
      detalhes.hidden = !abrir;
      botao.setAttribute("aria-expanded", String(abrir));
      botao.closest(".relatorio-turma-aula")?.classList.toggle("is-open", abrir);
    });
  });
}

function calcularResumoRelatorioTurma(aulas, turma) {
  const acumulado = aulas.reduce((total, aula) => {
    const resumo = calcularResumoDetalhes(aula.detalhes);
    total.presentes += resumo.presentes;
    total.ausentes += resumo.ausentes;
    total.atrasados += resumo.atrasados;
    total.biometria += resumo.biometria;
    total.manual += resumo.manual;
    return total;
  }, { presentes: 0, ausentes: 0, atrasados: 0, biometria: 0, manual: 0 });

  const totalRegistros = acumulado.presentes + acumulado.ausentes + acumulado.atrasados;
  const frequencia = totalRegistros > 0
    ? ((acumulado.presentes + acumulado.atrasados) / totalRegistros) * 100
    : Number(turma.frequencia ?? 0);

  const maiorLista = aulas.reduce((maior, aula) => Math.max(maior, aula.detalhes.length), 0);

  return {
    totalAlunos: Number(turma.totalAlunos) || maiorLista,
    aulas: aulas.length,
    frequencia: Number(frequencia || 0).toFixed(1).replace(".0", ""),
    ...acumulado
  };
}

function calcularResumoDetalhes(detalhes) {
  return detalhes.reduce((total, item) => {
    if (item.status === "presente" || item.status === "saida_temporaria") total.presentes += 1;
    else if (item.status === "atrasado") total.atrasados += 1;
    else if (item.status === "ausente") total.ausentes += 1;

    const confirmado = item.status === "presente" || item.status === "atrasado" || item.status === "saida_temporaria";
    if (confirmado && item.metodo === "biometria") total.biometria += 1;
    if (confirmado && item.metodo === "manual") total.manual += 1;
    return total;
  }, { presentes: 0, ausentes: 0, atrasados: 0, biometria: 0, manual: 0 });
}

function normalizarStatusRelatorio(valor) {
  const status = normalizarTextoTurma(valor).replaceAll(" ", "_");
  if (status.includes("atras")) return "atrasado";
  if (status.includes("ausen") || status.includes("falta")) return "ausente";
  if (status.includes("saida")) return "saida_temporaria";
  if (status.includes("presen")) return "presente";
  return "nao_registrado";
}

function normalizarMetodoRelatorio(valor) {
  const metodo = normalizarTextoTurma(valor);
  if (metodo.includes("bio")) return "biometria";
  if (metodo.includes("manual")) return "manual";
  return "sem_registro";
}

function formatarMetodoRelatorio(valor) {
  if (valor === "biometria") return "Biometria";
  if (valor === "manual") return "Manual";
  return "Sem registro";
}

function formatarStatusPresencaRelatorio(valor) {
  const mapa = {
    presente: "Presente",
    ausente: "Ausente",
    atrasado: "Atrasado",
    saida_temporaria: "Saída temporária",
    nao_registrado: "Não registrado"
  };
  return mapa[valor] ?? "Não registrado";
}

function formatarStatusRelatorioAula(valor) {
  const status = normalizarTextoTurma(valor).replaceAll("_", " ");
  if (status.includes("andamento") || status.includes("aberta")) return "Em andamento";
  if (status.includes("cancel")) return "Cancelada";
  return "Encerrada";
}

function obterDataAula(aula) {
  const valor = aula.data ?? aula.dataAula ?? aula.dataInicio ?? aula.dataHoraInicio;
  if (!valor) return new Date(0);
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return new Date(`${valor}T12:00:00`);
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? new Date(0) : data;
}

function formatarDataRelatorio(valor) {
  const data = obterDataAula({ data: valor });
  if (data.getTime() === 0) return "Data não informada";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarHoraRelatorio(valor) {
  if (!valor) return "—";
  const texto = String(valor);
  if (texto.includes("T")) return texto.split("T")[1]?.slice(0, 5) || "—";
  return texto.slice(0, 5);
}

function obterTextoPeriodoRelatorio(periodo) {
  const mapa = {
    semana: "Última semana",
    mes: "Último mês",
    bimestre: "Bimestre atual",
    todas: "Todo o histórico"
  };
  return mapa[periodo] ?? "Último mês";
}

function montarCarregamentoRelatorioTurma() {
  return `
    <div class="relatorio-turma-estado carregando">
      <span class="relatorio-turma-spinner"></span>
      <strong>Montando relatório...</strong>
      <span>Buscando chamadas e registros dos alunos.</span>
    </div>
  `;
}

function obterIniciaisRelatorio(nome) {
  return String(nome ?? "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join("") || "A";
}

function removerModalRelatorioTurma() {
  document.getElementById("modalRelatorioTurma")?.remove();
  document.body.classList.remove("relatorio-turma-aberto");
  document.removeEventListener("keydown", fecharRelatorioTurmaComEsc);
  turmaRelatorioAtual = null;
}

function fecharRelatorioTurmaComEsc(event) {
  if (event.key === "Escape") removerModalRelatorioTurma();
}

function cssEscapeTurma(valor) {
  if (window.CSS?.escape) return CSS.escape(String(valor));
  return String(valor).replace(/["\\]/g, "\\$&");
}

function escaparHtmlTurma(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ativarMenu(pagina) {
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  document.querySelector(`[data-page="${pagina}"]`)?.classList.add("active");
}

function setTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function atualizarIcones() {
  if (window.lucide) {
    lucide.createIcons();
  }
}
