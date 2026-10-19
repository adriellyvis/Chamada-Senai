import { abrirDashboard } from "../gestor/js/dashboard/dashboard.js";
import { abrirAlunos } from "../gestor/js/alunos/alunos.js";
import { abrirTurmas } from "../gestor/js/turmas/turmas.js";
import { abrirOcorrencias } from "../gestor/js/ocorrencias/ocorrencias.js";

export function iniciarRouter() {

  document
    .getElementById("menuDashboard")
    ?.addEventListener("click", function () {
      sessionStorage.setItem("prezence:gestor:pagina-atual", "dashboard");
      abrirDashboard(this);
    });

  document
    .getElementById("menuAlunos")
    ?.addEventListener("click", function () {
      sessionStorage.setItem("prezence:gestor:pagina-atual", "alunos");
      abrirAlunos(this);
    });

  document
    .getElementById("menuTurmas")
    ?.addEventListener("click", function () {
      sessionStorage.setItem("prezence:gestor:pagina-atual", "turmas");
      abrirTurmas(this);
    });

  document
    .getElementById("menuOcorrencias")
    ?.addEventListener("click", function () {
      sessionStorage.setItem("prezence:gestor:pagina-atual", "ocorrencias");
      abrirOcorrencias(this);
    });

}
