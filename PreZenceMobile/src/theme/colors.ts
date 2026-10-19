export const lightColors = {
  primary: '#0B57D0',
  primaryLight: '#E8F0FE',
  primaryStrong: '#174EA6',

  background: '#F7F8FB',
  surface: '#FFFFFF',

  textPrimary: '#1F2937',
  textSecondary: '#64748B',
  textSoft: '#94A3B8',

  border: '#E2E8F0',

  success: '#2E7D32',
  warning: '#ED6C02',
  danger: '#D32F2F',

  white: '#FFFFFF',
  black: '#000000',
};

export const darkColors: typeof lightColors = {
  primary: '#8AB4F8',
  primaryLight: '#223A5E',
  primaryStrong: '#AECBFA',

  background: '#10131A',
  surface: '#181D27',

  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textSoft: '#94A3B8',

  border: '#2B3444',

  success: '#81C995',
  warning: '#F6AD55',
  danger: '#F28B82',

  white: '#FFFFFF',
  black: '#000000',
};

// Alias mantido para os componentes mais antigos do projeto.
export const colors = lightColors;

export type AppColors = typeof lightColors;
