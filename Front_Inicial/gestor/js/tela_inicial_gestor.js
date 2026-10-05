import { validarAutenticacao, preencherDadosUsuario } from "../../core/auth.js";
import { iniciarRouter } from "../../core/router.js";
import {
  aplicarConfiguracoesInterface,
  alternarTemaInterface,
  deveConfirmarSaida,
  obterConfiguracoes
} from "../../core/configuracoes-ui.js";
import { abrirDashboard } from "./dashboard/dashboard.js";
import { iniciarBuscaGlobalGestor } from "./busca/busca-global.js";
import { abrirDisciplinas } from "./disciplinas/disciplinas.js";
import { abrirPerfilGestor } from "./perfil/perfil-gestor.js";
import { abrirConfiguracoesGestor } from "./configuracoes/configuracoes-gestor.js";
import {
  configurarNotificacoesGestor,
  atualizarIndicadorNotificacoesGestor
} from "./components/notificacoes-gestor.js";

const usuario = validarAutenticacao("gestor");

if (usuario) {
  aplicarConfiguracoesInterface("gestor");
  preencherDadosUsuario(usuario);
  configurarNotificacoesGestor();
  configurarTemaGestor();
  configurarMenuConfiguracoes();
  iniciarRouter();

  document
    .getElementById("btnAbrirPerfilGestor")
    ?.addEventListener("click", () => {
      abrirPerfilGestor(null);
      fecharMenuConfiguracoes();
    });

  document
    .getElementById("menuDisciplinas")
    ?.addEventListener("click", event => {
      abrirDisciplinas(event.currentTarget);
    });

  document
    .getElementById("btnPerfil")
    ?.addEventListener("click", () => {
      abrirPerfilGestor(null);
      fecharMenuConfiguracoes();
    });

  document
    .getElementById("btnConfiguracoes")
    ?.addEventListener("click", () => {
      abrirConfiguracoesGestor(null);
      fecharMenuConfiguracoes();
    });

  document
    .getElementById("btnLogout")
    ?.addEventListener("click", realizarLogout);

  abrirPaginaInicialGestor();
  iniciarBuscaGlobalGestor();
}

function abrirPaginaInicialGestor() {
  const paginaInicial = obterConfiguracoes("gestor").paginaInicial;
  const elementos = {
    dashboard: "menuDashboard",
    turmas: "menuTurmas",
    alunos: "menuAlunos",
    ocorrencias: "menuOcorrencias",
    disciplinas: "menuDisciplinas"
  };

  if (paginaInicial === "configuracoes") {
    abrirConfiguracoesGestor(null);
    return;
  }

  const alvo = document.getElementById(elementos[paginaInicial] || "menuDashboard");
  alvo?.click();
}

function configurarMenuConfiguracoes() {
  const btnConfig = document.getElementById("btnConfig");
  const menuConfig = document.getElementById("menuConfig");

  if (!btnConfig || !menuConfig) return;

  btnConfig.setAttribute("aria-haspopup", "true");
  btnConfig.setAttribute("aria-expanded", "false");
  menuConfig.setAttribute("aria-hidden", "true");

  btnConfig.addEventListener("click", event => {
    event.stopPropagation();
    definirMenuConfiguracoesAberto(!menuConfig.classList.contains("ativo"));
  });

  menuConfig.addEventListener("click", event => {
    event.stopPropagation();
  });

  document.addEventListener("click", fecharMenuConfiguracoes);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      fecharMenuConfiguracoes();
      btnConfig.focus();
    }
  });
}

function definirMenuConfiguracoesAberto(aberto) {
  const btnConfig = document.getElementById("btnConfig");
  const menuConfig = document.getElementById("menuConfig");

  menuConfig?.classList.toggle("ativo", aberto);
  menuConfig?.setAttribute("aria-hidden", String(!aberto));
  btnConfig?.setAttribute("aria-expanded", String(aberto));
}

function fecharMenuConfiguracoes() {
  definirMenuConfiguracoesAberto(false);
}

function configurarTemaGestor() {
  document.getElementById("btnTema")?.addEventListener("click", () => {
    alternarTemaInterface("gestor");
    fecharMenuConfiguracoes();
  });
}

function realizarLogout() {
  if (
    deveConfirmarSaida("gestor") &&
    !window.confirm("Deseja sair do Portal do Gestor?")
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
  window.location.href = "../index.html";
}

window.addEventListener("eyecount:configuracoes-atualizadas", event => {
  if (event?.detail?.perfil === "gestor") {
    atualizarIndicadorNotificacoesGestor({ forcar: true });
  }
});

window.logout = realizarLogout;
