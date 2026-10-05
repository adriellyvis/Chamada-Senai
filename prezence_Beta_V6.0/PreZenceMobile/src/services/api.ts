import axios, { isAxiosError } from 'axios';

import { env } from '../config/env';
import { authStorage } from '../storage/auth';

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// O AuthContext registra aqui o que fazer quando a sessão expira, para que
// a interface volte para o login (limpar só o storage não atualiza a tela).
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      // 401 no próprio login significa credenciais inválidas, não sessão expirada.
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        await authStorage.clear();
        unauthorizedHandler?.();
      }
    }
    return Promise.reject(error);
  }
);

/** Converte qualquer erro em uma mensagem amigável para o usuário. */
export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'O servidor demorou para responder. Tente novamente.';
    }
    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique sua rede e o endereço da API.';
    }
    if (error.response.status === 401) {
      return 'Login ou senha inválidos.';
    }
    const data: unknown = error.response.data;
    if (typeof data === 'object' && data !== null) {
      const d = data as Record<string, unknown>;
      for (const key of ['message', 'mensagem', 'erro', 'error']) {
        if (typeof d[key] === 'string' && d[key]) return d[key] as string;
      }
    }
    return `Erro ${error.response.status} ao comunicar com o servidor.`;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Ocorreu um erro inesperado.';
}
