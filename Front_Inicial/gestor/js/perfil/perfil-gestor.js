import { marcarMenuAtivo, getConteudoPrincipal } from "../../../core/spa.js";

import {
  obterUsuarioPerfil,
  montarHeroPerfil,
  montarCardDadosPerfil,
  montarCardBiometriaPerfil,
  configurarCadastroFacialPerfil,
  resolverIdentificadorBiometrico
} from "../../../biometria/perfil-biometrico.js";

export async function abrirPerfilGestor(elemento = null) {
  marcarMenuAtivo(elemento);

  const conteudo = getConteudoPrincipal();
  if (!conteudo) return;

  const usuario = obterUsuarioPerfil() || {};
  const pessoaId = resolverIdentificadorBiometrico(usuario, "gestor");

  conteudo.innerHTML = `
    <section class="pagina-spa perfil-page">
      ${montarHeroPerfil({
        usuario,
        perfil: "gestor",
        descricao: "Centralize seus dados de acesso e mantenha a biometria preparada para etapas administrativas futuras."
      })}

      <section class="perfil-grid">
        ${montarCardDadosPerfil({
          usuario,
          perfil: "gestor",
          camposExtras: [
            { rotulo: "Setor", valor: usuario.setor ?? "Apoio / Gestão" },
            { rotulo: "Permissão", valor: "Gerenciamento institucional" }
          ]
        })}

        ${montarCardBiometriaPerfil({
          titulo: "Cadastro facial do gestor",
          descricao: "Esse cadastro deixa o perfil pronto para validações administrativas e auditoria de acesso."
        })}
      </section>
    </section>
  `;

  await configurarCadastroFacialPerfil({
    perfil: "gestor",
    usuario,
    pessoaId,
    pessoaNome: usuario.nome || "Gestor"
  });
}
