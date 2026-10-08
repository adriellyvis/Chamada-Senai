import { request } from "../../../core/api.js";
import { marcarMenuAtivo, getConteudoPrincipal } from "../../../core/spa.js";

export async function abrirPerfilGestor(elemento = null) {
  marcarMenuAtivo(elemento);

  const conteudo = getConteudoPrincipal();
  if (!conteudo) return;

  const usuarioSessao = obterUsuarioSessao() || {};

  conteudo.innerHTML = `
    <section class="pagina-spa perfil-gestor-page">
      <article class="perfil-gestor-card perfil-gestor-loading">
        <span class="perfil-gestor-eyebrow">Perfil Gestor</span>
        <h2>Carregando informações</h2>
        <p>Consultando seus dados institucionais.</p>
      </article>
    </section>
  `;

  const usuario = await carregarDadosPerfilGestor(usuarioSessao);

  conteudo.innerHTML = `
    <section class="pagina-spa perfil-gestor-page">
      ${montarHeroGestor(usuario)}

      <section class="perfil-gestor-grid">
        ${montarDadosConta(usuario)}
        ${montarResumoInstitucional(usuario)}
      </section>

      ${montarResponsabilidadesGestor()}
    </section>
  `;

  configurarAcoesPerfilGestor();
}

async function carregarDadosPerfilGestor(usuarioSessao) {
  try {
    if (!usuarioSessao?.id) {
      throw new Error("Usuário gestor não encontrado na sessão.");
    }

    const dadosPerfil = await request("/gestor/perfil");

    if (!dadosPerfil) {
      throw new Error("O backend não retornou os dados do perfil.");
    }

    return {
      ...usuarioSessao,
      ...dadosPerfil,
      id: dadosPerfil.usuarioId ?? dadosPerfil.id ?? usuarioSessao.id,
      usuarioId: dadosPerfil.usuarioId ?? dadosPerfil.id ?? usuarioSessao.id,
      nome: dadosPerfil.nome?.trim() || usuarioSessao.nome || "Gestor",
      email: dadosPerfil.email?.trim() || usuarioSessao.email || "-",
      perfil: dadosPerfil.perfil || usuarioSessao.perfil || "gestor"
    };
  } catch (erro) {
    console.warn(
      "Não foi possível carregar o perfil completo do gestor. Usando os dados da sessão:",
      erro
    );

    return {
      ...usuarioSessao,
      totalUsuariosAtivos: 0,
      totalAlunosAtivos: 0,
      totalProfessoresAtivos: 0,
      totalTurmasAtivas: 0,
      totalDisciplinas: 0,
      ocorrenciasPendentes: 0
    };
  }
}

function montarHeroGestor(usuario) {
  const nome = usuario?.nome || "Gestor";
  const letra = nome.charAt(0).toUpperCase() || "G";
  const status = usuario?.ativo === false ? "Inativo" : "Ativo";

  return `
    <section class="perfil-gestor-hero">
      <div class="perfil-gestor-identidade">
        <div class="perfil-gestor-avatar" aria-hidden="true">
          ${escaparHtml(letra)}
        </div>

        <div>
          <span class="perfil-gestor-eyebrow">Perfil Gestor</span>
          <h2>${escaparHtml(nome)}</h2>
          <p>
            Consulte seus dados de acesso, indicadores institucionais
            e responsabilidades administrativas no PreZence.
          </p>
        </div>
      </div>

      <div class="perfil-gestor-status-grid">
        <div class="perfil-gestor-mini-card">
          <span>Status da conta</span>
          <strong>${escaparHtml(status)}</strong>
        </div>

        <div class="perfil-gestor-mini-card">
          <span>Identificador</span>
          <strong>#${escaparHtml(usuario?.usuarioId ?? usuario?.id ?? "-")}</strong>
        </div>
      </div>
    </section>
  `;
}

function montarDadosConta(usuario) {
  const campos = [
    { rotulo: "Nome", valor: usuario?.nome || "-" },
    { rotulo: "E-mail", valor: usuario?.email || "-" },
    { rotulo: "Perfil", valor: normalizarPerfil(usuario?.perfil) },
    { rotulo: "Vínculo", valor: "Gestão acadêmica" },
    { rotulo: "Permissão", valor: "Gerenciamento institucional" }
  ];

  return `
    <article class="perfil-gestor-card">
      <header class="perfil-gestor-card-header">
        <div>
          <span class="perfil-gestor-eyebrow">Dados administrativos</span>
          <h3>Informações da conta</h3>
          <p>Dados associados ao usuário gestor autenticado.</p>
        </div>
      </header>

      <div class="perfil-gestor-fields">
        ${campos.map(campo => `
          <div class="perfil-gestor-field">
            <span>${escaparHtml(campo.rotulo)}</span>
            <strong>${escaparHtml(campo.valor)}</strong>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function montarResumoInstitucional(usuario) {
  const indicadores = [
    {
      rotulo: "Usuários ativos",
      valor: numeroSeguro(usuario?.totalUsuariosAtivos),
      icone: "groups",
      classe: "roxo"
    },
    {
      rotulo: "Alunos ativos",
      valor: numeroSeguro(usuario?.totalAlunosAtivos),
      icone: "school",
      classe: "azul"
    },
    {
      rotulo: "Professores ativos",
      valor: numeroSeguro(usuario?.totalProfessoresAtivos),
      icone: "co_present",
      classe: "verde"
    },
    {
      rotulo: "Turmas ativas",
      valor: numeroSeguro(usuario?.totalTurmasAtivas),
      icone: "domain",
      classe: "lilas"
    },
    {
      rotulo: "Disciplinas",
      valor: numeroSeguro(usuario?.totalDisciplinas),
      icone: "menu_book",
      classe: "ciano"
    },
    {
      rotulo: "Ocorrências pendentes",
      valor: numeroSeguro(usuario?.ocorrenciasPendentes),
      icone: "warning",
      classe: "laranja"
    }
  ];

  return `
    <article class="perfil-gestor-card">
      <header class="perfil-gestor-card-header">
        <div>
          <span class="perfil-gestor-eyebrow">Visão institucional</span>
          <h3>Resumo administrativo</h3>
          <p>Indicadores atuais das áreas acompanhadas pela gestão.</p>
        </div>
      </header>

      <div class="perfil-gestor-resumo-grid">
        ${indicadores.map(indicador => `
          <div class="perfil-gestor-resumo-item ${indicador.classe}">
            <span class="perfil-gestor-resumo-icone" aria-hidden="true">
              <span class="material-symbols-rounded">${indicador.icone}</span>
            </span>

            <div>
              <span>${escaparHtml(indicador.rotulo)}</span>
              <strong>${indicador.valor}</strong>
            </div>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function montarResponsabilidadesGestor() {
  const responsabilidades = [
    {
      titulo: "Usuários",
      descricao: "Cadastrar, editar e acompanhar alunos e professores.",
      icone: "group",
      alvo: "menuAlunos"
    },
    {
      titulo: "Turmas",
      descricao: "Organizar turmas, vínculos e dados acadêmicos.",
      icone: "domain",
      alvo: "menuTurmas"
    },
    {
      titulo: "Disciplinas",
      descricao: "Manter as disciplinas disponíveis no sistema.",
      icone: "menu_book",
      alvo: "menuDisciplinas"
    },
    {
      titulo: "Ocorrências",
      descricao: "Analisar, responder e acompanhar ocorrências.",
      icone: "assignment",
      alvo: "menuOcorrencias"
    },
    {
      titulo: "Frequência",
      descricao: "Acompanhar indicadores e alunos em risco.",
      icone: "monitoring",
      alvo: "menuDashboard"
    }
  ];

  return `
    <article class="perfil-gestor-card perfil-gestor-responsabilidades-card">
      <header class="perfil-gestor-card-header">
        <div>
          <span class="perfil-gestor-eyebrow">Área de atuação</span>
          <h3>Responsabilidades administrativas</h3>
          <p>Acesse rapidamente as principais áreas sob responsabilidade da gestão.</p>
        </div>
      </header>

      <div class="perfil-gestor-responsabilidades-grid">
        ${responsabilidades.map(item => `
          <button
            class="perfil-gestor-responsabilidade"
            type="button"
            data-destino-menu="${item.alvo}"
          >
            <span class="perfil-gestor-responsabilidade-icone" aria-hidden="true">
              <span class="material-symbols-rounded">${item.icone}</span>
            </span>

            <span class="perfil-gestor-responsabilidade-texto">
              <strong>${escaparHtml(item.titulo)}</strong>
              <small>${escaparHtml(item.descricao)}</small>
            </span>

            <span class="perfil-gestor-responsabilidade-seta material-symbols-rounded" aria-hidden="true">chevron_right</span>
          </button>
        `).join("")}
      </div>
    </article>
  `;
}

function configurarAcoesPerfilGestor() {
  document
    .querySelectorAll("[data-destino-menu]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        const destino = botao.dataset.destinoMenu;
        document.getElementById(destino)?.click();
      });
    });
}

function obterUsuarioSessao() {
  const chaves = ["usuario", "usuarioLogado"];
  const armazenamentos = [sessionStorage, localStorage];

  for (const storage of armazenamentos) {
    for (const chave of chaves) {
      const valor = storage.getItem(chave);
      if (!valor) continue;

      try {
        const usuario = JSON.parse(valor);
        if (usuario && typeof usuario === "object") {
          return usuario;
        }
      } catch (erro) {
        console.error(`Erro ao ler ${chave}:`, erro);
      }
    }
  }

  return null;
}

function normalizarPerfil(perfil) {
  const valor = String(perfil || "gestor").toLowerCase();
  return valor === "gestor"
    ? "Gestor"
    : valor.charAt(0).toUpperCase() + valor.slice(1);
}

function numeroSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
