import { api } from './api';
import {
  AtualizarUsuarioGestorPayload,
  AvisoGestorPayload,
  CriarUsuarioGestorPayload,
  DisciplinaPayload,
  GestorDashboard,
  GestorDisciplina,
  GestorOcorrencia,
  GestorProfessorResumo,
  GestorTurma,
  GestorTurmaDetalhes,
  GestorUsuario,
  GestorUsuarioDetalhes,
  TurmaPayload,
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

function bool(value: any, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return !['false', '0', 'inativo', 'inativa'].includes(value.toLowerCase());
  return fallback;
}

function normalizeUsuario(raw: AnyObject, index: number): GestorUsuario {
  return {
    id: Number(raw.id ?? raw.usuarioId ?? index + 1),
    nome: String(raw.nome ?? raw.nomeCompleto ?? 'Usuário'),
    email: String(raw.email ?? ''),
    perfil: String(raw.perfil ?? raw.role ?? raw.tipoUsuario ?? 'ALUNO').toUpperCase(),
    ativo: bool(raw.ativo ?? raw.active, true),
    turmaId: raw.turmaId != null ? Number(raw.turmaId) : null,
    turma: raw.turma ?? raw.nomeTurma ?? null,
    matricula: raw.matricula ?? raw.ra ?? null,
    ra: raw.ra ?? raw.matricula ?? null,
    especialidade: raw.especialidade ?? null,
    frequencia: raw.frequencia != null ? Number(raw.frequencia) : null,
    ocorrencias: raw.ocorrencias != null ? Number(raw.ocorrencias) : null,
    dataCriacao: raw.dataCriacao ?? raw.createdAt ?? null,
  };
}

function normalizeTurma(raw: AnyObject, index: number): GestorTurma {
  return {
    id: Number(raw.id ?? raw.turmaId ?? index + 1),
    nome: String(raw.nome ?? raw.nomeTurma ?? 'Turma'),
    descricao: raw.descricao ?? null,
    sala: raw.sala ?? null,
    dataInicio: raw.dataInicio ?? null,
    dataFimPrevista: raw.dataFimPrevista ?? null,
    horarioInicio: raw.horarioInicio ?? null,
    horarioFim: raw.horarioFim ?? null,
    ativo: bool(raw.ativa ?? raw.ativo ?? raw.active, true),
    totalAlunos: Number(raw.totalAlunos ?? raw.quantidadeAlunos ?? 0),
    totalProfessores: Number(raw.totalProfessores ?? 0),
    totalDisciplinas: Number(raw.totalDisciplinas ?? 0),
    professor: raw.professor ?? raw.nomeProfessor ?? null,
    disciplina: raw.disciplina ?? raw.nomeDisciplina ?? null,
  };
}

function normalizeDisciplina(raw: AnyObject, index: number): GestorDisciplina {
  return {
    id: Number(raw.id ?? raw.disciplinaId ?? index + 1),
    nome: String(raw.nome ?? raw.nomeDisciplina ?? 'Disciplina'),
    sigla: raw.sigla ?? raw.codigo ?? null,
    ativo: bool(raw.ativo ?? raw.active, true),
  };
}

function normalizeOcorrencia(raw: AnyObject, index: number): GestorOcorrencia {
  return {
    id: Number(raw.id ?? raw.ocorrenciaId ?? index + 1),
    alunoId: raw.alunoId != null ? Number(raw.alunoId) : null,
    alunoNome: raw.alunoNome ?? raw.nomeAluno ?? raw.aluno ?? null,
    professorId: raw.professorId != null ? Number(raw.professorId) : null,
    professorNome: raw.professorNome ?? raw.nomeProfessor ?? raw.professor ?? null,
    titulo: raw.titulo ?? raw.assunto ?? raw.tipo ?? 'Ocorrência',
    descricao: String(raw.descricao ?? raw.mensagem ?? raw.observacao ?? 'Ocorrência registrada'),
    tipo: raw.tipo ?? raw.categoria ?? null,
    gravidade: raw.gravidade ?? null,
    status: raw.status ?? raw.situacao ?? null,
    dataOcorrencia: raw.dataOcorrencia ?? raw.data ?? raw.criadoEm ?? raw.createdAt ?? null,
    respostaGestor: raw.respostaGestor ?? null,
    dataAtualizacao: raw.dataAtualizacao ?? raw.updatedAt ?? null,
  };
}

export async function getGestorUsuarios(): Promise<GestorUsuario[]> {
  const { data } = await api.get('/gestor/usuarios');
  return arrayFrom(data).map(normalizeUsuario);
}

export async function getGestorUsuarioDetalhes(id: number): Promise<GestorUsuarioDetalhes> {
  const { data } = await api.get(`/gestor/usuarios/${id}/detalhes`);
  return normalizeUsuario(data, 0) as GestorUsuarioDetalhes;
}

export async function alterarStatusUsuario(id: number): Promise<void> {
  await api.patch(`/gestor/usuarios/${id}/status`);
}

export async function getGestorTurmas(): Promise<GestorTurma[]> {
  const { data } = await api.get('/gestor/turmas');
  return arrayFrom(data).map(normalizeTurma);
}

export async function getGestorTurmasResumo(): Promise<Array<{ id: number; nome: string }>> {
  const { data } = await api.get('/gestor/turmas/resumo');
  return arrayFrom(data).map((item: AnyObject) => ({
    id: Number(item.id),
    nome: String(item.nome ?? 'Turma'),
  }));
}

export async function getGestorTurmaDetalhes(id: number): Promise<GestorTurmaDetalhes> {
  const { data } = await api.get(`/gestor/turmas/${id}/detalhes`);
  const list = (value: any) => arrayFrom(value).map((item: AnyObject, index: number) => ({
    id: Number(item.id ?? index + 1),
    nome: String(item.nome ?? 'Item'),
    status: item.status ?? null,
  }));
  return {
    id: Number(data.id ?? id),
    nome: String(data.nome ?? 'Turma'),
    descricao: data.descricao ?? null,
    ativa: bool(data.ativa, true),
    alunos: list(data.alunos),
    professores: list(data.professores),
    disciplinas: list(data.disciplinas),
  };
}

export async function getGestorProfessoresResumo(): Promise<GestorProfessorResumo[]> {
  const { data } = await api.get('/gestor/professores/resumo');
  return arrayFrom(data).map((item: AnyObject, index: number) => ({
    id: Number(item.id ?? index + 1),
    nome: String(item.nome ?? 'Professor'),
    email: item.email ?? null,
    especialidade: item.especialidade ?? null,
  }));
}

export async function getGestorDisciplinas(): Promise<GestorDisciplina[]> {
  const { data } = await api.get('/gestor/disciplinas');
  return arrayFrom(data).map(normalizeDisciplina);
}

export async function getGestorOcorrencias(): Promise<GestorOcorrencia[]> {
  const { data } = await api.get('/gestor/ocorrencias');
  return arrayFrom(data).map(normalizeOcorrencia);
}

export async function alterarStatusOcorrenciaGestor(
  id: number,
  status: 'PENDENTE' | 'EM_ANALISE' | 'RESOLVIDA' | 'CANCELADA',
  respostaGestor?: string
): Promise<GestorOcorrencia> {
  const { data } = await api.patch(
    `/gestor/ocorrencias/${id}/status`,
    { respostaGestor: respostaGestor?.trim() ?? '' },
    { params: { status } }
  );
  return normalizeOcorrencia(data, 0);
}

export async function enviarAvisoGestor(payload: AvisoGestorPayload): Promise<void> {
  await api.post('/gestor/avisos', payload);
}

export async function getGestorDashboard(): Promise<GestorDashboard> {
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
}

export async function criarTurma(payload: TurmaPayload): Promise<void> {
  await api.post('/gestor/turmas', {
    nome: payload.nome,
    descricao: payload.descricao,
    sala: payload.sala ?? null,
    professorId: payload.professorId,
    disciplinaId: payload.disciplinaId,
  });
}

export async function atualizarTurma(id: number, payload: TurmaPayload): Promise<void> {
  await api.put(`/gestor/turmas/${id}`, payload);
}

export async function criarDisciplina(payload: DisciplinaPayload): Promise<void> {
  await api.post('/gestor/disciplinas', {
    nome: payload.nome,
    sigla: payload.sigla.toUpperCase(),
  });
}

export async function atualizarDisciplina(id: number, payload: DisciplinaPayload): Promise<void> {
  await api.put(`/gestor/disciplinas/${id}`, {
    nome: payload.nome,
    sigla: payload.sigla.toUpperCase(),
  });
}

export async function criarUsuario(payload: CriarUsuarioGestorPayload): Promise<void> {
  await api.post('/gestor/usuarios/completo', payload);
}

export async function atualizarUsuario(id: number, payload: AtualizarUsuarioGestorPayload): Promise<void> {
  await api.put(`/gestor/usuarios/${id}`, {
    nome: payload.nome,
    email: payload.email,
    ativo: payload.ativo,
    turmaId: payload.turmaId ?? null,
    especialidade: payload.especialidade ?? null,
  });
}
