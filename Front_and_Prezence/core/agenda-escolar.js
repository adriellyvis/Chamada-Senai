import {
  listarEventosAgenda, salvarEventoAgenda, excluirEventoAgenda,
  podeGerenciarEvento, demoAgendaAtiva, desativarDemoAgenda, limparDadosDemoAgenda, mensagemErroAgenda
} from './agenda-eventos-api.js';

const NOMES_MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const CATEGORIAS = {
  REUNIAO: ['Reunião', 'users'],
  AVALIACAO: ['Avaliação', 'graduation-cap'],
  PRAZO: ['Prazo / entrega', 'alarm-clock'],
  EVENTO: ['Evento escolar', 'calendar-days'],
  PLANEJAMENTO: ['Planejamento', 'clipboard-list'],
  OUTROS: ['Outros', 'bookmark']
};
const AUDIENCIAS = {
  TODOS: 'Todos os perfis',
  ALUNOS: 'Somente alunos',
  PROFESSORES: 'Somente professores',
  PRIVADO: 'Privado para mim'
};

const esc = valor => String(valor ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const pad = n => String(n).padStart(2, '0');
const chaveData = data => `${data.getFullYear()}-${pad(data.getMonth()+1)}-${pad(data.getDate())}`;
const extrairDia = valor => String(valor || '').slice(0,10);
const dataLocal = data => new Date(`${data}T12:00:00`);
const dataPorExtenso = valor => dataLocal(valor).toLocaleDateString('pt-BR', {weekday:'long', day:'numeric',month:'long'});
const periodo = evento => `${esc(String(evento.inicio).slice(11,16))}–${esc(String(evento.fim).slice(11,16))}`;

/** @param {{perfil:'gestor'|'professor', usuario:object, container:HTMLElement}} contexto */
export async function abrirAgendaEscolar({ perfil, usuario, container }) {
  if (!container) return;
  const agora = new Date();
  const estado = {
    mes: new Date(agora.getFullYear(), agora.getMonth(), 1),
    dia: chaveData(agora),
    visualizacao: 'MES',
    filtro: 'TODOS',
    busca: '',
    eventos: [],
    erro: null
  };

  let versaoCarregamento = 0;
  async function atualizar() {
    const versao = ++versaoCarregamento;
    const ano = estado.mes.getFullYear();
    const mes = estado.mes.getMonth();
    // Inclui seis dias adjacentes para que a semana que cruza um mês não fique incompleta.
    const inicio = chaveData(new Date(ano,mes,1-6));
    const fim = chaveData(new Date(ano,mes+1,6));
    container.innerHTML = '<div class="agenda-escolar"><p class="ae-loading">Carregando agenda...</p></div>';
    const elementoCarregando = container.firstElementChild;
    try {
      const eventos = await listarEventosAgenda(usuario, inicio, fim);
      if (versao !== versaoCarregamento) return;
      estado.eventos = eventos;
      estado.erro = null;
    } catch (erro) {
      if (versao !== versaoCarregamento) return;
      estado.erro = erro;
      estado.eventos = [];
    }
    // Se a navegação já substituiu o conteúdo, não reabre a agenda com uma resposta atrasada.
    if (!elementoCarregando?.isConnected || !container.contains(elementoCarregando)) return;
    renderizar();
  }

  function filtrados() {
    return estado.eventos.filter(evento => {
      const proprio = podeGerenciarEvento(evento,usuario);
      if (estado.filtro === 'MEUS' && !proprio) return false;
      if (estado.filtro === 'INSTITUCIONAL' && evento.visibilidade === 'PRIVADO') return false;
      if (estado.filtro === 'PRIVADO' && evento.visibilidade !== 'PRIVADO') return false;
      const consulta = estado.busca.toLocaleLowerCase('pt-BR').trim();
      return !consulta || `${evento.titulo} ${evento.descricao || ''} ${evento.local || ''}`.toLocaleLowerCase('pt-BR').includes(consulta);
    });
  }

  function eventosNoDia(dia, eventos) {
    return eventos.filter(item => extrairDia(item.inicio) <= dia && extrairDia(item.fim) >= dia);
  }

  function renderizar() {
    const ano = estado.mes.getFullYear();
    const mesNumero = estado.mes.getMonth();
    const mes = `${ano}-${pad(mesNumero+1)}`;
    const eventos = filtrados();
    const noMes = estado.eventos.filter(item => extrairDia(item.inicio) <= chaveData(new Date(ano,mesNumero+1,0)) && extrairDia(item.fim) >= `${mes}-01`);
    const meus = noMes.filter(item => podeGerenciarEvento(item, usuario));
    const institucionais = noMes.filter(item => item.visibilidade !== 'PRIVADO');
    const hoje = chaveData(new Date());
    const proximos = noMes.filter(item => extrairDia(item.fim) >= hoje && extrairDia(item.inicio) <= chaveData(new Date(Date.now()+7*86400000)));
    container.innerHTML = `
      <section class="agenda-escolar" aria-label="Agenda escolar">
        <header class="ae-cabecalho">
          <div><span class="ae-sobretitulo">ORGANIZAÇÃO ESCOLAR</span><h1>Agenda</h1>
            <p>${perfil === 'gestor' ? 'Organize compromissos e comunicados da instituição.' : 'Acompanhe o calendário institucional e organize seus compromissos privados.'}</p>
          </div>
          <button class="ae-btn ae-btn-primario" type="button" data-ae="novo" ${estado.erro ? 'disabled title="Conecte a API da agenda para criar eventos"' : ''}>+ Nova marcação</button>
        </header>
        ${demoAgendaAtiva() ? `<div class="ae-aviso" role="status"><strong>Modo demonstração de desenvolvimento.</strong> Nenhum evento será enviado ao banco. <button type="button" data-ae="limpar-demo">Apagar testes</button><button type="button" data-ae="sair-demo">Usar eventos do servidor</button></div>` : ''}
        ${estado.erro ? `<div class="ae-falha" role="alert"><strong>Não foi possível carregar os eventos.</strong><p>${esc(mensagemErroAgenda(estado.erro))}</p><button class="ae-btn ae-btn-secundario" type="button" data-ae="recarregar">Tentar novamente</button></div>` : ''}
        <div class="ae-indicadores">
          <article><span>Eventos do mês</span><strong>${estado.erro ? '—' : noMes.length}</strong><small>${estado.erro ? 'API não conectada' : 'Visíveis para você'}</small></article>
          <article><span>Próximos 7 dias (no mês)</span><strong>${estado.erro ? '—' : proximos.length}</strong><small>Compromissos e avisos</small></article>
          <article><span>${perfil === 'gestor' ? 'Meus eventos' : 'Marcações privadas'}</span><strong>${estado.erro ? '—' : (perfil === 'gestor' ? meus.length : meus.filter(item => item.visibilidade === 'PRIVADO').length)}</strong><small>Criados por você</small></article>
          <article><span>Institucionais</span><strong>${estado.erro ? '—' : institucionais.length}</strong><small>Publicados pelo gestor</small></article>
        </div>
        <div class="ae-toolbar">
          <div class="ae-troca-mes"><button type="button" data-ae="anterior" aria-label="${estado.visualizacao === 'SEMANA' ? 'Semana anterior' : 'Mês anterior'}">‹</button><h2>${NOMES_MESES[mesNumero]} ${ano}</h2><button type="button" data-ae="proximo" aria-label="${estado.visualizacao === 'SEMANA' ? 'Próxima semana' : 'Próximo mês'}">›</button><button type="button" class="ae-hoje" data-ae="hoje">Hoje</button></div>
          <div class="ae-filtros"><div class="ae-visualizacoes" role="group" aria-label="Visualização do calendário">${[['MES','Mês'],['SEMANA','Semana'],['LISTA','Lista']].map(([codigo,nome]) => `<button type="button" data-ae="visualizacao" data-visualizacao="${codigo}" aria-pressed="${estado.visualizacao === codigo}" class="${estado.visualizacao === codigo ? 'ae-vis-ativa' : ''}">${nome}</button>`).join('')}</div><label>Filtrar <select id="ae-filtro"><option value="TODOS">Todos os eventos</option><option value="INSTITUCIONAL">Institucionais</option><option value="MEUS">Criados por mim</option><option value="PRIVADO">Privados</option></select></label><label>Buscar <input id="ae-busca" type="search" placeholder="Título, descrição ou local..." value="${esc(estado.busca)}" /></label></div>
        </div>
        <div class="ae-paineis ${estado.visualizacao === 'LISTA' ? 'ae-modo-lista' : ''}">
          <section class="ae-calendario" aria-label="Calendário ${estado.visualizacao === 'MES' ? 'mensal' : estado.visualizacao === 'SEMANA' ? 'semanal' : 'em lista'}">
            <div class="ae-calendario-conteudo">${gerarVisualizacao(ano,mesNumero,mes,eventos,hoje)}</div>
            <footer class="ae-legenda"><span><b class="ae-ponto ae-ponto-institucional"></b> Institucional</span><span><b class="ae-ponto ae-ponto-privado"></b> Privado</span></footer>
          </section>
          <aside class="ae-lateral">
            <div class="ae-painel-titulo"><div><small>AGENDA DO DIA</small><h3>${esc(dataPorExtenso(estado.dia))}</h3></div><button class="ae-btn ae-btn-curto" data-ae="novo" type="button" ${estado.erro ? 'disabled' : ''}>+ Adicionar</button></div>
            <div class="ae-lista-dia">${estado.erro ? '<p class="ae-vazio">Sem dados: agenda não sincronizada.</p>' : cartoes(eventosNoDia(estado.dia,eventos),'Nenhum compromisso para esta data.')}</div>
            <div class="ae-painel-titulo ae-painel-titulo-segundo"><div><small>VISÃO DO MÊS</small><h3>Próximos compromissos</h3></div></div>
            <div class="ae-lista-mes">${estado.erro ? '<p class="ae-vazio">Sem dados: agenda não sincronizada.</p>' : cartoes(eventos.filter(item => extrairDia(item.fim) >= estado.dia).slice(0,8),'Nenhum compromisso a partir desta data.')}</div>
          </aside>
        </div>
      </section>`;
    container.querySelector('#ae-filtro').value = estado.filtro;
    container.querySelector('#ae-filtro').addEventListener('change', e => { estado.filtro = e.target.value; renderizar(); });
    container.querySelector('#ae-busca').addEventListener('input', e => {
      estado.busca = e.target.value;
      // Atualiza somente a grade e listas para manter o foco e a posição do cursor.
      const atuais = filtrados();
      container.querySelector('.ae-calendario-conteudo').innerHTML = gerarVisualizacao(ano,mesNumero,mes,atuais,hoje);
      container.querySelector('.ae-lista-dia').innerHTML = cartoes(eventosNoDia(estado.dia,atuais),'Nenhum compromisso para esta data.');
      container.querySelector('.ae-lista-mes').innerHTML = cartoes(atuais.filter(item => extrairDia(item.fim) >= estado.dia).slice(0,8),'Nenhum compromisso a partir desta data.');
    });
    container.onclick = async e => {
      const alvo = e.target.closest('[data-ae]');
      if (!alvo || !container.contains(alvo)) return;
      const acao = alvo.dataset.ae;
      if (acao === 'novo') return abrirFormulario();
      if (acao === 'visualizacao') {
        if (!['MES','SEMANA','LISTA'].includes(alvo.dataset.visualizacao)) return;
        estado.visualizacao = alvo.dataset.visualizacao;
        return renderizar();
      }
      if (acao === 'recarregar') return atualizar();
      if (acao === 'sair-demo') { desativarDemoAgenda(); return atualizar(); }
      if (acao === 'limpar-demo') {
        if (confirm('Apagar TODAS as marcações da demonstração neste navegador?')) { limparDadosDemoAgenda(); return atualizar(); }
        return;
      }
      if (acao === 'anterior' || acao === 'proximo') {
        const delta = acao === 'anterior' ? -1 : 1;
        if (estado.visualizacao === 'SEMANA') {
          const dia = dataLocal(estado.dia);
          dia.setDate(dia.getDate() + (7*delta));
          estado.dia = chaveData(dia);
          const mudouMes = dia.getMonth() !== mesNumero || dia.getFullYear() !== ano;
          estado.mes = new Date(dia.getFullYear(),dia.getMonth(),1);
          return mudouMes ? atualizar() : renderizar();
        }
        estado.mes = new Date(ano,mesNumero+delta,1);
        estado.dia = chaveData(estado.mes);
        return atualizar();
      }
      if (acao === 'hoje') {
        estado.mes = new Date(new Date().getFullYear(),new Date().getMonth(),1);
        estado.dia = chaveData(new Date());
        return atualizar();
      }
      if (acao === 'dia') {
        estado.dia = alvo.dataset.dia;
        const dataEscolhida = dataLocal(estado.dia);
        if (dataEscolhida.getMonth() !== mesNumero || dataEscolhida.getFullYear() !== ano) {
          estado.mes = new Date(dataEscolhida.getFullYear(),dataEscolhida.getMonth(),1);
          return atualizar();
        }
        return renderizar();
      }
      if (acao === 'editar') {
        const evento = estado.eventos.find(item => String(item.id) === alvo.dataset.id);
        if (evento && podeGerenciarEvento(evento,usuario)) return abrirFormulario(evento);
      }
      if (acao === 'excluir') {
        const evento = estado.eventos.find(item => String(item.id) === alvo.dataset.id);
        if (!evento || !podeGerenciarEvento(evento,usuario)) return;
        if (!confirm(`Excluir a marcação "${evento.titulo}"?`)) return;
        try { await excluirEventoAgenda(usuario,evento); await atualizar(); }
        catch (erro) { alert(mensagemErroAgenda(erro)); }
      }
    };
  }

  function gerarVisualizacao(ano,mesNumero,mes,eventos,hoje) {
    if (estado.visualizacao === 'SEMANA') return gerarSemana(eventos,hoje);
    if (estado.visualizacao === 'LISTA') return gerarLista(ano,mesNumero,eventos);
    return `<div class="ae-dias-semana">${DIAS.map(d => `<span>${d}</span>`).join('')}</div><div class="ae-grade">${gerarGrade(ano,mesNumero,mes,eventos,hoje)}</div>`;
  }

  function gerarSemana(eventos,hoje) {
    const selecionado = dataLocal(estado.dia);
    const segunda = new Date(selecionado.getFullYear(),selecionado.getMonth(),selecionado.getDate() - (selecionado.getDay()+6)%7);
    const dias = Array.from({length:7},(_,i) => new Date(segunda.getFullYear(),segunda.getMonth(),segunda.getDate()+i));
    return `<div class="ae-semana-titulo">Semana de ${dias[0].toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})} a ${dias[6].toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</div><div class="ae-semana-grade">${dias.map((data,i)=>{
      const dia = chaveData(data);
      const compromissos = eventosNoDia(dia,eventos);
      return `<section class="ae-semana-coluna"><button type="button" data-ae="dia" data-dia="${dia}" class="ae-semana-dia ${dia===hoje ? 'ae-semana-hoje' : ''} ${dia===estado.dia ? 'ae-semana-selecionada' : ''}" aria-pressed="${dia===estado.dia}"><span>${DIAS[i]}</span><strong>${data.getDate()}</strong></button><div class="ae-semana-eventos">${compromissos.length ? compromissos.map(item => `<div class="ae-semana-chip ${item.visibilidade === 'PRIVADO' ? 'ae-semana-chip-privado' : ''}" title="${esc(item.titulo)}"><small>${esc(String(item.inicio).slice(11,16))}</small><strong>${esc(item.titulo)}</strong></div>`).join('') : '<span class="ae-semana-vazio">—</span>'}</div></section>`;
    }).join('')}</div>`;
  }

  function gerarLista(ano,mesNumero,eventos) {
    const primeiro = chaveData(new Date(ano,mesNumero,1));
    const ultimo = chaveData(new Date(ano,mesNumero+1,0));
    const itens = eventos.filter(item => extrairDia(item.inicio) <= ultimo && extrairDia(item.fim) >= primeiro);
    if (!itens.length) return `<p class="ae-vazio">Nenhum evento neste mês com os filtros selecionados.</p>`;
    const grupos = new Map();
    for (const evento of itens) {
      const dia = extrairDia(evento.inicio) < primeiro ? primeiro : extrairDia(evento.inicio);
      if (!grupos.has(dia)) grupos.set(dia,[]);
      grupos.get(dia).push(evento);
    }
    return `<div class="ae-lista-completa">${[...grupos].map(([dia,lista])=>`<section class="ae-lista-grupo"><button class="ae-lista-data" type="button" data-ae="dia" data-dia="${dia}">${esc(dataPorExtenso(dia))}</button>${cartoes(lista,'')}</section>`).join('')}</div>`;
  }

  function gerarGrade(ano,mesNumero,mes,eventos,hoje) {
    const primeiro = new Date(ano,mesNumero,1);
    const deslocamento = (primeiro.getDay()+6)%7;
    const fim = new Date(ano,mesNumero+1,0).getDate();
    const celulas = [];
    for (let i=0;i<deslocamento;i++) celulas.push('<span class="ae-celula-vazia" aria-hidden="true"></span>');
    for (let dia=1;dia<=fim;dia++) {
      const data = `${mes}-${pad(dia)}`;
      const eventosDia = eventosNoDia(data,eventos);
      const institucionais = eventosDia.some(ev => ev.visibilidade !== 'PRIVADO');
      const privados = eventosDia.some(ev => ev.visibilidade === 'PRIVADO');
      celulas.push(`<button type="button" class="ae-celula ${data === hoje ? 'ae-celula-hoje' : ''} ${data === estado.dia ? 'ae-celula-selecionada' : ''}" data-ae="dia" data-dia="${data}" aria-pressed="${data === estado.dia}" aria-label="Dia ${dia}, ${eventosDia.length} eventos"><strong>${dia}</strong><span class="ae-pontos">${institucionais ? '<i class="ae-ponto ae-ponto-institucional"></i>' : ''}${privados ? '<i class="ae-ponto ae-ponto-privado"></i>' : ''}</span>${eventosDia.length ? `<small>${eventosDia.length}</small>` : ''}</button>`);
    }
    while (celulas.length % 7 !== 0) celulas.push('<span class="ae-celula-vazia" aria-hidden="true"></span>');
    return celulas.join('');
  }

  function cartoes(eventos, mensagem) {
    if (!eventos.length) return `<p class="ae-vazio">${esc(mensagem)}</p>`;
    return eventos.map(item => {
      const podeEditar = podeGerenciarEvento(item,usuario);
      const institucional = item.visibilidade !== 'PRIVADO';
      const tituloTipo = CATEGORIAS[item.tipo]?.[0] || 'Compromisso';
      return `<article class="ae-evento ${institucional ? 'ae-evento-institucional' : 'ae-evento-privado'}">
        <div class="ae-evento-superior"><span class="ae-tag">${esc(tituloTipo)}</span><time>${esc(extrairDia(item.inicio).split('-').reverse().join('/'))} · ${periodo(item)}</time></div>
        <h4>${esc(item.titulo)}</h4>${item.descricao ? `<p>${esc(item.descricao)}</p>` : ''}
        ${item.local ? `<span class="ae-local">Local: ${esc(item.local)}</span>` : ''}
        <div class="ae-evento-footer"><span>${esc(AUDIENCIAS[item.visibilidade] || 'Institucional')}</span>
        ${podeEditar ? `<div class="ae-acoes"><button type="button" data-ae="editar" data-id="${esc(item.id)}" aria-label="Editar ${esc(item.titulo)}">Editar</button><button type="button" class="ae-excluir" data-ae="excluir" data-id="${esc(item.id)}" aria-label="Excluir ${esc(item.titulo)}">Excluir</button></div>` : '<span class="ae-somente-leitura">Somente leitura</span>'}</div>
      </article>`;
    }).join('');
  }

  function abrirFormulario(evento = null) {
    if (estado.erro) { alert(mensagemErroAgenda(estado.erro)); return; }
    const inicio = evento?.inicio?.slice(0,16) || `${estado.dia}T08:00`;
    const fim = evento?.fim?.slice(0,16) || `${estado.dia}T09:00`;
    const tipo = evento?.tipo || 'REUNIAO';
    const audiencia = evento?.visibilidade || 'PRIVADO';
    const caixa = document.createElement('dialog');
    caixa.className = 'ae-modal';
    caixa.innerHTML = `
      <form id="ae-formulario" class="ae-formulario">
        <div class="ae-modal-topo"><div><small>${evento ? 'EDITAR MARCAÇÃO' : 'NOVO COMPROMISSO'}</small><h2>${evento ? 'Editar evento' : 'Nova marcação'}</h2></div><button class="ae-fechar" type="button" aria-label="Fechar">×</button></div>
        <label>Título <input name="titulo" maxlength="120" minlength="3" required value="${esc(evento?.titulo || '')}" placeholder="Ex.: Conselho de classe"/></label>
        <div class="ae-form-duas"><label>Categoria <select name="tipo">${Object.entries(CATEGORIAS).map(([cod,[nome]]) => `<option value="${cod}" ${cod===tipo?'selected':''}>${esc(nome)}</option>`).join('')}</select></label>
        <label>Quem pode visualizar? <select name="visibilidade">${Object.entries(AUDIENCIAS).filter(([cod]) => perfil === 'gestor' || cod === 'PRIVADO').map(([cod,nome]) => `<option value="${cod}" ${cod===audiencia?'selected':''}>${esc(nome)}</option>`).join('')}</select></label></div>
        <div class="ae-form-duas"><label>Início <input name="inicio" type="datetime-local" value="${esc(inicio)}" required/></label><label>Fim <input name="fim" type="datetime-local" value="${esc(fim)}" required/></label></div>
        <label>Local (opcional) <input name="local" maxlength="120" value="${esc(evento?.local || '')}" placeholder="Sala, auditório ou online"/></label>
        <label>Observações (opcional) <textarea name="descricao" maxlength="1500" rows="4" placeholder="Informações importantes sobre o compromisso">${esc(evento?.descricao || '')}</textarea></label>
        <p class="ae-form-alerta">${perfil === 'gestor' ? 'A visibilidade define quais perfis receberão este evento na agenda. Seus eventos privados ficam só na sua agenda.' : 'Suas marcações serão sempre privadas. Eventos publicados pelo gestor são somente leitura.'}</p>
        <div id="ae-form-feedback" class="ae-form-feedback" role="alert" hidden></div>
        <div class="ae-form-acoes"><button type="button" class="ae-btn ae-btn-secundario ae-cancelar">Cancelar</button><button type="submit" class="ae-btn ae-btn-primario">${evento ? 'Salvar alterações' : 'Criar marcação'}</button></div>
      </form>`;
    document.body.appendChild(caixa);
    const fechar = () => { caixa.close(); caixa.remove(); };
    caixa.querySelector('.ae-fechar').onclick = fechar;
    caixa.querySelector('.ae-cancelar').onclick = fechar;
    caixa.addEventListener('cancel', e => { e.preventDefault(); fechar(); });
    caixa.addEventListener('click', e => { if (e.target === caixa) fechar(); });
    caixa.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.currentTarget;
      const feedback = caixa.querySelector('#ae-form-feedback');
      const botoes = form.querySelectorAll('button');
      const valores = Object.fromEntries(new FormData(form).entries());
      if (valores.inicio >= valores.fim) {
        feedback.textContent = 'O horário final deve ser posterior ao início.';
        feedback.hidden = false;
        return;
      }
      const conflito = estado.eventos.some(item => item.id !== evento?.id && podeGerenciarEvento(item, usuario) &&
        item.inicio < valores.fim && item.fim > valores.inicio);
      if (conflito && !confirm('Já existe uma marcação sua nesse horário. Deseja salvar mesmo assim?')) return;
      botoes.forEach(botao => botao.disabled = true);
      try {
        await salvarEventoAgenda(usuario,valores,evento?.id,evento);
        const novaData = extrairDia(valores.inicio);
        estado.mes = new Date(Number(novaData.slice(0,4)),Number(novaData.slice(5,7))-1,1);
        estado.dia = novaData;
        fechar();
        await atualizar();
      } catch (erro) {
        feedback.textContent = mensagemErroAgenda(erro);
        feedback.hidden = false;
        botoes.forEach(botao => botao.disabled = false);
      }
    });
    caixa.showModal();
    caixa.querySelector('input[name="titulo"]').focus();
  }

  await atualizar();
}
