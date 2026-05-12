import { useMemo, useState } from 'react';

const getInitials = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase();
};

export default function Avatar({ src, name, className = '', alt = 'User avatar' }) {
  const [hasError, setHasError] = useState(false);
  const initials = useMemo(() => getInitials(name), [name]);
  const showFallback = !src || hasError;

  if (showFallback) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-surface-container-high text-on-surface ${className}`}
        aria-label={alt}
        role="img"
      >
        <span className="text-xs font-semibold">
          {initials || 'U'}
        </span>
      </div>
    );
  }

  return (
    <img
      className={`rounded-full object-cover ${className}`}
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
