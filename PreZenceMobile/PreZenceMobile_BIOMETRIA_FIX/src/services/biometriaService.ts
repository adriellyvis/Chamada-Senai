import { env } from '../config/env';

export interface ReconhecimentoBiometricoResultado {
  reconhecido: boolean;
  confianca: number | null;
  mensagem: string | null;
  usuarioIdReconhecido: number | null;
  respostaOriginal: unknown;
}

export interface ReconhecerRostoParams {
  imageUri: string;
  usuarioId: number;
  alunoId: number;
  aulaId: number;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'sim', 'yes', 'ok', 'reconhecido', 'recognized', 'match', 'matched'].includes(normalized)) return true;
    if (['false', '0', 'nao', 'não', 'no', 'falhou', 'failed', 'desconhecido', 'unknown'].includes(normalized)) return false;
  }
  return null;
}

function firstValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function parseReconhecimento(data: unknown): ReconhecimentoBiometricoResultado {
  const record = typeof data === 'object' && data !== null
    ? data as Record<string, unknown>
    : {};

  const reconhecido = asBoolean(firstValue(record, [
    'reconhecido',
    'recognized',
    'match',
    'matched',
    'sucesso',
    'success',
    'valido',
    'valid',
  ]));

  const confianca = asNumber(firstValue(record, [
    'confianca',
    'confidence',
    'score',
    'similaridade',
    'similarity',
  ]));

  const usuarioIdReconhecido = asNumber(firstValue(record, [
    'usuarioId',
    'usuario_id',
    'userId',
    'user_id',
    'alunoUsuarioId',
  ]));

  const rawMessage = firstValue(record, ['mensagem', 'message', 'erro', 'error', 'motivo']);
  const mensagem = typeof rawMessage === 'string' && rawMessage.trim()
    ? rawMessage.trim()
    : null;

  return {
    reconhecido: reconhecido === true,
    confianca,
    mensagem,
    usuarioIdReconhecido,
    respostaOriginal: data,
  };
}

export function biometriaReconhecimentoConfigurado(): boolean {
  return env.biometriaConfigured;
}

export interface StatusTemplateBiometrico {
  cadastrada: boolean;
  amostras: number;
  atualizadoEm: string | null;
}

async function fetchJsonComTimeout(url: string, timeoutMs = 5000): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const text = await response.text();
    let data: any = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = { mensagem: text }; }
    }
    if (!response.ok) {
      throw new Error(data?.mensagem || `Serviço biométrico respondeu com erro ${response.status}.`);
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`O serviço biométrico não respondeu a tempo (${url}).`);
    }
    if (error instanceof TypeError) {
      throw new Error(`Não foi possível acessar o serviço biométrico em ${url}. Confira se o iniciar.bat está rodando e se a porta 5000 está acessível pelo celular.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function testarServicoBiometrico(): Promise<{ modelosCarregados: boolean }> {
  if (!env.biometriaConfigured) throw new Error('Serviço biométrico não configurado.');
  const data = await fetchJsonComTimeout(`${env.biometriaBaseUrl}/health`);
  return { modelosCarregados: data?.modelosCarregados === true };
}

export async function getStatusTemplateBiometrico(usuarioId: number): Promise<StatusTemplateBiometrico> {
  if (!env.biometriaConfigured) throw new Error('Serviço biométrico não configurado.');
  const data = await fetchJsonComTimeout(`${env.biometriaBaseUrl}/status/${usuarioId}`);
  return {
    cadastrada: data?.cadastrada === true,
    amostras: typeof data?.amostras === 'number' ? data.amostras : 0,
    atualizadoEm: typeof data?.atualizadoEm === 'string' ? data.atualizadoEm : null,
  };
}

/**
 * Envia a foto capturada pelo expo-camera para o serviço de reconhecimento facial.
 *
 * O multipart inclui, além do arquivo, os IDs esperados para que o serviço possa
 * fazer verificação 1:1 (comparar o rosto somente com o cadastro daquele aluno).
 * O nome do campo do arquivo e o caminho da rota são configuráveis no .env.
 */
export async function reconhecerRosto({
  imageUri,
  usuarioId,
  alunoId,
  aulaId,
}: ReconhecerRostoParams): Promise<ReconhecimentoBiometricoResultado> {
  if (!env.biometriaConfigured) {
    throw new Error(
      'Serviço de reconhecimento facial não configurado. Defina EXPO_PUBLIC_BIOMETRIA_URL no .env.'
    );
  }

  const form = new FormData();
  form.append(env.biometriaImageField, {
    uri: imageUri,
    name: `prezence-${usuarioId}-${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
  form.append('usuarioId', String(usuarioId));
  form.append('alunoId', String(alunoId));
  form.append('aulaId', String(aulaId));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(env.biometriaReconhecerUrl, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { mensagem: text };
      }
    }

    if (!response.ok) {
      const parsed = parseReconhecimento(data);
      throw new Error(
        parsed.mensagem || `O serviço biométrico respondeu com erro ${response.status}.`
      );
    }

    return parseReconhecimento(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('O reconhecimento facial demorou para responder. Tente novamente.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
