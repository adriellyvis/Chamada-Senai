(() => {
  const links = document.querySelectorAll('[data-acesso-ajuda]');
  if (!links.length) return;

  function detectarPerfil() {
    const titulo = `${document.title} ${document.body?.innerText || ''}`.toLowerCase();
    if (titulo.includes('professor')) return 'professor';
    if (titulo.includes('aluno')) return 'aluno';
    if (titulo.includes('gestor') || titulo.includes('administrador')) return 'gestor';
    return 'usuario';
  }

  function emailAtual() {
    return document.getElementById('email')?.value?.trim() || '';
  }

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const email = emailAtual();
      const perfil = detectarPerfil();

      if (email) {
        sessionStorage.setItem('prezence_acesso_email_contexto', email);
      } else {
        sessionStorage.removeItem('prezence_acesso_email_contexto');
      }

      sessionStorage.setItem('prezence_acesso_perfil_contexto', perfil);
    });
  });
})();
