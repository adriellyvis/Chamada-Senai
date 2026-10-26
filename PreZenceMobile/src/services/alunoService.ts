import { isAxiosError } from 'axios';
import { api } from './api';

import {
  AlunoDashboard,
  AlunoDesempenhoDisciplina,
  AlunoPerfil,
  Aviso,
  ChamadaAbertaAluno,
  HistoricoPresenca,
  HorarioAula,
  NotaAluno,
  OcorrenciaAluno,
  SolicitacaoPresencaBiometricaAluno,
  StatusBiometriaAluno,
} from '../types/aluno';

export async function getDashboard(usuarioId: number): Promise<AlunoDashboard> {
  const { data } = await api.get<AlunoDashboard>(`/aluno/dashboard/${usuarioId}`);
  return data;
}

export async function getDesempenhoDisciplinas(usuarioId: number): Promise<AlunoDesempenhoDisciplina[]> {
  const { data } = await api.get<AlunoDesempenhoDisciplina[]>(`/aluno/desempenho-disciplinas/${usuarioId}`);
  return Array.isArray(data) ? data : [];
}

export async function getAgenda(): Promise<HorarioAula[]> {
  const { data } = await api.get<HorarioAula[]>('/aluno/agenda');
  return Array.isArray(data) ? data : [];
}

export async function getPresencas(usuarioId: number): Promise<HistoricoPresenca[]> {
  const { data } = await api.get<HistoricoPresenca[]>(`/aluno/presencas/${usuarioId}`);
  return Array.isArray(data) ? data : [];
}

export async function getAvisos(usuarioId: number): Promise<Aviso[]> {
  const { data } = await api.get<Aviso[]>(`/aluno/avisos/${usuarioId}`);
  return Array.isArray(data) ? data : [];
}

export async function marcarAvisoComoLido(avisoId: number): Promise<void> {
  await api.patch(`/aluno/avisos/${avisoId}/lido`);
}

export async function marcarTodosAvisosComoLidos(usuarioId: number): Promise<void> {
  await api.patch(`/aluno/avisos/lidos/${usuarioId}`);
}

export async function getNotasAluno(): Promise<NotaAluno[]> {
  const { data } = await api.get<NotaAluno[]>('/aluno/notas');
  return Array.isArray(data) ? data : [];
}

export async function getOcorrenciasAluno(usuarioId: number): Promise<OcorrenciaAluno[]> {
  const { data } = await api.get<OcorrenciaAluno[]>(`/aluno/ocorrencias/${usuarioId}`);
  return Array.isArray(data) ? data : [];
}

export async function getPerfilAluno(usuarioId: number): Promise<AlunoPerfil> {
  const { data } = await api.get<AlunoPerfil>(`/aluno/perfil/${usuarioId}`);
  return data;
}

export async function getChamadaAbertaAluno(usuarioId: number): Promise<ChamadaAbertaAluno | null> {
  try {
    const response = await api.get<ChamadaAbertaAluno>(`/aluno/chamada-aberta/${usuarioId}`);
    return response.status === 204 ? null : response.data;
  } catch (error) {
    if (isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 204)) {
      return null;
    }
    throw error;
  }
}

export async function getStatusBiometriaAluno(usuarioId: number): Promise<StatusBiometriaAluno> {
  const { data } = await api.get<StatusBiometriaAluno>(`/biometria/amostras/${usuarioId}/status`);
  return data;
}

export async function solicitarPresencaBiometrica(
  alunoId: number,
  aulaId: number
): Promise<SolicitacaoPresencaBiometricaAluno> {
  const { data } = await api.post<SolicitacaoPresencaBiometricaAluno>('/biometria/presenca/solicitar', {
    alunoId,
    aulaId,
  });
  return data;
}

export async function getStatusSolicitacaoBiometrica(
  aulaId: number
): Promise<SolicitacaoPresencaBiometricaAluno | null> {
  const response = await api.get<SolicitacaoPresencaBiometricaAluno>('/biometria/presenca/status', {
    params: { aulaId },
  });
  return response.status === 204 ? null : response.data;
}
