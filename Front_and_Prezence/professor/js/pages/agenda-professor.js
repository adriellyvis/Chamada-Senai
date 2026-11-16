import { obterUsuarioAutenticado } from "../../../core/auth.js";
import { abrirAgendaEscolar } from "../../../core/agenda-escolar.js";

export async function abrirAgendaProfessor() {
  return abrirAgendaEscolar({
    perfil: "professor",
    usuario: obterUsuarioAutenticado(),
    container: document.getElementById("conteudoPrincipal")
  });
}
