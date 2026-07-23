import { request } from "../../../core/api.js";

let registrosAtuais = [];

export async function abrirFrequenciaAluno(container) {
  const usuario = obterUsuarioLogado();

  container.innerHTML = `
    <div class="frequencia-page">
      <div class="frequencia-loading">Carregando frequência...</div>
    </div>
  `;

  const dashboardFallback = montarDashboardFallback();
  let dashboard = dashboardFallback;
  let registros = [];

  try {
    if (usuario?.id) {
      dashboard = normalizarDashboard(await request(`/aluno/dashboard/${usuario.id}`));
    }
  } catch (erro) {
    console.error("Erro ao carregar resumo de frequência:", erro);
  }

  try {
    if (usuario?.id) {
      const historico = await request(`/aluno/presencas/${usuario.id}`);
      registros = normalizarRegistros(historico);
    }
  } catch (erro) {
    console.error("Erro ao carregar histórico de frequência:", erro);
  }

  registrosAtuais = registros;

  container.innerHTML = montarFrequencia({
    dashboard,
    registros
  });

  configurarFiltrosFrequencia(registros);
  aplicarDisciplinaPendente();
  configurarAtalhoChamada();
}

function montarFrequencia({ dashboard, registros }) {
  const ultimoRegistroBiometrico = registros.find(registro =>
    registro.registro.toLowerCase().includes("biometria")
  );

  return `
    <div class="frequencia-page">
      <section class="frequencia-summary">
        ${cardResumo("Frequência geral", formatarPercentual(dashboard.frequencia), textoSituacao(dashboard.risco), "ok")}
        ${cardResumo("Presenças", dashboard.presencas, "Aulas confirmadas", "ok")}
        ${cardResumo("Atrasos", dashboard.atrasos, "Registros totais", "warn")}
        ${cardResumo("Faltas", dashboard.faltasMes, "No mês atual", "danger")}
      </section>

      <section class="frequencia-layout">
        <article class="card frequencia-table-card">
          <div class="frequencia-header">
            <div>
              <h2>Histórico de Frequência</h2>
              <p>Consulte suas presenças, atrasos, faltas e validações biométricas.</p>
            </div>

            <div class="frequencia-filtros" aria-label="Filtros de frequência">
              <label>
                <span>Disciplina</span>
                <select id="filtroDisciplinaFrequencia">
                  ${montarOpcoesDisciplina(registros)}
                </select>
              </label>

              <label>
                <span>Status</span>
                <select id="filtroStatusFrequencia">
                  <option value="todos">Todos os status</option>
                  <option value="ok">Presente</option>
                  <option value="warn">Atraso</option>
                  <option value="danger">Falta</option>
                </select>
              </label>

              <label>
                <span>Registro</span>
                <select id="filtroRegistroFrequencia">
                  <option value="todos">Todos os registros</option>
                  <option value="biometria">Biometria facial</option>
                  <option value="manual">Manual</option>
                  <option value="sem-registro">Sem registro</option>
                </select>
              </label>
            </div>
          </div>

          <div class="frequencia-table-wrapper">
            <table class="frequencia-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Disciplina</th>
                  <th>Professor</th>
                  <th>Horário</th>
                  <th>Status</th>
                  <th>Registro</th>
                </tr>
              </thead>

              <tbody id="frequenciaTabelaBody">
                ${registros.length
                  ? registros.map(linha => linhaFrequencia(linha)).join("")
                  : linhaVazia("Nenhum registro de frequência encontrado ainda.")}
              </tbody>
            </table>
          </div>
        </article>

        <aside class="frequencia-side">
          <article class="card frequencia-risk-card">
            <h3>Situação do aluno</h3>

            <div class="risk-circle" style="--progress:${Math.max(0, Math.min(100, Math.round(dashboard.frequencia || 0)))};">
              <strong>${formatarPercentual(dashboard.frequencia)}</strong>
              <span>frequência</span>
            </div>

            <p class="risk-text">
              ${mensagemSituacao(dashboard.frequencia)}
            </p>

            <div class="risk-info-list">
              <div>
                <span>Mínimo exigido</span>
                <strong>75%</strong>
              </div>

              <div>
                <span>Status</span>
                <strong class="${classeStatus(dashboard.risco)}">${textoSituacao(dashboard.risco)}</strong>
              </div>

              <div>
                <span>Aulas assistidas</span>
                <strong>${formatarAulasAssistidas(dashboard)}</strong>
              </div>
            </div>
          </article>

          <article class="card frequencia-bio-card">
            <h3>Última validação</h3>

            <div class="last-bio-box">
              <span class="bio-icon">◉</span>
              ${ultimoRegistroBiometrico
                ? `<strong>${escaparHtml(ultimoRegistroBiometrico.status)}</strong><p>${escaparHtml(ultimoRegistroBiometrico.disciplina)} • ${escaparHtml(ultimoRegistroBiometrico.data)} • ${escaparHtml(ultimoRegistroBiometrico.horario)}</p>`
                : `<strong>Nenhuma validação recente</strong><p>Quando usar biometria, o registro aparecerá aqui.</p>`}
            </div>

            <button class="outline-btn" id="btnIrChamada">
              Ir para chamada facial
            </button>
          </article>
        </aside>
      </section>
    </div>
  `;
}

function montarOpcoesDisciplina(registros) {
  const disciplinas = [...new Set(registros.map(registro => registro.disciplina).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  return `
    <option value="todas">Todas as disciplinas</option>
    ${disciplinas.map(disciplina => `
      <option value="${escaparHtml(disciplina)}">${escaparHtml(disciplina)}</option>
    `).join("")}
  `;
}

function configurarFiltrosFrequencia(registros) {
  const disciplinaSelect = document.getElementById("filtroDisciplinaFrequencia");
  const statusSelect = document.getElementById("filtroStatusFrequencia");
  const registroSelect = document.getElementById("filtroRegistroFrequencia");
  const tbody = document.getElementById("frequenciaTabelaBody");

  if (!disciplinaSelect || !statusSelect || !registroSelect || !tbody) return;

  const atualizarTabela = () => {
    const disciplina = disciplinaSelect.value;
    const status = statusSelect.value;
    const registro = registroSelect.value;

    const filtrados = registros.filter(item => {
      const passaDisciplina = disciplina === "todas" || item.disciplina === disciplina;
      const passaStatus = status === "todos" || item.tipo === status;
      const passaRegistro = registro === "todos" || item.registroTipo === registro;

      return passaDisciplina && passaStatus && passaRegistro;
    });

    tbody.innerHTML = filtrados.length
      ? filtrados.map(linha => linhaFrequencia(linha)).join("")
      : linhaVazia("Nenhum registro encontrado para os filtros selecionados.");
  };

  disciplinaSelect.addEventListener("change", atualizarTabela);
  statusSelect.addEventListener("change", atualizarTabela);
  registroSelect.addEventListener("change", atualizarTabela);
}

function aplicarDisciplinaPendente() {
  const disciplinaPendente = sessionStorage.getItem("alunoDisciplinaBuscaPendente");
  if (!disciplinaPendente) return;

  sessionStorage.removeItem("alunoDisciplinaBuscaPendente");

  const select = document.getElementById("filtroDisciplinaFrequencia");
  if (!select) return;

  const opcao = [...select.options].find(item =>
    normalizarTextoBusca(item.value) === normalizarTextoBusca(disciplinaPendente)
  );

  if (!opcao) return;

  select.value = opcao.value;
  select.dispatchEvent(new Event("change"));
  select.closest(".frequencia-table-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function normalizarTextoBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cardResumo(titulo, valor, detalhe, tipo) {
  return `
    <article class="card frequencia-card frequencia-card--${tipo}">
      <span>${escaparHtml(titulo)}</span>
      <strong>${escaparHtml(valor)}</strong>
      <small>${escaparHtml(detalhe)}</small>
    </article>
  `;
}

function linhaFrequencia(registro) {
  return `
    <tr>
      <td><strong>${escaparHtml(registro.data)}</strong></td>
      <td>${escaparHtml(registro.disciplina)}</td>
      <td>${escaparHtml(registro.professor)}</td>
      <td>${escaparHtml(registro.horario)}</td>
      <td>
        <span class="freq-status freq-status--${escaparHtml(registro.tipo)}">
          ${escaparHtml(registro.status)}
        </span>
      </td>
      <td>${escaparHtml(registro.registro)}</td>
    </tr>
  `;
}

function linhaVazia(mensagem) {
  return `
    <tr>
      <td colspan="6" class="frequencia-empty">
        ${escaparHtml(mensagem)}
      </td>
    </tr>
  `;
}

function configurarAtalhoChamada() {
  const btn = document.getElementById("btnIrChamada");

  if (!btn) return;

  btn.addEventListener("click", () => {
    const botaoChamada = document.querySelector('.sidebar__item[data-page="chamada"]');

    if (botaoChamada) {
      botaoChamada.click();
    }
  });
}

function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || null;
  } catch (erro) {
    console.error("Erro ao ler usuário logado:", erro);
    return null;
  }
}

function montarDashboardFallback() {
  return {
    frequencia: 0,
    presencas: 0,
    faltas: 0,
    atrasos: 0,
    aulasAssistidas: 0,
    totalAulas: 0,
    faltasMes: 0,
    risco: "baixo"
  };
}

function normalizarDashboard(dados = {}) {
  const fallback = montarDashboardFallback();

  return {
    frequencia: numeroValido(dados.frequencia, fallback.frequencia),
    presencas: inteiroValido(dados.presencas, fallback.presencas),
    faltas: inteiroValido(dados.faltas, fallback.faltas),
    atrasos: inteiroValido(dados.atrasos, fallback.atrasos),
    aulasAssistidas: inteiroValido(dados.aulasAssistidas, fallback.aulasAssistidas),
    totalAulas: inteiroValido(dados.totalAulas, fallback.totalAulas),
    faltasMes: inteiroValido(dados.faltasMes, dados.faltas ?? fallback.faltasMes),
    risco: dados.risco ?? fallback.risco
  };
}

function normalizarRegistros(historico) {
  const lista = Array.isArray(historico) ? historico : [];

  return lista
    .map(item => {
      const statusOriginal = item.status ?? item.situacao ?? item.tipoStatus ?? "presente";
      const status = formatarStatus(statusOriginal);
      const tipo = tipoStatus(statusOriginal);
      const registro = formatarRegistro(item.metodo ?? item.registro ?? item.tipoRegistro);

      return {
        data: formatarData(item.data ?? item.dataAula ?? item.dia ?? item.dataPresenca),
        dataOrdenacao: normalizarDataOrdenacao(item.data ?? item.dataAula ?? item.dia ?? item.dataPresenca),
        disciplina: item.disciplina ?? item.nomeDisciplina ?? item.unidadeCurricular ?? "Disciplina não informada",
        professor: item.professor ?? item.nomeProfessor ?? item.docente ?? "Professor não informado",
        horario: formatarHorario(item.horario ?? item.hora ?? item.horaRegistro ?? item.horaInicio),
        status,
        registro,
        registroTipo: tipoRegistro(registro),
        tipo
      };
    })
    .sort((a, b) => b.dataOrdenacao - a.dataOrdenacao);
}

function tipoStatus(status) {
  const valor = String(status || "").toLowerCase();

  if (valor.includes("atras")) return "warn";
  if (valor.includes("ausente") || valor.includes("falta")) return "danger";
  return "ok";
}

function formatarStatus(status) {
  const valor = String(status || "").toLowerCase();

  if (valor.includes("atras")) return "Atraso";
  if (valor.includes("ausente") || valor.includes("falta")) return "Falta";
  return "Presente";
}

function formatarRegistro(metodo) {
  const valor = String(metodo || "").toLowerCase();

  if (valor.includes("bio")) return "Biometria facial";
  if (valor.includes("manual")) return "Manual";
  if (!valor || valor === "null" || valor === "undefined") return "Sem registro";

  return String(metodo);
}

function tipoRegistro(registro) {
  const valor = String(registro || "").toLowerCase();

  if (valor.includes("bio")) return "biometria";
  if (valor.includes("manual")) return "manual";
  if (valor.includes("sem")) return "sem-registro";

  return "todos";
}

function formatarData(valor) {
  if (!valor) return "--";

  const data = new Date(valor);

  if (!Number.isNaN(data.getTime())) {
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short"
    }).replace(".", "").toUpperCase();
  }

  return String(valor);
}

function normalizarDataOrdenacao(valor) {
  if (!valor) return 0;

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? 0 : data.getTime();
}

function formatarHorario(valor) {
  if (!valor) return "--";

  return String(valor).slice(0, 5);
}

function formatarPercentual(valor) {
  return `${numeroValido(valor, 0).toFixed(1).replace(".0", "")}%`;
}

function formatarAulasAssistidas(dashboard) {
  const assistidas = inteiroValido(dashboard.aulasAssistidas, 0);
  const total = inteiroValido(dashboard.totalAulas, 0);

  if (total <= 0) return String(assistidas);

  return `${assistidas}/${total}`;
}

function textoSituacao(risco) {
  const valor = String(risco || "").toLowerCase();

  if (valor === "alto") return "Crítico";
  if (valor === "medio" || valor === "médio") return "Atenção";
  return "Regular";
}

function classeStatus(risco) {
  const valor = String(risco || "").toLowerCase();

  if (valor === "alto") return "status-danger";
  if (valor === "medio" || valor === "médio") return "status-warn";
  return "status-good";
}

function mensagemSituacao(frequencia) {
  const valor = numeroValido(frequencia, 0);

  if (valor < 50) {
    return "Sua frequência está crítica. Procure o professor ou a coordenação para regularizar sua situação.";
  }

  if (valor < 75) {
    return "Sua frequência está abaixo do mínimo exigido. Acompanhe seus registros com atenção.";
  }

  if (valor === 75) {
    return "Sua frequência está exatamente no limite mínimo. Evite novas faltas.";
  }

  return "Sua frequência está dentro do mínimo exigido. Continue acompanhando seus registros.";
}

function numeroValido(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function inteiroValido(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : fallback;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
