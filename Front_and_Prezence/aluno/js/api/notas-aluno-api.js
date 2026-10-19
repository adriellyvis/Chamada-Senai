import { request } from "../../../core/api.js";

export function listarMinhasNotas() {
  return request("/aluno/notas");
}
