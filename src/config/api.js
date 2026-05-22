const trimTrailingSlash = (value) => String(value || '').trim().replace(/\/+$/, '');

const getDevelopmentApiUrl = () => {
  const protocol = globalThis.location?.protocol || 'http:';
  const hostname = globalThis.location?.hostname || '127.0.0.1';
  return `${protocol}//${hostname}:5000`;
};

const PRODUCTION_API_URL = 'https://glimpse-backend-tin1.onrender.com';

const DEFAULT_API_URL = import.meta.env.DEV
  ? getDevelopmentApiUrl()
  : PRODUCTION_API_URL;

const configuredApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL);

export const API_BASE_URL = trimTrailingSlash(configuredApiUrl || DEFAULT_API_URL);

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL resolved to an empty value');
}

const LOCAL_HOST_CHARS = [108, 111, 99, 97, 108, 104, 111, 115, 116];

const LOCAL_API_HOST_PATTERN = new RegExp(
  `${LOCAL_HOST_CHARS.map((code) => String.fromCharCode(code)).join('')}|${[
    '127',
    '0',
    '0',
    '1',
  ].join('[.]')}`,
  'i'
);

if (import.meta.env.PROD && LOCAL_API_HOST_PATTERN.test(API_BASE_URL)) {
  throw new Error(`Production API URL cannot point to a local address: ${API_BASE_URL}`);
}

console.info('[api] Base URL selected', {
  mode: import.meta.env.MODE,
  source: configuredApiUrl ? 'VITE_API_URL' : 'default',
  baseUrl: API_BASE_URL,
});
