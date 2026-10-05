const BIOMETRIA_HOST = window.location.hostname || "localhost";
const BIOMETRIA_PYTHON_URL = `http://${BIOMETRIA_HOST}:5000`;

async function lerRespostaJson(resposta) {
  const texto = await resposta.text();

  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch (_) {
    return {
      mensagem: texto
    };
  }
}

function obterTokenSessao() {
  try {
    const usuario = JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario")));
    return usuario?.token || null;
  } catch {
    return null;
  }
}

function encerrarSessaoBiometria() {
  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
  window.location.href = "../index.html";
}

async function enviarParaBiometria(endpoint, corpo) {
  let resposta;
  const token = obterTokenSessao();

  if (!token) {
    encerrarSessaoBiometria();
    throw new Error("Sessão expirada. Entre novamente.");
  }

  try {
    resposta = await fetch(`${BIOMETRIA_PYTHON_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(corpo)
    });
  } catch (erro) {
    console.error("Servidor de biometria indisponível:", erro);
    throw new Error("Servidor de biometria indisponível. Inicie o Python na porta 5000.");
  }

  const dados = await lerRespostaJson(resposta);

  if (resposta.status === 401) {
    encerrarSessaoBiometria();
    throw new Error(
      dados?.mensagem || "Sessão expirada. Entre novamente."
    );
  }

  if (!resposta.ok) {
    const mensagem =
      dados?.mensagem ||
      `Erro no servidor de biometria (${resposta.status}).`;

    const erro = new Error(mensagem);
    erro.status = resposta.status;
    erro.dados = dados;

    console.error("Erro retornado pelo Python:", {
      endpoint,
      status: resposta.status,
      dados
    });

    throw erro;
  }

  return dados;
}

function montarPayloadPessoa({
  alunoId,
  alunoNome,
  usuarioId,
  pessoaId,
  pessoaNome,
  perfil,
  imagemBase64,
  imagensBase64,
  modoGuiado = false,
  etapasCadastro = null
}) {
  const idReferencia = usuarioId ?? pessoaId ?? alunoId;

  return {
    alunoId: alunoId ?? null,
    alunoNome: alunoNome ?? pessoaNome ?? null,
    usuarioId: usuarioId ?? null,
    pessoaId: usuarioId ?? pessoaId ?? idReferencia ?? null,
    pessoaNome: pessoaNome ?? alunoNome ?? "Usuário",
    perfil: perfil ?? "aluno",
    imagemBase64: imagemBase64 ?? imagensBase64?.[0] ?? null,
    imagensBase64: Array.isArray(imagensBase64)
      ? imagensBase64
      : null,
    modoGuiado: Boolean(modoGuiado),
    etapasCadastro: Array.isArray(etapasCadastro)
      ? etapasCadastro
      : null
  };
}


export async function validarAmostraFacePython({
  imagemBase64,
  etapa = "frente",
  indice = null
}) {
  if (!imagemBase64) {
    throw new Error("Imagem da amostra não informada.");
  }

  return enviarParaBiometria("/validar-amostra", {
    imagemBase64,
    etapa,
    indice
  });
}

export async function reconhecerFacePython(imagemBase64) {
  if (!imagemBase64) {
    throw new Error("Imagem não informada.");
  }

  return enviarParaBiometria("/reconhecer-face", {
    imagemBase64
  });
}


export async function cadastrarFacePython({
  alunoId,
  alunoNome,
  usuarioId,
  pessoaId,
  pessoaNome,
  perfil = "aluno",
  imagemBase64,
  imagensBase64,
  modoGuiado = false,
  etapasCadastro = null
}) {
  const idReferencia = usuarioId ?? pessoaId ?? alunoId;

  const possuiImagem = Boolean(
    imagemBase64 ||
    (Array.isArray(imagensBase64) && imagensBase64.length)
  );

  if (!idReferencia || !possuiImagem) {
    throw new Error("Identificador da pessoa e imagens faciais são obrigatórios.");
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
      imagemBase64,
      imagensBase64,
      modoGuiado,
      etapasCadastro
    })
  );
}

export async function verificarFacePython({
  alunoId,
  usuarioId,
  pessoaId,
  perfil = "aluno",
  imagemBase64,
  imagensBase64
}) {
  const idReferencia = usuarioId ?? pessoaId ?? alunoId;

  const possuiImagem = Boolean(
    imagemBase64 ||
    (Array.isArray(imagensBase64) && imagensBase64.length)
  );

  if (!idReferencia || !possuiImagem) {
    throw new Error("Identificador da pessoa e imagens faciais são obrigatórios.");
  }

  return enviarParaBiometria(
    "/verificar-face",
    montarPayloadPessoa({
      alunoId,
      usuarioId,
      pessoaId,
      perfil,
      imagemBase64,
      imagensBase64
    })
  );
}

export async function consultarFacePython({
  alunoId,
  usuarioId,
  pessoaId,
  perfil = "aluno"
}) {
  const idReferencia = usuarioId ?? pessoaId ?? alunoId;

  if (!idReferencia) {
    throw new Error("Identificador da pessoa é obrigatório.");
  }

  return enviarParaBiometria("/face-cadastrada", {
    alunoId: alunoId ?? null,
    usuarioId: usuarioId ?? null,
    pessoaId: usuarioId ?? pessoaId ?? idReferencia,
    perfil
  });
}

export async function verificarServidorBiometria() {
  try {
    const resposta = await fetch(`${BIOMETRIA_PYTHON_URL}/status`, {
      cache: "no-store"
    });

    return await lerRespostaJson(resposta);
  } catch (erro) {
    console.error("Servidor de biometria offline:", erro);

    return {
      sucesso: false,
      mensagem: "Servidor de biometria offline."
    };
  }
}
