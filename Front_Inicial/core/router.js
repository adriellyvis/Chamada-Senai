import { abrirDashboard } from "../gestor/js/dashboard/dashboard.js";
import { abrirAlunos } from "../gestor/js/alunos/alunos.js";
import { abrirTurmas } from "../gestor/js/turmas/turmas.js";
import { abrirOcorrencias } from "../gestor/js/ocorrencias/ocorrencias.js";

export function iniciarRouter() {

  document
    .getElementById("menuDashboard")
    ?.addEventListener("click", function () {
      abrirDashboard(this);
    });

  document
    .getElementById("menuAlunos")
    ?.addEventListener("click", function () {
      abrirAlunos(this);
    });

  document
    .getElementById("menuTurmas")
    ?.addEventListener("click", function () {
      abrirTurmas(this);
    });

  document
    .getElementById("menuOcorrencias")
    ?.addEventListener("click", function () {
      abrirOcorrencias(this);
    });

}