import {
  obterAvisosComEstado,
  marcarAvisoComoLido,
  marcarTodosAvisosComoLidos
} from "../data/avisos-aluno-data.js";

export function abrirAvisosAluno(container) {
  const avisos = obterAvisosComEstado();
  const naoLidos = avisos.filter(aviso => !aviso.lido).length;
  const importantes = avisos.filter(aviso => aviso.prioridade === "importante").length;

  container.innerHTML = `
    <div class="avisos-page">
      <section class="avisos-layout">
        <article class="card avisos-main-card">
          <div class="avisos-header">
            <div>
              <span class="page-tag">MURAL DO ALUNO</span>
              <h2>Avisos e Comunicados</h2>
              <p>Acompanhe mensagens da secretaria, coordenação e professores.</p>
            </div>

            <button class="primary-btn" id="btnMarcarLidos" ${naoLidos === 0 ? "disabled" : ""}>
              ${naoLidos === 0 ? "Todos estão lidos" : "Marcar todos como lidos"}
            </button>
          </div>

          <div class="avisos-filtros">
            <button class="aviso-filter is-active" data-filter="todos">Todos</button>
            <button class="aviso-filter" data-filter="secretaria">Secretaria</button>
            <button class="aviso-filter" data-filter="coordenacao">Coordenação</button>
            <button class="aviso-filter" data-filter="professor">Professor</button>
            <button class="aviso-filter" data-filter="frequencia">Frequência</button>
          </div>

          <div class="avisos-list" id="avisosList">
            ${avisos.map(avisoCard).join("")}
          </div>
        </article>

        <aside class="avisos-side">
          <article class="card avisos-resumo-card">
            <h3>Resumo</h3>

            <div class="avisos-resumo-list">
              <div>
                <span>Não lidos</span>
                <strong id="qtdNaoLidos">${naoLidos}</strong>
              </div>

              <div>
                <span>Importantes</span>
                <strong>${importantes}</strong>
              </div>

              <div>
                <span>Total</span>
                <strong>${avisos.length}</strong>
              </div>
            </div>
          </article>

          <article class="card avisos-destaque-card">
            <h3>Aviso em destaque</h3>

            <div class="destaque-box">
              <span>Frequência</span>
              <strong>Chamada facial</strong>
              <p>
                Quando o professor abrir uma chamada, acesse a aba Chamada e valide sua presença por biometria facial.
              </p>
            </div>

            <button class="outline-btn" id="btnIrChamadaAvisos">
              Ir para chamada
            </button>
          </article>

          <article class="card avisos-contato-card">
            <h3>Precisa de ajuda?</h3>

            <p>
              Em caso de erro na presença, procure o professor da disciplina ou a secretaria.
            </p>

            <div class="contato-list">
              <div>
                <span>Secretaria</span>
                <strong>08h às 18h</strong>
              </div>

              <div>
                <span>Coordenação</span>
                <strong>Por agendamento</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  `;

  configurarAvisos(container);
  aplicarAvisoPendente();
}

function avisoCard(aviso) {
  return `
    <article
      class="aviso-card ${aviso.lido ? "is-read" : ""} ${aviso.prioridade === "importante" ? "is-important" : ""}"
      data-aviso-id="${escaparHtml(aviso.id)}"
      data-tipo="${escaparHtml(aviso.tipo)}"
      tabindex="0"
    >
      <div class="aviso-marker"></div>

      <div class="aviso-content">
        <div class="aviso-top">
          <span class="aviso-tag">${escaparHtml(aviso.data)} • ${escaparHtml(aviso.tag)}</span>
          ${aviso.lido ? `<span class="aviso-read">Lido</span>` : `<span class="aviso-new">Novo</span>`}
        </div>

        <h3>${escaparHtml(aviso.titulo)}</h3>
        <p>${escaparHtml(aviso.texto)}</p>
      </div>
    </article>
  `;
}

function configurarAvisos(container) {
  configurarFiltrosAvisos();
  configurarMarcarLidos(container);
  configurarAtalhoChamada();
  configurarLeituraIndividual(container);
}

function configurarFiltrosAvisos() {
  const filtros = document.querySelectorAll(".aviso-filter");
  const cards = document.querySelectorAll(".aviso-card");

  filtros.forEach(filtro => {
    filtro.addEventListener("click", () => {
      const tipoSelecionado = filtro.dataset.filter;

      filtros.forEach(item => item.classList.remove("is-active"));
      filtro.classList.add("is-active");

      cards.forEach(card => {
        const tipoCard = card.dataset.tipo;
        card.style.display = tipoSelecionado === "todos" || tipoCard === tipoSelecionado
          ? "grid"
          : "none";
      });
    });
  });
}

function configurarMarcarLidos(container) {
  const btn = document.getElementById("btnMarcarLidos");
  if (!btn) return;

  btn.addEventListener("click", () => {
    marcarTodosAvisosComoLidos();
    abrirAvisosAluno(container);
  });
}

function configurarLeituraIndividual(container) {
  document.querySelectorAll(".aviso-card").forEach(card => {
    const abrir = () => {
      const id = card.dataset.avisoId;
      if (!id || card.classList.contains("is-read")) return;
      marcarAvisoComoLido(id);
      abrirAvisosAluno(container);
      sessionStorage.setItem("alunoAvisoBuscaPendente", id);
      aplicarAvisoPendente();
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

function aplicarAvisoPendente() {
  const id = sessionStorage.getItem("alunoAvisoBuscaPendente");
  if (!id) return;

  sessionStorage.removeItem("alunoAvisoBuscaPendente");
  const card = document.querySelector(`[data-aviso-id="${cssEscape(id)}"]`);
  if (!card) return;

  card.classList.add("aviso-busca-destaque");
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => card.classList.remove("aviso-busca-destaque"), 3500);
}

function configurarAtalhoChamada() {
  const btn = document.getElementById("btnIrChamadaAvisos");
  if (!btn) return;

  btn.addEventListener("click", () => {
    document.querySelector('.sidebar__item[data-page="chamada"]')?.click();
  });
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
