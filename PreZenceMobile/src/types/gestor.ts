export type PerfilGerenciavel = 'ALUNO' | 'PROFESSOR';

export interface GestorUsuario {
  id: number;
  nome: string;
  email: string;
  perfil: 'ALUNO' | 'PROFESSOR' | 'GESTOR' | string;
  ativo?: boolean;
  turmaId?: number | null;
  turma?: string | null;
  matricula?: string | null;
  ra?: string | null;
  especialidade?: string | null;
  frequencia?: number | null;
  ocorrencias?: number | null;
  dataCriacao?: string | null;
}

export interface GestorUsuarioDetalhes extends GestorUsuario {
  frequencia?: number | null;
  ocorrencias?: number | null;
}

export interface GestorProfessorResumo {
  id: number;
  nome: string;
  email?: string | null;
  especialidade?: string | null;
}

export interface GestorTurma {
  id: number;
  nome: string;
  descricao?: string | null;
  sala?: string | null;
  dataInicio?: string | null;
  dataFimPrevista?: string | null;
  horarioInicio?: string | null;
  horarioFim?: string | null;
  ativo?: boolean;
  totalAlunos?: number;
  totalProfessores?: number;
  totalDisciplinas?: number;
  professor?: string | null;
  disciplina?: string | null;
}

export interface GestorTurmaItemDetalhe {
  id: number;
  nome: string;
  status?: string | null;
}

export interface GestorTurmaDetalhes {
  id: number;
  nome: string;
  descricao?: string | null;
  ativa?: boolean;
  alunos: GestorTurmaItemDetalhe[];
  professores: GestorTurmaItemDetalhe[];
  disciplinas: GestorTurmaItemDetalhe[];
}

export interface GestorDisciplina {
  id: number;
  nome: string;
  sigla?: string | null;
  ativo?: boolean;
}

export interface GestorOcorrencia {
  id: number;
  alunoId?: number | null;
  alunoNome?: string | null;
  professorId?: number | null;
  professorNome?: string | null;
  titulo?: string | null;
  descricao: string;
  tipo?: string | null;
  gravidade?: string | null;
  status?: string | null;
  dataOcorrencia?: string | null;
  respostaGestor?: string | null;
  dataAtualizacao?: string | null;
}

export interface GestorDashboard {
  usuariosAtivos: number;
  professoresAtivos: number;
  alunosAtivos: number;
  totalTurmas: number;
  turmasSemProfessor: number;
  baixaFrequencia: number;
  chamadasHoje: number;
  chamadasAbertas: number;
  alertasCriticos: number;
  presencasHoje: number;
  chamadasEncerradas: number;
  alunosAusentes: number;
}

export interface CriarUsuarioGestorPayload {
  nome: string;
  email: string;
  senha: string;
  perfilId: 1 | 2;
  turmaId?: number | null;
  matricula?: string | null;
  especialidade?: string | null;
}

export interface AtualizarUsuarioGestorPayload {
  nome: string;
  email: string;
  ativo?: boolean;
  turmaId?: number | null;
  especialidade?: string | null;
}

export interface TurmaPayload {
  nome: string;
  descricao: string;
  professorId: number;
  disciplinaId: number;
  ativa?: boolean;
  sala?: string | null;
}

export interface DisciplinaPayload {
  nome: string;
  sigla: string;
}

export interface AvisoGestorPayload {
  alunoUsuarioId: number;
  titulo: string;
  mensagem: string;
  categoria: string;
  prioridade: string;
}
