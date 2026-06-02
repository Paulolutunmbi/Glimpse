import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';

export default function StoryRow({ stories }) {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
      {stories.map(story => (
        <div key={story.id} className={`flex flex-col items-center gap-1 min-w-[72px] ${!story.isYou ? 'cursor-pointer opacity-80 hover:opacity-100 transition-opacity' : ''}`}>
          <div className={`w-16 h-16 rounded-full border-2 ${story.isYou ? 'border-primary-container' : 'border-surface-variant'} p-[2px] relative cursor-pointer`}>
            <Avatar
              className="h-full w-full"
              alt={story.username}
              src={story.avatar}
              name={story.username}
            />
            {story.isYou && (
              <div className="absolute bottom-0 right-0 bg-primary-container text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-surface">
                <span className="material-symbols-outlined text-[12px]">add</span>
              </div>
            )}
          </div>
          <span className="font-label-sm text-on-surface inline-flex items-center gap-1">
            <span>{story.username}</span>
            <VerifiedBadge verified={story.verified} size={11} />
          </span>
        </div>
      ))}
    </div>
  );
}
