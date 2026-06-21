export function abrirFrequenciaAluno(container) {
  container.innerHTML = `
    <div class="frequencia-page">
      <section class="frequencia-summary">
        ${cardResumo("Frequência geral", "94.2%", "Boa situação", "ok")}
        ${cardResumo("Presenças", "48", "Aulas confirmadas", "ok")}
        ${cardResumo("Atrasos", "3", "Registros no período", "warn")}
        ${cardResumo("Faltas", "1", "No mês atual", "danger")}
      </section>

      <section class="frequencia-layout">
        <article class="card frequencia-table-card">
          <div class="frequencia-header">
            <div>
              <h2>Histórico de Frequência</h2>
              <p>Consulte suas presenças, atrasos, faltas e validações biométricas.</p>
            </div>

            <div class="frequencia-filtros">
              <button class="filter-btn">Todas as disciplinas ▾</button>
              <button class="filter-btn">Último mês ▾</button>
              <button class="filter-btn">Todos os status ▾</button>
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

              <tbody>
                ${linhaFrequencia("27 ABR", "Projetos", "Wesley Pescoraro", "10:02", "Presente", "Biometria facial", "ok")}
                ${linhaFrequencia("27 ABR", "PDM", "Paulo Netto", "14:00", "Presente", "Biometria facial", "ok")}
                ${linhaFrequencia("26 ABR", "Banco de Dados", "Marcos Vinícius", "08:12", "Atraso", "Biometria facial", "warn")}
                ${linhaFrequencia("25 ABR", "Front-End", "Fabiana Comandini", "13:02", "Presente", "Manual", "ok")}
                ${linhaFrequencia("24 ABR", "Projetos", "Wesley Pescoraro", "--", "Falta", "Sem registro", "danger")}
                ${linhaFrequencia("23 ABR", "PDM", "Paulo Netto", "14:03", "Presente", "Biometria facial", "ok")}
              </tbody>
            </table>
          </div>
        </article>

        <aside class="frequencia-side">
          <article class="card frequencia-risk-card">
            <h3>Situação do aluno</h3>

            <div class="risk-circle">
              <strong>94%</strong>
              <span>frequência</span>
            </div>

            <p class="risk-text">
              Sua frequência está acima do mínimo exigido. Continue acompanhando seus registros.
            </p>

            <div class="risk-info-list">
              <div>
                <span>Mínimo exigido</span>
                <strong>75%</strong>
              </div>

              <div>
                <span>Status</span>
                <strong class="status-good">Regular</strong>
              </div>
            </div>
          </article>

          <article class="card frequencia-bio-card">
            <h3>Última validação</h3>

            <div class="last-bio-box">
              <span class="bio-icon">◉</span>
              <strong>Reconhecido com sucesso</strong>
              <p>Projetos • 27 ABR • 10:02</p>
            </div>

            <button class="outline-btn" id="btnIrChamada">
              Ir para chamada facial
            </button>
          </article>
        </aside>
      </section>
    </div>
  `;

  configurarAtalhoChamada();
}

function cardResumo(titulo, valor, detalhe, tipo) {
  return `
    <article class="card frequencia-card frequencia-card--${tipo}">
      <span>${titulo}</span>
      <strong>${valor}</strong>
      <small>${detalhe}</small>
    </article>
  `;
}

function linhaFrequencia(data, disciplina, professor, horario, status, registro, tipo) {
  return `
    <tr>
      <td><strong>${data}</strong></td>
      <td>${disciplina}</td>
      <td>${professor}</td>
      <td>${horario}</td>
      <td>
        <span class="freq-status freq-status--${tipo}">
          ${status}
        </span>
      </td>
      <td>${registro}</td>
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