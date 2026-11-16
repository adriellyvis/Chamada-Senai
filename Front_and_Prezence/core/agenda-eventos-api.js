/**
 * Agenda escolar do PreZence.
 * Produção: GET/POST/PUT/DELETE /agenda/eventos usando Bearer token via core/api.js.
 * Banco de dados: acessado exclusivamente pelo backend. O navegador nunca acessa MySQL diretamente.
 * Demonstração: desabilitada por padrão; liberada SOMENTE por configuração explícita de desenvolvimento.
 * O modo local não substitui autenticação/autorizações no servidor.
 */
import { request } from './api.js';

const CHAVE_DEMO = 'prezence:agenda:demo:eventos:v1';
const DEMO_PERMITIDA = window.PREZENCE_AGENDA_PERMITIR_DEMO === true;
const CHAVE_ATIVACAO = 'prezence:agenda:demo:ativo';
const VISIBILIDADES = new Set(['TODOS', 'ALUNOS', 'PROFESSORES', 'PRIVADO']);
const TIPOS = new Set(['REUNIAO', 'AVALIACAO', 'PRAZO', 'EVENTO', 'PLANEJAMENTO', 'OUTROS']);

export function demoAgendaAtiva() {
  return DEMO_PERMITIDA && sessionStorage.getItem(CHAVE_ATIVACAO) === '1';
}

export function ativarDemoAgenda() {
  if (!DEMO_PERMITIDA) throw new Error('A demonstração da agenda está desabilitada. Conecte a API do PreZence.');
  sessionStorage.setItem(CHAVE_ATIVACAO, '1');
}

export function desativarDemoAgenda() {
  sessionStorage.removeItem(CHAVE_ATIVACAO);
}

export function demoAgendaPermitida() {
  return DEMO_PERMITIDA;
}

export function limparDadosDemoAgenda() {
  localStorage.removeItem(CHAVE_DEMO);
}

function perfilNormalizado(usuario) {
  return String(usuario?.perfil || '').toLowerCase();
}

function idUsuario(usuario) {
  return String(usuario?.id ?? '');
}

function verificarSessao(usuario) {
  if (!idUsuario(usuario) || !['gestor', 'professor', 'aluno'].includes(perfilNormalizado(usuario))) {
    throw new Error('Sessão inválida para acessar a agenda.');
  }
}

// Defesa em profundidade da interface. Em produção, este filtro DEVE ocorrer no backend.
export function podeVisualizarEvento(evento, usuario) {
  const perfil = perfilNormalizado(usuario);
  const autor = String(evento.criadorId ?? '');
  const visibilidade = String(evento.visibilidade || '').toUpperCase();
  if (visibilidade === 'PRIVADO') {
    return autor !== '' && autor === idUsuario(usuario) &&
      String(evento.criadorPerfil || '').toLowerCase() === perfil;
  }
  if (perfil === 'gestor') return String(evento.criadorPerfil).toLowerCase() === 'gestor';
  if (String(evento.criadorPerfil).toLowerCase() !== 'gestor') return false;
  if (visibilidade === 'TODOS') return true;
  if (perfil === 'professor') return visibilidade === 'PROFESSORES';
  if (perfil === 'aluno') return visibilidade === 'ALUNOS';
  return false;
}

export function podeGerenciarEvento(evento, usuario) {
  const perfil = perfilNormalizado(usuario);
  return ['gestor', 'professor'].includes(perfil) &&
    String(evento.criadorId ?? '') === idUsuario(usuario) &&
    String(evento.criadorPerfil || '').toLowerCase() === perfil;
}

function carregarDemo() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_DEMO) || '[]');
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvarDemo(eventos) {
  localStorage.setItem(CHAVE_DEMO, JSON.stringify(eventos));
}

function dataHoraValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return false;
  const [ano, mes, dia, hora, minuto] = valor.split(/[-T:]/).map(Number);
  const data = new Date(ano, mes - 1, dia, hora, minuto);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 &&
    data.getDate() === dia && data.getHours() === hora && data.getMinutes() === minuto;
}

function validarEvento(dados, usuario) {
  const perfil = perfilNormalizado(usuario);
  if (!['gestor', 'professor'].includes(perfil)) throw new Error('Apenas gestores e professores criam eventos.');
  const titulo = String(dados.titulo || '').trim();
  const descricao = String(dados.descricao || '').trim();
  const local = String(dados.local || '').trim();
  const inicio = String(dados.inicio || '');
  const fim = String(dados.fim || '');
  const visibilidade = String(dados.visibilidade || 'PRIVADO').toUpperCase();
  const tipo = String(dados.tipo || 'OUTROS').toUpperCase();
  if (titulo.length < 3 || titulo.length > 120) throw new Error('O título precisa ter de 3 a 120 caracteres.');
  if (descricao.length > 1500 || local.length > 120) throw new Error('Descrição ou local excedem o tamanho permitido.');
  if (!dataHoraValida(inicio) || !dataHoraValida(fim) || inicio >= fim) throw new Error('Informe uma data e hora final posteriores ao início.');
  if (!VISIBILIDADES.has(visibilidade) || !TIPOS.has(tipo)) throw new Error('Categoria ou visibilidade inválida.');
  if (perfil === 'professor' && visibilidade !== 'PRIVADO') {
    throw new Error('Professores só podem criar marcações privadas nesta versão.');
  }
  return { titulo, descricao, local, inicio, fim, visibilidade, tipo };
}

export async function listarEventosAgenda(usuario, inicio, fim) {
  verificarSessao(usuario);
  if (demoAgendaAtiva()) {
    // No modo de demonstração, o armazenamento é do navegador em uso.
    return carregarDemo().filter(evento =>
      podeVisualizarEvento(evento, usuario) && evento.inicio < `${fim}T23:59` && evento.fim >= `${inicio}T00:00`
    ).sort((a, b) => a.inicio.localeCompare(b.inicio));
  }
  const params = new URLSearchParams({ inicio, fim });
  // Evita carregamento indefinido se o servidor estiver acessível mas não responder.
  const controlador = new AbortController();
  const tempoLimite = setTimeout(() => controlador.abort(), 10000);
  let eventos;
  try {
    eventos = await request(`/agenda/eventos?${params.toString()}`, { signal: controlador.signal });
  } catch (erro) {
    if (controlador.signal.aborted) {
      const limite = new Error('O servidor demorou mais de 10 segundos para responder à agenda.');
      limite.codigo = 'AGENDA_TIMEOUT';
      throw limite;
    }
    throw erro;
  } finally {
    clearTimeout(tempoLimite);
  }
  if (!Array.isArray(eventos)) {
    throw new Error('A API /agenda/eventos não retornou uma lista de eventos. Confira o módulo Java da agenda.');
  }
  if (eventos.some(item => !item || item.id == null || typeof item.titulo !== 'string' ||
      typeof item.inicio !== 'string' || typeof item.fim !== 'string' ||
      !VISIBILIDADES.has(String(item.visibilidade || '').toUpperCase()) ||
      item.criadorId == null || !item.criadorPerfil)) {
    throw new Error('O backend retornou eventos sem os campos esperados (id, título, datas, visibilidade e autor).');
  }
  return eventos.filter(evento => podeVisualizarEvento(evento, usuario))
    .sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
}

export async function salvarEventoAgenda(usuario, dados, id = null, eventoOriginal = null) {
  verificarSessao(usuario);
  if (id != null && (!eventoOriginal || !podeGerenciarEvento(eventoOriginal, usuario))) {
    throw new Error('Você só pode editar eventos criados por você.');
  }
  const payload = validarEvento(dados, usuario);
  if (!demoAgendaAtiva()) {
    return request(id == null ? '/agenda/eventos' : `/agenda/eventos/${encodeURIComponent(id)}`, {
      method: id == null ? 'POST' : 'PUT',
      body: JSON.stringify(payload)
    });
  }
  const eventos = carregarDemo();
  if (id != null) {
    const indice = eventos.findIndex(item => String(item.id) === String(id));
    if (indice === -1 || !podeGerenciarEvento(eventos[indice], usuario)) throw new Error('Evento não encontrado ou sem permissão.');
    eventos[indice] = { ...eventos[indice], ...payload, atualizadoEm: new Date().toISOString() };
    salvarDemo(eventos);
    return eventos[indice];
  }
  const registro = {
    ...payload,
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    criadorId: idUsuario(usuario),
    criadorPerfil: perfilNormalizado(usuario),
    criadorNome: String(usuario.nome || ''),
    criadoEm: new Date().toISOString()
  };
  eventos.push(registro);
  salvarDemo(eventos);
  return registro;
}

export async function excluirEventoAgenda(usuario, evento) {
  verificarSessao(usuario);
  if (!podeGerenciarEvento(evento, usuario)) throw new Error('Você não pode excluir esse evento.');
  if (!demoAgendaAtiva()) {
    return request(`/agenda/eventos/${encodeURIComponent(evento.id)}`, { method: 'DELETE' });
  }
  const eventos = carregarDemo();
  const existente = eventos.find(item => String(item.id) === String(evento.id));
  if (!existente || !podeGerenciarEvento(existente, usuario)) throw new Error('Evento não encontrado ou sem permissão.');
  salvarDemo(eventos.filter(item => String(item.id) !== String(evento.id)));
  return null;
}

export function erroPermiteDemo(erro) {
  // 401/403 indicam falta de autenticação/permissão, não indisponibilidade da API.
  // Não mascaramos estes erros com eventos fictícios.
  if (erro?.codigo === 'SESSAO_EXPIRADA') return false;
  const status = Number(erro?.status);
  if (status === 401 || status === 403) return false;
  return !Number.isFinite(status) || status === 404 || status === 405 || status === 501 || status === 502 || status === 503 || status === 504;
}

/** Mensagens práticas para distinguir API desconectada, rota ausente e falta de permissão. */
export function mensagemErroAgenda(erro) {
  const status = Number(erro?.status);
  if (status === 404 || status === 405 || status === 501) {
    return 'O servidor respondeu, mas a rota /agenda/eventos não está instalada. É preciso integrar o módulo Java da agenda ao backend, além de criar a tabela no banco.';
  }
  if (status === 403) return 'Sua conta não tem permissão para consultar ou modificar esses eventos. Verifique o perfil e a autorização do backend.';
  if (status === 413) return 'Há eventos demais no intervalo. Tente novamente com um período menor.';
  if (status >= 500) return 'A API da agenda apresentou um erro no servidor. Verifique o console do Spring Boot e a conexão com o banco.';
  if (erro?.codigo === 'API_OFFLINE') return 'Não foi possível acessar o backend. Confirme se o Spring Boot está ligado e se o endereço da API está correto (core/runtime-config.js).';
  if (erro?.codigo === 'AGENDA_TIMEOUT') return erro.message;
  return erro?.message || 'Não foi possível carregar a agenda. Tente novamente.';
}
