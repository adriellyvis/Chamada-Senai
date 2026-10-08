import { request } from "../core/api.js";

/**
 * A biometria não cria presença definitiva.
 * Ela cria uma solicitação para o professor confirmar na chamada.
 */
export async function solicitarConfirmacaoPresencaBiometrica({
  alunoId,
  aulaId
}) {
  const alunoIdNumerico = Number(alunoId);
  const aulaIdNumerico = Number(aulaId);

  if (!alunoIdNumerico || !aulaIdNumerico) {
    throw new Error("Aluno ou aula não informado.");
  }

  return request("/biometria/presenca/solicitar", {
    method: "POST",
    body: JSON.stringify({
      alunoId: alunoIdNumerico,
      aulaId: aulaIdNumerico
    })
  });
}

/**
 * Restaura o estado da tela após recarregar a página e permite ao aluno
 * acompanhar PENDENTE / CONFIRMADA / RECUSADA sem repetir a biometria.
 */
export async function consultarStatusConfirmacaoBiometrica({ aulaId }) {
  const aulaIdNumerico = Number(aulaId);

  if (!aulaIdNumerico) {
    throw new Error("Aula não informada.");
  }

  return request(
    `/biometria/presenca/status?aulaId=${encodeURIComponent(aulaIdNumerico)}`,
    { method: "GET" }
  );
}
