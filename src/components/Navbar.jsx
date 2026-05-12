import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import Avatar from './Avatar';

export default function Navbar({ currentUser, search, onSearchChange }) {
  const navigate = useNavigate();
  const { notificationCount, messageCount } = useUser();
  const avatarSrc =
    currentUser?.profile?.avatar ||
    currentUser?.profilePicture ||
    currentUser?.avatar ||
    '';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-full items-center justify-between gap-4 px-4 py-3 md:px-8">
        <div className="flex flex-1 items-center gap-6">
          <div className="hidden md:block">
            <img
              src="/images/glimpse-logo-light-dark.png"
              alt="Glimpse"
              className="glimpse-logo-compact object-contain"
            />
          </div>
          <button className="text-rose-500 md:hidden" aria-label="Search">
            <span className="material-symbols-outlined">search</span>
          </button>
          <label className="relative hidden w-full max-w-md items-center md:flex">
            <span className="material-symbols-outlined absolute left-3 text-secondary">search</span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container py-2 pl-10 pr-4 text-body-sm text-on-surface outline-none transition-all placeholder:text-secondary focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
              placeholder="Search moments, tags, creators..."
              type="search"
              value={search || ''}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </label>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
          <img
            src="/images/glimpse-logo-light-dark.png"
            alt="Glimpse"
            className="glimpse-logo-compact object-contain"
          />
        </div>

        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 md:gap-4">
          <button
            aria-label="Notifications"
            className="press-in relative rounded-full p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            type="button"
            onClick={() => navigate('/notifications')}
          >
            <span className="material-symbols-outlined">notifications</span>
            {notificationCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            ) : null}
          </button>
          <button
            aria-label="Messages"
            className="press-in relative rounded-full p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            type="button"
            onClick={() => navigate('/messages')}
          >
            <span className="material-symbols-outlined">mail</span>
            {messageCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-rose-500 px-1 text-[9px] text-white">
                {messageCount > 9 ? '9+' : messageCount}
              </span>
            ) : null}
          </button>
          <button
            aria-label="Upload"
            className="press-in hidden rounded-full p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 md:block"
            type="button"
            onClick={() => navigate('/create')}
          >
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <Avatar
            src={avatarSrc}
            name={currentUser?.username || currentUser?.name}
            alt="User avatar"
            className="h-8 w-8 border border-surface-container"
          />
        </div>
      </div>
    </header>
  );
}
