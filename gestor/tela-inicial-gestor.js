function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme");
  html.setAttribute("data-theme", current === "dark" ? "light" : "dark");
}

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || usuario.perfil?.toLowerCase() !== "gestor") {
  localStorage.removeItem("usuario");
  alert("Acesso não permitido.");
  window.location.href = "/gestor/area-login-gestor.html";
}

    window.addEventListener("DOMContentLoaded", async () => {
    await carregarDashboard();
    await carregarAlertasEvasao();
    });


window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nomeGestor").textContent = usuario.nome;
  carregarDashboard();
});

async function carregarDashboard() {
  try {
    const response = await fetch("http://localhost:8080/gestor/dashboard", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "usuario-id": usuario.id
      }
    });

    if (!response.ok) {
      throw new Error("Erro ao carregar dashboard");
    }

    const data = await response.json();

    document.getElementById("mediaTurma").textContent = `${data.mediaTurma ?? 0}%`;
    document.getElementById("totalAlunos").textContent = data.totalAlunos ?? 0;
    document.getElementById("aulasDadas").textContent = data.aulasDadas ?? 0;
    document.getElementById("alertasEvasao").textContent = data.alertasEvasao ?? 0;

    document.getElementById("sensoresOnline").textContent = data.sensoresOnline ?? 0;
    document.getElementById("sensoresAtencao").textContent = data.sensoresAtencao ?? 0;
    document.getElementById("sensoresOffline").textContent = data.sensoresOffline ?? 0;

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar dashboard");
  }
}

    async function carregarAlertasEvasao() {
    try {
        const response = await fetch("http://localhost:8080/gestor/alertas-evasao", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "usuario-id": usuario.id
        }
        });

        if (!response.ok) {
        throw new Error("Erro ao carregar alertas");
        }

        const alertas = await response.json();
        renderizarAlertas(alertas);

    } catch (err) {
        console.error(err);
        document.getElementById("alertsList").innerHTML = `
        <div class="alert-item yellow">
            <div class="alert-info">
            <div class="alert-name">Erro ao carregar alertas</div>
            </div>
        </div>
        `;
    }
}

function renderizarAlertas(alertas) {
  const alertsList = document.getElementById("alertsList");
  alertsList.innerHTML = "";

  if (!alertas || alertas.length === 0) {
    alertsList.innerHTML = `
      <div class="alert-item">
        <div class="alert-info">
          <div class="alert-name">Nenhum alerta de evasão</div>
          <div class="alert-sub">Todos os alunos estão dentro da frequência mínima.</div>
        </div>
      </div>
    `;
    return;
  }

  alertas.forEach(alerta => {
    const classeRisco = alerta.risco === "alto" ? "red" : "yellow";
    const icone = alerta.risco === "alto" ? "🚨" : "⚠️";

    alertsList.innerHTML += `
      <div class="alert-item ${classeRisco}">
        <div class="alert-icon">${icone}</div>
        <div class="alert-info">
          <div class="alert-name">${alerta.nome} <span>#${alerta.matricula}</span></div>
          <div class="alert-sub">Presença: <b>${alerta.frequencia}%</b> · Mínimo: 75%</div>
        </div>
        <button class="notif-action-btn">NOTIFICAR</button>
      </div>
    `;
  });
}