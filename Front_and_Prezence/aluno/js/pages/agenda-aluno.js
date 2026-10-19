import { request } from "../../../core/api.js";

const DIAS = [
  { codigo: "MONDAY", curto: "Seg", nome: "Segunda-feira" },
  { codigo: "TUESDAY", curto: "Ter", nome: "Terça-feira" },
  { codigo: "WEDNESDAY", curto: "Qua", nome: "Quarta-feira" },
  { codigo: "THURSDAY", curto: "Qui", nome: "Quinta-feira" },
  { codigo: "FRIDAY", curto: "Sex", nome: "Sexta-feira" },
  { codigo: "SATURDAY", curto: "Sáb", nome: "Sábado" }
];

const INICIO_GRADE = 8;
const FIM_MANHA = 12;
const INICIO_TARDE = 13;
const FIM_GRADE = 17;

export async function abrirAgendaAluno(container) {
  const usuario = obterUsuarioLogado();

  container.innerHTML = `
    <div class="agenda-page">
      <div class="agenda-loading">Carregando sua agenda...</div>
    </div>
  `;

  try {
    if (!usuario?.id) {
      throw new Error("Usuário não encontrado na sessão.");
    }

    const dados = await request(`/aluno/agenda`);
    const agenda = normalizarAgenda(dados);

    container.innerHTML = montarAgenda(agenda);
  } catch (erro) {
    console.error("Erro ao carregar agenda do aluno:", erro);

    container.innerHTML = `
      <div class="agenda-page">
        <article class="card agenda-error">
          <span class="material-symbols-rounded" aria-hidden="true">error</span>
          <strong>Não foi possível carregar a agenda</strong>
          <p>${escaparHtml(erro?.message || "Tente novamente em alguns instantes.")}</p>
          <button class="primary-btn" id="btnRecarregarAgenda" type="button">Tentar novamente</button>
        </article>
      </div>
    `;

    document.getElementById("btnRecarregarAgenda")?.addEventListener("click", () => {
      abrirAgendaAluno(container);
    });
  }
}

function montarAgenda(agenda) {
  const hoje = obterDiaSemanaAtual();
  const totalDisciplinas = new Set(
    agenda.map(item => item.disciplinaId ?? item.disciplina)
  ).size;
  const proxima = encontrarProximaAula(agenda);
  const cargaSemanal = calcularCargaSemanal(agenda);
  const foraDaGrade = agenda.filter(estaForaDaGradePrincipal);

  return `
    <div class="agenda-page">
      <section class="agenda-summary">
        ${cardResumo(
          "Carga semanal",
          formatarCargaHoraria(cargaSemanal),
          `${agenda.length} ${agenda.length === 1 ? "horário cadastrado" : "horários cadastrados"}`,
          "schedule"
        )}

        ${cardResumo(
          "Disciplinas",
          totalDisciplinas,
          "Na grade atual",
          "menu_book"
        )}

        ${cardResumo(
          "Próxima aula",
          proxima ? proxima.horaInicio : "--:--",
          proxima ? `${proxima.sigla} • ${proxima.disciplina}` : "Nenhuma aula futura",
          "event_upcoming"
        )}
      </section>

      ${agenda.length ? montarGradeSemanal(agenda, hoje, foraDaGrade) : montarAgendaVazia()}
      ${agenda.length ? montarAgendaMobile(agenda, hoje, foraDaGrade) : ""}
    </div>
  `;
}

function montarGradeSemanal(agenda, hoje, foraDaGrade) {
  const secoes = montarSecoesDaGrade(agenda);
  const turma = agenda[0]?.turma || "Minha turma";
  const local = agenda[0]?.sala ? capitalizarPrimeira(agenda[0].sala) : "Não informado";

  return `
    <section class="card agenda-board" aria-label="Grade semanal de aulas">
      <header class="agenda-board__header">
        <div>
          <span class="agenda-board__eyebrow">GRADE SEMANAL</span>
          <h2>${escaparHtml(turma)}</h2>
          <p>Horários organizados em blocos de uma hora.</p>
        </div>
      </header>

      ${foraDaGrade.length ? `
        <div class="agenda-board__warning" role="status">
          <span class="material-symbols-rounded" aria-hidden="true">warning</span>
          <span>
            ${foraDaGrade.length} ${foraDaGrade.length === 1 ? "horário está" : "horários estão"}
            fora da organização principal de 08:00 às 17:00. Revise a seção de horário extra ou possíveis conflitos com o almoço.
          </span>
        </div>
      ` : ""}

      <div class="agenda-table-scroll">
        <table class="agenda-table">
          <thead>
            <tr>
              <th class="agenda-table__time-head" scope="col">Horário</th>
              ${DIAS.map(dia => `
                <th class="agenda-table__day-head ${dia.codigo === hoje ? "is-today" : ""}" scope="col">
                  <span>${escaparHtml(dia.curto)}</span>
                  <small>${escaparHtml(dia.nome)}</small>
                </th>
              `).join("")}
            </tr>
          </thead>

          <tbody>
            ${secoes.map(secao => montarSecaoTabela(secao, agenda, hoje)).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function montarSecaoTabela(secao, agenda, hoje) {
  if (secao.tipo === "intervalo") {
    return `
      <tr class="agenda-period-title agenda-period-title--intervalo">
        <th colspan="7">
          <span class="material-symbols-rounded" aria-hidden="true">restaurant</span>
          <strong>${escaparHtml(secao.nome)}</strong>
          <small>${escaparHtml(secao.detalhe)}</small>
        </th>
      </tr>
    `;
  }

  return `
    <tr class="agenda-period-title ${secao.extra ? "agenda-period-title--extra" : ""}">
      <th colspan="7">
        <strong>${escaparHtml(secao.nome)}</strong>
        <small>${escaparHtml(secao.detalhe)}</small>
      </th>
    </tr>
    ${secao.horas.map(hora => montarLinhaHora(hora, secao, agenda, hoje)).join("")}
  `;
}

function montarLinhaHora(hora, secao, agenda, hoje) {
  return `
    <tr class="agenda-table__body-row">
      <th class="agenda-table__time" scope="row">
        <strong>${formatarHoraInteira(hora)}</strong>
        <span>${formatarHoraInteira(hora + 1)}</span>
      </th>

      ${DIAS.map(dia => montarCelulaDiaHora(dia, hora, secao, agenda, hoje)).join("")}
    </tr>
  `;
}

function montarCelulaDiaHora(dia, hora, secao, agenda, hoje) {
  const aulasDia = agenda.filter(aula => aula.diaSemana === dia.codigo);

  const aulaAnterior = aulasDia.find(aula => {
    const inicio = Math.floor(minutosHorario(aula.horaInicio) / 60);
    const fim = Math.ceil(minutosHorario(aula.horaFim) / 60);

    return inicio >= secao.inicio && inicio < hora && fim > hora;
  });

  if (aulaAnterior) {
    return "";
  }

  const aulasQueComecam = aulasDia.filter(aula =>
    Math.floor(minutosHorario(aula.horaInicio) / 60) === hora
  );

  if (!aulasQueComecam.length) {
    return `
      <td class="agenda-table__cell agenda-table__cell--empty ${dia.codigo === hoje ? "is-today" : ""}">
        <span aria-hidden="true"></span>
      </td>
    `;
  }

  const maiorFim = Math.max(
    ...aulasQueComecam.map(aula => Math.ceil(minutosHorario(aula.horaFim) / 60))
  );
  const rowspan = Math.max(1, Math.min(maiorFim, secao.fim) - hora);

  return `
    <td
      class="agenda-table__cell agenda-table__cell--class ${dia.codigo === hoje ? "is-today" : ""}"
      rowspan="${rowspan}"
    >
      <div class="agenda-table__class-stack">
        ${aulasQueComecam.map(montarAulaGrade).join("")}
      </div>
    </td>
  `;
}

function montarAulaGrade(aula) {
  const local = aula.sala ? capitalizarPrimeira(aula.sala) : "Local não informado";
  const descricao = `${aula.disciplina}. Professor: ${aula.professor}. Local: ${local}. Horário: ${aula.horaInicio} às ${aula.horaFim}.`;

  return `
    <article class="agenda-subject" title="${escaparHtml(descricao)}" aria-label="${escaparHtml(descricao)}">
      <span class="agenda-subject__teacher">${escaparHtml(aula.professor)}</span>
      <strong class="agenda-subject__code">${escaparHtml(aula.sigla)}</strong>
      <span class="agenda-subject__room">${escaparHtml(local)}</span>
      <small class="agenda-subject__time">${escaparHtml(aula.horaInicio)}–${escaparHtml(aula.horaFim)}</small>
      <span class="agenda-subject__name">${escaparHtml(aula.disciplina)}</span>
    </article>
  `;
}

function montarAgendaMobile(agenda, hoje, foraDaGrade) {
  return `
    <section class="agenda-mobile" aria-label="Agenda semanal em lista">
      ${foraDaGrade.length ? `
        <div class="agenda-mobile-warning">
          <span class="material-symbols-rounded" aria-hidden="true">warning</span>
          ${foraDaGrade.length} ${foraDaGrade.length === 1 ? "horário fora" : "horários fora"} da faixa 08:00–17:00.
        </div>
      ` : ""}

      ${DIAS.map(dia => {
        const aulas = agenda.filter(aula => aula.diaSemana === dia.codigo);

        return `
          <article class="card agenda-mobile-day ${dia.codigo === hoje ? "is-today" : ""}">
            <header>
              <div>
                <span>${dia.codigo === hoje ? "HOJE" : "DIA DA SEMANA"}</span>
                <h2>${escaparHtml(dia.nome)}</h2>
              </div>
              <strong>${aulas.length} ${aulas.length === 1 ? "aula" : "aulas"}</strong>
            </header>

            <div class="agenda-mobile-day__content">
              ${aulas.length
                ? aulas.map(montarAulaMobile).join("")
                : `<p class="agenda-mobile-empty">Nenhuma aula cadastrada.</p>`}
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function montarAulaMobile(aula) {
  const local = aula.sala ? capitalizarPrimeira(aula.sala) : aula.turma;

  return `
    <div class="agenda-mobile-class">
      <div class="agenda-mobile-class__time">
        <strong>${escaparHtml(aula.horaInicio)}</strong>
        <span>${escaparHtml(aula.horaFim)}</span>
      </div>

      <div class="agenda-mobile-class__info">
        <strong>${escaparHtml(aula.sigla)} — ${escaparHtml(aula.disciplina)}</strong>
        <span>${escaparHtml(aula.professor)}</span>
        <small><span class="material-symbols-rounded" aria-hidden="true">location_on</span>${escaparHtml(local)}</small>
      </div>
    </div>
  `;
}

function montarAgendaVazia() {
  return `
    <section class="card agenda-no-data">
      <span class="material-symbols-rounded" aria-hidden="true">event_busy</span>
      <strong>Nenhuma aula cadastrada</strong>
      <p>A grade aparecerá aqui quando os horários da turma forem cadastrados pelo gestor.</p>
    </section>
  `;
}

function cardResumo(titulo, valor, detalhe, icone) {
  return `
    <article class="card agenda-summary-card">
      <div class="agenda-summary-card__icon" aria-hidden="true">
        <span class="material-symbols-rounded">${escaparHtml(icone)}</span>
      </div>
      <div>
        <span>${escaparHtml(titulo)}</span>
        <strong>${escaparHtml(valor)}</strong>
        <small>${escaparHtml(detalhe)}</small>
      </div>
    </article>
  `;
}

function montarSecoesDaGrade(agenda) {
  const inicios = agenda.map(aula => Math.floor(minutosHorario(aula.horaInicio) / 60));
  const fins = agenda.map(aula => Math.ceil(minutosHorario(aula.horaFim) / 60));

  const menorInicio = inicios.length ? Math.min(...inicios) : INICIO_GRADE;
  const maiorFim = fins.length ? Math.max(...fins) : FIM_GRADE;
  const secoes = [];

  if (menorInicio < INICIO_GRADE) {
    secoes.push({
      tipo: "aulas",
      nome: "HORÁRIO EXTRA",
      detalhe: `${formatarHoraInteira(menorInicio)}–${formatarHoraInteira(INICIO_GRADE)}`,
      inicio: menorInicio,
      fim: INICIO_GRADE,
      horas: criarIntervaloHoras(menorInicio, INICIO_GRADE),
      extra: true
    });
  }

  secoes.push({
    tipo: "aulas",
    nome: "MANHÃ",
    detalhe: "08:00–12:00",
    inicio: INICIO_GRADE,
    fim: FIM_MANHA,
    horas: criarIntervaloHoras(INICIO_GRADE, FIM_MANHA)
  });

  secoes.push({
    tipo: "intervalo",
    nome: "ALMOÇO",
    detalhe: "12:00–13:00"
  });

  secoes.push({
    tipo: "aulas",
    nome: "TARDE",
    detalhe: "13:00–17:00",
    inicio: INICIO_TARDE,
    fim: FIM_GRADE,
    horas: criarIntervaloHoras(INICIO_TARDE, FIM_GRADE)
  });

  if (maiorFim > FIM_GRADE) {
    secoes.push({
      tipo: "aulas",
      nome: "HORÁRIO EXTRA",
      detalhe: `${formatarHoraInteira(FIM_GRADE)}–${formatarHoraInteira(maiorFim)}`,
      inicio: FIM_GRADE,
      fim: maiorFim,
      horas: criarIntervaloHoras(FIM_GRADE, maiorFim),
      extra: true
    });
  }

  return secoes;
}

function normalizarAgenda(dados) {
  const lista = Array.isArray(dados) ? dados : [];

  return lista
    .map(item => {
      const disciplina = item.disciplina || "Disciplina não informada";
      const horaInicio = formatarHorario(item.horaInicio);
      const horaFim = formatarHorario(item.horaFim);

      return {
        id: item.id,
        disciplinaId: item.disciplinaId,
        disciplina,
        sigla: normalizarSigla(
          item.siglaDisciplina || item.sigla || gerarSigla(disciplina)
        ),
        professor: item.professor || "Professor não informado",
        turma: item.turma || "Turma não informada",
        sala: normalizarSala(item.sala),
        diaSemana: String(item.diaSemana || "").toUpperCase(),
        horaInicio,
        horaFim,
        toleranciaMinutos: numeroSeguro(item.toleranciaMinutos)
      };
    })
    .filter(item =>
      DIAS.some(dia => dia.codigo === item.diaSemana) &&
      minutosHorario(item.horaFim) > minutosHorario(item.horaInicio)
    )
    .sort((a, b) => {
      const diaA = DIAS.findIndex(dia => dia.codigo === a.diaSemana);
      const diaB = DIAS.findIndex(dia => dia.codigo === b.diaSemana);
      return diaA - diaB || a.horaInicio.localeCompare(b.horaInicio);
    });
}

function encontrarProximaAula(agenda) {
  if (!agenda.length) return null;

  const agora = new Date();
  const indiceHoje = agora.getDay() === 0 ? 6 : agora.getDay() - 1;
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  for (let deslocamento = 0; deslocamento < 7; deslocamento += 1) {
    const indice = (indiceHoje + deslocamento) % 7;
    const dia = DIAS[indice];

    if (!dia) continue;

    const aulas = agenda.filter(item => item.diaSemana === dia.codigo);
    const encontrada = aulas.find(aula =>
      deslocamento > 0 || minutosHorario(aula.horaFim) >= minutosAgora
    );

    if (encontrada) return encontrada;
  }

  return agenda[0];
}

function calcularCargaSemanal(agenda) {
  return agenda.reduce((total, aula) => {
    const duracao = minutosHorario(aula.horaFim) - minutosHorario(aula.horaInicio);
    return total + Math.max(0, duracao);
  }, 0);
}

function formatarCargaHoraria(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (!resto) return `${horas}h`;
  return `${horas}h${String(resto).padStart(2, "0")}`;
}

function estaForaDaGradePrincipal(aula) {
  const inicio = minutosHorario(aula.horaInicio);
  const fim = minutosHorario(aula.horaFim);
  const sobrepoeAlmoco = inicio < INICIO_TARDE * 60 && fim > FIM_MANHA * 60;

  return inicio < INICIO_GRADE * 60 || fim > FIM_GRADE * 60 || sobrepoeAlmoco;
}

function criarIntervaloHoras(inicio, fim) {
  return Array.from({ length: Math.max(0, fim - inicio) }, (_, indice) => inicio + indice);
}

function formatarHoraInteira(hora) {
  return `${String(hora).padStart(2, "0")}:00`;
}

function obterDiaSemanaAtual() {
  return [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ][new Date().getDay()];
}

function gerarSigla(nome) {
  const palavrasIgnoradas = new Set(["DE", "DA", "DO", "DAS", "DOS", "E"]);
  const palavras = String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(palavra => palavra.toUpperCase())
    .filter(palavra => !palavrasIgnoradas.has(palavra));

  if (!palavras.length) return "DISC";
  if (palavras.length === 1) return palavras[0].slice(0, 4);

  return palavras.map(palavra => palavra.charAt(0)).join("").slice(0, 6);
}

function normalizarSigla(valor) {
  const sigla = String(valor || "").trim().toUpperCase();
  return sigla ? sigla.slice(0, 10) : "DISC";
}

function normalizarSala(valor) {
  const sala = String(valor ?? "").trim();
  return sala || null;
}

function capitalizarPrimeira(valor) {
  const texto = String(valor || "").trim();
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}

function minutosHorario(valor) {
  const [hora, minuto] = String(valor || "00:00").split(":").map(Number);
  return (Number.isFinite(hora) ? hora : 0) * 60 + (Number.isFinite(minuto) ? minuto : 0);
}

function formatarHorario(valor) {
  return valor ? String(valor).slice(0, 5) : "--:--";
}

function numeroSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : 0;
}

function obterUsuarioLogado() {
  try {
    return JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario"))) || null;
  } catch {
    return null;
  }
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
