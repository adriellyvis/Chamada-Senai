import { mostrarToast } from "../core/ui-feedback.js";
import {
  iniciarCameraBiometria,
  pararCameraBiometria,
  cameraEstaAtiva
} from "./camera-biometria.js";

import {
  cadastrarFacePython,
  consultarFacePython,
  verificarServidorBiometria
} from "./biometria-api.js";

import {
  criarCadastroFacialGuiado,
  prepararPainelCadastroFacialGuiado
} from "./cadastro-facial-guiado.js";

export function obterUsuarioPerfil() {
  const chaves = ["usuario", "usuarioLogado"];

  for (const chave of chaves) {
    const valor = sessionStorage.getItem(chave) || localStorage.getItem(chave);

    if (!valor) continue;

    try {
      const usuario = JSON.parse(valor);
      if (usuario && typeof usuario === "object") return usuario;
    } catch (erro) {
      console.error(`Erro ao ler ${chave}:`, erro);
    }
  }

  return null;
}

export function normalizarPerfil(perfil, fallback = "usuario") {
  const valor = String(perfil ?? fallback).toLowerCase();

  const mapa = {
    aluno: "Aluno",
    professor: "Professor",
    gestor: "Gestor",
    usuario: "Usuário"
  };

  return mapa[valor] ?? valor.charAt(0).toUpperCase() + valor.slice(1);
}

export function resolverIdentificadorBiometrico(usuario = {}, perfil = "usuario") {
  // A biometria é vinculada exclusivamente à tabela usuarios.
  // IDs de aluno/professor/gestor continuam sendo enviados separadamente
  // apenas quando alguma regra de domínio precisar deles.
  return usuario.usuarioId ?? usuario.id ?? usuario.pessoaId ?? null;
}

export function montarHeroPerfil({ usuario, perfil, descricao }) {
  const nome = usuario?.nome || "Usuário";
  const letra = nome.charAt(0).toUpperCase() || "U";
  const perfilLabel = normalizarPerfil(perfil, usuario?.perfil);
  const status = usuario?.ativo === false ? "Inativo" : "Ativo";

  return `
    <section class="perfil-hero">
      <div class="perfil-hero__identity">
        <div class="perfil-hero__avatar">${escaparHtml(letra)}</div>

        <div>
          <span class="perfil-eyebrow">Perfil ${escaparHtml(perfilLabel)}</span>
          <h2>${escaparHtml(nome)}</h2>
          <p>${escaparHtml(descricao || "Confira seus dados e mantenha a biometria facial preparada para uso no Prezence.")}</p>
        </div>
      </div>

      <div class="perfil-hero__status">
        <div class="perfil-mini-card">
          <span>Status da conta</span>
          <strong>${escaparHtml(status)}</strong>
        </div>

        <div class="perfil-mini-card">
          <span>Identificador</span>
          <strong>#${escaparHtml(usuario?.id ?? "-")}</strong>
        </div>
      </div>
    </section>
  `;
}

export function montarCardDadosPerfil({ usuario, perfil, camposExtras = [] }) {
  const campos = [
    { rotulo: "Nome", valor: usuario?.nome || "-" },
    { rotulo: "Email", valor: usuario?.email || "-" },
    { rotulo: "Perfil", valor: normalizarPerfil(usuario?.perfil, perfil) },
    ...camposExtras
  ];

  return `
    <article class="perfil-card">
      <div class="perfil-card__header">
        <div>
          <span class="perfil-eyebrow">Dados básicos</span>
          <h3>Informações da conta</h3>
          <p>Esses dados vêm do login atual e podem ser ampliados pelo backend depois.</p>
        </div>
      </div>

      <div class="perfil-fields">
        ${campos.map(campo => `
          <div class="perfil-field">
            <span>${escaparHtml(campo.rotulo)}</span>
            <strong>${escaparHtml(campo.valor ?? "-")}</strong>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

export function montarCardBiometriaPerfil({ titulo = "Cadastro facial", descricao = "Cadastre seu rosto uma vez para facilitar as próximas validações biométricas." } = {}) {
  return `
    <article class="perfil-card perfil-bio-card">
      <div class="perfil-card__header">
        <div>
          <span class="perfil-eyebrow">ByoID</span>
          <h3>${escaparHtml(titulo)}</h3>
          <p>${escaparHtml(descricao)}</p>
        </div>

        <span class="perfil-bio-status" id="perfilBioStatus">Verificando</span>
      </div>

      <div class="perfil-bio-stage" id="perfilBioStage">
        <video id="perfilBioVideo" class="perfil-bio-video" autoplay playsinline muted></video>
        <canvas id="perfilBioCanvas" style="display:none;"></canvas>

        <div class="perfil-bio-placeholder">
          <div>
            <div class="perfil-bio-face-icon"></div>
            <strong id="perfilBioTituloCamera">Câmera fechada</strong>
            <span id="perfilBioSubtituloCamera">Abra a câmera somente quando for cadastrar ou atualizar a face.</span>
          </div>
        </div>
      </div>

      <div id="perfilBioGuia"></div>

      <div class="perfil-bio-actions">
        <button class="perfil-bio-btn secondary" id="btnPerfilAlternarCamera" type="button">Abrir câmera</button>
        <button class="perfil-bio-btn primary" id="btnPerfilCadastrarFace" type="button">Iniciar cadastro guiado</button>
      </div>

      <div class="perfil-bio-feedback" id="perfilBioFeedback" role="status" aria-live="polite">
        Verificando disponibilidade da biometria.
      </div>

      <p class="perfil-bio-hint">
        Use boa iluminação, deixe apenas uma pessoa no enquadramento e mantenha o rosto centralizado.
      </p>
    </article>
  `;
}

export async function configurarCadastroFacialPerfil({ perfil, usuario, pessoaId, pessoaNome }) {
  const video = document.getElementById("perfilBioVideo");
  const canvas = document.getElementById("perfilBioCanvas");
  const stage = document.getElementById("perfilBioStage");
  const feedback = document.getElementById("perfilBioFeedback");
  const status = document.getElementById("perfilBioStatus");
  const btnAlternarCamera = document.getElementById("btnPerfilAlternarCamera");
  const btnCadastrar = document.getElementById("btnPerfilCadastrarFace");
  const tituloCamera = document.getElementById("perfilBioTituloCamera");
  const subtituloCamera = document.getElementById("perfilBioSubtituloCamera");
  const guiaContainer = document.getElementById("perfilBioGuia");

  if (!video || !canvas || !stage || !feedback || !status || !btnAlternarCamera || !btnCadastrar) {
    console.error("Elementos do perfil biométrico não encontrados.");
    return;
  }

  const perfilNormalizado = String(perfil || usuario?.perfil || "usuario").toLowerCase();
  const idBiometrico = pessoaId || resolverIdentificadorBiometrico(usuario, perfilNormalizado);
  const nome = pessoaNome || usuario?.nome || "Usuário";
  const painelGuia = prepararPainelCadastroFacialGuiado(guiaContainer);

  let cameraAberta = false;
  let cadastroSalvo = false;

  const atualizarBotaoCamera = () => {
    const ativa = cameraEstaAtiva() && cameraAberta;

    btnAlternarCamera.textContent = ativa ? "Fechar câmera" : "Abrir câmera";
    btnAlternarCamera.classList.toggle("danger", ativa);
    btnAlternarCamera.classList.toggle("secondary", !ativa);
    btnAlternarCamera.setAttribute("aria-pressed", String(ativa));

    stage.classList.toggle("is-camera-on", ativa);

    if (!ativa) {
      stage.classList.remove("is-scanning");
    }
  };

  const abrirCamera = async () => {
    feedback.textContent = "Abrindo câmera...";
    feedback.className = "perfil-bio-feedback loading";

    await iniciarCameraBiometria(video);
    cameraAberta = true;

    stage.classList.remove("is-approved");
    atualizarBotaoCamera();

    feedback.textContent = "Câmera aberta. Inicie o cadastro guiado e siga cada instrução.";
    feedback.className = "perfil-bio-feedback success";
  };

  const fecharCamera = (mensagem = "Câmera encerrada.") => {
    pararCameraBiometria(video);
    cameraAberta = false;
    atualizarBotaoCamera();

    feedback.textContent = mensagem;
    feedback.className = "perfil-bio-feedback";
  };

  const cadastroGuiado = criarCadastroFacialGuiado({
    videoElement: video,
    canvasElement: canvas,
    aoAtualizar(estadoGuia) {
      painelGuia.atualizar(estadoGuia);
      btnCadastrar.textContent = estadoGuia.textoBotao;
      btnCadastrar.disabled = Boolean(estadoGuia.processando);

      if (estadoGuia.tipo === "validando") {
        stage.classList.add("is-scanning");
        feedback.textContent = estadoGuia.mensagem;
        feedback.className = "perfil-bio-feedback loading";
      } else if (estadoGuia.tipo === "rejeitada" || estadoGuia.tipo === "erro") {
        stage.classList.remove("is-scanning");
        feedback.textContent = estadoGuia.mensagem;
        feedback.className = "perfil-bio-feedback error";
      } else if (estadoGuia.tipo === "aceita") {
        stage.classList.remove("is-scanning");
        feedback.textContent = estadoGuia.mensagem;
        feedback.className = "perfil-bio-feedback success";
      } else if (estadoGuia.tipo === "pronta") {
        feedback.textContent = estadoGuia.mensagem;
        feedback.className = "perfil-bio-feedback loading";
      }
    }
  });

  btnAlternarCamera.disabled = true;
  btnCadastrar.disabled = true;
  atualizarBotaoCamera();

  try {
    const servidor = await verificarServidorBiometria();

    if (!servidor?.sucesso) {
      throw new Error(servidor?.mensagem || "Reconhecimento facial temporariamente indisponível.");
    }

    feedback.textContent = "Biometria disponível. Abra a câmera para começar.";
    feedback.className = "perfil-bio-feedback success";

    btnAlternarCamera.disabled = false;
    btnCadastrar.disabled = false;

    await atualizarStatusFace({ perfil: perfilNormalizado, usuario, pessoaId: idBiometrico, status });
  } catch (erro) {
    console.error("Erro ao verificar biometria:", erro);
    feedback.textContent = erro.message || "Reconhecimento facial temporariamente indisponível. Tente novamente em alguns instantes.";
    feedback.className = "perfil-bio-feedback error";
    status.textContent = "Offline";
    status.className = "perfil-bio-status";
    return;
  }

  btnAlternarCamera.addEventListener("click", async () => {
    try {
      if (cameraAberta && cameraEstaAtiva()) {
        fecharCamera();
        return;
      }

      await abrirCamera();
    } catch (erro) {
      console.error("Erro ao alternar câmera:", erro);
      cameraAberta = false;
      atualizarBotaoCamera();
      feedback.textContent = erro.message || "Não foi possível acessar a câmera.";
      feedback.className = "perfil-bio-feedback error";
    }
  });

  btnCadastrar.addEventListener("click", async () => {
    try {
      if (!idBiometrico) {
        throw new Error("Não foi possível identificar o usuário para vincular a face.");
      }

      const cameraVinculada = Boolean(
        video.srcObject?.getVideoTracks?.().some(track => track.readyState === "live")
      );

      if (!cameraEstaAtiva() || !cameraVinculada) {
        await abrirCamera();
      } else {
        cameraAberta = true;
        atualizarBotaoCamera();
      }

      if (cadastroSalvo || cadastroGuiado.obterEstado().concluido) {
        cadastroSalvo = false;
        stage.classList.remove("is-approved");
        cadastroGuiado.reiniciar();
        return;
      }

      if (!cadastroGuiado.obterEstado().ativo) {
        cadastroGuiado.iniciar();
        return;
      }

      const captura = await cadastroGuiado.capturarAtual();

      if (!captura?.aceita || !captura?.concluido) {
        return;
      }

      btnCadastrar.disabled = true;
      feedback.textContent = "Salvando as cinco amostras faciais...";
      feedback.className = "perfil-bio-feedback loading";

      const resultado = await cadastrarFacePython({
        perfil: perfilNormalizado,
        pessoaId: usuario?.usuarioId ?? usuario?.id ?? idBiometrico,
        pessoaNome: nome,
        usuarioId: usuario?.usuarioId ?? usuario?.id,
        alunoId: perfilNormalizado === "aluno"
          ? (usuario?.alunoId ?? usuario?.idAluno ?? usuario?.estudanteId ?? null)
          : null,
        imagensBase64: captura.imagensBase64,
        modoGuiado: true,
        etapasCadastro: captura.etapasCadastro
      });

      cadastroSalvo = true;
      stage.classList.remove("is-scanning");
      stage.classList.add("is-approved");

      fecharCamera();
      if (tituloCamera) tituloCamera.textContent = "Cadastro facial concluído";
      if (subtituloCamera) subtituloCamera.textContent = "Seu rosto foi salvo com sucesso. Abra a câmera apenas se quiser cadastrar novamente.";

      feedback.textContent = resultado?.mensagem || "Cadastro facial concluído com sucesso.";
      feedback.className = "perfil-bio-feedback success";
      mostrarToast("Cadastro facial concluído com sucesso.", "sucesso");
      status.textContent = "Cadastrado";
      status.className = "perfil-bio-status ok";
      btnCadastrar.textContent = "Cadastrar novamente";
      btnCadastrar.disabled = false;
      atualizarBotaoCamera();
    } catch (erro) {
      console.error("Erro ao cadastrar face pelo perfil:", erro);
      stage.classList.remove("is-scanning");
      feedback.textContent = erro.message || "Erro ao cadastrar rosto.";
      feedback.className = "perfil-bio-feedback error";
      btnCadastrar.disabled = false;
      atualizarBotaoCamera();
    }
  });
}

async function atualizarStatusFace({ perfil, usuario, pessoaId, status }) {
  try {
    const resultado = await consultarFacePython({
      perfil,
      pessoaId: usuario?.usuarioId ?? usuario?.id ?? pessoaId,
      usuarioId: usuario?.usuarioId ?? usuario?.id,
      alunoId: perfil === "aluno"
        ? (usuario?.alunoId ?? usuario?.idAluno ?? usuario?.estudanteId ?? null)
        : null
    });

    if (resultado?.cadastrada) {
      status.textContent = "Cadastrado";
      status.className = "perfil-bio-status ok";
      return;
    }

    status.textContent = "Pendente";
    status.className = "perfil-bio-status";
  } catch (erro) {
    console.error("Erro ao consultar face:", erro);
    status.textContent = "Pendente";
    status.className = "perfil-bio-status";
  }
}

function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
