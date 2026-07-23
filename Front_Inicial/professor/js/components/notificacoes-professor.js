import { request } from "../../../core/api.js";

const TEMPO_CACHE_MS = 60_000;

let alertasCache = [];
let cacheAtualizadoEm = 0;
let painelAtual = null;
let botaoAtual = null;
let eventosConfigurados = false;

export function configurarNotificacoesProfessor() {
  if (eventosConfigurados) return;
  eventosConfigurados = true;

  document.addEventListener("click", tratarCliqueGlobalNotificacoes);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") fecharPainelNotificacoes();
  });
  window.addEventListener("resize", fecharPainelNotificacoes);
  window.addEventListener("scroll", fecharPainelNotificacoes, true);
}

export function definirDadosNotificacoesProfessor(dados = {}) {
  alertasCache = normalizarListaAlertas(dados.alunosRisco);
  cacheAtualizadoEm = Date.now();
  atualizarBadgeVisivel(alertasCache.length);
}

export async function atualizarIndicadorNotificacoes({ forcar = false } = {}) {
  const botao = document.querySelector(".bell-btn");
  if (!botao) return;

  prepararBotaoNotificacoes(botao);

  try {
    const alertas = await obterAlertasProfessor(forcar);
    atualizarBadge(botao, alertas.length);
  } catch (erro) {
    console.warn("Não foi possível atualizar os alertas do professor:", erro);
    atualizarBadge(botao, alertasCache.length);
  }
}

async function tratarCliqueGlobalNotificacoes(event) {
  const botao = event.target.closest(".bell-btn");

  if (botao) {
    event.preventDefault();
    event.stopPropagation();

    if (painelAtual && botaoAtual === botao) {
      fecharPainelNotificacoes();
      return;
    }

    await abrirPainelNotificacoes(botao);
    return;
  }

  if (painelAtual && !painelAtual.contains(event.target)) {
    fecharPainelNotificacoes();
  }
}

async function abrirPainelNotificacoes(botao) {
  fecharPainelNotificacoes();

  botaoAtual = botao;
  prepararBotaoNotificacoes(botao);
  botao.setAttribute("aria-expanded", "true");

  const painel = document.createElement("section");
  painel.className = "notificacoes-professor-painel";
  painel.id = "painelNotificacoesProfessor";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-label", "Alertas de frequência dos alunos");
  painel.innerHTML = montarCarregamento();

  document.body.appendChild(painel);
  painelAtual = painel;
  posicionarPainel(botao, painel);

  try {
    const alertas = await obterAlertasProfessor();

    if (!painelAtual || painelAtual !== painel) return;

    atualizarBadge(botao, alertas.length);
    painel.innerHTML = montarConteudoPainel(alertas);
    configurarAcoesPainel(painel, alertas);
  } catch (erro) {
    console.error(erro);

    if (!painelAtual || painelAtual !== painel) return;

    painel.innerHTML = `
      <div class="notificacoes-professor-erro">
        <strong>Não foi possível carregar os alertas.</strong>
        <span>Tente novamente em alguns instantes.</span>
      </div>
    `;
  }
}

async function obterAlertasProfessor(forcar = false) {
  const cacheValido =
    !forcar &&
    cacheAtualizadoEm > 0 &&
    Date.now() - cacheAtualizadoEm < TEMPO_CACHE_MS;

  if (cacheValido) return alertasCache;

  const dados = await request("/professor/dashboard");
  alertasCache = normalizarListaAlertas(dados?.alunosRisco);
  cacheAtualizadoEm = Date.now();

  return alertasCache;
}

function normalizarListaAlertas(lista) {
  if (!Array.isArray(lista)) return [];

  return lista
    .map((item) => ({
      alunoId: item.alunoId ?? item.id ?? "",
      nome: item.nomeAluno ?? item.nome ?? "Aluno",
      matricula: item.matricula ?? item.ra ?? "Não informada",
      turma: item.turma ?? item.nomeTurma ?? "Turma não informada",
      frequencia: numeroSeguro(item.frequencia ?? item.percentualFrequencia),
      nivel: String(item.nivelRisco ?? item.nivel ?? "medio").toLowerCase(),
    }))
    .sort((a, b) => prioridadeNivel(b.nivel) - prioridadeNivel(a.nivel));
}

function montarCarregamento() {
  return `
    <div class="notificacoes-professor-carregando" role="status">
      <span class="notificacoes-professor-spinner" aria-hidden="true"></span>
      <span>Carregando alertas...</span>
    </div>
  `;
}

function montarConteudoPainel(alertas) {
  return `
    <header class="notificacoes-professor-header">
      <div>
        <span>ACOMPANHAMENTO</span>
        <h3>Alertas de frequência</h3>
      </div>
      <strong class="notificacoes-professor-total">${alertas.length}</strong>
    </header>

    <div class="notificacoes-professor-lista">
      ${alertas.length ? alertas.map(montarItemAlerta).join("") : montarEstadoVazio()}
    </div>

    <button class="notificacoes-professor-ver-todos" type="button" data-ver-todos-alunos>
      Ver todos os alunos
      <span aria-hidden="true">›</span>
    </button>
  `;
}

function montarItemAlerta(alerta, index) {
  const nivel = classeNivel(alerta.nivel);
  const frequencia = alerta.frequencia === null
    ? "—"
    : `${alerta.frequencia.toFixed(1).replace(".0", "")}%`;

  return `
    <button
      class="notificacoes-professor-item ${nivel}"
      type="button"
      data-alerta-index="${index}"
      aria-label="Abrir aluno ${escapeHtml(alerta.nome)}"
    >
      <span class="notificacoes-professor-avatar">${escapeHtml(gerarIniciais(alerta.nome))}</span>

      <span class="notificacoes-professor-texto">
        <strong>${escapeHtml(alerta.nome)}</strong>
        <small>${escapeHtml(alerta.turma)} • ${escapeHtml(alerta.matricula)}</small>
        <span>${rotuloNivel(alerta.nivel)}</span>
      </span>

      <strong class="notificacoes-professor-frequencia">${frequencia}</strong>
    </button>
  `;
}

function montarEstadoVazio() {
  return `
    <div class="notificacoes-professor-vazio">
      <strong>Nenhum aluno em risco.</strong>
      <span>Não há alertas críticos de frequência neste momento.</span>
    </div>
  `;
}

function configurarAcoesPainel(painel, alertas) {
  painel.querySelectorAll("[data-alerta-index]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const alerta = alertas[Number(botao.dataset.alertaIndex)];
      if (!alerta) return;

      sessionStorage.setItem("professorAlunoBuscaPendente", alerta.nome);
      fecharPainelNotificacoes();
      document.querySelector('[data-page="alunos"]')?.click();
    });
  });

  painel.querySelector("[data-ver-todos-alunos]")?.addEventListener("click", () => {
    sessionStorage.removeItem("professorAlunoBuscaPendente");
    fecharPainelNotificacoes();
    document.querySelector('[data-page="alunos"]')?.click();
  });
}

function prepararBotaoNotificacoes(botao) {
  botao.setAttribute("aria-haspopup", "dialog");
  botao.setAttribute("aria-expanded", painelAtual && botaoAtual === botao ? "true" : "false");
  botao.setAttribute("title", "Alertas de frequência");

  if (!botao.querySelector(".notificacoes-professor-badge")) {
    botao.insertAdjacentHTML(
      "beforeend",
      '<span class="notificacoes-professor-badge" aria-hidden="true"></span>',
    );
  }
}

function atualizarBadgeVisivel(total) {
  const botao = document.querySelector(".bell-btn");
  if (!botao) return;

  prepararBotaoNotificacoes(botao);
  atualizarBadge(botao, total);
}

function atualizarBadge(botao, total) {
  const badge = botao.querySelector(".notificacoes-professor-badge");
  if (!badge) return;

  const quantidade = Number(total) || 0;
  badge.textContent = quantidade > 9 ? "9+" : String(quantidade);
  badge.hidden = quantidade === 0;
  botao.setAttribute(
    "aria-label",
    quantidade
      ? `Notificações: ${quantidade} aluno${quantidade === 1 ? "" : "s"} em risco`
      : "Notificações: nenhum aluno em risco",
  );
}

function posicionarPainel(botao, painel) {
  const rect = botao.getBoundingClientRect();
  const largura = Math.min(370, window.innerWidth - 24);
  const esquerda = Math.max(12, Math.min(rect.right - largura, window.innerWidth - largura - 12));
  const topo = Math.min(rect.bottom + 10, window.innerHeight - 120);

  painel.style.width = `${largura}px`;
  painel.style.left = `${esquerda}px`;
  painel.style.top = `${topo}px`;
}

function fecharPainelNotificacoes() {
  painelAtual?.remove();

  if (botaoAtual) {
    botaoAtual.setAttribute("aria-expanded", "false");
  }

  painelAtual = null;
  botaoAtual = null;
}

function classeNivel(nivel) {
  if (nivel === "alto" || nivel === "critico" || nivel === "crítico") return "alto";
  if (nivel === "baixo") return "baixo";
  return "medio";
}

function rotuloNivel(nivel) {
  const classe = classeNivel(nivel);
  if (classe === "alto") return "Risco alto";
  if (classe === "baixo") return "Acompanhar";
  return "Atenção necessária";
}

function prioridadeNivel(nivel) {
  const classe = classeNivel(nivel);
  if (classe === "alto") return 3;
  if (classe === "medio") return 2;
  return 1;
}

function gerarIniciais(nome) {
  return String(nome || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

function numeroSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
