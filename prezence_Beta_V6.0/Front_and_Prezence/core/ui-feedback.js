let inicializado = false;
let ultimoToast = { mensagem: "", instante: 0 };

export function inicializarFeedbackGlobal() {
  if (inicializado) return;
  inicializado = true;

  garantirEstruturaFeedback();

  window.addEventListener("prezence:api-indisponivel", () => {
    mostrarBannerSistema(
      "Não foi possível conectar ao servidor. Alguns dados podem estar temporariamente indisponíveis.",
      "erro"
    );
  });

  window.addEventListener("prezence:api-restaurada", () => {
    ocultarBannerSistema();
  });

  window.addEventListener("prezence:biometria-indisponivel", () => {
    mostrarToast(
      "Reconhecimento facial temporariamente indisponível. Tente novamente em alguns instantes.",
      "erro",
      { duracao: 4500 }
    );
  });
}

export function mostrarToast(mensagem, tipo = "info", opcoes = {}) {
  const texto = normalizarMensagemUsuario(mensagem);
  if (!texto) return;

  garantirEstruturaFeedback();

  const agora = Date.now();
  if (ultimoToast.mensagem === texto && agora - ultimoToast.instante < 800) return;
  ultimoToast = { mensagem: texto, instante: agora };

  const regiao = document.getElementById("prezenceToastRegion");
  if (!regiao) return;

  const toast = document.createElement("div");
  toast.className = `prezence-toast prezence-toast--${normalizarTipo(tipo)}`;
  toast.setAttribute("role", tipo === "erro" ? "alert" : "status");
  toast.setAttribute("aria-live", tipo === "erro" ? "assertive" : "polite");

  const icone = document.createElement("span");
  icone.className = "material-symbols-rounded prezence-toast__icone";
  icone.setAttribute("aria-hidden", "true");
  icone.textContent = iconePorTipo(tipo);

  const conteudo = document.createElement("div");
  conteudo.className = "prezence-toast__conteudo";
  conteudo.textContent = texto;

  const fechar = document.createElement("button");
  fechar.type = "button";
  fechar.className = "prezence-toast__fechar";
  fechar.setAttribute("aria-label", "Fechar mensagem");
  fechar.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">close</span>';

  toast.append(icone, conteudo, fechar);
  regiao.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  const remover = () => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 180);
  };

  fechar.addEventListener("click", remover);
  window.setTimeout(remover, Number(opcoes.duracao) || 3600);
}

export function mostrarBannerSistema(mensagem, tipo = "erro") {
  garantirEstruturaFeedback();
  const banner = document.getElementById("prezenceSystemBanner");
  if (!banner) return;

  const texto = normalizarMensagemUsuario(mensagem);
  banner.className = `prezence-system-banner prezence-system-banner--${normalizarTipo(tipo)} is-visible`;
  banner.querySelector("[data-banner-texto]").textContent = texto;
  banner.hidden = false;
}

export function ocultarBannerSistema() {
  const banner = document.getElementById("prezenceSystemBanner");
  if (!banner) return;
  banner.classList.remove("is-visible");
  window.setTimeout(() => {
    if (!banner.classList.contains("is-visible")) banner.hidden = true;
  }, 180);
}

export function normalizarMensagemUsuario(mensagem) {
  const texto = String(mensagem ?? "").trim();
  if (!texto) return "";

  if (/failed to fetch|networkerror|load failed|connection refused|err_connection_refused/i.test(texto)) {
    return "Não foi possível conectar ao servidor. Tente novamente em alguns instantes.";
  }

  if (/servidor de biometria|python|porta\s*5000|biometria offline/i.test(texto)) {
    return "Reconhecimento facial temporariamente indisponível. Tente novamente em alguns instantes.";
  }

  return texto;
}

function garantirEstruturaFeedback() {
  if (!document.getElementById("prezenceToastRegion")) {
    const regiao = document.createElement("div");
    regiao.id = "prezenceToastRegion";
    regiao.className = "prezence-toast-region";
    regiao.setAttribute("aria-label", "Mensagens do sistema");
    document.body.appendChild(regiao);
  }

  if (!document.getElementById("prezenceSystemBanner")) {
    const banner = document.createElement("div");
    banner.id = "prezenceSystemBanner";
    banner.className = "prezence-system-banner";
    banner.hidden = true;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = `
      <span class="material-symbols-rounded" aria-hidden="true">cloud_off</span>
      <span data-banner-texto></span>
    `;
    document.body.appendChild(banner);
  }
}

function normalizarTipo(tipo) {
  const valor = String(tipo || "info").toLowerCase();
  return ["sucesso", "erro", "aviso", "info"].includes(valor) ? valor : "info";
}

function iconePorTipo(tipo) {
  const mapa = {
    sucesso: "check_circle",
    erro: "error",
    aviso: "warning",
    info: "info"
  };
  return mapa[normalizarTipo(tipo)] || mapa.info;
}
