export default function Navbar({ currentUser, search, onSearchChange }) {
  const avatarSrc =
    currentUser?.profile?.avatar ||
    currentUser?.profilePicture ||
    currentUser?.avatar ||
    '/images/glimpse-icon.png';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-full items-center justify-between gap-4 px-4 py-3 md:px-8">
        <div className="flex flex-1 items-center gap-6">
          <div className="hidden text-2xl font-bold tracking-tight text-rose-500 md:block font-display">
            Glimpse
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
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-sm font-bold tracking-tight text-rose-500 md:hidden font-display">
          Glimpse
        </div>

        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 md:gap-4">
          <button aria-label="Notifications" className="press-in relative rounded-full p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
          <button aria-label="Mail" className="press-in rounded-full p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
            <span className="material-symbols-outlined">mail</span>
          </button>
          <button aria-label="Upload" className="press-in hidden rounded-full p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 md:block">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <img
            alt="User avatar"
            className="h-8 w-8 rounded-full border border-surface-container object-cover"
            src={avatarSrc}
          />
        </div>
      </div>
    </header>
  );
}
