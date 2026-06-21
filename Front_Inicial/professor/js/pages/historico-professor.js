import { request } from "../../../core/api.js";

export async function abrirHistoricoProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");

  if (!conteudo) return;

  conteudo.innerHTML = `
    <div class="topbar">
      <div>
        <div class="page-title">Histórico de Aulas</div>
        <div class="page-sub">Acompanhe chamadas abertas, encerradas e canceladas.</div>
      </div>
    </div>

    <div class="historico-card">
      <div class="historico-header">
        <div>
          <h2>Aulas registradas</h2>
          <p>Histórico das chamadas vinculadas às suas turmas.</p>
        </div>
      </div>

      <div class="historico-table-wrap">
        <table class="historico-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Turma</th>
              <th>Data</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody id="historicoBody">
            <tr>
              <td colspan="7">
                <p class="empty-state">Carregando histórico...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  await carregarHistorico();
}

async function carregarHistorico() {
  try {
    const historico = await request("/professor/historico");

    renderizarHistorico(historico || []);

  } catch (err) {
    console.error(err);

    const historicoBody = document.getElementById("historicoBody");

    if (historicoBody) {
      historicoBody.innerHTML = `
        <tr>
          <td colspan="7">
            <p class="empty-state">Erro ao carregar histórico.</p>
          </td>
        </tr>
      `;
    }
  }
}

function renderizarHistorico(historico) {
  const historicoBody = document.getElementById("historicoBody");

  if (!historicoBody) return;

  if (!historico.length) {
    historicoBody.innerHTML = `
      <tr>
        <td colspan="7">
          <p class="empty-state">Nenhuma aula encontrada.</p>
        </td>
      </tr>
    `;
    return;
  }

  historicoBody.innerHTML = historico.map(aula => {
    const status = aula.status ?? "-";
    const statusClasse = normalizarStatusAula(status);

    const aulaEmAndamento = status === "em_andamento";

    const acaoLabel = aulaEmAndamento
      ? "Retomar"
      : "Ver detalhes";

    const acaoTipo = aulaEmAndamento
      ? "retomar"
      : "detalhes";

    return `
      <tr>
        <td>#${aula.id}</td>

        <td>
          <strong>${aula.turma ?? "-"}</strong>
        </td>

        <td>${formatarData(aula.data)}</td>
        <td>${aula.horaInicio ?? "-"}</td>
        <td>${aula.horaFim ?? "-"}</td>

        <td>
          <span class="status-aula ${statusClasse}">
            ${formatarStatusAula(status)}
          </span>
        </td>

        <td>
          <button
            class="historico-acao-btn ${acaoTipo}"
            data-acao-aula="${acaoTipo}"
            data-aula-id="${aula.id}"
          >
            ${acaoLabel}
          </button>
        </td>
      </tr>
    `;
  }).join("");

  adicionarEventosHistorico();
}

function adicionarEventosHistorico() {
  document
    .querySelectorAll("[data-acao-aula]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        const aulaId = botao.dataset.aulaId;
        const acao = botao.dataset.acaoAula;

        if (acao === "retomar") {
          localStorage.setItem("aulaRetomarId", aulaId);

          document
            .querySelector('[data-page="chamada"]')
            ?.click();

          return;
        }

        if (acao === "detalhes") {
        abrirDetalhesAula(aulaId);
      }
      });
    });
}

async function abrirDetalhesAula(aulaId) {
  try {
    const detalhes = await request(`/professor/aula/${aulaId}/detalhes`);

    renderizarModalDetalhesAula(detalhes, aulaId);

  } catch (error) {
    console.error(error);
    alert("Erro ao carregar detalhes da aula.");
  }
}

function renderizarModalDetalhesAula(detalhes, aulaId) {
  removerModalDetalhesAula();

  const modal = document.createElement("div");

  modal.className = "modal-detalhes-overlay";

  modal.innerHTML = `
    <div class="modal-detalhes-card">
      <div class="modal-detalhes-header">
        <div>
          <h2>Detalhes da aula #${aulaId}</h2>
          <p>Lista de alunos e registros de presença.</p>
        </div>

        <button id="btnFecharDetalhesAula">
          ×
        </button>
      </div>

      <div class="modal-detalhes-body">
        ${renderizarConteudoDetalhes(detalhes)}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("btnFecharDetalhesAula")
    ?.addEventListener("click", removerModalDetalhesAula);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      removerModalDetalhesAula();
    }
  });
}

function renderizarConteudoDetalhes(detalhes) {
  const alunos =
    detalhes.alunos ??
    detalhes.presencas ??
    detalhes ??
    [];

  if (!Array.isArray(alunos) || !alunos.length) {
    return `
      <p class="empty-state">
        Nenhum registro encontrado para esta aula.
      </p>
    `;
  }

  return `
    <div class="detalhes-aula-lista">
      ${alunos.map(item => {
        const nome =
          item.nomeAluno ??
          item.nome ??
          item.aluno?.usuario?.nome ??
          "Aluno";

        const matricula =
          item.matricula ??
          item.aluno?.matricula ??
          "-";

        const status =
          item.status ??
          item.presencaStatus ??
          "nao_registrado";

        const classeStatus = normalizarStatusAula(status);

        return `
          <div class="detalhe-aluno-item">
            <div class="detalhe-aluno-info">
              <div class="aluno-avatar">
                ${nome.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>${nome}</strong>
                <span>Matrícula: ${matricula}</span>
              </div>
            </div>

            <span class="status-presenca-detalhe ${classeStatus}">
              ${formatarStatusPresenca(status)}
            </span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function formatarStatusPresenca(status) {
  const mapa = {
    presente: "Presente",
    ausente: "Ausente",
    atrasado: "Atrasado",
    saida_temporaria: "Saída temporária",
    nao_registrado: "Não registrado"
  };

  return mapa[status] ?? status;
}

function removerModalDetalhesAula() {
  document
    .querySelector(".modal-detalhes-overlay")
    ?.remove();
}

function normalizarStatusAula(status) {
  return String(status)
    .toLowerCase()
    .replaceAll("_", "-");
}

function formatarStatusAula(status) {
  const mapa = {
    agendada: "Agendada",
    em_andamento: "Em andamento",
    encerrada: "Encerrada",
    cancelada: "Cancelada"
  };

  return mapa[status] ?? status;
}

function formatarData(data) {
  if (!data) return "-";

  const dataObj = new Date(`${data}T00:00:00`);

  if (Number.isNaN(dataObj.getTime())) {
    return data;
  }

  return dataObj.toLocaleDateString("pt-BR");
}