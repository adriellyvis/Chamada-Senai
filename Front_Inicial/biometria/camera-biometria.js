let streamCameraBiometria = null;

export async function iniciarCameraBiometria(videoElement) {
  if (!videoElement) {
    throw new Error("Elemento de vídeo não encontrado.");
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Este navegador não suporta acesso à câmera.");
  }

  try {
    streamCameraBiometria = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: "user"
      },
      audio: false
    });

    videoElement.srcObject = streamCameraBiometria;

    return true;
  } catch (erro) {
    console.error("Erro ao iniciar câmera biométrica:", erro);

    if (erro.name === "NotFoundError" || erro.name === "DevicesNotFoundError") {
      throw new Error("Nenhuma webcam foi encontrada neste computador.");
    }

    if (erro.name === "NotAllowedError" || erro.name === "PermissionDeniedError") {
      throw new Error("Permissão da câmera negada pelo navegador.");
    }

    if (erro.name === "NotReadableError") {
      throw new Error("A câmera está sendo usada por outro aplicativo.");
    }

    throw new Error("Não foi possível acessar a câmera.");
  }
}

export function capturarImagemBiometria(videoElement, canvasElement) {
  if (!videoElement || !canvasElement) {
    throw new Error("Vídeo ou canvas não encontrado.");
  }

  const largura = videoElement.videoWidth;
  const altura = videoElement.videoHeight;

  if (!largura || !altura) {
    throw new Error("A câmera ainda não carregou a imagem.");
  }

  canvasElement.width = largura;
  canvasElement.height = altura;

  const contexto = canvasElement.getContext("2d");
  contexto.drawImage(videoElement, 0, 0, largura, altura);

  return canvasElement.toDataURL("image/jpeg", 0.9);
}

export function pararCameraBiometria(videoElement = null) {
  if (streamCameraBiometria) {
    streamCameraBiometria.getTracks().forEach(track => track.stop());
    streamCameraBiometria = null;
  }

  if (videoElement) {
    videoElement.srcObject = null;
  }
}

export function cameraEstaAtiva() {
  return !!streamCameraBiometria;
}