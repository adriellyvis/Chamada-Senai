import { marcarMenuAtivo, getConteudoPrincipal } from "../../../core/spa.js";
import { request } from "../../../core/api.js";
import { definirDadosNotificacoesGestor } from "../components/notificacoes-gestor.js";

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
            <span class="material-symbols-rounded" aria-hidden="true">forum</span>
            <span>OCORRÊNCIAS</span>
          </button>

          <button id="btnAtalhoCadastrarAluno">
            <span class="material-symbols-rounded" aria-hidden="true">person_add</span>
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

    definirDadosNotificacoesGestor(data);
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

  const escala = calcularEscalaGrafico(
    dados.flatMap(item => [
      Number(item.presenca ?? 0),
      Number(item.atrasos ?? 0),
      Number(item.faltas ?? 0)
    ])
  );

  const larguraMinima = Math.max(660, dados.length * 160);

  grafico.innerHTML = `
    ${montarEscalaGrafico(escala.marcas)}

    <div class="grafico-area">
      <div
        class="grafico-plotagem"
        style="--largura-grafico: ${larguraMinima}px"
      >
        ${montarLinhasGrafico()}

        <div class="grafico-barras grafico-todos">
          ${dados.map(item => {
            const labelCompleta = escaparHtmlGrafico(item.label ?? "Turma");
            const labelCurta = escaparHtmlGrafico(
              limitarTexto(item.label ?? "Turma", 18)
            );

            return `
              <div class="grupo-barra">
                <div class="barras">
                  ${montarBarraGrafico({
                    classe: "presencas",
                    valor: Number(item.presenca ?? 0),
                    maximo: escala.maximo,
                    rotulo: "Presenças",
                    sufixo: "%"
                  })}

                  ${montarBarraGrafico({
                    classe: "atrasos",
                    valor: Number(item.atrasos ?? 0),
                    maximo: escala.maximo,
                    rotulo: "Atrasos"
                  })}

                  ${montarBarraGrafico({
                    classe: "faltas",
                    valor: Number(item.faltas ?? 0),
                    maximo: escala.maximo,
                    rotulo: "Faltas"
                  })}
                </div>

                <strong title="${labelCompleta}">
                  ${labelCurta}
                </strong>
              </div>
            `;
          }).join("")}
        </div>
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

  const valores = dados.map(item => Number(item.valor ?? 0));
  const escala = calcularEscalaGrafico(valores);
  const larguraMinima = Math.max(660, dados.length * 150);
  const sufixo = indicador === "presenca" ? "%" : "";
  const rotulo = rotuloIndicador(indicador);

  grafico.innerHTML = `
    ${montarEscalaGrafico(escala.marcas)}

    <div class="grafico-area">
      <div
        class="grafico-plotagem"
        style="--largura-grafico: ${larguraMinima}px"
      >
        ${montarLinhasGrafico()}

        <div class="grafico-barras desempenho-unico">
          ${dados.map(item => {
            const valor = Number(item.valor ?? 0);
            const labelCompleta = escaparHtmlGrafico(item.label ?? "Item");
            const labelCurta = escaparHtmlGrafico(
              limitarTexto(item.label ?? "Item", 18)
            );

            return `
              <div class="grupo-barra">
                <div class="barras">
                  ${montarBarraGrafico({
                    classe: classeIndicador(indicador),
                    valor,
                    maximo: escala.maximo,
                    rotulo,
                    sufixo
                  })}
                </div>

                <strong title="${labelCompleta}">
                  ${labelCurta}
                </strong>
              </div>
            `;
          }).join("")}
        </div>
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


function calcularEscalaGrafico(valores) {
  const valoresValidos = valores
    .map(valor => Number(valor ?? 0))
    .filter(valor => Number.isFinite(valor) && valor >= 0);

  const maiorValor = Math.max(...valoresValidos, 0);

  if (maiorValor === 0) {
    return {
      maximo: 100,
      marcas: [100, 80, 60, 40, 20, 0]
    };
  }

  const quantidadeIntervalos = 5;
  const valorComFolga = maiorValor * 1.1;
  const passoBruto = valorComFolga / quantidadeIntervalos;
  const ordemGrandeza = 10 ** Math.floor(Math.log10(passoBruto));
  const fracao = passoBruto / ordemGrandeza;

  let fracaoAjustada;

  if (fracao <= 1) {
    fracaoAjustada = 1;
  } else if (fracao <= 2) {
    fracaoAjustada = 2;
  } else if (fracao <= 2.5) {
    fracaoAjustada = 2.5;
  } else if (fracao <= 5) {
    fracaoAjustada = 5;
  } else {
    fracaoAjustada = 10;
  }

  const passo = fracaoAjustada * ordemGrandeza;
  const maximo = Math.ceil(valorComFolga / passo) * passo;
  const marcas = Array.from(
    { length: quantidadeIntervalos + 1 },
    (_, indice) => maximo - passo * indice
  );

  return {
    maximo,
    marcas
  };
}

function montarEscalaGrafico(marcas) {
  const ultimoIndice = Math.max(marcas.length - 1, 1);

  return `
    <div class="grafico-escala" aria-hidden="true">
      <div class="grafico-escala-valores">
        ${marcas
          .map((marca, indice) => `
            <span style="top: ${(indice / ultimoIndice) * 100}%">
              ${formatarValorGrafico(marca)}
            </span>
          `)
          .join("")}
      </div>
    </div>
  `;
}

function montarLinhasGrafico() {
  return [0, 20, 40, 60, 80]
    .map(posicao => `
      <div
        class="linha"
        style="top: ${posicao}%"
        aria-hidden="true"
      ></div>
    `)
    .join("");
}

function montarBarraGrafico({
  classe,
  valor,
  maximo,
  rotulo,
  sufixo = ""
}) {
  const numero = Number(valor ?? 0);
  const alturaCalculada = maximo > 0
    ? (numero / maximo) * 100
    : 0;

  const alturaVisual = numero > 0
    ? Math.max(alturaCalculada, 1.5)
    : 0;

  const valorFormatado = `${formatarValorGrafico(numero)}${sufixo}`;
  const textoTooltip = `${rotulo}: ${valorFormatado}`;
  const textoSeguro = escaparHtmlGrafico(textoTooltip);

  return `
    <div
      class="barra-wrapper"
      style="height: ${alturaVisual}%"
      tabindex="0"
      aria-label="${textoSeguro}"
      title="${textoSeguro}"
    >
      <div class="barra ${classe}"></div>
      <span class="barra-tooltip" role="tooltip">
        ${textoSeguro}
      </span>
    </div>
  `;
}

function rotuloIndicador(indicador) {
  const rotulos = {
    presenca: "Presenças",
    faltas: "Faltas",
    atrasos: "Atrasos",
    aulas: "Aulas",
    turmas: "Turmas",
    ocorrencias: "Ocorrências"
  };

  return rotulos[indicador] ?? "Valor";
}

function escaparHtmlGrafico(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
