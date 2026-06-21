import { request } from "../../../core/api.js";
import { abrirAlunosProfessor } from "./alunos-professor.js";
import { abrirChamadaProfessor } from "./chamada-professor.js";

export async function abrirTurmasProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  conteudo.innerHTML = `
    <section class="page-shell">
      ${montarTopo("GERENCIAMENTO DE TURMAS", "Aqui está o resumo das suas turmas.", "Procurar turma...")}

      <div class="content-area section-center">
        <div class="stats-grid">
          ${cardStat("TURMAS ATIVAS", "statTurmasAtivas", "0", "+ esse semestre", "book-open", "blue")}
          ${cardStat("MÉDIA DE PRESENÇA", "statMediaTurmas", "0%", "meta", "circle-check", "green")}
          ${cardStat("FALTAS CRÍTICAS", "statFaltasTurmas", "0", "Alunos", "triangle-alert", "orange")}
          ${cardStat("CHAMADAS", "statChamadasTurmas", "0", "Aulas", "fingerprint", "purple")}
        </div>

        <div class="filters-row">
          <span class="filter-label">⌁ Filtro:</span>
          <button class="filter-chip active" type="button">Todas</button>
          <button class="filter-chip" type="button">Manhã</button>
          <button class="filter-chip" type="button">Tarde</button>
          <button class="filter-chip" type="button">Noite</button>
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
    setTexto("statTurmasAtivas", (turmas || []).length);
    renderizarTurmas(turmas || []);
  } catch (error) {
    console.error(error);
    lista.innerHTML = `<p class="empty-state">Erro ao carregar turmas.</p>`;
  }
}

function renderizarTurmas(turmas) {
  const lista = document.getElementById("listaTurmas");
  if (!lista) return;

  if (!turmas.length) {
    lista.innerHTML = `<p class="empty-state">Nenhuma turma vinculada ao professor.</p>`;
    return;
  }

  lista.innerHTML = turmas.map(item => {
    const dados = normalizarTurmaProfessor(item);
    const progresso = Math.min(100, Math.round((Number(dados.aulasRealizadas) / Math.max(Number(dados.totalAulas), 1)) * 100)) || 0;

    return `
      <article class="turma-professor-card">
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
    });
  });
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
