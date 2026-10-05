import { request } from "../../../core/api.js";
import {
  buscarConfirmacoesBiometricasPendentes,
  confirmarSolicitacaoBiometrica,
  recusarSolicitacaoBiometrica
} from "../api/confirmacoes-biometricas-api.js";

let aulaAtualId = null;
let turmaDisciplinaAtualId = null;
let intervaloAtualizacaoChamada = null;

function pararAtualizacaoAutomaticaChamada() {
  if (intervaloAtualizacaoChamada) {
    clearInterval(intervaloAtualizacaoChamada);
    intervaloAtualizacaoChamada = null;
  }
}

function iniciarAtualizacaoAutomaticaChamada() {
  pararAtualizacaoAutomaticaChamada();

  intervaloAtualizacaoChamada = setInterval(async () => {
    const lista = document.getElementById("listaAlunosChamada");

    if (!lista || !aulaAtualId) {
      pararAtualizacaoAutomaticaChamada();
      return;
    }

    try {
      await carregarAlunosChamada({ silencioso: true });
    } catch (erro) {
      console.warn("Atualização automática da chamada falhou:", erro);
    }
  }, 5000);
}

function obterIdAula(chamada) {
  return Number(chamada?.aulaId ?? chamada?.id) || null;
}

function obterIdTurmaDisciplina(chamada) {
  return Number(
    chamada?.turmaDisciplinaId ??
    chamada?.turmaDisciplina?.id
  ) || null;
}

function aplicarEstadoChamadaAberta(chamada) {
  aulaAtualId = obterIdAula(chamada);
  turmaDisciplinaAtualId = obterIdTurmaDisciplina(chamada);

  const select = document.getElementById("turmaDisciplinaSelect");
  const btnAbrir = document.getElementById("btnAbrirChamada");
  const btnEncerrar = document.getElementById("btnEncerrarChamada");
  const badge = document.getElementById("statusChamadaBadge");
  const titulo = document.getElementById("tituloConfiguracaoChamada");
  const subtitulo = document.getElementById("subtituloConfiguracaoChamada");

  if (select && turmaDisciplinaAtualId) {
    select.value = String(turmaDisciplinaAtualId);
    select.disabled = true;
  }

  if (btnAbrir) btnAbrir.style.display = "none";
  if (btnEncerrar) btnEncerrar.style.display = "inline-block";

  if (badge) {
    badge.textContent = "Em andamento";
    badge.className = "chamada-status-badge andamento";
  }

  if (titulo) titulo.textContent = "Chamada em andamento";

  if (subtitulo) {
    const turma = chamada?.turma ?? chamada?.turmaDisciplina?.turma?.nome;
    const disciplina = chamada?.disciplina ?? chamada?.turmaDisciplina?.disciplina?.nome;

    subtitulo.textContent = turma && disciplina
      ? `${turma} • ${disciplina}`
      : "A chamada aberta foi recuperada automaticamente.";
  }
}

function aplicarEstadoSemChamada() {
  aulaAtualId = null;
  turmaDisciplinaAtualId = null;

  const select = document.getElementById("turmaDisciplinaSelect");
  const btnAbrir = document.getElementById("btnAbrirChamada");
  const btnEncerrar = document.getElementById("btnEncerrarChamada");
  const badge = document.getElementById("statusChamadaBadge");
  const titulo = document.getElementById("tituloConfiguracaoChamada");
  const subtitulo = document.getElementById("subtituloConfiguracaoChamada");

  if (select) select.disabled = false;
  if (btnAbrir) btnAbrir.style.display = "inline-block";
  if (btnEncerrar) btnEncerrar.style.display = "none";

  if (badge) {
    badge.textContent = "Aguardando";
    badge.className = "chamada-status-badge aguardando";
  }

  if (titulo) titulo.textContent = "Nova chamada";
  if (subtitulo) subtitulo.textContent = "Selecione a turma e disciplina para iniciar.";
}

async function recuperarChamadaAbertaProfessor() {
  try {
    const chamada = await request("/professor/chamada-aberta");

    if (!chamada?.aulaId) {
      aplicarEstadoSemChamada();
      return false;
    }

    aplicarEstadoChamadaAberta(chamada);
    await carregarAlunosChamada();
    iniciarAtualizacaoAutomaticaChamada();
    return true;
  } catch (erro) {
    console.error("Erro ao recuperar chamada aberta:", erro);
    aplicarEstadoSemChamada();
    return false;
  }
}

async function abrirChamada() {
  const turmaDisciplinaId = document.getElementById("turmaDisciplinaSelect")?.value;

  if (!turmaDisciplinaId || turmaDisciplinaId === "undefined") {
    alert("Selecione uma turma/disciplina válida.");
    return;
  }

  try {
    const aula = await request(
      `/professor/abrir?turmaDisciplinaId=${turmaDisciplinaId}`,
      { method: "POST" }
    );

    aplicarEstadoChamadaAberta(aula);
    await carregarAlunosChamada();
    iniciarAtualizacaoAutomaticaChamada();
  } catch (error) {
    console.error(error);
    alert(error.message || "Erro ao abrir chamada");

    // Caso o backend informe que já existe outra chamada, tenta recuperá-la.
    await recuperarChamadaAbertaProfessor();
  }
}

async function carregarTurmasProfessor(turmaDisciplinaIdInicial = "") {
  try {
    const turmas = await request("/professor/turmas");
    const select = document.getElementById("turmaDisciplinaSelect");

    if (!select) return;

    if (!turmas.length) {
      select.innerHTML = `<option value="">Nenhuma turma encontrada</option>`;
      return;
    }

    select.innerHTML = `
      <option value="">Selecione</option>
      ${turmas.map(turma => `
        <option
          value="${turma.turmaDisciplinaId}"
          ${String(turma.turmaDisciplinaId) === String(turmaDisciplinaIdInicial) ? "selected" : ""}
        >
          ${turma.nomeTurma} - ${turma.disciplina}
        </option>
      `).join("")}
    `;
  } catch (error) {
    console.error(error);
    alert("Erro ao carregar turmas");
  }
}

export async function abrirChamadaProfessor(turmaDisciplinaIdInicial = "") {
  pararAtualizacaoAutomaticaChamada();

  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  conteudo.innerHTML = `
    <div class="page-topbar">
      <div>
        <div class="page-title">CHAMADA</div>
        <div class="page-sub">Abra uma aula e registre a presença dos alunos.</div>
      </div>

      <div class="topbar-actions">
        <button class="bell-btn" type="button" aria-label="Notificações"><span class="material-symbols-rounded" aria-hidden="true">notifications</span></button>
        <div class="search-pill">
          <input type="text" placeholder="Buscar alunos e turmas..." />
          <span>⌕</span>
        </div>
      </div>
    </div>

    <section class="chamada-layout">
      <div class="chamada-card chamada-config-card">
        <div class="chamada-card-header">
          <div>
            <h2 id="tituloConfiguracaoChamada">Nova chamada</h2>
            <p id="subtituloConfiguracaoChamada">Selecione a turma e disciplina para iniciar.</p>
          </div>

          <span class="chamada-status-badge aguardando" id="statusChamadaBadge">
            Aguardando
          </span>
        </div>

        <div class="chamada-form">
          <label for="turmaDisciplinaSelect">Turma / Disciplina</label>

          <select id="turmaDisciplinaSelect" class="select-pill chamada-select">
            <option value="">Carregando...</option>
          </select>

          <div class="chamada-botoes">
            <button class="btn-primary" id="btnAbrirChamada">Abrir chamada</button>
            <button class="btn-danger" id="btnEncerrarChamada" style="display:none;">
              Encerrar chamada
            </button>
          </div>
        </div>
      </div>

      <div class="chamada-card chamada-resumo-card">
        <h2>Resumo da aula</h2>

        <div class="chamada-resumo-grid chamada-resumo-grid--completo">
          <div class="resumo-item resumo-item--total">
            <span>Total de alunos</span>
            <strong id="contadorTotalAlunos">0</strong>
          </div>
          <div class="resumo-item resumo-item--presente">
            <span>Presentes</span>
            <strong id="contadorPresentes">0</strong>
          </div>
          <div class="resumo-item resumo-item--ausente">
            <span>Ausentes</span>
            <strong id="contadorAusentes">0</strong>
          </div>
          <div class="resumo-item resumo-item--atrasado">
            <span>Atrasados</span>
            <strong id="contadorAtrasados">0</strong>
          </div>
          <div class="resumo-item resumo-item--biometria">
            <span>Biometria confirmada</span>
            <strong id="contadorBiometria">0</strong>
          </div>
          <div class="resumo-item resumo-item--biometria-pendente">
            <span>Aguardando professor</span>
            <strong id="contadorBiometriaPendente">0</strong>
          </div>
          <div class="resumo-item resumo-item--manual">
            <span>Manual</span>
            <strong id="contadorManual">0</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="chamada-card chamada-alunos-card">
      <div class="chamada-card-header">
        <div>
          <h2>Alunos</h2>
          <p>Atualização automática a cada 5 segundos enquanto a chamada estiver aberta.</p>
        </div>

        <button class="btn-secundario" id="btnAtualizarPresencas" type="button">
          Atualizar presenças
        </button>
      </div>

      <div id="listaAlunosChamada">
        <p class="empty-state">Abra uma chamada para listar os alunos.</p>
      </div>
    </section>
  `;

  document.getElementById("btnAbrirChamada")?.addEventListener("click", abrirChamada);
  document.getElementById("btnEncerrarChamada")?.addEventListener("click", encerrarChamada);

  document.getElementById("btnAtualizarPresencas")?.addEventListener("click", async () => {
    if (!aulaAtualId) {
      alert("Nenhuma chamada aberta para atualizar.");
      return;
    }

    await carregarAlunosChamada();
  });

  await carregarTurmasProfessor(turmaDisciplinaIdInicial);

  const chamadaRecuperada = await recuperarChamadaAbertaProfessor();
  localStorage.removeItem("aulaRetomarId");

  if (!chamadaRecuperada && turmaDisciplinaIdInicial) {
    const select = document.getElementById("turmaDisciplinaSelect");
    if (select) select.value = String(turmaDisciplinaIdInicial);
  }
}

async function carregarAlunosChamada(opcoes = {}) {
  try {
    const [alunos, presencas, solicitacoesPendentes] = await Promise.all([
      request(`/professor/aula/${aulaAtualId}/alunos`),
      request(`/professor/aulas/${aulaAtualId}/presencas`).catch(() => []),
      buscarConfirmacoesBiometricasPendentes().catch(() => [])
    ]);

    const presencasPorAluno = new Map(
      (presencas || []).map(presenca => [
        Number(presenca.alunoId),
        presenca
      ])
    );

    const pendentesDaAula = (solicitacoesPendentes || []).filter(item => {
      const itemAulaId = Number(item.aulaId ?? item.aula?.id);
      return !itemAulaId || itemAulaId === Number(aulaAtualId);
    });

    const solicitacoesPorAluno = new Map(
      pendentesDaAula.map(item => [
        Number(item.alunoId ?? item.aluno?.id),
        item
      ])
    );

    const alunosComPresenca = (alunos || []).map(aluno => {
      const alunoId = Number(aluno.id ?? aluno.alunoId);

      return {
        ...aluno,
        presencaProfessor: presencasPorAluno.get(alunoId) || null,
        solicitacaoBiometrica: solicitacoesPorAluno.get(alunoId) || null
      };
    });

    renderizarAlunosChamada(alunosComPresenca);

  } catch (error) {
    console.error(error);

    if (!opcoes.silencioso) {
      alert("Erro ao carregar alunos");
    }
  }
}

function renderizarAlunosChamada(alunos) {
  const lista = document.getElementById("listaAlunosChamada");

  if (!lista) return;

  atualizarContadoresChamada(alunos);

  if (!alunos.length) {
    lista.innerHTML = `
      <p class="empty-state">
        Nenhum aluno encontrado.
      </p>
    `;
    return;
  }

  lista.innerHTML = `
    <div class="chamada-alunos-lista">
      ${alunos.map(aluno => {
        const alunoId = aluno.id ?? aluno.alunoId;
        const nome = aluno.nome ?? aluno.nomeAluno ?? "Aluno";

        const presencaProfessor = aluno.presencaProfessor;

        const statusOriginal =
          presencaProfessor?.status ??
          aluno.status ??
          aluno.statusPresenca ??
          aluno.presencaStatus ??
          aluno.situacao ??
          aluno.presenca?.status ??
          "nao_registrado";

        const metodoOriginal =
          presencaProfessor?.metodo ??  
          aluno.metodo ??
          aluno.presenca?.metodo ??
          null;

       const validacaoBiometrica =
          Boolean(presencaProfessor?.validacaoBiometrica ?? aluno.validacaoBiometrica);

        const statusNormalizado = normalizarStatusChamada(statusOriginal);

        const metodoNormalizado = String(metodoOriginal || "")
          .trim()
          .toUpperCase();

        const presencaBiometricaValidada =
          metodoNormalizado === "BIOMETRIA" && validacaoBiometrica;

        const solicitacaoBiometrica = aluno.solicitacaoBiometrica || null;
        const biometriaPendente = Boolean(solicitacaoBiometrica) &&
          normalizarStatusSolicitacaoBiometrica(
            solicitacaoBiometrica.status ?? solicitacaoBiometrica.situacao ?? solicitacaoBiometrica.estado
          ) === "PENDENTE";

        const bloqueioBiometria = (presencaBiometricaValidada || biometriaPendente) ? "disabled" : "";

        const tituloBloqueioBiometria = presencaBiometricaValidada
          ? "Presença biométrica confirmada. Alteração manual bloqueada."
          : biometriaPendente
            ? "Existe uma biometria aguardando sua confirmação. Confirme ou recuse antes de marcar manualmente."
            : "";

        return `
          <article class="chamada-aluno-item ${statusNormalizado}">
            <div class="chamada-aluno-info">
              <div class="chamada-avatar">
                ${nome.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>${nome}</strong>
                <p>Status atual:
                  <span class="chamada-status-text ${statusNormalizado}">
                    ${formatarStatusChamada(statusNormalizado)}
                  </span>
                </p>

                <p class="chamada-metodo-presenca">
                  ${renderizarMetodoPresenca(
                    metodoOriginal,
                    validacaoBiometrica,
                    biometriaPendente
                  )}
                </p>

                ${biometriaPendente ? renderizarSolicitacaoBiometrica(solicitacaoBiometrica) : ""}
              </div>
            </div>

            <div class="acoes-chamada">
              <button
                class="btn-status presente ${statusNormalizado === "presente" ? "ativo" : ""}"
                ${bloqueioBiometria}
                title="${tituloBloqueioBiometria}"
                data-aluno-id="${alunoId}"
                data-status="presente"
              >
                Presente
              </button>

              <button
                class="btn-status ausente ${statusNormalizado === "ausente" ? "ativo" : ""}"
                ${bloqueioBiometria}
                title="${tituloBloqueioBiometria}"
                data-aluno-id="${alunoId}"
                data-status="ausente"
              >
                Ausente
              </button>

              <button
                class="btn-status atrasado ${statusNormalizado === "atrasado" ? "ativo" : ""}"
                ${bloqueioBiometria}
                title="${tituloBloqueioBiometria}"
                data-aluno-id="${alunoId}"
                data-status="atrasado"
              >
                Atrasado
              </button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;

  adicionarEventosPresenca();
}


function adicionarEventosPresenca() {
  document
    .querySelectorAll(".btn-status[data-aluno-id][data-status]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        registrarPresenca(
          botao.dataset.alunoId,
          botao.dataset.status
        );
      });
    });

  document
    .querySelectorAll("[data-biometria-confirmar]")
    .forEach(botao => {
      botao.addEventListener("click", async () => {
        await confirmarBiometriaPendente(
          botao.dataset.biometriaConfirmar,
          botao
        );
      });
    });

  document
    .querySelectorAll("[data-biometria-recusar]")
    .forEach(botao => {
      botao.addEventListener("click", async () => {
        await recusarBiometriaPendente(
          botao.dataset.biometriaRecusar,
          botao
        );
      });
    });
}

async function confirmarBiometriaPendente(solicitacaoId, botao) {
  if (!solicitacaoId) return;

  const botoes = botao.closest(".biometria-pendente-acoes")?.querySelectorAll("button") || [];
  botoes.forEach(item => item.disabled = true);
  const textoOriginal = botao.textContent;
  botao.textContent = "Confirmando...";

  try {
    await confirmarSolicitacaoBiometrica(solicitacaoId);
    window.dispatchEvent(new CustomEvent("eyecount:biometria-professor-atualizada"));
    await carregarAlunosChamada();
  } catch (erro) {
    console.error("Erro ao confirmar biometria:", erro);
    alert(erro.message || "Não foi possível confirmar a biometria.");
    botoes.forEach(item => item.disabled = false);
    botao.textContent = textoOriginal;
  }
}

async function recusarBiometriaPendente(solicitacaoId, botao) {
  if (!solicitacaoId) return;

  if (!window.confirm("Recusar esta validação biométrica? O aluno poderá tentar novamente.")) {
    return;
  }

  const botoes = botao.closest(".biometria-pendente-acoes")?.querySelectorAll("button") || [];
  botoes.forEach(item => item.disabled = true);
  const textoOriginal = botao.textContent;
  botao.textContent = "Recusando...";

  try {
    await recusarSolicitacaoBiometrica(solicitacaoId);
    window.dispatchEvent(new CustomEvent("eyecount:biometria-professor-atualizada"));
    await carregarAlunosChamada();
  } catch (erro) {
    console.error("Erro ao recusar biometria:", erro);
    alert(erro.message || "Não foi possível recusar a biometria.");
    botoes.forEach(item => item.disabled = false);
    botao.textContent = textoOriginal;
  }
}

async function registrarPresenca(alunoId, status) {
  console.log({
    alunoId,
    aulaAtualId,
    status
  });

  try {
    await request("/professor/presenca", {
      method: "POST",
      body: JSON.stringify({
        alunoId: Number(alunoId),
        aulaId: Number(aulaAtualId),
        status: normalizarStatusPresenca(status),
        metodo: "MANUAL"
      })
    });

    await carregarAlunosChamada();

  } catch (error) {
    console.error(error);
    alert("Erro ao registrar presença");
  }
}

async function encerrarChamada() {
  if (!aulaAtualId) {
    alert("Nenhuma aula aberta");
    return;
  }

  try {
    await request(`/professor/aula/encerrar/${aulaAtualId}`, {
      method: "POST"
    });

    alert("Chamada encerrada com sucesso!");

    aulaAtualId = null;
    pararAtualizacaoAutomaticaChamada();

    document.querySelector('[data-page="dashboard"]')?.click();

  } catch (error) {
    console.error(error);
    alert("Erro ao encerrar chamada");
  }
}

function atualizarContadoresChamada(alunos) {
  const totalAlunos = alunos.length;

  const obterStatusAluno = aluno => normalizarStatusChamada(
    aluno.presencaProfessor?.status ??
    aluno.status ??
    aluno.statusPresenca ??
    aluno.presencaStatus ??
    aluno.situacao ??
    aluno.presenca?.status
  );

  const obterMetodoAluno = aluno => String(
    aluno.presencaProfessor?.metodo ??
    aluno.metodo ??
    aluno.presenca?.metodo ??
    ""
  ).trim().toUpperCase();

  const alunosPresentes = alunos.filter(aluno => obterStatusAluno(aluno) === "presente");
  const alunosAtrasados = alunos.filter(aluno => obterStatusAluno(aluno) === "atrasado");

  const presentes = alunosPresentes.length;
  const atrasados = alunosAtrasados.length;

  // Enquanto a chamada está aberta, aluno sem registro conta como ausente no resumo.
  // Isso mostra ao professor quantos ainda faltam validar presença.
  const ausentes = Math.max(0, totalAlunos - presentes - atrasados);

  const biometria = alunos.filter(aluno =>
    obterMetodoAluno(aluno) === "BIOMETRIA" &&
    Boolean(aluno.presencaProfessor?.validacaoBiometrica ?? aluno.validacaoBiometrica)
  ).length;

  const biometriaPendente = alunos.filter(aluno => {
    const solicitacao = aluno.solicitacaoBiometrica;
    if (!solicitacao) return false;
    return normalizarStatusSolicitacaoBiometrica(
      solicitacao.status ?? solicitacao.situacao ?? solicitacao.estado
    ) === "PENDENTE";
  }).length;

  const manual = alunos.filter(aluno => obterMetodoAluno(aluno) === "MANUAL").length;

  setTexto("contadorTotalAlunos", totalAlunos);
  setTexto("contadorPresentes", presentes);
  setTexto("contadorAusentes", ausentes);
  setTexto("contadorAtrasados", atrasados);
  setTexto("contadorBiometria", biometria);
  setTexto("contadorBiometriaPendente", biometriaPendente);
  setTexto("contadorManual", manual);
}

function normalizarStatusChamada(status) {
  const texto = String(status || "nao_registrado")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");

  const mapa = {
    presente: "presente",
    ausente: "ausente",
    atrasado: "atrasado",
    "saida-temporaria": "saida-temporaria",
    "saída-temporária": "saida-temporaria",
    "nao-registrado": "nao-registrado",
    "não-registrado": "nao-registrado",
    null: "nao-registrado",
    undefined: "nao-registrado"
  };

  return mapa[texto] || texto;
}

function normalizarStatusSolicitacaoBiometrica(valor) {
  const status = String(valor || "PENDENTE")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_");

  if (["PENDENTE", "AGUARDANDO", "AGUARDANDO_CONFIRMACAO"].includes(status)) return "PENDENTE";
  if (["CONFIRMADA", "CONFIRMADO", "APROVADA", "APROVADO"].includes(status)) return "CONFIRMADA";
  if (["RECUSADA", "RECUSADO", "REJEITADA", "REJEITADO"].includes(status)) return "RECUSADA";

  return status;
}

function renderizarSolicitacaoBiometrica(solicitacao = {}) {
  const id = Number(solicitacao.id ?? solicitacao.solicitacaoId) || "";
  const horario = formatarHorarioSolicitacaoBiometrica(
    solicitacao.horarioSolicitacao ??
    solicitacao.horarioBiometria ??
    solicitacao.dataCriacao ??
    solicitacao.criadoEm
  );

  const statusSugerido = String(
    solicitacao.statusSugerido ??
    solicitacao.statusCalculado ??
    solicitacao.presencaSugerida ??
    ""
  ).trim().toUpperCase();

  const rotuloStatus = statusSugerido === "ATRASADO"
    ? "Atrasado pelo horário da biometria"
    : statusSugerido === "PRESENTE"
      ? "Presente pelo horário da biometria"
      : "Status será calculado pelo servidor";

  return `
    <div class="biometria-pendente-box">
      <div class="biometria-pendente-cabecalho">
        <span class="material-symbols-rounded" aria-hidden="true">face_6</span>
        <div>
          <strong>Biometria aguardando confirmação</strong>
          <small>${escapeHtml(horario || "Recebida agora")} • ${escapeHtml(rotuloStatus)}</small>
        </div>
      </div>

      <div class="biometria-pendente-acoes">
        <button class="btn-biometria-confirmar" type="button" data-biometria-confirmar="${escapeHtml(id)}">
          <span class="material-symbols-rounded" aria-hidden="true">check</span>
          Confirmar presença
        </button>
        <button class="btn-biometria-recusar" type="button" data-biometria-recusar="${escapeHtml(id)}">
          <span class="material-symbols-rounded" aria-hidden="true">close</span>
          Recusar
        </button>
      </div>
    </div>
  `;
}

function formatarHorarioSolicitacaoBiometrica(valor) {
  if (!valor) return "";

  const data = new Date(valor);
  if (!Number.isNaN(data.getTime())) {
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  const texto = String(valor);
  const match = texto.match(/(\d{2}:\d{2})/);
  return match?.[1] || texto;
}

function renderizarMetodoPresenca(metodo, validacaoBiometrica, biometriaPendente = false) {
  if (biometriaPendente) {
    return `
      <span class="badge-presenca badge-biometria-pendente">
        Aguardando confirmação
      </span>
    `;
  }

  const metodoNormalizado = String(metodo || "")
    .trim()
    .toUpperCase();

  if (metodoNormalizado === "BIOMETRIA" && validacaoBiometrica) {
    return `
      <span class="badge-presenca badge-biometria">
        Biometria confirmada
      </span>
    `;
  }

  if (metodoNormalizado === "BIOMETRIA") {
    return `
      <span class="badge-presenca badge-biometria">
        Biometria
      </span>
    `;
  }

  if (metodoNormalizado === "MANUAL") {
    return `
      <span class="badge-presenca badge-manual">
        Manual
      </span>
    `;
  }

  return `
    <span class="badge-presenca badge-pendente">
      Sem validação
    </span>
  `;
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarStatusChamada(status) {
  const statusNormalizado = normalizarStatusChamada(status);

  const mapa = {
    presente: "Presente",
    ausente: "Ausente",
    atrasado: "Atrasado",
    "saida-temporaria": "Saída temporária",
    "nao-registrado": "Não registrado"
  };

  return mapa[statusNormalizado] ?? "Não registrado";
}

function setTexto(id, valor) {
  const elemento = document.getElementById(id);

  if (!elemento) return;

  elemento.textContent = valor;
}


function normalizarStatusPresenca(status) {
  const mapa = {
    presente: "PRESENTE",
    ausente: "AUSENTE",
    atrasado: "ATRASADO",
    saida_temporaria: "SAIDA_TEMPORARIA",
    "saída temporária": "SAIDA_TEMPORARIA"
  };

  const chave = String(status).trim().toLowerCase();
  return mapa[chave] || String(status).trim().toUpperCase();
}
