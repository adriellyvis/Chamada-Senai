import { request } from "../../../core/api.js";
import {
  carregarAvisosAluno,
  obterAvisosComEstado,
  marcarAvisoComoLido,
  marcarTodosAvisosComoLidos
} from "../data/avisos-aluno-data.js";

let ocorrenciasCache = [];
let painelAtivo = "avisos";

export async function abrirAvisosAluno(container) {
  container.innerHTML = montarCarregamentoPagina();

  const usuario = obterUsuarioLogado();

  let erroAvisos = null;
  let erroOcorrencias = null;

  const [avisos, ocorrencias] = await Promise.all([
    carregarAvisosAluno({ forcar: true }).catch(erro => {
      console.error("Erro ao carregar avisos do aluno:", erro);
      erroAvisos = erro;
      return obterAvisosComEstado();
    }),
    usuario?.id
      ? request(`/aluno/ocorrencias/${usuario.id}`).catch(erro => {
          console.error("Erro ao carregar ocorrências do aluno:", erro);
          erroOcorrencias = erro;
          return [];
        })
      : Promise.resolve([])
  ]);

  ocorrenciasCache = Array.isArray(ocorrencias) ? ocorrencias : [];
  renderizarPagina(container, Array.isArray(avisos) ? avisos : [], ocorrenciasCache);

  if (erroAvisos && erroOcorrencias) {
    exibirMensagemAvisos("Não foi possível carregar avisos nem ocorrências do servidor.", "erro");
  } else if (erroAvisos) {
    exibirMensagemAvisos("Ocorrências carregadas. O endpoint de avisos ainda não respondeu.", "erro");
  } else if (erroOcorrencias) {
    exibirMensagemAvisos("Avisos carregados, mas não foi possível consultar as ocorrências.", "erro");
  }
}

function renderizarPagina(container, avisos, ocorrencias) {
  const naoLidos = avisos.filter(aviso => !aviso.lido).length;
  const importantes = avisos.filter(aviso => aviso.prioridade === "importante").length;
  const ocorrenciasAbertas = ocorrencias.filter(ocorrencia => {
    const status = String(ocorrencia.status ?? "").toUpperCase();
    return status === "PENDENTE" || status === "EM_ANALISE";
  }).length;

  container.innerHTML = `
    <div class="avisos-page">
      <section class="comunicacao-tabs" aria-label="Comunicações do aluno">
        <button class="comunicacao-tab ${painelAtivo === "avisos" ? "is-active" : ""}" data-comunicacao-tab="avisos" type="button">
          <span class="material-symbols-rounded" aria-hidden="true">campaign</span>
          Avisos
          ${naoLidos ? `<strong>${naoLidos}</strong>` : ""}
        </button>
        <button class="comunicacao-tab ${painelAtivo === "ocorrencias" ? "is-active" : ""}" data-comunicacao-tab="ocorrencias" type="button">
          <span class="material-symbols-rounded" aria-hidden="true">assignment_late</span>
          Ocorrências
          ${ocorrenciasAbertas ? `<strong>${ocorrenciasAbertas}</strong>` : ""}
        </button>
      </section>

      <div id="feedbackAvisosAluno" class="comunicacao-feedback" hidden></div>

      <section class="avisos-layout">
        <article class="card avisos-main-card">
          <div id="painelAvisosAluno" ${painelAtivo !== "avisos" ? "hidden" : ""}>
            ${montarPainelAvisos(avisos, naoLidos)}
          </div>

          <div id="painelOcorrenciasAluno" ${painelAtivo !== "ocorrencias" ? "hidden" : ""}>
            ${montarPainelOcorrencias(ocorrencias)}
          </div>
        </article>

        <aside class="avisos-side">
          <article class="card avisos-resumo-card">
            <h3>Resumo</h3>
            <div class="avisos-resumo-list">
              <div><span>Avisos não lidos</span><strong id="qtdNaoLidos">${naoLidos}</strong></div>
              <div><span>Avisos importantes</span><strong>${importantes}</strong></div>
              <div><span>Ocorrências abertas</span><strong>${ocorrenciasAbertas}</strong></div>
              <div><span>Total de ocorrências</span><strong>${ocorrencias.length}</strong></div>
            </div>
          </article>

          <article class="card avisos-destaque-card">
            <h3>Como funciona</h3>
            <div class="destaque-box">
              <span>Comunicação acadêmica</span>
              <strong>Avisos não são ocorrências</strong>
              <p>Avisos trazem orientações e feedbacks. Ocorrências são registros formais de situações acadêmicas.</p>
            </div>
          </article>

          <article class="card avisos-contato-card">
            <h3>Feedback do professor</h3>
            <p>O professor pode compartilhar sua frequência atual, uma nota ou média e sugestões de melhoria.</p>
          </article>
        </aside>
      </section>
    </div>
  `;

  configurarEventos(container);
  aplicarAvisoPendente();
}

function montarPainelAvisos(avisos, naoLidos) {
  return `
    <div class="avisos-header">
      <div>
        <span class="page-tag">MURAL DO ALUNO</span>
        <h2>Avisos e feedbacks</h2>
        <p>Mensagens enviadas pela gestão e pelos seus professores.</p>
      </div>
      <button class="primary-btn" id="btnMarcarLidos" ${naoLidos === 0 ? "disabled" : ""}>
        ${naoLidos === 0 ? "Todos estão lidos" : "Marcar todos como lidos"}
      </button>
    </div>

    <div class="avisos-filtros">
      <button class="aviso-filter is-active" data-filter="todos">Todos</button>
      <button class="aviso-filter" data-filter="gestor">Gestão</button>
      <button class="aviso-filter" data-filter="professor">Professor</button>
      <button class="aviso-filter" data-filter="frequencia">Frequência</button>
      <button class="aviso-filter" data-filter="academico">Acadêmico</button>
    </div>

    <div class="avisos-list" id="avisosList">
      ${avisos.length
        ? avisos.map(avisoCard).join("")
        : montarEstadoVazio("campaign", "Nenhum aviso recebido", "Quando a gestão ou um professor enviar uma mensagem, ela aparecerá aqui.")}
    </div>
  `;
}

function avisoCard(aviso) {
  const temFeedback = aviso.frequencia !== null || aviso.nota !== null || aviso.melhorias;

  return `
    <article
      class="aviso-card ${aviso.lido ? "is-read" : ""} ${aviso.prioridade === "importante" ? "is-important" : ""} ${temFeedback ? "is-feedback" : ""}"
      data-aviso-id="${escaparHtml(aviso.id)}"
      data-tipo="${escaparHtml(aviso.tipo)}"
      tabindex="0"
    >
      <div class="aviso-marker"></div>
      <div class="aviso-content">
        <div class="aviso-top">
          <span class="aviso-tag">${escaparHtml(aviso.data)} • ${escaparHtml(aviso.tag)}</span>
          <div class="aviso-status-wrap">
            ${aviso.prioridade === "importante" ? `<span class="aviso-important-badge">Importante</span>` : ""}
            ${aviso.lido ? `<span class="aviso-read">Lido</span>` : `<span class="aviso-new">Novo</span>`}
          </div>
        </div>

        <h3>${escaparHtml(aviso.titulo)}</h3>
        ${aviso.texto ? `<p>${escaparHtml(aviso.texto)}</p>` : ""}

        ${temFeedback ? montarFeedbackAcademico(aviso) : ""}

        <small class="aviso-data-completa">${escaparHtml(aviso.dataCompleta)}</small>
      </div>
    </article>
  `;
}

function montarFeedbackAcademico(aviso) {
  return `
    <div class="feedback-academico-box">
      <div class="feedback-academico-metricas">
        <div>
          <span>Frequência</span>
          <strong>${aviso.frequencia === null ? "—" : `${formatarNumero(aviso.frequencia)}%`}</strong>
        </div>
        <div>
          <span>Nota / média</span>
          <strong>${aviso.nota === null ? "—" : formatarNumero(aviso.nota)}</strong>
        </div>
        <div>
          <span>Turma</span>
          <strong>${escaparHtml(aviso.turma || "—")}</strong>
        </div>
      </div>
      ${aviso.melhorias ? `
        <div class="feedback-academico-melhoria">
          <span>Orientação de melhoria</span>
          <p>${escaparHtml(aviso.melhorias)}</p>
        </div>
      ` : ""}
    </div>
  `;
}

function montarPainelOcorrencias(ocorrencias) {
  return `
    <div class="avisos-header ocorrencias-aluno-header">
      <div>
        <span class="page-tag">ACOMPANHAMENTO</span>
        <h2>Minhas ocorrências</h2>
        <p>Consulte registros formais feitos pelos professores e o retorno da gestão.</p>
      </div>
    </div>

    <div class="avisos-filtros">
      <button class="ocorrencia-filter is-active" data-ocorrencia-filter="todos">Todas</button>
      <button class="ocorrencia-filter" data-ocorrencia-filter="abertas">Abertas</button>
      <button class="ocorrencia-filter" data-ocorrencia-filter="resolvidas">Resolvidas</button>
    </div>

    <div class="ocorrencias-aluno-list" id="ocorrenciasAlunoList">
      ${ocorrencias.length
        ? ocorrencias.map(ocorrenciaCard).join("")
        : montarEstadoVazio("assignment_turned_in", "Nenhuma ocorrência registrada", "Você não possui ocorrências acadêmicas no momento.")}
    </div>
  `;
}

function ocorrenciaCard(ocorrencia) {
  const status = String(ocorrencia.status ?? "PENDENTE").toUpperCase();
  const grupo = status === "RESOLVIDA" || status === "CANCELADA" ? "resolvidas" : "abertas";
  const gravidade = String(ocorrencia.gravidade ?? "BAIXA").toUpperCase();

  return `
    <article class="ocorrencia-aluno-card gravidade-${normalizarClasse(gravidade)}" data-ocorrencia-grupo="${grupo}">
      <div class="ocorrencia-aluno-topo">
        <div>
          <div class="ocorrencia-aluno-badges">
            <span class="ocorrencia-aluno-tipo">${escaparHtml(formatarTipo(ocorrencia.tipo))}</span>
            <span class="ocorrencia-aluno-gravidade ${normalizarClasse(gravidade)}">${escaparHtml(formatarGravidade(gravidade))}</span>
          </div>
          <h3>${escaparHtml(ocorrencia.titulo || "Ocorrência")}</h3>
        </div>
        <span class="ocorrencia-aluno-status ${normalizarClasse(status)}">${escaparHtml(formatarStatus(status))}</span>
      </div>

      <p>${escaparHtml(ocorrencia.descricao || "Sem descrição informada.")}</p>

      <div class="ocorrencia-aluno-meta">
        <span><strong>Professor:</strong> ${escaparHtml(ocorrencia.professorNome || "Não informado")}</span>
        <span><strong>Registrada em:</strong> ${escaparHtml(formatarDataHora(ocorrencia.dataOcorrencia))}</span>
      </div>

      ${ocorrencia.respostaGestor ? `
        <div class="ocorrencia-resposta-gestor">
          <span>Resposta da gestão</span>
          <p>${escaparHtml(ocorrencia.respostaGestor)}</p>
          ${ocorrencia.dataAtualizacao ? `<small>${escaparHtml(formatarDataHora(ocorrencia.dataAtualizacao))}</small>` : ""}
        </div>
      ` : ""}
    </article>
  `;
}

function configurarEventos(container) {
  document.querySelectorAll("[data-comunicacao-tab]").forEach(botao => {
    botao.addEventListener("click", () => {
      painelAtivo = botao.dataset.comunicacaoTab;
      alternarPainelComunicacao();
    });
  });

  document.querySelectorAll(".aviso-filter").forEach(filtro => {
    filtro.addEventListener("click", () => filtrarAvisos(filtro));
  });

  document.querySelectorAll(".ocorrencia-filter").forEach(filtro => {
    filtro.addEventListener("click", () => filtrarOcorrencias(filtro));
  });

  document.getElementById("btnMarcarLidos")?.addEventListener("click", async event => {
    const botao = event.currentTarget;
    botao.disabled = true;
    botao.textContent = "Atualizando...";

    try {
      await marcarTodosAvisosComoLidos();
      await abrirAvisosAluno(container);
      exibirMensagemAvisos("Todos os avisos foram marcados como lidos.", "sucesso");
    } catch (erro) {
      console.error(erro);
      botao.disabled = false;
      botao.textContent = "Marcar todos como lidos";
      exibirMensagemAvisos(erro.message || "Não foi possível atualizar os avisos.", "erro");
    }
  });

  document.querySelectorAll(".aviso-card").forEach(card => {
    const abrir = async () => {
      const id = card.dataset.avisoId;
      if (!id || card.classList.contains("is-read")) return;

      try {
        await marcarAvisoComoLido(id);
        card.classList.add("is-read");
        card.querySelector(".aviso-new")?.replaceWith(criarBadgeLido());
        atualizarContadorNaoLidos();
      } catch (erro) {
        console.error(erro);
        exibirMensagemAvisos("Não foi possível marcar o aviso como lido.", "erro");
      }
    };

    card.addEventListener("click", abrir);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        abrir();
      }
    });
  });
}

function alternarPainelComunicacao() {
  const avisos = document.getElementById("painelAvisosAluno");
  const ocorrencias = document.getElementById("painelOcorrenciasAluno");

  if (avisos) avisos.hidden = painelAtivo !== "avisos";
  if (ocorrencias) ocorrencias.hidden = painelAtivo !== "ocorrencias";

  document.querySelectorAll("[data-comunicacao-tab]").forEach(botao => {
    botao.classList.toggle("is-active", botao.dataset.comunicacaoTab === painelAtivo);
  });
}

function filtrarAvisos(filtro) {
  const tipo = filtro.dataset.filter;
  document.querySelectorAll(".aviso-filter").forEach(item => item.classList.remove("is-active"));
  filtro.classList.add("is-active");

  document.querySelectorAll(".aviso-card").forEach(card => {
    card.style.display = tipo === "todos" || card.dataset.tipo === tipo ? "grid" : "none";
  });
}

function filtrarOcorrencias(filtro) {
  const grupo = filtro.dataset.ocorrenciaFilter;
  document.querySelectorAll(".ocorrencia-filter").forEach(item => item.classList.remove("is-active"));
  filtro.classList.add("is-active");

  document.querySelectorAll(".ocorrencia-aluno-card").forEach(card => {
    card.style.display = grupo === "todos" || card.dataset.ocorrenciaGrupo === grupo ? "block" : "none";
  });
}

function atualizarContadorNaoLidos() {
  const quantidade = obterAvisosComEstado().filter(aviso => !aviso.lido).length;
  const contador = document.getElementById("qtdNaoLidos");
  if (contador) contador.textContent = String(quantidade);

  const botao = document.getElementById("btnMarcarLidos");
  if (botao && quantidade === 0) {
    botao.disabled = true;
    botao.textContent = "Todos estão lidos";
  }
}

function aplicarAvisoPendente() {
  const id = sessionStorage.getItem("alunoAvisoBuscaPendente");
  if (!id) return;

  sessionStorage.removeItem("alunoAvisoBuscaPendente");
  painelAtivo = "avisos";
  alternarPainelComunicacao();

  const card = document.querySelector(`[data-aviso-id="${cssEscape(id)}"]`);
  if (!card) return;

  card.classList.add("aviso-busca-destaque");
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => card.classList.remove("aviso-busca-destaque"), 3500);
}

function exibirMensagemAvisos(texto, tipo = "sucesso") {
  const box = document.getElementById("feedbackAvisosAluno");
  if (!box) return;
  box.textContent = texto;
  box.className = `comunicacao-feedback ${tipo}`;
  box.hidden = false;
  window.setTimeout(() => { box.hidden = true; }, 4000);
}

function criarBadgeLido() {
  const span = document.createElement("span");
  span.className = "aviso-read";
  span.textContent = "Lido";
  return span;
}

function montarEstadoVazio(icone, titulo, texto) {
  return `
    <div class="comunicacao-empty">
      <span class="material-symbols-rounded" aria-hidden="true">${icone}</span>
      <strong>${escaparHtml(titulo)}</strong>
      <p>${escaparHtml(texto)}</p>
    </div>
  `;
}

function montarCarregamentoPagina() {
  return `
    <div class="avisos-page">
      <article class="card avisos-main-card comunicacao-loading">
        <span class="comunicacao-spinner"></span>
        <strong>Carregando avisos e ocorrências...</strong>
      </article>
    </div>
  `;
}

function obterUsuarioLogado() {
  try {
    return JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario"))) || null;
  } catch {
    return null;
  }
}

function formatarNumero(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return numero.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function formatarDataHora(valor) {
  if (!valor) return "Não informada";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatarTipo(valor) {
  const mapa = {
    DISCIPLINAR: "Disciplinar",
    ATESTADO: "Atestado",
    JUSTIFICATIVA: "Justificativa",
    INTERVENCAO: "Intervenção",
    DESTAQUE: "Destaque"
  };
  return mapa[String(valor ?? "").toUpperCase()] ?? valor ?? "Ocorrência";
}

function formatarGravidade(valor) {
  const mapa = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta" };
  return mapa[String(valor ?? "").toUpperCase()] ?? valor ?? "Baixa";
}

function formatarStatus(valor) {
  const mapa = {
    PENDENTE: "Pendente",
    EM_ANALISE: "Em análise",
    RESOLVIDA: "Resolvida",
    CANCELADA: "Cancelada"
  };
  return mapa[String(valor ?? "").toUpperCase()] ?? valor ?? "Pendente";
}

function normalizarClasse(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "-");
}

function cssEscape(valor) {
  if (window.CSS?.escape) return CSS.escape(String(valor));
  return String(valor).replace(/["\\]/g, "\\$&");
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
