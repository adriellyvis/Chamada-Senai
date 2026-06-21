import { request } from "../../../core/api.js";

let aulaAtualId = null;

async function abrirChamada() {
  const turmaDisciplinaId =
    document.getElementById("turmaDisciplinaSelect").value;

  if (
    !turmaDisciplinaId ||
    turmaDisciplinaId === "undefined"
  ) {
    alert("Selecione uma turma/disciplina válida.");
    return;
  }

  try {
    const aula = await request(
      `/professor/abrir?turmaDisciplinaId=${turmaDisciplinaId}`,
      {
        method: "POST"
      }
    );

    aulaAtualId = aula.id;

    document.getElementById("btnAbrirChamada").style.display = "none";
    document.getElementById("btnEncerrarChamada").style.display = "inline-block";

    const badge = document.getElementById("statusChamadaBadge");

    if (badge) {
      badge.textContent = "Em andamento";
      badge.className = "chamada-status-badge andamento";
    }

    await carregarAlunosChamada();

  } catch (error) {
    console.error(error);
    alert("Erro ao abrir chamada");
  }
}

async function carregarTurmasProfessor(turmaDisciplinaIdInicial = "") {
  try {
    const turmas = await request("/professor/turmas");

    const select = document.getElementById("turmaDisciplinaSelect");

    if (!select) return;

    if (!turmas.length) {
      select.innerHTML = `
        <option value="">
          Nenhuma turma encontrada
        </option>
      `;
      return;
    }

    select.innerHTML = `
      <option value="">
        Selecione
      </option>

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
  const conteudo = document.getElementById("conteudoPrincipal");

  if (!conteudo) return;

  conteudo.innerHTML = `
    <div class="page-topbar">
      <div>
        <div class="page-title">CHAMADA</div>
        <div class="page-sub">Abra uma aula e registre a presença dos alunos.</div>
      </div>

      <div class="topbar-actions">
        <button class="bell-btn" type="button">
          🔔
        </button>

        <div class="search-pill">
          <input type="text" placeholder="Procurar aluno..." />
          <span>⌕</span>
        </div>
      </div>
    </div>

    <section class="chamada-layout">
      <div class="chamada-card chamada-config-card">
        <div class="chamada-card-header">
          <div>
            <h2>Nova chamada</h2>
            <p>Selecione a turma e disciplina para iniciar.</p>
          </div>

          <span class="chamada-status-badge aguardando" id="statusChamadaBadge">
            Aguardando
          </span>
        </div>

        <div class="chamada-form">
          <label for="turmaDisciplinaSelect">
            Turma / Disciplina
          </label>

          <select id="turmaDisciplinaSelect" class="select-pill chamada-select">
            <option value="">Carregando...</option>
          </select>

          <div class="chamada-botoes">
            <button class="btn-primary" id="btnAbrirChamada">
              Abrir chamada
            </button>

            <button class="btn-danger" id="btnEncerrarChamada" style="display:none;">
              Encerrar chamada
            </button>
          </div>
        </div>
      </div>

      <div class="chamada-card chamada-resumo-card">
        <h2>Resumo da aula</h2>

        <div class="chamada-resumo-grid">
          <div>
            <span>Presentes</span>
            <strong id="contadorPresentes">0</strong>
          </div>

          <div>
            <span>Ausentes</span>
            <strong id="contadorAusentes">0</strong>
          </div>

          <div>
            <span>Atrasados</span>
            <strong id="contadorAtrasados">0</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="chamada-card chamada-alunos-card">
      <div class="chamada-card-header">
        <div>
          <h2>Alunos</h2>
          <p>Atualize o status de presença individualmente.</p>
        </div>

        <button class="btn-secundario" id="btnAtualizarPresencas" type="button">
          Atualizar presenças
        </button>
      </div>

      <div id="listaAlunosChamada">
        <p class="empty-state">
          Abra uma chamada para listar os alunos.
        </p>
      </div>
    </section>
  `;

    document
    .getElementById("btnAbrirChamada")
    .addEventListener("click", abrirChamada);

    document
      .getElementById("btnEncerrarChamada")
      .addEventListener("click", encerrarChamada);

    document
      .getElementById("btnAtualizarPresencas")
      .addEventListener("click", async () => {
        if (!aulaAtualId) {
          alert("Nenhuma chamada aberta para atualizar.");
          return;
        }

        await carregarAlunosChamada();
      });

    await carregarTurmasProfessor(turmaDisciplinaIdInicial);

    const aulaRetomarId = localStorage.getItem("aulaRetomarId");

    if (aulaRetomarId) {
      aulaAtualId = Number(aulaRetomarId);
      localStorage.removeItem("aulaRetomarId");

      document.getElementById("btnAbrirChamada").style.display = "none";
      document.getElementById("btnEncerrarChamada").style.display = "inline-block";

      const badge = document.getElementById("statusChamadaBadge");

      if (badge) {
        badge.textContent = "Em andamento";
        badge.className = "chamada-status-badge andamento";
      }

      await carregarAlunosChamada();
    }
  }

async function carregarAlunosChamada() {
  try {
    const [alunos, presencas] = await Promise.all([
      request(`/professor/aula/${aulaAtualId}/alunos`),
      request(`/professor/aulas/${aulaAtualId}/presencas`).catch(() => [])
    ]);

    const presencasPorAluno = new Map(
      (presencas || []).map(presenca => [
        Number(presenca.alunoId),
        presenca
      ])
    );

    const alunosComPresenca = (alunos || []).map(aluno => {
      const alunoId = Number(aluno.id ?? aluno.alunoId);

      return {
        ...aluno,
        presencaProfessor: presencasPorAluno.get(alunoId) || null
      };
    });

    renderizarAlunosChamada(alunosComPresenca);

  } catch (error) {
    console.error(error);
    alert("Erro ao carregar alunos");
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

        const bloqueioBiometria = presencaBiometricaValidada ? "disabled" : "";

        const tituloBloqueioBiometria = presencaBiometricaValidada
          ? "Presença validada por biometria. Alteração manual bloqueada."
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
                  ${renderizarMetodoPresenca(metodoOriginal, validacaoBiometrica)}
                </p>
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
    .querySelectorAll("[data-aluno-id]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        registrarPresenca(
          botao.dataset.alunoId,
          botao.dataset.status
        );
      });
    });
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

    document.querySelector('[data-page="dashboard"]')?.click();

  } catch (error) {
    console.error(error);
    alert("Erro ao encerrar chamada");
  }
}

function atualizarContadoresChamada(alunos) {
  const presentes = alunos.filter(aluno => {
    return normalizarStatusChamada(
      aluno.status ??
      aluno.statusPresenca ??
      aluno.presencaStatus ??
      aluno.situacao ??
      aluno.presenca?.status
    ) === "presente";
  }).length;

  const ausentes = alunos.filter(aluno => {
    return normalizarStatusChamada(
      aluno.status ??
      aluno.statusPresenca ??
      aluno.presencaStatus ??
      aluno.situacao ??
      aluno.presenca?.status
    ) === "ausente";
  }).length;

  const atrasados = alunos.filter(aluno => {
    return normalizarStatusChamada(
      aluno.status ??
      aluno.statusPresenca ??
      aluno.presencaStatus ??
      aluno.situacao ??
      aluno.presenca?.status
    ) === "atrasado";
  }).length;

  setTexto("contadorPresentes", presentes);
  setTexto("contadorAusentes", ausentes);
  setTexto("contadorAtrasados", atrasados);
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

function renderizarMetodoPresenca(metodo, validacaoBiometrica) {
  const metodoNormalizado = String(metodo || "")
    .trim()
    .toUpperCase();

  if (metodoNormalizado === "BIOMETRIA" && validacaoBiometrica) {
    return `
      <span class="badge-presenca badge-biometria">
        Biometria validada
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
