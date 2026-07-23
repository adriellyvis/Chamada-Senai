import { abrirDashboardAluno } from "./pages/dashboard-aluno.js";
import { abrirFrequenciaAluno } from "./pages/frequencia-aluno.js";
import { abrirChamadaAluno } from "./pages/chamada-aluno.js";
import { abrirAvisosAluno } from "./pages/avisos-aluno.js";
import { abrirPerfilAluno } from "./pages/perfil-aluno.js";
import { configurarNotificacoesAluno, atualizarNotificacoesAluno } from "./components/notificacoes-aluno.js";
import { configurarBuscaAluno } from "./components/busca-aluno.js";

const paginas = {
  perfil: {
    id: "page-perfil",
    titulo: "MEU PERFIL",
    subtitulo: "Revise seus dados e prepare seu cadastro biométrico facial.",
    abrir: abrirPerfilAluno
  },

  dashboard: {
    id: "page-dashboard",
    titulo: "MEU DESEMPENHO",
    subtitulo: "Aqui está o seu processo avaliativo acadêmico!",
    abrir: abrirDashboardAluno
  },

  frequencia: {
    id: "page-frequencia",
    titulo: "FREQUÊNCIAS",
    subtitulo: "Consulte suas presenças, faltas e atrasos.",
    abrir: abrirFrequenciaAluno
  },

  chamada: {
    id: "page-chamada",
    titulo: "CHAMADA FACIAL",
    subtitulo: "Valide sua presença usando reconhecimento biométrico facial.",
    abrir: abrirChamadaAluno
  },

  avisos: {
    id: "page-avisos",
    titulo: "AVISOS",
    subtitulo: "Veja comunicados importantes da escola.",
    abrir: abrirAvisosAluno
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  configurarNavegacao();
  configurarTema();
  configurarMenuPerfil();
  configurarNotificacoesAluno({ navegarPara });
  configurarBuscaAluno({ navegarPara });

  await navegarPara("dashboard");
});

function carregarUsuario() {
  const nomeAluno = document.getElementById("nomeAluno");
  const avatarAluno = document.getElementById("avatarAluno");

  const usuarioSalvo = localStorage.getItem("usuario");

  if (!usuarioSalvo) {
    nomeAluno.textContent = "Aluno";
    avatarAluno.textContent = "A";
    return;
  }

  try {
    const usuario = JSON.parse(usuarioSalvo);
    const nome = usuario.nome || "Aluno";

    nomeAluno.textContent = nome;
    avatarAluno.textContent = nome.charAt(0).toUpperCase();
  } catch (error) {
    console.error("Erro ao carregar usuário:", error);
    nomeAluno.textContent = "Aluno";
    avatarAluno.textContent = "A";
  }
}

function configurarNavegacao() {
  const botoes = document.querySelectorAll(".sidebar__item");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      navegarPara(botao.dataset.page);
    });
  });
}

async function navegarPara(nomePagina) {
  const config = paginas[nomePagina];

  if (!config) return;

  document.querySelectorAll(".sidebar__item").forEach((botao) => {
    botao.classList.toggle("is-active", botao.dataset.page === nomePagina);
  });

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("is-active");
  });

  const paginaAtual = document.getElementById(config.id);
  paginaAtual.classList.add("is-active");

  document.getElementById("tituloPagina").textContent = config.titulo;
  document.getElementById("subtituloPagina").textContent = config.subtitulo;

  await config.abrir(paginaAtual);
  await atualizarNotificacoesAluno();
}

function configurarMenuPerfil() {
  const btnMenuPerfil = document.getElementById("btnMenuPerfil");
  const menuDropdown = document.getElementById("menuPerfilDropdown");
  const btnPerfil = document.getElementById("btnPerfil");
  const btnConfiguracoes = document.getElementById("btnConfiguracoes");
  const btnLogout = document.getElementById("btnLogout");
  const btnAbrirPerfilAluno = document.getElementById("btnAbrirPerfilAluno");

  if (btnAbrirPerfilAluno) {
    btnAbrirPerfilAluno.addEventListener("click", () => {
      navegarPara("perfil");
    });
  }

  if (!btnMenuPerfil || !menuDropdown) return;

  btnMenuPerfil.addEventListener("click", (event) => {
    event.stopPropagation();
    menuDropdown.classList.toggle("is-open");
  });

  document.addEventListener("click", (event) => {
    if (!menuDropdown.contains(event.target) && event.target !== btnMenuPerfil) {
      menuDropdown.classList.remove("is-open");
    }
  });

  if (btnPerfil) {
    btnPerfil.addEventListener("click", () => {
      navegarPara("perfil");
      menuDropdown.classList.remove("is-open");
    });
  }

  if (btnConfiguracoes) {
    btnConfiguracoes.addEventListener("click", () => {
      alert("Configurações em construção.");
      menuDropdown.classList.remove("is-open");
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      const confirmar = confirm("Deseja sair do portal do aluno?");
      if (!confirmar) return;

      localStorage.removeItem("usuario");
      window.location.href = "/login/area-login-aluno.html";
    });
  }
}
function configurarTema() {
  const btnTemaSwitch = document.getElementById("btnTemaSwitch");

  const temaSalvo = localStorage.getItem("tema-aluno");

  if (temaSalvo) {
    document.documentElement.setAttribute("data-theme", temaSalvo);
  }

  const alternar = () => {
    const html = document.documentElement;
    const atual = html.getAttribute("data-theme");
    const novo = atual === "dark" ? "light" : "dark";

    html.setAttribute("data-theme", novo);
    localStorage.setItem("tema-aluno", novo);
  };

  if (btnTemaSwitch) {
    btnTemaSwitch.addEventListener("click", alternar);
  }
}
