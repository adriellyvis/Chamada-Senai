const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;


function salvarSessaoUsuario(usuario) {
  const valor = JSON.stringify(sanitizarUsuario(usuario));

  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");

  if (lembrarMe?.checked) {
    localStorage.setItem("usuario", valor);
  } else {
    sessionStorage.setItem("usuario", valor);
  }
}

const form = document.getElementById("formLogin");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const botao = form?.querySelector('button[type="submit"]');
const lembrarMe = document.getElementById("lembrarMe");
const CHAVE_EMAIL_LEMBRADO = "prezence_login_email_gestor";

const emailLembrado = localStorage.getItem(CHAVE_EMAIL_LEMBRADO);
if (emailLembrado && emailInput) {
  emailInput.value = emailLembrado;
  if (lembrarMe) lembrarMe.checked = true;
}

lembrarMe?.addEventListener("change", () => {
  if (!lembrarMe.checked) {
    localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
  }
});

function atualizarEmailLembrado(valor) {
  if (lembrarMe?.checked) {
    localStorage.setItem(CHAVE_EMAIL_LEMBRADO, valor.trim());
  } else {
    localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
  }
}

function sanitizarUsuario(usuario) {
  if (!usuario || typeof usuario !== "object") return usuario;

  const copia = { ...usuario };
  delete copia.senha;
  delete copia.password;
  return copia;
}

form?.addEventListener("submit", realizarLogin);

async function realizarLogin(event) {
  event.preventDefault();

  const email = emailInput?.value?.trim() || "";
  const senha = senhaInput?.value || "";

  if (!email || !senha) {
    alert("Preencha email e senha.");
    return;
  }

  if (botao) {
    botao.disabled = true;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, senha })
    });

    const texto = await response.text();
    let data = null;

    try {
      data = texto ? JSON.parse(texto) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.mensagem ||
        data?.message ||
        "Email ou senha inválidos"
      );
    }

    const usuario = data?.usuario ?? data;
    const perfil = String(
      usuario?.perfil ?? usuario?.perfilNome ?? ""
    ).toLowerCase();
    const perfilId = usuario?.perfilId ?? usuario?.perfil_id;

    if (perfil !== "gestor" && Number(perfilId) !== 3) {
      throw new Error("Acesso permitido apenas para gestores.");
    }

    if (!usuario?.token && !data?.token) {
      throw new Error("O servidor não retornou o token de autenticação.");
    }

    salvarSessaoUsuario(usuario);
    atualizarEmailLembrado(email);

    window.location.href = "../gestor/tela_inicial_gestor.html";
  } catch (erro) {
    alert(erro?.message || "Não foi possível entrar no sistema.");
  } finally {
    if (botao) {
      botao.disabled = false;
    }
  }
}
