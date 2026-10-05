const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

function obterUsuarioSessao() {
  const usuarioSalvo = (sessionStorage.getItem("usuario") || localStorage.getItem("usuario"));

  if (!usuarioSalvo) return null;

  try {
    return JSON.parse(usuarioSalvo);
  } catch {
    return null;
  }
}

export async function listarPresencasDaAula(aulaId) {
  if (!aulaId) {
    throw new Error("Aula não informada.");
  }

  const usuario = obterUsuarioSessao();

  if (!usuario?.id || !usuario?.token) {
    throw new Error("Sessão não encontrada. Entre novamente.");
  }

  const resposta = await fetch(`${API_URL}/professor/aulas/${aulaId}/presencas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${usuario.token}`
    }
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.mensagem || "Erro ao buscar presenças da aula.");
  }

  return dados;
}
