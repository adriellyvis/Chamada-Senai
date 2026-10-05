import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { setUnauthorizedHandler } from '../services/api';
import * as authService from '../services/authService';
import { authStorage } from '../storage/auth';
import { LoginDTO, Usuario } from '../types/auth';

interface AuthContextData {
  user: Usuario | null;
  loading: boolean;
  signIn: (credentials: LoginDTO) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura a sessão salva ao abrir o app.
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const [token, storedUser] = await Promise.all([
          authStorage.getToken(),
          authStorage.getUser(),
        ]);

        if (token && storedUser) {
          if (active) setUser(storedUser);
        } else {
          // Sessão incompleta ou corrompida: limpa para não ficar em estado inconsistente.
          await authStorage.clear();
        }
      } catch (error) {
        console.error('Erro ao carregar dados de autenticação:', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authStorage.clear();
    } finally {
      setUser(null);
    }
  }, []);

  // Se a API devolver 401 em uma rota protegida, volta para o login.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (credentials: LoginDTO) => {
    const { token, usuario } = await authService.login(credentials);
    await authStorage.saveSession(token, usuario);
    setUser(usuario);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um <AuthProvider>.');
  }
  return context;
}
