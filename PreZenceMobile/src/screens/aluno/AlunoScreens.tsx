import React from 'react';
import { PlaceholderScreen } from '../shared/PlaceholderScreen';

export const AlunoAgendaScreen: React.FC = () => (
  <PlaceholderScreen title="AGENDA" subtitle="A navegação da agenda está pronta. A integração completa com os horários do aluno será feita na próxima etapa." />
);

export const AlunoFrequencyScreen: React.FC = () => (
  <PlaceholderScreen title="FREQUÊNCIA" subtitle="A tela de frequência está pronta para receber o histórico de presenças do backend." />
);

export const AlunoNotesScreen: React.FC = () => (
  <PlaceholderScreen title="NOTAS" subtitle="A tela de notas está pronta para receber as avaliações e médias do aluno." />
);

export const AlunoNoticesScreen: React.FC = () => (
  <PlaceholderScreen title="AVISOS" subtitle="A tela de avisos está pronta para ser ligada aos comunicados do backend." />
);

export const AlunoFaceScreen: React.FC = () => (
  <PlaceholderScreen title="CHAMADA FACIAL" subtitle="A rota da chamada facial está pronta. A câmera e a biometria serão implementadas na etapa de integração mobile." />
);
