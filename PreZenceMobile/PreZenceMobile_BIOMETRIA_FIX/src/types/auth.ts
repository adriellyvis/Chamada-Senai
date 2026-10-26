export const PERFIS = ['ALUNO', 'PROFESSOR', 'GESTOR'] as const;

export type PerfilUsuario = (typeof PERFIS)[number];

export function isPerfilUsuario(
  value: unknown
): value is PerfilUsuario {
  return (
    typeof value === 'string' &&
    (PERFIS as readonly string[]).includes(value)
  );
}

export type TipoLogin = 'EMAIL' | 'RA';

export interface LoginDTO {
  tipo: TipoLogin;

  email?: string;

  ra?: string;
  digitoRa?: string;
  uf?: string;

  senha: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export interface LoginResponseDTO {
  token: string;
  tipoToken: string;
  usuario: Usuario;
}