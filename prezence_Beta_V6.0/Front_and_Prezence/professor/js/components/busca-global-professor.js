import { request } from "../../../core/api.js";

const TEMPO_CACHE_MS = 90_000;
const LIMITE_POR_TIPO = 5;

let alunosCache = [];
let turmasCache = [];
let cacheAtualizadoEm = 0;
let carregamentoAtual = null;
let navegarCallback = null;
let eventosGlobaisConfigurados = false;

export function configurarBuscaGlobalProfessor({ navegarPara } = {}) {
  if (typeof navegarPara === "function") {
    navegarCallback = navegarPara;
  }

  const container = document.querySelector(".page-topbar .busca-global-professor");
  const input = container?.querySelector(".busca-global-professor-input");

  if (!container || !input || input.dataset.buscaGlobalConfigurada === "true") {
    return;
  }

  input.dataset.buscaGlobalConfigurada = "true";
  input.placeholder = "Buscar alunos e turmas...";
  input.autocomplete = "off";
  input.setAttribute("aria-label", "Buscar alunos e turmas");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");

  const resultados = document.createElement("div");
  resultados.className = "busca-global-professor-resultados";
  resultados.hidden = true;
  resultados.setAttribute("role", "listbox");
  container.appendChild(resultados);

  input.addEventListener("focus", () => {
    if (input.value.trim()) executarBusca(input, resultados);
  });

  input.addEventListener("input", () => executarBusca(input, resultados));

  input.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      fecharResultados(input, resultados);
      input.blur();
      return;
    }

    if (event.key === "ArrowDown" && !resultados.hidden) {
      event.preventDefault();
      resultados.querySelector("button[data-tipo]")?.focus();
    }
  });

  resultados.addEventListener("click", event => {
    const botao = event.target.closest("button[data-tipo]");
    if (!botao) return;

    selecionarResultado(botao, input, resultados);
  });

  resultados.addEventListener("keydown", event => {
    const botoes = [...resultados.querySelectorAll("button[data-tipo]")];
    const indiceAtual = botoes.indexOf(document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      botoes[Math.min(indiceAtual + 1, botoes.length - 1)]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (indiceAtual <= 0) input.focus();
      else botoes[indiceAtual - 1]?.focus();
    }

    if (event.key === "Escape") {
      fecharResultados(input, resultados);
      input.focus();
    }
  });

  configurarEventosGlobais();
}

async function executarBusca(input, resultados) {
  const termo = normalizarTexto(input.value);

  if (!termo) {
    fecharResultados(input, resultados);
    return;
  }

  abrirResultados(input, resultados);
  resultados.innerHTML = montarCarregamento();

  try {
    await carregarDadosBusca();

    if (normalizarTexto(input.value) !== termo) return;

    const alunos = pesquisarAlunos(termo).slice(0, LIMITE_POR_TIPO);
    const turmas = pesquisarTurmas(termo).slice(0, LIMITE_POR_TIPO);

    resultados.innerHTML = montarResultados(alunos, turmas, input.value.trim());
    atualizarIcones();
  } catch (erro) {
    console.error("Erro na busca global do professor:", erro);
    resultados.innerHTML = `
      <div class="busca-global-professor-estado">
        <strong>Não foi possível pesquisar.</strong>
        <span>Verifique a conexão com o servidor.</span>
      </div>
    `;
  }
}

async function carregarDadosBusca() {
  const cacheValido =
    cacheAtualizadoEm > 0 &&
    Date.now() - cacheAtualizadoEm < TEMPO_CACHE_MS;

  if (cacheValido) return;
  if (carregamentoAtual) return carregamentoAtual;

  carregamentoAtual = Promise.all([
    request("/professor/alunos"),
    request("/professor/turmas")
  ])
    .then(([alunos, turmas]) => {
      alunosCache = normalizarAlunos(alunos);
      turmasCache = normalizarTurmas(turmas);
      cacheAtualizadoEm = Date.now();
    })
    .finally(() => {
      carregamentoAtual = null;
    });

  return carregamentoAtual;
}

function normalizarAlunos(lista) {
  if (!Array.isArray(lista)) return [];

  return lista.map(item => {
    const usuario = item.usuario && typeof item.usuario === "object"
      ? item.usuario
      : item;

    const turmaObjeto = item.turma && typeof item.turma === "object"
      ? item.turma
      : null;

    return {
      id: item.id ?? item.alunoId ?? "",
      nome: usuario.nome ?? item.nomeAluno ?? item.nome ?? "Aluno",
      matricula: item.matricula ?? item.ra ?? item.registroAcademico ?? "",
      email: usuario.email ?? item.email ?? "",
      turma: turmaObjeto?.nome ?? item.nomeTurma ?? (typeof item.turma === "string" ? item.turma : "")
    };
  });
}

function normalizarTurmas(lista) {
  if (!Array.isArray(lista)) return [];

  return lista.map(item => ({
    id: item.turmaId ?? item.turma?.id ?? item.id ?? "",
    turmaDisciplinaId: item.turmaDisciplinaId ?? item.id ?? "",
    nome: item.nomeTurma ?? item.turma?.nome ?? item.nome ?? "Turma",
    disciplina: item.disciplina ?? item.nomeDisciplina ?? "",
    periodo: item.periodo ?? item.turno ?? "",
    sala: item.sala ?? item.laboratorio ?? ""
  }));
}

function pesquisarAlunos(termo) {
  return alunosCache
    .map(aluno => ({
      ...aluno,
      pontuacao: calcularPontuacao(termo, [
        aluno.nome,
        aluno.matricula,
        aluno.turma,
        aluno.email
      ])
    }))
    .filter(aluno => aluno.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao || a.nome.localeCompare(b.nome, "pt-BR"));
}

function pesquisarTurmas(termo) {
  return turmasCache
    .map(turma => ({
      ...turma,
      pontuacao: calcularPontuacao(termo, [
        turma.nome,
        turma.disciplina,
        turma.periodo,
        turma.sala
      ])
    }))
    .filter(turma => turma.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao || a.nome.localeCompare(b.nome, "pt-BR"));
}

function calcularPontuacao(termo, campos) {
  let melhor = 0;

  campos.forEach(campo => {
    const valor = normalizarTexto(campo);
    if (!valor) return;

    if (valor === termo) melhor = Math.max(melhor, 100);
    else if (valor.startsWith(termo)) melhor = Math.max(melhor, 70);
    else if (valor.includes(termo)) melhor = Math.max(melhor, 40);
  });

  return melhor;
}

function montarResultados(alunos, turmas, termoOriginal) {
  if (!alunos.length && !turmas.length) {
    return `
      <div class="busca-global-professor-estado">
        <strong>Nenhum resultado encontrado.</strong>
        <span>Não encontramos alunos ou turmas para “${escapeHtml(termoOriginal)}”.</span>
      </div>
    `;
  }

  return `
    ${alunos.length ? montarGrupoAlunos(alunos) : ""}
    ${turmas.length ? montarGrupoTurmas(turmas) : ""}
  `;
}

function montarGrupoAlunos(alunos) {
  return `
    <section class="busca-global-professor-grupo" aria-label="Alunos encontrados">
      <div class="busca-global-professor-grupo-titulo">
        <span>ALUNOS</span>
        <strong>${alunos.length}</strong>
      </div>
      ${alunos.map(aluno => `
        <button
          class="busca-global-professor-item"
          type="button"
          role="option"
          data-tipo="aluno"
          data-id="${escapeHtml(aluno.id)}"
          data-nome="${escapeHtml(aluno.nome)}"
        >
          <span class="busca-global-professor-avatar aluno">${escapeHtml(obterIniciais(aluno.nome))}</span>
          <span class="busca-global-professor-item-texto">
            <strong>${escapeHtml(aluno.nome)}</strong>
            <small>${escapeHtml([aluno.turma, aluno.matricula].filter(Boolean).join(" • ") || "Aluno")}</small>
          </span>
          <span class="busca-global-professor-seta" aria-hidden="true">›</span>
        </button>
      `).join("")}
    </section>
  `;
}

function montarGrupoTurmas(turmas) {
  return `
    <section class="busca-global-professor-grupo" aria-label="Turmas encontradas">
      <div class="busca-global-professor-grupo-titulo">
        <span>TURMAS</span>
        <strong>${turmas.length}</strong>
      </div>
      ${turmas.map(turma => `
        <button
          class="busca-global-professor-item"
          type="button"
          role="option"
          data-tipo="turma"
          data-id="${escapeHtml(turma.id)}"
          data-nome="${escapeHtml(turma.nome)}"
        >
          <span class="busca-global-professor-avatar turma"><i data-lucide="school"></i></span>
          <span class="busca-global-professor-item-texto">
            <strong>${escapeHtml(turma.nome)}</strong>
            <small>${escapeHtml([turma.disciplina, turma.periodo].filter(Boolean).join(" • ") || "Turma")}</small>
          </span>
          <span class="busca-global-professor-seta" aria-hidden="true">›</span>
        </button>
      `).join("")}
    </section>
  `;
}

async function selecionarResultado(botao, input, resultados) {
  const tipo = botao.dataset.tipo;
  const id = botao.dataset.id ?? "";
  const nome = botao.dataset.nome ?? "";

  fecharResultados(input, resultados);
  input.value = "";

  if (tipo === "aluno") {
    sessionStorage.setItem("professorAlunoBuscaPendente", nome);
    await navegar("alunos");
    return;
  }

  if (tipo === "turma") {
    sessionStorage.setItem(
      "professorTurmaBuscaPendente",
      JSON.stringify({ id, nome })
    );
    await navegar("turmas");
  }
}

async function navegar(pagina) {
  if (typeof navegarCallback === "function") {
    await navegarCallback(pagina);
    return;
  }

  document.querySelector(`[data-page="${pagina}"]`)?.click();
}

function montarCarregamento() {
  return `
    <div class="busca-global-professor-estado carregando">
      <span class="busca-global-professor-spinner" aria-hidden="true"></span>
      <span>Pesquisando alunos e turmas...</span>
    </div>
  `;
}

function abrirResultados(input, resultados) {
  resultados.hidden = false;
  input.setAttribute("aria-expanded", "true");
  atualizarIcones();
}

function fecharResultados(input, resultados) {
  resultados.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

function configurarEventosGlobais() {
  if (eventosGlobaisConfigurados) return;
  eventosGlobaisConfigurados = true;

  document.addEventListener("focusin", event => {
    if (!event.target.matches?.(".busca-global-professor-input")) return;
    configurarBuscaGlobalProfessor({ navegarPara: navegarCallback });
  });

  document.addEventListener("click", event => {
    const busca = document.querySelector(".page-topbar .busca-global-professor");
    if (!busca || busca.contains(event.target)) return;

    const input = busca.querySelector(".busca-global-professor-input");
    const resultados = busca.querySelector(".busca-global-professor-resultados");
    if (input && resultados) fecharResultados(input, resultados);
  });
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterIniciais(nome) {
  return String(nome || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join("");
}

function atualizarIcones() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
