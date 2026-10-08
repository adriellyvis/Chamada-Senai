const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

function sanitizarUsuario(usuario) {
  if (!usuario || typeof usuario !== "object") return usuario;

  const copia = { ...usuario };
  delete copia.senha;
  delete copia.password;

  if (copia.usuario && typeof copia.usuario === "object") {
    copia.usuario = { ...copia.usuario };
    delete copia.usuario.senha;
    delete copia.usuario.password;
  }

  return copia;
}


function salvarSessaoUsuario(usuario) {
  const usuarioSeguro = sanitizarUsuario(usuario);
  const valor = JSON.stringify(usuarioSeguro);

  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");

  if (lembrarMe?.checked) {
    localStorage.setItem("usuario", valor);
  } else {
    sessionStorage.setItem("usuario", valor);
  }
}

const emailLogin = document.getElementById("emailLogin");
const raLogin = document.getElementById("raLogin");
const digitoRaLogin = document.getElementById("digitoRaLogin");
const ufLogin = document.getElementById("ufLogin");
const senha = document.getElementById("senha");
const btn = document.getElementById("btnLogin");
const erro = document.getElementById("erro");
const lembrarMe = document.getElementById("lembrarMe");
const painelLoginEmail = document.getElementById("painelLoginEmail");
const painelLoginRa = document.getElementById("painelLoginRa");
const botoesModo = [...document.querySelectorAll("[data-login-mode]")];

const CHAVE_MODO = "prezence_login_modo_aluno";
const CHAVE_EMAIL = "prezence_login_email_aluno";
const CHAVE_RA = "prezence_login_ra_aluno";
const CHAVE_DIGITO_RA = "prezence_login_digito_ra_aluno";
const CHAVE_UF = "prezence_login_uf_aluno";
const CHAVE_IDENTIFICADOR_ANTIGA = "prezence_login_identificador_aluno";

let modoLogin = "email";

function somenteDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarEmail(valor) {
  return String(valor || "").trim();
}

function normalizarUf(valor) {
  return String(valor || "").trim().toUpperCase();
}

function alternarModoLogin(modo, focar = false) {
  modoLogin = modo === "ra" ? "ra" : "email";

  const loginPorRa = modoLogin === "ra";
  painelLoginEmail.hidden = loginPorRa;
  painelLoginRa.hidden = !loginPorRa;

  botoesModo.forEach(botao => {
    const ativo = botao.dataset.loginMode === modoLogin;
    botao.classList.toggle("ativo", ativo);
    botao.setAttribute("aria-selected", String(ativo));
  });

  erro.textContent = "";

  if (focar) {
    (loginPorRa ? raLogin : emailLogin)?.focus();
  }
}

function carregarAcessoLembrado() {
  const identificadorAntigo = localStorage.getItem(CHAVE_IDENTIFICADOR_ANTIGA) || "";
  const emailSalvo = localStorage.getItem(CHAVE_EMAIL) || (identificadorAntigo.includes("@") ? identificadorAntigo : "");
  const raSalvo = localStorage.getItem(CHAVE_RA) || (!identificadorAntigo.includes("@") ? identificadorAntigo : "");
  const digitoSalvo = localStorage.getItem(CHAVE_DIGITO_RA) || "";
  const ufSalva = localStorage.getItem(CHAVE_UF) || "";
  const modoSalvo = localStorage.getItem(CHAVE_MODO);

  if (emailLogin && emailSalvo) emailLogin.value = emailSalvo;
  if (raLogin && raSalvo) raLogin.value = raSalvo;
  if (digitoRaLogin && digitoSalvo) digitoRaLogin.value = digitoSalvo;
  if (ufLogin && ufSalva) ufLogin.value = ufSalva;

  const possuiAlgoSalvo = Boolean(emailSalvo || raSalvo || digitoSalvo || ufSalva);
  if (lembrarMe) lembrarMe.checked = possuiAlgoSalvo;

  const modoInicial = modoSalvo === "ra" || (!modoSalvo && raSalvo && !emailSalvo)
    ? "ra"
    : "email";

  alternarModoLogin(modoInicial);
}

function limparAcessoLembrado() {
  [
    CHAVE_MODO,
    CHAVE_EMAIL,
    CHAVE_RA,
    CHAVE_DIGITO_RA,
    CHAVE_UF,
    CHAVE_IDENTIFICADOR_ANTIGA
  ].forEach(chave => localStorage.removeItem(chave));
}

function atualizarAcessoLembrado(dados) {
  if (!lembrarMe?.checked) {
    limparAcessoLembrado();
    return;
  }

  localStorage.setItem(CHAVE_MODO, modoLogin);
  localStorage.removeItem(CHAVE_IDENTIFICADOR_ANTIGA);

  if (modoLogin === "email") {
    localStorage.setItem(CHAVE_EMAIL, dados.identificador);
    localStorage.removeItem(CHAVE_RA);
    localStorage.removeItem(CHAVE_DIGITO_RA);
    localStorage.removeItem(CHAVE_UF);
    return;
  }

  localStorage.setItem(CHAVE_RA, dados.identificador);
  localStorage.setItem(CHAVE_DIGITO_RA, dados.digitoRa);
  localStorage.setItem(CHAVE_UF, dados.uf);
  localStorage.removeItem(CHAVE_EMAIL);
}

function montarDadosLogin() {
  const senhaValor = senha.value;

  if (!senhaValor) {
    throw new Error("Informe a senha");
  }

  if (modoLogin === "email") {
    const email = normalizarEmail(emailLogin.value);

    if (!email) {
      throw new Error("Informe o e-mail");
    }

    if (!email.includes("@")) {
      throw new Error("Informe um e-mail válido ou escolha a opção RA");
    }

    return {
      identificador: email,
      senha: senhaValor
    };
  }

  const ra = somenteDigitos(raLogin.value);
  const digitoRa = somenteDigitos(digitoRaLogin.value);
  const uf = normalizarUf(ufLogin.value);

  if (!ra || !digitoRa || !uf) {
    throw new Error("Informe RA, dígito RA, UF e senha");
  }

  if (!/^\d{2}$/.test(digitoRa)) {
    throw new Error("O dígito RA deve possuir 2 números, por exemplo 01");
  }

  return {
    identificador: ra,
    digitoRa,
    uf,
    senha: senhaValor
  };
}

async function realizarLoginAluno() {
  erro.textContent = "";

  let dadosLogin;

  try {
    dadosLogin = montarDadosLogin();
  } catch (err) {
    erro.textContent = err.message;
    return;
  }

  btn.disabled = true;
  btn.textContent = "Entrando...";

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dadosLogin)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.mensagem ||
        data.message ||
        "E-mail, RA ou senha inválidos"
      );
    }

    const perfil = String(data.perfil || "").toLowerCase();

    if (perfil !== "aluno") {
      throw new Error("Acesso não permitido para este portal");
    }

    if (!data?.token) {
      throw new Error(
        "O servidor não retornou o token de autenticação."
      );
    }

    salvarSessaoUsuario(data);

    atualizarAcessoLembrado(dadosLogin);

    window.location.href = "../aluno/tela-inicial-aluno.html";
  } catch (err) {
    erro.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar no portal";
  }
}

botoesModo.forEach(botao => {
  botao.addEventListener("click", () => {
    alternarModoLogin(botao.dataset.loginMode, true);
  });
});

lembrarMe?.addEventListener("change", () => {
  if (!lembrarMe.checked) {
    limparAcessoLembrado();
  }
});

raLogin?.addEventListener("input", () => {
  raLogin.value = somenteDigitos(raLogin.value);
});

digitoRaLogin?.addEventListener("input", () => {
  digitoRaLogin.value = somenteDigitos(digitoRaLogin.value).slice(0, 2);
});

btn.addEventListener("click", realizarLoginAluno);

[emailLogin, raLogin, digitoRaLogin, ufLogin, senha].forEach(campo => {
  campo?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      realizarLoginAluno();
    }
  });
});

carregarAcessoLembrado();
