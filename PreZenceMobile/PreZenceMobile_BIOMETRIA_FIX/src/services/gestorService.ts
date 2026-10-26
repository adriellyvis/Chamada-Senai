import { isAxiosError } from 'axios';
import { api } from './api';
import {
  DisciplinaPayload,
  GestorDashboard,
  GestorDisciplina,
  GestorOcorrencia,
  GestorTurma,
  GestorUsuario,
  TurmaPayload,
  UsuarioPayload,
} from '../types/gestor';

type AnyObject = Record<string, any>;

function arrayFrom(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  for (const key of ['content', 'items', 'dados', 'usuarios', 'turmas', 'disciplinas', 'ocorrencias']) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

async function withFallback<T>(requests: Array<() => Promise<T>>): Promise<T> {
  let lastError: unknown;
  for (const request of requests) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (!isAxiosError(error) || ![404, 405].includes(error.response?.status ?? 0)) {
        throw error;
      }
    }
  }
  throw lastError;
}

function bool(value: any, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return !['false', '0', 'inativo'].includes(value.toLowerCase());
  return fallback;
}

function normalizeUsuario(raw: AnyObject, index: number): GestorUsuario {
  return {
    id: Number(raw.id ?? raw.usuarioId ?? raw.alunoId ?? raw.professorId ?? index + 1),
    nome: String(raw.nome ?? raw.nomeCompleto ?? raw.name ?? 'Usuário'),
    email: String(raw.email ?? ''),
    perfil: String(raw.perfil ?? raw.role ?? raw.tipoUsuario ?? raw.tipo ?? 'ALUNO').toUpperCase(),
    ativo: bool(raw.ativo ?? raw.active, true),
    matricula: raw.matricula ?? raw.ra ?? raw.registro,
    ra: raw.ra ?? raw.matricula,
    turma: raw.turma ?? raw.nomeTurma,
    dataCriacao: raw.dataCriacao ?? raw.createdAt,
  };
}

function normalizeTurma(raw: AnyObject, index: number): GestorTurma {
  return {
    id: Number(raw.id ?? raw.turmaId ?? index + 1),
    nome: String(raw.nome ?? raw.nomeTurma ?? raw.turma ?? 'Turma'),
    codigo: raw.codigo ?? raw.sigla,
    sala: raw.sala,
    turno: raw.turno ?? raw.periodo,
    ativo: bool(raw.ativo ?? raw.active, true),
    totalAlunos: Number(raw.totalAlunos ?? raw.quantidadeAlunos ?? raw.alunosCount ?? 0),
    professor: raw.professor ?? raw.nomeProfessor,
  };
}

function normalizeDisciplina(raw: AnyObject, index: number): GestorDisciplina {
  return {
    id: Number(raw.id ?? raw.disciplinaId ?? index + 1),
    nome: String(raw.nome ?? raw.nomeDisciplina ?? raw.disciplina ?? 'Disciplina'),
    codigo: raw.codigo ?? raw.sigla,
    cargaHoraria: raw.cargaHoraria != null ? Number(raw.cargaHoraria) : undefined,
    ativo: bool(raw.ativo ?? raw.active, true),
  };
}

function normalizeOcorrencia(raw: AnyObject, index: number): GestorOcorrencia {
  return {
    id: Number(raw.id ?? raw.ocorrenciaId ?? index + 1),
    titulo: raw.titulo ?? raw.assunto ?? raw.tipo,
    descricao: String(raw.descricao ?? raw.mensagem ?? raw.observacao ?? 'Ocorrência registrada'),
    tipo: raw.tipo ?? raw.categoria,
    status: raw.status ?? raw.situacao,
    aluno: raw.aluno ?? raw.nomeAluno,
    professor: raw.professor ?? raw.nomeProfessor,
    turma: raw.turma ?? raw.nomeTurma,
    data: raw.data ?? raw.dataOcorrencia ?? raw.criadoEm ?? raw.createdAt,
  };
}

export async function getGestorUsuarios(): Promise<GestorUsuario[]> {
  const data = await withFallback<any>([
    async () => (await api.get('/gestor/usuarios')).data,
    async () => (await api.get('/usuarios')).data,
  ]);
  return arrayFrom(data).map(normalizeUsuario);
}

export async function getGestorTurmas(): Promise<GestorTurma[]> {
  const data = await withFallback<any>([
    async () => (await api.get('/gestor/turmas')).data,
    async () => (await api.get('/turmas')).data,
  ]);
  return arrayFrom(data).map(normalizeTurma);
}

export async function getGestorDisciplinas(): Promise<GestorDisciplina[]> {
  const data = await withFallback<any>([
    async () => (await api.get('/gestor/disciplinas')).data,
    async () => (await api.get('/disciplinas')).data,
  ]);
  return arrayFrom(data).map(normalizeDisciplina);
}

export async function getGestorOcorrencias(): Promise<GestorOcorrencia[]> {
  const data = await withFallback<any>([
    async () => (await api.get('/gestor/ocorrencias')).data,
    async () => (await api.get('/ocorrencias')).data,
  ]);
  return arrayFrom(data).map(normalizeOcorrencia);
}

export async function getGestorDashboard(): Promise<GestorDashboard> {
  try {
    const { data } = await api.get('/gestor/dashboard');
    return {
      usuariosAtivos: Number(data.usuariosAtivos ?? data.totalUsuariosAtivos ?? 0),
      professoresAtivos: Number(data.professoresAtivos ?? 0),
      alunosAtivos: Number(data.alunosAtivos ?? 0),
      totalTurmas: Number(data.totalTurmas ?? data.turmasAtivas ?? 0),
      turmasSemProfessor: Number(data.turmasSemProfessor ?? 0),
      baixaFrequencia: Number(data.baixaFrequencia ?? data.alunosBaixaFrequencia ?? 0),
      chamadasHoje: Number(data.chamadasHoje ?? 0),
      chamadasAbertas: Number(data.chamadasAbertas ?? 0),
      alertasCriticos: Number(data.alertasCriticos ?? 0),
      presencasHoje: Number(data.presencasHoje ?? 0),
      chamadasEncerradas: Number(data.chamadasEncerradas ?? 0),
      alunosAusentes: Number(data.alunosAusentes ?? 0),
    };
  } catch (error) {
    if (!isAxiosError(error) || ![404, 405].includes(error.response?.status ?? 0)) throw error;
    const [usuarios, turmas] = await Promise.all([getGestorUsuarios(), getGestorTurmas()]);
    const ativos = usuarios.filter(u => u.ativo !== false);
    return {
      usuariosAtivos: ativos.length,
      professoresAtivos: ativos.filter(u => u.perfil === 'PROFESSOR').length,
      alunosAtivos: ativos.filter(u => u.perfil === 'ALUNO').length,
      totalTurmas: turmas.filter(t => t.ativo !== false).length,
      turmasSemProfessor: turmas.filter(t => !t.professor).length,
      baixaFrequencia: 0,
      chamadasHoje: 0,
      chamadasAbertas: 0,
      alertasCriticos: 0,
      presencasHoje: 0,
      chamadasEncerradas: 0,
      alunosAusentes: 0,
    };
  }
}

export async function criarTurma(payload: TurmaPayload): Promise<void> {
  await withFallback([
    () => api.post('/gestor/turmas', payload).then(() => undefined),
    () => api.post('/turmas', payload).then(() => undefined),
  ]);
}

export async function atualizarTurma(id: number, payload: TurmaPayload): Promise<void> {
  await withFallback([
    () => api.put(`/gestor/turmas/${id}`, payload).then(() => undefined),
    () => api.put(`/turmas/${id}`, payload).then(() => undefined),
  ]);
}

export async function criarDisciplina(payload: DisciplinaPayload): Promise<void> {
  await withFallback([
    () => api.post('/gestor/disciplinas', payload).then(() => undefined),
    () => api.post('/disciplinas', payload).then(() => undefined),
  ]);
}

export async function atualizarDisciplina(id: number, payload: DisciplinaPayload): Promise<void> {
  await withFallback([
    () => api.put(`/gestor/disciplinas/${id}`, payload).then(() => undefined),
    () => api.put(`/disciplinas/${id}`, payload).then(() => undefined),
  ]);
}

export async function criarUsuario(payload: UsuarioPayload): Promise<void> {
  await withFallback([
    () => api.post('/gestor/usuarios', payload).then(() => undefined),
    () => api.post('/usuarios', payload).then(() => undefined),
  ]);
}

export async function atualizarUsuario(id: number, payload: Omit<UsuarioPayload, 'senha'> & { senha?: string }): Promise<void> {
  await withFallback([
    () => api.put(`/gestor/usuarios/${id}`, payload).then(() => undefined),
    () => api.put(`/usuarios/${id}`, payload).then(() => undefined),
  ]);
}
