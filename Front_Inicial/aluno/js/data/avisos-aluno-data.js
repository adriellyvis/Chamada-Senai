import {
  listarAvisosAluno,
  marcarAvisoAlunoComoLido,
  marcarTodosAvisosAlunoComoLidos
} from "../../../core/avisos-api.js";

let avisosCache = [];
let usuarioCacheId = null;
let carregado = false;

export async function carregarAvisosAluno({ forcar = false } = {}) {
  const usuarioId = obterUsuarioId();

  if (!usuarioId) {
    avisosCache = [];
    carregado = true;
    return [];
  }

  if (!forcar && carregado && String(usuarioCacheId) === String(usuarioId)) {
    return obterAvisosComEstado();
  }

  const resposta = await listarAvisosAluno(usuarioId);
  const lista = Array.isArray(resposta)
    ? resposta
    : Array.isArray(resposta?.avisos)
      ? resposta.avisos
      : [];

  avisosCache = lista
    .map(normalizarAvisoAluno)
    .sort((a, b) => b.timestamp - a.timestamp);

  usuarioCacheId = usuarioId;
  carregado = true;
  emitirAtualizacaoAvisos();

  return obterAvisosComEstado();
}

export function obterAvisosComEstado() {
  return avisosCache.map(aviso => ({ ...aviso }));
}

export function avisoEstaLido(id) {
  return Boolean(avisosCache.find(aviso => String(aviso.id) === String(id))?.lido);
}

export async function marcarAvisoComoLido(id) {
  const aviso = avisosCache.find(item => String(item.id) === String(id));
  if (!aviso || aviso.lido) return;

  aviso.lido = true;
  emitirAtualizacaoAvisos();

  try {
    await marcarAvisoAlunoComoLido(id);
  } catch (erro) {
    aviso.lido = false;
    emitirAtualizacaoAvisos();
    throw erro;
  }
}

export async function marcarTodosAvisosComoLidos() {
  const usuarioId = obterUsuarioId();
  if (!usuarioId) return;

  const anteriores = avisosCache.map(aviso => aviso.lido);
  avisosCache.forEach(aviso => { aviso.lido = true; });
  emitirAtualizacaoAvisos();

  try {
    await marcarTodosAvisosAlunoComoLidos(usuarioId);
  } catch (erro) {
    avisosCache.forEach((aviso, indice) => { aviso.lido = anteriores[indice]; });
    emitirAtualizacaoAvisos();
    throw erro;
  }
}

export function contarAvisosNaoLidos() {
  return avisosCache.filter(aviso => !aviso.lido).length;
}

export function emitirAtualizacaoAvisos() {
  window.dispatchEvent(new CustomEvent("avisos-aluno-atualizados"));
}

function normalizarAvisoAluno(item = {}) {
  const dataOriginal = item.dataCriacao ?? item.criadoEm ?? item.data ?? item.dataEnvio ?? null;
  const origem = normalizarOrigem(item.autorPerfil ?? item.origem ?? item.remetenteTipo ?? item.tipoAutor);
  const categoria = String(item.categoria ?? item.tipo ?? "GERAL").toUpperCase();
  const feedback = origem === "professor" || categoria === "FEEDBACK" || categoria === "ACADEMICO";

  return {
    id: item.id ?? item.avisoId ?? cryptoRandomId(),
    titulo: item.titulo ?? (feedback ? "Feedback acadêmico" : "Aviso"),
    texto: item.mensagem ?? item.texto ?? item.descricao ?? "",
    mensagem: item.mensagem ?? item.texto ?? item.descricao ?? "",
    tipo: feedback ? "professor" : mapearTipoFiltro(origem, categoria),
    categoria,
    tag: item.autorNome ?? item.remetenteNome ?? rotuloOrigem(origem),
    autorNome: item.autorNome ?? item.remetenteNome ?? null,
    autorPerfil: origem,
    prioridade: normalizarPrioridade(item.prioridade),
    lido: Boolean(item.lido ?? item.visualizado ?? false),
    data: formatarDataCurta(dataOriginal),
    dataCompleta: formatarDataCompleta(dataOriginal),
    timestamp: obterTimestamp(dataOriginal),
    frequencia: numeroOuNulo(item.frequencia ?? item.mediaFrequencia ?? item.percentualFrequencia),
    nota: numeroOuNulo(item.nota ?? item.media ?? item.mediaAcademica),
    melhorias: item.melhorias ?? item.possiveisMelhorias ?? item.orientacao ?? "",
    turma: item.turmaNome ?? item.turma ?? null,
    disciplina: item.disciplinaNome ?? item.disciplina ?? null
  };
}

function obterUsuarioId() {
  try {
    return JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario")))?.id ?? null;
  } catch {
    return null;
  }
}

function normalizarOrigem(valor) {
  const texto = String(valor ?? "gestor").toLowerCase();
  if (texto.includes("prof")) return "professor";
  if (texto.includes("gest") || texto.includes("coord") || texto.includes("secret")) return "gestor";
  return texto || "gestor";
}

function mapearTipoFiltro(origem, categoria) {
  if (categoria.includes("FREQU")) return "frequencia";
  if (categoria.includes("ACADEM") || categoria.includes("FEEDBACK")) return "academico";
  if (origem === "professor") return "professor";
  return "gestor";
}

function rotuloOrigem(origem) {
  if (origem === "professor") return "Professor";
  if (origem === "gestor") return "Gestão";
  return "EyeCount";
}

function normalizarPrioridade(valor) {
  const texto = String(valor ?? "NORMAL").toUpperCase();
  return texto === "IMPORTANTE" || texto === "ALTA" || texto === "CRITICA"
    ? "importante"
    : "normal";
}

function numeroOuNulo(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function obterTimestamp(valor) {
  const data = valor ? new Date(valor) : null;
  return data && !Number.isNaN(data.getTime()) ? data.getTime() : 0;
}

function formatarDataCurta(valor) {
  const data = valor ? new Date(valor) : null;
  if (!data || Number.isNaN(data.getTime())) return "AGORA";
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
  return `${dia} ${mes}`;
}

function formatarDataCompleta(valor) {
  const data = valor ? new Date(valor) : null;
  if (!data || Number.isNaN(data.getTime())) return "Data não informada";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function cryptoRandomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `aviso-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
