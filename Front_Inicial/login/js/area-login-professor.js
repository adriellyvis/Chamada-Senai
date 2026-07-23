const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

const email = document.getElementById("email");
const senha = document.getElementById("senha");
const btn = document.getElementById("btnLogin");
const erro = document.getElementById("erro");

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
      throw new Error("Acesso permitido apenas para professores.");
    }

    localStorage.setItem("usuario", JSON.stringify(usuario));

    window.location.href = "/professor/tela-inicial-professor.html";

  } catch (err) {
    console.error(err);
    erro.textContent = err.message || "Erro ao logar";
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar no portal";
  }
}