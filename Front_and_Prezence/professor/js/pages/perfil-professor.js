import { request } from "../../../core/api.js";

import {
  obterUsuarioPerfil,
  montarHeroPerfil,
  montarCardBiometriaPerfil,
  configurarCadastroFacialPerfil,
  resolverIdentificadorBiometrico,
  normalizarPerfil
} from "../../../biometria/perfil-biometrico.js";

export async function abrirPerfilProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");

  if (!conteudo) return;

  const usuarioLogin = obterUsuarioPerfil() || {};

  conteudo.innerHTML = `
    <section class="page-shell">
      <div class="content-area section-center perfil-page">
        <article class="perfil-card">
          <div class="perfil-card__header">
            <div>
              <span class="perfil-eyebrow">Perfil Professor</span>
              <h3>Carregando informações</h3>
              <p>Consultando seus dados profissionais.</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  `;

  const usuario = await carregarDadosPerfilProfessor(usuarioLogin);
  const pessoaId = resolverIdentificadorBiometrico(usuario, "professor");

  conteudo.innerHTML = `
    <section class="page-shell">
      <div class="content-area section-center perfil-page">
        ${montarHeroPerfil({
          usuario,
          perfil: "professor",
          descricao:
            "Consulte seus dados profissionais, turmas, disciplinas e informações acadêmicas vinculadas ao PreZence."
        })}

        <section class="perfil-grid">
          ${montarCardDadosProfessor(usuario)}
          ${montarCardResumoProfissional(usuario)}
          ${montarCardBiometriaPerfil({
            titulo: "Minha face cadastrada",
            descricao: "Cadastre sua face para manter a biometria vinculada ao seu perfil e habilitar fluxos de validação de identidade."
          })}
        </section>

        ${montarCardVinculosProfessor(usuario.vinculos)}
      </div>
    </section>
  `;

  await configurarCadastroFacialPerfil({
    perfil: "professor",
    usuario,
    pessoaId,
    pessoaNome: usuario.nome || "Professor"
  });

  configurarAcoesPerfilProfessor();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function carregarDadosPerfilProfessor(usuarioLogin) {
  try {
    if (!usuarioLogin?.id) {
      throw new Error("Usuário professor não encontrado na sessão.");
    }

    const dadosPerfil = await request("/professor/perfil");

    if (!dadosPerfil) {
      throw new Error("O backend não retornou os dados do perfil.");
    }

    return {
      ...usuarioLogin,
      ...dadosPerfil,
      id: dadosPerfil.usuarioId ?? usuarioLogin.id,
      usuarioId: dadosPerfil.usuarioId ?? usuarioLogin.id,
      professorId:
        dadosPerfil.professorId ??
        usuarioLogin.professorId,
      vinculos: Array.isArray(dadosPerfil.vinculos)
        ? dadosPerfil.vinculos
        : []
    };
  } catch (erro) {
    console.warn(
      "Não foi possível carregar o perfil completo do professor. Usando os dados da sessão:",
      erro
    );

    return {
      ...usuarioLogin,
      vinculos: []
    };
  }
}

function montarCardDadosProfessor(usuario) {
  const campos = [
    {
      rotulo: "Nome",
      valor: usuario?.nome || "-"
    },
    {
      rotulo: "Email",
      valor: usuario?.email || "-"
    },
    {
      rotulo: "Perfil",
      valor: normalizarPerfil(
        usuario?.perfil,
        "professor"
      )
    },
    {
      rotulo: "Especialidade",
      valor: usuario?.especialidade || "Não informada"
    },
    {
      rotulo: "Vínculo",
      valor: "Professor(a)"
    }
  ];

  return `
    <article class="perfil-card">
      <div class="perfil-card__header">
        <div>
          <span class="perfil-eyebrow">Dados profissionais</span>
          <h3>Informações da conta</h3>
          <p>
            Os dados abaixo estão vinculados ao seu cadastro
            profissional no PreZence.
          </p>
        </div>
      </div>

      <div class="perfil-fields">
        ${campos
          .map(
            campo => `
              <div class="perfil-field">
                <span>${escaparHtml(campo.rotulo)}</span>
                <strong>${escaparHtml(campo.valor)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function montarCardResumoProfissional(usuario) {
  const indicadores = [
    {
      rotulo: "Turmas vinculadas",
      valor: numeroSeguro(usuario?.totalTurmas),
      icone: "school"
    },
    {
      rotulo: "Disciplinas",
      valor: numeroSeguro(usuario?.totalDisciplinas),
      icone: "book-open"
    },
    {
      rotulo: "Alunos acompanhados",
      valor: numeroSeguro(usuario?.totalAlunos),
      icone: "users"
    },
    {
      rotulo: "Aulas registradas",
      valor: numeroSeguro(usuario?.totalAulas),
      icone: "clipboard-check"
    }
  ];

  return `
    <article class="perfil-card">
      <div class="perfil-card__header">
        <div>
          <span class="perfil-eyebrow">Atuação acadêmica</span>
          <h3>Resumo profissional</h3>
          <p>
            Visão geral das atividades vinculadas ao seu perfil.
          </p>
        </div>
      </div>

      <div class="perfil-resumo-grid">
        ${indicadores
          .map(
            indicador => `
              <div class="perfil-resumo-item">
                <div class="perfil-resumo-icone">
                  <i data-lucide="${indicador.icone}"></i>
                </div>

                <div>
                  <span>${escaparHtml(indicador.rotulo)}</span>
                  <strong>${indicador.valor}</strong>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function montarCardVinculosProfessor(vinculos = []) {
  const lista = Array.isArray(vinculos)
    ? vinculos
    : [];

  return `
    <article class="perfil-card perfil-vinculos-card">
      <div class="perfil-card__header">
        <div>
          <span class="perfil-eyebrow">Vínculos acadêmicos</span>
          <h3>Turmas e disciplinas</h3>
          <p>
            Consulte as turmas e disciplinas pelas quais você é responsável.
          </p>
        </div>

        <button
          class="btn-secundario perfil-link-btn"
          id="btnPerfilVerTurmas"
          type="button"
        >
          <i data-lucide="external-link"></i>
          Ver todas as turmas
        </button>
      </div>

      ${
        lista.length
          ? `
            <div class="perfil-vinculos-lista">
              ${lista
                .map(
                  vinculo => `
                    <div class="perfil-vinculo-item">
                      <div class="perfil-vinculo-icone">
                        <i data-lucide="graduation-cap"></i>
                      </div>

                      <div class="perfil-vinculo-conteudo">
                        <strong>
                          ${escaparHtml(
                            vinculo?.turma || "Turma não informada"
                          )}
                        </strong>

                        <span>
                          ${escaparHtml(
                            vinculo?.disciplina ||
                              "Disciplina não informada"
                          )}
                        </span>
                      </div>

                      <div class="perfil-vinculo-codigo">
                        #${escaparHtml(
                          vinculo?.turmaDisciplinaId ?? "-"
                        )}
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          `
          : `
            <div class="perfil-vinculos-vazio">
              <i data-lucide="book-x"></i>

              <div>
                <strong>Nenhum vínculo encontrado</strong>
                <p>
                  Não existem turmas ou disciplinas associadas
                  a este professor.
                </p>
              </div>
            </div>
          `
      }
    </article>
  `;
}

function configurarAcoesPerfilProfessor() {
  const btnVerTurmas =
    document.getElementById("btnPerfilVerTurmas");

  btnVerTurmas?.addEventListener("click", () => {
    const itemTurmas =
      document.querySelector('[data-page="turmas"]');

    itemTurmas?.click();
  });
}

function numeroSeguro(valor) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
