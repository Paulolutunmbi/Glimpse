const PROFILE_ROUTE_PREFIX = '/u';

export const normalizeUsername = (username) =>
  String(username || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();

export const buildProfilePath = (username, { prefix = PROFILE_ROUTE_PREFIX } = {}) => {
  const slug = normalizeUsername(username);
  if (!slug) return prefix;
  return `${prefix}/${encodeURIComponent(slug)}`;
};

export const buildProfileUrl = (username, options = {}) => {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  return `${origin}${buildProfilePath(username, options)}`;
};

export const getProfileUsername = (profile) =>
  normalizeUsername(
    profile?.username ||
      profile?.user?.username ||
      profile?.account?.username ||
      profile?.profile?.username ||
      ''
  );

export const isUsernameConflictError = (error) => {
  const message = [
    error?.response?.data?.message,
    error?.response?.data?.error,
    error?.response?.data?.details,
    error?.message,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (error?.response?.status === 409) return true;

  return (
    message.includes('username') &&
    (message.includes('taken') || message.includes('exists') || message.includes('already') || message.includes('duplicate'))
  );
};
