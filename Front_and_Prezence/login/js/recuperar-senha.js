const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

const params = new URLSearchParams(window.location.search);
const perfisValidos = new Set(["aluno", "professor", "gestor"]);
let perfil = String(params.get("perfil") || sessionStorage.getItem("prezence_acesso_perfil_contexto") || "aluno").toLowerCase();
if (!perfisValidos.has(perfil)) perfil = "aluno";

const rotasLogin = {
  aluno: "./area-login-aluno.html",
  professor: "./area-login-professor.html",
  gestor: "./area-login-gestor.html"
};

const formEmail = document.getElementById("formRecuperacaoEmail");
const emailInput = document.getElementById("emailRecuperacao");
const perfilSelect = document.getElementById("perfilRecuperacao");
const btnIniciar = document.getElementById("btnIniciarRecuperacao");
const statusEmail = document.getElementById("statusEmail");
const statusFace = document.getElementById("statusFace");
const video = document.getElementById("videoRecuperacao");
const canvas = document.getElementById("canvasRecuperacao");
const placeholder = document.getElementById("cameraPlaceholder");
const btnAbrirCamera = document.getElementById("btnAbrirCamera");
const btnValidarRosto = document.getElementById("btnValidarRosto");
const voltarLogin = document.getElementById("voltarLogin");
const voltarLoginFinal = document.getElementById("voltarLoginFinal");
const linkSuporteEmail = document.getElementById("linkSuporteEmail");
const linkSuporteFace = document.getElementById("linkSuporteFace");
const linkSuporteFinal = document.getElementById("linkSuporteFinal");

let stream = null;
let desafioRecuperacao = null;

function definirStatus(elemento, mensagem = "", tipo = "") {
  elemento.textContent = mensagem;
  elemento.className = `status${tipo ? ` ${tipo}` : ""}`;
}

function atualizarLinks() {
  perfil = String(perfilSelect.value || perfil).toLowerCase();
  const rota = rotasLogin[perfil] || rotasLogin.aluno;
  voltarLogin.href = rota;
  voltarLoginFinal.href = rota;

  [linkSuporteEmail, linkSuporteFace, linkSuporteFinal].forEach((link) => {
    link.href = `./suporte.html?perfil=${encodeURIComponent(perfil)}`;
  });
}

function irParaEtapa(numero) {
  document.querySelectorAll("[data-step-panel]").forEach((painel) => {
    painel.hidden = Number(painel.dataset.stepPanel) !== numero;
  });

  document.querySelectorAll("[data-step-indicator]").forEach((item) => {
    const etapa = Number(item.dataset.stepIndicator);
    item.classList.toggle("ativo", etapa === numero);
    item.classList.toggle("concluido", etapa < numero);
  });
}

function textoErroResposta(data, fallback) {
  return data?.mensagem || data?.message || data?.erro || fallback;
}

async function lerResposta(response) {
  const texto = await response.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return { message: texto };
  }
}

function mensagemServicoNaoConfigurado() {
  return "A recuperação automática ainda não está habilitada no backend deste ambiente. Use o canal de suporte da instituição até o endpoint de recuperação ser implementado.";
}

async function iniciarRecuperacao(event) {
  event.preventDefault();
  definirStatus(statusEmail);

  const email = emailInput.value.trim();
  perfil = perfilSelect.value;
  atualizarLinks();

  if (!email || !email.includes("@")) {
    definirStatus(statusEmail, "Informe um e-mail institucional válido.", "erro");
    return;
  }

  sessionStorage.setItem("prezence_acesso_email_contexto", email);
  sessionStorage.setItem("prezence_acesso_perfil_contexto", perfil);

  btnIniciar.disabled = true;
  btnIniciar.textContent = "Validando...";

  try {
    const response = await fetch(`${API_URL}/auth/recuperacao/iniciar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, perfil })
    });

    const data = await lerResposta(response);

    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        throw new Error(mensagemServicoNaoConfigurado());
      }
      throw new Error(textoErroResposta(data, "Não foi possível iniciar a recuperação."));
    }

    desafioRecuperacao = data?.challengeId || data?.desafioId || data?.tokenRecuperacao || data?.id;

    if (!desafioRecuperacao) {
      throw new Error("O servidor não retornou um desafio temporário para a validação biométrica.");
    }

    definirStatus(statusEmail, "Validação inicial concluída. Continue com o Face Scan.", "sucesso");
    irParaEtapa(2);
  } catch (erro) {
    definirStatus(statusEmail, erro?.message || "Falha ao iniciar recuperação.", "erro");
  } finally {
    btnIniciar.disabled = false;
    btnIniciar.textContent = "Continuar para validação";
  }
}

async function abrirCamera() {
  definirStatus(statusFace);

  if (!navigator.mediaDevices?.getUserMedia) {
    definirStatus(statusFace, "Este navegador não oferece acesso compatível à câmera.", "erro");
    return;
  }

  try {
    pararCamera();
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 720 },
        height: { ideal: 720 }
      },
      audio: false
    });

    video.srcObject = stream;
    video.hidden = false;
    placeholder.hidden = true;
    btnValidarRosto.disabled = false;
    btnAbrirCamera.textContent = "Reabrir câmera";
    definirStatus(statusFace, "Câmera pronta. Centralize o rosto e clique em validar.", "info");
  } catch (erro) {
    definirStatus(statusFace, "Não foi possível acessar a câmera. Verifique a permissão e se o site está em HTTPS.", "erro");
  }
}

function pararCamera() {
  stream?.getTracks?.().forEach((track) => track.stop());
  stream = null;
  if (video) video.srcObject = null;
}

function capturarImagem() {
  const largura = video.videoWidth || 720;
  const altura = video.videoHeight || 720;
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.translate(largura, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, largura, altura);
  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
}

async function validarRosto() {
  definirStatus(statusFace);

  if (!desafioRecuperacao) {
    definirStatus(statusFace, "O desafio de recuperação expirou ou não foi criado.", "erro");
    irParaEtapa(1);
    return;
  }

  if (!stream) {
    definirStatus(statusFace, "Abra a câmera antes de validar.", "erro");
    return;
  }

  btnValidarRosto.disabled = true;
  btnValidarRosto.textContent = "Validando...";

  try {
    const imagem = await capturarImagem();
    if (!imagem) throw new Error("Não foi possível capturar a imagem da câmera.");

    const formData = new FormData();
    formData.append("challengeId", String(desafioRecuperacao));
    formData.append("imagem", imagem, "face.jpg");

    const response = await fetch(`${API_URL}/auth/recuperacao/biometria`, {
      method: "POST",
      body: formData
    });

    const data = await lerResposta(response);

    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        throw new Error(mensagemServicoNaoConfigurado());
      }
      throw new Error(textoErroResposta(data, "A validação facial não foi aceita."));
    }

    pararCamera();
    definirStatus(statusFace, "Identidade validada com sucesso.", "sucesso");
    irParaEtapa(3);
  } catch (erro) {
    definirStatus(statusFace, erro?.message || "Falha na validação facial.", "erro");
  } finally {
    if (stream) btnValidarRosto.disabled = false;
    btnValidarRosto.textContent = "Validar rosto";
  }
}

const emailContexto = sessionStorage.getItem("prezence_acesso_email_contexto") || localStorage.getItem(`prezence_login_email_${perfil}`) || "";
emailInput.value = emailContexto;
perfilSelect.value = perfil;
atualizarLinks();

perfilSelect.addEventListener("change", atualizarLinks);
formEmail.addEventListener("submit", iniciarRecuperacao);
btnAbrirCamera.addEventListener("click", abrirCamera);
btnValidarRosto.addEventListener("click", validarRosto);
window.addEventListener("beforeunload", pararCamera);
