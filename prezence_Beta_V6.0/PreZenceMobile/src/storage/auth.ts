import AsyncStorage from '@react-native-async-storage/async-storage';

import { isPerfilUsuario, Usuario } from '../types/auth';

const TOKEN_KEY = '@prezence:token';
const USER_KEY = '@prezence:user';

function isUsuario(value: unknown): value is Usuario {
  if (typeof value !== 'object' || value === null) return false;
  const u = value as Record<string, unknown>;
  return (
    typeof u.id === 'number' &&
    typeof u.nome === 'string' &&
    typeof u.email === 'string' &&
    isPerfilUsuario(u.perfil)
  );
}

export const authStorage = {
  getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  /** Retorna o usuário salvo ou null se não existir / estiver corrompido. */
  async getUser(): Promise<Usuario | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isUsuario(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  async saveSession(token: string, user: Usuario): Promise<void> {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);
  },

  clear(): Promise<void> {
    return AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },
};
