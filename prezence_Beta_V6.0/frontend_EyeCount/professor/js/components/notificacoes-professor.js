import { request } from "../../../core/api.js";
import { buscarConfirmacoesBiometricasPendentes } from "../api/confirmacoes-biometricas-api.js";
import { obterConfiguracoes } from "../../../core/configuracoes-ui.js";
import {
  contarNaoLidas,
  marcarNotificacaoComoLida,
  marcarNotificacoesComoLidas,
  notificacaoEstaLida
} from "../../../core/notificacoes-lidas.js";

const TEMPO_CACHE_MS = 45_000;
const PERFIL_NOTIFICACOES = "professor";

let dashboardCache = null;
let chamadaCache = null;
let biometriasPendentesCache = [];
let intervaloAtualizacaoIndicador = null;
let cacheAtualizadoEm = 0;
let painelAtual = null;
let botaoAtual = null;
let eventosConfigurados = false;

export function configurarNotificacoesProfessor() {
  if (eventosConfigurados) return;
  eventosConfigurados = true;

  document.addEventListener("click", tratarCliqueGlobal);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") fecharPainel();
  });
  window.addEventListener("resize", fecharPainel);
  window.addEventListener("scroll", tratarScrollGlobal, true);
  window.addEventListener("eyecount:biometria-professor-atualizada", () => {
    cacheAtualizadoEm = 0;
    atualizarIndicadorNotificacoes({ forcar: true });
  });

  if (!intervaloAtualizacaoIndicador) {
    intervaloAtualizacaoIndicador = setInterval(() => {
      atualizarIndicadorNotificacoes({ forcar: true });
    }, 15000);
  }
}

export function definirDadosNotificacoesProfessor(dados = {}) {
  dashboardCache = dados || {};
  const itens = montarNotificacoes(dashboardCache, chamadaCache, biometriasPendentesCache);
  atualizarBadgeVisivel(contarNaoLidas(itens));
}

export async function atualizarIndicadorNotificacoes({ forcar = false } = {}) {
  const botao = document.querySelector(".bell-btn");
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
    const { dashboard, chamada, biometriasPendentes } = await obterDados(forcar);
    const itens = montarNotificacoes(dashboard, chamada, biometriasPendentes);
    atualizarBadge(botao, contarNaoLidas(itens));
  } catch (erro) {
    console.warn("Não foi possível atualizar as notificações do professor:", erro);
    const itens = montarNotificacoes(dashboardCache || {}, chamadaCache, biometriasPendentesCache);
    atualizarBadge(botao, contarNaoLidas(itens));
  }
}

async function tratarCliqueGlobal(event) {
  const botao = event.target.closest(".bell-btn");
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
  painel.className = "notificacoes-professor-painel";
  painel.id = "painelNotificacoesProfessor";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-label", "Central de notificações do professor");
  painel.innerHTML = montarCarregamento();
  document.body.appendChild(painel);
  painelAtual = painel;
  posicionarPainel(botao, painel);

  try {
    const { dashboard, chamada, biometriasPendentes } = await obterDados(true);
    if (painelAtual !== painel) return;
    const itens = montarNotificacoes(dashboard, chamada, biometriasPendentes);
    renderizarPainel(painel, itens);
  } catch (erro) {
    console.error(erro);
    if (painelAtual !== painel) return;
    painel.innerHTML = `
      <div class="notificacoes-professor-erro">
        <strong>Não foi possível carregar as notificações.</strong>
        <span>Tente novamente em alguns instantes.</span>
      </div>`;
  }
}

async function obterDados(forcar = false) {
  const cacheValido = !forcar && dashboardCache && Date.now() - cacheAtualizadoEm < TEMPO_CACHE_MS;
  if (cacheValido) {
    return {
      dashboard: dashboardCache,
      chamada: chamadaCache,
      biometriasPendentes: biometriasPendentesCache
    };
  }

  const [dashboard, chamada, biometriasPendentes] = await Promise.all([
    request("/professor/dashboard"),
    request("/professor/chamada-aberta").catch(() => null),
    buscarConfirmacoesBiometricasPendentes().catch(() => [])
  ]);

  dashboardCache = dashboard || {};
  chamadaCache = chamada || null;
  biometriasPendentesCache = Array.isArray(biometriasPendentes) ? biometriasPendentes : [];
  cacheAtualizadoEm = Date.now();

  return {
    dashboard: dashboardCache,
    chamada: chamadaCache,
    biometriasPendentes: biometriasPendentesCache
  };
}

function montarNotificacoes(dashboard = {}, chamada = null, biometriasPendentes = []) {
  const preferencias = obterConfiguracoes("professor");
  const itens = [];

  if (preferencias.notificacoesBiometria !== false) {
    (biometriasPendentes || []).forEach(solicitacao => {
      const nomeAluno = solicitacao.nomeAluno ?? solicitacao.alunoNome ?? solicitacao.aluno?.usuario?.nome ?? "Aluno";
      const aulaId = Number(solicitacao.aulaId ?? solicitacao.aula?.id) || null;
      const solicitacaoId = solicitacao.id ?? solicitacao.solicitacaoId ?? null;
      const alunoId = solicitacao.alunoId ?? solicitacao.aluno?.id ?? nomeAluno;
      const horarioOriginal = solicitacao.horarioSolicitacao ?? solicitacao.horarioBiometria ?? solicitacao.dataCriacao ?? solicitacao.criadoEm;
      const horario = formatarHorarioBiometria(horarioOriginal);
      const assinatura = `biometria:${solicitacaoId ?? `${aulaId ?? "aula"}:${alunoId}:${String(horarioOriginal ?? horario ?? "pendente")}`}`;

      itens.push({
        id: assinatura,
        tipo: "biometria",
        icone: "face_6",
        titulo: `${nomeAluno} aguarda confirmação`,
        descricao: `${solicitacao.disciplina ?? solicitacao.nomeDisciplina ?? "Biometria facial"} • validação aprovada`,
        meta: horario ? `Recebida às ${horario}` : "Confirmar na chamada",
        prioridade: 4,
        aulaId,
        alunoNome: nomeAluno
      });
    });
  }

  if (preferencias.notificacoesChamada && chamada?.aulaId) {
    itens.push({
      id: `chamada:${chamada.aulaId}`,
      tipo: "chamada",
      icone: "how_to_reg",
      titulo: "Chamada em andamento",
      descricao: `${chamada.disciplina || "Disciplina"} • ${chamada.turma || "Turma"}`,
      meta: montarHorarioChamada(chamada),
      prioridade: 3
    });
  }

  if (preferencias.notificacoesRisco) {
    const riscos = Array.isArray(dashboard?.alunosRisco) ? dashboard.alunosRisco : [];
    riscos.forEach(alerta => {
      const frequencia = numeroSeguro(alerta.frequencia ?? alerta.percentualFrequencia);
      const nomeAluno = alerta.nomeAluno ?? alerta.nome ?? "Aluno em risco";
      const alunoId = alerta.alunoId ?? alerta.id ?? alerta.usuarioId ?? nomeAluno;
      const faixaFrequencia = frequencia === null ? "sem-percentual" : Math.round(frequencia);
      itens.push({
        id: `risco:${alunoId}:${faixaFrequencia}`,
        tipo: "risco",
        icone: "person_alert",
        titulo: nomeAluno,
        descricao: frequencia === null ? "Frequência abaixo do esperado." : `Frequência atual: ${frequencia.toFixed(1).replace(".0", "")}%`,
        meta: alerta.turma ?? alerta.nomeTurma ?? alerta.matricula ?? "Acompanhar aluno",
        prioridade: frequencia !== null && frequencia < 60 ? 3 : 2,
        alunoNome: nomeAluno
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
    <header class="notificacoes-professor-header">
      <div>
        <span>ACOMPANHAMENTO</span>
        <h3>Notificações</h3>
      </div>
      <strong class="notificacoes-professor-total" title="Não lidas">${naoLidas > 99 ? "99+" : naoLidas}</strong>
    </header>

    <div class="notificacoes-professor-lista">
      ${itens.length ? itens.map((item, index) => montarItem(item, index)).join("") : montarEstadoVazio()}
    </div>

    <footer class="notificacoes-professor-acoes">
      ${naoLidas > 0 ? `
        <button class="notificacoes-professor-acao" type="button" data-notificacao-marcar-todas>
          <span class="material-symbols-rounded" aria-hidden="true">done_all</span>
          Marcar todas como lidas
        </button>` : ""}
      <button class="notificacoes-professor-acao" type="button" data-notificacao-atualizar>
        <span class="material-symbols-rounded" aria-hidden="true">refresh</span>
        Atualizar
      </button>
    </footer>`;
}

function montarItem(item, index) {
  return `
    <button class="notificacoes-professor-item ${item.tipo} prioridade-${item.prioridade} ${item.lida ? "is-read" : "is-unread"}" type="button" data-notificacao-index="${index}">
      <span class="notificacoes-professor-avatar material-symbols-rounded" aria-hidden="true">${escapeHtml(item.icone)}</span>
      <span class="notificacoes-professor-texto">
        <strong>${escapeHtml(item.titulo)}</strong>
        <small>${escapeHtml(item.descricao)}</small>
        <span>${escapeHtml(item.meta || "")}</span>
      </span>
      <span class="notificacoes-professor-final">
        ${item.lida
          ? '<small class="notificacoes-professor-lida">Lida</small>'
          : '<span class="notificacoes-professor-ponto" title="Não lida" aria-label="Não lida"></span>'}
        <span class="material-symbols-rounded notificacoes-professor-chevron" aria-hidden="true">chevron_right</span>
      </span>
    </button>`;
}

function montarEstadoVazio() {
  return `
    <div class="notificacoes-professor-vazio">
      <span class="material-symbols-rounded" aria-hidden="true">notifications_none</span>
      <strong>Nada exige sua atenção agora.</strong>
      <span>Biometrias pendentes, chamadas abertas e alunos em risco aparecerão aqui.</span>
    </div>`;
}

function montarCarregamento() {
  return `
    <div class="notificacoes-professor-carregando" role="status">
      <span class="notificacoes-professor-spinner" aria-hidden="true"></span>
      <span>Carregando notificações...</span>
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
      fecharPainel();

      if (item.tipo === "biometria") {
        if (item.aulaId) sessionStorage.setItem("professorBiometriaAulaPendente", String(item.aulaId));
        document.querySelector('[data-page="chamada"]')?.click();
        return;
      }

      if (item.tipo === "chamada") {
        document.querySelector('[data-page="chamada"]')?.click();
        return;
      }

      if (item.tipo === "risco") {
        if (item.alunoNome) sessionStorage.setItem("professorAlunoBuscaPendente", item.alunoNome);
        document.querySelector('[data-page="alunos"]')?.click();
      }
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

function prepararBotao(botao) {
  botao.setAttribute("aria-haspopup", "dialog");
  botao.setAttribute("aria-expanded", painelAtual && botaoAtual === botao ? "true" : "false");
  botao.title = "Abrir central de notificações";
  if (!botao.querySelector(".notificacoes-professor-badge")) {
    botao.insertAdjacentHTML("beforeend", '<span class="notificacoes-professor-badge" aria-hidden="true"></span>');
  }
}

function atualizarBadgeVisivel(total) {
  const botao = document.querySelector(".bell-btn");
  if (!botao) return;
  prepararBotao(botao);
  atualizarBadge(botao, total);
}

function atualizarBadge(botao, total) {
  if (!botao) return;
  const badge = botao.querySelector(".notificacoes-professor-badge");
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
  const largura = Math.min(390, window.innerWidth - 24);
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

function montarHorarioChamada(chamada) {
  const inicio = chamada?.horaInicio ? String(chamada.horaInicio).slice(0, 5) : "";
  const fim = chamada?.horaFim ? String(chamada.horaFim).slice(0, 5) : "";
  return inicio && fim ? `${inicio} — ${fim}` : "Chamada aberta";
}

function formatarHorarioBiometria(valor) {
  if (!valor) return "";

  const data = new Date(valor);
  if (!Number.isNaN(data.getTime())) {
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  const texto = String(valor);
  return texto.match(/(\d{2}:\d{2})/)?.[1] || "";
}

function notificacoesAtivas() {
  return Boolean(obterConfiguracoes("professor").notificacoes);
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
