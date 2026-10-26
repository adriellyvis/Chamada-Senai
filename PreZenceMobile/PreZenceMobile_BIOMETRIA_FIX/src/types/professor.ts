export interface ProfessorDashboard {
  totalTurmas: number;
  totalAlunos: number;
  frequenciaMedia: number;
  aulasRealizadas: number;
  aulasRecentes: HistoricoAula[];
  alunosRisco: AlunoRisco[];
}

export interface AlunoRisco {
  alunoId: number;
  nomeAluno: string;
  matricula: string;
  turma: string;
  frequencia: number;
  nivelRisco: string;
}

export interface TurmaProfessor {
  turmaDisciplinaId: number;
  turmaId: number;
  nomeTurma: string;
  disciplina: string;
  totalAlunos: number;
  sala?: string | null;
}

export interface AlunoProfessor {
  alunoId: number;
  nome: string;
  email: string;
  matricula: string;
  turmaId: number;
  turma: string;
  frequencia: number;
}

export interface DesempenhoTurma {
  turmaId: number;
  turma: string;
  presencas: number;
  atrasos: number;
  faltas: number;
}

export interface HistoricoAula {
  id: number;
  turma: string;
  data: string;
  horaInicio?: string | null;
  horaFim?: string | null;
  status: string;
}

export interface DetalheAula {
  alunoId: number;
  nomeAluno: string;
  status: string;
  horarioRegistro?: string | null;
  metodo?: string | null;
}


export interface HistoricoPresencaAlunoProfessor {
  aulaId: number;
  alunoId: number;
  turma: string;
  data: string;
  horaInicio?: string | null;
  horaFim?: string | null;
  statusAula?: string | null;
  status: string;
  metodo?: string | null;
  horarioRegistro?: string | null;
}

export interface ChamadaAbertaProfessor {
  aulaId: number;
  turmaDisciplinaId: number;
  turmaId: number;
  turma: string;
  disciplina: string;
  data: string;
  horaInicio?: string | null;
  horaFim?: string | null;
  status: string;
}

export interface AlunoChamada {
  alunoId: number;
  nome: string;
  status?: string | null;
}

export interface PresencaAlunoProfessor {
  alunoId: number;
  alunoNome: string;
  status?: string | null;
  metodo?: string | null;
  validacaoBiometrica?: boolean | null;
}

export type StatusPresenca =
  | 'PRESENTE'
  | 'AUSENTE'
  | 'ATRASADO'
  | 'SAIDA_TEMPORARIA';

export interface NotaProfessor {
  id?: number;

  alunoId: number;
  alunoUsuarioId?: number | null;
  alunoNome?: string | null;

  turmaDisciplinaId: number;

  turmaId?: number | null;
  turmaNome?: string | null;

  disciplinaId?: number | null;
  disciplinaNome?: string | null;

  titulo: string;

  nota: number;
  notaMaxima: number;

  bimestre: number;

  observacao?: string | null;

  dataAvaliacao: string;
  dataCriacao?: string | null;
}

export interface OcorrenciaProfessor {
  id?: number;

  alunoId: number;
  alunoNome?: string | null;

  professorId?: number | null;
  professorNome?: string | null;

  titulo: string;
  descricao: string;

  tipo: string;
  gravidade: string;

  status?: string | null;

  dataOcorrencia?: string | null;
  respostaGestor?: string | null;
  dataAtualizacao?: string | null;
}

export interface SolicitacaoBiometricaProfessor {
  id: number;

  alunoId: number;
  alunoUsuarioId?: number | null;
  alunoNome: string;

  aulaId: number;

  turmaId: number;
  turmaNome: string;

  disciplinaId: number;
  disciplinaNome: string;

  professorUsuarioId?: number | null;
  professorNome?: string | null;

  status: string;
  statusSugerido?: string | null;

  horarioSolicitacao?: string | null;
  horarioDecisao?: string | null;

  motivoRecusa?: string | null;
}