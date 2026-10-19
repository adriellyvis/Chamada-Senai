// As variáveis EXPO_PUBLIC_* precisam ser lidas de forma estática
// (process.env.NOME) para que o Expo as injete no bundle.

/** Remove espaços e aspas que às vezes sobram do arquivo .env. */
function clean(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']+|["']+$/g, '').trim();
}

const rawUrl = clean(process.env.EXPO_PUBLIC_API_URL);
const rawPrefix = clean(process.env.EXPO_PUBLIC_API_PREFIX);

function normalizeBaseUrl(url: string, prefix: string): string {
  const base = url.replace(/\/+$/, '');
  const path = prefix.replace(/^\/+|\/+$/g, '');
  return path ? `${base}/${path}` : base;
}

export const isApiUrlConfigured =
  /^https?:\/\/[^\s/:]+(:\d+)?/i.test(rawUrl) && !/X\.X|SEU-IP/i.test(rawUrl);

if (!isApiUrlConfigured) {
  console.warn(
    `[env] EXPO_PUBLIC_API_URL inválida ou ausente (valor lido: "${rawUrl}"). ` +
      'Use o formato http://IPV4:8080, sem aspas, e reinicie com "npx expo start -c".'
  );
}

export const env = {
  apiBaseUrl: normalizeBaseUrl(rawUrl, rawPrefix),
};
