export function abrirDashboardAluno(container) {
  container.innerHTML = `
    <div class="dashboard-page">
      <section class="dashboard-layout">
        <div class="dashboard-main-column">
          <div class="dashboard-stats">
            ${cardStat("♙", "Sua média", "94.2%", "+2.4%")}
            ${cardStat("♙", "Faltas no mês", "1")}
            ${cardStat("▦", "Aulas assistidas", "48")}
          </div>

          <article class="card chart-card">
            <div class="dashboard-filter-row">
              <button class="filter-btn">Desempenho por unidade curricular ▾</button>
              <button class="filter-btn">Último mês ▾</button>
            </div>

            <div class="chart-content">
              <div class="pie-chart">
                <span class="pie-label pie-label--faltas">Faltas<br>5%</span>
                <span class="pie-label pie-label--atrasos">Atrasos<br>10%</span>
                <span class="pie-label pie-label--presencas">Presenças<br>85%</span>
              </div>

              <div class="chart-legend">
                <p><span class="legend-dot blue"></span> Presenças (85%)</p>
                <p><span class="legend-dot yellow"></span> Atrasos (10%)</p>
                <p><span class="legend-dot red"></span> Faltas (5%)</p>
              </div>
            </div>
          </article>
        </div>

        <aside class="dashboard-right-column">
          <article class="card today-card">
            <h3>Horário de Hoje</h3>

            <div class="timeline">
              <div class="timeline-item is-current">
                <span class="timeline-dot"></span>
                <div>
                  <strong>ACONTECENDO AGORA</strong>
                  <h4>Projetos<br><span>(Wesley)</span></h4>
                  <p>10h00 - 14h00 • Sala 01</p>
                </div>
              </div>

              <div class="timeline-item">
                <span class="timeline-dot"></span>
                <div>
                  <strong>PRÓXIMA AULA</strong>
                  <h4>PDM<br><span>(Paulo)</span></h4>
                  <p>14h00 - 17h00 • Sala 02</p>
                </div>
              </div>
            </div>
          </article>

          <div class="dashboard-side-grid">
            <article class="card biometric-list-card">
              <div class="card-title-center">
                <span>◉</span>
                <h3>Últimos Registros<br>Biométricos</h3>
              </div>

              <div class="bio-records">
                ${registroBio("27 ABR", "PROGRAMAÇÃO PARA DISPOSITIVOS MÓVEIS", "Paulo Netto", "14:00", "blue")}
                ${registroBio("27 ABR", "PROJETOS", "Wesley Pescoraro", "12:57", "blue")}
                ${registroBio("27 ABR", "PROGRAMAÇÃO ORIENTADA À OBJETOS", "Paulo Netto", "07:54", "blue")}
                ${registroBio("20 ABR", "PROGRAMAÇÃO FRONT-END", "Fabiana Comandini", "13:02", "yellow")}
              </div>
            </article>

            <article class="card notice-card">
              <div class="notice-title">
                <span>📣</span>
                <h3>Mural de<br>Avisos</h3>
              </div>

              <div class="notice-item">
                <strong>27 ABR • SECRETARIA</strong>
                <p><b>Lembrete:</b> Renovação de matrícula disponível até sexta.</p>
              </div>

              <div class="notice-item">
                <strong>25 ABR • COORDENAÇÃO</strong>
                <p>Palestra de IA às 19h no auditório principal.</p>
              </div>

              <button class="see-all-btn">ver todos os avisos</button>
            </article>
          </div>
        </aside>
      </section>
    </div>
  `;
}

function cardStat(icon, label, value, badge = "") {
  return `
    <article class="card stat-card">
      <span class="stat-card__icon">${icon}</span>

      <div>
        <span class="stat-card__label">${label}</span>
        <strong class="stat-card__value">${value}</strong>
      </div>

      ${badge ? `<span class="stat-card__badge">${badge}</span>` : ""}
    </article>
  `;
}

function registroBio(data, disciplina, professor, horario, color) {
  return `
    <div class="bio-record bio-record--${color}">
      <strong>${data}</strong>
      <h4>${disciplina}</h4>
      <div>
        <span>${professor}</span>
        <span>${horario}</span>
      </div>
    </div>
  `;
}