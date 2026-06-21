const sections = {
  home: {
    sectionId: "homeSection",
    title: "MEU DESEMPENHO",
    subtitle: "Aqui está o seu processo avaliativo acadêmico!"
  },

  frequencia: {
    sectionId: "frequenciaSection",
    title: "FREQUÊNCIAS",
    subtitle: "Consulte suas presenças, faltas e atrasos."
  },

  chamada: {
    sectionId: "chamadaSection",
    title: "CHAMADA FACIAL",
    subtitle: "Valide sua presença usando reconhecimento biométrico facial."
  },

  avisos: {
    sectionId: "avisosSection",
    title: "AVISOS",
    subtitle: "Veja comunicados importantes da escola."
  }
};

export function abrirDashboardAluno(container) {
  container.innerHTML = `
    <div class="dashboard-placeholder">
      <h2>Dashboard do aluno</h2>
      <p>Próximo passo: montar a tela igual ao modelo claro.</p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  carregarUsuario();
  configurarNavegacao();
  configurarTema();
  configurarMenuPerfil();

  navegarPara("dashboard");
});

function obterUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("usuario");

  if (!usuarioSalvo) {
    return null;
  }

  try {
    return JSON.parse(usuarioSalvo);
  } catch (error) {
    console.error("Erro ao ler usuário do localStorage:", error);
    return null;
  }
}

function carregarUsuario() {
  const userName = document.getElementById("userName");
  const avatar = document.getElementById("avatar");

  const usuario = obterUsuarioLogado();

  if (!usuario) {
    userName.textContent = "Aluno";
    avatar.textContent = "A";
    return;
  }

  const nome = usuario.nome || "Aluno";
  const perfil = String(usuario.perfil || "").toLowerCase();

  if (perfil && perfil !== "aluno") {
    alert("Acesso não permitido para este portal.");
    localStorage.removeItem("usuario");
    window.location.href = "/login/area-login-aluno.html";
    return;
  }

  userName.textContent = nome;
  avatar.textContent = nome.charAt(0).toUpperCase();
}

function configurarMenuSPA() {
  const navItems = document.querySelectorAll(".nav-item");
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");

  navItems.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.section;
      abrirSecao(target, button, pageTitle, pageSubtitle);
    });
  });
}

function abrirSecao(target, button, pageTitle, pageSubtitle) {
  const config = sections[target];

  if (!config) return;

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  }

  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.remove("active");
  });

  const targetSection = document.getElementById(config.sectionId);

  if (targetSection) {
    targetSection.classList.add("active");
  }

  pageTitle.textContent = config.title;
  pageSubtitle.textContent = config.subtitle;
}

function configurarTema() {
  const btnTemaSwitch = document.getElementById("btnTemaSwitch");

  const temaSalvo = localStorage.getItem("tema-aluno");

  if (temaSalvo) {
    document.documentElement.setAttribute("data-theme", temaSalvo);
  }

  const alternarTema = () => {
    const html = document.documentElement;
    const temaAtual = html.getAttribute("data-theme");
    const novoTema = temaAtual === "dark" ? "light" : "dark";

    html.setAttribute("data-theme", novoTema);
    localStorage.setItem("tema-aluno", novoTema);
  };

  if (btnTemaSwitch) {
    btnTemaSwitch.addEventListener("click", alternarTema);
  }
}

function configurarBiometriaSimulada() {
  const btnIniciar = document.getElementById("btnIniciarBiometria");
  const btnConfirmar = document.getElementById("btnConfirmarPresenca");
  const feedback = document.getElementById("biometriaFeedback");
  const retornoProfessor = document.getElementById("retornoProfessor");
  const statusChamada = document.getElementById("statusChamada");

  if (!btnIniciar || !btnConfirmar || !feedback || !retornoProfessor) return;

  btnIniciar.addEventListener("click", () => {
    feedback.textContent = "Lendo rosto do aluno...";
    feedback.className = "biometria-feedback carregando";

    if (statusChamada) {
      statusChamada.textContent = "Validando rosto";
    }

    btnIniciar.disabled = true;
    btnConfirmar.disabled = true;

    setTimeout(() => {
      feedback.textContent =
        "Rosto identificado com sucesso. Você pode confirmar sua presença.";
      feedback.className = "biometria-feedback sucesso";

      if (statusChamada) {
        statusChamada.textContent = "Rosto identificado";
      }

      btnConfirmar.disabled = false;
      btnIniciar.textContent = "Reconhecimento concluído";
    }, 1800);
  });

  btnConfirmar.addEventListener("click", () => {
    const registro = salvarRegistroBiometricoFake();

    feedback.textContent = "Presença confirmada e enviada ao professor.";
    feedback.className = "biometria-feedback sucesso";

    if (statusChamada) {
      statusChamada.textContent = "Presença confirmada";
    }

    retornoProfessor.textContent =
      `${registro.alunoNome} confirmou presença por biometria facial às ${registro.horario}.`;

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Presença confirmada";
  });
}

function salvarRegistroBiometricoFake() {
  const usuario = obterUsuarioLogado();

  const agora = new Date();

  const horario = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const registro = {
    alunoId: usuario?.id || 0,
    alunoNome: usuario?.nome || "Aluno",
    disciplina: "Projetos",
    professor: "Wesley",
    horario,
    metodo: "biometria_facial",
    status: "presente",
    dataRegistro: agora.toISOString()
  };

  localStorage.setItem("ultimaPresencaBiometrica", JSON.stringify(registro));

  console.log("Registro biométrico simulado:", registro);

  return registro;
}

function configurarMenuPerfil() {
  const btnMenuPerfil = document.getElementById("btnMenuPerfil");
  const menuDropdown = document.getElementById("menuPerfilDropdown");
  const btnPerfil = document.getElementById("btnPerfil");
  const btnConfiguracoes = document.getElementById("btnConfiguracoes");
  const btnLogout = document.getElementById("btnLogout");

  if (!btnMenuPerfil || !menuDropdown) return;

  btnMenuPerfil.addEventListener("click", (event) => {
    event.stopPropagation();
    menuDropdown.classList.toggle("is-open");
  });

  document.addEventListener("click", (event) => {
    if (!menuDropdown.contains(event.target) && event.target !== btnMenuPerfil) {
      menuDropdown.classList.remove("is-open");
    }
  });

  if (btnPerfil) {
    btnPerfil.addEventListener("click", () => {
      alert("Área de perfil em construção.");
      menuDropdown.classList.remove("is-open");
    });
  }

  if (btnConfiguracoes) {
    btnConfiguracoes.addEventListener("click", () => {
      alert("Configurações em construção.");
      menuDropdown.classList.remove("is-open");
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      const confirmar = confirm("Deseja sair do portal do aluno?");
      if (!confirmar) return;

      localStorage.removeItem("usuario");
      window.location.href = "/login/area-login-aluno.html";
    });
  }
}