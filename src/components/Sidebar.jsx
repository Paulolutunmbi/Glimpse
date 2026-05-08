const links = [
  ['home', 'Home'],
  ['auto_awesome', 'Moments', true],
  ['forum', 'Messages'],
  ['person', 'Profile'],
  ['dashboard', 'Admin'],
  ['settings', 'Settings'],
];

export default function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col gap-2 border-r border-gray-100 bg-white p-6 pt-24 text-base font-medium dark:border-gray-800 dark:bg-gray-900 lg:flex font-display">
      <div className="mt-4 flex flex-1 flex-col gap-2">
        {links.map(([icon, label, active]) => (
          <a
            key={label}
            className={`press-in flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
              active
                ? 'bg-rose-50 font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50'
            }`}
            href={label === 'Profile' ? '/profile' : '#'}
          >
            <span
              className={`material-symbols-outlined ${active ? 'material-symbols-filled' : ''}`}
            >
              {icon}
            </span>
            {label}
          </a>
        ))}
      </div>

      <button className="press-in mt-auto flex items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 font-label-md font-semibold text-white shadow-[0_4px_14px_rgba(255,90,95,0.25)] transition-colors hover:bg-primary">
        <span className="material-symbols-outlined text-[20px]">add</span>
        Create Moment
      </button>
    </nav>
  );
}
