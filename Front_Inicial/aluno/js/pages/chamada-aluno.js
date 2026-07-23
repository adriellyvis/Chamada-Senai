import {
  iniciarCameraBiometria,
  capturarImagemBiometria,
  pararCameraBiometria,
  cameraEstaAtiva
} from "../../../biometria/camera-biometria.js";

import {
  cadastrarFacePython,
  consultarFacePython,
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
      <section class="chamada-layout chamada-layout--compacta">
        <article class="card chamada-camera-card">
          <div class="chamada-header">
            <div>
              <span class="page-tag">CHAMADA FACIAL</span>
              <h2>Validação Biométrica Facial</h2>
              <p>Posicione seu rosto no centro da câmera para confirmar sua presença.</p>
            </div>

            <span class="chamada-status chamada-status--loading" id="statusChamada">
              Verificando chamada
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
            <button class="primary-btn" id="btnIniciarBiometria" disabled>
              Iniciar reconhecimento
            </button>

            <button class="outline-btn" id="btnCadastrarFace" disabled>
              Cadastrar meu rosto
            </button>

            <button class="outline-btn" id="btnConfirmarPresenca" disabled>
              Confirmar presença
            </button>

            <button class="outline-btn" id="btnPararBiometria" disabled>
              Parar câmera
            </button>
          </div>

          <div class="biometria-feedback" id="biometriaFeedback">
            Verificando servidor de biometria.
          </div>
        </article>

        <aside class="chamada-side chamada-side--simples">
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
                <strong>Carregando...</strong>
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
                <strong class="status-open-text">Verificando</strong>
              </div>
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
  const cameraMensagem = document.getElementById("cameraMensagem");
  const cameraSubmensagem = document.getElementById("cameraSubmensagem");
  const cameraPreviewArea = document.getElementById("cameraPreviewArea");
  const facePlaceholder = document.getElementById("facePlaceholder");

  const videoBiometria = document.getElementById("videoBiometria");
  const canvasBiometria = document.getElementById("canvasBiometria");

  let chamadaAberta = null;
  let rostoValidado = false;
  let presencaConfirmada = false;
  let faceCadastrada = false;
  let chamadaAtiva = false;
  let servidorAtivo = false;
  let monitorChamada = null;

  if (!btnIniciar || !btnCadastrarFace || !btnConfirmar || !btnParar || !feedback || !videoBiometria || !canvasBiometria) {
    console.error("Elementos da biometria não encontrados.");
    return;
  }

  function atualizarFeedback(mensagem, tipo = "") {
    feedback.textContent = mensagem;
    feedback.className = `biometria-feedback${tipo ? ` biometria-feedback--${tipo}` : ""}`;
  }

  function atualizarStatus(texto, tipo = "open") {
    statusChamada.textContent = texto;
    statusChamada.className = `chamada-status chamada-status--${tipo}`;
  }

  function atualizarAulaCard() {
    const mobileTitulo = document.querySelector(".aula-resumo-mobile strong");
    const mobileSubtitulo = document.querySelector(".aula-resumo-mobile span");
    const destaqueTitulo = document.querySelector(".aula-destaque strong");
    const destaqueProfessor = document.querySelector(".aula-destaque p");
    const aulaInfo = document.querySelectorAll(".aula-info-list div strong");

    if (!chamadaAberta) {
      if (mobileTitulo) mobileTitulo.textContent = "Nenhuma chamada aberta";
      if (mobileSubtitulo) mobileSubtitulo.textContent = "Aguarde o professor iniciar uma chamada.";
      if (destaqueTitulo) destaqueTitulo.textContent = "Sem chamada aberta";
      if (destaqueProfessor) destaqueProfessor.textContent = "Aguardando professor";
      if (aulaInfo[0]) aulaInfo[0].textContent = "--";
      if (aulaInfo[1]) aulaInfo[1].textContent = "--";
      if (aulaInfo[3]) aulaInfo[3].textContent = "Fechada";
      return;
    }

    if (mobileTitulo) mobileTitulo.textContent = chamadaAberta.disciplina;
    if (mobileSubtitulo) {
      mobileSubtitulo.textContent = `${chamadaAberta.professor} • ${formatarHorarioAula(chamadaAberta.horaInicio, chamadaAberta.horaFim)}`;
    }

    if (destaqueTitulo) destaqueTitulo.textContent = chamadaAberta.disciplina;
    if (destaqueProfessor) destaqueProfessor.textContent = chamadaAberta.professor;
    if (aulaInfo[0]) aulaInfo[0].textContent = formatarHorarioAula(chamadaAberta.horaInicio, chamadaAberta.horaFim);
    if (aulaInfo[1]) aulaInfo[1].textContent = chamadaAberta.turma;
    if (aulaInfo[3]) aulaInfo[3].textContent = chamadaAtiva ? "Aberta" : "Encerrada";
  }

  function atualizarBotoes() {
    const podeUsar = servidorAtivo && chamadaAtiva && !!chamadaAberta && !presencaConfirmada;

    btnCadastrarFace.hidden = faceCadastrada;
    btnCadastrarFace.disabled = !podeUsar || faceCadastrada;

    btnIniciar.disabled = !podeUsar || !faceCadastrada;
    btnConfirmar.disabled = !podeUsar || !rostoValidado;
    btnParar.disabled = !podeUsar || !cameraEstaAtiva();

    if (presencaConfirmada) {
      btnIniciar.textContent = "Reconhecimento finalizado";
      btnConfirmar.textContent = "Presença já confirmada";
      btnParar.textContent = "Câmera encerrada";
    } else {
      btnIniciar.textContent = !faceCadastrada
        ? "Aguardando cadastro facial"
        : rostoValidado
          ? "Reconhecimento concluído"
          : "Iniciar reconhecimento";

      btnConfirmar.textContent = "Confirmar presença";
      btnParar.textContent = cameraEstaAtiva() ? "Parar câmera" : "Câmera fechada";
    }
  }

  function bloquearChamadaEncerrada(mensagem = "Chamada encerrada. Não é possível registrar presença.") {
    chamadaAtiva = false;
    pararCameraBiometria(videoBiometria);

    chamadaAberta = null;
    rostoValidado = false;

    cameraPreviewArea.classList.remove("is-scanning", "is-approved");
    if (facePlaceholder) facePlaceholder.style.display = "";

    cameraMensagem.textContent = "Chamada encerrada";
    cameraSubmensagem.textContent = "A presença não pode mais ser confirmada nesta aula.";

    atualizarStatus("Chamada encerrada", "error");
    atualizarFeedback(mensagem, "error");
    atualizarAulaCard();
    atualizarBotoes();
  }

  async function garantirChamadaAindaAberta() {
    const usuario = obterUsuarioLogado();

    if (!usuario?.id) {
      throw new Error("Usuário logado não encontrado.");
    }

    try {
      const chamadaAtualizada = await buscarChamadaAbertaAluno(usuario.id);
      chamadaAberta = chamadaAtualizada;
      chamadaAtiva = true;
      atualizarAulaCard();
      return chamadaAtualizada;
    } catch (erro) {
      bloquearChamadaEncerrada(erro.message || "A chamada foi encerrada pelo professor.");
      throw new Error("Não é possível registrar presença em aula encerrada.");
    }
  }

  async function atualizarStatusFace(usuario) {
    faceCadastrada = false;

    if (!chamadaAberta?.alunoId) {
      atualizarBotoes();
      return;
    }

    try {
      const resultado = await consultarFacePython({
        alunoId: chamadaAberta.alunoId,
        usuarioId: usuario.id,
        pessoaId: chamadaAberta.alunoId,
        perfil: "aluno"
      });

      faceCadastrada = Boolean(resultado?.cadastrada);

      if (faceCadastrada) {
        atualizarFeedback("Chamada aberta. Rosto cadastrado encontrado. Você já pode iniciar o reconhecimento.", "success");
        cameraMensagem.textContent = "Pronto para reconhecimento";
        cameraSubmensagem.textContent = "Clique em iniciar reconhecimento facial para validar sua presença.";
      } else {
        atualizarFeedback("Chamada aberta. Cadastre seu rosto para liberar o reconhecimento facial.", "loading");
        cameraMensagem.textContent = "Cadastro facial necessário";
        cameraSubmensagem.textContent = "Cadastre seu rosto uma vez para confirmar presença por biometria.";
      }
    } catch (erro) {
      console.warn("Não foi possível consultar face cadastrada:", erro);
      faceCadastrada = false;
      atualizarFeedback("Não foi possível verificar seu cadastro facial. Tente cadastrar o rosto novamente.", "error");
    }

    atualizarBotoes();
  }

  async function carregarChamadaAberta(silencioso = false) {
    try {
      const usuario = obterUsuarioLogado();

      if (!usuario?.id) {
        throw new Error("Usuário logado não encontrado.");
      }

      chamadaAberta = await buscarChamadaAbertaAluno(usuario.id);
      chamadaAtiva = true;

      atualizarAulaCard();
      atualizarStatus("Chamada aberta", "open");

      if (!silencioso) {
        atualizarFeedback("Chamada aberta encontrada. Verificando cadastro facial.", "loading");
      }

      await atualizarStatusFace(usuario);
    } catch (erro) {
      console.error("Erro ao buscar chamada aberta:", erro);

      if (chamadaAtiva || chamadaAberta) {
        bloquearChamadaEncerrada(erro.message || "A chamada foi encerrada pelo professor.");
        return;
      }

      chamadaAberta = null;
      chamadaAtiva = false;
      atualizarAulaCard();
      atualizarStatus("Sem chamada aberta", "error");
      atualizarFeedback(erro.message || "Nenhuma chamada aberta encontrada.", "error");
      atualizarBotoes();
    }
  }

  function iniciarMonitoramento() {
    if (monitorChamada) clearInterval(monitorChamada);

    monitorChamada = setInterval(() => {
      if (!presencaConfirmada && chamadaAtiva) {
        carregarChamadaAberta(true);
      }
    }, 5000);
  }

  verificarServidorBiometria().then(resultado => {
    servidorAtivo = Boolean(resultado?.sucesso);

    if (!servidorAtivo) {
      atualizarFeedback("Servidor de biometria offline. Inicie o Python antes de usar.", "error");
      atualizarStatus("Biometria offline", "error");
      atualizarBotoes();
      return;
    }

    atualizarFeedback("Servidor de biometria ativo. Buscando chamada aberta...", "loading");
    carregarChamadaAberta();
    iniciarMonitoramento();
  });

  btnCadastrarFace.addEventListener("click", async () => {
    try {
      await garantirChamadaAindaAberta();

      const usuario = obterUsuarioLogado();

      if (!usuario?.id) {
        throw new Error("Usuário logado não encontrado.");
      }

      atualizarFeedback("Abrindo câmera para cadastro facial...", "loading");

      if (!cameraEstaAtiva()) {
        await iniciarCameraBiometria(videoBiometria);
      }

      atualizarBotoes();

      if (facePlaceholder) facePlaceholder.style.display = "none";

      cameraMensagem.textContent = "Cadastro facial em andamento";
      cameraSubmensagem.textContent = "Olhe para a câmera e mantenha boa iluminação";
      cameraPreviewArea.classList.add("is-scanning");

      await aguardar(1200);

      const imagemBase64 = capturarImagemBiometria(videoBiometria, canvasBiometria);

      const resultado = await cadastrarFacePython({
        alunoId: chamadaAberta.alunoId,
        usuarioId: usuario.id,
        pessoaId: chamadaAberta.alunoId,
        perfil: "aluno",
        alunoNome: usuario.nome || "Aluno",
        imagemBase64
      });

      console.log("Cadastro facial:", resultado);

      faceCadastrada = true;
      rostoValidado = false;

      atualizarFeedback("Rosto cadastrado com sucesso. Agora inicie o reconhecimento facial.", "success");
      cameraMensagem.textContent = "Cadastro facial concluído";
      cameraSubmensagem.textContent = "Agora você pode validar sua presença.";

      cameraPreviewArea.classList.remove("is-scanning");
      cameraPreviewArea.classList.add("is-approved");
      atualizarBotoes();
    } catch (erro) {
      console.error("Erro ao cadastrar rosto:", erro);
      atualizarFeedback(erro.message || "Erro ao cadastrar rosto.", "error");
      cameraMensagem.textContent = "Cadastro facial não concluído";
      cameraSubmensagem.textContent = "Verifique a câmera e tente novamente.";
      cameraPreviewArea.classList.remove("is-scanning");
      atualizarBotoes();
    }
  });

  btnIniciar.addEventListener("click", async () => {
    try {
      if (presencaConfirmada) {
        atualizarFeedback("Sua presença já foi confirmada nesta chamada.", "success");
        atualizarBotoes();
        return;
      }

      await garantirChamadaAindaAberta();

      if (!faceCadastrada) {
        atualizarFeedback("Cadastre seu rosto antes de iniciar o reconhecimento facial.", "error");
        atualizarBotoes();
        return;
      }

      rostoValidado = false;
      atualizarBotoes();

      atualizarFeedback("Iniciando câmera...", "loading");
      atualizarStatus("Abrindo câmera", "loading");
      cameraMensagem.textContent = "Abrindo câmera...";
      cameraSubmensagem.textContent = "Permita o acesso à webcam no navegador";

      await iniciarCameraBiometria(videoBiometria);
      atualizarBotoes();

      if (facePlaceholder) facePlaceholder.style.display = "none";

      atualizarFeedback("Câmera iniciada. Posicione seu rosto no centro.", "loading");
      cameraMensagem.textContent = "Rosto em análise";
      cameraSubmensagem.textContent = "Mantenha o rosto centralizado e com boa iluminação";
      cameraPreviewArea.classList.add("is-scanning");
      cameraPreviewArea.classList.remove("is-approved");
      atualizarStatus("Validando rosto", "loading");

      await aguardar(1200);
      await garantirChamadaAindaAberta();

      const imagemBase64 = capturarImagemBiometria(videoBiometria, canvasBiometria);
      atualizarFeedback("Enviando imagem para reconhecimento facial...", "loading");

      const usuario = obterUsuarioLogado();

      const resultado = await verificarFacePython({
        alunoId: chamadaAberta.alunoId,
        usuarioId: usuario.id,
        pessoaId: chamadaAberta.alunoId,
        perfil: "aluno",
        imagemBase64
      });

      console.log("Resultado da biometria:", resultado);

      if (!resultado.reconhecido) {
        rostoValidado = false;
        atualizarFeedback(resultado.mensagem || `Rosto não corresponde ao aluno cadastrado. Confiança: ${resultado.confianca}`, "error");
        atualizarStatus("Aluno não reconhecido", "error");
        cameraMensagem.textContent = "Aluno não reconhecido";
        cameraSubmensagem.textContent = "Tente novamente com melhor iluminação.";
        cameraPreviewArea.classList.remove("is-scanning", "is-approved");
        btnIniciar.textContent = "Tentar novamente";
        atualizarBotoes();
        return;
      }

      rostoValidado = true;
      atualizarFeedback(`Aluno reconhecido com sucesso. Confiança: ${resultado.confianca}`, "success");
      atualizarStatus("Aluno reconhecido", "success");
      cameraMensagem.textContent = "Aluno reconhecido com sucesso";
      cameraSubmensagem.textContent = "Validação pronta para confirmação";
      cameraPreviewArea.classList.remove("is-scanning");
      cameraPreviewArea.classList.add("is-approved");
      btnIniciar.textContent = "Reconhecimento concluído";
      atualizarBotoes();
    } catch (erro) {
      console.error("Erro na biometria:", erro);
      rostoValidado = false;
      atualizarFeedback(erro.message || "Erro ao validar biometria.", "error");
      atualizarStatus("Erro na validação", "error");
      cameraMensagem.textContent = "Erro ao validar rosto";
      cameraSubmensagem.textContent = "Verifique se a chamada está aberta e se o servidor Python está rodando.";
      cameraPreviewArea.classList.remove("is-scanning");
      atualizarBotoes();
    }
  });

  btnConfirmar.addEventListener("click", async () => {
    try {
      if (presencaConfirmada) {
        atualizarFeedback("Sua presença já foi confirmada nesta chamada.", "success");
        atualizarBotoes();
        return;
      }

      if (!rostoValidado) {
        atualizarFeedback("Valide seu rosto antes de confirmar presença.", "error");
        atualizarBotoes();
        return;
      }

      await garantirChamadaAindaAberta();

      if (!chamadaAberta?.alunoId || !chamadaAberta?.aulaId) {
        throw new Error("Nenhuma chamada aberta carregada.");
      }

      btnConfirmar.disabled = true;
      atualizarFeedback("Registrando presença biométrica no banco...", "loading");

      const presenca = await registrarPresencaBiometrica({
        alunoId: chamadaAberta.alunoId,
        aulaId: chamadaAberta.aulaId
      });

      presencaConfirmada = true;
      rostoValidado = true;

      atualizarFeedback("Presença biométrica registrada no banco.", "success");
      atualizarStatus("Presença confirmada", "confirmed");

      btnIniciar.textContent = "Reconhecimento finalizado";
      btnConfirmar.textContent = "Presença já confirmada";
      btnParar.textContent = "Câmera encerrada";

      pararCameraBiometria(videoBiometria);
      cameraPreviewArea.classList.remove("is-scanning");
      cameraPreviewArea.classList.add("is-approved");
      cameraMensagem.textContent = "Presença confirmada";
      cameraSubmensagem.textContent = "Registro enviado para o professor.";

      if (monitorChamada) clearInterval(monitorChamada);

      console.log("Presença registrada no banco:", presenca);
      atualizarBotoes();
    } catch (erro) {
      console.error("Erro ao confirmar presença biométrica:", erro);
      atualizarFeedback(erro.message || "Erro ao registrar presença no banco.", "error");
      atualizarBotoes();
    }
  });

  btnParar.addEventListener("click", () => {
    if (presencaConfirmada) {
      atualizarFeedback("Presença já confirmada. Não é necessário reabrir a câmera.", "success");
      atualizarBotoes();
      return;
    }

    rostoValidado = false;
    pararCameraBiometria(videoBiometria);
    cameraPreviewArea.classList.remove("is-scanning", "is-approved");

    if (facePlaceholder) facePlaceholder.style.display = "";

    cameraMensagem.textContent = "Câmera encerrada";
    cameraSubmensagem.textContent = faceCadastrada
      ? "Clique em iniciar reconhecimento para abrir novamente."
      : "Cadastre seu rosto para liberar o reconhecimento facial.";

    atualizarFeedback("Câmera encerrada.");
    atualizarStatus(chamadaAtiva ? "Chamada aberta" : "Sem chamada aberta", chamadaAtiva ? "open" : "error");
    atualizarBotoes();
  });
}

function formatarHorarioAula(horaInicio, horaFim) {
  const inicio = limparHorario(horaInicio) || "Início não informado";
  const fim = limparHorario(horaFim);

  if (!fim) {
    return `${inicio} - Em andamento`;
  }

  return `${inicio} - ${fim}`;
}

function limparHorario(valor) {
  const texto = String(valor ?? "").trim();

  if (!texto || texto.toLowerCase() === "null" || texto.toLowerCase() === "undefined") {
    return "";
  }

  return texto;
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
