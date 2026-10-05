import {
  montarPaginaConfiguracoes,
  configurarPaginaConfiguracoes,
  deveConfirmarSaida
} from "../../../core/configuracoes-ui.js";
import { atualizarNotificacoesAluno } from "../components/notificacoes-aluno.js";

export async function abrirConfiguracoesAluno(container) {
  const usuario = obterUsuarioSessao();

  container.innerHTML = montarPaginaConfiguracoes({
    perfil: "aluno",
    titulo: "Configurações do aluno",
    descricao: "Personalize a aparência, os alertas e a forma como o Portal do Aluno deve abrir.",
    usuario,
    paginaOpcoes: [
      { valor: "dashboard", rotulo: "Home" },
      { valor: "agenda", rotulo: "Agenda" },
      { valor: "frequencia", rotulo: "Frequências" },
      { valor: "notas", rotulo: "Notas" },
      { valor: "avisos", rotulo: "Avisos" }
    ],
    notificacoesOpcoes: [
      {
        campo: "notificacoesAvisos",
        titulo: "Avisos e comunicados",
        descricao: "Comunicados da escola e atualizações importantes.",
        icone: "campaign"
      },
      {
        campo: "notificacoesChamada",
        titulo: "Chamada facial aberta",
        descricao: "Avisa quando houver uma chamada disponível para sua turma.",
        icone: "face"
      },
      {
        campo: "notificacoesFrequencia",
        titulo: "Alertas de frequência",
        descricao: "Informa quando sua frequência se aproxima do limite mínimo.",
        icone: "warning"
      }
    ]
  });

  configurarPaginaConfiguracoes(container, {
    perfil: "aluno",
    onAbrirPerfil: () => {
      window.dispatchEvent(new CustomEvent("aluno:navegar", {
        detail: { pagina: "perfil" }
      }));
    },
    onLogout: sairAluno,
    onAlterado: () => atualizarNotificacoesAluno()
  });
}

function sairAluno() {
  if (
    deveConfirmarSaida("aluno") &&
    !window.confirm("Deseja sair do portal do aluno?")
  ) {
    return;
  }

  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
  localStorage.removeItem("usuarioLogado");
  sessionStorage.removeItem("usuarioLogado");
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  sessionStorage.clear();
  window.location.href = "../login/area-login-aluno.html";
}

function obterUsuarioSessao() {
  try {
    return JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario"))) ||
      JSON.parse(sessionStorage.getItem("usuarioLogado") || localStorage.getItem("usuarioLogado")) ||
      {};
  } catch {
    return {};
  }
}
