import { marcarMenuAtivo, getConteudoPrincipal } from "../../../core/spa.js";
import { request } from "../../../core/api.js";

let frequenciaTurmasCache = [];

export async function abrirDashboard(elemento = null) {
  if (elemento) {
    marcarMenuAtivo(elemento);
  }

  const conteudo = getConteudoPrincipal();

  conteudo.innerHTML = `
  <section class="dashboard-page">

    <section class="cards dashboard-cards">
      <div class="card destaque">
        <span>ALUNOS EM RISCO</span>
        <h2 id="alunosRisco">0</h2>
        <small>Alertas ativos</small>
      </div>

      <div class="card">
        <span>OCORRÊNCIAS PENDENTES</span>
        <h2 id="ocorrenciasPendentes">0</h2>
        <a href="#" id="linkOcorrencias">VER AGORA →</a>
      </div>

      <div class="card">
        <span>FREQUÊNCIA GLOBAL</span>
        <h2 id="frequenciaGlobal">0%</h2>

        <div class="barra-progresso">
          <div id="barraFrequencia"></div>
        </div>
      </div>

      <div class="card">
        <span>EM ANÁLISE</span>
        <h2 id="ocorrenciasEmAnalise">0</h2>
        <small>Em acompanhamento</small>
      </div>
    </section>

    <section class="painel-institucional">
      <div class="painel-card">
        <span>USUÁRIOS ATIVOS</span>
        <strong id="usuariosAtivos">0</strong>
      </div>

      <div class="painel-card">
        <span>PROFESSORES ATIVOS</span>
        <strong id="professoresAtivos">0</strong>
      </div>

      <div class="painel-card">
        <span>ALUNOS ATIVOS</span>
        <strong id="alunosAtivos">0</strong>
      </div>

      <div class="painel-card">
        <span>TURMAS ATIVAS</span>
        <strong id="turmasAtivas">0</strong>
      </div>
      
      <div class="painel-card">
        <span>CHAMADAS ABERTAS</span>
        <strong id="chamadasAbertas">0</strong>
      </div>
    </section>

    <section class="dashboard-main-grid">

      <div class="dashboard-left">

        <section class="grafico-toolbar">
          <select id="tipoDesempenho">
            <option value="turma">Desempenho por turma</option>
            <option value="aluno">Desempenho por aluno</option>
            <option value="professor">Desempenho por professor</option>
          </select>

          <select id="indicadorDesempenho">
            <option value="todos">Todos</option>
            <option value="presenca">Presença</option>
            <option value="faltas">Faltas</option>
            <option value="atrasos">Atrasos</option>
          </select>

          <select id="filtroTurma">
            <option value="">Todas as turmas</option>
          </select>
        </section>

        <section class="grafico-card">
          <div class="grafico-topo">
            <div class="grafico-legenda-item presencas">
              <span></span> Presenças
            </div>

            <div class="grafico-legenda-item atrasos">
              <span></span> Atrasos
            </div>

            <div class="grafico-legenda-item faltas">
              <span></span> Faltas
            </div>
          </div>

          <div id="graficoFrequenciaTurmas" class="grafico-frequencia">
            <p class="atividade-vazia">Carregando gráfico...</p>
          </div>
        </section>

      </div>

      <aside class="dashboard-right">

        <section class="atividades-card">
          <div class="atividades-header">
            <h2>Atividades Recentes</h2>
          </div>

          <div id="listaAtividades"></div>
        </section>

        <section class="dashboard-acoes">
          <button id="btnAtalhoOcorrencias">
            💬
            <span>OCORRÊNCIAS</span>
          </button>

          <button id="btnAtalhoCadastrarAluno">
            👤
            <span>CADASTRAR USUÁRIO</span>
          </button>
        </section>

      </aside>

    </section>

  </section>
`;

  configurarAtalhosDashboard();

  await carregarDashboard();
}

async function carregarDashboard() {
  try {
    const data = await request("/gestor/dashboard");
    await carregarResumoInstitucional();

    setTexto("alunosRisco", data.alunosRisco ?? 0);
    setTexto("ocorrenciasPendentes", data.ocorrenciasPendentes ?? 0);
    setTexto("frequenciaGlobal", `${data.frequenciaGlobal ?? 0}%`);
    setTexto("ocorrenciasEmAnalise", data.ocorrenciasEmAnalise ?? 0);

    const barraFrequencia = document.getElementById("barraFrequencia");

    if (barraFrequencia) {
      barraFrequencia.style.width = `${data.frequenciaGlobal ?? 0}%`;
    }

    renderizarAlertasNotificacao(data.alertasEvasao || []);
    renderizarAtividades(data.atividadesRecentes || []);

    frequenciaTurmasCache = data.frequenciaTurmas || [];

    preencherFiltroTurmas(frequenciaTurmasCache);
    configurarFiltrosDesempenho();

    await carregarGraficoDesempenho();

  } catch (error) {
    console.error(error);
    alert("Erro ao carregar dashboard");
  }
}

async function carregarResumoInstitucional() {
  try {
    const resumo = await request("/gestor/dashboard/resumo-institucional");

    setTexto("usuariosAtivos", resumo.usuariosAtivos ?? 0);
    setTexto("professoresAtivos", resumo.professoresAtivos ?? 0);
    setTexto("alunosAtivos", resumo.alunosAtivos ?? 0);
    setTexto("turmasAtivas", resumo.turmasAtivas ?? 0);
    setTexto("baixaFrequencia", resumo.baixaFrequencia ?? 0);
    setTexto("chamadasAbertas", resumo.chamadasAbertas ?? 0);

  } catch (error) {
    console.error("Erro ao carregar resumo institucional:", error);
  }
}

function configurarFiltrosDesempenho() {
  const tipoSelect = document.getElementById("tipoDesempenho");
  const indicadorSelect = document.getElementById("indicadorDesempenho");
  const turmaSelect = document.getElementById("filtroTurma");

  tipoSelect?.addEventListener("change", () => {
    atualizarIndicadoresDisponiveis();
    carregarGraficoDesempenho();
  });

  indicadorSelect?.addEventListener("change", carregarGraficoDesempenho);
  turmaSelect?.addEventListener("change", carregarGraficoDesempenho);

  atualizarIndicadoresDisponiveis();
}

async function carregarGraficoDesempenho() {
  const tipo =
    document.getElementById("tipoDesempenho")?.value ?? "turma";

  const indicador =
    document.getElementById("indicadorDesempenho")?.value ?? "todos";

  const turmaId =
    document.getElementById("filtroTurma")?.value ?? "";

  if (indicador === "todos" && tipo !== "professor") {
    await carregarGraficoTodosIndicadores(tipo, turmaId);
    return;
  }

  let endpoint =
    `/gestor/dashboard/desempenho?tipo=${tipo}&indicador=${indicador}`;

  if (tipo === "aluno" && turmaId) {
    endpoint += `&turmaId=${turmaId}`;
  }

  try {
    const dados = await request(endpoint);
    renderizarGraficoDesempenho(dados || [], indicador);
  } catch (error) {
    console.error(error);
    const grafico = document.getElementById("graficoFrequenciaTurmas");

    if (grafico) {
      grafico.innerHTML = `
        <p class="atividade-vazia">
          Erro ao carregar gráfico.
        </p>
      `;
    }
  }
}

async function carregarGraficoTodosIndicadores(tipo, turmaId) {
  try {
    let endpointPresenca =
      `/gestor/dashboard/desempenho?tipo=${tipo}&indicador=presenca`;

    let endpointFaltas =
      `/gestor/dashboard/desempenho?tipo=${tipo}&indicador=faltas`;

    let endpointAtrasos =
      `/gestor/dashboard/desempenho?tipo=${tipo}&indicador=atrasos`;

    if (tipo === "aluno" && turmaId) {
      endpointPresenca += `&turmaId=${turmaId}`;
      endpointFaltas += `&turmaId=${turmaId}`;
      endpointAtrasos += `&turmaId=${turmaId}`;
    }

    const [presencas, faltas, atrasos] = await Promise.all([
      request(endpointPresenca),
      request(endpointFaltas),
      request(endpointAtrasos)
    ]);

    const dadosAgrupados = agruparIndicadoresGrafico(
      presencas || [],
      faltas || [],
      atrasos || []
    );

    renderizarGraficoTodos(dadosAgrupados);

  } catch (error) {
    console.error(error);

    const grafico = document.getElementById("graficoFrequenciaTurmas");

    if (grafico) {
      grafico.innerHTML = `
        <p class="atividade-vazia">
          Erro ao carregar gráfico.
        </p>
      `;
    }
  }
}

function agruparIndicadoresGrafico(presencas, faltas, atrasos) {
  const mapa = new Map();

  presencas.forEach(item => {
    mapa.set(item.label, {
      label: item.label,
      presenca: Number(item.valor ?? 0),
      faltas: 0,
      atrasos: 0
    });
  });

  faltas.forEach(item => {
    const atual = mapa.get(item.label) || {
      label: item.label,
      presenca: 0,
      faltas: 0,
      atrasos: 0
    };

    atual.faltas = Number(item.valor ?? 0);
    mapa.set(item.label, atual);
  });

  atrasos.forEach(item => {
    const atual = mapa.get(item.label) || {
      label: item.label,
      presenca: 0,
      faltas: 0,
      atrasos: 0
    };

    atual.atrasos = Number(item.valor ?? 0);
    mapa.set(item.label, atual);
  });

  return Array.from(mapa.values());
}

function renderizarGraficoTodos(dados) {
  const grafico = document.getElementById("graficoFrequenciaTurmas");

  if (!grafico) return;

  if (!dados.length) {
    grafico.innerHTML = `
      <p class="atividade-vazia">
        Nenhum dado encontrado.
      </p>
    `;
    return;
  }

  grafico.innerHTML = `
    <div class="grafico-escala">
      <span>100</span>
      <span>80</span>
      <span>60</span>
      <span>40</span>
      <span>20</span>
      <span>0</span>
    </div>

    <div class="grafico-area">
      <div class="linha"></div>
      <div class="linha"></div>
      <div class="linha"></div>
      <div class="linha"></div>
      <div class="linha"></div>
      <div class="linha"></div>

      <div class="grafico-barras grafico-todos">
        ${dados.map(item => `
          <div class="grupo-barra">
            <div class="barras">
              <div
                class="barra presencas"
                style="height: ${Math.max(item.presenca, 4)}%"
                title="Presença: ${item.presenca.toFixed(1)}%"
              ></div>

              <div
                class="barra atrasos"
                style="height: ${Math.max(item.atrasos, 4)}%"
                title="Atrasos: ${item.atrasos.toFixed(1)}"
              ></div>

              <div
                class="barra faltas"
                style="height: ${Math.max(item.faltas, 4)}%"
                title="Faltas: ${item.faltas.toFixed(1)}"
              ></div>
            </div>

            <strong title="${item.label}">
              ${limitarTexto(item.label, 14)}
            </strong>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function preencherFiltroTurmas(turmas) {
  const select = document.getElementById("filtroTurma");

  if (!select) return;

  select.innerHTML = `
    <option value="">Todas as turmas</option>
    ${turmas.map(turma => {
      const id = turma.turmaId ?? turma.id;
      const nome = turma.turma ?? turma.nome ?? "Turma";

      return `
        <option value="${id}">
          ${nome}
        </option>
      `;
    }).join("")}
  `;
}

function renderizarGraficoDesempenho(dados, indicador) {
  const grafico = document.getElementById("graficoFrequenciaTurmas");

  if (!grafico) return;

  if (!dados.length) {
    grafico.innerHTML = `
      <p class="atividade-vazia">
        Nenhum dado encontrado.
      </p>
    `;
    return;
  }

  const maiorValor = Math.max(
    ...dados.map(item => Number(item.valor ?? 0)),
    1
  );

  grafico.innerHTML = `
    <div class="grafico-escala">
      <span>${formatarValorGrafico(maiorValor)}</span>
      <span>${formatarValorGrafico(maiorValor * 0.8)}</span>
      <span>${formatarValorGrafico(maiorValor * 0.6)}</span>
      <span>${formatarValorGrafico(maiorValor * 0.4)}</span>
      <span>${formatarValorGrafico(maiorValor * 0.2)}</span>
      <span>0</span>
    </div>

    <div class="grafico-area">
      <div class="linha"></div>
      <div class="linha"></div>
      <div class="linha"></div>
      <div class="linha"></div>
      <div class="linha"></div>
      <div class="linha"></div>

      <div class="grafico-barras desempenho-unico">
        ${dados.map(item => {
          const valor = Number(item.valor ?? 0);
          const altura = maiorValor === 0 ? 0 : (valor / maiorValor) * 100;

          return `
            <div class="grupo-barra">
              <div class="barras">
                <div
                  class="barra ${classeIndicador(indicador)}"
                  style="height: ${Math.max(altura, 4)}%"
                  title="${item.label}: ${formatarValorGrafico(valor)}"
                ></div>
              </div>

              <strong title="${item.label}">
                ${limitarTexto(item.label, 14)}
              </strong>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function classeIndicador(indicador) {
  if (indicador === "presenca") return "presencas";
  if (indicador === "faltas") return "faltas";
  if (indicador === "atrasos") return "atrasos";

  return "neutro";
}

function atualizarIndicadoresDisponiveis() {
  const tipo = document.getElementById("tipoDesempenho")?.value;
  const indicadorSelect = document.getElementById("indicadorDesempenho");
  const turmaSelect = document.getElementById("filtroTurma");

  if (!indicadorSelect) return;

  if (tipo === "professor") {
    indicadorSelect.innerHTML = `
      <option value="aulas">Aulas dadas</option>
      <option value="turmas">Turmas vinculadas</option>
      <option value="ocorrencias">Ocorrências registradas</option>
    `;

    if (turmaSelect) {
      turmaSelect.disabled = true;
      turmaSelect.value = "";
    }

    return;
  }

  indicadorSelect.innerHTML = `
    <option value="todos">Todos</option>
    <option value="presenca">Presença</option>
    <option value="faltas">Faltas</option>
    <option value="atrasos">Atrasos</option>
  `;

  if (turmaSelect) {
    turmaSelect.disabled = tipo !== "aluno";
  }
}

function formatarValorGrafico(valor) {
  const numero = Number(valor ?? 0);

  if (Number.isInteger(numero)) {
    return String(numero);
  }

  return numero.toFixed(1);
}

function configurarAtalhosDashboard() {
  document
    .getElementById("linkOcorrencias")
    ?.addEventListener("click", event => {
      event.preventDefault();
      document.getElementById("menuOcorrencias")?.click();
    });

  document
    .getElementById("btnAtalhoOcorrencias")
    ?.addEventListener("click", () => {
      document.getElementById("menuOcorrencias")?.click();
    });

  document
    .getElementById("btnAtalhoCadastrarAluno")
    ?.addEventListener("click", () => {
      document.getElementById("menuAlunos")?.click();
    });
}

function setTexto(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor;
  }
}

function renderizarAtividades(atividades) {
  const lista = document.getElementById("listaAtividades");

  if (!lista) return;

  if (atividades.length === 0) {
    lista.innerHTML = `
      <p class="atividade-vazia">
        Nenhuma atividade encontrada.
      </p>
    `;
    return;
  }

  lista.innerHTML = atividades.map(atividade => `
    <div class="atividade-item">
      <div class="atividade-bolinha"></div>

      <div>
        <span>${formatarDataAtividade(atividade.data)}</span>
        <strong>${atividade.titulo ?? "Atividade"}</strong>
        <p>${limitarTexto(atividade.descricao ?? "", 85)}</p>
      </div>
    </div>
  `).join("");
}

function renderizarAlertasNotificacao(alertas) {
  const botaoNotificacao = document.querySelector(".notificacao");

  if (!botaoNotificacao) return;

  botaoNotificacao.innerHTML = `
    🔔
    ${
      alertas.length
        ? `<span class="notificacao-badge">${alertas.length}</span>`
        : ""
    }
  `;

  botaoNotificacao.onclick = event => {
    event.stopPropagation();
    abrirDropdownAlertas(alertas);
  };
}

function abrirDropdownAlertas(alertas) {
  document.querySelector(".alertas-dropdown")?.remove();

  const dropdown = document.createElement("div");
  dropdown.className = "alertas-dropdown";

  if (!alertas.length) {
    dropdown.innerHTML = `
      <div class="alertas-dropdown-header">
        <strong>Alertas de evasão</strong>
      </div>

      <p class="alerta-dropdown-vazio">
        Nenhum aluno em risco no momento.
      </p>
    `;
  } else {
    dropdown.innerHTML = `
      <div class="alertas-dropdown-header">
        <strong>Alertas de evasão</strong>
        <span>${alertas.length}</span>
      </div>

      ${alertas.map(alerta => {
        const frequencia = Number(alerta.frequencia ?? 0);

        return `
          <div class="alerta-dropdown-item">
            <div>
              <strong>${alerta.nomeAluno ?? "Aluno"} em risco</strong>
              <p>Frequência: ${frequencia.toFixed(1)}%</p>
            </div>

            <button type="button">Notificar</button>
          </div>
        `;
      }).join("")}
    `;
  }

  document.body.appendChild(dropdown);

  const botao = document.querySelector(".notificacao");
  const rect = botao.getBoundingClientRect();

  dropdown.style.top = `${rect.bottom + 10}px`;
  dropdown.style.right = `${window.innerWidth - rect.right}px`;

  setTimeout(() => {
    document.addEventListener("click", fecharDropdownAlertas);
  }, 0);
}

function fecharDropdownAlertas(event) {
  const dropdown = document.querySelector(".alertas-dropdown");
  const botao = document.querySelector(".notificacao");

  if (
    dropdown &&
    !dropdown.contains(event.target) &&
    !botao.contains(event.target)
  ) {
    dropdown.remove();
    document.removeEventListener("click", fecharDropdownAlertas);
  }
}

function formatarDataAtividade(data) {
  if (!data) return "Agora";

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return "Agora";
  }

  return dataObj.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function limitarTexto(texto, limite = 85) {
  if (!texto) return "";

  if (texto.length <= limite) {
    return texto;
  }

  return `${texto.substring(0, limite)}...`;
}