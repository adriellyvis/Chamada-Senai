 function toggleTheme() {
    const html  = document.documentElement;
    const label = document.getElementById('toggleLabel');
    const isDark = html.getAttribute('data-theme') === 'dark';

    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    label.textContent = isDark ? 'CLARO' : 'ESCURO';
  }

  document.addEventListener("DOMContentLoaded", () => {

  const userName = document.querySelector(".user-name");
  const avatar = document.querySelector(".avatar");

  // pega usuário do localStorage
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (usuario && usuario.nome) {

    // coloca o nome
    userName.textContent = usuario.nome;

    // coloca a inicial no avatar
    avatar.textContent = usuario.nome.charAt(0).toUpperCase();

  } else {
    // fallback (se não tiver login)
    userName.textContent = "Usuário";
    avatar.textContent = "?";

    // opcional: força voltar pro login
    // window.location.href = "area-aluno.html";
  }

});