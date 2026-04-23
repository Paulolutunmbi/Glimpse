export default function Sidebar() {
  return (
    <nav className="bg-white dark:bg-gray-900 text-rose-500 dark:text-rose-400 font-['Plus_Jakarta_Sans'] text-base font-medium h-screen w-64 fixed left-0 top-0 border-r border-gray-100 dark:border-gray-800 hidden lg:flex flex-col p-6 gap-2 z-50">
      <div className="mb-8">
        <img
          src="/images/glimpse-logo-light-dark.png"
          alt="Glimpse"
          className="h-8 object-contain"
        />
        <div className="font-body-sm text-secondary font-normal mt-1 tracking-normal">Warm Minimalism</div>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {/* Active Tab: Home */}
        <a className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl px-4 py-3 font-bold flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          Home
        </a>
        {/* Inactive Tabs */}
        <a className="text-gray-600 dark:text-gray-400 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all flex items-center gap-4" href="#">
          <span className="material-symbols-outlined">auto_awesome</span>
          Moments
        </a>
        <a className="text-gray-600 dark:text-gray-400 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all flex items-center gap-4" href="#">
          <span className="material-symbols-outlined">forum</span>
          Messages
        </a>
        <a className="text-gray-600 dark:text-gray-400 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all flex items-center gap-4" href="#">
          <span className="material-symbols-outlined">person</span>
          Profile
        </a>
        {/* The prompt said: "Do NOT include any admin button or admin UI anywhere".
            So I will remove the Admin tab. */}
        <a className="text-gray-600 dark:text-gray-400 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all flex items-center gap-4" href="#">
          <span className="material-symbols-outlined">settings</span>
          Settings
        </a>
      </div>
      <button className="bg-primary-container text-white font-label-md py-3 px-4 rounded-xl shadow-[0_4px_12px_rgba(255,90,95,0.2)] mt-auto hover:opacity-90 transition-opacity flex justify-center items-center gap-2">
        <span className="material-symbols-outlined">add_circle</span>
        Create Moment
      </button>
    </nav>
  );
}
