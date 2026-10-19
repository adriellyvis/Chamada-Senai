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
  horarioRegistro: string;
}

export interface HorarioAula {
  id: number;
  turmaDisciplinaId: number;

  turmaId: number;
  turma: string;
  sala: string;

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