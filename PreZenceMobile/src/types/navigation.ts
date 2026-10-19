export type AuthStackParamList = { Login: undefined };
export type ProfileTabParamList = {
  Inicio: undefined;
  Agenda: undefined;
  Frequencia: undefined;
  Notas: undefined;
  Chamada: undefined;
  Avisos: undefined;
  Turmas: undefined;
  Alunos: undefined;
  Ocorrencias: undefined;
  Mais: { profile: 'ALUNO' | 'PROFESSOR' | 'GESTOR' };
  Perfil: undefined;
  Configuracoes: undefined;
};
