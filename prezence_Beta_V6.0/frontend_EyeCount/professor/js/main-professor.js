import { validarAutenticacao, preencherDadosUsuario } from "../../core/auth.js";
import {
  aplicarConfiguracoesInterface,
  alternarTemaInterface,
  deveConfirmarSaida,
  obterConfiguracoes
} from "../../core/configuracoes-ui.js";

import { abrirDashboardProfessor } from "./pages/dashboard-professor.js";
import { abrirTurmasProfessor } from "./pages/turmas-professor.js";
import { abrirAlunosProfessor } from "./pages/alunos-professor.js";
import { abrirNotasProfessor } from "./pages/notas-professor.js";
import { abrirHistoricoProfessor } from "./pages/historico-professor.js";
import { abrirChamadaProfessor } from "./pages/chamada-professor.js";
import { abrirOcorrenciasProfessor } from "./pages/ocorrencias-professor.js";
import { abrirPerfilProfessor } from "./pages/perfil-professor.js";
import { abrirConfiguracoesProfessor } from "./pages/configuracoes-professor.js";
import {
  configurarNotificacoesProfessor,
  atualizarIndicadorNotificacoes
} from "./components/notificacoes-professor.js";
import { configurarBuscaGlobalProfessor } from "./components/busca-global-professor.js";

const usuario = validarAutenticacao("professor");

if (!usuario) {
  throw new Error("Usuário não autenticado");
}

aplicarConfiguracoesInterface("professor");
preencherDadosUsuario(usuario);
configurarNotificacoesProfessor();
configurarFooterSidebar();

export function atualizarIcones() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

const rotas = {
  perfil: abrirPerfilProfessor,
  dashboard: abrirDashboardProfessor,
  turmas: abrirTurmasProfessor,
  alunos: abrirAlunosProfessor,
  notas: abrirNotasProfessor,
  historico: abrirHistoricoProfessor,
  chamada: abrirChamadaProfessor,
  ocorrencias: abrirOcorrenciasProfessor,
  configuracoes: abrirConfiguracoesProfessor
};

function ativarMenu(itemAtivo = null) {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });

  itemAtivo?.classList.add("active");
}

async function navegarPara(pagina, itemAtivo = null) {
  const abrirPagina = rotas[pagina];
  if (!abrirPagina) return;

  ativarMenu(itemAtivo);
  await abrirPagina();
  configurarBuscaGlobalProfessor({ navegarPara: navegarPelaBuscaGlobal });
  await atualizarIndicadorNotificacoes();
  atualizarIcones();
}

async function navegarPelaBuscaGlobal(pagina) {
  const itemMenu = document.querySelector(`[data-page="${pagina}"]`);
  await navegarPara(pagina, itemMenu);
}

document.querySelectorAll("[data-page]").forEach(item => {
  item.addEventListener("click", async event => {
    event.preventDefault();
    await navegarPara(item.dataset.page, item);
  });
});

document.getElementById("btnAbrirPerfilProfessor")?.addEventListener("click", async () => {
  await navegarPara("perfil");
});

document.getElementById("btnLogout")?.addEventListener("click", fazerLogout);

window.addEventListener("professor:navegar", async event => {
  const pagina = event?.detail?.pagina;
  if (!pagina) return;
  const itemMenu = document.querySelector(`[data-page="${pagina}"]`);
  await navegarPara(pagina, itemMenu);
});

window.addEventListener("DOMContentLoaded", async () => {
  atualizarIcones();

  const paginaInicial = obterConfiguracoes("professor").paginaInicial;
  const paginaValida = rotas[paginaInicial] ? paginaInicial : "dashboard";
  const itemMenu = document.querySelector(`[data-page="${paginaValida}"]`);

  await navegarPara(paginaValida, itemMenu);
});

function configurarFooterSidebar() {
  const btnTema = document.getElementById("toggleTemaBtn");
  const btnMenu = document.getElementById("abrirMenuConfig");
  const dropdown = document.getElementById("menuConfigDropdown");

  btnTema?.addEventListener("click", () => {
    alternarTemaInterface("professor");
  });

  if (!btnMenu || !dropdown) return;

  btnMenu.addEventListener("click", event => {
    event.stopPropagation();
    dropdown.classList.toggle("aberto");
  });

  document.addEventListener("click", event => {
    if (!dropdown.contains(event.target) && !btnMenu.contains(event.target)) {
      dropdown.classList.remove("aberto");
    }
  });

  dropdown.querySelectorAll("button[data-acao]").forEach(botao => {
    botao.addEventListener("click", async () => {
      const acao = botao.dataset.acao;

      if (acao === "logout") {
        fazerLogout();
      } else if (acao === "perfil") {
        await navegarPara("perfil");
      } else if (acao === "configuracoes") {
        await navegarPara("configuracoes");
      }

      dropdown.classList.remove("aberto");
    });
  });
}

function fazerLogout() {
  if (
    deveConfirmarSaida("professor") &&
    !window.confirm("Deseja sair do Portal do Professor?")
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
  window.location.href = "../login/area-login-professor.html";
}
