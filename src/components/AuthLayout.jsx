const authImage =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=90';

const AuthLayout = ({
  children,
  imageAlt = 'A diverse group of people gathered together and smiling in a warm candid photograph.',
  kicker = 'Reset your access. Keep capturing moments.',
  description = "Our community is built on the shared stories we tell through lenses. Let's get you back to the view.",
  logoSizeClass = 'h-16',
  sidebarLogoSizeClass = 'h-14',
}) => {

  return (
    <div className="min-h-screen bg-background font-body-md text-on-background selection:bg-primary-container selection:text-white dark:bg-[#1d1111] dark:text-[#ffedeb]">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="relative hidden min-h-screen w-1/2 overflow-hidden lg:flex">
          <img
            src={authImage}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-black/35" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-xxl">
            <div className="max-w-[560px]">
              <img
                src="/images/glimpse-logo-light-dark.png"
                alt="Glimpse"
                className={`${sidebarLogoSizeClass} w-auto object-contain`}
              />
              <div className="mt-lg space-y-md">
                <h1 className="max-w-[520px] font-display text-[28px] font-bold leading-tight text-white lg:text-[32px]">
                  {kicker}
                </h1>
                <p className="max-w-[500px] font-body-md text-[16px] leading-7 text-white/82">
                  {description}
                </p>
              </div>
            </div>

            <p className="font-label-sm text-label-sm text-white/62">(c) 2026 Glimpse</p>
          </div>
        </aside>

        <main className="relative flex flex-1 items-center justify-center bg-surface px-margin_mobile py-[82px] sm:px-xl md:py-xxl lg:px-xxl dark:bg-[#201313]">
          <header className="absolute left-margin_mobile right-margin_mobile top-margin_mobile flex items-center justify-between sm:left-xl sm:right-xl lg:hidden">
            <img
              src="/images/glimpse-logo-light-dark.png"
              alt="Glimpse"
              className={`${logoSizeClass} w-auto object-contain`}
            />
          </header>

          <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-52 overflow-hidden md:block lg:hidden">
            <img
              src={authImage}
              alt=""
              className="h-full w-full object-cover opacity-[0.08] grayscale dark:opacity-[0.16]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface dark:to-[#201313]" />
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
