import { api } from './api';

import {
  AlunoDashboard,
  AlunoDesempenhoDisciplina,
  HistoricoPresenca,
  HorarioAula,
  Aviso,
} from '../types/aluno';

export async function getDashboard(
  usuarioId: number
): Promise<AlunoDashboard> {
  const { data } = await api.get<AlunoDashboard>(
    `/aluno/dashboard/${usuarioId}`
  );

  return data;
}

export async function getDesempenhoDisciplinas(
  usuarioId: number
): Promise<AlunoDesempenhoDisciplina[]> {
  const { data } = await api.get<AlunoDesempenhoDisciplina[]>(
    `/aluno/desempenho-disciplinas/${usuarioId}`
  );

  return data;
}

export async function getAgenda(): Promise<HorarioAula[]> {
  const { data } = await api.get<HorarioAula[]>(
    '/aluno/agenda'
  );

  return data;
}

export async function getPresencas(
  usuarioId: number
): Promise<HistoricoPresenca[]> {
  const { data } = await api.get<HistoricoPresenca[]>(
    `/aluno/presencas/${usuarioId}`
  );

  return data;
}

export async function getAvisos(
  usuarioId: number
): Promise<Aviso[]> {
  const { data } = await api.get<Aviso[]>(
    `/aluno/avisos/${usuarioId}`
  );

  return data;
}