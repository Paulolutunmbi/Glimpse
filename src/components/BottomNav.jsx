export default function BottomNav() {
  return (
    <nav className="bg-white/90 backdrop-blur-xl dark:bg-gray-900/90 text-rose-500 dark:text-rose-400 font-['Plus_Jakarta_Sans'] text-[10px] font-semibold border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-3 rounded-t-3xl border-t">
      {/* Active Tab: Home */}
      <a className="flex flex-col items-center justify-center text-rose-500 scale-110 transition-transform active:opacity-70 gap-1" href="#home">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        Home
      </a>
      {/* Inactive Tabs */}
      <a className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 active:opacity-70 gap-1 hover:text-rose-400 transition-colors" href="#explore">
        <span className="material-symbols-outlined">explore</span>
        Explore
      </a>
      <a className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 active:opacity-70 gap-1 hover:text-rose-400 transition-colors" href="#chat">
        <span className="material-symbols-outlined">chat_bubble</span>
        Chat
      </a>
      <a className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 active:opacity-70 gap-1 hover:text-rose-400 transition-colors" href="#profile">
        <span className="material-symbols-outlined">account_circle</span>
        Profile
      </a>
    </nav>
  );
}
