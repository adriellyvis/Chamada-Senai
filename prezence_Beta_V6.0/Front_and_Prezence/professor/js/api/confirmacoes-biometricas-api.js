import { request } from "../../../core/api.js";

export async function buscarConfirmacoesBiometricasPendentes() {
  const resposta = await request("/professor/biometria/pendentes");

  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta?.itens)) return resposta.itens;
  if (Array.isArray(resposta?.solicitacoes)) return resposta.solicitacoes;
  if (Array.isArray(resposta?.pendentes)) return resposta.pendentes;

  return [];
}

export async function confirmarSolicitacaoBiometrica(solicitacaoId) {
  const id = Number(solicitacaoId);
  if (!id) throw new Error("Solicitação biométrica inválida.");

  return request(`/professor/biometria/${id}/confirmar`, {
    method: "PATCH"
  });
}

export async function recusarSolicitacaoBiometrica(solicitacaoId) {
  const id = Number(solicitacaoId);
  if (!id) throw new Error("Solicitação biométrica inválida.");

  return request(`/professor/biometria/${id}/recusar`, {
    method: "PATCH"
  });
}
