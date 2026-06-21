const API_URL = "http://localhost:8080";

function obterUsuarioId() {
  const usuarioSalvo = localStorage.getItem("usuario");

  if (!usuarioSalvo) return null;

  try {
    const usuario = JSON.parse(usuarioSalvo);
    return usuario.id;
  } catch {
    return null;
  }
}

export async function listarPresencasDaAula(aulaId) {
  if (!aulaId) {
    throw new Error("Aula não informada.");
  }

  const usuarioId = obterUsuarioId();

  if (!usuarioId) {
    throw new Error("Usuário logado não encontrado.");
  }

  const resposta = await fetch(`${API_URL}/professor/aulas/${aulaId}/presencas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "usuario-id": usuarioId
    }
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.mensagem || "Erro ao buscar presenças da aula.");
  }

  return dados;
}