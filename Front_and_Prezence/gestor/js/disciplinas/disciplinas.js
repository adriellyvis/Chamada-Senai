import { marcarMenuAtivo, getConteudoPrincipal } from "../../../core/spa.js";
import { request } from "../../../core/api.js";

let disciplinasCache = [];
let disciplinaEditandoId = null;

export async function abrirDisciplinas(elemento = null) {
  if (elemento) {
    marcarMenuAtivo(elemento);
  }

  const conteudo = getConteudoPrincipal();

  conteudo.innerHTML = `
    <section class="disciplinas-page">
      <div class="disciplinas-header">
        <div>
          <h2>Disciplinas</h2>
          <p>Cadastre, liste e edite as disciplinas da instituição.</p>
        </div>

        <button id="btnNovaDisciplina" class="btn-disciplina primario" type="button">
          + Nova disciplina
        </button>
      </div>

      <section class="disciplinas-toolbar">
        <input
          type="text"
          id="buscaDisciplina"
          placeholder="Buscar por nome ou sigla..."
          autocomplete="off"
        >
      </section>

      <section class="disciplinas-card">
        <table class="disciplinas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sigla</th>
              <th>Nome</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody id="disciplinasBody">
            <tr>
              <td colspan="4">Carregando disciplinas...</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  `;

  document
    .getElementById("btnNovaDisciplina")
    ?.addEventListener("click", abrirModalNovaDisciplina);

  document
    .getElementById("buscaDisciplina")
    ?.addEventListener("input", filtrarDisciplinas);

  await carregarDisciplinas();
}

async function carregarDisciplinas() {
  try {
    disciplinasCache = await request("/gestor/disciplinas");
    renderizarDisciplinas(disciplinasCache || []);
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao carregar disciplinas");
  }
}

function renderizarDisciplinas(disciplinas) {
  const tbody = document.getElementById("disciplinasBody");

  if (!tbody) return;

  if (!disciplinas.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">Nenhuma disciplina encontrada.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = disciplinas.map(disciplina => `
    <tr>
      <td>${disciplina.id}</td>
      <td>
        <span class="disciplina-sigla">
          ${escaparHtml(disciplina.sigla || "—")}
        </span>
      </td>
      <td>
        <strong>${escaparHtml(disciplina.nome || "")}</strong>
      </td>
      <td>
        <button
          class="btn-disciplina pequeno"
          type="button"
          data-editar="${disciplina.id}"
        >
          Editar
        </button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-editar]").forEach(botao => {
    botao.addEventListener("click", () => {
      const id = Number(botao.dataset.editar);
      abrirModalEditarDisciplina(id);
    });
  });
}

function filtrarDisciplinas(event) {
  const termo = event.target.value.toLowerCase().trim();

  const filtradas = disciplinasCache.filter(disciplina => {
    const nome = String(disciplina.nome ?? "").toLowerCase();
    const sigla = String(disciplina.sigla ?? "").toLowerCase();

    return nome.includes(termo) || sigla.includes(termo);
  });

  renderizarDisciplinas(filtradas);
}

function abrirModalNovaDisciplina() {
  disciplinaEditandoId = null;
  abrirModalDisciplina();
}

function abrirModalEditarDisciplina(id) {
  const disciplina = disciplinasCache.find(item => Number(item.id) === Number(id));

  if (!disciplina) {
    alert("Disciplina não encontrada");
    return;
  }

  disciplinaEditandoId = id;
  abrirModalDisciplina(disciplina);
}

function abrirModalDisciplina(disciplina = null) {
  document.querySelector(".modal-disciplina-backdrop")?.remove();

  const modal = document.createElement("div");
  modal.className = "modal-disciplina-backdrop";

  modal.innerHTML = `
    <div class="modal-disciplina" role="dialog" aria-modal="true" aria-labelledby="tituloModalDisciplina">
      <div class="modal-disciplina-header">
        <h3 id="tituloModalDisciplina">
          ${disciplina ? "Editar disciplina" : "Nova disciplina"}
        </h3>
        <button type="button" id="fecharModalDisciplina" aria-label="Fechar"><span class="material-symbols-rounded" aria-hidden="true">close</span></button>
      </div>

      <form id="formDisciplina">
        <label>
          Nome da disciplina
          <input
            type="text"
            id="nomeDisciplina"
            maxlength="100"
            value="${escaparAtributo(disciplina?.nome ?? "")}"
            placeholder="Ex.: Banco de Dados"
            autocomplete="off"
            required
          >
        </label>

        <label>
          Sigla
          <input
            type="text"
            id="siglaDisciplina"
            maxlength="10"
            value="${escaparAtributo(disciplina?.sigla ?? "")}"
            placeholder="Ex.: BD"
            autocomplete="off"
            required
          >
          <small>Use até 10 caracteres. A sigla será salva em letras maiúsculas.</small>
        </label>

        <div class="modal-disciplina-acoes">
          <button type="button" id="cancelarDisciplina">
            Cancelar
          </button>

          <button type="submit" class="primario" id="salvarDisciplina">
            Salvar
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("fecharModalDisciplina")
    ?.addEventListener("click", fecharModalDisciplina);

  document
    .getElementById("cancelarDisciplina")
    ?.addEventListener("click", fecharModalDisciplina);

  document
    .getElementById("formDisciplina")
    ?.addEventListener("submit", salvarDisciplina);

  document
    .getElementById("siglaDisciplina")
    ?.addEventListener("input", event => {
      event.target.value = event.target.value.toUpperCase();
    });

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      fecharModalDisciplina();
    }
  });

  document.getElementById("nomeDisciplina")?.focus();
}

function fecharModalDisciplina() {
  document.querySelector(".modal-disciplina-backdrop")?.remove();
  disciplinaEditandoId = null;
}

async function salvarDisciplina(event) {
  event.preventDefault();

  const nome = document.getElementById("nomeDisciplina")?.value.trim();
  const sigla = document
    .getElementById("siglaDisciplina")
    ?.value
    .trim()
    .toUpperCase();

  if (!nome) {
    alert("Informe o nome da disciplina");
    document.getElementById("nomeDisciplina")?.focus();
    return;
  }

  if (!sigla) {
    alert("Informe a sigla da disciplina");
    document.getElementById("siglaDisciplina")?.focus();
    return;
  }

  if (sigla.length > 10) {
    alert("A sigla deve possuir no máximo 10 caracteres");
    document.getElementById("siglaDisciplina")?.focus();
    return;
  }

  const metodo = disciplinaEditandoId ? "PUT" : "POST";
  const endpoint = disciplinaEditandoId
    ? `/gestor/disciplinas/${disciplinaEditandoId}`
    : "/gestor/disciplinas";

  const botaoSalvar = document.getElementById("salvarDisciplina");

  try {
    if (botaoSalvar) {
      botaoSalvar.disabled = true;
      botaoSalvar.textContent = "Salvando...";
    }

    await request(endpoint, {
      method: metodo,
      body: JSON.stringify({ nome, sigla })
    });

    fecharModalDisciplina();
    await carregarDisciplinas();
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao salvar disciplina");
  } finally {
    if (botaoSalvar && document.body.contains(botaoSalvar)) {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Salvar";
    }
  }
}

function escaparHtml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparAtributo(valor) {
  return escaparHtml(valor);
}
