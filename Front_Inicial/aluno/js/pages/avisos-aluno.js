export function abrirAvisosAluno(container) {
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

            <button class="primary-btn" id="btnMarcarLidos">
              Marcar todos como lidos
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
            ${avisoCard({
              tipo: "secretaria",
              tag: "Secretaria",
              data: "27 ABR",
              titulo: "Renovação de matrícula",
              texto: "A renovação de matrícula estará disponível até sexta-feira. Procure a secretaria em caso de dúvidas.",
              prioridade: "normal",
              lido: false
            })}

            ${avisoCard({
              tipo: "coordenacao",
              tag: "Coordenação",
              data: "25 ABR",
              titulo: "Palestra de Inteligência Artificial",
              texto: "Hoje às 19h haverá palestra no auditório principal sobre IA aplicada à educação e tecnologia.",
              prioridade: "normal",
              lido: false
            })}

            ${avisoCard({
              tipo: "frequencia",
              tag: "Frequência",
              data: "24 ABR",
              titulo: "Atenção à frequência",
              texto: "Sua frequência está regular, mas acompanhe seus registros para evitar inconsistências nas chamadas.",
              prioridade: "importante",
              lido: false
            })}

            ${avisoCard({
              tipo: "professor",
              tag: "Professor",
              data: "23 ABR",
              titulo: "Entrega da atividade de PDM",
              texto: "A atividade prática deverá ser entregue até sexta-feira às 23h59 pela plataforma indicada em aula.",
              prioridade: "normal",
              lido: true
            })}

            ${avisoCard({
              tipo: "coordenacao",
              tag: "Coordenação",
              data: "22 ABR",
              titulo: "Validação biométrica facial",
              texto: "O módulo de chamada facial será usado para confirmar presenças durante chamadas abertas pelo professor.",
              prioridade: "importante",
              lido: true
            })}
          </div>
        </article>

        <aside class="avisos-side">
          <article class="card avisos-resumo-card">
            <h3>Resumo</h3>

            <div class="avisos-resumo-list">
              <div>
                <span>Não lidos</span>
                <strong id="qtdNaoLidos">3</strong>
              </div>

              <div>
                <span>Importantes</span>
                <strong>2</strong>
              </div>

              <div>
                <span>Esta semana</span>
                <strong>5</strong>
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

  configurarAvisos();
}

function avisoCard({ tipo, tag, data, titulo, texto, prioridade, lido }) {
  return `
    <article 
      class="aviso-card ${lido ? "is-read" : ""} ${prioridade === "importante" ? "is-important" : ""}" 
      data-tipo="${tipo}"
    >
      <div class="aviso-marker"></div>

      <div class="aviso-content">
        <div class="aviso-top">
          <span class="aviso-tag">${data} • ${tag}</span>
          ${lido ? `<span class="aviso-read">Lido</span>` : `<span class="aviso-new">Novo</span>`}
        </div>

        <h3>${titulo}</h3>
        <p>${texto}</p>
      </div>
    </article>
  `;
}

function configurarAvisos() {
  configurarFiltrosAvisos();
  configurarMarcarLidos();
  configurarAtalhoChamada();
}

function configurarFiltrosAvisos() {
  const filtros = document.querySelectorAll(".aviso-filter");
  const cards = document.querySelectorAll(".aviso-card");

  filtros.forEach((filtro) => {
    filtro.addEventListener("click", () => {
      const tipoSelecionado = filtro.dataset.filter;

      filtros.forEach((item) => item.classList.remove("is-active"));
      filtro.classList.add("is-active");

      cards.forEach((card) => {
        const tipoCard = card.dataset.tipo;

        if (tipoSelecionado === "todos" || tipoCard === tipoSelecionado) {
          card.style.display = "grid";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

function configurarMarcarLidos() {
  const btn = document.getElementById("btnMarcarLidos");
  const qtdNaoLidos = document.getElementById("qtdNaoLidos");

  if (!btn) return;

  btn.addEventListener("click", () => {
    const cardsNaoLidos = document.querySelectorAll(".aviso-card:not(.is-read)");

    cardsNaoLidos.forEach((card) => {
      card.classList.add("is-read");

      const badgeNovo = card.querySelector(".aviso-new");

      if (badgeNovo) {
        badgeNovo.textContent = "Lido";
        badgeNovo.className = "aviso-read";
      }
    });

    if (qtdNaoLidos) {
      qtdNaoLidos.textContent = "0";
    }

    btn.textContent = "Todos foram marcados";
    btn.disabled = true;
  });
}

function configurarAtalhoChamada() {
  const btn = document.getElementById("btnIrChamadaAvisos");

  if (!btn) return;

  btn.addEventListener("click", () => {
    const botaoChamada = document.querySelector('.sidebar__item[data-page="chamada"]');

    if (botaoChamada) {
      botaoChamada.click();
    }
  });
}