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
    <nav className="fixed left-0 top-0 z-30 hidden h-[100dvh] w-72 flex-col gap-6 border-r border-gray-100 bg-white px-6 pb-6 pt-8 text-base font-medium dark:border-gray-800 dark:bg-gray-900 md:flex font-display">
      <div className="flex items-center gap-3 px-2 pb-2 border-b border-outline-variant/20">
        <img
          src="/images/glimpse-icon.png"
          alt="Glimpse"
          className="object-contain h-8 w-8"
        />
      </div>

      <div className="mt-2 flex flex-1 flex-col gap-2">
        {sidebarItems.map((link) => {
          const badge = getBadge(link.key);
          return (
            <a
              key={link.label}
              className={`press-in flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
                location.pathname === link.path
                  ? 'bg-rose-50 font-semibold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50 active:scale-95'
              }`}
              href={link.path}
              onClick={(event) => {
                event.preventDefault();
                navigate(link.path);
              }}
              title={link.label}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span
                  className={`material-symbols-outlined text-[24px] transition-all flex-shrink-0 ${
                    location.pathname === link.path ? 'material-symbols-filled' : ''
                  }`}
                >
                  {link.icon}
                </span>
                <span className="hidden lg:inline truncate">{link.label}</span>
              </span>
              {badge > 0 ? (
                <span className="min-w-[22px] rounded-full bg-rose-500 px-2 py-0.5 text-center text-xs font-bold text-white flex-shrink-0">
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </a>
          );
        })}
      </div>

      <button
        className="press-in flex items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 font-label-md font-bold text-white shadow-[0_4px_14px_rgba(255,90,95,0.25)] transition-all duration-200 hover:bg-primary hover:shadow-[0_6px_20px_rgba(255,90,95,0.35)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container/30 lg:justify-start"
        type="button"
        onClick={() => navigate('/create')}
      >
        <span className="material-symbols-outlined text-[20px] flex-shrink-0">add</span>
        <span className="hidden lg:inline">Create Moment</span>
      </button>

    </nav>
  );
}
