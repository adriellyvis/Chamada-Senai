import { request } from "./api.js";

export async function listarAvisosAluno(usuarioId) {
  if (!usuarioId) return [];
  return request(`/aluno/avisos/${usuarioId}`);
}

export async function marcarAvisoAlunoComoLido(avisoId) {
  if (!avisoId) return null;
  return request(`/aluno/avisos/${avisoId}/lido`, {
    method: "PATCH"
  });
}

export async function marcarTodosAvisosAlunoComoLidos(usuarioId) {
  if (!usuarioId) return null;
  return request(`/aluno/avisos/lidos/${usuarioId}`, {
    method: "PATCH"
  });
}

export async function enviarAvisoGestor(dados) {
  return request("/gestor/avisos", {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

export async function enviarFeedbackProfessor(dados) {
  return request("/professor/avisos", {
    method: "POST",
    body: JSON.stringify(dados)
  });
}
