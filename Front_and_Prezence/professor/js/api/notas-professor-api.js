import { request } from "../../../core/api.js";

export function listarVinculosProfessorNotas() {
  return request("/professor/turmas");
}

export function listarAlunosProfessorNotas(turmaId) {
  const query = turmaId ? `?turmaId=${encodeURIComponent(turmaId)}` : "";
  return request(`/professor/alunos${query}`);
}

export function listarNotasVinculo(turmaDisciplinaId) {
  return request(`/professor/notas/vinculo/${turmaDisciplinaId}`);
}

export function cadastrarNotaProfessor(dados) {
  return request("/professor/notas", {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

export function atualizarNotaProfessor(notaId, dados) {
  return request(`/professor/notas/${notaId}`, {
    method: "PUT",
    body: JSON.stringify(dados)
  });
}

export function excluirNotaProfessor(notaId) {
  return request(`/professor/notas/${notaId}`, {
    method: "DELETE"
  });
}
