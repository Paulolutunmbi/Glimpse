export default function Navbar({ currentUser }) {
  return (
    <header className="bg-white/80 backdrop-blur-md dark:bg-gray-900/80 text-rose-500 dark:text-rose-400 font-['Plus_Jakarta_Sans'] text-sm antialiased sticky top-0 w-full z-40 border-b border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center gap-3 px-4 md:px-6 lg:px-8 py-3">
      {/* Mobile Brand with logo — hidden on desktop since Sidebar has it */}
      <div className="lg:hidden flex items-center gap-2">
        <img
          src="/images/glimpse-logo-light-dark.png"
          alt="Glimpse"
          className="h-14 sm:h-16 md:h-20 object-contain"
        />
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-surface-variant focus-within:border-primary-container transition-colors w-64 lg:w-96">
        <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
        <input
          className="bg-transparent border-none focus:ring-0 text-body-sm text-on-surface w-full p-0 placeholder-on-surface-variant outline-none"
          placeholder="Search moments..."
          type="text"
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors p-2 rounded-full">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors p-2 rounded-full">
          <span className="material-symbols-outlined">mail</span>
        </button>
        <img
          alt="User avatar"
          className="w-8 h-8 rounded-full border border-surface-variant cursor-pointer object-cover"
          src={currentUser?.avatar}
        />
      </div>
    </header>
  );
}
