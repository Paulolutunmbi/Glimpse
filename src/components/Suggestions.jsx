import { useState } from 'react';
import { userService } from '../services/apiService';
import Avatar from './Avatar';

export default function Suggestions({ currentUser, suggestions, discovery, onFollowChange }) {
  const [followingIds, setFollowingIds] = useState(new Set());

  const handleFollow = async (creatorId) => {
    if (!creatorId) return;

    const previous = new Set(followingIds);
    const next = new Set(followingIds);
    next.has(creatorId) ? next.delete(creatorId) : next.add(creatorId);
    setFollowingIds(next);

    try {
      const isFollowing = previous.has(creatorId);
      await userService.toggleFollow(creatorId, isFollowing);
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
                  <Avatar
                    alt={creator.name || creator.username}
                    className="h-10 w-10"
                    src={creator.avatar}
                    name={creator.name || creator.username}
                  />
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
              <Avatar alt="" className="h-10 w-10" name="G" />
              <span className="text-body-sm">No creators yet</span>
            </div>
          )}
        </div>
        <a className="mt-6 block text-center text-primary-container hover:underline font-label-sm" href="#creators">
          View all recommendations
        </a>

        {discovery?.trendingHashtags?.length ? (
          <div className="mt-8">
            <h3 className="mb-3 font-label-md text-on-surface">Trending Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {discovery.trendingHashtags.map((tag) => (
                <span
                  key={tag.tag}
                  className="rounded-full bg-surface-container-high px-3 py-1 text-[12px] text-on-surface"
                >
                  #{tag.tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {discovery?.exploreCategories?.length ? (
          <div className="mt-6">
            <h3 className="mb-3 font-label-md text-on-surface">Explore Categories</h3>
            <div className="flex flex-wrap gap-2">
              {discovery.exploreCategories.map((tag) => (
                <span
                  key={tag.tag}
                  className="rounded-full border border-outline-variant px-3 py-1 text-[12px] text-on-surface-variant"
                >
                  {tag.tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
