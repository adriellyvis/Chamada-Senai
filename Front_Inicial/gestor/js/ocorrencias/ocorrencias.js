import { request } from "../../../core/api.js";

let ocorrenciasCache = [];

export async function abrirOcorrencias(elemento) {
  ativarMenuGestor(elemento);

  const conteudo = document.getElementById("conteudoPrincipal");

  if (!conteudo) return;

  conteudo.innerHTML = `
    <div class="page-header gestor-page-header">
      <div>
        <h1>Ocorrências</h1>
        <p>Acompanhe e atualize ocorrências registradas pelos professores.</p>
      </div>
    </div>

    <div class="ocorrencias-filtros">
      <select id="filtroStatusOcorrenciaGestor" class="select-pill">
        <option value="">Todos os status</option>
        <option value="PENDENTE">Pendente</option>
        <option value="EM_ANALISE">Em análise</option>
        <option value="RESOLVIDA">Resolvida</option>
        <option value="CANCELADA">Cancelada</option>
      </select>

      <select id="filtroGravidadeOcorrenciaGestor" class="select-pill">
        <option value="BAIXA">Baixa</option>
        <option value="MEDIA">Média</option>
        <option value="ALTA">Alta</option>
      </select>

      <select id="tipoOcorrencia">
        <option value="DISCIPLINAR">Disciplinar</option>
        <option value="ATESTADO">Atestado</option>
        <option value="JUSTIFICATIVA">Justificativa</option>
        <option value="INTERVENCAO">Intervenção</option>
        <option value="DESTAQUE">Destaque</option>
      </select>
    </div>

    <div id="listaOcorrenciasGestor">
      <p class="empty-state">Carregando ocorrências...</p>
    </div>
  `;

  document
    .getElementById("filtroStatusOcorrenciaGestor")
    ?.addEventListener("change", aplicarFiltrosOcorrenciasGestor);

  document
    .getElementById("filtroGravidadeOcorrenciaGestor")
    ?.addEventListener("change", aplicarFiltrosOcorrenciasGestor);

  document
    .getElementById("filtroTipoOcorrenciaGestor")
    ?.addEventListener("change", aplicarFiltrosOcorrenciasGestor);

  await carregarOcorrenciasGestor();
}

async function carregarOcorrenciasGestor() {
  const lista = document.getElementById("listaOcorrenciasGestor");

  if (!lista) return;

  try {
    const ocorrencias = await request("/ocorrencias");

    ocorrenciasCache = ocorrencias || [];

    renderizarOcorrenciasGestor(ocorrenciasCache);

  } catch (error) {
    console.error(error);

    lista.innerHTML = `
      <p class="empty-state">
        Erro ao carregar ocorrências.
      </p>
    `;
  }
}

function renderizarOcorrenciasGestor(ocorrencias) {
  const lista = document.getElementById("listaOcorrenciasGestor");

  if (!lista) return;

  if (!ocorrencias.length) {
    lista.innerHTML = `
      <p class="empty-state">
        Nenhuma ocorrência encontrada.
      </p>
    `;
    return;
  }

  lista.innerHTML = `
    <div class="ocorrencias-grid">
      ${ocorrencias.map(ocorrencia => {
        const statusClasse = normalizarClasse(ocorrencia.status);
        const gravidadeClasse = normalizarClasse(ocorrencia.gravidade);

        return `
          <article class="ocorrencia-card ${gravidadeClasse}">
            <div class="ocorrencia-card-topo">
              <div>
                <span class="ocorrencia-label ${gravidadeClasse}">
                  ${formatarGravidade(ocorrencia.gravidade)}
                </span>

                <h2>${ocorrencia.titulo ?? "Ocorrência"}</h2>
              </div>

              <span class="ocorrencia-status ${statusClasse}">
                ${formatarStatusOcorrencia(ocorrencia.status)}
              </span>
            </div>

            <p class="ocorrencia-descricao">
              ${limitarTexto(ocorrencia.descricao, 130)}
            </p>

            <div class="ocorrencia-meta">
              <span>Aluno: ${ocorrencia.alunoNome ?? "-"}</span>
              <span>Professor: ${ocorrencia.professorNome ?? "-"}</span>
              <span>Tipo: ${formatarTipo(ocorrencia.tipo)}</span>
              <span>Data: ${formatarData(ocorrencia.dataOcorrencia)}</span>
            </div>

            <div class="ocorrencia-acoes">
              <button
                class="ocorrencia-btn detalhes"
                data-acao="detalhes"
                data-id="${ocorrencia.id}"
              >
                Ver detalhes
              </button>

              <select
                class="select-status-ocorrencia"
                data-acao="status"
                data-id="${ocorrencia.id}"
              >
                <option value="PENDENTE" ${ocorrencia.status === "PENDENTE" ? "selected" : ""}>
                  Pendente
                </option>
                <option value="EM_ANALISE" ${ocorrencia.status === "EM_ANALISE" ? "selected" : ""}>
                  Em análise
                </option>
                <option value="RESOLVIDA" ${ocorrencia.status === "RESOLVIDA" ? "selected" : ""}>
                  Resolvida
                </option>
                <option value="CANCELADA" ${ocorrencia.status === "CANCELADA" ? "selected" : ""}>
                  Cancelada
                </option>
              </select>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;

  configurarAcoesOcorrenciasGestor();
}

function configurarAcoesOcorrenciasGestor() {
  document.querySelectorAll('[data-acao="detalhes"]').forEach(botao => {
    botao.addEventListener("click", () => {
      const id = Number(botao.dataset.id);
      const ocorrencia = ocorrenciasCache.find(item => item.id === id);

      if (ocorrencia) {
        abrirModalDetalhesOcorrenciaGestor(ocorrencia);
      }
    });
  });

  document.querySelectorAll('[data-acao="status"]').forEach(select => {
    select.addEventListener("change", async () => {
      const id = Number(select.dataset.id);
      const novoStatus = select.value;

      await alterarStatusOcorrencia(id, novoStatus);
    });
  });
}

async function alterarStatusOcorrencia(id, status) {
  const precisaResposta =
    status === "RESOLVIDA" ||
    status === "CANCELADA";

  if (precisaResposta) {
    abrirModalFinalizarOcorrencia(id, status);
    return;
  }

  try {
    await request(`/ocorrencias/${id}/status?status=${status}`, {
      method: "PATCH",
      body: JSON.stringify({
        respostaGestor: ""
      })
    });

    await carregarOcorrenciasGestor();

  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao alterar status da ocorrência.");

    await carregarOcorrenciasGestor();
  }
}

function abrirModalFinalizarOcorrencia(id, status) {
  removerModalOcorrenciaGestor();

  const titulo =
    status === "RESOLVIDA"
      ? "Concluir ocorrência"
      : "Cancelar ocorrência";

  const subtitulo =
    status === "RESOLVIDA"
      ? "Informe a conclusão para que o professor acompanhe o encerramento."
      : "Informe o motivo do cancelamento para registrar a decisão.";

  const label =
    status === "RESOLVIDA"
      ? "Conclusão"
      : "Motivo do cancelamento";

  const modal = document.createElement("div");
  modal.className = "modal-detalhes-overlay";

  modal.innerHTML = `
    <div class="modal-detalhes-card modal-finalizar-ocorrencia">
      <div class="modal-detalhes-header">
        <div>
          <h2>${titulo}</h2>
          <p>${subtitulo}</p>
        </div>

        <button id="btnFecharFinalizarOcorrencia" type="button">
          ×
        </button>
      </div>

      <form id="formFinalizarOcorrencia" class="form-finalizar-ocorrencia">
        <label>
          ${label}
          <textarea
            id="respostaGestorOcorrencia"
            rows="6"
            placeholder="Descreva a decisão tomada..."
            required
          ></textarea>
        </label>

        <div class="form-finalizar-acoes">
          <button
            type="button"
            class="btn-cancelar-finalizacao"
            id="btnCancelarFinalizacao"
          >
            Voltar
          </button>

          <button type="submit" class="btn-confirmar-finalizacao">
            ${status === "RESOLVIDA" ? "Concluir" : "Cancelar ocorrência"}
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("btnFecharFinalizarOcorrencia")
    ?.addEventListener("click", async () => {
      removerModalOcorrenciaGestor();
      await carregarOcorrenciasGestor();
    });

  document
    .getElementById("btnCancelarFinalizacao")
    ?.addEventListener("click", async () => {
      removerModalOcorrenciaGestor();
      await carregarOcorrenciasGestor();
    });

  document
    .getElementById("formFinalizarOcorrencia")
    ?.addEventListener("submit", event => {
      confirmarFinalizacaoOcorrencia(event, id, status);
    });

  modal.addEventListener("click", async event => {
    if (event.target === modal) {
      removerModalOcorrenciaGestor();
      await carregarOcorrenciasGestor();
    }
  });
}

async function confirmarFinalizacaoOcorrencia(event, id, status) {
  event.preventDefault();

  const respostaGestor =
    document
      .getElementById("respostaGestorOcorrencia")
      ?.value
      .trim();

  if (!respostaGestor) {
    alert("Informe uma resposta antes de finalizar.");
    return;
  }

  try {
    await request(`/ocorrencias/${id}/status?status=${status}`, {
      method: "PATCH",
      body: JSON.stringify({
        respostaGestor
      })
    });

    removerModalOcorrenciaGestor();

    await carregarOcorrenciasGestor();

  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao finalizar ocorrência.");
  }
}

function abrirModalDetalhesOcorrenciaGestor(ocorrencia) {
  removerModalOcorrenciaGestor();

  const modal = document.createElement("div");
  modal.className = "modal-detalhes-overlay";

  modal.innerHTML = `
    <div class="modal-detalhes-card">
      <div class="modal-detalhes-header">
        <div>
          <h2>${ocorrencia.titulo ?? "Ocorrência"}</h2>
          <p>Detalhes completos da ocorrência.</p>
        </div>

        <button id="btnFecharDetalhesOcorrenciaGestor" type="button">
          ×
        </button>
      </div>

      <div class="modal-detalhes-body">
        <div class="ocorrencia-detalhes-grid">
          <div>
            <span>Aluno</span>
            <strong>${ocorrencia.alunoNome ?? "-"}</strong>
          </div>

          <div>
            <span>Professor</span>
            <strong>${ocorrencia.professorNome ?? "-"}</strong>
          </div>

          <div>
            <span>Tipo</span>
            <strong>${formatarTipo(ocorrencia.tipo)}</strong>
          </div>

          <div>
            <span>Gravidade</span>
            <strong>${formatarGravidade(ocorrencia.gravidade)}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>${formatarStatusOcorrencia(ocorrencia.status)}</strong>
          </div>

          <div>
            <span>Data</span>
            <strong>${formatarData(ocorrencia.dataOcorrencia)}</strong>
          </div>
        </div>

        <div class="ocorrencia-descricao-completa">
          <span>Descrição</span>
          <p>${ocorrencia.descricao ?? "-"}</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("btnFecharDetalhesOcorrenciaGestor")
    ?.addEventListener("click", removerModalOcorrenciaGestor);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      removerModalOcorrenciaGestor();
    }
  });
}

function aplicarFiltrosOcorrenciasGestor() {
  const status =
    document.getElementById("filtroStatusOcorrenciaGestor")?.value ?? "";

  const gravidade =
    document.getElementById("filtroGravidadeOcorrenciaGestor")?.value ?? "";

  const tipo =
    document.getElementById("filtroTipoOcorrenciaGestor")?.value ?? "";

  const filtradas = ocorrenciasCache.filter(ocorrencia => {
    const statusOk =
      !status || ocorrencia.status === status;

    const gravidadeOk =
      !gravidade || ocorrencia.gravidade === gravidade;

    const tipoOk =
      !tipo || ocorrencia.tipo === tipo;

    return statusOk && gravidadeOk && tipoOk;
  });

  renderizarOcorrenciasGestor(filtradas);
}

function removerModalOcorrenciaGestor() {
  document
    .querySelector(".modal-detalhes-overlay")
    ?.remove();
}

function ativarMenuGestor(elemento) {
  document.querySelectorAll("nav a").forEach(item => {
    item.classList.remove("ativo");
  });

  if (elemento) {
    elemento.classList.add("ativo");
  }
}

function limitarTexto(texto, limite = 120) {
  if (!texto) return "-";

  if (texto.length <= limite) {
    return texto;
  }

  return `${texto.substring(0, limite)}...`;
}

function normalizarClasse(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .replaceAll("_", "-");
}

function formatarTipo(tipo) {
  const mapa = {
    DISCIPLINAR: "Disciplinar",
    ATESTADO: "Atestado",
    JUSTIFICATIVA: "Justificativa",
    INTERVENCAO: "Intervenção",
    DESTAQUE: "Destaque"
  };

  return mapa[tipo] ?? tipo ?? "-";
}

function formatarStatusOcorrencia(status) {
  const mapa = {
    PENDENTE: "Pendente",
    EM_ANALISE: "Em análise",
    RESOLVIDA: "Resolvida",
    CANCELADA: "Cancelada"
  };

  return mapa[status] ?? status ?? "-";
}

function formatarGravidade(gravidade) {
  const mapa = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta"
  };

  return mapa[gravidade] ?? gravidade ?? "-";
}

function formatarData(data) {
  if (!data) return "-";

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return data;
  }

  return dataObj.toLocaleDateString("pt-BR");
}