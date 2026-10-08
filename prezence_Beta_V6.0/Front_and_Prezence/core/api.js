const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;
let apiIndisponivel = false;

function obterUsuarioSessao() {
  try {
    const valor = sessionStorage.getItem("usuario") || localStorage.getItem("usuario");
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

function encerrarSessao() {
  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
  window.location.href = "../index.html";
}

function avisarApiIndisponivel() {
  if (apiIndisponivel) return;
  apiIndisponivel = true;
  window.dispatchEvent(new CustomEvent("prezence:api-indisponivel"));
}

function avisarApiRestaurada() {
  if (!apiIndisponivel) return;
  apiIndisponivel = false;
  window.dispatchEvent(new CustomEvent("prezence:api-restaurada"));
}

export async function request(url, options = {}) {
  const usuario = obterUsuarioSessao();
  const token = usuario?.token;

  if (!token) {
    encerrarSessao();
    const erro = new Error("Sessão expirada. Entre novamente.");
    erro.status = 401;
    erro.codigo = "SESSAO_EXPIRADA";
    throw erro;
  }

  const headers = {
    "Authorization": `Bearer ${token}`,
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
    });
    avisarApiRestaurada();
  } catch (causa) {
    avisarApiIndisponivel();
    const erro = new Error(
      "Não foi possível conectar ao servidor. Alguns dados podem estar temporariamente indisponíveis."
    );
    erro.codigo = "API_OFFLINE";
    erro.causa = causa;
    throw erro;
  }

  if (response.status === 401) {
    encerrarSessao();
    const erro = new Error("Sessão expirada. Entre novamente.");
    erro.status = 401;
    erro.codigo = "SESSAO_EXPIRADA";
    throw erro;
  }

  if (response.status === 204) {
    return null;
  }

  const texto = await response.text();
  let data = null;

  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = texto || null;
  }

  if (!response.ok) {
    const erro = new Error(
      data?.mensagem ||
      data?.message ||
      (typeof data === "string" ? data : "") ||
      "Não foi possível concluir a operação."
    );
    erro.status = response.status;
    erro.dados = data;
    throw erro;
  }

  return data;
}
