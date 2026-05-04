const Settings = () => {
  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-zinc-100 bg-white/80 shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 font-['Plus_Jakarta_Sans']">
          <div className="flex items-center gap-3">
            <img
              src="/images/glimpse-logo-light-dark.png"
              alt="Glimpse"
              className="h-8 w-auto object-contain"
            />
          </div>
          <nav className="hidden items-center gap-4 md:flex">
            <span className="cursor-pointer rounded-md px-3 py-2 font-label-md text-zinc-500 transition-colors duration-200 hover:bg-zinc-50">
              Feed
            </span>
            <span className="cursor-pointer rounded-md px-3 py-2 font-label-md text-zinc-500 transition-colors duration-200 hover:bg-zinc-50">
              Explore
            </span>
            <span className="cursor-pointer rounded-md px-3 py-2 font-label-md font-semibold text-[#FF5A5F] transition-colors duration-200 hover:bg-zinc-50">
              Profile
            </span>
          </nav>
          <div className="flex items-center gap-4">
            <button
              className="rounded-full p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-50"
              type="button"
              aria-label="Open settings"
            >
              <span className="material-symbols-outlined text-[#FF5A5F]">settings</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-margin_mobile pb-24 pt-24 md:px-margin_desktop md:pb-10">
        <div className="mb-xl">
          <h1 className="font-h1 text-h1 text-on-surface">Settings</h1>
          <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
            Manage your profile, preferences, and security.
          </p>
        </div>

        <form className="space-y-lg">
          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-md font-h3 text-h3 text-on-surface">Profile Settings</h2>
            <div className="mb-lg flex flex-col items-start gap-lg md:flex-row">
              <div className="flex flex-col items-center gap-md">
                <div className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-surface-container-highest shadow-sm">
                  <img
                    alt="Profile picture preview"
                    className="h-full w-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoD2nfWta-hWW6eJbVXgUbGHrubi0xor3XUyS3aTPe7ZUh-aucnOuqd7pkb32xToLmx30_qEpJh5ZbnK6lVjCwPRpEAHuaFg_9NvoCrCIITOW5-MElQL3xLGByOZ6eb3qGhaqZkuH2g_npiHCwTY0_G8TzXOAQ5CLGJEgj2pKSqkd2XfMnuQugnd2TZ7dXM1KGkxrOVH0IoQMX9OFgQNqjfM4HHeGYdjG5Y9q5e9zMKzMw_HYPaKPsDMOcusMgcPzi7xFrrMoqXg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </div>
                </div>
                <button
                  className="font-label-md text-label-md text-primary-container transition-colors hover:text-surface-tint"
                  type="button"
                >
                  Change Photo
                </button>
              </div>

              <div className="w-full flex-1 space-y-md">
                <div>
                  <label
                    className="mb-xs block font-label-md text-label-md text-on-surface-variant"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-2 font-body-md text-body-md text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                    id="username"
                    type="text"
                    defaultValue="@jane_glimpse"
                  />
                </div>
                <div>
                  <label
                    className="mb-xs block font-label-md text-label-md text-on-surface-variant"
                    htmlFor="bio"
                  >
                    Bio
                  </label>
                  <textarea
                    className="w-full resize-none rounded-lg border border-outline-variant bg-surface-bright px-4 py-2 font-body-md text-body-md text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                    id="bio"
                    rows="3"
                    defaultValue="Curating serene moments. Photography enthusiast."
                  />
                  <p className="mt-xs text-right font-label-sm text-label-sm text-on-surface-variant/70">
                    46 / 150
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-sm font-h3 text-h3 text-on-surface">Preferences</h2>
            <p className="mb-md font-body-sm text-body-sm text-on-surface-variant">
              Select categories to personalize your Explore feed.
            </p>
            <div className="flex flex-wrap gap-sm">
              <button
                className="rounded-full bg-secondary-container px-4 py-2 font-label-md text-label-md text-on-secondary-container transition-colors duration-150 hover:bg-secondary-fixed-dim active:scale-95"
                type="button"
              >
                Photography
              </button>
              <button
                className="flex items-center gap-1 rounded-full border border-primary-container/20 bg-primary-container/10 px-4 py-2 font-label-md text-label-md text-primary-container transition-colors duration-150 hover:bg-primary-container/20 active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Minimalism
              </button>
              <button
                className="rounded-full bg-secondary-container px-4 py-2 font-label-md text-label-md text-on-secondary-container transition-colors duration-150 hover:bg-secondary-fixed-dim active:scale-95"
                type="button"
              >
                Architecture
              </button>
              <button
                className="flex items-center gap-1 rounded-full border border-primary-container/20 bg-primary-container/10 px-4 py-2 font-label-md text-label-md text-primary-container transition-colors duration-150 hover:bg-primary-container/20 active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Nature
              </button>
              <button
                className="rounded-full bg-secondary-container px-4 py-2 font-label-md text-label-md text-on-secondary-container transition-colors duration-150 hover:bg-secondary-fixed-dim active:scale-95"
                type="button"
              >
                Travel
              </button>
              <button
                className="rounded-full bg-secondary-container px-4 py-2 font-label-md text-label-md text-on-secondary-container transition-colors duration-150 hover:bg-secondary-fixed-dim active:scale-95"
                type="button"
              >
                Art
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]">
            <h2 className="mb-sm font-h3 text-h3 text-on-surface">Account Security</h2>
            <div className="mt-md flex flex-col justify-between gap-md border-t border-outline-variant/30 pt-md md:flex-row md:items-center">
              <div>
                <p className="font-label-md text-label-md text-on-surface">Password</p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  We&apos;ll send a secure link to your email to reset your password.
                </p>
              </div>
              <button
                className="whitespace-nowrap rounded-lg border border-outline-variant px-6 py-2 font-label-md text-label-md text-on-surface transition-colors duration-150 hover:bg-surface-container active:scale-95"
                type="button"
              >
                Reset Password
              </button>
            </div>
          </section>

          <div className="flex items-center justify-end gap-md pt-md">
            <button
              className="rounded-lg px-6 py-3 font-label-md text-label-md text-secondary transition-colors duration-150 hover:bg-surface-container active:scale-95"
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg border-b-2 border-surface-tint bg-primary-container px-8 py-3 font-label-md text-label-md text-white shadow-sm transition-colors duration-150 hover:bg-surface-tint active:scale-95"
              type="submit"
            >
              Save Changes
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Settings;
