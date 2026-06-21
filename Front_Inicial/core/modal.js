export function abrirModal({
  titulo = "Modal",
  conteudo = ""
}) {

  let overlay =
    document.getElementById("modalOverlay");

  if (!overlay) {

    overlay =
      document.createElement("div");

    overlay.id = "modalOverlay";

    overlay.className =
      "modal-overlay";

    overlay.innerHTML = `
      <div class="modal">

        <div class="modal-header">

          <h2 id="modalTitulo"></h2>

          <button id="btnFecharModal">
            ✖
          </button>

        </div>

        <div id="modalBody"></div>

      </div>
    `;

    document.body.appendChild(
      overlay
    );
  }

  document.getElementById(
    "modalTitulo"
  ).textContent = titulo;

  document.getElementById(
    "modalBody"
  ).innerHTML = conteudo;

  overlay.classList.add("ativo");

  document
    .getElementById("btnFecharModal")
    .onclick = fecharModal;

  overlay.onclick = (event) => {

    if (event.target === overlay) {
      fecharModal();
    }
  };
}

export function fecharModal() {

  const overlay =
    document.getElementById("modalOverlay");

  if (overlay) {
    overlay.classList.remove("ativo");
  }
}
