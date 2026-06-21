const email = document.getElementById("email");
const senha = document.getElementById("senha");
const btn = document.getElementById("btnLogin");
const erro = document.getElementById("erro");

btn.addEventListener("click", async () => {
  erro.textContent = "";

  if (!email.value || !senha.value) {
    erro.textContent = "Preencha todos os campos";
    return;
  }

  if (!email.value.includes("@")) {
    erro.textContent = "Email inválido";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Entrando...";

  try {
    const response = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email.value,
        senha: senha.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensagem || data.message || "Erro ao logar");
    }

    console.log("Usuário:", data);

    const perfil = String(data.perfil || "").toLowerCase();

    if (perfil !== "aluno") {
      throw new Error("Acesso não permitido para este portal");
    }

    localStorage.setItem("usuario", JSON.stringify(data));

    window.location.href = "/aluno/tela-inicial-aluno.html";

  } catch (err) {
    erro.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar no portal";
  }
});