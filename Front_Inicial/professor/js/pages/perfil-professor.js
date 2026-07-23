import {
  obterUsuarioPerfil,
  montarHeroPerfil,
  montarCardDadosPerfil,
  montarCardBiometriaPerfil,
  configurarCadastroFacialPerfil,
  resolverIdentificadorBiometrico
} from "../../../biometria/perfil-biometrico.js";

export async function abrirPerfilProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  const usuario = obterUsuarioPerfil() || {};
  const pessoaId = resolverIdentificadorBiometrico(usuario, "professor");

  conteudo.innerHTML = `
    <section class="page-shell">
      <div class="content-area section-center perfil-page">
        ${montarHeroPerfil({
          usuario,
          perfil: "professor",
          descricao: "Use esta área para revisar seus dados e preparar seu cadastro facial para futuras validações do EyeCount."
        })}

        <section class="perfil-grid">
          ${montarCardDadosPerfil({
            usuario,
            perfil: "professor",
            camposExtras: [
              { rotulo: "Especialidade", valor: usuario.especialidade ?? "Não informada" },
              { rotulo: "Vínculo", valor: "Professor(a)" }
            ]
          })}

          ${montarCardBiometriaPerfil({
            titulo: "Cadastro facial do professor",
            descricao: "O cadastro fica preparado para recursos futuros, como validação de abertura de chamada ou confirmação de identidade."
          })}
        </section>
      </div>
    </section>
  `;

  await configurarCadastroFacialPerfil({
    perfil: "professor",
    usuario,
    pessoaId,
    pessoaNome: usuario.nome || "Professor"
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}
