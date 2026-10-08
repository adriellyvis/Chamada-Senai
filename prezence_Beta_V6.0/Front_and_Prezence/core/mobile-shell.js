const MOBILE_BREAKPOINT = 900;

function iniciarNavegacaoMobile() {
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");

  if (!sidebar || !main || document.querySelector(".mobile-menu-toggle")) {
    return;
  }

  const botaoAbrir = document.createElement("button");
  botaoAbrir.type = "button";
  botaoAbrir.className = "mobile-menu-toggle";
  botaoAbrir.setAttribute("aria-label", "Abrir menu principal");
  botaoAbrir.setAttribute("aria-controls", "prezenceSidebarMobile");
  botaoAbrir.setAttribute("aria-expanded", "false");
  botaoAbrir.innerHTML = `
    <span class="material-symbols-rounded" aria-hidden="true">menu</span>
  `;

  const botaoFechar = document.createElement("button");
  botaoFechar.type = "button";
  botaoFechar.className = "mobile-sidebar-close";
  botaoFechar.setAttribute("aria-label", "Fechar menu principal");
  botaoFechar.innerHTML = `
    <span class="material-symbols-rounded" aria-hidden="true">close</span>
  `;

  const overlay = document.createElement("div");
  overlay.className = "mobile-sidebar-overlay";
  overlay.setAttribute("aria-hidden", "true");

  sidebar.id ||= "prezenceSidebarMobile";
  sidebar.prepend(botaoFechar);
  document.body.append(botaoAbrir, overlay);

  const estaAberto = () => document.body.classList.contains("mobile-sidebar-open");

  const abrir = () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) return;

    document.body.classList.add("mobile-sidebar-open");
    botaoAbrir.setAttribute("aria-expanded", "true");
    overlay.setAttribute("aria-hidden", "false");
    window.setTimeout(() => botaoFechar.focus(), 30);
  };

  const fechar = ({ devolverFoco = false } = {}) => {
    if (!estaAberto()) return;

    document.body.classList.remove("mobile-sidebar-open");
    botaoAbrir.setAttribute("aria-expanded", "false");
    overlay.setAttribute("aria-hidden", "true");

    if (devolverFoco) {
      botaoAbrir.focus();
    }
  };

  botaoAbrir.addEventListener("click", () => {
    estaAberto() ? fechar() : abrir();
  });

  botaoFechar.addEventListener("click", () => fechar({ devolverFoco: true }));
  overlay.addEventListener("click", () => fechar({ devolverFoco: true }));

  sidebar.addEventListener("click", evento => {
    const alvoNavegacao = evento.target.closest(
      ".sidebar__item, .nav-item, nav a, [data-page], #menuDashboard, #menuTurmas, #menuAlunos, #menuDisciplinas, #menuOcorrencias"
    );

    if (alvoNavegacao && window.innerWidth <= MOBILE_BREAKPOINT) {
      fechar();
    }
  });

  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
      fechar({ devolverFoco: true });
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      fechar();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarNavegacaoMobile, { once: true });
} else {
  iniciarNavegacaoMobile();
}
