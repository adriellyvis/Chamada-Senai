import { request } from "../../../core/api.js";
import { obterAvisosComEstado, marcarAvisoComoLido } from "../data/avisos-aluno-data.js";

let navegarCallback = null;
let configurada = false;
let disciplinasCache = [];
let cacheAtualizadoEm = 0;
let temporizador = null;

const TEMPO_CACHE = 30000;

export function configurarBuscaAluno({ navegarPara } = {}) {
  navegarCallback = navegarPara ?? navegarCallback;

  const input = document.getElementById("buscaAlunoInput");
  const resultados = document.getElementById("buscaAlunoResultados");
  if (!input || !resultados || configurada) return;

  configurada = true;

  input.addEventListener("input", () => {
    clearTimeout(temporizador);
    temporizador = window.setTimeout(() => executarBusca(input, resultados), 180);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim()) executarBusca(input, resultados);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      fecharResultados(input, resultados);
      input.value = "";
    }

    if (event.key === "ArrowDown") {
      const primeiro = resultados.querySelector("button[data-busca-tipo]");
      if (primeiro && !resultados.hidden) {
        event.preventDefault();
        primeiro.focus();
      }
    }
  });

  resultados.addEventListener("click", event => {
    const item = event.target.closest("button[data-busca-tipo]");
    if (item) selecionarResultado(item, input, resultados);
  });

  resultados.addEventListener("keydown", event => {
    const itens = [...resultados.querySelectorAll("button[data-busca-tipo]")];
    const indice = itens.indexOf(document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      itens[Math.min(indice + 1, itens.length - 1)]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (indice <= 0) input.focus();
      else itens[indice - 1]?.focus();
    }

    if (event.key === "Escape") {
      fecharResultados(input, resultados);
      input.focus();
    }
  });

  document.addEventListener("click", event => {
    const wrapper = document.querySelector(".busca-aluno-wrapper");
    if (wrapper?.contains(event.target)) return;
    fecharResultados(input, resultados);
  });
}

async function executarBusca(input, resultados) {
  const termoOriginal = input.value.trim();
  const termo = normalizarTexto(termoOriginal);

  if (!termo) {
    fecharResultados(input, resultados);
    return;
  }

  abrirResultados(input, resultados);
  resultados.innerHTML = montarCarregamento();

  try {
    await carregarDisciplinas();

    const disciplinas = disciplinasCache
      .map(item => ({ ...item, pontuacao: pontuar(termo, [item.nome, item.professor]) }))
      .filter(item => item.pontuacao > 0)
      .sort((a, b) => b.pontuacao - a.pontuacao || a.nome.localeCompare(b.nome, "pt-BR"))
      .slice(0, 6);

    const avisos = obterAvisosComEstado()
      .map(item => ({ ...item, pontuacao: pontuar(termo, [item.titulo, item.texto, item.tag, item.tipo]) }))
      .filter(item => item.pontuacao > 0)
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .slice(0, 5);

    if (!disciplinas.length && !avisos.length) {
      resultados.innerHTML = `
        <div class="busca-aluno-estado">
          <strong>Nenhum resultado encontrado.</strong>
          <span>Pesquise por disciplina, professor ou aviso.</span>
        </div>
      `;
      return;
    }

    resultados.innerHTML = `
      ${disciplinas.length ? montarGrupoDisciplinas(disciplinas) : ""}
      ${avisos.length ? montarGrupoAvisos(avisos) : ""}
    `;
  } catch (erro) {
    console.error("Erro na pesquisa do aluno:", erro);
    resultados.innerHTML = `
      <div class="busca-aluno-estado">
        <strong>Não foi possível pesquisar.</strong>
        <span>Verifique a conexão com o servidor.</span>
      </div>
    `;
  }
}

async function carregarDisciplinas() {
  if (Date.now() - cacheAtualizadoEm < TEMPO_CACHE && disciplinasCache.length) return;

  const usuario = obterUsuarioLogado();
  if (!usuario?.id) {
    disciplinasCache = [];
    return;
  }

  const [desempenho, presencas] = await Promise.all([
    request(`/aluno/desempenho-disciplinas/${usuario.id}`).catch(() => []),
    request(`/aluno/presencas/${usuario.id}`).catch(() => [])
  ]);

  const mapa = new Map();

  const adicionar = (nome, professor = "") => {
    const nomeLimpo = String(nome ?? "").trim();
    if (!nomeLimpo) return;
    const chave = normalizarTexto(nomeLimpo);
    const atual = mapa.get(chave) || { nome: nomeLimpo, professor: "" };
    if (!atual.professor && professor) atual.professor = String(professor);
    mapa.set(chave, atual);
  };

  (Array.isArray(desempenho) ? desempenho : []).forEach(item => {
    adicionar(
      item.disciplina ?? item.nomeDisciplina ?? item.unidadeCurricular ?? item.nome,
      item.professor ?? item.nomeProfessor ?? item.docente
    );
  });

  (Array.isArray(presencas) ? presencas : []).forEach(item => {
    adicionar(
      item.disciplina ?? item.nomeDisciplina ?? item.unidadeCurricular,
      item.professor ?? item.nomeProfessor ?? item.docente
    );
  });

  disciplinasCache = [...mapa.values()];
  cacheAtualizadoEm = Date.now();
}

function montarGrupoDisciplinas(disciplinas) {
  return `
    <section class="busca-aluno-grupo">
      <div class="busca-aluno-grupo-titulo"><span>DISCIPLINAS</span><strong>${disciplinas.length}</strong></div>
      ${disciplinas.map(item => `
        <button type="button" data-busca-tipo="disciplina" data-valor="${escaparHtml(item.nome)}">
          <span class="busca-aluno-icone disciplina">D</span>
          <span><strong>${escaparHtml(item.nome)}</strong><small>${escaparHtml(item.professor || "Abrir histórico de frequência")}</small></span>
          <b>›</b>
        </button>
      `).join("")}
    </section>
  `;
}

function montarGrupoAvisos(avisos) {
  return `
    <section class="busca-aluno-grupo">
      <div class="busca-aluno-grupo-titulo"><span>AVISOS</span><strong>${avisos.length}</strong></div>
      ${avisos.map(item => `
        <button type="button" data-busca-tipo="aviso" data-valor="${escaparHtml(item.id)}">
          <span class="busca-aluno-icone aviso">!</span>
          <span><strong>${escaparHtml(item.titulo)}</strong><small>${escaparHtml(`${item.tag} • ${item.data}`)}</small></span>
          <b>›</b>
        </button>
      `).join("")}
    </section>
  `;
}

async function selecionarResultado(item, input, resultados) {
  const tipo = item.dataset.buscaTipo;
  const valor = item.dataset.valor;

  input.value = "";
  fecharResultados(input, resultados);

  if (tipo === "disciplina") {
    sessionStorage.setItem("alunoDisciplinaBuscaPendente", valor);
    await navegar("frequencia");
    return;
  }

  if (tipo === "aviso") {
    marcarAvisoComoLido(valor);
    sessionStorage.setItem("alunoAvisoBuscaPendente", valor);
    await navegar("avisos");
  }
}

function pontuar(termo, campos) {
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

function montarCarregamento() {
  return `<div class="busca-aluno-estado carregando"><span class="busca-aluno-spinner"></span><span>Pesquisando...</span></div>`;
}

function abrirResultados(input, resultados) {
  resultados.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function fecharResultados(input, resultados) {
  resultados.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

async function navegar(pagina) {
  if (typeof navegarCallback === "function") {
    await navegarCallback(pagina);
    return;
  }
  document.querySelector(`.sidebar__item[data-page="${pagina}"]`)?.click();
}

function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || null;
  } catch {
    return null;
  }
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
