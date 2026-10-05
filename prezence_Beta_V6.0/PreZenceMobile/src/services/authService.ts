import { api } from './api';
import {
  isPerfilUsuario,
  LoginDTO,
  LoginResponseDTO,
} from '../types/auth';

/**
 * Formato que o backend Spring Boot realmente retorna.
 */
interface BackendLoginResponse {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  token: string;
}

/**
 * Realiza o login usando o contrato atual do backend.
 *
 * O frontend continua trabalhando com "login",
 * mas envia esse valor ao backend como "email".
 *
 * Depois, adapta a resposta plana do backend
 * para o formato usado internamente pelo aplicativo.
 */
export async function login(
  credentials: LoginDTO
): Promise<LoginResponseDTO> {

  const { data } = await api.post<BackendLoginResponse>(
    '/auth/login',
    {
      email: credentials.login.trim(),
      senha: credentials.senha,
    }
  );

  // O backend atualmente retorna o perfil
  // exatamente como está cadastrado no banco.
  // Normalizamos para ALUNO / PROFESSOR / GESTOR.
  const perfilNormalizado =
    typeof data.perfil === 'string'
      ? data.perfil.trim().toUpperCase()
      : '';

  if (
    !data ||
    !data.token ||
    !data.id ||
    !data.nome ||
    !data.email ||
    !isPerfilUsuario(perfilNormalizado)
  ) {
    throw new Error(
      'Resposta de login inválida do servidor.'
    );
  }

  return {
    token: data.token,
    tipoToken: 'Bearer',
    usuario: {
      id: data.id,
      nome: data.nome,
      email: data.email,
      perfil: perfilNormalizado,
    },
  };
}