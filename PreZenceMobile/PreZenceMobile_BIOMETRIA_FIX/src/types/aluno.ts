export interface AlunoDashboard {
  nome: string;
  turma: string;
  matricula: string;
  frequencia: number;
  presencas: number;
  faltas: number;
  atrasos: number;
  aulasAssistidas: number;
  totalAulas: number;
  faltasMes: number;
  presencasMes: number;
  ocorrencias: number;
  risco: string;
}

export interface AlunoDesempenhoDisciplina {
  disciplina: string;
  presencas: number;
  faltas: number;
  atrasos: number;
  frequencia: number;
}

export interface HistoricoPresenca {
  aulaId: number;
  disciplina: string;
  professor: string;
  dataAula: string;
  status: string;
  metodo: string;
  horarioRegistro: string | null;
}

export interface HorarioAula {
  id: number;
  turmaDisciplinaId: number;
  turmaId: number;
  turma: string;
  sala: string | null;
  disciplinaId: number;
  disciplina: string;
  siglaDisciplina: string;
  professorId: number;
  professor: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  toleranciaMinutos: number;
  aberturaAutomatica: boolean;
  encerramentoAutomatico: boolean;
  dataInicioVigencia: string;
  dataFimVigencia: string;
  ativo: boolean;
}

export interface Aviso {
  id: number;
  alunoId: number;
  alunoUsuarioId: number;
  alunoNome: string;
  autorUsuarioId: number;
  autorNome: string;
  autorPerfil: string;
  turmaId: number;
  turmaNome: string;
  titulo: string;
  mensagem: string;
  categoria: string;
  prioridade: string;
  lido: boolean;
  frequencia: number | null;
  nota: number | null;
  melhorias: string | null;
  dataCriacao: string;
}

export interface NotaAluno {
  id: number;
  alunoId: number;
  alunoUsuarioId: number;
  alunoNome: string;
  turmaDisciplinaId: number;
  turmaId: number;
  turmaNome: string;
  disciplinaId: number;
  disciplinaNome: string;
  titulo: string;
  nota: number;
  notaMaxima: number;
  bimestre: number;
  observacao: string | null;
  dataAvaliacao: string;
  dataCriacao: string;
}

export interface OcorrenciaAluno {
  id: number;
  alunoId: number;
  alunoNome: string;
  professorId: number | null;
  professorNome: string | null;
  titulo: string;
  descricao: string;
  tipo: string;
  gravidade: string;
  status: string;
  dataOcorrencia: string;
  respostaGestor: string | null;
  dataAtualizacao: string | null;
}

export interface AlunoPerfil {
  id: number;
  usuarioId: number;
  nome: string;
  email: string;
  perfil: string;
  matricula: string;
  turma: string;
  frequencia: number;
  ativo: boolean;
}

export interface ChamadaAbertaAluno {
  alunoId: number;
  aulaId: number;
  disciplina: string;
  professor: string;
  turma: string;
  dataAula: string;
  horaInicio: string;
  horaFim: string;
  status: string;
}

export interface StatusBiometriaAluno {
  usuarioId: number;
  cadastrada: boolean;
}

export interface SolicitacaoPresencaBiometricaAluno {
  id: number;
  alunoId: number;
  alunoUsuarioId: number;
  alunoNome: string;
  aulaId: number;
  turmaId: number;
  turmaNome: string;
  disciplinaId: number;
  disciplinaNome: string;
  professorUsuarioId: number;
  professorNome: string;
  status: string;
  statusSugerido: string | null;
  horarioSolicitacao: string;
  horarioDecisao: string | null;
  motivoRecusa: string | null;
}
