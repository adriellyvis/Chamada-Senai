const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

export async function buscarChamadaAbertaAluno(usuarioId) {
  if (!usuarioId) {
    throw new Error("Usuário logado não encontrado.");
  }

  const resposta = await fetch(`${API_URL}/aluno/chamada-aberta/${usuarioId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
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
      "Nenhuma chamada aberta encontrada."
    );
  }

  return dados;
}