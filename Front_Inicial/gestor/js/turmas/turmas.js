import { request } from "../../../core/api.js";
import {marcarMenuAtivo, getConteudoPrincipal} from "../../../core/spa.js";

import {abrirModal,fecharModal} from "../../../core/modal.js";

let turmasCache = [];
let frequenciaTurmasCache = [];
let dashboardTurmasCache = {};

export async function abrirTurmas(elemento) {
  marcarMenuAtivo(elemento);

  const conteudo = getConteudoPrincipal();

  conteudo.innerHTML = `
    <section class="gestor-turmas-page">
      <div class="turmas-page-intro">
        <div>
          <span class="turmas-eyebrow">Supervisão acadêmica</span>
          <h2>Turmas</h2>
          <p>Acompanhe presença, alunos em alerta e a organização das turmas em um único painel.</p>
        </div>
      </div>

      <section class="turmas-resumo-grid" aria-label="Resumo das turmas">
        <article class="turmas-resumo-card">
          <span class="turmas-resumo-label">Turmas sob supervisão</span>
          <div class="turmas-resumo-linha">
            <strong id="turmasResumoAtivas">--</strong>
            <span class="turmas-resumo-icon is-blue material-symbols-rounded" aria-hidden="true">school</span>
          </div>
          <small>Turmas ativas no período</small>
        </article>

        <article class="turmas-resumo-card is-highlight">
          <span class="turmas-resumo-label">Precisam de apoio</span>
          <div class="turmas-resumo-linha">
            <strong id="turmasResumoApoio">--</strong>
            <span class="turmas-resumo-icon material-symbols-rounded" aria-hidden="true">warning</span>
          </div>
          <small>Com frequência crítica ou alunos em alerta</small>
        </article>

        <article class="turmas-resumo-card">
          <span class="turmas-resumo-label">Frequência global</span>
          <div class="turmas-resumo-linha">
            <strong id="turmasResumoFrequencia">--%</strong>
            <span class="turmas-resumo-icon is-green material-symbols-rounded" aria-hidden="true">person_check</span>
          </div>
          <small>Presença consolidada da instituição</small>
        </article>

        <article class="turmas-resumo-card">
          <span class="turmas-resumo-label">Ocorrências pendentes</span>
          <div class="turmas-resumo-linha">
            <strong id="turmasResumoOcorrencias">--</strong>
            <span class="turmas-resumo-icon is-amber material-symbols-rounded" aria-hidden="true">assignment_late</span>
          </div>
          <small>Casos aguardando acompanhamento</small>
        </article>
      </section>

      <div class="turmas-toolbar-novo">
        <div class="turmas-filtros-novo">
          <span class="turmas-filtro-titulo">
            <span class="material-symbols-rounded" aria-hidden="true">filter_alt</span>
            Filtrar turmas por:
          </span>

          <label class="turmas-select-wrap">
            <span class="sr-only">Prioridade</span>
            <select id="filtroPrioridadeTurmas">
              <option value="">Todas as prioridades</option>
              <option value="critica">Precisam de apoio</option>
              <option value="estavel">Situação estável</option>
              <option value="sem-dados">Sem histórico</option>
            </select>
          </label>

          <label class="turmas-select-wrap">
            <span class="sr-only">Status</span>
            <select id="filtroStatusTurmas">
              <option value="">Todos os status</option>
              <option value="ativa">Ativas</option>
              <option value="inativa">Inativas</option>
            </select>
          </label>
        </div>

        <button id="btnCadastrarTurma" class="turmas-btn-cadastrar" type="button">
          <span class="material-symbols-rounded" aria-hidden="true">add_box</span>
          Cadastrar nova turma
        </button>
      </div>

      <section class="turmas-conteudo-grid">
        <div id="listaTurmasGestor" class="turmas-lista-nova">
          <div class="turmas-loading-card">
            <span class="material-symbols-rounded" aria-hidden="true">progress_activity</span>
            Carregando turmas...
          </div>
        </div>

        <aside id="painelPrioridadeTurmas" class="turmas-painel-prioridade">
          <div class="turmas-painel-vazio">
            <span class="material-symbols-rounded" aria-hidden="true">monitoring</span>
            <strong>Prioridade de supervisão</strong>
            <p>Carregando o panorama das turmas...</p>
          </div>
        </aside>
      </section>
    </section>
  `;

  document
    .getElementById("btnCadastrarTurma")
    ?.addEventListener("click", abrirFormularioTurma);

  document
    .getElementById("filtroPrioridadeTurmas")
    ?.addEventListener("change", aplicarFiltrosTurmas);

  document
    .getElementById("filtroStatusTurmas")
    ?.addEventListener("change", aplicarFiltrosTurmas);

  await carregarTurmas();
}

async function carregarTurmas() {
  try {
    const [turmasResultado, dashboardResultado] = await Promise.all([
      request("/gestor/turmas"),
      request("/gestor/dashboard").catch(error => {
        console.warn("Não foi possível carregar os indicadores das turmas:", error);
        return {};
      })
    ]);

    turmasCache = Array.isArray(turmasResultado) ? turmasResultado : [];
    dashboardTurmasCache = dashboardResultado || {};
    frequenciaTurmasCache = Array.isArray(dashboardTurmasCache.frequenciaTurmas)
      ? dashboardTurmasCache.frequenciaTurmas
      : [];

    atualizarResumoTurmas();
    aplicarFiltrosTurmas();
    renderizarPainelPrioridadeTurmas();
  } catch (error) {
    console.error(error);

    const lista = document.getElementById("listaTurmasGestor");
    if (lista) {
      lista.innerHTML = `
        <div class="turmas-estado-vazio is-error">
          <span class="material-symbols-rounded" aria-hidden="true">error</span>
          <strong>Não foi possível carregar as turmas</strong>
          <p>${escaparHtml(error?.message || "Tente novamente em alguns instantes.")}</p>
        </div>
      `;
    }
  }
}

function atualizarResumoTurmas() {
  const turmasAtivas = turmasCache.filter(turma => Boolean(turma.ativa)).length;
  const turmasApoio = turmasCache.filter(turma => {
    if (!turma.ativa) return false;
    const indicador = obterIndicadorFrequenciaTurma(turma);
    return indicador.alunosEmRisco > 0 || (indicador.temHistorico && indicador.frequencia < 75);
  }).length;

  definirTextoTurmas("turmasResumoAtivas", String(turmasAtivas));
  definirTextoTurmas("turmasResumoApoio", String(turmasApoio));
  definirTextoTurmas(
    "turmasResumoFrequencia",
    `${formatarPercentualTurma(dashboardTurmasCache.frequenciaGlobal)}%`
  );
  definirTextoTurmas(
    "turmasResumoOcorrencias",
    String(dashboardTurmasCache.ocorrenciasPendentes ?? 0)
  );
}

function aplicarFiltrosTurmas() {
  const prioridade = document.getElementById("filtroPrioridadeTurmas")?.value ?? "";
  const status = document.getElementById("filtroStatusTurmas")?.value ?? "";

  const filtradas = turmasCache.filter(turma => {
    const indicador = obterIndicadorFrequenciaTurma(turma);
    const classificacao = classificarTurma(indicador);

    const atendeStatus =
      !status ||
      (status === "ativa" && turma.ativa) ||
      (status === "inativa" && !turma.ativa);

    let atendePrioridade = true;

    if (prioridade === "critica") {
      atendePrioridade = classificacao.nivel === "critica" || classificacao.nivel === "atencao";
    } else if (prioridade === "estavel") {
      atendePrioridade = classificacao.nivel === "estavel";
    } else if (prioridade === "sem-dados") {
      atendePrioridade = classificacao.nivel === "sem-dados";
    }

    return atendeStatus && atendePrioridade;
  });

  renderizarTurmas(filtradas);
}

function renderizarTurmas(turmas) {
  const lista = document.getElementById("listaTurmasGestor");

  if (!lista) return;

  if (!turmas || turmas.length === 0) {
    lista.innerHTML = `
      <div class="turmas-estado-vazio">
        <span class="material-symbols-rounded" aria-hidden="true">filter_alt_off</span>
        <strong>Nenhuma turma encontrada</strong>
        <p>Altere os filtros ou cadastre uma nova turma.</p>
      </div>
    `;
    return;
  }

  const ordenadas = [...turmas].sort((a, b) => {
    const aInfo = obterIndicadorFrequenciaTurma(a);
    const bInfo = obterIndicadorFrequenciaTurma(b);
    return pontuacaoPrioridadeTurma(bInfo) - pontuacaoPrioridadeTurma(aInfo);
  });

  lista.innerHTML = ordenadas.map(turma => {
    const indicador = obterIndicadorFrequenciaTurma(turma);
    const classificacao = classificarTurma(indicador);
    const turno = obterTurnoTurma(turma.horarioInicio);
    const periodo = formatarPeriodoTurma(turma);
    const frequencia = indicador.temHistorico
      ? formatarPercentualTurma(indicador.frequencia)
      : "--";
    const barra = indicador.temHistorico
      ? Math.max(0, Math.min(100, Number(indicador.frequencia) || 0))
      : 0;
    const professor = turma.professor || "Professor não definido";

    return `
      <article class="turma-supervisao-card ${!turma.ativa ? "is-inactive" : ""}">
        <div class="turma-supervisao-topo">
          <div class="turma-supervisao-identidade">
            <div class="turma-supervisao-titulo-linha">
              <h3>${escaparHtml(turma.nome ?? "Turma")}</h3>
              <span class="turma-risco-badge ${classificacao.classe}">${classificacao.rotulo}</span>
              <span class="turma-turno-badge">${escaparHtml(turno)}</span>
            </div>
            <p>${escaparHtml(turma.descricao || "Turma cadastrada no PreZence")}</p>
          </div>

          <div class="turma-periodo-badge">
            <span>PERÍODO</span>
            <strong>${escaparHtml(periodo)}</strong>
          </div>
        </div>

        <div class="turma-supervisao-metricas">
          <div class="turma-metrica-bloco">
            <span class="turma-metrica-label">Frequência da turma</span>
            <div class="turma-frequencia-linha">
              <strong class="${classificacao.classe}">${frequencia}${frequencia === "--" ? "" : "%"}</strong>
              <small>${classificacao.rotulo}</small>
            </div>
            <div class="turma-progresso" aria-hidden="true">
              <span class="${classificacao.classe}" style="width:${barra}%"></span>
            </div>
          </div>

          <div class="turma-metrica-bloco">
            <span class="turma-metrica-label">Estrutura acadêmica</span>
            <div class="turma-estrutura-valores">
              <strong>${turma.totalDisciplinas ?? 0}</strong>
              <span>disciplinas</span>
            </div>
            <small>${turma.totalProfessores ?? 0} professor(es) • ${turma.totalAlunos ?? 0} aluno(s)</small>
          </div>

          <div class="turma-metrica-bloco">
            <span class="turma-metrica-label">Alunos em alerta</span>
            <div class="turma-alerta-linha">
              <strong>${indicador.alunosEmRisco}</strong>
              <span class="turma-alerta-selo ${indicador.alunosEmRisco > 0 ? "is-risk" : "is-ok"}">
                ${indicador.alunosEmRisco > 0 ? "Acompanhar" : "Estável"}
              </span>
            </div>
            <small>${indicador.temHistorico ? `${formatarPercentualTurma(indicador.percentualRisco)}% da turma em alerta` : "Sem histórico suficiente"}</small>
          </div>
        </div>

        <div class="turma-supervisao-rodape">
          <div class="turma-professor-resumo">
            <span class="turma-professor-avatar">${escaparHtml(obterIniciaisProfessor(professor))}</span>
            <div>
              <small>Professor(a) de referência</small>
              <strong>${escaparHtml(professor)}</strong>
            </div>
          </div>

          <div class="turma-acoes-novas">
            <button type="button" class="turma-btn-secundario" data-editar-turma="${turma.id}">
              <span class="material-symbols-rounded" aria-hidden="true">edit</span>
              Editar
            </button>
            <button type="button" class="turma-btn-secundario" data-horarios-turma="${turma.id}">
              <span class="material-symbols-rounded" aria-hidden="true">calendar_month</span>
              Horários
            </button>
            <button type="button" class="turma-btn-principal" data-detalhes-turma="${turma.id}">
              <span class="material-symbols-rounded" aria-hidden="true">analytics</span>
              Ver detalhes
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  adicionarEventosTabelaTurmas();
}

function renderizarPainelPrioridadeTurmas() {
  const painel = document.getElementById("painelPrioridadeTurmas");
  if (!painel) return;

  const candidatas = turmasCache
    .filter(turma => turma.ativa)
    .map(turma => ({
      turma,
      indicador: obterIndicadorFrequenciaTurma(turma)
    }))
    .sort((a, b) => pontuacaoPrioridadeTurma(b.indicador) - pontuacaoPrioridadeTurma(a.indicador));

  const prioridade = candidatas[0];

  if (!prioridade || pontuacaoPrioridadeTurma(prioridade.indicador) <= 0) {
    painel.innerHTML = `
      <div class="turmas-painel-vazio is-ok">
        <span class="material-symbols-rounded" aria-hidden="true">verified</span>
        <strong>Supervisão em dia</strong>
        <p>Nenhuma turma ativa apresenta alerta de frequência neste momento.</p>
      </div>
    `;
    return;
  }

  const { turma, indicador } = prioridade;
  const classificacao = classificarTurma(indicador);

  painel.innerHTML = `
    <div class="turmas-painel-header">
      <span class="material-symbols-rounded" aria-hidden="true">priority_high</span>
      <div>
        <strong>Prioridade de supervisão</strong>
        <p>Turma que merece atenção primeiro.</p>
      </div>
    </div>

    <div class="turmas-prioridade-card">
      <div class="turmas-prioridade-topo">
        <span class="turma-risco-badge ${classificacao.classe}">${classificacao.rotulo}</span>
        <small>${turma.ativa ? "Ativa" : "Inativa"}</small>
      </div>
      <h3>${escaparHtml(turma.nome ?? "Turma")}</h3>
      <p>${escaparHtml(turma.descricao || "Acompanhamento institucional recomendado.")}</p>

      <div class="turmas-prioridade-dados">
        <div>
          <span>Frequência</span>
          <strong>${indicador.temHistorico ? `${formatarPercentualTurma(indicador.frequencia)}%` : "--"}</strong>
        </div>
        <div>
          <span>Em alerta</span>
          <strong>${indicador.alunosEmRisco}</strong>
        </div>
      </div>

      <button type="button" data-detalhes-turma="${turma.id}" class="turmas-prioridade-acao">
        Analisar turma
        <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
      </button>
    </div>

    <div class="turmas-painel-atalhos">
      <span>Atalhos de gestão</span>
      <button type="button" data-horarios-turma="${turma.id}">
        <span class="material-symbols-rounded" aria-hidden="true">schedule</span>
        Horários
      </button>
      <button type="button" data-editar-turma="${turma.id}">
        <span class="material-symbols-rounded" aria-hidden="true">edit_note</span>
        Editar cadastro
      </button>
    </div>
  `;

  adicionarEventosTabelaTurmas();
}

function obterIndicadorFrequenciaTurma(turma) {
  const porId = frequenciaTurmasCache.find(item => Number(item.id) === Number(turma.id));
  const porNome = frequenciaTurmasCache.find(item =>
    String(item.turma ?? "").trim().toLowerCase() === String(turma.nome ?? "").trim().toLowerCase()
  );
  const indicador = porId || porNome || null;

  const frequencia = Number(indicador?.frequencia);
  const alunosEmRisco = Number(indicador?.alunosEmRisco ?? 0);
  const percentualRisco = Number(indicador?.percentualRisco ?? 0);

  return {
    temHistorico: indicador != null && Number.isFinite(frequencia),
    frequencia: Number.isFinite(frequencia) ? frequencia : 0,
    alunosEmRisco: Number.isFinite(alunosEmRisco) ? alunosEmRisco : 0,
    percentualRisco: Number.isFinite(percentualRisco) ? percentualRisco : 0
  };
}

function classificarTurma(indicador) {
  if (!indicador.temHistorico) {
    return { nivel: "sem-dados", rotulo: "Sem histórico", classe: "is-neutral" };
  }

  if (indicador.frequencia < 75 || indicador.percentualRisco >= 25) {
    return { nivel: "critica", rotulo: "Crítico", classe: "is-danger" };
  }

  if (indicador.frequencia < 85 || indicador.alunosEmRisco > 0) {
    return { nivel: "atencao", rotulo: "Atenção", classe: "is-warning" };
  }

  return { nivel: "estavel", rotulo: "Estável", classe: "is-success" };
}

function pontuacaoPrioridadeTurma(indicador) {
  if (!indicador.temHistorico) return 0;

  let pontos = 0;
  if (indicador.frequencia < 75) pontos += (75 - indicador.frequencia) * 3;
  else if (indicador.frequencia < 85) pontos += (85 - indicador.frequencia);

  pontos += indicador.alunosEmRisco * 12;
  pontos += indicador.percentualRisco;
  return pontos;
}

function obterTurnoTurma(horarioInicio) {
  if (!horarioInicio) return "Turno não informado";

  const hora = Number(String(horarioInicio).split(":")[0]);
  if (!Number.isFinite(hora)) return "Turno não informado";
  if (hora < 12) return "Matutino";
  if (hora < 18) return "Vespertino";
  return "Noturno";
}

function formatarPeriodoTurma(turma) {
  const inicio = turma.dataInicio ? new Date(`${turma.dataInicio}T00:00:00`) : null;
  const fim = turma.dataFimPrevista ? new Date(`${turma.dataFimPrevista}T00:00:00`) : null;

  if (inicio && !Number.isNaN(inicio.getTime()) && fim && !Number.isNaN(fim.getTime())) {
    return `${String(inicio.getMonth() + 1).padStart(2, "0")}/${inicio.getFullYear()} – ${String(fim.getMonth() + 1).padStart(2, "0")}/${fim.getFullYear()}`;
  }

  if (inicio && !Number.isNaN(inicio.getTime())) {
    return `${String(inicio.getMonth() + 1).padStart(2, "0")}/${inicio.getFullYear()}`;
  }

  return turma.ativa ? "Atual" : "Encerrado";
}

function formatarPercentualTurma(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "0";
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: numero % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  });
}

function obterIniciaisProfessor(nome) {
  if (!nome || nome === "Professor não definido") return "--";
  return String(nome)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte[0] || "")
    .join("")
    .toUpperCase();
}

function definirTextoTurmas(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function adicionarEventosTabelaTurmas() {
  document
    .querySelectorAll("[data-editar-turma]")
    .forEach(botao => {
      botao.onclick = () => {
        editarTurma(botao.dataset.editarTurma);
      };
    });

  document
    .querySelectorAll("[data-detalhes-turma]")
    .forEach(botao => {
      botao.onclick = () => {
        abrirDetalhesTurma(botao.dataset.detalhesTurma);
      };
    });

  document
    .querySelectorAll("[data-horarios-turma]")
    .forEach(botao => {
      botao.onclick = () => {
        abrirHorariosTurma(botao.dataset.horariosTurma);
      };
    });
}

async function abrirDetalhesTurma(id) {
  try {
    const turma = await request(`/gestor/turmas/${id}/detalhes`);

    abrirModal({
      titulo: `Detalhes da turma - ${turma.nome}`,

      conteudo: `
        <div class="detalhes-turma">
          <section class="detalhes-turma-resumo" aria-label="Resumo da turma">
            <div class="detalhes-turma-info">
              <span class="detalhes-turma-info-label">Nome da turma</span>
              <strong>${turma.nome ?? "-"}</strong>
            </div>

            <div class="detalhes-turma-info">
              <span class="detalhes-turma-info-label">Descrição</span>
              <p>${turma.descricao ?? "-"}</p>
            </div>

            <div class="detalhes-turma-info detalhes-turma-status">
              <span class="detalhes-turma-info-label">Status</span>
              <span class="detalhes-turma-status-badge ${turma.ativa ? "ativa" : "inativa"}">
                ${turma.ativa ? "Ativa" : "Inativa"}
              </span>
            </div>
          </section>

          <section class="detalhes-turma-secoes">
            <article class="detalhes-turma-secao">
              <div class="detalhes-turma-secao-cabecalho">
                <span class="detalhes-turma-secao-icone material-symbols-rounded" aria-hidden="true">school</span>
                <div class="detalhes-turma-secao-titulo">
                  <h3>Alunos</h3>
                </div>
                <span class="detalhes-turma-contagem">${turma.alunos?.length ?? 0}</span>
              </div>

              ${
                turma.alunos?.length
                  ? `<ul class="detalhes-turma-lista">
                      ${turma.alunos.map(aluno => `
                        <li class="detalhes-turma-item">
                          <span class="detalhes-turma-item-nome" title="${aluno.nome ?? "Aluno"}">${aluno.nome ?? "Aluno"}</span>
                          <span class="detalhes-turma-item-status">${aluno.status ?? "Ativo"}</span>
                        </li>
                      `).join("")}
                    </ul>`
                  : `<p class="detalhes-turma-vazio">Nenhum aluno vinculado.</p>`
              }
            </article>

            <article class="detalhes-turma-secao">
              <div class="detalhes-turma-secao-cabecalho">
                <span class="detalhes-turma-secao-icone material-symbols-rounded" aria-hidden="true">badge</span>
                <div class="detalhes-turma-secao-titulo">
                  <h3>Professores</h3>
                </div>
                <span class="detalhes-turma-contagem">${turma.professores?.length ?? 0}</span>
              </div>

              ${
                turma.professores?.length
                  ? `<ul class="detalhes-turma-lista">
                      ${turma.professores.map(professor => `
                        <li class="detalhes-turma-item">
                          <span class="detalhes-turma-item-nome" title="${professor.nome ?? "Professor"}">${professor.nome ?? "Professor"}</span>
                          <span class="detalhes-turma-item-status">${professor.status ?? "Ativo"}</span>
                        </li>
                      `).join("")}
                    </ul>`
                  : `<p class="detalhes-turma-vazio">Nenhum professor vinculado.</p>`
              }
            </article>

            <article class="detalhes-turma-secao">
              <div class="detalhes-turma-secao-cabecalho">
                <span class="detalhes-turma-secao-icone material-symbols-rounded" aria-hidden="true">menu_book</span>
                <div class="detalhes-turma-secao-titulo">
                  <h3>Disciplinas</h3>
                </div>
                <span class="detalhes-turma-contagem">${turma.disciplinas?.length ?? 0}</span>
              </div>

              ${
                turma.disciplinas?.length
                  ? `<ul class="detalhes-turma-lista">
                      ${turma.disciplinas.map(disciplina => `
                        <li class="detalhes-turma-item">
                          <span class="detalhes-turma-item-nome" title="${disciplina.nome ?? "Disciplina"}">${disciplina.nome ?? "Disciplina"}</span>
                          <span class="detalhes-turma-item-status">${disciplina.status ?? "Ativa"}</span>
                        </li>
                      `).join("")}
                    </ul>`
                  : `<p class="detalhes-turma-vazio">Nenhuma disciplina vinculada.</p>`
              }
            </article>
          </section>
        </div>
      `
    });

  } catch (error) {
    console.error(error);
    alert("Erro ao carregar detalhes da turma");
  }
}

function abrirFormularioTurma() {
  abrirModal({
    titulo: "Cadastrar turma",
    conteudo: `
      <form id="formTurma">
        <div class="grupo-form">
          <label>Nome</label>
          <input type="text" id="nomeTurma" required maxlength="100">
        </div>

        <div class="grupo-form">
          <label>Descrição</label>
          <input type="text" id="descricaoTurma" required>
        </div>

        <div class="grupo-form">
          <label>Professor responsável</label>
          <select id="professorTurma" required>
            <option value="">Carregando professores...</option>
          </select>
          <small class="turma-form-ajuda">O professor será vinculado à disciplina selecionada.</small>
        </div>

        <div class="grupo-form">
          <label>Disciplina inicial</label>
          <select id="disciplinaTurma" required>
            <option value="">Carregando disciplinas...</option>
          </select>
        </div>

        <div class="turma-form-nota">
          Os dias e horários das aulas serão configurados na etapa de agenda.
        </div>

        <button type="submit" id="btnSalvarTurma">
          Cadastrar turma
        </button>
      </form>
    `
  });

  Promise.all([
    carregarProfessoresSelect(),
    carregarDisciplinasSelect()
  ]).catch(error => console.error(error));

  document
    .getElementById("formTurma")
    ?.addEventListener("submit", cadastrarTurma);
}

async function cadastrarTurma(event) {
  event.preventDefault();

  const botaoSalvar = document.getElementById("btnSalvarTurma");

  try {
    const nome = document.getElementById("nomeTurma")?.value.trim();
    const descricao = document.getElementById("descricaoTurma")?.value.trim();
    const professorId = Number(document.getElementById("professorTurma")?.value);
    const disciplinaId = Number(document.getElementById("disciplinaTurma")?.value);

    if (!nome) {
      alert("Informe o nome da turma.");
      return;
    }

    if (!descricao) {
      alert("Informe a descrição da turma.");
      return;
    }

    if (!professorId) {
      alert("Selecione o professor responsável pela turma.");
      return;
    }

    if (!disciplinaId) {
      alert("Selecione a disciplina inicial da turma.");
      return;
    }

    const body = {
      nome,
      descricao,
      professorId,
      disciplinaId
    };

    if (botaoSalvar) {
      botaoSalvar.disabled = true;
      botaoSalvar.textContent = "Cadastrando...";
    }

    await request("/gestor/turmas", {
      method: "POST",
      body: JSON.stringify(body)
    });

    fecharModal();
    await carregarTurmas();

    alert("Turma cadastrada com sucesso!");
  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao cadastrar turma");
  } finally {
    if (botaoSalvar && document.body.contains(botaoSalvar)) {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Cadastrar turma";
    }
  }
}

async function editarTurma(id) {
  const turmaResumo = turmasCache.find(t => String(t.id) === String(id));

  if (!turmaResumo) {
    alert("Turma não encontrada.");
    return;
  }

  try {
    const detalhes = await request(`/gestor/turmas/${id}/detalhes`);

    const professorSelecionado = detalhes?.professores?.[0]?.id ?? null;
    const disciplinaSelecionada = detalhes?.disciplinas?.[0]?.id ?? null;

    abrirModal({
      titulo: "Editar turma",

      conteudo: `
        <form id="formEditarTurma">

          <div class="grupo-form">
            <label>Nome</label>
            <input
              type="text"
              id="editarNomeTurma"
              value="${escaparAtributoHtml(detalhes?.nome ?? turmaResumo.nome ?? "")}"
              required
              maxlength="100"
            >
          </div>

          <div class="grupo-form">
            <label>Descrição</label>
            <input
              type="text"
              id="editarDescricaoTurma"
              value="${escaparAtributoHtml(detalhes?.descricao ?? turmaResumo.descricao ?? "")}"
              required
            >
          </div>

          <div class="grupo-form">
            <label>Professor responsável</label>
            <select id="professorTurma" required>
              <option value="">Carregando professores...</option>
            </select>
          </div>

          <div class="grupo-form">
            <label>Disciplina</label>
            <select id="disciplinaTurma" required>
              <option value="">Carregando disciplinas...</option>
            </select>
          </div>

          <div class="grupo-form">
            <label>Status</label>
            <select id="editarStatusTurma">
              <option value="true" ${detalhes?.ativa ? "selected" : ""}>Ativa</option>
              <option value="false" ${!detalhes?.ativa ? "selected" : ""}>Inativa</option>
            </select>
          </div>

          <button type="submit" id="btnSalvarEdicaoTurma">
            Salvar alterações
          </button>

        </form>
      `
    });

    await Promise.all([
      carregarProfessoresSelect(professorSelecionado),
      carregarDisciplinasSelect(disciplinaSelecionada)
    ]);

    document
      .getElementById("formEditarTurma")
      ?.addEventListener("submit", event => {
        salvarEdicaoTurma(event, turmaResumo.id);
      });

  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao carregar os dados da turma para edição.");
  }
}

async function carregarProfessoresSelect(
  professorSelecionado = null
) {

  try {

    const professores =
      await request(
        "/gestor/professores/resumo"
      );

    const select =
      document.getElementById(
        "professorTurma"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione um professor
      </option>
    `;

    professores.forEach(professor => {

      select.innerHTML += `
        <option
          value="${professor.id}"
          ${professor.id == professorSelecionado
            ? "selected"
            : ""}
        >
          ${professor.nome}
        </option>
      `;
    });

  } catch (error) {

    console.error(error);

    alert(
      "Erro ao carregar professores"
    );
  }
}

async function carregarDisciplinasSelect(
  disciplinaSelecionada = null
) {

  try {

    const disciplinas =
      await request(
        "/gestor/disciplinas/resumo"
      );

    const select =
      document.getElementById(
        "disciplinaTurma"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione uma disciplina
      </option>
    `;

    disciplinas.forEach(disciplina => {

      select.innerHTML += `
        <option
          value="${disciplina.id}"
          ${disciplina.id == disciplinaSelecionada
            ? "selected"
            : ""}
        >
          ${disciplina.nome}
        </option>
      `;
    });

  } catch (error) {

    console.error(error);

    alert(
      "Erro ao carregar disciplinas"
    );
  }
}

async function salvarEdicaoTurma(event, id) {
  event.preventDefault();

  const botaoSalvar = document.getElementById("btnSalvarEdicaoTurma");

  try {
    const nome = document.getElementById("editarNomeTurma")?.value.trim();
    const descricao = document.getElementById("editarDescricaoTurma")?.value.trim();
    const professorId = Number(document.getElementById("professorTurma")?.value);
    const disciplinaId = Number(document.getElementById("disciplinaTurma")?.value);

    if (!nome) {
      alert("Informe o nome da turma.");
      return;
    }

    if (!descricao) {
      alert("Informe a descrição da turma.");
      return;
    }

    if (!professorId || !disciplinaId) {
      alert("Selecione o professor e a disciplina da turma.");
      return;
    }

    const body = {
      nome,
      descricao,
      ativa: document.getElementById("editarStatusTurma")?.value === "true",
      professorId,
      disciplinaId
    };

    if (botaoSalvar) {
      botaoSalvar.disabled = true;
      botaoSalvar.textContent = "Salvando...";
    }

    await request(
      `/gestor/turmas/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body)
      }
    );

    fecharModal();
    await carregarTurmas();

    alert("Turma editada com sucesso!");

  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao editar turma");
  } finally {
    if (botaoSalvar && document.body.contains(botaoSalvar)) {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Salvar alterações";
    }
  }
}



const DIAS_SEMANA_HORARIO = [
  ["MONDAY", "Segunda-feira"],
  ["TUESDAY", "Terça-feira"],
  ["WEDNESDAY", "Quarta-feira"],
  ["THURSDAY", "Quinta-feira"],
  ["FRIDAY", "Sexta-feira"],
  ["SATURDAY", "Sábado"],
  ["SUNDAY", "Domingo"]
];

let horarioContexto = {
  turmaId: null,
  vinculos: [],
  vinculoId: null,
  horarios: []
};

let diasHorarioSelecionados = [];
let seletorDiasHorarioEscapeHandler = null;

async function abrirHorariosTurma(turmaId) {
  const turma = turmasCache.find(item => String(item.id) === String(turmaId));

  try {
    const vinculos = await request(`/gestor/turmas/${turmaId}/vinculos`);

    horarioContexto = {
      turmaId: Number(turmaId),
      vinculos: Array.isArray(vinculos) ? vinculos : [],
      vinculoId: vinculos?.[0]?.turmaDisciplinaId ?? null,
      horarios: []
    };

    abrirModal({
      titulo: `Horários da turma - ${escaparHtml(turma?.nome ?? "Turma")}`,
      conteudo: `
        <div class="horarios-turma-modal">
          <div class="horarios-turma-intro">
            <div>
              <strong>Agenda semanal</strong>
              <p>Cadastre os dias e horários de cada disciplina. Esses dados alimentam a agenda do aluno e a geração automática das aulas.</p>
            </div>
          </div>

          ${horarioContexto.vinculos.length ? `
            <div class="grupo-form horarios-vinculo-campo">
              <label for="horarioVinculoTurma">Disciplina e professor</label>
              <select id="horarioVinculoTurma">
                ${horarioContexto.vinculos.map(vinculo => `
                  <option value="${vinculo.turmaDisciplinaId}">
                    ${escaparHtml(vinculo.disciplinaNome ?? "Disciplina")} — ${escaparHtml(vinculo.professorNome ?? "Professor")}
                  </option>
                `).join("")}
              </select>
            </div>

            <div class="horarios-toolbar">
              <div>
                <span class="horarios-toolbar-label">Horários cadastrados</span>
                <small id="horariosResumoVinculo">Carregando...</small>
              </div>
              <button type="button" id="btnNovoHorarioTurma" class="horario-btn-primary">
                + Adicionar horário
              </button>
            </div>

            <div id="listaHorariosTurma" class="horarios-lista">
              <div class="horarios-loading">Carregando horários...</div>
            </div>

            <div id="formHorarioTurmaContainer" class="horario-form-container" hidden></div>
          ` : `
            <div class="horarios-vazio horarios-vazio-destaque">
              <strong>Nenhum vínculo acadêmico encontrado.</strong>
              <p>Vincule primeiro um professor e uma disciplina à turma para cadastrar os horários.</p>
            </div>
          `}
        </div>
      `
    });

    if (!horarioContexto.vinculos.length) return;

    document
      .getElementById("horarioVinculoTurma")
      ?.addEventListener("change", async event => {
        horarioContexto.vinculoId = Number(event.target.value) || null;
        esconderFormularioHorario();
        await carregarHorariosDoVinculo();
      });

    document
      .getElementById("btnNovoHorarioTurma")
      ?.addEventListener("click", () => abrirFormularioHorario());

    await carregarHorariosDoVinculo();
  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao carregar os vínculos e horários da turma.");
  }
}

async function carregarHorariosDoVinculo() {
  const lista = document.getElementById("listaHorariosTurma");
  const resumo = document.getElementById("horariosResumoVinculo");

  if (!horarioContexto.vinculoId) {
    if (lista) lista.innerHTML = `<div class="horarios-vazio">Selecione um vínculo.</div>`;
    return;
  }

  if (lista) {
    lista.innerHTML = `<div class="horarios-loading">Carregando horários...</div>`;
  }

  try {
    const horarios = await request(
      `/gestor/horarios-aula/vinculo/${horarioContexto.vinculoId}`
    );

    horarioContexto.horarios = Array.isArray(horarios) ? horarios : [];

    if (resumo) {
      const vinculo = horarioContexto.vinculos.find(
        item => Number(item.turmaDisciplinaId) === Number(horarioContexto.vinculoId)
      );

      resumo.textContent = `${vinculo?.disciplinaNome ?? "Disciplina"} • ${vinculo?.professorNome ?? "Professor"}`;
    }

    renderizarHorariosDoVinculo();
  } catch (error) {
    console.error(error);

    if (lista) {
      lista.innerHTML = `
        <div class="horarios-vazio horarios-erro">
          ${escaparHtml(error?.message || "Não foi possível carregar os horários.")}
        </div>
      `;
    }
  }
}

function renderizarHorariosDoVinculo() {
  const lista = document.getElementById("listaHorariosTurma");
  if (!lista) return;

  const horarios = [...horarioContexto.horarios]
    .sort((a, b) => {
      const indiceA = indiceDiaSemana(a.diaSemana);
      const indiceB = indiceDiaSemana(b.diaSemana);
      if (indiceA !== indiceB) return indiceA - indiceB;
      return String(a.horaInicio ?? "").localeCompare(String(b.horaInicio ?? ""));
    });

  if (!horarios.length) {
    lista.innerHTML = `
      <div class="horarios-vazio">
        <strong>Nenhum horário cadastrado.</strong>
        <p>Adicione o primeiro dia de aula para essa disciplina.</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = horarios.map(horario => {
    const ativo = Boolean(horario.ativo);
    const vigencia = formatarVigenciaHorario(horario);

    return `
      <article class="horario-item ${ativo ? "is-active" : "is-inactive"}">
        <div class="horario-item-dia">
          <span class="horario-dia-sigla">${siglaDiaSemana(horario.diaSemana)}</span>
          <div>
            <strong>${nomeDiaSemana(horario.diaSemana)}</strong>
            <small>${vigencia}</small>
          </div>
        </div>

        <div class="horario-item-horas">
          <strong>${formatarHora(horario.horaInicio)} — ${formatarHora(horario.horaFim)}</strong>
          <span>Tolerância: ${horario.toleranciaMinutos ?? 30} min</span>
        </div>

        <div class="horario-item-automacao">
          <span class="horario-chip ${horario.aberturaAutomatica ? "is-on" : ""}">
            Abertura ${horario.aberturaAutomatica ? "automática" : "manual"}
          </span>
          <span class="horario-chip ${horario.encerramentoAutomatico ? "is-on" : ""}">
            Encerramento ${horario.encerramentoAutomatico ? "automático" : "manual"}
          </span>
        </div>

        <div class="horario-item-status">
          <span class="turma-status ${ativo ? "is-active" : "is-inactive"}">
            ${ativo ? "Ativo" : "Inativo"}
          </span>
        </div>

        <div class="horario-item-acoes">
          <button type="button" data-editar-horario="${horario.id}">Editar</button>
          <button
            type="button"
            data-status-horario="${horario.id}"
            class="${ativo ? "is-danger" : "is-success"}"
          >
            ${ativo ? "Desativar" : "Ativar"}
          </button>
        </div>
      </article>
    `;
  }).join("");

  lista
    .querySelectorAll("[data-editar-horario]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        const horario = horarioContexto.horarios.find(
          item => String(item.id) === String(botao.dataset.editarHorario)
        );
        if (horario) abrirFormularioHorario(horario);
      });
    });

  lista
    .querySelectorAll("[data-status-horario]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        alterarStatusHorario(Number(botao.dataset.statusHorario), botao);
      });
    });
}

function abrirFormularioHorario(horario = null) {
  const container = document.getElementById("formHorarioTurmaContainer");
  if (!container) return;

  const editando = Boolean(horario?.id);

  diasHorarioSelecionados = horario?.diaSemana
    ? [horario.diaSemana]
    : [];

  container.hidden = false;
  container.innerHTML = `
    <form id="formHorarioTurma" class="horario-form">
      <div class="horario-form-header">
        <div>
          <strong>${editando ? "Editar horário" : "Novo horário"}</strong>
          <p>${editando ? "Ajuste os dados da aula selecionada." : "Defina quando essa disciplina acontece durante a semana."}</p>
        </div>
        <button type="button" id="btnCancelarHorario" class="horario-btn-ghost">Fechar</button>
      </div>

      <div class="horario-form-grid">
        <div class="grupo-form horario-dias-campo">
          <label>Dia(s) da semana</label>
          <button
            type="button"
            id="btnSelecionarDiasHorario"
            class="horario-dias-trigger"
          >
            <span id="horarioDiasResumo">${resumoDiasHorarioSelecionados()}</span>
            <span class="horario-dias-seta" aria-hidden="true">⌄</span>
          </button>
          <div id="horarioDiasChips" class="horario-dias-chips">
            ${chipsDiasHorarioSelecionados()}
          </div>
          <small class="horario-dias-ajuda">
            Selecione um ou vários dias. O PreZence manterá o horário atual e criará os demais dias escolhidos quando necessário.
          </small>
        </div>

        <div class="grupo-form">
          <label for="horarioInicio">Início</label>
          <input id="horarioInicio" type="time" required value="${formatarHoraInput(horario?.horaInicio)}">
        </div>

        <div class="grupo-form">
          <label for="horarioFim">Término</label>
          <input id="horarioFim" type="time" required value="${formatarHoraInput(horario?.horaFim)}">
        </div>

        <div class="grupo-form">
          <label for="horarioTolerancia">Tolerância (min)</label>
          <input
            id="horarioTolerancia"
            type="number"
            min="0"
            max="180"
            step="1"
            value="${horario?.toleranciaMinutos ?? 30}"
          >
        </div>

        <div class="grupo-form">
          <label for="horarioDataInicio">Início da vigência</label>
          <input id="horarioDataInicio" type="date" value="${horario?.dataInicioVigencia ?? ""}">
        </div>

        <div class="grupo-form">
          <label for="horarioDataFim">Fim da vigência</label>
          <input id="horarioDataFim" type="date" value="${horario?.dataFimVigencia ?? ""}">
        </div>
      </div>

      <div class="horario-opcoes-automaticas">
        <label class="horario-check">
          <input
            id="horarioAberturaAutomatica"
            type="checkbox"
            ${horario ? (horario.aberturaAutomatica ? "checked" : "") : "checked"}
          >
          <span>
            <strong>Abertura automática</strong>
            <small>Permite que a chamada seja aberta conforme a programação.</small>
          </span>
        </label>

        <label class="horario-check">
          <input
            id="horarioEncerramentoAutomatico"
            type="checkbox"
            ${horario ? (horario.encerramentoAutomatico ? "checked" : "") : "checked"}
          >
          <span>
            <strong>Encerramento automático</strong>
            <small>Finaliza a janela de chamada conforme a regra do servidor.</small>
          </span>
        </label>
      </div>

      <div class="horario-form-actions">
        <button type="button" id="btnCancelarHorarioRodape" class="horario-btn-ghost">Cancelar</button>
        <button type="submit" id="btnSalvarHorario" class="horario-btn-primary">
          ${editando ? "Salvar alterações" : "Cadastrar horário"}
        </button>
      </div>
    </form>
  `;

  document.getElementById("btnCancelarHorario")?.addEventListener("click", esconderFormularioHorario);
  document.getElementById("btnCancelarHorarioRodape")?.addEventListener("click", esconderFormularioHorario);

  document.getElementById("btnSelecionarDiasHorario")?.addEventListener("click", () => {
    abrirSeletorDiasHorario();
  });

  document.getElementById("formHorarioTurma")?.addEventListener("submit", event => {
    salvarHorarioTurma(event, horario);
  });

  atualizarCampoDiasHorario();
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function esconderFormularioHorario() {
  const container = document.getElementById("formHorarioTurmaContainer");
  if (!container) return;
  container.hidden = true;
  container.innerHTML = "";
}

async function salvarHorarioTurma(event, horarioOriginal = null) {
  event.preventDefault();

  const horarioId = horarioOriginal?.id ?? null;

  const botao = document.getElementById("btnSalvarHorario");
  const horaInicio = document.getElementById("horarioInicio")?.value;
  const horaFim = document.getElementById("horarioFim")?.value;
  const dataInicio = document.getElementById("horarioDataInicio")?.value || null;
  const dataFim = document.getElementById("horarioDataFim")?.value || null;
  const tolerancia = Number(document.getElementById("horarioTolerancia")?.value ?? 30);
  const diasSelecionados = [...diasHorarioSelecionados];

  if (!horarioContexto.vinculoId) {
    alert("Selecione a disciplina e o professor do horário.");
    return;
  }

  if (!diasSelecionados.length) {
    alert("Selecione pelo menos um dia da semana.");
    return;
  }

  if (!horaInicio || !horaFim) {
    alert("Informe o horário de início e término.");
    return;
  }

  if (horaFim <= horaInicio) {
    alert("O horário de término deve ser posterior ao horário de início.");
    return;
  }

  if (!Number.isFinite(tolerancia) || tolerancia < 0 || tolerancia > 180) {
    alert("A tolerância deve estar entre 0 e 180 minutos.");
    return;
  }

  if (dataInicio && dataFim && dataFim < dataInicio) {
    alert("A data final da vigência não pode ser anterior à data inicial.");
    return;
  }

  const bodyBase = {
    turmaDisciplinaId: horarioContexto.vinculoId,
    horaInicio,
    horaFim,
    toleranciaMinutos: tolerancia,
    aberturaAutomatica: Boolean(document.getElementById("horarioAberturaAutomatica")?.checked),
    encerramentoAutomatico: Boolean(document.getElementById("horarioEncerramentoAutomatico")?.checked),
    dataInicioVigencia: dataInicio,
    dataFimVigencia: dataFim
  };

  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = horarioId
        ? (diasSelecionados.length > 1
            ? `Salvando ${diasSelecionados.length} dias...`
            : "Salvando...")
        : diasSelecionados.length > 1
          ? `Cadastrando ${diasSelecionados.length} dias...`
          : "Cadastrando...";
    }

    if (horarioId) {
      const diaOriginal = horarioOriginal?.diaSemana ?? null;
      const diaParaAtualizar = diasSelecionados.includes(diaOriginal)
        ? diaOriginal
        : diasSelecionados[0];

      await request(`/gestor/horarios-aula/${horarioId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...bodyBase,
          diaSemana: diaParaAtualizar
        })
      });

      const diasAdicionais = diasSelecionados.filter(dia => dia !== diaParaAtualizar);
      const sucessosAdicionais = [];
      const falhasAdicionais = [];

      for (const diaSemana of diasAdicionais) {
        try {
          await request("/gestor/horarios-aula", {
            method: "POST",
            body: JSON.stringify({
              ...bodyBase,
              diaSemana
            })
          });
          sucessosAdicionais.push(diaSemana);
        } catch (error) {
          console.error(`Erro ao cadastrar ${nomeDiaSemana(diaSemana)}:`, error);
          falhasAdicionais.push({
            diaSemana,
            mensagem: error?.message || "Erro ao cadastrar o horário"
          });
        }
      }

      await carregarHorariosDoVinculo();

      if (!falhasAdicionais.length) {
        esconderFormularioHorario();
        const total = 1 + sucessosAdicionais.length;
        alert(total > 1
          ? `${total} dias configurados com sucesso!`
          : "Horário atualizado com sucesso!");
        return;
      }

      diasHorarioSelecionados = falhasAdicionais.map(item => item.diaSemana);
      atualizarCampoDiasHorario();

      const detalhes = falhasAdicionais
        .map(item => `${nomeDiaSemana(item.diaSemana)}: ${item.mensagem}`)
        .join("\n");

      alert(`O horário atual foi salvo, mas alguns dias adicionais falharam:\n\n${detalhes}`);
      return;
    }

    const sucessos = [];
    const falhas = [];

    for (const diaSemana of diasSelecionados) {
      try {
        await request("/gestor/horarios-aula", {
          method: "POST",
          body: JSON.stringify({
            ...bodyBase,
            diaSemana
          })
        });

        sucessos.push(diaSemana);
      } catch (error) {
        console.error(`Erro ao cadastrar ${nomeDiaSemana(diaSemana)}:`, error);
        falhas.push({
          diaSemana,
          mensagem: error?.message || "Erro ao cadastrar o horário"
        });
      }
    }

    await carregarHorariosDoVinculo();

    if (!falhas.length) {
      esconderFormularioHorario();

      if (sucessos.length === 1) {
        alert(`Horário de ${nomeDiaSemana(sucessos[0])} cadastrado com sucesso!`);
      } else {
        alert(`${sucessos.length} horários cadastrados com sucesso!`);
      }
      return;
    }

    diasHorarioSelecionados = falhas.map(item => item.diaSemana);
    atualizarCampoDiasHorario();

    const detalhesFalhas = falhas
      .map(item => `${nomeDiaSemana(item.diaSemana)}: ${item.mensagem}`)
      .join("\n");

    const cabecalho = sucessos.length
      ? `${sucessos.length} horário(s) cadastrado(s). ${falhas.length} não puderam ser cadastrados:`
      : "Nenhum horário pôde ser cadastrado:";

    alert(`${cabecalho}\n\n${detalhesFalhas}`);
  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao salvar horário da aula.");
  } finally {
    if (botao && document.body.contains(botao)) {
      botao.disabled = false;
      botao.textContent = horarioId ? "Salvar alterações" : "Cadastrar horário";
    }
  }
}


function abrirSeletorDiasHorario() {
  fecharSeletorDiasHorario();

  const selecionadosTemporarios = new Set(diasHorarioSelecionados);
  const overlay = document.createElement("div");

  overlay.id = "seletorDiasHorarioOverlay";
  overlay.className = "horario-dias-modal-overlay";
  overlay.innerHTML = `
    <div class="horario-dias-modal" role="dialog" aria-modal="true" aria-labelledby="horarioDiasModalTitulo">
      <div class="horario-dias-modal-header">
        <div>
          <span class="horario-dias-modal-eyebrow">Agenda semanal</span>
          <h3 id="horarioDiasModalTitulo">Selecionar dias da semana</h3>
          <p>Marque todos os dias em que esta aula terá o mesmo horário. Você pode selecionar vários ao mesmo tempo.</p>
        </div>
        <button type="button" id="btnFecharSeletorDias" class="horario-dias-modal-fechar" aria-label="Fechar">×</button>
      </div>

      <div class="horario-dias-atalhos">
        <button type="button" id="btnDiasUteisHorario">Segunda a sexta</button>
        <button type="button" id="btnTodosDiasHorario">Selecionar todos</button>
        <button type="button" id="btnLimparDiasHorario">Limpar seleção</button>
      </div>

      <div class="horario-dias-opcoes">
        ${DIAS_SEMANA_HORARIO.map(([valor, rotulo]) => `
          <label class="horario-dia-opcao ${selecionadosTemporarios.has(valor) ? "is-selected" : ""}">
            <input
              type="checkbox"
              name="diasHorario[]"
              value="${valor}"
              ${selecionadosTemporarios.has(valor) ? "checked" : ""}
            >
            <span class="horario-dia-opcao-sigla">${siglaDiaSemana(valor)}</span>
            <span class="horario-dia-opcao-nome">${rotulo}</span>
            <span class="horario-dia-opcao-check" aria-hidden="true">✓</span>
          </label>
        `).join("")}
      </div>

      <div class="horario-dias-modal-actions">
        <span id="horarioDiasQuantidade">${textoQuantidadeDias(selecionadosTemporarios.size)}</span>
        <div>
          <button type="button" id="btnCancelarSeletorDias" class="horario-btn-ghost">Cancelar</button>
          <button type="button" id="btnConfirmarSeletorDias" class="horario-btn-primary">Confirmar dias</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const inputsDias = [...overlay.querySelectorAll(".horario-dia-opcao input[type='checkbox']")];

  const atualizarVisual = () => {
    inputsDias.forEach(input => {
      const opcao = input.closest(".horario-dia-opcao");
      opcao?.classList.toggle("is-selected", input.checked);
    });

    const quantidade = overlay.querySelector("#horarioDiasQuantidade");
    if (quantidade) {
      quantidade.textContent = textoQuantidadeDias(selecionadosTemporarios.size);
    }
  };

  const sincronizarSet = () => {
    selecionadosTemporarios.clear();
    inputsDias.forEach(input => {
      if (input.checked) selecionadosTemporarios.add(input.value);
    });
    atualizarVisual();
  };

  inputsDias.forEach(input => {
    input.addEventListener("change", sincronizarSet);
  });

  overlay.querySelector("#btnDiasUteisHorario")?.addEventListener("click", () => {
    const diasUteis = new Set(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
    inputsDias.forEach(input => {
      input.checked = diasUteis.has(input.value);
    });
    sincronizarSet();
  });

  overlay.querySelector("#btnTodosDiasHorario")?.addEventListener("click", () => {
    inputsDias.forEach(input => {
      input.checked = true;
    });
    sincronizarSet();
  });

  overlay.querySelector("#btnLimparDiasHorario")?.addEventListener("click", () => {
    inputsDias.forEach(input => {
      input.checked = false;
    });
    sincronizarSet();
  });

  const fechar = () => fecharSeletorDiasHorario();

  overlay.querySelector("#btnFecharSeletorDias")?.addEventListener("click", fechar);
  overlay.querySelector("#btnCancelarSeletorDias")?.addEventListener("click", fechar);

  overlay.querySelector("#btnConfirmarSeletorDias")?.addEventListener("click", () => {
    sincronizarSet();

    if (!selecionadosTemporarios.size) {
      alert("Selecione pelo menos um dia da semana.");
      return;
    }

    diasHorarioSelecionados = [...selecionadosTemporarios]
      .sort((a, b) => indiceDiaSemana(a) - indiceDiaSemana(b));

    atualizarCampoDiasHorario();
    fechar();
  });

  overlay.addEventListener("click", event => {
    if (event.target === overlay) fechar();
  });

  seletorDiasHorarioEscapeHandler = event => {
    if (event.key === "Escape") fechar();
  };

  document.addEventListener("keydown", seletorDiasHorarioEscapeHandler);
}
function fecharSeletorDiasHorario() {
  if (seletorDiasHorarioEscapeHandler) {
    document.removeEventListener("keydown", seletorDiasHorarioEscapeHandler);
    seletorDiasHorarioEscapeHandler = null;
  }

  document.getElementById("seletorDiasHorarioOverlay")?.remove();
}

function atualizarCampoDiasHorario() {
  const resumo = document.getElementById("horarioDiasResumo");
  const chips = document.getElementById("horarioDiasChips");
  const trigger = document.getElementById("btnSelecionarDiasHorario");

  if (resumo) resumo.textContent = resumoDiasHorarioSelecionados();
  if (chips) chips.innerHTML = chipsDiasHorarioSelecionados();

  if (trigger) {
    trigger.classList.toggle("has-selection", diasHorarioSelecionados.length > 0);
  }
}

function resumoDiasHorarioSelecionados() {
  if (!diasHorarioSelecionados.length) {
    return "Selecionar dias da semana";
  }

  if (diasHorarioSelecionados.length === 1) {
    return nomeDiaSemana(diasHorarioSelecionados[0]);
  }

  return `${diasHorarioSelecionados.length} dias selecionados`;
}

function chipsDiasHorarioSelecionados() {
  if (!diasHorarioSelecionados.length) {
    return `<span class="horario-dias-vazio">Nenhum dia selecionado</span>`;
  }

  return diasHorarioSelecionados
    .sort((a, b) => indiceDiaSemana(a) - indiceDiaSemana(b))
    .map(dia => `
      <span class="horario-dia-chip-selecionado" title="${nomeDiaSemana(dia)}">
        ${siglaDiaSemana(dia)}
      </span>
    `)
    .join("");
}

function textoQuantidadeDias(quantidade) {
  if (!quantidade) return "Nenhum dia selecionado";
  if (quantidade === 1) return "1 dia selecionado";
  return `${quantidade} dias selecionados`;
}

async function alterarStatusHorario(horarioId, botao) {
  const horario = horarioContexto.horarios.find(item => Number(item.id) === Number(horarioId));
  if (!horario) return;

  const acao = horario.ativo ? "desativar" : "ativar";

  if (!window.confirm(`Deseja ${acao} este horário?`)) {
    return;
  }

  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = horario.ativo ? "Desativando..." : "Ativando...";
    }

    await request(`/gestor/horarios-aula/${horarioId}/status`, {
      method: "PATCH"
    });

    await carregarHorariosDoVinculo();
  } catch (error) {
    console.error(error);
    alert(error?.message || `Erro ao ${acao} o horário.`);
  }
}

function nomeDiaSemana(valor) {
  return DIAS_SEMANA_HORARIO.find(([dia]) => dia === valor)?.[1] ?? valor ?? "-";
}

function siglaDiaSemana(valor) {
  const mapa = {
    MONDAY: "SEG",
    TUESDAY: "TER",
    WEDNESDAY: "QUA",
    THURSDAY: "QUI",
    FRIDAY: "SEX",
    SATURDAY: "SÁB",
    SUNDAY: "DOM"
  };
  return mapa[valor] ?? "DIA";
}

function indiceDiaSemana(valor) {
  const indice = DIAS_SEMANA_HORARIO.findIndex(([dia]) => dia === valor);
  return indice === -1 ? 99 : indice;
}

function formatarHora(valor) {
  if (!valor) return "--:--";
  return String(valor).slice(0, 5);
}

function formatarHoraInput(valor) {
  return valor ? String(valor).slice(0, 5) : "";
}

function formatarDataCurta(valor) {
  if (!valor) return null;
  const [ano, mes, dia] = String(valor).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

function formatarVigenciaHorario(horario) {
  const inicio = formatarDataCurta(horario.dataInicioVigencia);
  const fim = formatarDataCurta(horario.dataFimVigencia);

  if (inicio && fim) return `Vigência: ${inicio} a ${fim}`;
  if (inicio) return `Vigente desde ${inicio}`;
  if (fim) return `Vigente até ${fim}`;
  return "Sem período de vigência definido";
}


function escaparAtributoHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
