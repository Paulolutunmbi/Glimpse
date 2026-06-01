import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import Avatar from './Avatar';

export default function Navbar({ currentUser, search, onSearchChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { notificationCount, messageCount } = useUser();
  const avatarSrc =
    currentUser?.profile?.avatar ||
    currentUser?.profilePicture ||
    currentUser?.avatar ||
    '';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-full items-center justify-between gap-2 sm:gap-4 px-4 py-3 md:px-8">
        <div className="flex flex-1 items-center gap-3 sm:gap-6 min-w-0">
          <img src="/images/glimpse-logo-light-dark.png" alt="Glimpse" className="h-8 w-auto md:hidden object-contain" />
          <button
            className={`flex items-center gap-2 rounded-full border px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 md:hidden ${
              location.pathname === '/search'
                ? 'border-primary-container bg-primary-container text-white shadow-md'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container/30'
            }`}
            aria-label="Search"
            type="button"
            onClick={() => navigate('/search')}
          >
            <span className="material-symbols-outlined text-base sm:text-[20px]">search</span>
            <span className="hidden sm:inline">Search</span>
          </button>
          <label className="relative hidden w-full max-w-4xl items-center md:flex flex-1">
            <span className="material-symbols-outlined absolute left-3 text-secondary text-lg flex-shrink-0">search</span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-10 pr-4 text-body-sm text-on-surface outline-none transition-all placeholder:text-secondary focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 hover:border-outline focus:shadow-md active:ring-primary-container/30"
              placeholder="Search moments, tags, creators..."
              type="search"
              value={search || ''}
              onChange={(event) => {
                if (onSearchChange) {
                  onSearchChange(event.target.value);
                } else {
                  navigate(`/search`);
                }
              }}
              onFocus={() => {
                if (location.pathname !== '/search') {
                  navigate('/search');
                }
              }}
            />
          </label>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 text-gray-500 dark:text-gray-400 md:gap-4 flex-shrink-0">
          <button
            aria-label="Notifications"
            className="press-in relative rounded-full p-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container/30"
            type="button"
            onClick={() => navigate('/notifications')}
          >
            <span className="material-symbols-outlined">notifications</span>
            {notificationCount > 0 ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            ) : null}
          </button>
          <button
            aria-label="Messages"
            className="press-in relative rounded-full p-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container/30"
            type="button"
            onClick={() => navigate('/messages')}
          >
            <span className="material-symbols-outlined">mail</span>
            {messageCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-rose-500 px-1.5 text-[9px] font-semibold text-white min-w-5 h-5 flex items-center justify-center">
                {messageCount > 9 ? '9+' : messageCount}
              </span>
            ) : null}
          </button>
          <button
            aria-label="Upload"
            className="press-in hidden rounded-full p-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container/30 md:block"
            type="button"
            onClick={() => navigate('/create')}
          >
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <Avatar
            src={avatarSrc}
            name={currentUser?.username || currentUser?.name}
            alt="User avatar"
            className="h-8 w-8 border border-surface-container cursor-pointer rounded-full hover:opacity-80 transition-opacity"
            onClick={() => navigate('/profile')}
          />
        </div>
      </div>
    </header>
  );
}
