import { api } from './api';

import {
  AlunoChamada,
  AlunoProfessor,
  ChamadaAbertaProfessor,
  DesempenhoTurma,
  DetalheAula,
  HistoricoAula,
  NotaProfessor,
  OcorrenciaProfessor,
  PresencaAlunoProfessor,
  ProfessorDashboard,
  SolicitacaoBiometricaProfessor,
  StatusPresenca,
  TurmaProfessor,
} from '../types/professor';

export async function getProfessorDashboard():
Promise<ProfessorDashboard> {
  const { data } =
    await api.get<ProfessorDashboard>(
      '/professor/dashboard'
    );

  return data;
}

export async function getProfessorTurmas():
Promise<TurmaProfessor[]> {
  const { data } =
    await api.get<TurmaProfessor[]>(
      '/professor/turmas'
    );

  return Array.isArray(data) ? data : [];
}

export async function getProfessorAlunos(
  turmaId?: number
): Promise<AlunoProfessor[]> {

  const { data } =
    await api.get<AlunoProfessor[]>(
      '/professor/alunos',
      {
        params: turmaId
          ? { turmaId }
          : undefined,
      }
    );

  return Array.isArray(data) ? data : [];
}

export async function getDesempenhoTurmas(
  turmaId?: number,
  periodo = 'mes'
): Promise<DesempenhoTurma[]> {

  const { data } =
    await api.get<DesempenhoTurma[]>(
      '/professor/desempenho-turmas',
      {
        params: {
          periodo,

          ...(turmaId
            ? { turmaId }
            : {}),
        },
      }
    );

  return Array.isArray(data) ? data : [];
}

export async function getHistoricoProfessor():
Promise<HistoricoAula[]> {

  const { data } =
    await api.get<HistoricoAula[]>(
      '/professor/historico'
    );

  return Array.isArray(data) ? data : [];
}

export async function getDetalhesAula(
  aulaId: number
): Promise<DetalheAula[]> {

  const { data } = await api.get<
    DetalheAula[] |
    {
      alunos?: DetalheAula[];
      presencas?: DetalheAula[];
    }
  >(
    `/professor/aula/${aulaId}/detalhes`
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.alunos)) {
    return data.alunos;
  }

  if (Array.isArray(data?.presencas)) {
    return data.presencas;
  }

  return [];
}

export async function getChamadaAberta():
Promise<ChamadaAbertaProfessor | null> {
  try {
    const response =
      await api.get<ChamadaAbertaProfessor>(
        '/professor/chamada-aberta'
      );

    return response.data ?? null;

  } catch (error: any) {
    if (
      error?.response?.status === 404 ||
      error?.response?.status === 204
    ) {
      return null;
    }

    throw error;
  }
}

export async function abrirChamada(
  turmaDisciplinaId: number
): Promise<ChamadaAbertaProfessor> {

  const { data } =
    await api.post<ChamadaAbertaProfessor>(
      '/professor/abrir',
      null,
      {
        params: {
          turmaDisciplinaId,
        },
      }
    );

  return data;
}

export async function getAlunosDaChamada(
  aulaId: number
): Promise<AlunoChamada[]> {

  const { data } =
    await api.get<AlunoChamada[]>(
      `/professor/aula/${aulaId}/alunos`
    );

  return Array.isArray(data) ? data : [];
}

export async function getPresencasDaAula(
  aulaId: number
): Promise<PresencaAlunoProfessor[]> {

  const { data } =
    await api.get<
      PresencaAlunoProfessor[]
    >(
      `/professor/aulas/${aulaId}/presencas`
    );

  return Array.isArray(data) ? data : [];
}

export async function registrarPresencaManual(
  aulaId: number,
  alunoId: number,
  status: StatusPresenca
): Promise<void> {

  await api.post(
    '/professor/presenca',
    {
      alunoId: Number(alunoId),
      aulaId: Number(aulaId),
      status,
      metodo: 'MANUAL',
    }
  );
}

export async function encerrarChamada(
  aulaId: number
): Promise<void> {

  await api.post(
    `/professor/aula/encerrar/${aulaId}`
  );
}

export async function getNotasPorVinculo(
  turmaDisciplinaId: number
): Promise<NotaProfessor[]> {

  const { data } =
    await api.get<NotaProfessor[]>(
      `/professor/notas/vinculo/${turmaDisciplinaId}`
    );

  return Array.isArray(data) ? data : [];
}

export async function cadastrarNota(
  nota: NotaProfessor
): Promise<NotaProfessor> {

  const { data } =
    await api.post<NotaProfessor>(
      '/professor/notas',
      nota
    );

  return data;
}

export async function atualizarNota(
  notaId: number,
  nota: NotaProfessor
): Promise<NotaProfessor> {

  const { data } =
    await api.put<NotaProfessor>(
      `/professor/notas/${notaId}`,
      nota
    );

  return data;
}

export async function excluirNota(
  notaId: number
): Promise<void> {

  await api.delete(
    `/professor/notas/${notaId}`
  );
}

export async function getOcorrenciasProfessor():
Promise<OcorrenciaProfessor[]> {

  const { data } =
    await api.get<
      OcorrenciaProfessor[]
    >(
      '/professor/ocorrencias'
    );

  return Array.isArray(data) ? data : [];
}

export async function criarOcorrencia(
  ocorrencia: OcorrenciaProfessor
): Promise<OcorrenciaProfessor> {

  const { data } =
    await api.post<
      OcorrenciaProfessor
    >(
      '/professor/ocorrencias',
      ocorrencia
    );

  return data;
}

export async function atualizarOcorrencia(
  id: number,
  ocorrencia: OcorrenciaProfessor
): Promise<OcorrenciaProfessor> {

  const { data } =
    await api.put<
      OcorrenciaProfessor
    >(
      `/professor/ocorrencias/${id}`,
      ocorrencia
    );

  return data;
}

export async function getBiometriasPendentes():
Promise<SolicitacaoBiometricaProfessor[]> {

  const { data } =
    await api.get<any>(
      '/professor/biometria/pendentes'
    );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.itens)) {
    return data.itens;
  }

  if (Array.isArray(data?.solicitacoes)) {
    return data.solicitacoes;
  }

  if (Array.isArray(data?.pendentes)) {
    return data.pendentes;
  }

  return [];
}

export async function confirmarBiometria(
  id: number
): Promise<SolicitacaoBiometricaProfessor> {

  const { data } =
    await api.patch<
      SolicitacaoBiometricaProfessor
    >(
      `/professor/biometria/${id}/confirmar`
    );

  return data;
}

export async function recusarBiometria(
  id: number
): Promise<SolicitacaoBiometricaProfessor> {

  const { data } =
    await api.patch<
      SolicitacaoBiometricaProfessor
    >(
      `/professor/biometria/${id}/recusar`
    );

  return data;
}

