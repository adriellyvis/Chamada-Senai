import { request } from "../../../core/api.js";
import {marcarMenuAtivo, getConteudoPrincipal} from "../../../core/spa.js";

import {abrirModal,fecharModal} from "../../../core/modal.js";

let turmasCache = [];

export async function abrirTurmas(elemento) {
  marcarMenuAtivo(elemento);

  const conteudo = getConteudoPrincipal();

  conteudo.innerHTML = `
    <section class="pagina-spa">
      <div class="pagina-header">
        <div>
          <h2>TURMAS</h2>
          <p>Gerencie as turmas cadastradas na instituição.</p>
        </div>

        <button id="btnCadastrarTurma">
          + Cadastrar turma
        </button>
      </div>

      <div class="tabela-card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Alunos</th>
              <th>Professores</th>
              <th>Disciplinas</th>
              <th>Status</th>
              <th>Professor</th>
              <th>Disciplina</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody id="tabelaTurmas">
            <tr>
              <td colspan="9">Carregando turmas...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `;

  document
    .getElementById("btnCadastrarTurma")
    .addEventListener("click", abrirFormularioTurma);

  await carregarTurmas();
}

async function carregarTurmas() {
  try {
    const turmas = await request("/gestor/turmas");

    turmasCache = turmas;

    renderizarTurmas(turmas);
  } catch (error) {
    console.error(error);
    alert("Erro ao carregar turmas");
  }
}

function renderizarTurmas(turmas) {
  const tabela = document.getElementById("tabelaTurmas");

  if (!tabela) return;

  if (!turmas || turmas.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="9">Nenhuma turma cadastrada.</td>
      </tr>
    `;
    return;
  }

  tabela.innerHTML = turmas.map(turma => `
    <tr>
      <td>${turma.nome ?? "-"}</td>
      <td>${turma.descricao ?? "-"}</td>
      <td>${turma.totalAlunos ?? 0}</td>
      <td>${turma.totalProfessores ?? 0}</td>
      <td>${turma.totalDisciplinas ?? 0}</td>
      <td>${turma.ativa ? "Ativa" : "Inativa"}</td>
      <td>${turma.professor ?? "-"}</td>
      <td>${turma.disciplina ?? "-"}</td>
      <td>
        <button data-editar-turma="${turma.id}">
            Editar
        </button>

        <button data-detalhes-turma="${turma.id}">
            Detalhes
        </button>
      </td>
    </tr>
  `).join("");

  adicionarEventosTabelaTurmas();
}

function adicionarEventosTabelaTurmas() {
  document
    .querySelectorAll("[data-editar-turma]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        editarTurma(botao.dataset.editarTurma);
      });
    });

  document
    .querySelectorAll("[data-detalhes-turma]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        abrirDetalhesTurma(botao.dataset.detalhesTurma);
      });
    });
}

async function abrirDetalhesTurma(id) {
  try {
    const turma = await request(`/gestor/turmas/${id}/detalhes`);

    abrirModal({
      titulo: `Detalhes da turma - ${turma.nome}`,

      conteudo: `
        <div class="detalhes-turma">

          <p><strong>Nome:</strong> ${turma.nome ?? "-"}</p>

          <p><strong>Descrição:</strong> ${turma.descricao ?? "-"}</p>

          <p><strong>Status:</strong> ${turma.ativa ? "Ativa" : "Inativa"}</p>

          <hr>

          <h3>Alunos</h3>
          <ul>
            ${
              turma.alunos?.length
                ? turma.alunos.map(aluno => `
                    <li>
                      ${aluno.nome}
                      -
                      ${aluno.status ?? "Ativo"}
                    </li>
                  `).join("")
                : "<li>Nenhum aluno vinculado.</li>"
            }
          </ul>

          <h3>Professores</h3>
          <ul>
            ${
              turma.professores?.length
                ? turma.professores.map(professor => `
                    <li>
                      ${professor.nome}
                      -
                      ${professor.status ?? "Ativo"}
                    </li>
                  `).join("")
                : "<li>Nenhum professor vinculado.</li>"
            }
          </ul>

          <h3>Disciplinas</h3>
          <ul>
            ${
              turma.disciplinas?.length
                ? turma.disciplinas.map(disciplina => `
                    <li>
                      ${disciplina.nome}
                      -
                      ${disciplina.status ?? "Ativa"}
                    </li>
                  `).join("")
                : "<li>Nenhuma disciplina vinculada.</li>"
            }
          </ul>

        </div>
      `
    });

  } catch (error) {
    console.error(error);
    alert("Erro ao carregar detalhes da turma");
  }
}

function abrirFormularioTurma() {
  abrirModal({
    titulo: "Cadastrar turma",
    conteudo: `
      <form id="formTurma">
        <div class="grupo-form">
          <label>Nome</label>
          <input type="text" id="nomeTurma" required>
        </div>

        <div class="grupo-form">
          <label>Descrição</label>
          <input type="text" id="descricaoTurma" required>
        </div>

        <button type="submit">
          Cadastrar
        </button>
      </form>
    `
  });

  document
    .getElementById("formTurma")
    .addEventListener("submit", cadastrarTurma);
}

async function cadastrarTurma(event) {
  event.preventDefault();

  try {
    const body = {
      nome: document.getElementById("nomeTurma").value.trim(),
      descricao: document.getElementById("descricaoTurma").value.trim()
    };

    await request("/gestor/turmas", {
      method: "POST",
      body: JSON.stringify(body)
    });

    fecharModal();

    await carregarTurmas();

    alert("Turma cadastrada com sucesso!");
  } catch (error) {
    console.error(error);

    if (error.message.includes("Nome da turma obrigatório")) {
      alert("Informe o nome da turma.");
      return;
    }

    if (error.message.includes("Descrição obrigatória")) {
      alert("Informe a descrição da turma.");
      return;
    }

    alert("Erro ao cadastrar turma");
  }
}

async function editarTurma(id) {

  const turma =
    turmasCache.find(
      t => t.id == id
    );

  if (!turma) {

    alert("Turma não encontrada.");

    return;
  }

  abrirModal({
    titulo: "Editar turma",

    conteudo: `
      <form id="formEditarTurma">

        <div class="grupo-form">

          <label>Nome</label>

          <input
            type="text"
            id="editarNomeTurma"
            value="${turma.nome ?? ""}"
            required
          >

        </div>

        <div class="grupo-form">

          <label>Descrição</label>

          <input
            type="text"
            id="editarDescricaoTurma"
            value="${turma.descricao ?? ""}"
            required
          >

        </div>

        <div class="grupo-form">

          <label>Professor</label>

          <select id="professorTurma">

            <option value="">
              Selecione um professor
            </option>

          </select>

        </div>

        <div class="grupo-form">

          <label>Disciplina</label>

          <select id="disciplinaTurma">

            <option value="">
              Selecione uma disciplina
            </option>

          </select>

        </div>

        <div class="grupo-form">

          <label>Status</label>

          <select id="editarStatusTurma">

            <option
              value="true"
              ${turma.ativa ? "selected" : ""}
            >
              Ativa
            </option>

            <option
              value="false"
              ${!turma.ativa ? "selected" : ""}
            >
              Inativa
            </option>

          </select>

        </div>

        <button type="submit">
          Salvar alterações
        </button>

      </form>
    `
  });

  await carregarProfessoresSelect(
    turma.professorId
  );

  await carregarDisciplinasSelect(
    turma.disciplinaId
  );

  document
    .getElementById("formEditarTurma")
    .addEventListener(
      "submit",
      event => {

        salvarEdicaoTurma(
          event,
          turma.id
        );
      }
    );
}

async function carregarProfessoresSelect(
  professorSelecionado = null
) {

  try {

    const professores =
      await request(
        "/gestor/professores/resumo"
      );

    const select =
      document.getElementById(
        "professorTurma"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione um professor
      </option>
    `;

    professores.forEach(professor => {

      select.innerHTML += `
        <option
          value="${professor.id}"
          ${professor.id == professorSelecionado
            ? "selected"
            : ""}
        >
          ${professor.nome}
        </option>
      `;
    });

  } catch (error) {

    console.error(error);

    alert(
      "Erro ao carregar professores"
    );
  }
}

async function carregarDisciplinasSelect(
  disciplinaSelecionada = null
) {

  try {

    const disciplinas =
      await request(
        "/gestor/disciplinas/resumo"
      );

    const select =
      document.getElementById(
        "disciplinaTurma"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione uma disciplina
      </option>
    `;

    disciplinas.forEach(disciplina => {

      select.innerHTML += `
        <option
          value="${disciplina.id}"
          ${disciplina.id == disciplinaSelecionada
            ? "selected"
            : ""}
        >
          ${disciplina.nome}
        </option>
      `;
    });

  } catch (error) {

    console.error(error);

    alert(
      "Erro ao carregar disciplinas"
    );
  }
}

async function salvarEdicaoTurma(
  event,
  id
) {

  event.preventDefault();

  try {

    const body = {

      nome:
        document.getElementById(
          "editarNomeTurma"
        ).value.trim(),

      descricao:
        document.getElementById(
          "editarDescricaoTurma"
        ).value.trim(),

      ativa:
        document.getElementById(
          "editarStatusTurma"
        ).value === "true",

      professorId:
        Number(
          document.getElementById(
            "professorTurma"
          ).value
        ) || null,

      disciplinaId:
        Number(
          document.getElementById(
            "disciplinaTurma"
          ).value
        ) || null
    };

    await request(
      `/gestor/turmas/${id}`,
      {
        method: "PUT",

        body: JSON.stringify(body)
      }
    );

    fecharModal();

    await carregarTurmas();

    alert(
      "Turma editada com sucesso!"
    );

  } catch (error) {

    console.error(error);

    alert("Erro ao editar turma");
  }
}

const btnConfig = document.getElementById("btnConfig");
const menuConfig = document.getElementById("menuConfig");
const btnTema = document.getElementById("btnTema");
const btnLogout = document.getElementById("btnLogout");

btnConfig?.addEventListener("click", event => {
  event.stopPropagation();
  menuConfig?.classList.toggle("ativo");
});

document.addEventListener("click", () => {
  menuConfig?.classList.remove("ativo");
});

menuConfig?.addEventListener("click", event => {
  event.stopPropagation();
});

btnTema?.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const temaAtual = document.body.classList.contains("dark")
    ? "dark"
    : "light";

  localStorage.setItem("tema", temaAtual);

  btnTema.textContent = temaAtual === "dark"
    ? "☀️"
    : "🌙";
});

btnLogout?.addEventListener("click", () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/index.html";
});

const temaSalvo = localStorage.getItem("tema");

if (temaSalvo === "dark") {
  document.body.classList.add("dark");

  if (btnTema) {
    btnTema.textContent = "☀️";
  }
}