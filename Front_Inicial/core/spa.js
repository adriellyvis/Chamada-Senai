export function marcarMenuAtivo(elemento = null) {

  document
    .querySelectorAll("nav a")
    .forEach(item => {
      item.classList.remove("ativo");
    });

  if (elemento) {
    elemento.classList.add("ativo");
  }
}

export function getConteudoPrincipal() {

  return document.getElementById(
    "conteudoPrincipal"
  );
}