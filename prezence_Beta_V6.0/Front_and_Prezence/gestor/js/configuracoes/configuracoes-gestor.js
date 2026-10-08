import {
  montarPaginaConfiguracoes,
  configurarPaginaConfiguracoes,
  deveConfirmarSaida
} from "../../../core/configuracoes-ui.js";
import { marcarMenuAtivo, getConteudoPrincipal } from "../../../core/spa.js";

export async function abrirConfiguracoesGestor(elemento = null) {
  marcarMenuAtivo(elemento);

  const conteudo = getConteudoPrincipal();
  if (!conteudo) return;

  const usuario = obterUsuarioSessao();

  conteudo.innerHTML = `
    <section class="pagina-spa configuracoes-gestor-shell">
      ${montarPaginaConfiguracoes({
        perfil: "gestor",
        titulo: "Configurações do gestor",
        descricao: "Ajuste a aparência, os alertas institucionais e a tela inicial do seu painel.",
        usuario,
        paginaOpcoes: [
          { valor: "dashboard", rotulo: "Home" },
          { valor: "turmas", rotulo: "Turmas" },
          { valor: "alunos", rotulo: "Usuários" },
          { valor: "ocorrencias", rotulo: "Ocorrências" },
          { valor: "disciplinas", rotulo: "Disciplinas" }
        ],
        notificacoesOpcoes: [
          {
            campo: "notificacoesEvasao",
            titulo: "Alertas de frequência",
            descricao: "Mostra alunos com frequência abaixo do nível esperado.",
            icone: "crisis_alert"
          },
          {
            campo: "notificacoesOcorrencias",
            titulo: "Ocorrências",
            descricao: "Avisa quando existem ocorrências pendentes ou em análise.",
            icone: "assignment_late"
          },
          {
            campo: "notificacoesAtividades",
            titulo: "Atividades recentes",
            descricao: "Exibe as ocorrências mais recentes registradas no sistema.",
            icone: "history"
          }
        ]
      })}
    </section>
  `;

  configurarPaginaConfiguracoes(conteudo, {
    perfil: "gestor",
    onAbrirPerfil: () => {
      document.getElementById("btnAbrirPerfilGestor")?.click();
    },
    onLogout: sairGestor
  });
}

function sairGestor() {
  if (
    deveConfirmarSaida("gestor") &&
    !window.confirm("Deseja sair do Portal do Gestor?")
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
  window.location.href = "../index.html";
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
