import { useLocation, useNavigate } from 'react-router-dom';
import { navigationItems } from '../constants/navigation';
import { useUser } from '../context/UserContext.jsx';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notificationCount, messageCount } = useUser();

  const sidebarItems = navigationItems.filter((item) => item.showInSidebar);

  const getBadge = (itemKey) => {
    if (itemKey === 'notifications') return notificationCount;
    if (itemKey === 'messages') return messageCount;
    return 0;
  };
  return (
    <nav className="fixed left-0 top-0 z-30 hidden h-screen w-72 flex-col gap-6 border-r border-gray-100 bg-white px-6 pb-6 pt-8 text-base font-medium dark:border-gray-800 dark:bg-gray-900 md:flex font-display">
      <div className="flex items-center gap-3 px-2">
        <img
          src="/images/glimpse-logo-light-dark.png"
          alt="Glimpse"
          className="h-8 w-auto object-contain"
        />
        <span className="text-lg font-semibold tracking-wide text-on-surface">Glimpse</span>
      </div>

      <div className="mt-2 flex flex-1 flex-col gap-2">
        {sidebarItems.map((link) => {
          const badge = getBadge(link.key);
          return (
            <a
              key={link.label}
              className={`press-in flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
                location.pathname === link.path
                  ? 'bg-rose-50 font-semibold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50'
              }`}
              href={link.path}
              onClick={(event) => {
                event.preventDefault();
                navigate(link.path);
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined ${
                    location.pathname === link.path ? 'material-symbols-filled' : ''
                  }`}
                >
                  {link.icon}
                </span>
                {link.label}
              </span>
              {badge > 0 ? (
                <span className="min-w-[22px] rounded-full bg-rose-500 px-2 py-0.5 text-center text-xs font-semibold text-white">
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </a>
          );
        })}
      </div>

      <button
        className="press-in flex items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 font-label-md font-semibold text-white shadow-[0_4px_14px_rgba(255,90,95,0.25)] transition-colors hover:bg-primary"
        type="button"
        onClick={() => navigate('/create')}
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        Create Moment
      </button>

      <button
        className="press-in flex items-center gap-3 rounded-xl px-4 py-3 text-gray-600 transition-all hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
        type="button"
        onClick={() => navigate('/settings')}
      >
        <span className="material-symbols-outlined">menu</span>
        More
      </button>

      <a
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-500 transition-all hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-800/50"
        href="https://about.meta.com"
        target="_blank"
        rel="noreferrer"
      >
        <span className="material-symbols-outlined">grid_view</span>
        Also from Meta
      </a>
    </nav>
  );
}
