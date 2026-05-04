const historicoBody = document.getElementById("historicoBody");

// usuário logado
const usuario = JSON.parse(localStorage.getItem("usuario"));


if (!usuario) {
  alert("Usuário não encontrado. Faça login novamente.");
  window.location.href = "/professor/area-login-professor.html";
}

window.addEventListener("DOMContentLoaded", carregarHistorico);

async function carregarHistorico() {
  try {
    const response = await fetch(`http://localhost:8080/professor/historico/${usuario.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "usuario-id": usuario.id
      }
    });

    if (!response.ok) {
      const erro = await response.text();
      throw new Error(erro);
    }

    const historico = await response.json();

    renderizarHistorico(historico);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar histórico: " + err.message);
  }
}

function renderizarHistorico(historico) {
  historicoBody.innerHTML = "";

  if (historico.length === 0) {
    historicoBody.innerHTML = `
      <tr>
        <td colspan="7">Nenhuma aula encontrada</td>
      </tr>
    `;
    return;
  }

  historico.forEach(aula => {
  const statusHtml = aula.status === "em_andamento"
    ? "Em andamento"
    : "Encerrada";

  const acoesHtml = aula.status === "em_andamento"
    ? `<button onclick="retomarChamada(${aula.id})">Retomar</button>`
    : `<button onclick="verDetalhes(${aula.id})">Ver detalhes</button>`;

  historicoBody.innerHTML += `
    <tr>
      <td>${aula.id}</td>
      <td>${aula.turma}</td>
      <td>${aula.data}</td>
      <td>${aula.horaInicio ?? "-"}</td>
      <td>${aula.horaFim ?? "-"}</td>
      <td>${statusHtml}</td>
      <td>${acoesHtml}</td>
    </tr>
    `;
  });
}

function retomarChamada(aulaId) {
  localStorage.setItem("aulaRetomarId", aulaId);
  window.location.href = "/professor/chamada-professor.html";
}

function verDetalhes(aulaId) {
  localStorage.setItem("aulaDetalheId", aulaId);
  window.location.href = "/professor/detalhes-aula.html";
}