const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

const detalhesBody = document.getElementById("detalhesBody");
const btnVoltar = document.getElementById("btnVoltar");

const usuario = JSON.parse(localStorage.getItem("usuario"));
const aulaDetalheId = localStorage.getItem("aulaDetalheId");

if (!usuario) {
  alert("Usuário não encontrado. Faça login novamente.");
  window.location.href = "/professor/area-login-professor.html";
}

if (!aulaDetalheId) {
  alert("Aula não encontrada.");
  window.location.href = "/professor/historico-professor.html";
}

btnVoltar.addEventListener("click", () => {
  localStorage.removeItem("aulaDetalheId");
  window.location.href = "/professor/historico-professor.html";
});

window.addEventListener("DOMContentLoaded", carregarDetalhes);

async function carregarDetalhes() {
  try {
    const response = await fetch(`${API_URL}/professor/aula/${aulaDetalheId}/detalhes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "usuario-id": usuario.id
      }
    });

    if (!response.ok) {
      throw new Error("Erro ao carregar detalhes da aula");
    }

    const detalhes = await response.json();
    renderizarDetalhes(detalhes);

  } catch (err) {
  console.error(err);
  localStorage.removeItem("aulaDetalheId");
  alert("Erro ao carregar detalhes da aula");
  window.location.href = "/professor/historico-professor.html";
}
}

function renderizarDetalhes(detalhes) {
  detalhesBody.innerHTML = "";

  if (detalhes.length === 0) {
    detalhesBody.innerHTML = `
      <tr>
        <td colspan="4">Nenhum registro encontrado</td>
      </tr>
    `;
    return;
  }

  detalhes.forEach(item => {
  detalhesBody.innerHTML += `
    <tr>
      <td>${item.nomeAluno}</td>
      <td>${formatarStatus(item.status)}</td>
      <td>${formatarHorario(item.horarioRegistro)}</td>
      <td>${formatarMetodo(item.metodo)}</td>
    </tr>
  `;
});
}

function formatarStatus(status) {
  if (!status) return "-";

  const mapa = {
    presente: "Presente",
    ausente: "Ausente",
    atrasado: "Atrasado"
  };

  return mapa[status.toLowerCase()] || status;
}

function formatarMetodo(metodo) {
  if (!metodo) return "-";

  const mapa = {
    manual: "Manual",
    biometria: "Biometria"
  };

  return mapa[metodo.toLowerCase()] || metodo;
}

function formatarHorario(dataHora) {
  if (!dataHora) return "-";

  return new Date(dataHora).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}