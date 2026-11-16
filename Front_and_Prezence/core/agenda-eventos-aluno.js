import { listarEventosAgenda, demoAgendaAtiva, mensagemErroAgenda } from './agenda-eventos-api.js';

const NOME_TIPO = {
  REUNIAO: 'Reunião', AVALIACAO: 'Avaliação', PRAZO: 'Prazo / entrega',
  EVENTO: 'Evento escolar', PLANEJAMENTO: 'Planejamento', OUTROS: 'Informação'
};
const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const chaveData = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

/** Mantém a grade semanal do aluno; acrescenta comunicados do gestor sem edição. */
export async function iniciarEventosInstitucionaisAluno(container, usuario) {
  if (!container) return;
  const secao = document.createElement('section');
  secao.className = 'ae-aluno-section';
  secao.setAttribute('aria-label','Eventos institucionais');
  secao.innerHTML = '<h2>Eventos da instituição</h2><p>Carregando comunicados...</p>';
  container.prepend(secao);
  const inicio = chaveData(new Date());
  const fim = chaveData(new Date(new Date().getFullYear(),new Date().getMonth()+2,0));

  async function carregar() {
    try {
      const eventos = (await listarEventosAgenda(usuario,inicio,fim)).filter(item => item.fim?.slice(0,10) >= inicio).slice(0,8);
      secao.innerHTML = `
        <div class="ae-aluno-header"><div><small>CALENDÁRIO INSTITUCIONAL</small><h2>Próximos eventos</h2><p>Compromissos e datas publicados pela gestão para os alunos.</p></div></div>
        ${demoAgendaAtiva() ? '<p class="ae-aluno-aviso">Modo demonstração: informações locais deste navegador, sem sincronização ou segurança do servidor. Não use dados reais.</p>' : ''}
        <div class="ae-aluno-lista">${eventos.length ? eventos.map(item => `
          <article class="ae-aluno-evento"><div class="ae-aluno-data"><strong>${esc(item.inicio?.slice(8,10))}</strong><span>${esc(new Date(`${item.inicio?.slice(0,10)}T12:00`).toLocaleDateString('pt-BR',{month:'short'}))}</span></div>
          <div><small>${esc(NOME_TIPO[item.tipo] || 'Evento')}</small><h3>${esc(item.titulo)}</h3>
          <p>${esc(item.descricao || 'Comunicado institucional')}</p>
          <span>${esc(item.inicio?.slice(11,16))} – ${esc(item.fim?.slice(11,16))}${item.local ? ` · ${esc(item.local)}` : ''}</span></div>
          </article>`).join('') : '<p class="ae-aluno-vazio">Nenhum evento institucional publicado para os próximos dias.</p>'}</div>`;
    } catch (erro) {
      secao.innerHTML = `<div class="ae-aluno-header"><div><small>CALENDÁRIO INSTITUCIONAL</small><h2>Próximos eventos</h2></div></div>
        <p class="ae-aluno-vazio">Eventos institucionais indisponíveis: ${esc(mensagemErroAgenda(erro))}</p>
        <button class="ae-btn ae-btn-secundario" id="ae-aluno-recarregar" type="button">Tentar novamente</button>`;
      secao.querySelector('#ae-aluno-recarregar')?.addEventListener('click', carregar);
    }
  }
  await carregar();
}
