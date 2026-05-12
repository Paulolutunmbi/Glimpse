import { useLocation, useNavigate } from 'react-router-dom';
import { navigationItems } from '../constants/navigation';
import { useUser } from '../context/UserContext.jsx';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notificationCount } = useUser();
  const bottomItems = navigationItems.filter((item) => item.showInBottomNav);
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-3xl border-t border-gray-100 bg-white/90 px-6 pb-8 pt-3 text-[10px] font-semibold shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90 md:hidden font-display">
      {bottomItems.map((item) => (
        <a
          key={item.label}
          className={`flex flex-col items-center justify-center gap-1 active:opacity-70 ${
            location.pathname === item.path
              ? 'scale-110 text-rose-500 transition-transform'
              : 'text-gray-400 transition-colors hover:text-rose-400 dark:text-gray-500'
          }`}
          href={item.path}
          onClick={(event) => {
            event.preventDefault();
            navigate(item.path);
          }}
        >
          <span className="relative">
            <span
              className={`material-symbols-outlined ${
                location.pathname === item.path ? 'material-symbols-filled' : ''
              }`}
            >
              {item.icon}
            </span>
            {item.key === 'notifications' && notificationCount > 0 ? (
              <span className="absolute -right-2 -top-1 rounded-full bg-rose-500 px-1 text-[8px] text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            ) : null}
          </span>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
