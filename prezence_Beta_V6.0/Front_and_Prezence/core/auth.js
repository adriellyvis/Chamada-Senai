function obterRegistroUsuarioSessao() {
  const valorSessao = sessionStorage.getItem("usuario");

  if (valorSessao) {
    return { valor: valorSessao, storage: sessionStorage };
  }

  const valorPersistente = localStorage.getItem("usuario");

  if (valorPersistente) {
    return { valor: valorPersistente, storage: localStorage };
  }

  return { valor: null, storage: null };
}

function lerUsuarioSessao() {
  const registro = obterRegistroUsuarioSessao();

  if (!registro.valor) return null;

  try {
    const usuario = JSON.parse(registro.valor);
    return sanitizarUsuarioSessao(usuario, registro.storage);
  } catch {
    limparSessao();
    return null;
  }
}

function sanitizarUsuarioSessao(usuario, storageAtual = null) {
  if (!usuario || typeof usuario !== "object") return usuario;

  let alterado = false;
  const seguro = { ...usuario };

  if ("senha" in seguro) {
    delete seguro.senha;
    alterado = true;
  }

  if ("password" in seguro) {
    delete seguro.password;
    alterado = true;
  }

  if (alterado && storageAtual) {
    storageAtual.setItem("usuario", JSON.stringify(seguro));
  }

  return seguro;
}

function limparSessao() {
  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
  localStorage.removeItem("usuarioLogado");
  sessionStorage.removeItem("usuarioLogado");
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}

function sessaoValida(usuario) {
  return Boolean(
    usuario &&
    usuario.id &&
    typeof usuario.token === "string" &&
    usuario.token.trim()
  );
}

export function obterUsuarioAutenticado() {
  return lerUsuarioSessao();
}

export function validarPerfil(perfilEsperado) {
  const usuario = lerUsuarioSessao();

  if (!sessaoValida(usuario)) {
    limparSessao();
    window.location.href = "../index.html";
    return null;
  }

  const perfil = usuario.perfil?.toLowerCase();

  if (perfil !== perfilEsperado) {
    limparSessao();
    alert("Acesso não permitido.");
    window.location.href = "../index.html";
    return null;
  }

  return usuario;
}

export function validarAutenticacao(perfilEsperado) {
  const usuario = lerUsuarioSessao();

  if (!sessaoValida(usuario)) {
    limparSessao();
    window.location.href = "../index.html";
    return null;
  }

  const perfil = usuario.perfil?.toLowerCase();

  if (perfilEsperado && perfil !== perfilEsperado) {
    limparSessao();
    alert("Acesso não permitido.");
    window.location.href = "../index.html";
    return null;
  }

  return usuario;
}

export function preencherDadosUsuario(usuario) {
  const nomeUsuario = document.getElementById("nomeUsuario");

  if (nomeUsuario) {
    nomeUsuario.textContent = usuario?.nome || "Usuário";
  }

  const avatar = document.querySelector(".avatar");

  if (avatar) {
    avatar.textContent = usuario?.nome?.charAt(0)?.toUpperCase() || "U";
  }
}

export function logout() {
  limparSessao();
  window.location.href = "../index.html";
}
