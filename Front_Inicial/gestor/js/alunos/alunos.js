import { request } from "../../../core/api.js";
import { marcarMenuAtivo, getConteudoPrincipal} from "../../../core/spa.js";
import { abrirModal, fecharModal} from "../../../core/modal.js";
import {
  iniciarCameraBiometria,
  capturarImagemBiometria,
  pararCameraBiometria,
  cameraEstaAtiva
} from "../../../biometria/camera-biometria.js";
import {
  cadastrarFacePython,
  verificarServidorBiometria
} from "../../../biometria/biometria-api.js";

let usuariosCache = [];

export async function abrirAlunos(elemento) {
  marcarMenuAtivo(elemento);

  const conteudo = getConteudoPrincipal();

  conteudo.innerHTML = `
    <section class="usuarios-page">

      <div class="usuarios-header">
        <div>
          <span class="usuarios-eyebrow">Gestão institucional</span>
          <h2>Usuários</h2>
          <p>Gerencie alunos, professores e gestores cadastrados.</p>
        </div>

        <button id="btnCadastrarAluno" class="btn-cadastrar-usuario">
          + Cadastrar usuário
        </button>
      </div>

      <section class="usuarios-resumo">
        <div class="usuario-resumo-card">
          <span>Total de usuários</span>
          <strong id="totalUsuarios">0</strong>
        </div>

        <div class="usuario-resumo-card aluno">
          <span>Alunos</span>
          <strong id="totalAlunos">0</strong>
        </div>

        <div class="usuario-resumo-card professor">
          <span>Professores</span>
          <strong id="totalProfessores">0</strong>
        </div>

        <div class="usuario-resumo-card gestor">
          <span>Gestores</span>
          <strong id="totalGestores">0</strong>
        </div>
      </section>

      <section class="usuarios-toolbar">
        <div class="usuarios-busca">
          <input
            id="buscaUsuarioGestor"
            type="text"
            placeholder="Buscar por nome ou email..."
          />
          <span>🔍</span>
        </div>

        <select id="filtroPerfilUsuario" class="select-pill">
          <option value="">Todos os perfis</option>
          <option value="aluno">Alunos</option>
          <option value="professor">Professores</option>
          <option value="gestor">Gestores</option>
        </select>

        <select id="filtroStatusUsuario" class="select-pill">
          <option value="">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </section>

      <div class="usuarios-table-card">
        <div class="usuarios-table-wrapper">
          <table class="usuarios-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody id="tabelaUsuarios">
              <tr>
                <td colspan="5">
                  Carregando usuários...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </section>
  `;

  document
    .getElementById("btnCadastrarAluno")
    .addEventListener("click", abrirFormularioAluno);

  document
    .getElementById("buscaUsuarioGestor")
    ?.addEventListener("input", aplicarFiltrosUsuarios);

  document
    .getElementById("filtroPerfilUsuario")
    ?.addEventListener("change", aplicarFiltrosUsuarios);

  document
    .getElementById("filtroStatusUsuario")
    ?.addEventListener("change", aplicarFiltrosUsuarios);

  await carregarUsuarios();
}

async function carregarUsuarios() {
  try {
    const usuarios = await request("/gestor/usuarios");

    usuariosCache = usuarios || [];

    atualizarResumoUsuarios(usuariosCache);
    renderizarUsuarios(usuariosCache);

  } catch (error) {
    console.error(error);
    alert("Erro ao carregar usuários");
  }
}

function renderizarUsuarios(usuarios) {
  const tabela = document.getElementById("tabelaUsuarios");

  if (!tabela) return;

  if (usuarios.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="5">
          Nenhum usuário encontrado.
        </td>
      </tr>
    `;
    return;
  }

  tabela.innerHTML = usuarios.map(usuario => {
    const perfil = String(usuario.perfil ?? "").toLowerCase();
    const ativo = Boolean(usuario.ativo);

    return `
      <tr>
        <td>
          <div class="usuario-identidade">
            <div class="usuario-avatar ${perfil}">
              ${usuario.nome?.charAt(0).toUpperCase() ?? "U"}
            </div>

            <div>
              <strong>${usuario.nome ?? "-"}</strong>
              <span>ID #${usuario.id}</span>
            </div>
          </div>
        </td>

        <td>${usuario.email ?? "-"}</td>

        <td>
          <span class="usuario-perfil ${perfil}">
            ${formatarPerfilUsuario(usuario.perfil)}
          </span>
        </td>

        <td>
          <span class="usuario-status ${ativo ? "ativo" : "inativo"}">
            ${ativo ? "Ativo" : "Inativo"}
          </span>
        </td>

        <td>
          <div class="usuario-acoes">
            <button
              class="btn-usuario editar"
              data-editar-usuario="${usuario.id}"
            >
              Editar
            </button>

            <button
              class="btn-usuario detalhes"
              data-detalhes-usuario="${usuario.id}"
            >
              Detalhes
            </button>

            ${perfil !== "gestor" ? `
              <button
                class="btn-usuario detalhes"
                data-face-usuario="${usuario.id}"
              >
                Face
              </button>
            ` : ""}

            <button
              class="btn-usuario status ${ativo ? "desativar" : "ativar"}"
              data-status-usuario="${usuario.id}"
            >
              ${ativo ? "Desativar" : "Ativar"}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  adicionarEventosTabela();
}

function aplicarFiltrosUsuarios() {
  const termo = document
    .getElementById("buscaUsuarioGestor")
    ?.value
    .toLowerCase()
    .trim() ?? "";

  const perfil = document
    .getElementById("filtroPerfilUsuario")
    ?.value ?? "";

  const status = document
    .getElementById("filtroStatusUsuario")
    ?.value ?? "";

  const filtrados = usuariosCache.filter(usuario => {
    const nome = String(usuario.nome ?? "").toLowerCase();
    const email = String(usuario.email ?? "").toLowerCase();
    const perfilUsuario = String(usuario.perfil ?? "").toLowerCase();

    const buscaOk =
      !termo ||
      nome.includes(termo) ||
      email.includes(termo);

    const perfilOk =
      !perfil || perfilUsuario === perfil;

    const statusOk =
      !status ||
      (status === "ativo" && usuario.ativo) ||
      (status === "inativo" && !usuario.ativo);

    return buscaOk && perfilOk && statusOk;
  });

  renderizarUsuarios(filtrados);
}

function atualizarResumoUsuarios(usuarios) {
  const total = usuarios.length;

  const alunos = usuarios.filter(usuario =>
    String(usuario.perfil ?? "").toLowerCase() === "aluno"
  ).length;

  const professores = usuarios.filter(usuario =>
    String(usuario.perfil ?? "").toLowerCase() === "professor"
  ).length;

  const gestores = usuarios.filter(usuario =>
    String(usuario.perfil ?? "").toLowerCase() === "gestor"
  ).length;

  setTextoUsuario("totalUsuarios", total);
  setTextoUsuario("totalAlunos", alunos);
  setTextoUsuario("totalProfessores", professores);
  setTextoUsuario("totalGestores", gestores);
}

function setTextoUsuario(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor;
  }
}

function formatarPerfilUsuario(perfil) {
  const mapa = {
    aluno: "Aluno",
    professor: "Professor",
    gestor: "Gestor"
  };

  return mapa[String(perfil ?? "").toLowerCase()] ?? perfil ?? "-";
}
function adicionarEventosTabela() {

  document
    .querySelectorAll("[data-status-usuario]")
    .forEach(botao => {

      botao.addEventListener(
        "click",
        () => {

          alterarStatusUsuario(
            botao.dataset.statusUsuario
          );
        }
      );
    });

    document
  .querySelectorAll("[data-detalhes-usuario]")
  .forEach(botao => {

    botao.addEventListener(
      "click",
      () => {

        abrirDetalhesUsuario(
          botao.dataset.detalhesUsuario
        );
      }
    );
  });

  document
    .querySelectorAll("[data-editar-usuario]")
    .forEach(botao => {

      botao.addEventListener(
        "click",
        () => {

          editarUsuario(
            botao.dataset.editarUsuario
          );
        }
      );
    });

  document
    .querySelectorAll("[data-face-usuario]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        const usuario = usuariosCache.find(item => item.id == botao.dataset.faceUsuario);

        if (!usuario) {
          alert("Usuário não encontrado.");
          return;
        }

        abrirCadastroFaceGestor(usuario);
      });
    });
}

async function alterarStatusUsuario(id) {

  try {

    await request(
      `/gestor/usuarios/${id}/status`,
      {
        method: "PATCH"
      }
    );

    await carregarUsuarios();

  } catch (error) {

    console.error(error);

    alert("Erro ao alterar status");
  }
}

async function abrirFormularioAluno() {

  abrirModal({
    titulo: "Cadastrar aluno",

   conteudo: `
  <form id="formAluno">

    <div class="grupo-form">
      <label>Perfil</label>

      <select id="perfilUsuario" required>
        <option value="">Selecione</option>
        <option value="1">Aluno</option>
        <option value="2">Professor</option>
      </select>
    </div>

    <div class="grupo-form">
      <label>Nome</label>

      <input
        type="text"
        id="nomeAluno"
        required
      >
    </div>

    <div class="grupo-form">
      <label>Email</label>

      <input
        type="email"
        id="emailAluno"
        required
      >
    </div>

    <div class="grupo-form">
      <label>Senha</label>

      <input
        type="password"
        id="senhaAluno"
        required
      >
    </div>

    <div id="camposAluno" style="display:none;">

      <div class="grupo-form">
        <label>Matrícula</label>

        <input
          type="text"
          id="matriculaAluno"
        >
      </div>

      <div class="grupo-form">

        <label>Turma</label>

        <select id="turmaAluno">

          <option value="">
            Selecione uma turma
          </option>

        </select>

      </div>

    </div>

    <div id="camposProfessor" style="display:none;">

      <div class="grupo-form">
        <label>Especialidade</label>

        <input
          type="text"
          id="especialidadeProfessor"
        >
      </div>

    </div>

    <label class="grupo-form" style="display:flex; gap:10px; align-items:center; flex-direction:row; font-weight:700;">
      <input type="checkbox" id="cadastrarFaceAgora">
      Cadastrar rosto logo após salvar
    </label>

    <button type="submit">
      Cadastrar
    </button>

  </form>
`
  });

  // CARREGA AS TURMAS AQUI
  await carregarTurmasSelect();
const perfilSelect =
  document.getElementById("perfilUsuario");

const camposAluno =
  document.getElementById("camposAluno");

const camposProfessor =
  document.getElementById("camposProfessor");

perfilSelect.addEventListener(
  "change",
  async () => {

    const perfilId =
      Number(perfilSelect.value);

    camposAluno.style.display =
      perfilId === 1
        ? "block"
        : "none";

    camposProfessor.style.display =
      perfilId === 2
        ? "block"
        : "none";

    if (perfilId === 1) {
      await carregarTurmasSelect();
    }
  }
);

  document
    .getElementById("formAluno")
    .addEventListener(
      "submit",
      cadastrarAluno
    );
}

async function carregarTurmasSelect() {

  try {

    const turmas =
      await request(
        "/gestor/turmas/resumo"
      );

    const select =
      document.getElementById(
        "turmaAluno"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione uma turma
      </option>
    `;

    turmas.forEach(turma => {

      select.innerHTML += `
        <option value="${turma.id}">
          ${turma.nome}
        </option>
      `;
    });

  } catch (error) {

    console.error(error);

    alert("Erro ao carregar turmas");
  }
}

async function cadastrarAluno(event) {

  event.preventDefault();

  try {

    const perfilId =
  Number(
    document.getElementById(
      "perfilUsuario"
    ).value
  );

const body = {

  nome:
    document.getElementById(
      "nomeAluno"
    ).value,

  email:
    document.getElementById(
      "emailAluno"
    ).value,

  senha:
    document.getElementById(
      "senhaAluno"
    ).value,

  perfilId
};

if (perfilId === 1) {

  body.matricula =
    document.getElementById(
      "matriculaAluno"
    ).value;

  body.turmaId =
    Number(
      document.getElementById(
        "turmaAluno"
      ).value
    );
}

if (perfilId === 2) {

  body.especialidade =
    document.getElementById(
      "especialidadeProfessor"
    ).value;
}

    const cadastrarFaceAgora = document.getElementById("cadastrarFaceAgora")?.checked;

    const usuarioCriadoResposta = await request(
      "/gestor/usuarios/completo",
      {
        method: "POST",

        body: JSON.stringify(body)
      }
    );

    await carregarUsuarios();

    const usuarioCriado = normalizarUsuarioCriado(
      usuarioCriadoResposta,
      body,
      perfilId
    );

    if (cadastrarFaceAgora) {
      abrirCadastroFaceGestor(usuarioCriado);
      return;
    }

    fecharModal();

    alert(
      perfilId === 1
        ? "Aluno cadastrado com sucesso!"
        : "Professor cadastrado com sucesso!"
    );

  } catch (error) {
  console.error(error);

  if (error.message.includes("Email já cadastrado")) {
    alert("Esse email já está cadastrado. Use outro email.");
    return;
  }

  alert("Erro ao cadastrar aluno");
    }
}

async function editarUsuario(id) {
  const usuario = usuariosCache.find(u => u.id == id);

  if (!usuario) {
    alert("Usuário não encontrado");
    return;
  }

  const detalhes = await request(
    `/gestor/usuarios/${id}/detalhes`
  );

  const ehAluno =
    usuario.perfil?.toLowerCase() === "aluno";

  const ehProfessor =
    usuario.perfil?.toLowerCase() === "professor";

  abrirModal({
    titulo: "Editar usuário",

    conteudo: `
      <form id="formEditarUsuario">

        <div class="grupo-form">
          <label>Nome</label>
          <input
            type="text"
            id="editarNomeUsuario"
            value="${usuario.nome}"
            required
          >
        </div>

        <div class="grupo-form">
          <label>Email</label>
          <input
            type="email"
            id="editarEmailUsuario"
            value="${usuario.email}"
            required
          >
        </div>

        ${
          ehAluno
            ? `
              <div class="grupo-form">
                <label>Turma</label>
                <select id="editarTurmaAluno" required>
                  <option value="">
                    Carregando turmas...
                  </option>
                </select>
              </div>
            `
            : ""
        }

        ${
          ehProfessor
            ? `
              <div class="grupo-form">
                <label>Especialidade</label>
                <input
                  type="text"
                  id="editarEspecialidadeProfessor"
                  value="${detalhes.especialidade ?? ""}"
                  required
                >
              </div>
            `
            : ""
        }

        <button type="submit">
          Salvar alterações
        </button>

      </form>
    `
  });

  if (ehAluno) {
    await carregarTurmasSelectEdicao(usuario.turmaId);
  }

  document
    .getElementById("formEditarUsuario")
    .addEventListener("submit", event => {
      salvarEdicaoUsuario(
        event,
        usuario.id,
        ehAluno,
        ehProfessor
      );
    });
}

async function salvarEdicaoUsuario(event, id, ehAluno, ehProfessor) {
  event.preventDefault();

  try {
    const body = {
      nome: document.getElementById("editarNomeUsuario").value,
      email: document.getElementById("editarEmailUsuario").value
    };

    if (ehAluno) {
      const turmaId = Number(
        document.getElementById("editarTurmaAluno").value
      );

      if (!turmaId) {
        alert("Selecione uma turma");
        return;
      }

      body.turmaId = turmaId;
    }

    if (ehProfessor) {
      body.especialidade =
        document.getElementById(
          "editarEspecialidadeProfessor"
        ).value;
    }

    await request(`/gestor/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });

    fecharModal();
    await carregarUsuarios();

    alert("Usuário editado com sucesso!");

  } catch (error) {
    console.error(error);
    alert("Erro ao editar usuário");
  }
}

async function carregarTurmasSelectEdicao(
  turmaSelecionada = null
) {

  try {

    const turmas =
      await request(
        "/gestor/turmas/resumo"
      );

    const select =
      document.getElementById(
        "editarTurmaAluno"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione uma turma
      </option>
    `;

    turmas.forEach(turma => {

      select.innerHTML += `
        <option
          value="${turma.id}"
          ${turma.id == turmaSelecionada
            ? "selected"
            : ""}
        >
          ${turma.nome}
        </option>
      `;
    });

  } catch (error) {

    console.error(error);

    alert(
      "Erro ao carregar turmas"
    );
  }
}

async function abrirDetalhesUsuario(id) {

  try {

    const usuario =
      await request(
        `/gestor/usuarios/${id}/detalhes`
      );

    abrirModal({
      titulo: "Detalhes do usuário",

      conteudo: `
        <div class="detalhes-usuario">

          <p>
            <strong>Nome:</strong>
            ${usuario.nome}
          </p>

          <p>
            <strong>Email:</strong>
            ${usuario.email}
          </p>

          <p>
            <strong>Perfil:</strong>
            ${usuario.perfil}
          </p>

          ${
            usuario.turma
            ? `
              <p>
                <strong>Turma:</strong>
                ${usuario.turma}
              </p>
            `
            : ""
          }

          ${
            usuario.matricula
            ? `
              <p>
                <strong>Matrícula:</strong>
                ${usuario.matricula}
              </p>
            `
            : ""
          }

          ${
            usuario.frequencia != null
            ? `
              <p>
                <strong>Frequência:</strong>
                ${usuario.frequencia}%
              </p>
            `
            : ""
          }

          ${
            usuario.especialidade
            ? `
              <p>
                <strong>Especialidade:</strong>
                ${usuario.especialidade}
              </p>
            `
            : ""
          }

        </div>
      `
    });

  } catch (error) {

    console.error(error);

    alert("Erro ao carregar detalhes");
  }
}
function normalizarUsuarioCriado(resposta, body, perfilId) {
  const perfil = perfilId === 1 ? "aluno" : "professor";
  const usuarioEncontrado = usuariosCache.find(usuario =>
    String(usuario.email ?? "").toLowerCase() === String(body.email ?? "").toLowerCase()
  );

  return {
    ...(usuarioEncontrado || {}),
    ...(resposta || {}),
    nome: resposta?.nome ?? usuarioEncontrado?.nome ?? body.nome,
    email: resposta?.email ?? usuarioEncontrado?.email ?? body.email,
    perfil: resposta?.perfil ?? usuarioEncontrado?.perfil ?? perfil,
    id: resposta?.id ?? resposta?.usuarioId ?? usuarioEncontrado?.id,
    alunoId: resposta?.alunoId ?? usuarioEncontrado?.alunoId,
    professorId: resposta?.professorId ?? usuarioEncontrado?.professorId
  };
}

function abrirCadastroFaceGestor(usuario) {
  const perfil = String(usuario?.perfil ?? "").toLowerCase();

  if (perfil === "gestor") {
    alert("O cadastro facial pelo gestor está liberado apenas para alunos e professores.");
    return;
  }

  const nome = usuario?.nome || "Usuário";
  const perfilLabel = perfil === "professor" ? "professor" : "aluno";

  abrirModal({
    titulo: `Cadastrar rosto - ${nome}`,
    conteudo: `
      <div class="perfil-bio-card">
        <div class="perfil-card__header">
          <div>
            <span class="perfil-eyebrow">Biometria facial</span>
            <h3>${nome}</h3>
            <p>Capture o rosto do ${perfilLabel} para deixar o reconhecimento preparado antes da chamada.</p>
          </div>
        </div>

        <div class="perfil-bio-stage" id="gestorFaceStage">
          <video id="gestorFaceVideo" class="perfil-bio-video" autoplay playsinline muted></video>
          <canvas id="gestorFaceCanvas" style="display:none;"></canvas>

          <div class="perfil-bio-placeholder">
            <div>
              <div class="perfil-bio-face-icon"></div>
              <strong>Câmera fechada</strong>
              <span>Abra a câmera e mantenha apenas uma pessoa no enquadramento.</span>
            </div>
          </div>
        </div>

        <div class="perfil-bio-actions">
          <button class="perfil-bio-btn secondary" id="btnGestorAbrirCamera" type="button">Abrir câmera</button>
          <button class="perfil-bio-btn primary" id="btnGestorSalvarFace" type="button">Salvar rosto</button>
          <button class="perfil-bio-btn danger" id="btnGestorPararCamera" type="button">Parar câmera</button>
          <button class="perfil-bio-btn secondary" id="btnGestorFinalizarFace" type="button">Finalizar depois</button>
        </div>

        <div class="perfil-bio-feedback" id="gestorFaceFeedback">
          Conferindo servidor de biometria.
        </div>
      </div>
    `
  });

  configurarCadastroFaceGestor(usuario);
}

async function configurarCadastroFaceGestor(usuario) {
  const video = document.getElementById("gestorFaceVideo");
  const canvas = document.getElementById("gestorFaceCanvas");
  const stage = document.getElementById("gestorFaceStage");
  const feedback = document.getElementById("gestorFaceFeedback");
  const btnAbrir = document.getElementById("btnGestorAbrirCamera");
  const btnSalvar = document.getElementById("btnGestorSalvarFace");
  const btnParar = document.getElementById("btnGestorPararCamera");
  const btnFinalizar = document.getElementById("btnGestorFinalizarFace");

  if (!video || !canvas || !stage || !feedback || !btnAbrir || !btnSalvar || !btnParar || !btnFinalizar) {
    return;
  }

  btnAbrir.disabled = true;
  btnSalvar.disabled = true;
  btnParar.disabled = true;

  try {
    const servidor = await verificarServidorBiometria();

    if (!servidor?.sucesso) {
      throw new Error(servidor?.mensagem || "Servidor de biometria offline.");
    }

    feedback.textContent = "Servidor ativo. Abra a câmera para capturar a face.";
    feedback.className = "perfil-bio-feedback success";

    btnAbrir.disabled = false;
    btnSalvar.disabled = false;
    btnParar.disabled = false;
  } catch (error) {
    console.error(error);
    feedback.textContent = error.message || "Servidor de biometria offline. Inicie o Python primeiro.";
    feedback.className = "perfil-bio-feedback error";
    return;
  }

  btnAbrir.addEventListener("click", async () => {
    try {
      feedback.textContent = "Abrindo câmera...";
      feedback.className = "perfil-bio-feedback loading";

      await iniciarCameraBiometria(video);
      stage.classList.add("is-camera-on");
      stage.classList.remove("is-approved");

      feedback.textContent = "Câmera aberta. Centralize o rosto.";
      feedback.className = "perfil-bio-feedback success";
    } catch (error) {
      console.error(error);
      feedback.textContent = error.message || "Erro ao abrir câmera.";
      feedback.className = "perfil-bio-feedback error";
    }
  });

  btnSalvar.addEventListener("click", async () => {
    try {
      const perfil = String(usuario?.perfil ?? "aluno").toLowerCase();
      const pessoaId = resolverPessoaIdGestor(usuario, perfil);

      if (!pessoaId) {
        throw new Error("Não foi possível identificar o usuário para salvar a face.");
      }

      if (!cameraEstaAtiva()) {
        await iniciarCameraBiometria(video);
      }

      stage.classList.add("is-camera-on", "is-scanning");
      stage.classList.remove("is-approved");

      feedback.textContent = "Capturando e enviando rosto para o Python...";
      feedback.className = "perfil-bio-feedback loading";

      await aguardarCadastroFaceGestor(1100);

      const imagemBase64 = capturarImagemBiometria(video, canvas);

      const resultado = await cadastrarFacePython({
        perfil,
        pessoaId,
        usuarioId: usuario.id,
        alunoId: perfil === "aluno" ? (usuario.alunoId ?? usuario.idAluno ?? null) : null,
        pessoaNome: usuario.nome || "Usuário",
        imagemBase64
      });

      stage.classList.remove("is-scanning");
      stage.classList.add("is-approved");

      feedback.textContent = resultado?.mensagem || "Rosto cadastrado com sucesso.";
      feedback.className = "perfil-bio-feedback success";
    } catch (error) {
      console.error(error);
      stage.classList.remove("is-scanning");
      feedback.textContent = error.message || "Erro ao cadastrar rosto.";
      feedback.className = "perfil-bio-feedback error";
    }
  });

  btnParar.addEventListener("click", () => {
    pararCameraBiometria(video);
    stage.classList.remove("is-camera-on", "is-scanning");
    feedback.textContent = "Câmera encerrada.";
    feedback.className = "perfil-bio-feedback";
  });

  btnFinalizar.addEventListener("click", async () => {
    pararCameraBiometria(video);
    fecharModal();
    await carregarUsuarios();
  });
}

function resolverPessoaIdGestor(usuario, perfil) {
  if (perfil === "aluno") {
    return usuario.alunoId ?? usuario.idAluno ?? usuario.pessoaId ?? usuario.id;
  }

  if (perfil === "professor") {
    return usuario.professorId ?? usuario.idProfessor ?? usuario.pessoaId ?? usuario.id;
  }

  return usuario.pessoaId ?? usuario.id;
}

function aguardarCadastroFaceGestor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
