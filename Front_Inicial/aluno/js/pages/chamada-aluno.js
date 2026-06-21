import {
  iniciarCameraBiometria,
  capturarImagemBiometria,
  pararCameraBiometria,
  cameraEstaAtiva
} from "../../../biometria/camera-biometria.js";

import {
  cadastrarFacePython,
  verificarFacePython,
  verificarServidorBiometria
} from "../../../biometria/biometria-api.js";

import {
  registrarPresencaBiometrica
} from "../../../biometria/presenca-biometrica-api.js";

import {
  buscarChamadaAbertaAluno
} from "../../../biometria/chamada-aberta-api.js";

export function abrirChamadaAluno(container) {
  container.innerHTML = `
    <div class="chamada-page">
      <section class="chamada-layout">
        <article class="card chamada-camera-card">
          <div class="chamada-header">
            <div>
              <span class="page-tag">CHAMADA ABERTA</span>
              <h2>Validação Biométrica Facial</h2>
              <p>Posicione seu rosto no centro da câmera para confirmar sua presença.</p>
            </div>

            <span class="chamada-status chamada-status--open" id="statusChamada">
              Aguardando aluno
            </span>
          </div>

          <div class="aula-resumo-mobile">
            <strong>Carregando disciplina...</strong>
            <span>Buscando chamada aberta...</span>
          </div>

          <div class="camera-stage">
            <div class="camera-bar">
              <div>
                <span class="camera-live"></span>
                <strong>Câmera do aluno</strong>
              </div>

              <span class="camera-mode">Reconhecimento facial</span>
            </div>

            <div class="camera-preview-area" id="cameraPreviewArea">
              <div class="scan-line"></div>

              <video 
                id="videoBiometria" 
                class="video-biometria" 
                autoplay 
                playsinline>
              </video>

              <canvas 
                id="canvasBiometria" 
                style="display:none;">
              </canvas>

              <div class="face-frame">
                <div class="corner corner-tl"></div>
                <div class="corner corner-tr"></div>
                <div class="corner corner-bl"></div>
                <div class="corner corner-br"></div>

                <div class="face-placeholder" id="facePlaceholder">
                  <div class="face-head"></div>
                  <div class="face-neck"></div>
                  <div class="face-shoulders"></div>
                </div>
              </div>

              <div class="camera-message">
                <strong id="cameraMensagem">Clique em iniciar reconhecimento</strong>
                <span id="cameraSubmensagem">A câmera será aberta para validar seu rosto</span>
              </div>
            </div>
          </div>

          <div class="chamada-actions">
            <button class="primary-btn" id="btnIniciarBiometria">
              Iniciar reconhecimento
            </button>

            <button class="outline-btn" id="btnCadastrarFace">
              Cadastrar meu rosto
            </button>

            <button class="outline-btn" id="btnConfirmarPresenca" disabled>
              Confirmar presença
            </button>

            <button class="outline-btn" id="btnPararBiometria">
              Parar câmera
            </button>
          </div>

          <div class="biometria-feedback" id="biometriaFeedback">
            Aguardando início da leitura facial.
          </div>
        </article>

        <aside class="chamada-side">
          <article class="card aula-card">
            <h3>Chamada em andamento</h3>

            <div class="aula-destaque">
              <span>Disciplina</span>
              <strong>Carregando...</strong>
              <p>Buscando professor...</p>
            </div>

            <div class="aula-info-list">
              <div>
                <span>Horário</span>
                <strong>10h00 - 14h00</strong>
              </div>

              <div>
                <span>Turma</span>
                <strong>Carregando...</strong>
              </div>

              <div>
                <span>Método</span>
                <strong>Biometria facial</strong>
              </div>

              <div>
                <span>Status</span>
                <strong class="status-open-text">Aberta</strong>
              </div>
            </div>
          </article>

          <article class="card fluxo-card">
            <h3>Fluxo da presença</h3>

            <div class="fluxo-list">
              <div class="fluxo-item is-done">
                <span>1</span>
                <p>Professor abriu a chamada</p>
              </div>

              <div class="fluxo-item is-active" id="fluxoAluno">
                <span>2</span>
                <p>Aluno faz validação facial</p>
              </div>

              <div class="fluxo-item" id="fluxoSistema">
                <span>3</span>
                <p>Sistema reconhece o rosto</p>
              </div>

              <div class="fluxo-item" id="fluxoProfessor">
                <span>4</span>
                <p>Professor recebe confirmação</p>
              </div>
            </div>
          </article>

          <article class="card retorno-card">
            <h3>Retorno para o professor</h3>

            <div class="retorno-box" id="retornoProfessor">
              Nenhuma confirmação enviada ainda.
            </div>
          </article>
        </aside>
      </section>
    </div>
  `;

  configurarBiometriaReal();
}

function configurarBiometriaReal() {
  const btnIniciar = document.getElementById("btnIniciarBiometria");
  const btnCadastrarFace = document.getElementById("btnCadastrarFace");
  const btnConfirmar = document.getElementById("btnConfirmarPresenca");
  const btnParar = document.getElementById("btnPararBiometria");

  const feedback = document.getElementById("biometriaFeedback");
  const statusChamada = document.getElementById("statusChamada");
  const retornoProfessor = document.getElementById("retornoProfessor");

  const cameraMensagem = document.getElementById("cameraMensagem");
  const cameraSubmensagem = document.getElementById("cameraSubmensagem");
  const cameraPreviewArea = document.getElementById("cameraPreviewArea");
  const facePlaceholder = document.getElementById("facePlaceholder");

  const videoBiometria = document.getElementById("videoBiometria");
  const canvasBiometria = document.getElementById("canvasBiometria");

  const fluxoAluno = document.getElementById("fluxoAluno");
  const fluxoSistema = document.getElementById("fluxoSistema");
  const fluxoProfessor = document.getElementById("fluxoProfessor");

  let chamadaAberta = null;
  let rostoValidado = false;

  if (!btnIniciar || !btnCadastrarFace || !btnConfirmar || !btnParar || !feedback || !videoBiometria || !canvasBiometria ) {
    console.error("Elementos da biometria não encontrados.");
    return;
  }
  
  
  async function carregarChamadaAberta() {
        try {
          const usuario = obterUsuarioLogado();

          if (!usuario?.id) {
            throw new Error("Usuário logado não encontrado.");
          }

          chamadaAberta = await buscarChamadaAbertaAluno(usuario.id);

          document.querySelector(".aula-resumo-mobile strong").textContent =
            chamadaAberta.disciplina;

          document.querySelector(".aula-resumo-mobile span").textContent =
            `${chamadaAberta.professor} • ${chamadaAberta.horaInicio} - ${chamadaAberta.horaFim}`;

          document.querySelector(".aula-destaque strong").textContent =
            chamadaAberta.disciplina;

          document.querySelector(".aula-destaque p").textContent =
            chamadaAberta.professor;

          const aulaInfo = document.querySelectorAll(".aula-info-list div strong");

          if (aulaInfo[0]) {
            aulaInfo[0].textContent = `${chamadaAberta.horaInicio} - ${chamadaAberta.horaFim}`;
          }

          if (aulaInfo[1]) {
            aulaInfo[1].textContent = chamadaAberta.turma;
          }

          if (aulaInfo[3]) {
            aulaInfo[3].textContent = "Aberta";
          }

          statusChamada.textContent = "Chamada aberta";
          statusChamada.className = "chamada-status chamada-status--open";

          feedback.textContent = "Chamada aberta encontrada. Aguardando biometria.";
          feedback.className = "biometria-feedback biometria-feedback--success";

          btnIniciar.disabled = false;
          btnCadastrarFace.disabled = false;
          btnConfirmar.disabled = true;
          btnParar.disabled = false;

        } catch (erro) {
          console.error("Erro ao buscar chamada aberta:", erro);

          chamadaAberta = null;

          feedback.textContent = erro.message || "Nenhuma chamada aberta encontrada.";
          feedback.className = "biometria-feedback biometria-feedback--error";

          statusChamada.textContent = "Sem chamada aberta";
          statusChamada.className = "chamada-status chamada-status--error";

          btnIniciar.disabled = true;
          btnCadastrarFace.disabled = true;
          btnConfirmar.disabled = true;
          btnParar.disabled = true;
        }
      }

  verificarServidorBiometria().then(resultado => {
    if (!resultado.sucesso) {
      feedback.textContent = "Servidor de biometria offline. Inicie o Python antes de usar.";
      feedback.className = "biometria-feedback biometria-feedback--error";

      btnIniciar.disabled = true;
      btnCadastrarFace.disabled = true;
      btnConfirmar.disabled = true;

      btnIniciar.disabled = true;
      btnCadastrarFace.disabled = true;
      btnParar.disabled = true;

      return;
    }

    feedback.textContent = "Servidor de biometria ativo. Buscando chamada aberta...";

  btnIniciar.disabled = true;
  btnCadastrarFace.disabled = true;
  btnConfirmar.disabled = true;
  btnParar.disabled = true;
  });

  btnCadastrarFace.addEventListener("click", async () => {
  try {
    const usuario = obterUsuarioLogado();

    if (!usuario?.id) {
      throw new Error("Usuário logado não encontrado.");
    }

    feedback.textContent = "Abrindo câmera para cadastro facial...";
    feedback.className = "biometria-feedback biometria-feedback--loading";

    if (!cameraEstaAtiva()) {
      await iniciarCameraBiometria(videoBiometria);
    }

    if (facePlaceholder) {
      facePlaceholder.style.display = "none";
    }

    cameraMensagem.textContent = "Cadastro facial em andamento";
    cameraSubmensagem.textContent = "Olhe para a câmera e mantenha boa iluminação";
    cameraPreviewArea.classList.add("is-scanning");

    await aguardar(1200);
    if (!chamadaAberta?.alunoId) {
      throw new Error("Nenhuma chamada aberta carregada.");
    }

    const imagemBase64 = capturarImagemBiometria(
      videoBiometria,
      canvasBiometria
    );

    const resultado = await cadastrarFacePython({
      alunoId: chamadaAberta.alunoId,
      alunoNome: usuario.nome || "Aluno",
      imagemBase64
    });

    console.log("Cadastro facial:", resultado);

    feedback.textContent = "Rosto cadastrado com sucesso.";
    feedback.className = "biometria-feedback biometria-feedback--success";

    cameraMensagem.textContent = "Cadastro facial concluído";
    cameraSubmensagem.textContent = "Agora você pode validar sua presença.";

    cameraPreviewArea.classList.remove("is-scanning");
    cameraPreviewArea.classList.add("is-approved");

  } catch (erro) {
    console.error("Erro ao cadastrar rosto:", erro);

    feedback.textContent = erro.message || "Erro ao cadastrar rosto.";
    feedback.className = "biometria-feedback biometria-feedback--error";

    cameraMensagem.textContent = "Cadastro facial não concluído";
    cameraSubmensagem.textContent = "Verifique a câmera e tente novamente.";

    cameraPreviewArea.classList.remove("is-scanning");
  }
});

  btnIniciar.addEventListener("click", async () => {
    try {
      rostoValidado = false;

      btnIniciar.disabled = true;
      btnConfirmar.disabled = true;

      feedback.textContent = "Iniciando câmera...";
      feedback.className = "biometria-feedback biometria-feedback--loading";

      statusChamada.textContent = "Abrindo câmera";
      statusChamada.className = "chamada-status chamada-status--loading";

      cameraMensagem.textContent = "Abrindo câmera...";
      cameraSubmensagem.textContent = "Permita o acesso à webcam no navegador";
  
      if (!chamadaAberta?.alunoId) {
        throw new Error("Nenhuma chamada aberta carregada.");
      }

      await iniciarCameraBiometria(videoBiometria);

      if (facePlaceholder) {
        facePlaceholder.style.display = "none";
      }

      feedback.textContent = "Câmera iniciada. Posicione seu rosto no centro.";
      cameraMensagem.textContent = "Rosto em análise";
      cameraSubmensagem.textContent = "Mantenha o rosto centralizado e com boa iluminação";

      cameraPreviewArea.classList.add("is-scanning");

      statusChamada.textContent = "Validando rosto";
      statusChamada.className = "chamada-status chamada-status--loading";

      fluxoAluno.classList.remove("is-active");
      fluxoAluno.classList.add("is-done");

      fluxoSistema.classList.add("is-active");

      await aguardar(1200);

      const imagemBase64 = capturarImagemBiometria(videoBiometria, canvasBiometria);

      feedback.textContent = "Enviando imagem para reconhecimento facial...";

      const usuario = obterUsuarioLogado();

      if (!usuario?.id) {
        throw new Error("Usuário logado não encontrado.");
      }

      const resultado = await verificarFacePython({
        alunoId: chamadaAberta.alunoId,
        imagemBase64
      });

      console.log("Resultado da biometria:", resultado);

      if (!resultado.reconhecido) {
        rostoValidado = false;

        feedback.textContent = resultado.mensagem || `Rosto não corresponde ao aluno cadastrado. Confiança: ${resultado.confianca}`;
        feedback.className = "biometria-feedback biometria-feedback--error";

        statusChamada.textContent = "Aluno não reconhecido";
        statusChamada.className = "chamada-status chamada-status--error";

        cameraMensagem.textContent = "Aluno não reconhecido";
        cameraSubmensagem.textContent = "Cadastre o rosto novamente ou tente com melhor iluminação";

        cameraPreviewArea.classList.remove("is-scanning");
        cameraPreviewArea.classList.remove("is-approved");

        fluxoSistema.classList.remove("is-active");

        btnIniciar.disabled = false;
        btnIniciar.textContent = "Tentar novamente";

        return;
      }

      rostoValidado = true;

      feedback.textContent = `Aluno reconhecido com sucesso. Confiança: ${resultado.confianca}`;
      feedback.className = "biometria-feedback biometria-feedback--success";

      statusChamada.textContent = "Aluno reconhecido";
      statusChamada.className = "chamada-status chamada-status--success";

      cameraMensagem.textContent = "Aluno reconhecido com sucesso";
      cameraSubmensagem.textContent = "Validação pronta para confirmação";

      cameraPreviewArea.classList.remove("is-scanning");
      cameraPreviewArea.classList.add("is-approved");
      btnCadastrarFace.disabled = false;
      btnIniciar.disabled = false;

      fluxoSistema.classList.remove("is-active");
      fluxoSistema.classList.add("is-done");

      btnConfirmar.disabled = false;
      btnIniciar.textContent = "Reconhecimento concluído";

    } catch (erro) {
      console.error("Erro na biometria:", erro);

      rostoValidado = false;

      feedback.textContent = erro.message || "Erro ao validar biometria.";
      feedback.className = "biometria-feedback biometria-feedback--error";

      statusChamada.textContent = "Erro na validação";
      statusChamada.className = "chamada-status chamada-status--error";

      cameraMensagem.textContent = "Erro ao validar rosto";
      cameraSubmensagem.textContent = "Verifique se o servidor Python está rodando";

      cameraPreviewArea.classList.remove("is-scanning");

      fluxoSistema.classList.remove("is-active");

      btnIniciar.disabled = false;
      btnIniciar.textContent = "Tentar novamente";
      btnCadastrarFace.disabled = false;
    }
  });

  btnConfirmar.addEventListener("click", async () => {
  try {
    if (!rostoValidado) {
      feedback.textContent = "Valide seu rosto antes de confirmar presença.";
      feedback.className = "biometria-feedback biometria-feedback--error";
      return;
    }

    const usuario = obterUsuarioLogado();

    if (!usuario?.id) {
      throw new Error("Usuário logado não encontrado.");
    }

    if (!chamadaAberta?.alunoId || !chamadaAberta?.aulaId) {
      throw new Error("Nenhuma chamada aberta carregada.");
    }

    btnConfirmar.disabled = true;
    feedback.textContent = "Registrando presença biométrica no banco...";
    feedback.className = "biometria-feedback biometria-feedback--loading";

    const presenca = await registrarPresencaBiometrica({
      alunoId: chamadaAberta.alunoId,
      aulaId: chamadaAberta.aulaId
    });

    const registro = criarRegistroBiometricoTemporario(chamadaAberta);

    feedback.textContent = "Presença biométrica registrada no banco.";
    feedback.className = "biometria-feedback biometria-feedback--success";

    statusChamada.textContent = "Presença confirmada";
    statusChamada.className = "chamada-status chamada-status--confirmed";

    retornoProfessor.innerHTML = `
      <strong>${registro.alunoNome}</strong> confirmou presença por 
      <b>biometria facial</b> às <b>${registro.horario}</b>
      na disciplina <b>${registro.disciplina}</b>.
    `;

    fluxoSistema.classList.remove("is-active");
    fluxoSistema.classList.add("is-done");

    fluxoProfessor.classList.remove("is-active");
    fluxoProfessor.classList.add("is-done");

    btnConfirmar.textContent = "Presença confirmada";
    btnIniciar.disabled = true;
    btnCadastrarFace.disabled = true;
    btnConfirmar.disabled = true;
    btnParar.disabled = true;

    pararCameraBiometria(videoBiometria);

    console.log("Presença registrada no banco:", presenca);

  } catch (erro) {
    console.error("Erro ao confirmar presença biométrica:", erro);

    btnConfirmar.disabled = false;
    feedback.textContent = erro.message || "Erro ao registrar presença no banco.";
    feedback.className = "biometria-feedback biometria-feedback--error";
  }
});

    btnParar.addEventListener("click", () => {
    rostoValidado = false;
    pararCameraBiometria(videoBiometria);

    feedback.textContent = "Câmera encerrada.";
    feedback.className = "biometria-feedback";

    statusChamada.textContent = chamadaAberta
      ? "Chamada aberta"
      : "Sem chamada aberta";

    statusChamada.className = chamadaAberta
      ? "chamada-status chamada-status--open"
      : "chamada-status chamada-status--error";

    cameraMensagem.textContent = "Câmera encerrada";
    cameraSubmensagem.textContent = "Clique em iniciar reconhecimento para abrir novamente";

    cameraPreviewArea.classList.remove("is-scanning");
    cameraPreviewArea.classList.remove("is-approved");

    if (facePlaceholder) {
      facePlaceholder.style.display = "";
    }

    btnIniciar.disabled = !chamadaAberta;
    btnCadastrarFace.disabled = !chamadaAberta;
    btnConfirmar.disabled = true;
    btnParar.disabled = !chamadaAberta;

    btnIniciar.textContent = "Iniciar reconhecimento";
  });

  btnIniciar.disabled = true;
  btnCadastrarFace.disabled = true;
  btnConfirmar.disabled = true;
  btnParar.disabled = true;

  carregarChamadaAberta();
}

function criarRegistroBiometricoTemporario(chamadaAberta = null) {
  const usuario = obterUsuarioLogado();

  const agora = new Date();

  const horario = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return {
    alunoId: chamadaAberta?.alunoId || 0,
    alunoNome: usuario?.nome || "Aluno",
    aulaId: chamadaAberta?.aulaId || null,
    disciplina: chamadaAberta?.disciplina || "Disciplina não informada",
    professor: chamadaAberta?.professor || "Professor não informado",
    turma: chamadaAberta?.turma || "Turma não informada",
    horario,
    metodo: "biometria_facial",
    status: "presente",
    enviadoAoProfessor: true,
    dataRegistro: agora.toISOString()
  };
}

function obterUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("usuario");

  if (!usuarioSalvo) return null;

  try {
    return JSON.parse(usuarioSalvo);
  } catch (error) {
    console.error("Erro ao obter usuário logado:", error);
    return null;
  }
}

function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}