export default function Suggestions({ currentUser, suggestions }) {
  const currentYear = new Date().getFullYear();

  return (
    <aside className="hidden xl:flex flex-col w-80 gap-lg sticky top-24 h-max">
      {/* Current User Mini Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            alt="User avatar" 
            className="w-12 h-12 rounded-full border border-surface-variant cursor-pointer" 
            src={currentUser?.avatar} 
          />
          <div>
            <h4 className="font-label-md text-on-surface cursor-pointer hover:underline">
              {currentUser?.username}
            </h4>
            <p className="font-body-sm text-on-surface-variant">
              {currentUser?.fullName}
            </p>
          </div>
        </div>
        <button className="font-label-md text-primary-container hover:text-on-primary-fixed-variant transition-colors text-sm">
          Switch
        </button>
      </div>

      {/* Suggestions Box */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="font-label-md text-on-surface-variant">Suggested for you</h4>
          <button className="font-label-sm text-on-surface hover:underline">See All</button>
        </div>
        
        <div className="flex flex-col gap-4">
          {/* Suggestion Items */}
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  className="w-8 h-8 rounded-full object-cover cursor-pointer" 
                  alt={`portrait of ${suggestion.username}`} 
                  src={suggestion.avatar} 
                />
                <div className="flex flex-col">
                  <span className="font-label-sm text-on-surface leading-tight cursor-pointer hover:underline">
                    {suggestion.username}
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    {suggestion.subtext}
                  </span>
                </div>
              </div>
              <button className="font-label-sm text-primary-container hover:text-on-primary-fixed-variant transition-colors">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4">
        {['About', 'Help', 'Press', 'API', 'Privacy', 'Terms'].map(link => (
          <a key={link} className="font-body-sm text-[12px] text-on-surface-variant hover:underline" href="#">
            {link}
          </a>
        ))}
      </div>
      <p className="font-body-sm text-[12px] text-on-surface-variant mt-2">© {currentYear} Glimpse Social</p>
    </aside>
  );
}
