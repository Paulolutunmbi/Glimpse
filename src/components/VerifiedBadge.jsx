export default function VerifiedBadge({ verified = false, className = '', size = 14 }) {
  if (!verified) return null;

  const dimension = Number(size) || 14;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.6)] ${className}`}
      aria-label="Verified account"
      title="Verified"
      style={{ width: dimension, height: dimension }}
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.max(8, Math.round(dimension * 0.68))}
        height={Math.max(8, Math.round(dimension * 0.68))}
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M9.55 16.2 5.8 12.45l1.4-1.4 2.35 2.35 6.45-6.45 1.4 1.4L9.55 16.2z"
        />
      </svg>
    </span>
  );
}
