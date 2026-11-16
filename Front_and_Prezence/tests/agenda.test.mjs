/** Execute: node --test tests/agenda.test.mjs (não depende de internet). */
import test from 'node:test';
import assert from 'node:assert/strict';

class MemStorage {
  #map = new Map();
  getItem(chave) { return this.#map.get(chave) ?? null; }
  setItem(chave,valor) { this.#map.set(chave,String(valor)); }
  removeItem(chave) { this.#map.delete(chave); }
}
globalThis.window = { location: { hostname: 'localhost', protocol: 'http:' }, PREZENCE_AGENDA_PERMITIR_DEMO: true };
globalThis.localStorage = new MemStorage();
globalThis.sessionStorage = new MemStorage();
const agenda = await import('../core/agenda-eventos-api.js');

const gestor = {id:1,perfil:'gestor',nome:'Gestor'};
const outroGestor = {id:5,perfil:'gestor',nome:'Outro gestor'};
const professor = {id:2,perfil:'professor',nome:'Professor'};
const outroProfessor = {id:6,perfil:'professor',nome:'Outro professor'};
const aluno = {id:3,perfil:'aluno',nome:'Aluno'};
const dados = (titulo,visibilidade) => ({
  titulo, visibilidade, tipo:'REUNIAO', local:'Sala 20', descricao:'Acontecimento escolar',
  inicio:'2026-11-20T09:00',fim:'2026-11-20T10:00'
});
const titulos = async pessoa => (await agenda.listarEventosAgenda(pessoa,'2026-11-01','2026-11-30'))
  .map(item => item.titulo);

agenda.ativarDemoAgenda();

test('gestor controla audiência, docente cria somente privados', async () => {
  await agenda.salvarEventoAgenda(gestor,dados('Para todos','TODOS'));
  await agenda.salvarEventoAgenda(gestor,dados('Para alunos','ALUNOS'));
  await agenda.salvarEventoAgenda(gestor,dados('Para professores','PROFESSORES'));
  await agenda.salvarEventoAgenda(gestor,dados('Meu privado gestor','PRIVADO'));
  await agenda.salvarEventoAgenda(professor,dados('Meu privado professor','PRIVADO'));
  await assert.rejects(agenda.salvarEventoAgenda(professor,dados('Tentativa pública','TODOS')),/privadas/);
  await assert.rejects(agenda.salvarEventoAgenda(aluno,dados('Aluno publica','PRIVADO')),/Apenas gestores e professores/);
});

test('gestor não visualiza privados de professores nem de outro gestor', async () => {
  const publicados = await titulos(gestor);
  assert.deepEqual(publicados.sort(), ['Para todos','Para alunos','Para professores','Meu privado gestor'].sort());
  const outro = await titulos(outroGestor);
  assert.deepEqual(outro.sort(), ['Para todos','Para alunos','Para professores'].sort());
});

test('professor só visualiza todos, professores e seus próprios privados', async () => {
  assert.deepEqual((await titulos(professor)).sort(), ['Para todos','Para professores','Meu privado professor'].sort());
  assert.deepEqual((await titulos(outroProfessor)).sort(), ['Para todos','Para professores'].sort());
});

test('aluno só visualiza todos e alunos', async () => {
  assert.deepEqual((await titulos(aluno)).sort(), ['Para todos','Para alunos'].sort());
});

test('editar e excluir exigem autor; impedir edição de evento institucional por docente', async () => {
  const eventos = await agenda.listarEventosAgenda(professor,'2026-11-01','2026-11-30');
  const institucional = eventos.find(item => item.titulo === 'Para todos');
  const meu = eventos.find(item => item.titulo === 'Meu privado professor');
  assert.equal(agenda.podeGerenciarEvento(institucional,professor),false);
  await assert.rejects(agenda.salvarEventoAgenda(professor,dados('Alteração','PRIVADO'),institucional.id,institucional),/só pode editar/);
  await assert.rejects(agenda.excluirEventoAgenda(professor,institucional),/não pode excluir/);
  await agenda.salvarEventoAgenda(professor,dados('Privado alterado','PRIVADO'),meu.id,meu);
  assert.ok((await titulos(professor)).includes('Privado alterado'));
  const atual = (await agenda.listarEventosAgenda(professor,'2026-11-01','2026-11-30')).find(item => item.titulo === 'Privado alterado');
  await agenda.excluirEventoAgenda(professor,atual);
  assert.ok(!(await titulos(professor)).includes('Privado alterado'));
});

test('rejeita horários inválidos e visibilidades adulteradas', async () => {
  await assert.rejects(agenda.salvarEventoAgenda(gestor,{...dados('Invalido','TODOS'),fim:'2026-11-20T08:00'}),/posteriores/);
  await assert.rejects(agenda.salvarEventoAgenda(gestor,dados('Invalido','ADMIN_ONLY')),/inválida/);
});


test('não substitui erros de autenticação e permissão por uma prévia fictícia', () => {
  assert.equal(agenda.erroPermiteDemo({status:401}),false);
  assert.equal(agenda.erroPermiteDemo({status:403}),false);
  assert.equal(agenda.erroPermiteDemo({codigo:'SESSAO_EXPIRADA'}),false);
  assert.equal(agenda.erroPermiteDemo({status:404}),true);
  assert.equal(agenda.erroPermiteDemo({codigo:'API_OFFLINE'}),true);
});
