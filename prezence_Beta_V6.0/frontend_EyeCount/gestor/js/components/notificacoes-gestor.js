import { request } from "../../../core/api.js";
import { obterConfiguracoes } from "../../../core/configuracoes-ui.js";
import {
  contarNaoLidas,
  marcarNotificacaoComoLida,
  marcarNotificacoesComoLidas,
  notificacaoEstaLida
} from "../../../core/notificacoes-lidas.js";

const TEMPO_CACHE_MS = 45_000;
const PERFIL_NOTIFICACOES = "gestor";

let dashboardCache = null;
let cacheAtualizadoEm = 0;
let painelAtual = null;
let botaoAtual = null;
let eventosConfigurados = false;
let intervaloAtualizacaoIndicador = null;

export function configurarNotificacoesGestor() {
  if (eventosConfigurados) return;
  eventosConfigurados = true;

  document.addEventListener("click", tratarCliqueGlobal);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") fecharPainel();
  });
  window.addEventListener("resize", fecharPainel);
  window.addEventListener("scroll", tratarScrollGlobal, true);

  atualizarIndicadorNotificacoesGestor();

  if (!intervaloAtualizacaoIndicador) {
    intervaloAtualizacaoIndicador = setInterval(() => {
      atualizarIndicadorNotificacoesGestor({ forcar: true });
    }, 30000);
  }
}

export function definirDadosNotificacoesGestor(dados = {}) {
  dashboardCache = dados || {};
  cacheAtualizadoEm = Date.now();
  atualizarBadgeVisivel(contarNaoLidas(montarNotificacoes(dashboardCache)));
}

export async function atualizarIndicadorNotificacoesGestor({ forcar = false } = {}) {
  const botao = document.querySelector(".notificacao");
  if (!botao) return;

  prepararBotao(botao);

  if (!notificacoesAtivas()) {
    fecharPainel();
    atualizarBadge(botao, 0);
    botao.disabled = true;
    botao.classList.add("is-disabled");
    botao.setAttribute("aria-label", "Notificações desativadas");
    return;
  }

  botao.disabled = false;
  botao.classList.remove("is-disabled");

  try {
    const dados = await obterDashboard(forcar);
    atualizarBadge(botao, contarNaoLidas(montarNotificacoes(dados)));
  } catch (erro) {
    console.warn("Não foi possível atualizar as notificações do gestor:", erro);
    atualizarBadge(botao, dashboardCache ? contarNaoLidas(montarNotificacoes(dashboardCache)) : 0);
  }
}

async function tratarCliqueGlobal(event) {
  const botao = event.target.closest(".notificacao");

  if (botao) {
    event.preventDefault();
    event.stopPropagation();

    if (!notificacoesAtivas()) return;

    if (painelAtual && botaoAtual === botao) {
      fecharPainel();
      return;
    }

    await abrirPainel(botao);
    return;
  }

  if (painelAtual && !painelAtual.contains(event.target)) fecharPainel();
}

async function abrirPainel(botao) {
  fecharPainel();
  botaoAtual = botao;
  prepararBotao(botao);
  botao.setAttribute("aria-expanded", "true");

  const painel = document.createElement("section");
  painel.className = "notificacoes-gestor-painel";
  painel.id = "painelNotificacoesGestor";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-label", "Central de notificações do gestor");
  painel.innerHTML = montarCarregamento();
  document.body.appendChild(painel);
  painelAtual = painel;
  posicionarPainel(botao, painel);

  try {
    const dados = await obterDashboard(true);
    if (painelAtual !== painel) return;

    const notificacoes = montarNotificacoes(dados);
    renderizarPainel(painel, notificacoes);
  } catch (erro) {
    console.error(erro);
    if (painelAtual !== painel) return;
    painel.innerHTML = `
      <div class="notificacoes-gestor-estado">
        <span class="material-symbols-rounded" aria-hidden="true">cloud_off</span>
        <strong>Não foi possível carregar as notificações.</strong>
        <small>Tente novamente em alguns instantes.</small>
      </div>`;
  }
}

async function obterDashboard(forcar = false) {
  const cacheValido = !forcar && dashboardCache && Date.now() - cacheAtualizadoEm < TEMPO_CACHE_MS;
  if (cacheValido) return dashboardCache;

  dashboardCache = await request("/gestor/dashboard") || {};
  cacheAtualizadoEm = Date.now();
  return dashboardCache;
}

function montarNotificacoes(dados = {}) {
  const preferencias = obterConfiguracoes("gestor");
  const itens = [];

  if (preferencias.notificacoesEvasao) {
    const alertas = Array.isArray(dados.alertasEvasao) ? dados.alertasEvasao : [];
    alertas.forEach(alerta => {
      const frequencia = numeroSeguro(alerta.frequencia ?? alerta.percentualFrequencia);
      const nomeAluno = alerta.nomeAluno ?? alerta.nome ?? "Aluno";
      const alunoId = alerta.alunoId ?? alerta.id ?? alerta.usuarioId ?? nomeAluno;
      const faixaFrequencia = frequencia === null ? "sem-percentual" : Math.round(frequencia);
      itens.push({
        id: `risco:${alunoId}:${faixaFrequencia}`,
        tipo: "risco",
        icone: "person_alert",
        titulo: `${nomeAluno} precisa de atenção`,
        descricao: frequencia === null
          ? "Frequência abaixo do esperado."
          : `Frequência atual: ${frequencia.toFixed(1).replace(".0", "")}%`,
        meta: alerta.turma ?? alerta.nomeTurma ?? "Aluno em risco",
        prioridade: frequencia !== null && frequencia < 60 ? 3 : 2,
        alunoNome: nomeAluno
      });
    });
  }

  if (preferencias.notificacoesOcorrencias) {
    const pendentes = Number(dados.ocorrenciasPendentes) || 0;
    const emAnalise = Number(dados.ocorrenciasEmAnalise) || 0;

    if (pendentes > 0) {
      itens.push({
        id: `ocorrencias:pendentes:${pendentes}`,
        tipo: "ocorrencias",
        icone: "assignment_late",
        titulo: `${pendentes} ocorrência${pendentes === 1 ? "" : "s"} pendente${pendentes === 1 ? "" : "s"}`,
        descricao: "Há registros aguardando análise do gestor.",
        meta: "Ocorrências",
        prioridade: 3
      });
    }

    if (emAnalise > 0) {
      itens.push({
        id: `ocorrencias:analise:${emAnalise}`,
        tipo: "ocorrencias",
        icone: "pending_actions",
        titulo: `${emAnalise} ocorrência${emAnalise === 1 ? "" : "s"} em análise`,
        descricao: "Continue o acompanhamento dos registros em andamento.",
        meta: "Ocorrências",
        prioridade: 2
      });
    }
  }

  if (preferencias.notificacoesAtividades) {
    const atividades = Array.isArray(dados.atividadesRecentes) ? dados.atividadesRecentes : [];
    atividades
      .filter(item => String(item?.tipo || "").toLowerCase() !== "sistema")
      .slice(0, 4)
      .forEach((item, index) => {
        const tipo = String(item.tipo || "atividade").toLowerCase();
        const dataOriginal = item.data ?? item.dataHora ?? item.criadoEm ?? "";
        const assinatura = item.id != null
          ? `atividade:${tipo}:${item.id}`
          : `atividade:${tipo}:${dataOriginal}:${item.titulo || index}`;
        itens.push({
          id: assinatura,
          tipo,
          icone: "history",
          titulo: item.titulo || "Atividade recente",
          descricao: item.descricao || "Novo registro no sistema.",
          meta: formatarData(dataOriginal),
          prioridade: 1
        });
      });
  }

  return itens
    .sort((a, b) => b.prioridade - a.prioridade)
    .map(item => ({
      ...item,
      lida: notificacaoEstaLida(PERFIL_NOTIFICACOES, item.id)
    }));
}

function renderizarPainel(painel, itens) {
  const naoLidas = contarNaoLidas(itens);
  atualizarBadge(botaoAtual, naoLidas);
  painel.innerHTML = montarConteudo(itens, naoLidas);
  configurarAcoes(painel, itens);
}

function montarConteudo(itens, naoLidas) {
  return `
    <header class="notificacoes-gestor-header">
      <div>
        <span>CENTRAL DE ALERTAS</span>
        <h3>Notificações</h3>
      </div>
      <strong title="Não lidas">${naoLidas > 99 ? "99+" : naoLidas}</strong>
    </header>

    <div class="notificacoes-gestor-lista">
      ${itens.length ? itens.map((item, index) => montarItem(item, index)).join("") : montarVazio()}
    </div>

    <footer class="notificacoes-gestor-footer">
      ${naoLidas > 0 ? `
        <button type="button" data-notificacao-marcar-todas>
          <span class="material-symbols-rounded" aria-hidden="true">done_all</span>
          Marcar todas como lidas
        </button>` : ""}
      <button type="button" data-notificacao-atualizar>
        <span class="material-symbols-rounded" aria-hidden="true">refresh</span>
        Atualizar
      </button>
    </footer>`;
}

function montarItem(item, index) {
  return `
    <button class="notificacoes-gestor-item prioridade-${item.prioridade} ${item.lida ? "is-read" : "is-unread"}" type="button" data-notificacao-index="${index}">
      <span class="notificacoes-gestor-icone material-symbols-rounded" aria-hidden="true">${escapeHtml(item.icone)}</span>
      <span class="notificacoes-gestor-copy">
        <strong>${escapeHtml(item.titulo)}</strong>
        <small>${escapeHtml(item.descricao)}</small>
        <span>${escapeHtml(item.meta || "")}</span>
      </span>
      <span class="notificacoes-gestor-final">
        ${item.lida
          ? '<small class="notificacoes-gestor-lida">Lida</small>'
          : '<span class="notificacoes-gestor-ponto" title="Não lida" aria-label="Não lida"></span>'}
        <span class="material-symbols-rounded notificacoes-gestor-seta" aria-hidden="true">chevron_right</span>
      </span>
    </button>`;
}

function montarVazio() {
  return `
    <div class="notificacoes-gestor-estado">
      <span class="material-symbols-rounded" aria-hidden="true">notifications_none</span>
      <strong>Nada exige sua atenção agora.</strong>
      <small>Os novos alertas aparecerão aqui.</small>
    </div>`;
}

function montarCarregamento() {
  return `
    <div class="notificacoes-gestor-estado">
      <span class="notificacoes-gestor-spinner" aria-hidden="true"></span>
      <strong>Carregando notificações...</strong>
    </div>`;
}

function configurarAcoes(painel, itens) {
  painel.querySelectorAll("[data-notificacao-index]").forEach(botao => {
    botao.addEventListener("click", () => {
      const item = itens[Number(botao.dataset.notificacaoIndex)];
      if (!item) return;
      marcarNotificacaoComoLida(PERFIL_NOTIFICACOES, item.id);
      item.lida = true;
      atualizarBadge(botaoAtual, contarNaoLidas(itens));
      navegarParaItem(item);
    });
  });

  painel.querySelector("[data-notificacao-marcar-todas]")?.addEventListener("click", event => {
    event.stopPropagation();
    marcarNotificacoesComoLidas(PERFIL_NOTIFICACOES, itens.map(item => item.id));
    itens.forEach(item => { item.lida = true; });
    renderizarPainel(painel, itens);
  });

  painel.querySelector("[data-notificacao-atualizar]")?.addEventListener("click", async event => {
    event.stopPropagation();
    if (!botaoAtual) return;
    await abrirPainel(botaoAtual);
  });
}

function navegarParaItem(item) {
  fecharPainel();

  if (item.tipo === "risco") {
    if (item.alunoNome) sessionStorage.setItem("gestorUsuarioBuscaPendente", item.alunoNome);
    document.getElementById("menuAlunos")?.click();
    return;
  }

  if (item.tipo === "ocorrencias" || item.tipo === "ocorrencia") {
    document.getElementById("menuOcorrencias")?.click();
    return;
  }

  document.getElementById("menuDashboard")?.click();
}

function prepararBotao(botao) {
  botao.setAttribute("aria-haspopup", "dialog");
  botao.setAttribute("aria-expanded", painelAtual && botaoAtual === botao ? "true" : "false");
  botao.title = "Abrir central de notificações";

  if (!botao.querySelector(".notificacoes-gestor-badge")) {
    botao.insertAdjacentHTML("beforeend", '<span class="notificacoes-gestor-badge" aria-hidden="true"></span>');
  }
}

function atualizarBadgeVisivel(total) {
  const botao = document.querySelector(".notificacao");
  if (!botao) return;
  prepararBotao(botao);
  atualizarBadge(botao, total);
}

function atualizarBadge(botao, total) {
  if (!botao) return;
  const badge = botao.querySelector(".notificacoes-gestor-badge");
  if (!badge) return;
  const quantidade = Number(total) || 0;
  badge.textContent = quantidade > 9 ? "9+" : String(quantidade);
  badge.hidden = quantidade === 0;
  botao.setAttribute("aria-label", quantidade
    ? `${quantidade} notificação${quantidade === 1 ? "" : "ões"} não lida${quantidade === 1 ? "" : "s"}`
    : "Nenhuma notificação não lida");
}

function posicionarPainel(botao, painel) {
  const rect = botao.getBoundingClientRect();
  const largura = Math.min(400, window.innerWidth - 24);
  const esquerda = Math.max(12, Math.min(rect.right - largura, window.innerWidth - largura - 12));
  painel.style.width = `${largura}px`;
  painel.style.left = `${esquerda}px`;
  painel.style.top = `${Math.min(rect.bottom + 10, window.innerHeight - 120)}px`;
}

function tratarScrollGlobal(event) {
  if (!painelAtual || !botaoAtual) return;

  const alvo = event.target;

  // Rolagem dentro da própria central de notificações não deve fechá-la.
  // Isso também mantém o painel aberto ao arrastar/clicar na barra de rolagem.
  if (alvo instanceof Node && painelAtual.contains(alvo)) return;

  // Se a página for rolada com a central aberta, apenas reposiciona o painel
  // em relação ao sino, em vez de interromper a interação do usuário.
  posicionarPainel(botaoAtual, painelAtual);
}

function fecharPainel() {
  painelAtual?.remove();
  botaoAtual?.setAttribute("aria-expanded", "false");
  painelAtual = null;
  botaoAtual = null;
}

function notificacoesAtivas() {
  return Boolean(obterConfiguracoes("gestor").notificacoes);
}

function numeroSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function formatarData(data) {
  if (!data) return "Atividade recente";
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "Atividade recente";
  return valor.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
