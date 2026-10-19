const BIOMETRIA_HOST = window.location.hostname || "localhost";
const BIOMETRIA_PYTHON_URL = `http://${BIOMETRIA_HOST}:5000`;
let biometriaIndisponivel = false;

function avisarBiometriaIndisponivel() {
  if (biometriaIndisponivel) return;
  biometriaIndisponivel = true;
  window.dispatchEvent(new CustomEvent("prezence:biometria-indisponivel"));
}

function avisarBiometriaRestaurada() {
  if (!biometriaIndisponivel) return;
  biometriaIndisponivel = false;
  window.dispatchEvent(new CustomEvent("prezence:biometria-restaurada"));
}

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
    console.error("Serviço de biometria indisponível:", erro);
    avisarBiometriaIndisponivel();
    const falha = new Error("Reconhecimento facial temporariamente indisponível. Tente novamente em alguns instantes.");
    falha.codigo = "BIOMETRIA_OFFLINE";
    throw falha;
  }

  avisarBiometriaRestaurada();
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
      "Não foi possível concluir a validação facial. Tente novamente.";

    const erro = new Error(mensagem);
    erro.status = resposta.status;
    erro.dados = dados;

    console.error("Erro retornado pelo serviço de biometria:", {
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

    avisarBiometriaRestaurada();
    return await lerRespostaJson(resposta);
  } catch (erro) {
    console.error("Serviço de biometria indisponível:", erro);
    avisarBiometriaIndisponivel();

    return {
      sucesso: false,
      mensagem: "Reconhecimento facial temporariamente indisponível. Tente novamente em alguns instantes."
    };
  }
}
