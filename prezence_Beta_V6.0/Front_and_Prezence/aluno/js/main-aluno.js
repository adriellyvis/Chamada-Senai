import { inicializarFeedbackGlobal } from "../../core/ui-feedback.js";
import { abrirDashboardAluno } from "./pages/dashboard-aluno.js";
import { abrirFrequenciaAluno } from "./pages/frequencia-aluno.js";
import { abrirNotasAluno } from "./pages/notas-aluno.js";
import { abrirChamadaAluno } from "./pages/chamada-aluno.js";
import { abrirAvisosAluno } from "./pages/avisos-aluno.js";
import { abrirAgendaAluno } from "./pages/agenda-aluno.js";
import { abrirPerfilAluno } from "./pages/perfil-aluno.js";
import { abrirConfiguracoesAluno } from "./pages/configuracoes-aluno.js";
import { configurarNotificacoesAluno, atualizarNotificacoesAluno } from "./components/notificacoes-aluno.js";
import { configurarBuscaAluno } from "./components/busca-aluno.js";
import {
  aplicarConfiguracoesInterface,
  alternarTemaInterface,
  deveConfirmarSaida,
  obterConfiguracoes
} from "../../core/configuracoes-ui.js";

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

  notas: {
    id: "page-notas",
    titulo: "MINHAS NOTAS",
    subtitulo: "Acompanhe suas avaliações e médias por disciplina.",
    abrir: abrirNotasAluno
  },

  chamada: {
    id: "page-chamada",
    titulo: "CHAMADA FACIAL",
    subtitulo: "Valide sua presença usando reconhecimento biométrico facial.",
    abrir: abrirChamadaAluno
  },

  avisos: {
    id: "page-avisos",
    titulo: "AVISOS E OCORRÊNCIAS",
    subtitulo: "Acompanhe comunicados, feedbacks e registros acadêmicos.",
    abrir: abrirAvisosAluno
  },

  agenda: {
    id: "page-agenda",
    titulo: "MINHA AGENDA",
    subtitulo: "Consulte os horários das suas aulas durante a semana.",
    abrir: abrirAgendaAluno
  },

  configuracoes: {
    id: "page-configuracoes",
    titulo: "CONFIGURAÇÕES",
    subtitulo: "Personalize o Portal do Aluno.",
    abrir: abrirConfiguracoesAluno
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  inicializarFeedbackGlobal();
  aplicarConfiguracoesInterface("aluno");
  carregarUsuario();
  configurarNavegacao();
  configurarTema();
  configurarMenuPerfil();
  configurarNotificacoesAluno({ navegarPara });
  configurarBuscaAluno({ navegarPara });
  configurarNavegacaoExterna();

  const paginaSessao = sessionStorage.getItem("prezence:aluno:pagina-atual");
  const paginaInicial = paginas[paginaSessao]
    ? paginaSessao
    : obterConfiguracoes("aluno").paginaInicial;

  await navegarPara(paginas[paginaInicial] ? paginaInicial : "dashboard");
});

function configurarNavegacaoExterna() {
  window.addEventListener("aluno:navegar", event => {
    const pagina = event?.detail?.pagina;
    if (!pagina) return;
    navegarPara(pagina);
  });
}

function carregarUsuario() {
  const nomeAluno = document.getElementById("nomeAluno");
  const avatarAluno = document.getElementById("avatarAluno");
  const usuarioSalvo = (sessionStorage.getItem("usuario") || localStorage.getItem("usuario"));

  if (!nomeAluno || !avatarAluno) return;

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
  document.querySelectorAll(".sidebar__item").forEach(botao => {
    botao.addEventListener("click", () => {
      navegarPara(botao.dataset.page);
    });
  });
}

async function navegarPara(nomePagina) {
  const config = paginas[nomePagina];
  if (!config) return;

  window.dispatchEvent(new CustomEvent("prezence:aluno:pagina-alterada", {
    detail: { pagina: nomePagina }
  }));

  sessionStorage.setItem("prezence:aluno:pagina-atual", nomePagina);

  document.querySelectorAll(".sidebar__item").forEach(botao => {
    botao.classList.toggle("is-active", botao.dataset.page === nomePagina);
  });

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("is-active");
  });

  const paginaAtual = document.getElementById(config.id);
  if (!paginaAtual) return;

  paginaAtual.classList.add("is-active");

  const titulo = document.getElementById("tituloPagina");
  const subtitulo = document.getElementById("subtituloPagina");
  if (titulo) titulo.textContent = config.titulo;
  if (subtitulo) subtitulo.textContent = config.subtitulo;

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

  btnAbrirPerfilAluno?.addEventListener("click", () => {
    navegarPara("perfil");
  });

  if (!btnMenuPerfil || !menuDropdown) return;

  btnMenuPerfil.addEventListener("click", event => {
    event.stopPropagation();
    menuDropdown.classList.toggle("is-open");
  });

  document.addEventListener("click", event => {
    if (!menuDropdown.contains(event.target) && event.target !== btnMenuPerfil) {
      menuDropdown.classList.remove("is-open");
    }
  });

  btnPerfil?.addEventListener("click", () => {
    navegarPara("perfil");
    menuDropdown.classList.remove("is-open");
  });

  btnConfiguracoes?.addEventListener("click", () => {
    navegarPara("configuracoes");
    menuDropdown.classList.remove("is-open");
  });

  btnLogout?.addEventListener("click", sairAluno);
}

function configurarTema() {
  document.getElementById("btnTemaSwitch")?.addEventListener("click", () => {
    alternarTemaInterface("aluno");
  });
}

function sairAluno() {
  if (
    deveConfirmarSaida("aluno") &&
    !window.confirm("Deseja sair do portal do aluno?")
  ) {
    return;
  }

  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
  localStorage.removeItem("usuarioLogado");
  sessionStorage.removeItem("usuarioLogado");
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  sessionStorage.clear();
  window.location.href = "../login/area-login-aluno.html";
}
