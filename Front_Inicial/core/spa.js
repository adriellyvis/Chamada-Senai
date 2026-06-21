export function marcarMenuAtivo(elemento) {

  document
    .querySelectorAll("nav a")
    .forEach(item => {
      item.classList.remove("ativo");
    });

  elemento.classList.add("ativo");
}

export function getConteudoPrincipal() {

  return document.getElementById(
    "conteudoPrincipal"
  );
}