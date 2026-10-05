const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

function sanitizarUsuario(usuario) {
  if (!usuario || typeof usuario !== "object") return usuario;

  const copia = { ...usuario };
  delete copia.senha;
  delete copia.password;
  return copia;
}


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

const email = document.getElementById("email");
const senha = document.getElementById("senha");
const btn = document.getElementById("btnLogin");
const erro = document.getElementById("erro");
const lembrarMe = document.getElementById("lembrarMe");
const CHAVE_EMAIL_LEMBRADO = "prezence_login_email_professor";

const emailLembrado = localStorage.getItem(CHAVE_EMAIL_LEMBRADO);
if (emailLembrado) {
  email.value = emailLembrado;
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

document.getElementById("formLoginProfessor").addEventListener( "submit", event => {
  event.preventDefault();
  realizarLoginProfessor();
 }
);

async function realizarLoginProfessor() {
  erro.textContent = "";

  const emailValor = email.value.trim();
  const senhaValor = senha.value.trim();

  if (!emailValor || !senhaValor) {
    erro.textContent = "Preencha todos os campos";
    return;
  }

  if (!emailValor.includes("@")) {
    erro.textContent = "Email inválido";
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
      body: JSON.stringify({
        email: emailValor,
        senha: senhaValor
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensagem || "Erro ao logar");
    }

    const usuario = data.usuario ?? data;

    const perfil =
      usuario.perfil?.toLowerCase?.() ??
      usuario.perfilNome?.toLowerCase?.() ??
      "";

    const perfilId =
      usuario.perfilId ??
      usuario.perfil_id;

    const ehProfessor =
      perfil === "professor" || perfilId === 2;

    if (!ehProfessor) {
      localStorage.removeItem("usuario");
      sessionStorage.removeItem("usuario");
      throw new Error("Acesso permitido apenas para professores.");
    }

    if (!usuario?.token && !data?.token) {
      throw new Error("O servidor não retornou o token de autenticação.");
    }

    salvarSessaoUsuario(usuario);
    atualizarEmailLembrado(emailValor);

    window.location.href = "../professor/tela-inicial-professor.html";

  } catch (err) {
    console.error(err);
    erro.textContent = err.message || "Erro ao logar";
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar no portal";
  }
}
