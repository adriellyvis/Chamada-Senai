const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

function obterTokenSessao() {
  try {
    return JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario")))?.token || null;
  } catch {
    return null;
  }
}

export async function buscarChamadaAbertaAluno(usuarioId) {
  const token = obterTokenSessao();

  if (!usuarioId || !token) {
    throw new Error("Sessão não encontrada. Entre novamente.");
  }

  let resposta;

  try {
    resposta = await fetch(`${API_URL}/aluno/chamada-aberta/${usuarioId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
  } catch (erroOriginal) {
    const erro = new Error("Não foi possível consultar a chamada agora. Verifique a conexão com o servidor.");
    erro.status = 0;
    erro.causa = erroOriginal;
    throw erro;
  }

  const texto = await resposta.text();

  let dados = null;

  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    const erro = new Error(
      dados?.mensagem ||
      dados?.message ||
      texto ||
      "Nenhuma chamada aberta encontrada."
    );

    erro.status = resposta.status;
    erro.dados = dados;
    throw erro;
  }

  return dados;
}
