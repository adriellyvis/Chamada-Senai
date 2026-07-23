const API_HOST = window.location.hostname || "localhost";
const BIOMETRIA_PYTHON_URL = `http://${API_HOST}:5000`;

async function enviarParaBiometria(endpoint, corpo) {
  try {
    const resposta = await fetch(`${BIOMETRIA_PYTHON_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(corpo)
    });

    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      throw new Error(dados?.mensagem || "Erro no servidor de biometria.");
    }

    return dados;
  } catch (erro) {
    console.error("Erro ao comunicar com Python:", erro);
    throw new Error(erro.message || "Servidor de biometria indisponível.");
  }
}

function montarPayloadPessoa({ alunoId, alunoNome, usuarioId, pessoaId, pessoaNome, perfil, imagemBase64 }) {
  const idReferencia = alunoId ?? pessoaId ?? usuarioId;

  return {
    alunoId: alunoId ?? null,
    alunoNome: alunoNome ?? pessoaNome ?? null,
    usuarioId: usuarioId ?? null,
    pessoaId: pessoaId ?? idReferencia ?? null,
    pessoaNome: pessoaNome ?? alunoNome ?? "Usuário",
    perfil: perfil ?? "aluno",
    imagemBase64
  };
}

export async function reconhecerFacePython(imagemBase64) {
  if (!imagemBase64) {
    throw new Error("Imagem não informada.");
  }

  return enviarParaBiometria("/reconhecer-face", {
    imagemBase64
  });
}

export async function cadastrarFacePython({ alunoId, alunoNome, usuarioId, pessoaId, pessoaNome, perfil = "aluno", imagemBase64 }) {
  const idReferencia = alunoId ?? pessoaId ?? usuarioId;

  if (!idReferencia || !imagemBase64) {
    throw new Error("Identificador da pessoa e imagemBase64 são obrigatórios.");
  }

  return enviarParaBiometria(
    "/cadastrar-face",
    montarPayloadPessoa({
      alunoId,
      alunoNome,
      usuarioId,
      pessoaId,
      pessoaNome,
      perfil,
      imagemBase64
    })
  );
}

export async function verificarFacePython({ alunoId, usuarioId, pessoaId, perfil = "aluno", imagemBase64 }) {
  const idReferencia = alunoId ?? pessoaId ?? usuarioId;

  if (!idReferencia || !imagemBase64) {
    throw new Error("Identificador da pessoa e imagemBase64 são obrigatórios.");
  }

  return enviarParaBiometria(
    "/verificar-face",
    montarPayloadPessoa({
      alunoId,
      usuarioId,
      pessoaId,
      perfil,
      imagemBase64
    })
  );
}

export async function consultarFacePython({ alunoId, usuarioId, pessoaId, perfil = "aluno" }) {
  const idReferencia = alunoId ?? pessoaId ?? usuarioId;

  if (!idReferencia) {
    throw new Error("Identificador da pessoa é obrigatório.");
  }

  return enviarParaBiometria("/face-cadastrada", {
    alunoId: alunoId ?? null,
    usuarioId: usuarioId ?? null,
    pessoaId: pessoaId ?? idReferencia,
    perfil
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
