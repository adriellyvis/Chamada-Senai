const API_URL = "http://localhost:8080";

export async function registrarPresencaBiometrica({ alunoId, aulaId }) {
  if (!alunoId || !aulaId) {
    throw new Error("Aluno ou aula não informado.");
  }

  const resposta = await fetch(`${API_URL}/presencas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      alunoId,
      aulaId,
      status: "PRESENTE",
      metodo: "BIOMETRIA"
    })
  });

  const texto = await resposta.text();

  let dados = null;

  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.mensagem ||
      dados?.message ||
      texto ||
      "Erro ao registrar presença biométrica."
    );
  }

  return dados;
}