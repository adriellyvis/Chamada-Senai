import { validarAutenticacao, preencherDadosUsuario } from "../../core/auth.js";

import { abrirDashboardProfessor } from "./pages/dashboard-professor.js";
import { abrirTurmasProfessor } from "./pages/turmas-professor.js";
import { abrirAlunosProfessor } from "./pages/alunos-professor.js";
import { abrirHistoricoProfessor } from "./pages/historico-professor.js";
import { abrirChamadaProfessor } from "./pages/chamada-professor.js";
import { abrirOcorrenciasProfessor } from "./pages/ocorrencias-professor.js";


carregarTemaSalvo();
const usuario = validarAutenticacao("professor");

if (!usuario) {
  throw new Error("Usuário não autenticado");
}

export function atualizarIcones() {
  if (window.lucide) {
    lucide.createIcons();
  }
}
configurarFooterSidebar();
atualizarIcones();
preencherDadosUsuario(usuario);

function aplicarTemaSalvo() {
  const tema = localStorage.getItem("temaEyeCount") || "light";
  document.documentElement.setAttribute("data-theme", tema);
  const btn = document.getElementById("btnTheme");
  if (btn) btn.innerHTML = tema === "dark" ? `<span class="theme-symbol">☀️</span><strong>Tema claro</strong><span class="footer-arrow">›</span>` : `<span class="theme-symbol">🌙</span><strong>Tema escuro</strong><span class="footer-arrow">›</span>`;
}

function alternarTema() {
  const temaAtual = document.documentElement.getAttribute("data-theme");
  const novoTema = temaAtual === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", novoTema);
  localStorage.setItem("tema-eyecount", novoTema);
}

function carregarTemaSalvo() {
  const temaSalvo = localStorage.getItem("tema-eyecount") || "light";
  document.documentElement.setAttribute("data-theme", temaSalvo);
}

aplicarTemaSalvo();

document.getElementById("btnTheme")?.addEventListener("click", alternarTema);


const rotas = {
  dashboard: abrirDashboardProfessor,
  turmas: abrirTurmasProfessor,
  alunos: abrirAlunosProfessor,
  historico: abrirHistoricoProfessor,
  chamada: abrirChamadaProfessor,
  ocorrencias: abrirOcorrenciasProfessor
};

function ativarMenu(itemAtivo) {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });

  itemAtivo.classList.add("active");
}

document.querySelectorAll("[data-page]").forEach(item => {
  item.addEventListener("click", async event => {
    event.preventDefault();

    const pagina = item.dataset.page;
    const abrirPagina = rotas[pagina];

    if (!abrirPagina) return;

    ativarMenu(item);

    await abrirPagina();
  });
});

document.getElementById("btnLogout")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "../login/area-login-professor.html";
});

window.addEventListener("DOMContentLoaded", async () => {
  const dashboardItem = document.querySelector('[data-page="dashboard"]');

  if (dashboardItem) {
    ativarMenu(dashboardItem);
  }

  await abrirDashboardProfessor();
});

function configurarFooterSidebar() {
  const btnTema = document.getElementById("toggleTemaBtn");
  const btnMenu = document.getElementById("abrirMenuConfig");
  const dropdown = document.getElementById("menuConfigDropdown");

  if (btnTema) {
    btnTema.addEventListener("click", alternarTema);
  }

  if (btnMenu && dropdown) {
    btnMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("aberto");
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && !btnMenu.contains(e.target)) {
        dropdown.classList.remove("aberto");
      }
    });

    dropdown.querySelectorAll("button[data-acao]").forEach(botao => {
      botao.addEventListener("click", async () => {
        const acao = botao.dataset.acao;

        if (acao === "tema") {
          alternarTema();
        }

        if (acao === "logout") {
          fazerLogout();
        }

        if (acao === "perfil") {
          abrirPerfilProfessor?.();
        }

        if (acao === "configuracoes") {
          abrirConfiguracoes?.();
        }

        dropdown.classList.remove("aberto");
      });
    });
  }
}

function fazerLogout() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("token");
  localStorage.removeItem("tema-eyecount");

  window.location.href = "/login/area-login-professor.html";
}