const BIOMETRIA_PYTHON_URL = "http://localhost:5000";

async function enviarParaBiometria(endpoint, corpo) {
  try {
    const resposta = await fetch(`${BIOMETRIA_PYTHON_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(corpo)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.mensagem || "Erro no servidor de biometria.");
    }

    return dados;
  } catch (erro) {
    console.error("Erro ao comunicar com Python:", erro);
    throw new Error(erro.message || "Servidor de biometria indisponível.");
  }
}

export async function reconhecerFacePython(imagemBase64) {
  if (!imagemBase64) {
    throw new Error("Imagem não informada.");
  }

  return enviarParaBiometria("/reconhecer-face", {
    imagemBase64
  });
}

export async function cadastrarFacePython({ alunoId, alunoNome, imagemBase64 }) {
  if (!alunoId || !imagemBase64) {
    throw new Error("alunoId e imagemBase64 são obrigatórios.");
  }

  return enviarParaBiometria("/cadastrar-face", {
    alunoId,
    alunoNome,
    imagemBase64
  });
}

export async function verificarFacePython({ alunoId, imagemBase64 }) {
  if (!alunoId || !imagemBase64) {
    throw new Error("alunoId e imagemBase64 são obrigatórios.");
  }

  return enviarParaBiometria("/verificar-face", {
    alunoId,
    imagemBase64
  });
}

export async function verificarServidorBiometria() {
  try {
    const resposta = await fetch(`${BIOMETRIA_PYTHON_URL}/status`);
    return await resposta.json();
  } catch (erro) {
    console.error("Servidor de biometria offline:", erro);
    return {
      sucesso: false,
      mensagem: "Servidor de biometria offline."
    };
  }
}