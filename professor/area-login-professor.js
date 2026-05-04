const email = document.getElementById("email");
const senha = document.getElementById("senha");
const btn = document.getElementById("btnLogin");
const erro = document.getElementById("erro");

btn.addEventListener("click", async () => {
  erro.textContent = "";

  // validação básica
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
    const response = await fetch("http://localhost:8080/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  email: email.value,
  senha: senha.value,
  tipo: "professor"
})
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao logar");
    }

    console.log("Usuário:", data);
    // ✔ SALVA USUÁRIO LOGADO
    localStorage.setItem("usuario", JSON.stringify(data));

    if (data.perfil_id !== 2) {
  localStorage.removeItem("usuario");
  throw new Error("Acesso não permitido para este portal");
  }
    // ✔ REDIRECIONA PARA TELA INICIAL
    window.location.href = "/professor/tela-inicial-professor.html";

  } catch (err) {
    erro.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar no portal";
  }
});