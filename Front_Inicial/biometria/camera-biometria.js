let streamCameraBiometria = null;
let videoCameraBiometria = null;
let aberturaCameraEmAndamento = null;

function obterFaixaVideo(stream) {
  return stream?.getVideoTracks?.()[0] ?? null;
}

function streamEstaAtivo(stream = streamCameraBiometria) {
  const faixa = obterFaixaVideo(stream);

  return Boolean(
    faixa &&
    faixa.readyState === "live"
  );
}

function pararStream(stream) {
  stream?.getTracks?.().forEach(track => {
    try {
      track.stop();
    } catch (_) {
      // A faixa pode já estar encerrada.
    }
  });
}

async function vincularStreamAoVideo(videoElement, stream) {
  if (!videoElement || !streamEstaAtivo(stream)) {
    return false;
  }

  videoElement.autoplay = true;
  videoElement.muted = true;
  videoElement.playsInline = true;

  if (videoElement.srcObject !== stream) {
    videoElement.srcObject = stream;
  }

  try {
    await videoElement.play();
  } catch (erro) {
    // AbortError pode acontecer se o navegador ainda estiver trocando o srcObject.
    if (erro?.name !== "AbortError") {
      throw erro;
    }

    await new Promise(resolve => setTimeout(resolve, 80));
    await videoElement.play();
  }

  await esperarVideoPronto(videoElement);
  return true;
}

function esperarVideoPronto(videoElement, timeoutMs = 10000) {
  if (
    videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    videoElement.videoWidth > 0 &&
    videoElement.videoHeight > 0
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let finalizado = false;

    const limpar = () => {
      videoElement.removeEventListener("loadedmetadata", verificar);
      videoElement.removeEventListener("loadeddata", verificar);
      videoElement.removeEventListener("canplay", verificar);
      videoElement.removeEventListener("playing", verificar);
      videoElement.removeEventListener("error", falhar);
      clearTimeout(timeout);
    };

    const concluir = () => {
      if (finalizado) return;
      finalizado = true;
      limpar();
      resolve();
    };

    const falhar = () => {
      if (finalizado) return;
      finalizado = true;
      limpar();
      reject(new Error("Não foi possível carregar a imagem da câmera."));
    };

    const verificar = () => {
      if (
        videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        videoElement.videoWidth > 0 &&
        videoElement.videoHeight > 0
      ) {
        concluir();
      }
    };

    const timeout = setTimeout(falhar, timeoutMs);

    videoElement.addEventListener("loadedmetadata", verificar);
    videoElement.addEventListener("loadeddata", verificar);
    videoElement.addEventListener("canplay", verificar);
    videoElement.addEventListener("playing", verificar);
    videoElement.addEventListener("error", falhar);

    verificar();
  });
}

function mensagemErroCamera(erro) {
  if (
    erro?.name === "NotFoundError" ||
    erro?.name === "DevicesNotFoundError"
  ) {
    return "Nenhuma webcam foi encontrada neste computador.";
  }

  if (
    erro?.name === "NotAllowedError" ||
    erro?.name === "PermissionDeniedError" ||
    erro?.name === "SecurityError"
  ) {
    return "Permissão da câmera negada pelo navegador.";
  }

  if (
    erro?.name === "NotReadableError" ||
    erro?.name === "TrackStartError"
  ) {
    return "A câmera está sendo usada por outro aplicativo ou não pôde ser iniciada.";
  }

  if (erro?.name === "OverconstrainedError") {
    return "A webcam não suporta a configuração solicitada.";
  }

  if (erro?.message) {
    return erro.message;
  }

  return "Não foi possível acessar a câmera.";
}

export async function iniciarCameraBiometria(videoElement) {
  if (!videoElement) {
    throw new Error("Elemento de vídeo não encontrado.");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Este navegador não suporta acesso à câmera.");
  }

  // Se a webcam já está aberta, apenas religamos o mesmo stream ao vídeo.
  // Isso evita o efeito preto causado por stop/getUserMedia repetidos.
  if (streamEstaAtivo()) {
    try {
      await vincularStreamAoVideo(videoElement, streamCameraBiometria);
      videoCameraBiometria = videoElement;
      return true;
    } catch (erro) {
      console.warn("Stream existente não pôde ser reutilizado. Reabrindo câmera:", erro);
      pararCameraBiometria();
    }
  }

  if (aberturaCameraEmAndamento) {
    await aberturaCameraEmAndamento;

    if (streamEstaAtivo()) {
      await vincularStreamAoVideo(videoElement, streamCameraBiometria);
      videoCameraBiometria = videoElement;
      return true;
    }
  }

  aberturaCameraEmAndamento = (async () => {
    const tentativas = [
      {
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 }
        },
        audio: false
      },
      {
        video: {
          facingMode: { ideal: "user" }
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let ultimoErro = null;

    for (const configuracao of tentativas) {
      let streamTentativa = null;

      try {
        streamTentativa = await navigator.mediaDevices.getUserMedia(configuracao);

        // Só substituímos o stream global depois que o navegador realmente
        // conseguiu exibir imagem. Se a tentativa falhar, preservamos o estado.
        await vincularStreamAoVideo(videoElement, streamTentativa);

        streamCameraBiometria = streamTentativa;
        videoCameraBiometria = videoElement;

        const faixa = obterFaixaVideo(streamTentativa);
        if (faixa) {
          faixa.onended = () => {
            if (streamCameraBiometria === streamTentativa) {
              streamCameraBiometria = null;
              videoCameraBiometria = null;
            }
          };
        }

        return true;
      } catch (erro) {
        ultimoErro = erro;
        pararStream(streamTentativa);

        if (videoElement.srcObject === streamTentativa) {
          videoElement.srcObject = null;
        }

        if (
          erro?.name === "NotAllowedError" ||
          erro?.name === "PermissionDeniedError" ||
          erro?.name === "SecurityError" ||
          erro?.name === "NotFoundError" ||
          erro?.name === "DevicesNotFoundError"
        ) {
          break;
        }
      }
    }

    console.error("Erro ao iniciar câmera biométrica:", ultimoErro);
    throw new Error(mensagemErroCamera(ultimoErro));
  })();

  try {
    return await aberturaCameraEmAndamento;
  } finally {
    aberturaCameraEmAndamento = null;
  }
}

export function capturarImagemBiometria(videoElement, canvasElement) {
  if (!videoElement || !canvasElement) {
    throw new Error("Vídeo ou canvas não encontrado.");
  }

  if (!cameraEstaAtiva()) {
    throw new Error("A câmera não está ativa.");
  }

  const largura = videoElement.videoWidth;
  const altura = videoElement.videoHeight;

  if (
    videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
    !largura ||
    !altura
  ) {
    throw new Error("A câmera ainda não carregou a imagem.");
  }

  canvasElement.width = largura;
  canvasElement.height = altura;

  const contexto = canvasElement.getContext("2d");

  if (!contexto) {
    throw new Error("Não foi possível preparar a captura da câmera.");
  }

  contexto.drawImage(videoElement, 0, 0, largura, altura);

  const imagemBase64 = canvasElement.toDataURL("image/jpeg", 0.9);

  if (!imagemBase64 || imagemBase64.length < 500) {
    throw new Error("A imagem capturada está vazia.");
  }

  return imagemBase64;
}

export async function capturarAmostrasBiometria(
  videoElement,
  canvasElement,
  quantidade = 5,
  intervaloMs = 320,
  aoCapturar = null
) {
  const total = Math.max(1, Number(quantidade) || 1);
  const amostras = [];

  for (let indice = 0; indice < total; indice += 1) {
    // Se o navegador pausou o elemento de vídeo sem encerrar o stream,
    // religamos antes da próxima captura.
    if (streamEstaAtivo() && videoElement.paused) {
      await vincularStreamAoVideo(videoElement, streamCameraBiometria);
    }

    await esperarVideoPronto(videoElement);

    const imagemBase64 = capturarImagemBiometria(
      videoElement,
      canvasElement
    );

    amostras.push(imagemBase64);

    if (typeof aoCapturar === "function") {
      aoCapturar(indice + 1, total);
    }

    if (indice < total - 1) {
      await new Promise(resolve => {
        setTimeout(resolve, intervaloMs);
      });
    }
  }

  return amostras;
}

export function pararCameraBiometria(videoElement = null) {
  const streamParaParar = streamCameraBiometria;
  const videoParaLimpar = videoElement || videoCameraBiometria;

  pararStream(streamParaParar);

  if (videoParaLimpar) {
    try {
      videoParaLimpar.pause();
    } catch (_) {
      // O elemento pode já ter sido removido da página.
    }

    if (
      !streamParaParar ||
      videoParaLimpar.srcObject === streamParaParar
    ) {
      videoParaLimpar.srcObject = null;
    }
  }

  streamCameraBiometria = null;
  videoCameraBiometria = null;
}

export function cameraEstaAtiva() {
  return streamEstaAtivo();
}
