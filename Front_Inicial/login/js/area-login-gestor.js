const form = document.getElementById("formLogin");
const email = document.getElementById("email");
const senha = document.getElementById("senha");

form.addEventListener("submit", realizarLogin);

async function realizarLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  console.log("Enviando:", { email, senha });

  const response = await fetch("http://localhost:8080/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      senha: senha
    })
  });

  const texto = await response.text();
  console.log("Status:", response.status);
  console.log("Resposta:", texto);

  if (!response.ok) {
    alert("Email ou senha inválidos");
    return;
  }

  const data = JSON.parse(texto);

  localStorage.setItem("usuario", JSON.stringify(data));
  window.location.href = "../gestor/tela_inicial_gestor.html";
}