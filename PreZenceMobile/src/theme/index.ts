import { AppColors, darkColors, lightColors } from './colors';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radii = { sm: 10, md: 14, lg: 20, xl: 26, full: 999 };
export const getTheme = (dark: boolean): AppColors => (dark ? darkColors : lightColors);
export const theme = { colors: lightColors, spacing, borderRadius: { sm: radii.sm, md: radii.md, lg: radii.lg, full: radii.full }, radii };
