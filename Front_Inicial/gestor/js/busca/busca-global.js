import { request } from "../../../core/api.js";

let usuariosCache = [];
let turmasCache = [];
let ocorrenciasCache = [];
let buscaCarregada = false;

export async function iniciarBuscaGlobalGestor() {
  const input = document.getElementById("buscaGlobalGestor");
  const resultado = document.getElementById("resultadoBuscaGlobal");

  if (!input || !resultado) return;

  input.addEventListener("focus", carregarDadosBuscaUmaVez);

  input.addEventListener("input", async event => {
    await carregarDadosBuscaUmaVez();
    aplicarBuscaGlobal(event);
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".search-global")) {
      resultado.classList.remove("ativo");
    }
  });
}
async function carregarDadosBuscaUmaVez() {
  if (buscaCarregada) return;

  try {
    const [usuarios, turmas, ocorrencias] = await Promise.all([
      request("/gestor/usuarios"),
      request("/gestor/turmas"),
      request("/ocorrencias")
    ]);

    usuariosCache = usuarios || [];
    turmasCache = turmas || [];
    ocorrenciasCache = ocorrencias || [];

    buscaCarregada = true;

  } catch (error) {
    console.error(error);
  }
}

function aplicarBuscaGlobal(event) {
  const termo = event.target.value.toLowerCase().trim();
  const resultado = document.getElementById("resultadoBuscaGlobal");

  if (!resultado) return;

  if (termo.length < 2) {
    resultado.classList.remove("ativo");
    resultado.innerHTML = "";
    return;
  }

  const usuariosFiltrados = usuariosCache
    .filter(usuario =>
      String(usuario.nome ?? "").toLowerCase().includes(termo) ||
      String(usuario.email ?? "").toLowerCase().includes(termo) ||
      String(usuario.perfil ?? "").toLowerCase().includes(termo)
    )
    .slice(0, 5);

  const turmasFiltradas = turmasCache
    .filter(turma =>
      String(turma.nome ?? "").toLowerCase().includes(termo) ||
      String(turma.descricao ?? "").toLowerCase().includes(termo)
    )
    .slice(0, 4);

  const ocorrenciasFiltradas = ocorrenciasCache
    .filter(ocorrencia =>
      String(ocorrencia.titulo ?? "").toLowerCase().includes(termo) ||
      String(ocorrencia.alunoNome ?? "").toLowerCase().includes(termo) ||
      String(ocorrencia.professorNome ?? "").toLowerCase().includes(termo) ||
      String(ocorrencia.status ?? "").toLowerCase().includes(termo)
    )
    .slice(0, 4);

  renderizarResultadosBusca(
    usuariosFiltrados,
    turmasFiltradas,
    ocorrenciasFiltradas
  );
}

function renderizarResultadosBusca(usuarios, turmas, ocorrencias) {
  const resultado = document.getElementById("resultadoBuscaGlobal");

  if (!resultado) return;

  const vazio =
    usuarios.length === 0 &&
    turmas.length === 0 &&
    ocorrencias.length === 0;

  if (vazio) {
    resultado.innerHTML = `
      <div class="busca-vazio">
        Nenhum resultado encontrado.
      </div>
    `;
    resultado.classList.add("ativo");
    return;
  }

  resultado.innerHTML = `
    ${montarSecaoUsuarios(usuarios)}
    ${montarSecaoTurmas(turmas)}
    ${montarSecaoOcorrencias(ocorrencias)}
  `;

  resultado.classList.add("ativo");

  adicionarEventosBusca();
}

function montarSecaoUsuarios(usuarios) {
  if (!usuarios.length) return "";

  return `
    <div class="busca-secao">
      <strong>Usuários</strong>

      ${usuarios.map(usuario => `
        <button
           class="busca-item"
            data-destino="usuarios"
            data-id="${usuario.id}"
        >
          <span>${usuario.nome ?? "-"}</span>
          <small>${usuario.perfil ?? "-"} • ${usuario.email ?? "-"}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function montarSecaoTurmas(turmas) {
  if (!turmas.length) return "";

  return `
    <div class="busca-secao">
      <strong>Turmas</strong>

      ${turmas.map(turma => `
        <button
          class="busca-item"
          data-destino="turmas"
          data-id="${turma.id}"
        >
          <span>${turma.nome ?? "-"}</span>
          <small>${turma.descricao ?? "Turma cadastrada"}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function montarSecaoOcorrencias(ocorrencias) {
  if (!ocorrencias.length) return "";

  return `
    <div class="busca-secao">
      <strong>Ocorrências</strong>

      ${ocorrencias.map(ocorrencia => `
        <button
          class="busca-item"
          data-destino="ocorrencias"
          data-id="${ocorrencia.id}"
        >
          <span>${ocorrencia.titulo ?? "Ocorrência"}</span>
          <small>${ocorrencia.alunoNome ?? "-"} • ${ocorrencia.status ?? "-"}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function adicionarEventosBusca() {
  document.querySelectorAll("[data-destino]").forEach(item => {
    item.addEventListener("click", () => {
      const destino = item.dataset.destino;
      const id = item.dataset.id;

      document
        .getElementById("resultadoBuscaGlobal")
        ?.classList.remove("ativo");

      document.getElementById("buscaGlobalGestor").value = "";

      if (destino === "usuarios") {
        localStorage.setItem("buscaUsuarioId", id);
        document.getElementById("menuAlunos")?.click();
      }

      if (destino === "turmas") {
        localStorage.setItem("buscaTurmaId", id);
        document.getElementById("menuTurmas")?.click();
      }

      if (destino === "ocorrencias") {
        localStorage.setItem("buscaOcorrenciaId", id);
        document.getElementById("menuOcorrencias")?.click();
      }
    });
  });
}