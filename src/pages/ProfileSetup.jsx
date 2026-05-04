const backgroundImageUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMz8ScvU_5mTOboT-iwVSBBpnCN-s9ros5qOnSGy5rrXQibzEP6vKyP-9H5_l5i31fvXhmRIYOLXYl319Dix6wiQE0RFb_Eo5jcTRK2L-I9x0FOeoRKvLMZnzNxJd-Z1W1hpjY2scV0Yxfx21WEaJ5NvmZ_P5AacT98DxnpFE6GStQzUMmELiZ5sy9H81JIQHv_WgwtrWGPWJQ0EG_suB_SNYL35ZRau8z8yCA4ExtnQv2U3y_pMPKTB4V9gtmOCKWcfkSXIX0DA';

const ProfileSetup = () => {
  return (
    <div className="relative min-h-screen bg-background text-on-background antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[60px] opacity-30"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        aria-hidden="true"
      />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-margin_mobile py-10 md:px-margin_desktop">
        <section className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-surface-container bg-surface-container-lowest shadow-[0_20px_40px_-10px_rgba(0,0,0,0.04)]">
          <div className="px-6 py-8 md:px-10 md:py-10">
            <div className="mb-8 text-center">
              <span className="rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                Step 1 of 1
              </span>
            </div>

            <header className="mb-10 text-center">
              <h1 className="font-h2 text-h2 text-on-surface">Complete your profile</h1>
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                Let the community know who you are. A great photo goes a long way.
              </p>
            </header>

            <form className="flex flex-col gap-8">
              <div className="flex flex-col items-center justify-center">
                <div className="group flex cursor-pointer flex-col items-center">
                  <div className="relative mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-outline-variant bg-surface-container-low transition-all group-hover:border-primary-container group-hover:bg-surface-container">
                    <span
                      className="material-symbols-outlined text-4xl text-on-surface-variant transition-colors group-hover:text-primary-container"
                      aria-hidden="true"
                    >
                      add_a_photo
                    </span>
                    <div className="absolute inset-0 bg-primary-container/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <button
                    className="flex items-center gap-2 font-label-md text-label-md text-primary-container transition-colors hover:text-primary"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      upload
                    </span>
                    Add Profile Photo
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="ml-1 font-label-sm text-label-sm text-on-surface" htmlFor="username">
                    Username
                  </label>
                  <input
                    className="w-full rounded-xl border border-surface-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container"
                    id="username"
                    name="username"
                    placeholder="@yourname"
                    type="text"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="ml-1 font-label-sm text-label-sm text-on-surface" htmlFor="bio">
                    Bio
                  </label>
                  <textarea
                    className="w-full resize-none rounded-xl border border-surface-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container"
                    id="bio"
                    name="bio"
                    placeholder="Photographer, traveler, coffee enthusiast..."
                    rows={3}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="ml-1 font-label-sm text-label-sm text-on-surface" htmlFor="website">
                    Website or Portfolio Link
                  </label>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
                      aria-hidden="true"
                    >
                      link
                    </span>
                    <input
                      className="w-full rounded-xl border border-surface-variant bg-surface-container-low py-3 pl-11 pr-4 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-container"
                      id="website"
                      name="website"
                      placeholder="https://"
                      type="url"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="ml-1 font-label-sm text-label-sm text-on-surface">
                  What do you love capturing?
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="flex items-center gap-1 rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md text-white shadow-sm transition-transform active:scale-95"
                    type="button"
                  >
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                      aria-hidden="true"
                    >
                      flight
                    </span>
                    Travel
                  </button>
                  <button
                    className="rounded-full border border-transparent bg-secondary-container/50 px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-all hover:border-surface-variant hover:bg-secondary-container hover:text-on-surface active:scale-95"
                    type="button"
                  >
                    Photography
                  </button>
                  <button
                    className="rounded-full border border-transparent bg-secondary-container/50 px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-all hover:border-surface-variant hover:bg-secondary-container hover:text-on-surface active:scale-95"
                    type="button"
                  >
                    Food
                  </button>
                  <button
                    className="rounded-full border border-transparent bg-secondary-container/50 px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-all hover:border-surface-variant hover:bg-secondary-container hover:text-on-surface active:scale-95"
                    type="button"
                  >
                    Lifestyle
                  </button>
                  <button
                    className="flex items-center gap-1 rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md text-white shadow-sm transition-transform active:scale-95"
                    type="button"
                  >
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                      aria-hidden="true"
                    >
                      devices
                    </span>
                    Tech
                  </button>
                  <button
                    className="rounded-full border border-transparent bg-secondary-container/50 px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-all hover:border-surface-variant hover:bg-secondary-container hover:text-on-surface active:scale-95"
                    type="button"
                  >
                    Nature
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-b-2 border-[#D64348] bg-primary-container py-4 text-center font-label-md text-label-md text-white shadow-[0_4px_14px_0_rgba(255,90,95,0.25)] transition-all hover:bg-[#E04E53] active:scale-[0.98]"
                  type="button"
                >
                  Complete Profile
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </button>
                <button
                  className="w-full border-none bg-transparent py-3 text-center font-label-md text-label-md text-on-surface-variant transition-colors hover:text-on-surface"
                  type="button"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfileSetup;
