import { env } from '../config/env';
import { authStorage } from '../storage/auth';

export interface ReconhecimentoBiometricoResultado {
  reconhecido: boolean;
  confianca: number | null;
  mensagem: string | null;
  usuarioIdReconhecido: number | null;
  votosPositivos: number | null;
  votosNecessarios: number | null;
  scoreDescritor: number | null;
  limiteScoreDescritor: number | null;
  limiteConfianca: number | null;
  modoVerificacao: string | null;
  respostaOriginal: unknown;
}

export interface ReconhecerRostoParams {
  imagensBase64: string[];
  usuarioId: number;
  alunoId: number;
  aulaId: number;
}

export interface StatusTemplateBiometrico {
  cadastrada: boolean;
  amostras: number;
  origem: string | null;
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
    'valido',
    'valid',
  ]));

  const confianca = asNumber(firstValue(record, [
    'confianca',
    'confidence',
    'similaridade',
    'similarity',
    'score',
  ]));

  // O serviço biométrico oficial identifica a pessoa por usuarios.id e
  // devolve esse valor principalmente em pessoaId.
  const usuarioIdReconhecido = asNumber(firstValue(record, [
    'usuarioId',
    'usuario_id',
    'pessoaId',
    'userId',
    'user_id',
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
    votosPositivos: asNumber(record.votosPositivos),
    votosNecessarios: asNumber(record.votosNecessarios),
    scoreDescritor: asNumber(record.scoreDescritor),
    limiteScoreDescritor: asNumber(record.limiteScoreDescritor),
    limiteConfianca: asNumber(record.limiteConfianca),
    modoVerificacao: typeof record.modoVerificacao === 'string' ? record.modoVerificacao : null,
    respostaOriginal: data,
  };
}

async function tokenObrigatorio(): Promise<string> {
  const token = await authStorage.getToken();
  if (!token) {
    throw new Error('Sessão expirada. Entre novamente antes de usar a biometria.');
  }
  return token;
}

async function lerJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `O serviço biométrico respondeu em formato inesperado (HTTP ${response.status}).`
    );
  }
}

async function fetchComTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 12000
): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });

    const data = await lerJson(response);

    if (!response.ok) {
      const mensagem =
        (data && typeof data === 'object' && typeof data.mensagem === 'string' && data.mensagem) ||
        `Serviço biométrico respondeu com erro HTTP ${response.status}.`;
      throw new Error(mensagem);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`O serviço biométrico não respondeu a tempo em ${url}.`);
    }
    if (error instanceof TypeError) {
      throw new Error(
        `Não foi possível conectar a ${url}. Confirme se o serviço Python está aberto na porta 5000.`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function biometriaReconhecimentoConfigurado(): boolean {
  return env.biometriaConfigured;
}

/**
 * Verifica somente se o serviço Python oficial do PreZence está acessível.
 * Ele usa /status, que é a rota já existente no Front_and_Prezence.
 */
export async function testarServicoBiometrico(): Promise<{ online: boolean; armazenamento: string | null }> {
  if (!env.biometriaConfigured) {
    throw new Error('Serviço biométrico não configurado.');
  }

  const data = await fetchComTimeout(`${env.biometriaBaseUrl}/status`, {}, 5000);

  if (data?.sucesso !== true) {
    throw new Error(data?.mensagem || 'O serviço biométrico respondeu, mas não está pronto.');
  }

  return {
    online: true,
    armazenamento: typeof data?.armazenamentoBiometrico === 'string'
      ? data.armazenamentoBiometrico
      : null,
  };
}

/**
 * Consulta o mesmo cadastro facial usado pelo site.
 * A rota /face-cadastrada consulta o Spring/MySQL, portanto NÃO existe mais
 * um segundo "template local" separado no mobile.
 */
export async function getStatusTemplateBiometrico(usuarioId: number): Promise<StatusTemplateBiometrico> {
  if (!env.biometriaConfigured) {
    throw new Error('Serviço biométrico não configurado.');
  }

  const token = await tokenObrigatorio();
  const data = await fetchComTimeout(
    `${env.biometriaBaseUrl}/face-cadastrada`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        usuarioId,
        pessoaId: usuarioId,
        perfil: 'aluno',
      }),
    }
  );

  return {
    cadastrada: data?.cadastrada === true,
    amostras: typeof data?.quantidadeAmostras === 'number' ? data.quantidadeAmostras : 0,
    origem: typeof data?.origem === 'string' ? data.origem : null,
  };
}

/**
 * Envia as amostras capturadas pelo expo-camera para a mesma rota que o
 * Front_and_Prezence usa: POST /verificar-face.
 *
 * O Python recebe Base64 + JWT, consulta as amostras oficiais no Spring/MySQL
 * e verifica somente a identidade do usuarioId autenticado.
 */
export async function reconhecerRosto({
  imagensBase64,
  usuarioId,
  alunoId,
}: ReconhecerRostoParams): Promise<ReconhecimentoBiometricoResultado> {
  if (!env.biometriaConfigured) {
    throw new Error('Serviço de reconhecimento facial não configurado.');
  }

  const amostras = imagensBase64
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item));

  if (!amostras.length) {
    throw new Error('Nenhuma amostra facial foi capturada.');
  }

  const token = await tokenObrigatorio();
  const data = await fetchComTimeout(
    env.biometriaVerificarUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        alunoId,
        usuarioId,
        pessoaId: usuarioId,
        perfil: 'aluno',
        imagemBase64: amostras[0],
        imagensBase64: amostras,
      }),
    },
    30000
  );

  return parseReconhecimento(data);
}
