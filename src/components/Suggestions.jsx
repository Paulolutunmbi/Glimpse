import { useState } from 'react';
import { userService } from '../services/apiService';

const fallbackAvatar = '/images/glimpse-icon.png';

export default function Suggestions({ suggestions, onFollowChange }) {
  const [followingIds, setFollowingIds] = useState(new Set());

  const handleFollow = async (creatorId) => {
    if (!creatorId) return;

    const previous = new Set(followingIds);
    const next = new Set(followingIds);
    next.has(creatorId) ? next.delete(creatorId) : next.add(creatorId);
    setFollowingIds(next);

    try {
      await userService.toggleFollow(creatorId);
      onFollowChange?.();
    } catch {
      setFollowingIds(previous);
    }
  };

  return (
    <aside className="w-full flex-shrink-0 xl:w-80">
      <div className="ambient-card sticky top-24 rounded-[16px] bg-surface-container-lowest p-6">
        <h2 className="mb-6 font-h3 text-on-surface">Suggested Creators</h2>
        <div className="flex flex-col gap-5">
          {suggestions.map((creator, index) => {
            const isFollowing = followingIds.has(creator.id) || creator.isFollowing;
            return (
              <div key={creator.id || creator.username} className="group flex cursor-pointer items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {creator.avatar ? (
                    <img
                      alt={creator.name || creator.username}
                      className="h-10 w-10 rounded-full object-cover"
                      src={creator.avatar}
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-white">
                      <span className="font-label-md">
                        {(creator.name || creator.username || 'G')[0]}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-label-md text-on-surface transition-colors group-hover:text-primary-container">
                      {creator.name || creator.username}
                    </div>
                    <div className="truncate text-[12px] text-secondary font-body-sm">
                      {creator.specialty || (index === 0 ? 'Photography' : 'Creator')}
                    </div>
                  </div>
                </div>
                <button
                  className="press-in rounded-full bg-surface-container-high px-3 py-1.5 text-[12px] text-on-surface transition-colors hover:bg-secondary-container font-label-sm"
                  onClick={() => handleFollow(creator.id)}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}

          {suggestions.length === 0 && (
            <div className="flex items-center gap-3 text-secondary">
              <img alt="" className="h-10 w-10 rounded-full" src={fallbackAvatar} />
              <span className="text-body-sm">No creators yet</span>
            </div>
          )}
        </div>
        <a className="mt-6 block text-center text-primary-container hover:underline font-label-sm" href="#creators">
          View all recommendations
        </a>
      </div>
    </aside>
  );
}
