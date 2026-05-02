const Button = ({ children, loading = false, className = '', disabled, ...props }) => {
  return (
    <button
      className={`flex h-12 w-full items-center justify-center rounded-lg bg-primary-container px-6 font-label-md text-label-md text-on-primary shadow-[0_10px_24px_-14px_rgba(181,35,48,0.72)] transition-all duration-200 hover:bg-[#f94c53] hover:shadow-[0_14px_28px_-16px_rgba(181,35,48,0.82)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-container/35 focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-65 dark:focus:ring-offset-[#201313] ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Sending...' : children}
    </button>
  );
};

export default Button;
