import {
  iniciarCameraBiometria,
  capturarImagemBiometria,
  capturarAmostrasBiometria,
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
  criarCadastroFacialGuiado,
  prepararPainelCadastroFacialGuiado
} from "../../../biometria/cadastro-facial-guiado.js";

import {
  solicitarConfirmacaoPresencaBiometrica,
  consultarStatusConfirmacaoBiometrica
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
              <p>Clique em iniciar reconhecimento, olhe para a câmera e aguarde a comparação com seu cadastro.</p>
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

          <div id="cadastroFaceGuia"></div>

          <div class="chamada-actions">
            <button class="primary-btn" id="btnIniciarBiometria" disabled>
              Iniciar reconhecimento
            </button>

            <button class="outline-btn" id="btnCadastrarFace" disabled>
              Cadastrar meu rosto
            </button>

            <button class="outline-btn" id="btnConfirmarPresenca" disabled hidden aria-hidden="true">
              Envio automático
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
  const guiaContainer = document.getElementById("cadastroFaceGuia");

  let chamadaAberta = null;
  let rostoValidado = false;
  let presencaConfirmada = false;
  let solicitacaoEnviada = false;
  let solicitacaoBiometrica = null;
  let faceCadastrada = false;
  let chamadaAtiva = false;
  let servidorAtivo = false;
  let monitorChamada = null;
  let cadastroFacialProcessando = false;

  if (!btnIniciar || !btnCadastrarFace || !btnConfirmar || !btnParar || !feedback || !videoBiometria || !canvasBiometria) {
    console.error("Elementos da biometria não encontrados.");
    return;
  }


  const painelGuia = prepararPainelCadastroFacialGuiado(guiaContainer);
  const cadastroGuiado = criarCadastroFacialGuiado({
    videoElement: videoBiometria,
    canvasElement: canvasBiometria,
    aoAtualizar(estadoGuia) {
      painelGuia.atualizar(estadoGuia);
      cadastroFacialProcessando = Boolean(estadoGuia.processando);
      btnCadastrarFace.textContent = estadoGuia.textoBotao;

      if (estadoGuia.tipo === "validando") {
        cameraPreviewArea.classList.add("is-scanning");
        atualizarFeedback(estadoGuia.mensagem, "loading");
      } else if (estadoGuia.tipo === "rejeitada" || estadoGuia.tipo === "erro") {
        cameraPreviewArea.classList.remove("is-scanning");
        atualizarFeedback(estadoGuia.mensagem, "error");
      } else if (estadoGuia.tipo === "aceita") {
        cameraPreviewArea.classList.remove("is-scanning");
        atualizarFeedback(estadoGuia.mensagem, "success");
      } else if (estadoGuia.tipo === "pronta") {
        atualizarFeedback(estadoGuia.mensagem, "loading");
      }

      atualizarBotoes();
    }
  });

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
    const chamadaLiberada = chamadaAtiva && !!chamadaAberta;
    const aguardandoProfessor = solicitacaoEnviada && !presencaConfirmada;
    const reconhecimentoConcluido = rostoValidado && !aguardandoProfessor && !presencaConfirmada;
    const podeUsar = servidorAtivo && chamadaLiberada && !presencaConfirmada && !aguardandoProfessor;

    btnCadastrarFace.hidden = faceCadastrada;
    btnCadastrarFace.disabled = !podeUsar || faceCadastrada || reconhecimentoConcluido || cadastroFacialProcessando;

    // O reconhecimento só pode começar depois que o backend confirmar
    // que existe uma chamada aberta para a turma do aluno.
    btnIniciar.disabled = !podeUsar || !faceCadastrada || reconhecimentoConcluido;
    btnConfirmar.disabled = !podeUsar || !rostoValidado;
    btnParar.disabled = !podeUsar || !cameraEstaAtiva() || reconhecimentoConcluido;

    if (presencaConfirmada) {
      btnIniciar.textContent = "Reconhecimento finalizado";
      btnConfirmar.textContent = "Presença confirmada pelo professor";
      btnParar.textContent = "Câmera encerrada";
    } else if (aguardandoProfessor) {
      btnIniciar.textContent = "Aguardando professor";
      btnConfirmar.textContent = "Solicitação enviada";
      btnParar.textContent = "Câmera encerrada";
    } else if (!chamadaLiberada) {
      btnIniciar.textContent = "Aguardando chamada abrir";
      btnConfirmar.textContent = "Enviar para o professor";
      btnParar.textContent = "Câmera fechada";
    } else if (!servidorAtivo) {
      btnIniciar.textContent = "Biometria indisponível";
      btnConfirmar.textContent = "Enviar para o professor";
      btnParar.textContent = "Câmera fechada";
    } else if (reconhecimentoConcluido) {
      btnIniciar.textContent = "Reconhecimento concluído";
      btnConfirmar.textContent = "Enviar para o professor";
      btnParar.textContent = "Aguardando envio";
    } else {
      btnIniciar.textContent = !faceCadastrada
        ? "Aguardando cadastro facial"
        : "Iniciar reconhecimento";

      btnConfirmar.textContent = "Enviar para o professor";
      btnParar.textContent = cameraEstaAtiva() ? "Parar câmera" : "Câmera fechada";
    }
  }

  function bloquearChamadaEncerrada(mensagem = "Chamada encerrada. Não é possível registrar presença.") {
    chamadaAtiva = false;
    pararCameraBiometria(videoBiometria);

    chamadaAberta = null;
    rostoValidado = false;
    solicitacaoEnviada = false;
    solicitacaoBiometrica = null;

    cameraPreviewArea.classList.remove("is-scanning", "is-approved");
    if (facePlaceholder) facePlaceholder.style.display = "";

    cameraMensagem.textContent = "Chamada encerrada";
    cameraSubmensagem.textContent = "A presença não pode mais ser confirmada nesta aula.";

    atualizarStatus("Chamada encerrada", "error");
    atualizarFeedback(mensagem, "error");
    atualizarAulaCard();
    atualizarBotoes();
  }

  function erroIndicaChamadaEncerrada(erro) {
    return [404, 410].includes(Number(erro?.status));
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
      // Uma falha temporária de rede/servidor não pode desligar a webcam.
      // Só encerramos a câmera quando o backend confirma que não existe mais
      // chamada aberta (404/410).
      if (erroIndicaChamadaEncerrada(erro)) {
        bloquearChamadaEncerrada(erro.message || "A chamada foi encerrada pelo professor.");
        throw new Error("Não é possível registrar presença em aula encerrada.");
      }

      console.warn("Falha temporária ao validar chamada; câmera mantida ativa:", erro);
      throw new Error(erro.message || "Não foi possível confirmar a chamada agora. Tente novamente.");
    }
  }

  async function atualizarStatusFace(usuario) {
    // O monitor da chamada consulta o backend periodicamente. Quando o rosto
    // já foi reconhecido, essa consulta não pode voltar a interface para o
    // estado "Pronto para reconhecimento" antes da confirmação da presença.
    if (rostoValidado || presencaConfirmada) {
      atualizarBotoes();
      return;
    }

    faceCadastrada = false;

    if (!chamadaAberta?.alunoId) {
      atualizarBotoes();
      return;
    }

    try {
      const resultado = await consultarFacePython({
        alunoId: chamadaAberta.alunoId,
        usuarioId: usuario.id,
        pessoaId: usuario.id,
        perfil: "aluno"
      });

      // Evita uma condição de corrida caso o reconhecimento termine enquanto
      // a consulta do cadastro facial ainda estiver aguardando resposta.
      if (rostoValidado || presencaConfirmada) {
        atualizarBotoes();
        return;
      }

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
      if (rostoValidado || presencaConfirmada) {
        atualizarBotoes();
        return;
      }

      console.warn("Não foi possível consultar face cadastrada:", erro);
      faceCadastrada = false;
      atualizarFeedback("Não foi possível verificar seu cadastro facial. Tente cadastrar o rosto novamente.", "error");
    }

    atualizarBotoes();
  }

  function normalizarStatusSolicitacao(valor) {
    const status = String(valor || "")
      .trim()
      .toUpperCase()
      .replaceAll("-", "_");

    if (["CONFIRMADA", "CONFIRMADO", "APROVADA", "APROVADO"].includes(status)) return "CONFIRMADA";
    if (["RECUSADA", "RECUSADO", "REJEITADA", "REJEITADO"].includes(status)) return "RECUSADA";
    if (["PENDENTE", "AGUARDANDO", "AGUARDANDO_CONFIRMACAO"].includes(status)) return "PENDENTE";

    return status || null;
  }

  function aplicarStatusSolicitacao(resultado, silencioso = false) {
    if (!resultado) return false;

    const status = normalizarStatusSolicitacao(
      resultado.status ?? resultado.situacao ?? resultado.estado
    );

    solicitacaoBiometrica = resultado;

    if (status === "CONFIRMADA" || resultado.confirmada === true) {
      solicitacaoEnviada = true;
      presencaConfirmada = true;
      rostoValidado = true;

      pararCameraBiometria(videoBiometria);
      cameraPreviewArea.classList.remove("is-scanning");
      cameraPreviewArea.classList.add("is-approved");
      cameraMensagem.textContent = "Presença confirmada";
      cameraSubmensagem.textContent = "O professor confirmou sua validação biométrica.";
      atualizarStatus("Confirmada pelo professor", "confirmed");
      atualizarFeedback("Sua presença foi confirmada pelo professor.", "success");
      if (monitorChamada) clearInterval(monitorChamada);
      atualizarBotoes();
      return true;
    }

    if (status === "RECUSADA" || resultado.recusada === true) {
      solicitacaoEnviada = false;
      presencaConfirmada = false;
      rostoValidado = false;
      solicitacaoBiometrica = resultado;

      cameraPreviewArea.classList.remove("is-scanning", "is-approved");
      cameraMensagem.textContent = "Validação não confirmada";
      cameraSubmensagem.textContent = "O professor recusou a solicitação. Você pode tentar novamente.";
      atualizarStatus("Recusada pelo professor", "error");
      atualizarFeedback(
        resultado.motivo || resultado.mensagem || "O professor não confirmou esta validação biométrica. Faça uma nova tentativa ou fale com ele.",
        "error"
      );
      atualizarBotoes();

      // RECUSADA não bloqueia a tela. O aluno deve poder reconhecer novamente
      // sem precisar refazer o cadastro facial.
      return false;
    }

    if (status === "PENDENTE" || resultado.pendente === true) {
      solicitacaoEnviada = true;
      presencaConfirmada = false;
      rostoValidado = true;

      pararCameraBiometria(videoBiometria);
      cameraPreviewArea.classList.remove("is-scanning");
      cameraPreviewArea.classList.add("is-approved");
      cameraMensagem.textContent = "Aguardando professor";
      cameraSubmensagem.textContent = "Sua biometria foi validada e está aguardando confirmação na chamada.";
      atualizarStatus("Aguardando professor", "loading");
      if (!silencioso) {
        atualizarFeedback("Biometria enviada. Aguarde o professor confirmar sua presença.", "loading");
      }
      atualizarBotoes();
      return true;
    }

    return false;
  }

  async function sincronizarSolicitacaoBiometrica(silencioso = true) {
    if (!chamadaAberta?.aulaId) return false;

    try {
      const resultado = await consultarStatusConfirmacaoBiometrica({
        aulaId: chamadaAberta.aulaId
      });

      return aplicarStatusSolicitacao(resultado, silencioso);
    } catch (erro) {
      if (!silencioso) {
        console.warn("Não foi possível consultar a confirmação biométrica:", erro);
      }
      return false;
    }
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

      // Primeiro restaura uma solicitação existente. Isso evita que o aluno
      // repita a biometria depois de atualizar a página.
      await sincronizarSolicitacaoBiometrica(true);

      // Apenas uma solicitação PENDENTE ou CONFIRMADA deve interromper o
      // fluxo normal. Uma solicitação RECUSADA libera uma nova tentativa e,
      // por isso, precisamos continuar abaixo para consultar novamente se a
      // face do aluno já está cadastrada.
      if (presencaConfirmada || solicitacaoEnviada) {
        atualizarBotoes();
        return;
      }

      // Sem solicitação bloqueante (inclusive após RECUSADA), mantém o fluxo
      // normal de cadastro e reconhecimento facial.
      if (!rostoValidado) {
        atualizarStatus("Chamada aberta", "open");

        if (!silencioso) {
          atualizarFeedback("Chamada aberta encontrada. Verificando cadastro facial.", "loading");
        }

        await atualizarStatusFace(usuario);
      } else {
        atualizarBotoes();
      }
    } catch (erro) {
      if (!silencioso) {
        console.error("Erro ao buscar chamada aberta:", erro);
      }

      if (erroIndicaChamadaEncerrada(erro)) {
        if (chamadaAtiva || chamadaAberta) {
          bloquearChamadaEncerrada(erro.message || "A chamada foi encerrada pelo professor.");
          return;
        }

        chamadaAberta = null;
        chamadaAtiva = false;
        atualizarAulaCard();
        atualizarStatus("Sem chamada aberta", "error");
        if (!silencioso) {
          atualizarFeedback(erro.message || "Nenhuma chamada aberta encontrada.", "error");
        }
        atualizarBotoes();
        return;
      }

      // 500, queda de rede ou timeout não significam que a chamada acabou.
      // Mantemos o estado e, principalmente, não desligamos a câmera.
      if (!silencioso) {
        atualizarFeedback(
          erro.message || "Não foi possível atualizar a chamada agora. A câmera continuará aberta.",
          "error"
        );
      }
      atualizarBotoes();
    }
  }

  function iniciarMonitoramento() {
    if (monitorChamada) clearInterval(monitorChamada);

    monitorChamada = setInterval(() => {
      // Enquanto a webcam está em uso, não fazemos a atualização automática
      // da chamada. Isso evita concorrência entre polling, cadastro e captura
      // das amostras. As ações biométricas ainda validam a chamada antes de
      // salvar/enviar qualquer resultado.
      if (!presencaConfirmada && !cameraEstaAtiva()) {
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

      const cameraVinculada = Boolean(
        videoBiometria.srcObject?.getVideoTracks?.().some(track => track.readyState === "live")
      );

      if (!cameraEstaAtiva() || !cameraVinculada) {
        atualizarFeedback("Abrindo câmera para cadastro facial...", "loading");
        await iniciarCameraBiometria(videoBiometria);
      }

      atualizarBotoes();

      if (facePlaceholder) facePlaceholder.style.display = "none";

      cameraMensagem.textContent = "Cadastro facial guiado";
      cameraSubmensagem.textContent = "Siga uma etapa por vez e capture quando estiver pronto";

      if (!cadastroGuiado.obterEstado().ativo) {
        cadastroGuiado.iniciar();
        return;
      }

      const captura = await cadastroGuiado.capturarAtual();

      if (!captura?.aceita || !captura?.concluido) {
        return;
      }

      cadastroFacialProcessando = true;
      atualizarBotoes();
      atualizarFeedback("Salvando e vinculando as cinco amostras faciais...", "loading");

      const resultado = await cadastrarFacePython({
        alunoId: chamadaAberta.alunoId,
        usuarioId: usuario.id,
        pessoaId: usuario.id,
        perfil: "aluno",
        alunoNome: usuario.nome || "Aluno",
        imagensBase64: captura.imagensBase64,
        modoGuiado: true,
        etapasCadastro: captura.etapasCadastro
      });

      console.log("Cadastro facial:", resultado);

      cadastroFacialProcessando = false;
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
      cadastroFacialProcessando = false;
      atualizarFeedback(erro.message || "Erro ao cadastrar rosto.", "error");
      cameraMensagem.textContent = "Cadastro facial não concluído";
      cameraSubmensagem.textContent = "Corrija o enquadramento e tente novamente.";
      cameraPreviewArea.classList.remove("is-scanning");
      atualizarBotoes();
    }
  });

  async function enviarSolicitacaoBiometricaReconhecida({ silencioso = false } = {}) {
    if (presencaConfirmada || solicitacaoEnviada) {
      atualizarBotoes();
      return solicitacaoBiometrica;
    }

    if (!rostoValidado) {
      throw new Error("O rosto precisa ser reconhecido antes de enviar a presença.");
    }

    await garantirChamadaAindaAberta();

    if (!chamadaAberta?.alunoId || !chamadaAberta?.aulaId) {
      throw new Error("Nenhuma chamada aberta carregada.");
    }

    btnConfirmar.disabled = true;

    if (!silencioso) {
      atualizarFeedback("Rosto reconhecido. Enviando validação ao professor...", "loading");
      atualizarStatus("Enviando presença", "loading");
    }

    const solicitacao = await solicitarConfirmacaoPresencaBiometrica({
      alunoId: chamadaAberta.alunoId,
      aulaId: chamadaAberta.aulaId
    });

    solicitacaoBiometrica = solicitacao || {};
    solicitacaoEnviada = true;
    presencaConfirmada = false;
    rostoValidado = true;

    pararCameraBiometria(videoBiometria);
    cameraPreviewArea.classList.remove("is-scanning");
    cameraPreviewArea.classList.add("is-approved");
    cameraMensagem.textContent = "Aguardando professor";
    cameraSubmensagem.textContent =
      "Seu rosto foi reconhecido. A solicitação foi enviada ao professor, mas sua presença ainda não foi registrada.";

    atualizarFeedback(
      "Reconhecimento concluído. Sua presença só será registrada depois da confirmação do professor.",
      "loading"
    );
    atualizarStatus("Aguardando professor", "loading");
    atualizarBotoes();

    console.log("Solicitação biométrica PENDENTE enviada ao professor:", solicitacao);
    return solicitacao;
  }

  btnIniciar.addEventListener("click", async () => {
    try {
      if (presencaConfirmada) {
        atualizarFeedback("Sua presença já foi confirmada nesta chamada.", "success");
        atualizarBotoes();
        return;
      }

      if (solicitacaoEnviada) {
        atualizarFeedback(
          "Seu reconhecimento já foi enviado. Aguarde a confirmação do professor.",
          "loading"
        );
        atualizarBotoes();
        return;
      }

      await garantirChamadaAindaAberta();

      if (!faceCadastrada) {
        atualizarFeedback(
          "Cadastre seu rosto antes de iniciar o reconhecimento facial.",
          "error"
        );
        atualizarBotoes();
        return;
      }

      rostoValidado = false;
      atualizarBotoes();

      atualizarFeedback("Abrindo câmera para reconhecimento facial...", "loading");
      atualizarStatus("Abrindo câmera", "loading");
      cameraMensagem.textContent = "Abrindo câmera...";
      cameraSubmensagem.textContent = "Olhe normalmente para a câmera";

      await iniciarCameraBiometria(videoBiometria);
      atualizarBotoes();

      if (facePlaceholder) {
        facePlaceholder.style.display = "none";
      }

      cameraPreviewArea.classList.add("is-scanning");
      cameraPreviewArea.classList.remove("is-approved");
      atualizarStatus("Reconhecendo rosto", "loading");
      cameraMensagem.textContent = "Olhe para a câmera";
      cameraSubmensagem.textContent =
        "Fique de frente e centralizado. A comparação será feita automaticamente.";
      atualizarFeedback(
        "Reconhecimento facial em andamento. Mantenha o rosto visível por alguns instantes.",
        "loading"
      );

      // Pequena espera apenas para a câmera estabilizar foco/exposição.
      // Não há prova de vida, desafio ou movimento obrigatório.
      await aguardar(900);
      await garantirChamadaAindaAberta();

      const usuario = obterUsuarioLogado();

      if (!usuario?.id) {
        throw new Error("Usuário logado não encontrado para o reconhecimento facial.");
      }

      const imagensBase64 = await capturarAmostrasBiometria(
        videoBiometria,
        canvasBiometria,
        3,
        550,
        (atual, total) => {
          if (atual < total) {
            atualizarFeedback(
              `Comparando rosto... amostra ${atual} de ${total} capturada. Continue olhando para a câmera.`,
              "loading"
            );
          } else {
            atualizarFeedback(
              "Três amostras capturadas. Comparando com o cadastro facial...",
              "loading"
            );
          }
        }
      );

      const resultado = await verificarFacePython({
        alunoId: chamadaAberta.alunoId,
        usuarioId: usuario.id,
        pessoaId: usuario.id,
        perfil: "aluno",
        imagensBase64
      });

      console.log("Resultado da biometria:", resultado);

      if (!resultado?.reconhecido) {
        rostoValidado = false;

        atualizarFeedback(
          resultado?.mensagem || "O rosto não corresponde ao cadastro facial.",
          "error"
        );
        atualizarStatus("Aluno não reconhecido", "error");
        cameraMensagem.textContent = "Rosto não reconhecido";
        cameraSubmensagem.textContent = resultado?.amostrasAmbiguas > 0
          ? "Há duas pessoas muito próximas. Deixe o aluno claramente à frente."
          : resultado?.esperadoForaPrincipal > 0
            ? "Seu rosto apareceu ao fundo. Aproxime-se e fique no centro."
            : "Centralize o rosto, melhore a iluminação e tente novamente.";
        cameraPreviewArea.classList.remove("is-scanning", "is-approved");
        btnIniciar.textContent = "Tentar novamente";
        atualizarBotoes();
        return;
      }

      rostoValidado = true;

      const complementoMultiplasFaces = resultado.amostrasComMultiplasFaces > 0
        ? " As outras pessoas no enquadramento foram ignoradas."
        : "";

      atualizarFeedback(
        `Aluno reconhecido com sucesso.${complementoMultiplasFaces} Enviando solicitação para o professor...`,
        "success"
      );
      atualizarStatus("Aluno reconhecido", "success");
      cameraMensagem.textContent = "Aluno reconhecido com sucesso";
      cameraSubmensagem.textContent = "Enviando solicitação de presença automaticamente.";
      cameraPreviewArea.classList.remove("is-scanning");
      cameraPreviewArea.classList.add("is-approved");
      atualizarBotoes();

      // Fluxo igual ao utilizado antes da versão 4.0.0:
      // o aluno só inicia o reconhecimento. Após a comparação facial aprovada,
      // é criada SOMENTE uma solicitação PENDENTE para o professor.
      // A presença oficial só pode ser criada pelo backend após o professor confirmar.
      try {
        await enviarSolicitacaoBiometricaReconhecida();
      } catch (erroEnvio) {
        console.error("Erro ao enviar presença automaticamente:", erroEnvio);
        atualizarFeedback(
          `Rosto reconhecido, mas não foi possível enviar a solicitação ao professor. ${erroEnvio.message || "Tente iniciar o reconhecimento novamente."}`,
          "error"
        );
        atualizarStatus("Rosto reconhecido", "success");
        cameraMensagem.textContent = "Rosto reconhecido";
        cameraSubmensagem.textContent =
          "Tente iniciar o reconhecimento novamente para reenviar a solicitação.";
        atualizarBotoes();
      }
    } catch (erro) {
      console.error("Erro na biometria:", erro);
      rostoValidado = false;
      atualizarFeedback(erro.message || "Erro ao validar biometria.", "error");
      atualizarStatus("Erro na validação", "error");
      cameraMensagem.textContent = "Não foi possível reconhecer";
      cameraSubmensagem.textContent =
        "Verifique a câmera, a chamada e o servidor de biometria e tente novamente.";
      cameraPreviewArea.classList.remove("is-scanning", "is-approved");
      atualizarBotoes();
    }
  });

  btnConfirmar.addEventListener("click", async () => {
    try {
      if (presencaConfirmada) {
        atualizarFeedback(
          "Sua presença já foi confirmada pelo professor nesta chamada.",
          "success"
        );
        atualizarBotoes();
        return;
      }

      if (solicitacaoEnviada) {
        atualizarFeedback(
          "Sua biometria já foi enviada. Aguarde a confirmação do professor.",
          "loading"
        );
        atualizarBotoes();
        return;
      }

      if (!rostoValidado) {
        atualizarFeedback(
          "Inicie o reconhecimento facial antes de enviar a presença.",
          "error"
        );
        atualizarBotoes();
        return;
      }

      atualizarFeedback("Tentando enviar a presença novamente...", "loading");
      await enviarSolicitacaoBiometricaReconhecida();
    } catch (erro) {
      console.error("Erro ao enviar confirmação biométrica:", erro);
      atualizarFeedback(
        erro.message || "Erro ao enviar a validação para o professor.",
        "error"
      );
      atualizarBotoes();
    }
  });

  btnParar.addEventListener("click", () => {
    if (presencaConfirmada) {
      atualizarFeedback("Presença já confirmada. Não é necessário reabrir a câmera.", "success");
      atualizarBotoes();
      return;
    }

    if (rostoValidado) {
      atualizarFeedback("Aluno reconhecido. Envie a validação ao professor antes de encerrar a câmera.", "success");
      atualizarStatus("Aluno reconhecido", "success");
      cameraMensagem.textContent = "Aluno reconhecido com sucesso";
      cameraSubmensagem.textContent = "Envie a validação para o professor confirmar na chamada.";
      cameraPreviewArea.classList.remove("is-scanning");
      cameraPreviewArea.classList.add("is-approved");
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
  const usuarioSalvo = (sessionStorage.getItem("usuario") || localStorage.getItem("usuario"));

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
