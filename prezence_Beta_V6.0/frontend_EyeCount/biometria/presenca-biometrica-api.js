const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

function obterUsuarioSessao() {
  try {
    return JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario"))) ||
      JSON.parse(sessionStorage.getItem("usuarioLogado") || localStorage.getItem("usuarioLogado")) ||
      null;
  } catch {
    return null;
  }
}

async function requisicaoBiometria(endpoint, opcoes = {}) {
  const usuario = obterUsuarioSessao();

  if (!usuario?.id || !usuario?.token) {
    throw new Error("Sessão não encontrada. Entre novamente no sistema.");
  }

  const resposta = await fetch(`${API_URL}${endpoint}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${usuario.token}`,
      ...(opcoes.headers || {})
    }
  });

  if (resposta.status === 204) {
    return null;
  }

  const texto = await resposta.text();
  let dados = null;

  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = texto || null;
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.mensagem ||
      dados?.message ||
      (typeof dados === "string" ? dados : "") ||
      "Erro ao comunicar com o servidor de presença biométrica."
    );
  }

  return dados;
}

/**
 * Novo fluxo: a biometria não cria presença definitiva.
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

  return requisicaoBiometria("/biometria/presenca/solicitar", {
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
 * O backend deve responder 204 quando ainda não existe solicitação nesta aula.
 */
export async function consultarStatusConfirmacaoBiometrica({ aulaId }) {
  const aulaIdNumerico = Number(aulaId);

  if (!aulaIdNumerico) {
    throw new Error("Aula não informada.");
  }

  return requisicaoBiometria(
    `/biometria/presenca/status?aulaId=${encodeURIComponent(aulaIdNumerico)}`,
    { method: "GET" }
  );
}
