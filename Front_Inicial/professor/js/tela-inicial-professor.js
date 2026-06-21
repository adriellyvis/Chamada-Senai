import { request } from "../../../core/api.js";


async function carregarDashboardProfessor() {
  try {

    const data = await request("/professor/dashboard");
    setTexto("statMedia",`${data.frequenciaMedia ?? 0}%`);
    setTexto("statAlunos",data.totalAlunos ?? 0);
    setTexto("statAulas",data.aulasRealizadas ?? 0);

    renderizarAulasRecentes(data.aulasRecentes || []);
    renderizarAlunosRisco(data.alunosRisco || []);

  } catch (error) {

    console.error(error);

    alert(
      "Erro ao carregar dashboard"
    );
  }
}

function setTexto(id, valor) {

  const elemento =
    document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor;
  }
}

function renderizarAulasRecentes(aulas) {

  const lista =
    document.getElementById(
      "activityList"
    );

  if (!lista) return;

  if (aulas.length === 0) {

    lista.innerHTML = `
      <p>Nenhuma aula encontrada.</p>
    `;

    return;
  }

  lista.innerHTML = aulas.map(aula => `
    <div class="activity-item">

      <strong>
        ${aula.turma ?? "-"}
      </strong>

      <p>
        ${aula.disciplina ?? "-"}
      </p>

      <small>
        ${aula.data ?? "-"} |
        ${aula.status ?? "-"}
      </small>

    </div>
  `).join("");
}



window.addEventListener(
  "DOMContentLoaded",
  carregarDashboardProfessor
);

function renderizarAlunosRisco(alunos) {
  const lista = document.getElementById("listaAlunosRisco");

  if (!lista) return;

  if (!alunos || alunos.length === 0) {
    lista.innerHTML = `<p>Nenhum aluno em risco encontrado.</p>`;
    return;
  }

  lista.innerHTML = alunos.map(aluno => `
    <div class="activity-item">
      <strong>${aluno.nomeAluno ?? aluno.nome ?? "Aluno"}</strong>
      <p>Frequência: ${aluno.frequencia ?? 0}%</p>
    </div>
  `).join("");
}

