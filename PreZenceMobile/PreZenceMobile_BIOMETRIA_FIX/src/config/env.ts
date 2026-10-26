// As variáveis EXPO_PUBLIC_* precisam ser lidas de forma estática
// (process.env.NOME) para que o Expo as injete no bundle.

/** Remove espaços e aspas que às vezes sobram do arquivo .env. */
function clean(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']+|["']+$/g, '').trim();
}

const rawUrl = clean(process.env.EXPO_PUBLIC_API_URL);
const rawPrefix = clean(process.env.EXPO_PUBLIC_API_PREFIX);
const rawBiometriaUrl = clean(process.env.EXPO_PUBLIC_BIOMETRIA_URL);
const rawBiometriaPath = clean(process.env.EXPO_PUBLIC_BIOMETRIA_RECONHECER_PATH) || '/reconhecer';
const rawBiometriaImageField = clean(process.env.EXPO_PUBLIC_BIOMETRIA_IMAGE_FIELD) || 'imagem';

function deriveBiometriaUrl(apiUrl: string): string {
  const match = apiUrl.match(/^(https?:\/\/)(\[[^\]]+\]|[^\/:]+)(?::\d+)?/i);
  return match ? `${match[1]}${match[2]}:5000` : '';
}

function normalizeBaseUrl(url: string, prefix: string): string {
  const base = url.replace(/\/+$/, '');
  const path = prefix.replace(/^\/+|\/+$/g, '');
  return path ? `${base}/${path}` : base;
}

function joinUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
}

export const isApiUrlConfigured =
  /^https?:\/\/[^\s/:]+(:\d+)?/i.test(rawUrl) && !/X\.X|SEU-IP/i.test(rawUrl);

if (!isApiUrlConfigured) {
  console.warn(
    `[env] EXPO_PUBLIC_API_URL inválida ou ausente (valor lido: "${rawUrl}"). ` +
      'Use o formato http://IPV4:8080, sem aspas, e reinicie com "npx expo start -c".'
  );
}

const effectiveBiometriaUrl = rawBiometriaUrl || deriveBiometriaUrl(rawUrl);

const biometriaConfigured =
  /^https?:\/\/[^\s/:]+(:\d+)?/i.test(effectiveBiometriaUrl) && !/X\.X|SEU-IP/i.test(effectiveBiometriaUrl);

export const env = {
  apiBaseUrl: normalizeBaseUrl(rawUrl, rawPrefix),
  biometriaBaseUrl: effectiveBiometriaUrl.replace(/\/+$/, ''),
  biometriaRecognizePath: rawBiometriaPath,
  biometriaImageField: rawBiometriaImageField,
  biometriaConfigured,
  biometriaReconhecerUrl: biometriaConfigured ? joinUrl(effectiveBiometriaUrl, rawBiometriaPath) : '',
};
