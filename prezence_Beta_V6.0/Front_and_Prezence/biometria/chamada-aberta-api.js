import { request } from "../core/api.js";

export async function buscarChamadaAbertaAluno(usuarioId) {
  if (!usuarioId) {
    const erro = new Error("Sessão não encontrada. Entre novamente.");
    erro.status = 401;
    throw erro;
  }

  return request(`/aluno/chamada-aberta/${usuarioId}`);
}
