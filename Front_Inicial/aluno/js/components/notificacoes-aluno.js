import { request } from "../../../core/api.js";
import { buscarChamadaAbertaAluno } from "../../../biometria/chamada-aberta-api.js";
import {
  obterAvisosComEstado,
  marcarAvisoComoLido,
  marcarTodosAvisosComoLidos
} from "../data/avisos-aluno-data.js";

let navegarCallback = null;
let painelConfigurado = false;
let notificacoesCache = [];

export function configurarNotificacoesAluno({ navegarPara } = {}) {
  navegarCallback = navegarPara ?? navegarCallback;

  const botao = document.getElementById("btnNotificacoesAluno");
  const painel = document.getElementById("painelNotificacoesAluno");
  if (!botao || !painel) return;

  if (!painelConfigurado) {
    painelConfigurado = true;

    botao.addEventListener("click", async event => {
      event.stopPropagation();
      const abrir = painel.hidden;
      painel.hidden = !abrir;
      botao.setAttribute("aria-expanded", String(abrir));
      if (abrir) await atualizarNotificacoesAluno();
    });

    painel.addEventListener("click", async event => {
      event.stopPropagation();

      const item = event.target.closest("[data-notificacao-id]");
      if (item) {
        await selecionarNotificacao(item.dataset.notificacaoId);
        return;
      }

      if (event.target.closest("#btnMarcarTodasNotificacoesAluno")) {
        marcarTodasComoLidas();
        await atualizarNotificacoesAluno();
      }
    });

    document.addEventListener("click", event => {
      const wrapper = document.querySelector(".notificacoes-aluno-wrapper");
      if (wrapper?.contains(event.target)) return;
      fecharPainel();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") fecharPainel();
    });

    window.addEventListener("avisos-aluno-atualizados", () => {
      atualizarNotificacoesAluno();
    });
  }

  atualizarNotificacoesAluno();
}

export async function atualizarNotificacoesAluno() {
  const painel = document.getElementById("painelNotificacoesAluno");
  const badge = document.getElementById("badgeNotificacoesAluno");
  if (!painel || !badge) return;

  painel.innerHTML = montarCarregamento();

  const usuario = obterUsuarioLogado();
  const avisos = obterAvisosComEstado().map(aviso => ({
    id: `aviso:${aviso.id}`,
    tipo: "aviso",
    referencia: aviso.id,
    titulo: aviso.titulo,
    descricao: `${aviso.tag} • ${aviso.data}`,
    prioridade: aviso.prioridade === "importante" ? "alta" : "normal",
    lida: aviso.lido,
    icone: aviso.tipo === "frequencia" ? "!" : "i"
  }));

  const dinamicas = [];

  if (usuario?.id) {
    const [dashboard, chamada] = await Promise.all([
      request(`/aluno/dashboard/${usuario.id}`).catch(() => null),
      buscarChamadaAbertaAluno(usuario.id).catch(() => null)
    ]);

    if (chamada) {
      const assinatura = `chamada-${chamada.id ?? chamada.aulaId ?? chamada.disciplina ?? "aberta"}`;
      dinamicas.push({
        id: `dinamica:${assinatura}`,
        tipo: "chamada",
        referencia: assinatura,
        titulo: "Chamada aberta agora",
        descricao: `${chamada.disciplina ?? "Disciplina"} • ${chamada.turma ?? "Sua turma"}`,
        prioridade: "alta",
        lida: notificacaoDinamicaEstaLida(assinatura),
        icone: "◎"
      });
    }

    const frequencia = Number(dashboard?.frequencia);
    if (Number.isFinite(frequencia) && frequencia <= 75) {
      const assinatura = `frequencia-${Math.round(frequencia)}`;
      dinamicas.push({
        id: `dinamica:${assinatura}`,
        tipo: "frequencia",
        referencia: assinatura,
        titulo: frequencia < 50 ? "Frequência crítica" : "Atenção à frequência",
        descricao: `Sua frequência atual é ${frequencia.toFixed(1).replace(".0", "")}%`,
        prioridade: frequencia < 50 ? "critica" : "alta",
        lida: notificacaoDinamicaEstaLida(assinatura),
        icone: "!"
      });
    }
  }

  notificacoesCache = [...dinamicas, ...avisos]
    .sort((a, b) => prioridadeNumero(b.prioridade) - prioridadeNumero(a.prioridade));

  const naoLidas = notificacoesCache.filter(item => !item.lida).length;
  badge.textContent = String(naoLidas);
  badge.hidden = naoLidas === 0;

  painel.innerHTML = montarPainel(notificacoesCache, naoLidas);
}

async function selecionarNotificacao(id) {
  const notificacao = notificacoesCache.find(item => item.id === id);
  if (!notificacao) return;

  if (notificacao.tipo === "aviso") {
    marcarAvisoComoLido(notificacao.referencia);
    sessionStorage.setItem("alunoAvisoBuscaPendente", notificacao.referencia);
    fecharPainel();
    await navegar("avisos");
    return;
  }

  marcarNotificacaoDinamicaComoLida(notificacao.referencia);
  fecharPainel();

  if (notificacao.tipo === "chamada") {
    await navegar("chamada");
  } else if (notificacao.tipo === "frequencia") {
    await navegar("frequencia");
  }

  atualizarNotificacoesAluno();
}

function marcarTodasComoLidas() {
  marcarTodosAvisosComoLidos();
  notificacoesCache
    .filter(item => item.tipo !== "aviso")
    .forEach(item => marcarNotificacaoDinamicaComoLida(item.referencia));
}

function montarPainel(notificacoes, naoLidas) {
  return `
    <div class="notificacoes-aluno-cabecalho">
      <div>
        <span>ACOMPANHAMENTO</span>
        <h3>Suas notificações</h3>
      </div>
      <strong>${naoLidas}</strong>
    </div>

    <div class="notificacoes-aluno-lista">
      ${notificacoes.length
        ? notificacoes.map(montarItem).join("")
        : `<div class="notificacoes-aluno-vazio"><strong>Tudo certo por aqui.</strong><span>Não há notificações no momento.</span></div>`}
    </div>

    ${naoLidas > 0 ? `
      <button class="notificacoes-aluno-marcar" id="btnMarcarTodasNotificacoesAluno" type="button">
        Marcar todas como lidas
      </button>
    ` : ""}
  `;
}

function montarItem(item) {
  return `
    <button
      class="notificacao-aluno-item ${item.lida ? "is-read" : ""} prioridade-${item.prioridade}"
      type="button"
      data-notificacao-id="${escaparHtml(item.id)}"
    >
      <span class="notificacao-aluno-icone">${escaparHtml(item.icone)}</span>
      <span class="notificacao-aluno-texto">
        <strong>${escaparHtml(item.titulo)}</strong>
        <small>${escaparHtml(item.descricao)}</small>
      </span>
      ${item.lida ? `<span class="notificacao-aluno-status">Lida</span>` : `<span class="notificacao-aluno-ponto"></span>`}
    </button>
  `;
}

function montarCarregamento() {
  return `
    <div class="notificacoes-aluno-vazio carregando">
      <span class="notificacoes-aluno-spinner"></span>
      <span>Atualizando notificações...</span>
    </div>
  `;
}

function prioridadeNumero(prioridade) {
  if (prioridade === "critica") return 3;
  if (prioridade === "alta") return 2;
  return 1;
}

function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || null;
  } catch {
    return null;
  }
}

function chaveDinamicasLidas() {
  return `eyecount:aluno:${obterUsuarioLogado()?.id ?? "anonimo"}:notificacoes-dinamicas-lidas`;
}

function obterDinamicasLidas() {
  try {
    const valor = JSON.parse(localStorage.getItem(chaveDinamicasLidas()));
    return new Set(Array.isArray(valor) ? valor.map(String) : []);
  } catch {
    return new Set();
  }
}

function notificacaoDinamicaEstaLida(assinatura) {
  return obterDinamicasLidas().has(String(assinatura));
}

function marcarNotificacaoDinamicaComoLida(assinatura) {
  const lidas = obterDinamicasLidas();
  lidas.add(String(assinatura));
  localStorage.setItem(chaveDinamicasLidas(), JSON.stringify([...lidas]));
}

function fecharPainel() {
  const painel = document.getElementById("painelNotificacoesAluno");
  const botao = document.getElementById("btnNotificacoesAluno");
  if (painel) painel.hidden = true;
  botao?.setAttribute("aria-expanded", "false");
}

async function navegar(pagina) {
  if (typeof navegarCallback === "function") {
    await navegarCallback(pagina);
    return;
  }
  document.querySelector(`.sidebar__item[data-page="${pagina}"]`)?.click();
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
