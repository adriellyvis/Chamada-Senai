const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

export async function request(
  url,
  options = {}
) {

  const usuario =
    JSON.parse(
      localStorage.getItem("usuario")
    );

  const headers = {
    "usuario-id": usuario?.id,
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

    localStorage.removeItem(
      "usuario"
    );

    window.location.href =
      "/index.html";

    return;
  }

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {

    throw new Error(
      data?.mensagem ||
      data?.message ||
      "Erro na requisição"
    );
  }

  return data;
}