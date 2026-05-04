const chartData = {
  '2IDS-Seduc': {
    'Último mês': [
      { label: '2IDS-Seduc A', presence: 575, delay: 18, absent: 22 },
      { label: '2IDS-Seduc B', presence: 503, delay: 42, absent: 35 },
    ],
    'Último trimestre': [
      { label: '2IDS-Seduc A', presence: 1520, delay: 55, absent: 68 },
      { label: '2IDS-Seduc B', presence: 1380, delay: 91, absent: 104 },
    ],
    'Este ano': [
      { label: '2IDS-Seduc A', presence: 4800, delay: 180, absent: 210 },
      { label: '2IDS-Seduc B', presence: 4200, delay: 240, absent: 310 },
    ]
  },
  '3IDS-Tech': {
    'Último mês': [
      { label: '3IDS-Tech A', presence: 460, delay: 30, absent: 15 },
      { label: '3IDS-Tech B', presence: 510, delay: 22, absent: 28 },
    ],
    'Último trimestre': [
      { label: '3IDS-Tech A', presence: 1300, delay: 90, absent: 45 },
      { label: '3IDS-Tech B', presence: 1480, delay: 65, absent: 80 },
    ],
    'Este ano': [
      { label: '3IDS-Tech A', presence: 4100, delay: 300, absent: 150 },
      { label: '3IDS-Tech B', presence: 4600, delay: 200, absent: 250 },
    ]
  },
  '1IDS-Web': {
    'Último mês': [
      { label: '1IDS-Web A', presence: 390, delay: 10, absent: 8 },
      { label: '1IDS-Web B', presence: 420, delay: 16, absent: 12 },
      { label: '1IDS-Web C', presence: 350, delay: 25, absent: 30 },
    ],
    'Último trimestre': [
      { label: '1IDS-Web A', presence: 1100, delay: 30, absent: 24 },
      { label: '1IDS-Web B', presence: 1200, delay: 48, absent: 36 },
      { label: '1IDS-Web C', presence: 980, delay: 72, absent: 90 },
    ],
    'Este ano': [
      { label: '1IDS-Web A', presence: 3600, delay: 110, absent: 90 },
      { label: '1IDS-Web B', presence: 3900, delay: 155, absent: 120 },
      { label: '1IDS-Web C', presence: 3200, delay: 230, absent: 290 },
    ]
  }
};

const activities = [
  { name: 'Amanda', desc: 'Certificado de Atestado enviado', tag: 'Atestado', tagClass: 'cert', color: 'green' },
  { name: 'Lexander Silva', desc: 'Atrasou 2 minutos na aula', tag: 'Atraso', tagClass: 'delay', color: '' },
  { name: 'Lorena Lima da Silva', desc: 'Faltou à aula das 13h', tag: 'Falta', tagClass: 'absent', color: 'red' },
  { name: 'Carlos Edu', desc: 'Atrasou 15min — ontem', tag: 'Atraso', tagClass: 'delay', color: 'orange' },
];

function getInitials(name) { return name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase(); }

function renderActivities() {
  const list = document.getElementById('activityList');
  list.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="act-avatar ${a.color}">${getInitials(a.name)}</div>
      <div class="act-info">
        <div class="act-name">${a.name}</div>
        <div class="act-desc">${a.desc}</div>
      </div>
      <span class="act-tag ${a.tagClass}">${a.tag}</span>
    </div>
  `).join('');
}

function renderChart() {
  const turma = document.getElementById('turmaSelect').value;
  const periodo = document.getElementById('periodoSelect').value;
  const data = chartData[turma][periodo];

  const allVals = data.flatMap(d => [d.presence, d.delay, d.absent]);
  const max = Math.max(...allVals);
  const chartH = 220;
  const steps = 6;
  const stepVal = Math.ceil(max / steps / 50) * 50;

  // Gridlines
  const grid = document.getElementById('gridlines');
  grid.innerHTML = Array.from({length: steps+1}, (_,i) => `<div class="gridline"></div>`).join('');

  // Bars
  const chart = document.getElementById('barChart');
  chart.innerHTML = data.map((d, i) => {
    const ph = Math.round((d.presence / (stepVal * steps)) * chartH);
    const dh = Math.max(Math.round((d.delay / (stepVal * steps)) * chartH), d.delay > 0 ? 4 : 0);
    const ah = Math.max(Math.round((d.absent / (stepVal * steps)) * chartH), d.absent > 0 ? 4 : 0);
    const delay = i * 0.08;
    return `
      <div class="bar-group">
        <div class="bars-row">
          <div class="bar presence" style="height:${ph}px;animation-delay:${delay}s">
            <div class="tooltip">${d.presence} presenças</div>
          </div>
          <div class="bar delay" style="height:${dh}px;animation-delay:${delay+0.05}s">
            <div class="tooltip">${d.delay} atrasos</div>
          </div>
          <div class="bar absent" style="height:${ah}px;animation-delay:${delay+0.1}s">
            <div class="tooltip">${d.absent} faltas</div>
          </div>
        </div>
      </div>`;
  }).join('');

  // X-axis
  document.getElementById('xAxis').innerHTML = data.map(d =>
    `<div class="x-label">${d.label}</div>`
  ).join('');
}

document.getElementById('turmaSelect').addEventListener('change', renderChart);
document.getElementById('periodoSelect').addEventListener('change', renderChart);

// THEME TOGGLE
const html = document.documentElement;
const toggle = document.getElementById('themeToggle');
const sun = document.getElementById('iconSun');
const moon = document.getElementById('iconMoon');

toggle.addEventListener('click', () => {
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  sun.style.display = isDark ? 'none' : 'block';
  moon.style.display = isDark ? 'block' : 'none';
});

// Counter animation
function animateCount(el, target, suffix='') {
  let start = 0, duration = 1200, step = target / (duration / 16);
  const run = () => {
    start = Math.min(start + step, target);
    el.textContent = (Number.isInteger(target) ? Math.round(start) : start.toFixed(1)) + suffix;
    if (start < target) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

window.addEventListener('load', () => {
  animateCount(document.getElementById('statMedia'), 94.2, '%');
  animateCount(document.getElementById('statAlunos'), 124);
  animateCount(document.getElementById('statAulas'), 48);
  renderChart();
  renderActivities();
});

// Nav active state
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    // se não tiver login, volta pra tela inicial
    window.location.href = "/index.html";
    return;
  }

  // coloca o nome na tela
  document.querySelector(".name").textContent = usuario.nome;

  // coloca inicial no avatar
  document.querySelector(".avatar").textContent =
    usuario.nome.charAt(0).toUpperCase();
});