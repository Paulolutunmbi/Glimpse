const InputField = ({
  id,
  label,
  icon,
  error,
  endAction,
  className = '',
  ...props
}) => {
  const describedBy = error ? `${id}-error` : undefined;
  const inputPaddingRight = endAction ? 'pr-12' : 'pr-4';

  return (
    <div className={`space-y-sm ${className}`}>
      <label className="block font-label-md text-label-md text-on-surface dark:text-[#ffedeb]" htmlFor={id}>
        {label}
      </label>
      <div className="group relative">
        {icon ? (
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[21px] text-outline transition-colors group-focus-within:text-primary-container">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={`block h-12 w-full rounded-lg border border-outline-variant bg-surface-container-low py-3 pl-12 ${inputPaddingRight} font-body-md text-body-md text-on-surface placeholder:text-outline transition-all duration-200 focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/25 dark:border-[#654746] dark:bg-[#301f1e] dark:text-[#ffedeb] dark:placeholder:text-[#bfa3a1]`}
          {...props}
        />
        {endAction ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {endAction}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={describedBy} className="font-body-sm text-body-sm text-error dark:text-[#ffb4ab]">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default InputField;
