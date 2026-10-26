export type PerfilGerenciavel = 'ALUNO' | 'PROFESSOR';

export interface GestorUsuario {
  id: number;
  nome: string;
  email: string;
  perfil: 'ALUNO' | 'PROFESSOR' | 'GESTOR' | string;
  ativo?: boolean;
  matricula?: string;
  ra?: string;
  turma?: string;
  dataCriacao?: string;
}

export interface GestorTurma {
  id: number;
  nome: string;
  codigo?: string;
  sala?: string;
  turno?: string;
  ativo?: boolean;
  totalAlunos?: number;
  professor?: string;
}

export interface GestorDisciplina {
  id: number;
  nome: string;
  codigo?: string;
  cargaHoraria?: number;
  ativo?: boolean;
}

export interface GestorOcorrencia {
  id: number;
  titulo?: string;
  descricao: string;
  tipo?: string;
  status?: string;
  aluno?: string;
  professor?: string;
  turma?: string;
  data?: string;
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

export interface TurmaPayload {
  nome: string;
  codigo?: string;
  sala?: string;
  turno?: string;
  ativo?: boolean;
}

export interface DisciplinaPayload {
  nome: string;
  codigo?: string;
  cargaHoraria?: number;
  ativo?: boolean;
}

export interface UsuarioPayload {
  nome: string;
  email: string;
  perfil: PerfilGerenciavel;
  senha?: string;
  ativo?: boolean;
  ra?: string;
}
