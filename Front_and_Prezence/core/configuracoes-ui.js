const CONFIGURACOES_PADRAO = {
  aluno: {
    tema: "light",
    paginaInicial: "dashboard",
    confirmarSaida: true,
    notificacoes: true,
    notificacoesAvisos: true,
    notificacoesChamada: true,
    notificacoesFrequencia: true
  },
  professor: {
    tema: "light",
    paginaInicial: "dashboard",
    confirmarSaida: true,
    notificacoes: true,
    notificacoesRisco: true,
    notificacoesChamada: true,
    notificacoesBiometria: true
  },
  gestor: {
    tema: "light",
    paginaInicial: "dashboard",
    confirmarSaida: true,
    notificacoes: true,
    notificacoesEvasao: true,
    notificacoesOcorrencias: true,
    notificacoesAtividades: true
  }
};

const listenersSistema = new Set();

export function obterConfiguracoes(perfil) {
  const perfilNormalizado = normalizarPerfil(perfil);
  const padrao = CONFIGURACOES_PADRAO[perfilNormalizado];
  const chave = chaveConfiguracoes(perfilNormalizado);

  let salvas = {};

  try {
    salvas = JSON.parse(localStorage.getItem(chave)) || {};
  } catch {
    salvas = {};
  }

  if (!Object.prototype.hasOwnProperty.call(salvas, "tema")) {
    salvas.tema = obterTemaLegado(perfilNormalizado) || padrao.tema;
  }

  return {
    ...padrao,
    ...salvas
  };
}

export function atualizarConfiguracoes(perfil, alteracoes = {}) {
  const perfilNormalizado = normalizarPerfil(perfil);
  const atuais = obterConfiguracoes(perfilNormalizado);
  const atualizadas = {
    ...atuais,
    ...alteracoes
  };

  localStorage.setItem(
    chaveConfiguracoes(perfilNormalizado),
    JSON.stringify(atualizadas)
  );

  aplicarConfiguracoesInterface(perfilNormalizado, atualizadas);

  window.dispatchEvent(new CustomEvent("prezence:configuracoes-atualizadas", {
    detail: {
      perfil: perfilNormalizado,
      configuracoes: atualizadas
    }
  }));

  return atualizadas;
}

export function restaurarConfiguracoes(perfil) {
  const perfilNormalizado = normalizarPerfil(perfil);
  const padrao = { ...CONFIGURACOES_PADRAO[perfilNormalizado] };

  localStorage.setItem(
    chaveConfiguracoes(perfilNormalizado),
    JSON.stringify(padrao)
  );

  aplicarConfiguracoesInterface(perfilNormalizado, padrao);

  window.dispatchEvent(new CustomEvent("prezence:configuracoes-atualizadas", {
    detail: {
      perfil: perfilNormalizado,
      configuracoes: padrao
    }
  }));

  return padrao;
}

export function aplicarConfiguracoesInterface(perfil, configuracoes = null) {
  const perfilNormalizado = normalizarPerfil(perfil);
  const preferencias = configuracoes || obterConfiguracoes(perfilNormalizado);
  const temaResolvido = resolverTema(preferencias.tema);
  const html = document.documentElement;

  html.setAttribute("data-theme", temaResolvido);
  html.removeAttribute("data-reduced-motion");
  html.style.colorScheme = temaResolvido;

  if (document.body) {
    document.body.classList.toggle(
      "dark",
      perfilNormalizado === "gestor" && temaResolvido === "dark"
    );
  }

  salvarTemaLegado(perfilNormalizado, temaResolvido);
  configurarAcompanhamentoTemaSistema(perfilNormalizado);

  return preferencias;
}

export function alternarTemaInterface(perfil) {
  const perfilNormalizado = normalizarPerfil(perfil);
  const atualAplicado = document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";

  return atualizarConfiguracoes(perfilNormalizado, {
    tema: atualAplicado === "dark" ? "light" : "dark"
  });
}

export function montarPaginaConfiguracoes({
  perfil,
  titulo,
  descricao,
  paginaOpcoes = [],
  notificacoesOpcoes = [],
  usuario = {}
}) {
  const perfilNormalizado = normalizarPerfil(perfil);
  const preferencias = obterConfiguracoes(perfilNormalizado);
  const nome = usuario?.nome || rotuloPerfil(perfilNormalizado);
  const email = usuario?.email || "E-mail não informado";
  const papel = rotuloPerfil(perfilNormalizado);

  return `
    <section class="configuracoes-page" data-config-perfil="${escaparHtml(perfilNormalizado)}">
      <header class="configuracoes-hero">
        <div class="configuracoes-hero-icon" aria-hidden="true">
          <span class="material-symbols-rounded">settings</span>
        </div>

        <div class="configuracoes-hero-copy">
          <span class="configuracoes-eyebrow">PREFERÊNCIAS DO PORTAL</span>
          <h2>${escaparHtml(titulo)}</h2>
          <p>${escaparHtml(descricao)}</p>
        </div>

        <div class="configuracoes-salvamento" id="configuracoesStatus" role="status" aria-live="polite">
          <span class="material-symbols-rounded" aria-hidden="true">cloud_done</span>
          <span>Salvo neste navegador</span>
        </div>
      </header>

      <div class="configuracoes-grid">
        <article class="configuracoes-card">
          ${cabecalhoCard("palette", "Aparência", "Escolha como o PreZence deve aparecer para você.")}

          <div class="configuracoes-bloco">
            <span class="configuracoes-label">Tema da interface</span>
            <div class="configuracoes-temas" role="group" aria-label="Tema da interface">
              ${opcaoTema("light", "light_mode", "Claro", preferencias.tema)}
              ${opcaoTema("dark", "dark_mode", "Escuro", preferencias.tema)}
              ${opcaoTema("system", "devices", "Sistema", preferencias.tema)}
            </div>
          </div>

        </article>

        <article class="configuracoes-card">
          ${cabecalhoCard("navigation", "Navegação", "Defina como o portal abre e encerra sua sessão.")}

          <label class="configuracoes-select-row">
            <span class="configuracoes-row-icon material-symbols-rounded" aria-hidden="true">home_app_logo</span>
            <span class="configuracoes-row-copy">
              <strong>Página inicial</strong>
              <small>Tela exibida logo após entrar no portal.</small>
            </span>
            <select data-config-campo="paginaInicial" aria-label="Página inicial">
              ${paginaOpcoes.map(opcao => `
                <option value="${escaparHtml(opcao.valor)}" ${preferencias.paginaInicial === opcao.valor ? "selected" : ""}>
                  ${escaparHtml(opcao.rotulo)}
                </option>
              `).join("")}
            </select>
          </label>

          ${linhaSwitch({
            campo: "confirmarSaida",
            titulo: "Confirmar antes de sair",
            descricao: "Evita encerrar a sessão por engano.",
            icone: "logout",
            marcado: preferencias.confirmarSaida
          })}
        </article>

        <article class="configuracoes-card configuracoes-card--notifications">
          ${cabecalhoCard("notifications_active", "Notificações", "Controle quais alertas aparecem no sino do portal.")}

          ${linhaSwitch({
            campo: "notificacoes",
            titulo: "Ativar notificações",
            descricao: "Exibe alertas e contadores na barra superior.",
            icone: "notifications",
            marcado: preferencias.notificacoes,
            destaque: true
          })}

          <div class="configuracoes-subopcoes" data-config-subopcoes>
            ${notificacoesOpcoes.map(opcao => linhaSwitch({
              campo: opcao.campo,
              titulo: opcao.titulo,
              descricao: opcao.descricao,
              icone: opcao.icone,
              marcado: preferencias[opcao.campo]
            })).join("")}
          </div>
        </article>

        <article class="configuracoes-card configuracoes-card--account">
          ${cabecalhoCard("manage_accounts", "Conta e sessão", "Dados usados nesta sessão do PreZence.")}

          <div class="configuracoes-account">
            <div class="configuracoes-account-avatar" aria-hidden="true">
              ${escaparHtml(iniciais(nome))}
            </div>
            <div>
              <strong>${escaparHtml(nome)}</strong>
              <span>${escaparHtml(email)}</span>
              <small>${escaparHtml(papel)}</small>
            </div>
          </div>

          <div class="configuracoes-actions">
            <button class="configuracoes-btn configuracoes-btn--secondary" type="button" data-config-acao="perfil">
              <span class="material-symbols-rounded" aria-hidden="true">person</span>
              Abrir perfil
            </button>

            <button class="configuracoes-btn configuracoes-btn--danger" type="button" data-config-acao="logout">
              <span class="material-symbols-rounded" aria-hidden="true">logout</span>
              Sair da conta
            </button>
          </div>

          <button class="configuracoes-reset" type="button" data-config-acao="restaurar">
            <span class="material-symbols-rounded" aria-hidden="true">restart_alt</span>
            Restaurar configurações padrão
          </button>
        </article>
      </div>

      <footer class="configuracoes-note">
        <span class="material-symbols-rounded" aria-hidden="true">info</span>
        <p>Estas preferências ficam armazenadas neste navegador e não alteram seus dados acadêmicos.</p>
      </footer>
    </section>
  `;
}

export function configurarPaginaConfiguracoes(container, {
  perfil,
  onAbrirPerfil,
  onLogout,
  onAlterado
} = {}) {
  if (!container) return;

  const perfilNormalizado = normalizarPerfil(perfil);
  let preferencias = obterConfiguracoes(perfilNormalizado);
  const status = container.querySelector("#configuracoesStatus");
  const subopcoes = container.querySelector("[data-config-subopcoes]");

  const salvar = (alteracoes) => {
    preferencias = atualizarConfiguracoes(perfilNormalizado, alteracoes);
    atualizarEstadoSubopcoes();
    mostrarStatusSalvo(status);
    onAlterado?.(preferencias);
  };

  container.querySelectorAll("[data-config-tema]").forEach(botao => {
    botao.addEventListener("click", () => {
      const tema = botao.dataset.configTema;
      salvar({ tema });

      container.querySelectorAll("[data-config-tema]").forEach(item => {
        const ativo = item.dataset.configTema === tema;
        item.classList.toggle("is-active", ativo);
        item.setAttribute("aria-pressed", String(ativo));
      });
    });
  });

  container.querySelectorAll("[data-config-campo]").forEach(campo => {
    campo.addEventListener("change", () => {
      const nomeCampo = campo.dataset.configCampo;
      const valor = campo.type === "checkbox" ? campo.checked : campo.value;
      salvar({ [nomeCampo]: valor });
    });
  });

  container.querySelector('[data-config-acao="perfil"]')?.addEventListener("click", () => {
    onAbrirPerfil?.();
  });

  container.querySelector('[data-config-acao="logout"]')?.addEventListener("click", () => {
    onLogout?.();
  });

  container.querySelector('[data-config-acao="restaurar"]')?.addEventListener("click", () => {
    const confirmar = window.confirm("Restaurar todas as configurações deste portal?");
    if (!confirmar) return;

    preferencias = restaurarConfiguracoes(perfilNormalizado);
    sincronizarFormulario(container, preferencias);
    atualizarEstadoSubopcoes();
    mostrarStatusSalvo(status, "Configurações restauradas");
    onAlterado?.(preferencias);
  });

  function atualizarEstadoSubopcoes() {
    if (!subopcoes) return;

    const habilitadas = Boolean(preferencias.notificacoes);
    subopcoes.classList.toggle("is-disabled", !habilitadas);
    subopcoes.querySelectorAll("input").forEach(input => {
      input.disabled = !habilitadas;
    });
  }

  atualizarEstadoSubopcoes();
}

export function deveConfirmarSaida(perfil) {
  return Boolean(obterConfiguracoes(perfil).confirmarSaida);
}

function sincronizarFormulario(container, preferencias) {
  container.querySelectorAll("[data-config-tema]").forEach(botao => {
    const ativo = botao.dataset.configTema === preferencias.tema;
    botao.classList.toggle("is-active", ativo);
    botao.setAttribute("aria-pressed", String(ativo));
  });

  container.querySelectorAll("[data-config-campo]").forEach(campo => {
    const valor = preferencias[campo.dataset.configCampo];

    if (campo.type === "checkbox") {
      campo.checked = Boolean(valor);
    } else if (valor != null) {
      campo.value = String(valor);
    }
  });
}

function mostrarStatusSalvo(elemento, texto = "Preferências salvas") {
  if (!elemento) return;

  elemento.classList.add("is-saved");
  const textoElemento = elemento.querySelector("span:last-child");
  if (textoElemento) textoElemento.textContent = texto;

  window.clearTimeout(Number(elemento.dataset.timeoutId || 0));
  const timeoutId = window.setTimeout(() => {
    elemento.classList.remove("is-saved");
    if (textoElemento) textoElemento.textContent = "Salvo neste navegador";
  }, 1800);

  elemento.dataset.timeoutId = String(timeoutId);
}

function cabecalhoCard(icone, titulo, descricao) {
  return `
    <div class="configuracoes-card-header">
      <span class="configuracoes-card-icon material-symbols-rounded" aria-hidden="true">${escaparHtml(icone)}</span>
      <div>
        <h3>${escaparHtml(titulo)}</h3>
        <p>${escaparHtml(descricao)}</p>
      </div>
    </div>
  `;
}

function opcaoTema(valor, icone, rotulo, selecionado) {
  const ativo = valor === selecionado;

  return `
    <button
      class="configuracoes-tema-option ${ativo ? "is-active" : ""}"
      type="button"
      data-config-tema="${escaparHtml(valor)}"
      aria-pressed="${String(ativo)}"
    >
      <span class="material-symbols-rounded" aria-hidden="true">${escaparHtml(icone)}</span>
      <strong>${escaparHtml(rotulo)}</strong>
    </button>
  `;
}

function linhaSwitch({ campo, titulo, descricao, icone, marcado, destaque = false }) {
  return `
    <label class="configuracoes-switch-row ${destaque ? "is-featured" : ""}">
      <span class="configuracoes-row-icon material-symbols-rounded" aria-hidden="true">${escaparHtml(icone)}</span>
      <span class="configuracoes-row-copy">
        <strong>${escaparHtml(titulo)}</strong>
        <small>${escaparHtml(descricao)}</small>
      </span>
      <span class="configuracoes-switch">
        <input
          type="checkbox"
          data-config-campo="${escaparHtml(campo)}"
          ${marcado ? "checked" : ""}
          aria-label="${escaparHtml(titulo)}"
        >
        <span aria-hidden="true"></span>
      </span>
    </label>
  `;
}

function resolverTema(tema) {
  if (tema === "system") {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return tema === "dark" ? "dark" : "light";
}

function configurarAcompanhamentoTemaSistema(perfil) {
  if (listenersSistema.has(perfil) || !window.matchMedia) return;

  listenersSistema.add(perfil);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const preferencias = obterConfiguracoes(perfil);
    if (preferencias.tema === "system") {
      aplicarConfiguracoesInterface(perfil, preferencias);
    }
  });
}

function obterTemaLegado(perfil) {
  const chaves = {
    aluno: ["tema-aluno"],
    professor: ["tema-prezence", "temaPreZence"],
    gestor: ["tema-gestor", "tema"]
  }[perfil];

  for (const chave of chaves) {
    const valor = localStorage.getItem(chave);
    if (valor === "light" || valor === "dark") return valor;
  }

  return null;
}

function salvarTemaLegado(perfil, temaResolvido) {
  if (perfil === "aluno") {
    localStorage.setItem("tema-aluno", temaResolvido);
  } else if (perfil === "professor") {
    localStorage.setItem("tema-prezence", temaResolvido);
  } else {
    localStorage.setItem("tema-gestor", temaResolvido);
  }
}

function chaveConfiguracoes(perfil) {
  return `prezence:${perfil}:${obterUsuarioId()}:configuracoes`;
}

function obterUsuarioId() {
  try {
    const usuario = JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario"))) ||
      JSON.parse(sessionStorage.getItem("usuarioLogado") || localStorage.getItem("usuarioLogado"));
    return usuario?.id ?? "anonimo";
  } catch {
    return "anonimo";
  }
}

function normalizarPerfil(perfil) {
  const valor = String(perfil || "").toLowerCase();
  if (!CONFIGURACOES_PADRAO[valor]) {
    throw new Error(`Perfil de configurações inválido: ${perfil}`);
  }
  return valor;
}

function rotuloPerfil(perfil) {
  if (perfil === "aluno") return "Aluno";
  if (perfil === "professor") return "Professor";
  return "Gestor";
}

function iniciais(nome) {
  return String(nome || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join("") || "U";
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
