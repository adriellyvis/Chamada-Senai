import { request } from "../../../core/api.js";

import {
  obterUsuarioPerfil,
  montarHeroPerfil,
  montarCardDadosPerfil,
  montarCardBiometriaPerfil,
  configurarCadastroFacialPerfil,
  resolverIdentificadorBiometrico
} from "../../../biometria/perfil-biometrico.js";

export async function abrirPerfilAluno(container) {
  const usuarioLogin = obterUsuarioPerfil() || {};
  const usuario = await carregarDadosPerfilAluno(usuarioLogin);
  const pessoaId = resolverIdentificadorBiometrico(usuario, "aluno");

  container.innerHTML = `
    <div class="perfil-page">
      ${montarHeroPerfil({
        usuario,
        perfil: "aluno",
        descricao: "Mantenha seus dados básicos visíveis e cadastre sua face antes de usar a chamada biométrica."
      })}

      <section class="perfil-grid">
        ${montarCardDadosPerfil({
          usuario,
          perfil: "aluno",
          camposExtras: [
            { rotulo: "Matrícula", valor: obterMatricula(usuario) },
            { rotulo: "Turma", valor: obterTurma(usuario) },
            { rotulo: "Frequência", valor: obterFrequencia(usuario) }
          ]
        })}

        ${montarCardBiometriaPerfil({
          titulo: "Minha face cadastrada",
          descricao: "Esse cadastro prepara sua conta para confirmar presença quando o professor abrir a chamada."
        })}
      </section>
    </div>
  `;

  configurarCadastroFacialPerfil({
    perfil: "aluno",
    usuario,
    pessoaId,
    pessoaNome: usuario.nome || "Aluno"
  });
}

async function carregarDadosPerfilAluno(usuarioLogin) {
  try {
    if (!usuarioLogin?.id) {
      return usuarioLogin;
    }

    const dadosPerfil = await request(`/aluno/perfil/${usuarioLogin.id}`);

    return {
      ...usuarioLogin,
      ...dadosPerfil
    };
  } catch (erro) {
    console.warn("Perfil completo do aluno ainda não disponível no backend:", erro);

    return usuarioLogin;
  }
}

function obterMatricula(usuario) {
  return (
    usuario.matricula ??
    usuario.ra ??
    usuario.aluno?.matricula ??
    usuario.aluno?.ra ??
    "Não informada"
  );
}

function obterTurma(usuario) {
  return (
    usuario.turma ??
    usuario.nomeTurma ??
    usuario.turmaNome ??
    usuario.aluno?.turma ??
    usuario.aluno?.nomeTurma ??
    usuario.aluno?.turma?.nome ??
    usuario.turma?.nome ??
    "Não informada"
  );
}

function obterFrequencia(usuario) {
  const frequencia =
    usuario.frequencia ??
    usuario.mediaFrequencia ??
    usuario.aluno?.frequencia ??
    usuario.aluno?.mediaFrequencia;

  if (frequencia === null || frequencia === undefined) {
    return "Não informada";
  }

  return `${Number(frequencia).toFixed(1).replace(".0", "")}%`;
}
