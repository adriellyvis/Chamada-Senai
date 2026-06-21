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

        <button id="btnNovaDisciplina" class="btn-disciplina primario">
          + Nova disciplina
        </button>
      </div>

      <section class="disciplinas-toolbar">
        <input
          type="text"
          id="buscaDisciplina"
          placeholder="Buscar disciplina..."
        >
      </section>

      <section class="disciplinas-card">
        <table class="disciplinas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody id="disciplinasBody">
            <tr>
              <td colspan="3">Carregando disciplinas...</td>
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
    alert("Erro ao carregar disciplinas");
  }
}

function renderizarDisciplinas(disciplinas) {
  const tbody = document.getElementById("disciplinasBody");

  if (!tbody) return;

  if (!disciplinas.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3">Nenhuma disciplina encontrada.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = disciplinas.map(disciplina => `
    <tr>
      <td>${disciplina.id}</td>
      <td>
        <strong>${disciplina.nome}</strong>
      </td>
      <td>
        <button
          class="btn-disciplina pequeno"
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

  const filtradas = disciplinasCache.filter(disciplina =>
    String(disciplina.nome ?? "").toLowerCase().includes(termo)
  );

  renderizarDisciplinas(filtradas);
}

function abrirModalNovaDisciplina() {
  disciplinaEditandoId = null;
  abrirModalDisciplina();
}

function abrirModalEditarDisciplina(id) {
  const disciplina = disciplinasCache.find(item => item.id === id);

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
    <div class="modal-disciplina">
      <div class="modal-disciplina-header">
        <h3>${disciplina ? "Editar disciplina" : "Nova disciplina"}</h3>
        <button type="button" id="fecharModalDisciplina">×</button>
      </div>

      <form id="formDisciplina">
        <label>
          Nome da disciplina
          <input
            type="text"
            id="nomeDisciplina"
            value="${disciplina?.nome ?? ""}"
            placeholder="Ex: Matemática"
            required
          >
        </label>

        <div class="modal-disciplina-acoes">
          <button type="button" id="cancelarDisciplina">
            Cancelar
          </button>

          <button type="submit" class="primario">
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

  document.getElementById("nomeDisciplina")?.focus();
}

function fecharModalDisciplina() {
  document.querySelector(".modal-disciplina-backdrop")?.remove();
  disciplinaEditandoId = null;
}

async function salvarDisciplina(event) {
  event.preventDefault();

  const nome = document.getElementById("nomeDisciplina")?.value.trim();

  if (!nome) {
    alert("Informe o nome da disciplina");
    return;
  }

  const metodo = disciplinaEditandoId ? "PUT" : "POST";
  const endpoint = disciplinaEditandoId
    ? `/gestor/disciplinas/${disciplinaEditandoId}`
    : "/gestor/disciplinas";

  try {
    await request(endpoint, {
      method: metodo,
      body: JSON.stringify({ nome })
    });

    fecharModalDisciplina();
    await carregarDisciplinas();

  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao salvar disciplina");
  }
}