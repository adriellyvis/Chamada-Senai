export function validarPerfil(perfilEsperado) {

  const usuario =
    JSON.parse(
      localStorage.getItem("usuario")
    );

  if (!usuario) {

    window.location.href =
      "/index.html";

    return null;
  }

  const perfil =
    usuario.perfil
      ?.toLowerCase();

  if (perfil !== perfilEsperado) {

    localStorage.removeItem(
      "usuario"
    );

    alert(
      "Acesso não permitido."
    );

    window.location.href =
      "/index.html";

    return null;
  }

  return usuario;
}

export function validarAutenticacao(
  perfilEsperado
) {

  const usuario =
    JSON.parse(
      localStorage.getItem("usuario")
    );

  if (!usuario) {

    window.location.href =
      "/index.html";

    return null;
  }

  const perfil =
    usuario.perfil
      ?.toLowerCase();

  if (
    perfilEsperado &&
    perfil !== perfilEsperado
  ) {

    localStorage.removeItem(
      "usuario"
    );

    alert(
      "Acesso não permitido."
    );

    window.location.href =
      "/index.html";

    return null;
  }

  return usuario;
}


export function preencherDadosUsuario(usuario) {
  const nomeUsuario = document.getElementById("nomeUsuario");

  if (nomeUsuario) {
    nomeUsuario.textContent =
      usuario?.nome || "Usuário";
  }

  const avatar = document.querySelector(".avatar");

  if (avatar) {
    avatar.textContent =
      usuario?.nome?.charAt(0)?.toUpperCase() || "U";
  }
}

export function logout() {

  localStorage.removeItem("usuario");

  window.location.href =
    "../login/area-login-gestor.html";
}