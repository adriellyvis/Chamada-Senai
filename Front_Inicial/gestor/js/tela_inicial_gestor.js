import { validarAutenticacao, preencherDadosUsuario } from "../../core/auth.js";
import { iniciarRouter } from "../../core/router.js";
import { abrirDashboard } from "./dashboard/dashboard.js";
import { iniciarBuscaGlobalGestor } from "./busca/busca-global.js";
import { abrirDisciplinas } from "./disciplinas/disciplinas.js";
import { abrirPerfilGestor } from "./perfil/perfil-gestor.js";

const usuario = validarAutenticacao("gestor");

if (usuario) {
  preencherDadosUsuario(usuario);

  iniciarRouter();

  document
    .getElementById("btnAbrirPerfilGestor")
    ?.addEventListener("click", () => {
      abrirPerfilGestor(null);
    });

  document
    .getElementById("menuDashboard")
    ?.addEventListener("click", event => {
      abrirDashboard(event.currentTarget);
    });

  document
    .getElementById("menuDisciplinas")
    ?.addEventListener("click", event => {
      abrirDisciplinas(event.currentTarget);
    });

  abrirDashboard(
    document.getElementById("menuDashboard")
  );

  iniciarBuscaGlobalGestor();

  document.getElementById("btnPerfil")?.addEventListener("click", () => {
    abrirPerfilGestor(null);
    document.getElementById("menuConfig")?.classList.remove("ativo");
  });
}

window.logout = function () {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/index.html";
};