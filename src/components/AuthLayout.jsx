const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen w-full bg-surface text-on-surface">
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-tertiary-container/30 blur-3xl" />
        </div>

        <div className="relative w-full max-w-5xl grid gap-6 md:grid-cols-[1.1fr_1fr] items-stretch">
          <div className="hidden md:flex flex-col justify-between rounded-3xl bg-surface-container-lowest p-10 shadow-lg border border-surface-variant">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-label-sm text-primary">
                Glimpse
              </span>
              <h1 className="mt-6 text-display font-display text-on-surface">
                Share moments. Stay close.
              </h1>
              <p className="mt-3 text-body-lg text-on-surface-variant">
                A calm space to connect with the people who matter, without the noise.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 text-body-sm text-on-surface-variant">
              <div className="rounded-2xl bg-surface-container-low p-4 border border-surface-variant">
                <p className="text-label-md text-on-surface">Fast onboarding</p>
                <p className="mt-2">Create an account and verify in minutes.</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4 border border-surface-variant">
                <p className="text-label-md text-on-surface">Private by design</p>
                <p className="mt-2">Your data stays protected and secure.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-surface-container-lowest border border-surface-variant shadow-lg p-8 sm:p-10">
            <div className="space-y-2">
              <p className="text-label-md uppercase tracking-[0.14em] text-primary">Welcome</p>
              <h2 className="text-h1 font-display text-on-surface">{title}</h2>
              {subtitle ? (
                <p className="text-body-md text-on-surface-variant">{subtitle}</p>
              ) : null}
            </div>

            <div className="mt-8 space-y-6">
              {children}
            </div>

            {footer ? <div className="mt-8 text-body-sm text-on-surface-variant">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
