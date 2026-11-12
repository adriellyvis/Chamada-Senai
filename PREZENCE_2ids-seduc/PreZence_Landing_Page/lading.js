document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.querySelector('.menu-toggle'),menu=document.querySelector('.nav-menu');
  toggle?.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');toggle.innerHTML=open?'<i class="fa-solid fa-xmark" aria-hidden="true"></i>':'<i class="fa-solid fa-bars" aria-hidden="true"></i>'});
  menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Abrir menu');if(toggle)toggle.innerHTML='<i class="fa-solid fa-bars" aria-hidden="true"></i>'}));
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12});
  document.querySelectorAll('.section-heading,.feature-card,.intro-grid,.contrast-panel,.flow-node,.tech-item,.team-card,.closing-card').forEach(el=>{el.classList.add('animate');observer.observe(el)});
  const roles={
    student:{label:'ÁREA DO ALUNO',title:'Acompanhe sua presença.',desc:'Uma visão clara da frequência, das chamadas disponíveis e das informações acadêmicas do estudante.',points:['Solicitação de presença','Consulta de frequência','Avisos e informações'],avatar:'AM',user:'Ana Martins',greeting:'BEM-VINDA DE VOLTA',heading:'Olá, Ana!',stat:'92%',records:'24',pending:'02',panel:'Últimas atividades',rows:['Matemática','História','Biologia']},
    teacher:{label:'ÁREA DO PROFESSOR',title:'A turma sob sua orientação.',desc:'Acompanhe solicitações, confira registros e conduza a consolidação das chamadas.',points:['Acompanhamento de solicitações','Conferência e ajustes','Relatórios de frequência'],avatar:'RC',user:'Rafael Costa',greeting:'PAINEL DO DOCENTE',heading:'Olá, professor!',stat:'03',records:'28',pending:'05',panel:'Chamadas recentes',rows:['2º A • Matemática','1º B • História','3º A • Biologia']},
    manager:{label:'ÁREA DO GESTOR',title:'Uma visão ampla da instituição.',desc:'Informações organizadas para apoiar a gestão de usuários, turmas e indicadores de frequência.',points:['Gestão de usuários e turmas','Acompanhamento de frequência','Visão administrativa'],avatar:'MC',user:'Marina Costa',greeting:'PAINEL ADMINISTRATIVO',heading:'Bem-vinda, Marina!',stat:'18',records:'642',pending:'07',panel:'Atividade institucional',rows:['Turmas cadastradas','Alunos ativos','Solicitações abertas']}
  };
  const fields={label:'role-label',title:'role-title',description:'role-description',avatar:'mock-avatar',user:'mock-user',greeting:'mock-greeting',heading:'mock-heading',stat:'mock-stat',records:'mock-records',pending:'mock-pending',panel:'mock-panel-title'};
  const tabs=[...document.querySelectorAll('.role-tab')],panel=document.getElementById('role-panel');
  const selectTab=btn=>{
    tabs.forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-selected',String(b===btn));b.tabIndex=b===btn?0:-1});
    panel?.setAttribute('aria-labelledby',btn.id);
    const r=roles[btn.dataset.role];Object.entries(fields).forEach(([k,id])=>{const el=document.getElementById(id);if(el)el.textContent=r[k]});
    ['one','two','three'].forEach((n,i)=>{const el=document.getElementById('mock-row-'+n);if(el)el.innerHTML=r.rows[i]+' <small>'+(i===0?'Hoje, 08:00':i===1?'Hoje, 10:00':'Ontem, 13:30')+'</small>'});
    document.getElementById('mock-avatar').textContent=r.avatar;
    const pointList=document.getElementById('role-points');if(pointList)pointList.innerHTML=r.points.map(p=>'<li><i class="fa-solid fa-check" aria-hidden="true"></i> '+p+'</li>').join('');
  };
  tabs.forEach((btn,i)=>{
    btn.addEventListener('click',()=>selectTab(btn));
    btn.addEventListener('keydown',e=>{
      const next={ArrowRight:(i+1)%tabs.length,ArrowLeft:(i-1+tabs.length)%tabs.length,Home:0,End:tabs.length-1}[e.key];
      if(next===undefined)return;
      e.preventDefault();tabs[next].focus();selectTab(tabs[next]);
    });
  });
  const header=document.querySelector('.site-header');window.addEventListener('scroll',()=>header.classList.toggle('scrolled',window.scrollY>12),{passive:true});
});
