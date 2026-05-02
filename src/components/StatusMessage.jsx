const toneStyles = {
  error:
    'border-error/25 bg-error-container text-on-error-container dark:border-[#ffb4ab]/25 dark:bg-[#4b1110] dark:text-[#ffdad6]',
  success:
    'border-tertiary/25 bg-tertiary-fixed/30 text-on-tertiary-container dark:border-[#59ddaa]/25 dark:bg-[#123428] dark:text-[#c7ffdf]',
  info:
    'border-primary-container/10 bg-surface-container-high text-on-surface-variant dark:border-[#ffb3b0]/10 dark:bg-[#4b3331] dark:text-[#f7dcdb]',
};

const toneIcons = {
  error: 'error',
  success: 'check_circle',
  info: 'info',
};

const StatusMessage = ({ tone = 'info', children, id }) => {
  return (
    <div
      id={id}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={`flex items-center justify-center gap-sm rounded-xl border px-md py-md text-center font-body-sm text-body-sm ${toneStyles[tone]}`}
    >
      <span className="material-symbols-outlined flex-shrink-0 text-[20px] text-primary-container" aria-hidden="true">
        {toneIcons[tone]}
      </span>
      <span>{children}</span>
    </div>
  );
};

export default StatusMessage;
