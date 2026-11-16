import { marcarMenuAtivo, getConteudoPrincipal } from "../../../core/spa.js";
import { obterUsuarioAutenticado } from "../../../core/auth.js";
import { abrirAgendaEscolar } from "../../../core/agenda-escolar.js";

export async function abrirAgendaGestor(elemento = null) {
  marcarMenuAtivo(elemento);
  return abrirAgendaEscolar({
    perfil: "gestor",
    usuario: obterUsuarioAutenticado(),
    container: getConteudoPrincipal()
  });
}
