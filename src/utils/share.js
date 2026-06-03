const getOrigin = () => window.location.origin;

export const buildShareUrl = (type, value) => {
  const safeValue = encodeURIComponent(String(value || '').trim());
  if (!safeValue) return getOrigin();

  if (type === 'profile') return `${getOrigin()}/u/${safeValue.replace(/^%40/, '')}`;
  if (type === 'reel') return `${getOrigin()}/reels/${safeValue}`;
  if (type === 'group') return `${getOrigin()}/messages/group/${safeValue}`;
  return `${getOrigin()}/post/${safeValue}`;
};

export const copyShareUrl = async (url) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return url;
  }

  const input = document.createElement('textarea');
  input.value = url;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(input);
  }

  return url;
};

export const shareToClipboard = async ({ type, id, url }) => {
  const shareUrl = url || buildShareUrl(type, id);
  await copyShareUrl(shareUrl);
  return shareUrl;
};
