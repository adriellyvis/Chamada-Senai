/** Execute: node --test tests/agenda*.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';

class MemStorage {
  #map = new Map();
  getItem(k) { return this.#map.get(k) ?? null; }
  setItem(k, v) { this.#map.set(k, String(v)); }
  removeItem(k) { this.#map.delete(k); }
}

globalThis.window = {
  location: { hostname: 'localhost', protocol: 'http:', href: '' },
  PREZENCE_AGENDA_PERMITIR_DEMO: false
};
globalThis.localStorage = new MemStorage();
globalThis.sessionStorage = new MemStorage();
sessionStorage.setItem('usuario', JSON.stringify({id: 10, nome:'Gestora', perfil:'gestor', token:'token-de-teste'}));
// Prova que o antigo modo local não será usado após a migração para o banco.
sessionStorage.setItem('prezence:agenda:demo:ativo','1');

const { listarEventosAgenda, salvarEventoAgenda, excluirEventoAgenda,
  demoAgendaAtiva, ativarDemoAgenda, mensagemErroAgenda } = await import('../core/agenda-eventos-api.js');
const gestor = {id:10, nome:'Gestora', perfil:'gestor'};
const professor = {id:20, nome:'Professor', perfil:'professor'};
const data = {titulo:'Conselho de classe', descricao:'Pauta', tipo:'REUNIAO',
  local:'Sala 12', inicio:'2026-11-23T14:00', fim:'2026-11-23T15:00', visibilidade:'PROFESSORES'};
const item = { ...data, id:77, criadorId:10, criadorNome:'Gestora', criadorPerfil:'gestor' };
let historico = [];
function mockFetch(handler) {
  historico = [];
  globalThis.fetch = async (url, options) => {
    historico.push({ url: String(url), options });
    return handler(String(url), options);
  };
}
function resposta(dados, status=200) {
  return {ok:status>=200&&status<300, status, text:async()=>JSON.stringify(dados)};
}

test('a agenda real é padrão: demonstração antiga desabilitada', () => {
  assert.equal(demoAgendaAtiva(), false);
  assert.throws(() => ativarDemoAgenda(), /desabilitada/);
});

test('GET usa URL do backend, intervalo, JWT e filtra por perfil', async () => {
  mockFetch(() => resposta([item, {...item, id:78, visibilidade:'ALUNOS'}]));
  const eventos = await listarEventosAgenda(professor,'2026-11-01','2026-11-30');
  assert.equal(eventos.length,1);
  assert.equal(eventos[0].id,77);
  assert.match(historico[0].url,/http:\/\/localhost:8080\/agenda\/eventos\?inicio=2026-11-01&fim=2026-11-30/);
  assert.equal(historico[0].options.headers.Authorization,'Bearer token-de-teste');
});

test('POST registra evento no servidor sem forjar autor', async () => {
  mockFetch(() => resposta(item,201));
  await salvarEventoAgenda(gestor, {...data, criadorId:500, criadorPerfil:'aluno', id:99});
  assert.equal(historico[0].options.method,'POST');
  const enviado=JSON.parse(historico[0].options.body);
  assert.deepEqual(Object.keys(enviado).sort(),['titulo','descricao','tipo','local','inicio','fim','visibilidade'].sort());
  assert.equal(enviado.visibilidade,'PROFESSORES');
});

test('PUT e DELETE usam o ID e respeitam autoria local', async () => {
  mockFetch((_,opcoes) => opcoes.method==='DELETE' ? {ok:true,status:204,text:async()=>''} : resposta(item));
  await salvarEventoAgenda(gestor, {...data, titulo:'Alterado'}, item.id, item);
  await excluirEventoAgenda(gestor,item);
  assert.equal(historico[0].url,'http://localhost:8080/agenda/eventos/77');
  assert.equal(historico[0].options.method,'PUT');
  assert.equal(historico[1].options.method,'DELETE');
  await assert.rejects(salvarEventoAgenda(professor,{...data,visibilidade:'PRIVADO'},item.id,item),/só pode editar/);
});

test('404 não retorna dados fictícios nem oculta falta da rota', async () => {
  mockFetch(() => resposta({mensagem:'Not Found'},404));
  await assert.rejects(listarEventosAgenda(gestor,'2026-11-01','2026-11-30'), erro => {
    assert.equal(erro.status,404);
    assert.match(mensagemErroAgenda(erro), /módulo Java/);
    return true;
  });
});

test('resposta incorreta do backend gera erro visível', async () => {
  mockFetch(() => resposta({content:[]}));
  await assert.rejects(listarEventosAgenda(gestor,'2026-11-01','2026-11-30'),/não retornou uma lista/);
  mockFetch(() => resposta([{id:1, titulo:'Erro'}]));
  await assert.rejects(listarEventosAgenda(gestor,'2026-11-01','2026-11-30'),/sem os campos esperados/);
});
