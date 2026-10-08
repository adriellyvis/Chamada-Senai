const API_HOST = window.location.hostname || "localhost";
const API_URL = `http://${API_HOST}:8080`;

const params = new URLSearchParams(window.location.search);
const perfisValidos = new Set(["aluno", "professor", "gestor", "outro"]);
let perfil = String(params.get("perfil") || sessionStorage.getItem("prezence_acesso_perfil_contexto") || "aluno").toLowerCase();
if (!perfisValidos.has(perfil)) perfil = "outro";

const rotasLogin = {
  aluno: "./area-login-aluno.html",
  professor: "./area-login-professor.html",
  gestor: "./area-login-gestor.html",
  outro: "../index.html"
};

const form = document.getElementById("formSuporte");
const nome = document.getElementById("nomeSuporte");
const email = document.getElementById("emailSuporte");
const perfilSelect = document.getElementById("perfilSuporte");
const assunto = document.getElementById("assuntoSuporte");
const mensagem = document.getElementById("mensagemSuporte");
const botao = document.getElementById("btnEnviarSuporte");
const status = document.getElementById("statusSuporte");
const voltar = document.getElementById("voltarLoginSuporte");
const linkRecuperar = document.getElementById("linkRecuperarSenha");

function definirStatus(texto = "", tipo = "") {
  status.textContent = texto;
  status.className = `status${tipo ? ` ${tipo}` : ""}`;
}

function atualizarLinks() {
  perfil = perfilSelect.value;
  voltar.href = rotasLogin[perfil] || "../index.html";
  linkRecuperar.href = `./recuperar-senha.html?perfil=${encodeURIComponent(perfil === "outro" ? "aluno" : perfil)}`;
}

async function lerResposta(response) {
  const texto = await response.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return { message: texto };
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  definirStatus();

  const payload = {
    nome: nome.value.trim(),
    email: email.value.trim(),
    perfil: perfilSelect.value,
    assunto: assunto.value,
    mensagem: mensagem.value.trim()
  };

  if (!payload.nome || !payload.email || !payload.email.includes("@") || !payload.mensagem) {
    definirStatus("Preencha nome, e-mail institucional e a descrição do problema.", "erro");
    return;
  }

  botao.disabled = true;
  botao.textContent = "Enviando...";

  try {
    const response = await fetch(`${API_URL}/suporte/acesso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await lerResposta(response);

    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        throw new Error("O canal interno de suporte ainda não está habilitado no backend deste ambiente. Até ele ser implementado, procure a equipe da instituição pelo canal oficial.");
      }
      throw new Error(data?.mensagem || data?.message || "Não foi possível enviar a solicitação.");
    }

    const protocolo = data?.protocolo || data?.id;
    definirStatus(
      protocolo
        ? `Solicitação enviada aos gestores. Protocolo: ${protocolo}.`
        : "Solicitação enviada aos gestores com sucesso.",
      "sucesso"
    );

    mensagem.value = "";
  } catch (erro) {
    definirStatus(erro?.message || "Falha ao enviar solicitação.", "erro");
  } finally {
    botao.disabled = false;
    botao.textContent = "Enviar para a equipe gestora";
  }
});

const emailContexto = sessionStorage.getItem("prezence_acesso_email_contexto") || localStorage.getItem(`prezence_login_email_${perfil}`) || "";
email.value = emailContexto;
perfilSelect.value = perfisValidos.has(perfil) ? perfil : "outro";
atualizarLinks();
perfilSelect.addEventListener("change", atualizarLinks);
