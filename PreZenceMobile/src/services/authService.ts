import { api } from './api';

import {
  isPerfilUsuario,
  LoginDTO,
  LoginResponseDTO,
} from '../types/auth';

interface BackendLoginResponse {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  token: string;
}

export async function login(
  credentials: LoginDTO
): Promise<LoginResponseDTO> {
  let payload: Record<string, string>;

  if (credentials.tipo === 'RA') {
    const ra = credentials.ra?.trim() ?? '';
    const digitoRa = credentials.digitoRa?.trim() ?? '';
    const uf = credentials.uf?.trim().toUpperCase() ?? '';

    if (!ra || !digitoRa || !uf) {
      throw new Error(
        'Informe RA, dígito RA e UF.'
      );
    }

    payload = {
      identificador: ra,
      digitoRa,
      uf,
      senha: credentials.senha,
    };
  } else {
    const email = credentials.email?.trim() ?? '';

    if (!email) {
      throw new Error('Informe seu e-mail.');
    }

    payload = {
      identificador: email,
      senha: credentials.senha,
    };
  }

  const { data } = await api.post<BackendLoginResponse>(
    '/auth/login',
    payload
  );

  const perfilNormalizado =
    typeof data?.perfil === 'string'
      ? data.perfil.trim().toUpperCase()
      : '';

  if (
    !data?.token ||
    !data?.id ||
    !data?.nome ||
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
      email: data.email ?? '',
      perfil: perfilNormalizado,
    },
  };
}