const getInitials = (name = '') => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'G';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function Avatar({
  src,
  name,
  alt,
  sizeClassName = 'h-10 w-10',
  className = '',
  textClassName = 'text-sm',
  fallbackClassName = '',
}) {
  const initials = getInitials(name || alt);
  const shared = `inline-flex items-center justify-center rounded-full ${sizeClassName} ${className}`;

  if (src) {
    return (
      <img
        alt={alt || name || 'User avatar'}
        className={`${shared} object-cover`}
        src={src}
      />
    );
  }

  return (
    <div
      className={`${shared} bg-gradient-to-br from-rose-400/90 via-orange-400/80 to-amber-300/90 text-white ${fallbackClassName}`}
      aria-label={alt || name || 'User avatar'}
      role="img"
    >
      <span className={`font-semibold ${textClassName}`}>{initials}</span>
    </div>
  );
}
