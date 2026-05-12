import Avatar from './Avatar';

export default function StoryRow({ stories }) {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
      {stories.map(story => (
        <div key={story.id} className={`flex flex-col items-center gap-1 min-w-[72px] ${!story.isYou ? 'cursor-pointer opacity-80 hover:opacity-100 transition-opacity' : ''}`}>
          <div className={`w-16 h-16 rounded-full border-2 ${story.isYou ? 'border-primary-container' : 'border-surface-variant'} p-[2px] relative cursor-pointer`}>
            <Avatar
              alt={story.username}
              className="border border-surface"
              name={story.username}
              sizeClassName="h-full w-full"
              src={story.avatar}
              textClassName="text-[12px]"
            />
            {story.isYou && (
              <div className="absolute bottom-0 right-0 bg-primary-container text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-surface">
                <span className="material-symbols-outlined text-[12px]">add</span>
              </div>
            )}
          </div>
          <span className="font-label-sm text-on-surface">{story.username}</span>
        </div>
      ))}
    </div>
  );
}
