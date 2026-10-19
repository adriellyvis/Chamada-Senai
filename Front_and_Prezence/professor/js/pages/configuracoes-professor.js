import {
  montarPaginaConfiguracoes,
  configurarPaginaConfiguracoes,
  deveConfirmarSaida
} from "../../../core/configuracoes-ui.js";
import { atualizarIndicadorNotificacoes } from "../components/notificacoes-professor.js";

export async function abrirConfiguracoesProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  const usuario = obterUsuarioSessao();

  conteudo.innerHTML = `
    <section class="page-shell configuracoes-professor-shell">
      <header class="page-topbar">
        <div>
          <h1 class="page-title">CONFIGURAÇÕES</h1>
          <p class="page-sub">Personalize o Portal do Professor.</p>
        </div>
      </header>

      <div class="content-area configuracoes-professor-content">
        ${montarPaginaConfiguracoes({
          perfil: "professor",
          titulo: "Configurações do professor",
          descricao: "Defina a aparência, os alertas de frequência e a tela inicial do seu portal.",
          usuario,
          paginaOpcoes: [
            { valor: "dashboard", rotulo: "Home" },
            { valor: "turmas", rotulo: "Turmas" },
            { valor: "alunos", rotulo: "Alunos" },
            { valor: "notas", rotulo: "Notas" },
            { valor: "ocorrencias", rotulo: "Ocorrências" }
          ],
          notificacoesOpcoes: [
            {
              campo: "notificacoesBiometria",
              titulo: "Biometrias aguardando confirmação",
              descricao: "Avisa quando um aluno conclui o reconhecimento facial e espera sua decisão na chamada.",
              icone: "face_6"
            },
            {
              campo: "notificacoesRisco",
              titulo: "Alunos em risco",
              descricao: "Exibe alertas quando a frequência de um aluno estiver baixa.",
              icone: "person_alert"
            },
            {
              campo: "notificacoesChamada",
              titulo: "Chamada em andamento",
              descricao: "Mantém visível quando existe uma chamada aberta aguardando sua atenção.",
              icone: "how_to_reg"
            }
          ]
        })}
      </div>
    </section>
  `;

  configurarPaginaConfiguracoes(conteudo, {
    perfil: "professor",
    onAbrirPerfil: () => {
      document.getElementById("btnAbrirPerfilProfessor")?.click();
    },
    onLogout: sairProfessor,
    onAlterado: () => atualizarIndicadorNotificacoes({ forcar: true })
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function sairProfessor() {
  if (
    deveConfirmarSaida("professor") &&
    !window.confirm("Deseja sair do Portal do Professor?")
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
  window.location.href = "../login/area-login-professor.html";
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
