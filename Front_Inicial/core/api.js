const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

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

export async function request(
  url,
  options = {}
) {

  const usuario = obterUsuarioSessao();
  const token = usuario?.token;

  if (!token) {
    encerrarSessao();
    throw new Error("Sessão expirada. Entre novamente.");
  }

  const headers = {
    "Authorization": `Bearer ${token}`,
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] =
      "application/json";
  }

  const response = await fetch(
    `${API_URL}${url}`,
    {
      ...options,
      headers
    }
  );

  if (response.status === 401) {
    encerrarSessao();
    throw new Error("Sessão expirada. Entre novamente.");
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
    throw new Error(
      data?.mensagem ||
      data?.message ||
      (typeof data === "string" ? data : "") ||
      "Erro na requisição"
    );
  }

  return data;
}
