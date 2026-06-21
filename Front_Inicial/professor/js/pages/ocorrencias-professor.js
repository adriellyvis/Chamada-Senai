import { request } from "../../../core/api.js";
let ocorrenciasCache = [];

export async function abrirOcorrenciasProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  conteudo.innerHTML = `
    <section class="page-shell">
      ${montarTopo("GERENCIAMENTO DE OCORRÊNCIAS", "Aqui está o resumo das suas ocorrências.", "Procurar ocorrência...")}

      <div class="content-area section-center">
        <div class="stats-grid">
          ${cardStat("TOTAL REGISTRADO", "statOcTotal", "0", "Histórico de ocorrências", "▤", "blue")}
          ${cardStat("PENDÊNCIAS", "statOcPendentes", "0", "Aguardando ação", "!", "orange")}
          ${cardStat("CASOS RESOLVIDOS", "statOcResolvidas", "0", "de sucesso", "○", "green")}
          ${cardStat("ELOGIOS / DESTAQUES", "statOcDestaques", "0", "Reconhecimentos", "♙", "purple")}
        </div>

        <div class="filters-row">
          <span class="filter-label">⌁ Filtrar por:</span>
          <select id="filtroStatusOcorrencia" class="select-pill">
            <option value="">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="RESOLVIDA">Resolvida</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <select id="filtroGravidadeOcorrencia" class="select-pill">
            <option value="">Todos os Graus</option>
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
          </select>
          <button class="btn-primary" id="btnNovaOcorrencia" type="button">Registrar Ocorrência</button>
        </div>

        <div id="listaOcorrenciasProfessor" class="ocorrencias-lista">
          <p class="empty-state">Carregando ocorrências...</p>
        </div>
      </div>
    </section>
  `;

  document.getElementById("btnNovaOcorrencia")?.addEventListener("click", abrirFormularioOcorrencia);
  document.getElementById("filtroStatusOcorrencia")?.addEventListener("change", aplicarFiltrosOcorrencias);
  document.getElementById("filtroGravidadeOcorrencia")?.addEventListener("change", aplicarFiltrosOcorrencias);

  await carregarOcorrenciasProfessor();

  const deveAbrirModal = localStorage.getItem("abrirModalOcorrencia");
  if (deveAbrirModal === "true") {
    localStorage.removeItem("abrirModalOcorrencia");
    abrirFormularioOcorrencia();
  }
}

function montarTopo(titulo, subtitulo, placeholder) {
  return `
    <header class="page-topbar">
      <div>
        <h1 class="page-title">${titulo}</h1>
        <p class="page-sub">${subtitulo}</p>
      </div>
      <div class="topbar-actions">
        <button class="bell-btn" type="button">🔔</button>
        <label class="search-pill">
          <input type="text" placeholder="${placeholder}" />
          <span>⌕</span>
        </label>
      </div>
    </header>
  `;
}

function cardStat(titulo, id, valor, caption, icone, cor) {
  return `
    <article class="stat-card ${cor}">
      <div class="stat-icon">${icone}</div>
      <h3>${titulo}</h3>
      <div class="stat-row">
        <strong class="stat-number" id="${id}">${valor}</strong>
        <span class="stat-caption ${cor === "orange" ? "warn" : cor === "purple" ? "purple" : ""}">${caption}</span>
      </div>
    </article>
  `;
}

async function carregarOcorrenciasProfessor() {
  const lista = document.getElementById("listaOcorrenciasProfessor");

  if (!lista) return;

  try {
    const ocorrencias = await request("/professor/ocorrencias");

    ocorrenciasCache = ocorrencias || [];

    renderizarOcorrenciasProfessor(ocorrenciasCache);

  } catch (error) {
    console.error(error);

    lista.innerHTML = `
      <p class="empty-state">
        Erro ao carregar ocorrências.
      </p>
    `;
  }
}

function renderizarOcorrenciasProfessor(ocorrencias) {
  const lista = document.getElementById("listaOcorrenciasProfessor");
  if (!lista) return;

  atualizarCardsOcorrencias(ocorrenciasCache);

  if (!ocorrencias.length) {
    lista.innerHTML = `<p class="empty-state">Nenhuma ocorrência registrada.</p>`;
    return;
  }

  lista.innerHTML = ocorrencias.map(ocorrencia => {
    const statusClasse = normalizarClasse(ocorrencia.status);
    const gravidadeClasse = normalizarClasse(ocorrencia.gravidade);
    const aluno = ocorrencia.alunoNome ?? ocorrencia.nomeAluno ?? "Aluno";
    const tipo = formatarTipo(ocorrencia.tipo);

    return `
      <article class="ocorrencia-card ${gravidadeClasse}">
        <div class="ocorrencia-card-topo">
          <div class="ocorrencia-head">
            <div class="ocorrencia-icon">${iconeOcorrencia(ocorrencia)}</div>
            <div>
              <h2>${aluno}</h2>
              <div class="ocorrencia-meta-inline">
                Tipo: ${tipo} • Data de Registro: ${formatarData(ocorrencia.dataOcorrencia)}
                <span class="ocorrencia-label ${gravidadeClasse}">${formatarGravidade(ocorrencia.gravidade)}</span>
              </div>
            </div>
          </div>
          <span class="ocorrencia-status ${statusClasse}">${formatarStatusOcorrencia(ocorrencia.status)}</span>
        </div>

        <p class="ocorrencia-descricao">${limitarTexto(ocorrencia.descricao, 170)}</p>

        <div class="ocorrencia-acoes">
          <button class="ocorrencia-btn detalhes" data-acao="detalhes" data-id="${ocorrencia.id}">Histórico & Detalhes</button>
          ${podeEditarOcorrencia(ocorrencia) ? `<button class="ocorrencia-btn editar" data-acao="editar" data-id="${ocorrencia.id}">Editar</button>` : ""}
        </div>
      </article>
    `;
  }).join("");

  configurarAcoesOcorrencias();
}

function atualizarCardsOcorrencias(ocorrencias) {
  const total = ocorrencias.length;

  const pendentes = ocorrencias.filter(o => {
    const status = String(o.status ?? "").toUpperCase();
    return status === "PENDENTE" || status === "EM_ANALISE";
  }).length;

  const resolvidas = ocorrencias.filter(o => {
    const status = String(o.status ?? "").toUpperCase();
    return status === "RESOLVIDA";
  }).length;

  const destaques = ocorrencias.filter(o => {
    const tipo = String(o.tipo ?? "").toUpperCase();
    return tipo === "DESTAQUE";
  }).length;

  const sucesso = total ? Math.round((resolvidas / total) * 100) : 0;

  setTexto("statOcTotal", total);
  setTexto("statOcPendentes", pendentes);
  setTexto("statOcResolvidas", resolvidas);
  setTexto("statOcDestaques", destaques);

  const resolvidasCaption = document.querySelector("#statOcResolvidas")?.nextElementSibling;
  if (resolvidasCaption) resolvidasCaption.textContent = `${sucesso}% de sucesso`;
}

function iconeOcorrencia(ocorrencia) {
  if (String(ocorrencia.tipo ?? "").includes("atestado")) return "🎖️";
  if (String(ocorrencia.tipo ?? "").includes("destaque") || String(ocorrencia.tipo ?? "").includes("elogio")) return "🏆";
  return "⚠️";
}

function setTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function abrirFormularioOcorrencia(ocorrencia = null) {
  renderizarModalOcorrencia(ocorrencia);
}

function renderizarModalOcorrencia(ocorrencia = null) {
  removerModalOcorrencia();

  const editando = Boolean(ocorrencia);

  const modal = document.createElement("div");
  modal.className = "modal-detalhes-overlay";

  modal.innerHTML = `
    <div class="modal-detalhes-card">
      <div class="modal-detalhes-header">
        <div>
          <h2>${editando ? "Editar ocorrência" : "Nova ocorrência"}</h2>
          <p>
            ${
              editando
                ? "Atualize as informações da ocorrência."
                : "Registre uma situação relacionada a um aluno."
            }
          </p>
        </div>

        <button id="btnFecharModalOcorrencia" type="button">
          ×
        </button>
      </div>

      <form id="formOcorrenciaProfessor" class="form-ocorrencia">
        <label>
          Aluno
          <select id="ocorrenciaAlunoId" required>
            <option value="">Carregando alunos...</option>
          </select>
        </label>

        <label>
          Título
          <input
            id="ocorrenciaTitulo"
            type="text"
            maxlength="150"
            placeholder="Ex: Baixa frequência"
            value="${ocorrencia?.titulo ?? ""}"
            required
          />
        </label>

        <label>
          Tipo
          <select id="ocorrenciaTipo" required>
            <option value="">Selecione</option>
            <option value="DISCIPLINAR">Disciplinar</option>
            <option value="ATESTADO">Atestado</option>
            <option value="JUSTIFICATIVA">Justificativa</option>
            <option value="INTERVENCAO">Intervenção</option>
            <option value="DESTAQUE">Destaque</option>
          </select>
        </label>

        <label>
          Gravidade
          <select id="ocorrenciaGravidade" required>
            <option value="">Selecione</option>
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
          </select>
        </label>

        <label class="form-full">
          Descrição
          <textarea
            id="ocorrenciaDescricao"
            rows="5"
            placeholder="Descreva a ocorrência..."
            required
          >${ocorrencia?.descricao ?? ""}</textarea>
        </label>

        <div class="form-ocorrencia-acoes">
          <button
            type="button"
            class="btn-secundario"
            id="btnCancelarOcorrencia"
          >
            Cancelar
          </button>

          <button type="submit" class="btn-primary">
            ${editando ? "Salvar alterações" : "Salvar ocorrência"}
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("btnFecharModalOcorrencia")
    ?.addEventListener("click", removerModalOcorrencia);

  document
    .getElementById("btnCancelarOcorrencia")
    ?.addEventListener("click", removerModalOcorrencia);

  const form = document.getElementById("formOcorrenciaProfessor");

  if (form) {
    form.dataset.ocorrenciaId = ocorrencia?.id ?? "";
    form.addEventListener("submit", salvarOcorrenciaProfessor);
  }

  carregarAlunosModalOcorrencia(ocorrencia?.alunoId);

  if (editando) {
    setTimeout(() => {
      const tipo = document.getElementById("ocorrenciaTipo");
      const gravidade = document.getElementById("ocorrenciaGravidade");

      if (tipo) {
        tipo.value = ocorrencia.tipo ?? "";
      }

      if (gravidade) {
        gravidade.value = ocorrencia.gravidade ?? "";
      }
    }, 100);
  }
}

async function carregarAlunosModalOcorrencia(alunoIdSelecionado = null) {
    const select = document.getElementById("ocorrenciaAlunoId");

  if (!select) return;

  try {
    const alunos = await request("/professor/alunos");

    select.innerHTML = `
      <option value="">Selecione um aluno</option>
      ${alunos.map(aluno => `
        <option value="${aluno.alunoId ?? aluno.id}">
          ${aluno.nome ?? aluno.nomeAluno ?? "Aluno"} - ${aluno.turma ?? "-"}
        </option>
      `).join("")}
    `;

    const alunoIdSalvo = alunoIdSelecionado ?? localStorage.getItem("ocorrenciaAlunoId");

  if (alunoIdSalvo) {
    select.value = alunoIdSalvo;
  }

  } catch (error) {
    console.error(error);

    select.innerHTML = `
      <option value="">Erro ao carregar alunos</option>
    `;
  }
}

async function salvarOcorrenciaProfessor(event) {
  event.preventDefault();

  const ocorrenciaId = event.target.dataset.ocorrenciaId;
const editando = Boolean(ocorrenciaId);

const endpoint = editando
  ? `/professor/ocorrencias/${ocorrenciaId}`
  : "/professor/ocorrencias";

const metodo = editando ? "PUT" : "POST";

  const dto = {
    alunoId: Number(document.getElementById("ocorrenciaAlunoId").value),
    titulo: document.getElementById("ocorrenciaTitulo").value.trim(),
    tipo: String(document.getElementById("ocorrenciaTipo").value).toUpperCase(),
    gravidade: String(document.getElementById("ocorrenciaGravidade").value).toUpperCase(),
    descricao: document.getElementById("ocorrenciaDescricao").value.trim()
  };

  if (!dto.alunoId || !dto.titulo || !dto.tipo || !dto.gravidade || !dto.descricao) {
    alert("Preencha todos os campos.");
    return;
  }

  try {
        await request(endpoint, {
      method: metodo,
      body: JSON.stringify(dto)
    });

    localStorage.removeItem("ocorrenciaAlunoId");
    localStorage.removeItem("ocorrenciaAlunoNome");

    removerModalOcorrencia();

    await carregarOcorrenciasProfessor();

  } catch (error) {
    console.error(error);
    alert("Erro ao salvar ocorrência.");
  }
}

function removerModalOcorrencia() {
  document
    .querySelector(".modal-detalhes-overlay")
    ?.remove();
}

function normalizarClasse(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .replaceAll("_", "-");
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

function formatarData(data) {
  if (!data) return "-";

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return data;
  }

  return dataObj.toLocaleDateString("pt-BR");
}

function aplicarFiltrosOcorrencias() {
  const status = String(
    document.getElementById("filtroStatusOcorrencia")?.value ?? ""
  ).toUpperCase();

  const gravidade = String(
    document.getElementById("filtroGravidadeOcorrencia")?.value ?? ""
  ).toUpperCase();

  const filtradas = ocorrenciasCache.filter(ocorrencia => {
    const statusOcorrencia = String(ocorrencia.status ?? "").toUpperCase();
    const gravidadeOcorrencia = String(ocorrencia.gravidade ?? "").toUpperCase();

    const statusOk = !status || statusOcorrencia === status;
    const gravidadeOk = !gravidade || gravidadeOcorrencia === gravidade;

    return statusOk && gravidadeOk;
  });

  renderizarOcorrenciasProfessor(filtradas);
}

function configurarAcoesOcorrencias() {
  document.querySelectorAll("[data-acao]").forEach(botao => {
    botao.addEventListener("click", () => {
      const id = Number(botao.dataset.id);
      const acao = botao.dataset.acao;

      const ocorrencia = ocorrenciasCache.find(item => item.id === id);

      if (!ocorrencia) return;

      if (acao === "detalhes") {
        abrirModalDetalhesOcorrencia(ocorrencia);
      }

      if (acao === "editar") {
        abrirFormularioOcorrencia(ocorrencia);
      }
    });
  });
}

function abrirModalDetalhesOcorrencia(ocorrencia) {
  removerModalOcorrencia();

  const modal = document.createElement("div");
  modal.className = "modal-detalhes-overlay";

  modal.innerHTML = `
    <div class="modal-detalhes-card">
      <div class="modal-detalhes-header">
        <div>
          <h2>${ocorrencia.titulo ?? "Ocorrência"}</h2>
          <p>Detalhes completos da ocorrência.</p>
        </div>

        <button id="btnFecharDetalhesOcorrencia">
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

        ${
          ocorrencia.respostaGestor
            ? `
              <div class="ocorrencia-descricao-completa resposta-gestor-box">
                <span>Resposta do gestor</span>
                <p>${ocorrencia.respostaGestor}</p>

                ${
                  ocorrencia.dataAtualizacao
                    ? `<small>Atualizado em ${formatarData(ocorrencia.dataAtualizacao)}</small>`
                    : ""
                }
              </div>
            `
            : ""
        }
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("btnFecharDetalhesOcorrencia")
    ?.addEventListener("click", removerModalOcorrencia);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      removerModalOcorrencia();
    }
  });
}

function limitarTexto(texto, limite = 120) {
  if (!texto) return "-";

  if (texto.length <= limite) {
    return texto;
  }

  return `${texto.substring(0, limite)}...`;
}

function podeEditarOcorrencia(ocorrencia) {
  return String(ocorrencia.status ?? "").toUpperCase() === "PENDENTE";
}