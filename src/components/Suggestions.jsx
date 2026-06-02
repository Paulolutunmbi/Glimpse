import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { userService } from '../services/apiService';
import { socket } from '../socket';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';

function Suggestions({ suggestions, discovery, onFollowChange, currentUser }) {
  const [followingIds, setFollowingIds] = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const currentUserId = String(currentUser?.id || currentUser?._id || '');

  useEffect(() => {
    setFollowingIds(
      new Set(
        (suggestions || [])
          .filter((creator) => creator?.isFollowing || creator?._isFollowing)
          .map((creator) => String(creator.id || creator._id))
      )
    );
    setHiddenIds(new Set());
  }, [suggestions]);

  useEffect(() => {
    const handleFollowUpdated = () => {
      onFollowChange?.();
    };

    socket.on('followUpdated', handleFollowUpdated);
    return () => {
      socket.off('followUpdated', handleFollowUpdated);
    };
  }, [onFollowChange]);

  const visibleSuggestions = useMemo(
    () => (suggestions || []).filter((creator) => !hiddenIds.has(String(creator.id || creator._id || ''))),
    [suggestions, hiddenIds]
  );

  const handleFollow = useCallback(async (creatorId) => {
    if (!creatorId) return;

    setFollowingIds((previous) => {
      const isCurrentlyFollowing = previous.has(creatorId);
      const next = new Set(previous);
      if (isCurrentlyFollowing) {
        next.delete(creatorId);
      } else {
        next.add(creatorId);
      }
      
      // Async update
      (async () => {
        try {
          await userService.toggleFollow(creatorId, isCurrentlyFollowing);
          // Hide creator after following
          if (!isCurrentlyFollowing) {
            setHiddenIds((prevHidden) => new Set([...prevHidden, creatorId]));
          }
          // Trigger onFollowChange to refresh list
          onFollowChange?.();
        } catch (err) {
          console.error('Follow action failed:', err);
          // Revert on error
          setFollowingIds(previous);
        }
      })();

      return next;
    });
  }, [onFollowChange]);

  return (
    <aside className="w-full flex-shrink-0 xl:w-80">
      <div className="ambient-card sticky top-24 rounded-[16px] bg-surface-container-lowest p-6">
        <h2 className="mb-6 font-h3 text-on-surface">Suggested Creators</h2>
        <div className="flex flex-col gap-5">
          {visibleSuggestions.map((creator, index) => {
            const creatorId = String(creator.id || creator._id || '');
            const isSelf = Boolean(creator.isYou) || (currentUserId && creatorId === currentUserId);
            if (!creatorId || isSelf) return null;
            const isFollowing = followingIds.has(creatorId) || creator.isFollowing || creator._isFollowing;
            return (
              <div key={creatorId} className="group flex cursor-pointer items-center justify-between hover:bg-surface-container/50 transition-colors rounded-xl px-2 py-1">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    alt={creator.name || creator.username}
                    className="h-10 w-10"
                    src={creator.avatar}
                    name={creator.name || creator.username}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-label-md text-on-surface transition-colors group-hover:text-primary-container inline-flex items-center gap-1">
                      <span>{creator.name || creator.username}</span>
                      <VerifiedBadge verified={creator.verified} size={12} />
                    </div>
                    <div className="truncate text-[12px] text-secondary font-body-sm">
                      {creator.specialty || (index === 0 ? 'Photography' : 'Creator')}
                    </div>
                  </div>
                </div>
                <button
                  className={`press-in rounded-full px-3 py-1.5 text-[12px] font-label-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-container/50 ${
                    isFollowing
                      ? 'border border-outline-variant bg-surface-container-high text-on-surface hover:bg-surface-container hover:border-primary-container/50'
                      : 'bg-primary-container text-white hover:bg-primary hover:shadow-md'
                  }`}
                  onClick={() => handleFollow(creatorId)}
                  type="button"
                  disabled={isSelf}
                  aria-label={isSelf ? 'Your account' : isFollowing ? 'Unfollow creator' : 'Follow creator'}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}

          {visibleSuggestions.length === 0 && (
            <div className="flex items-center gap-3 text-secondary">
              <Avatar alt="" className="h-10 w-10" name="G" />
              <span className="text-body-sm">No creators yet</span>
            </div>
          )}
        </div>
        <a className="mt-6 block text-center text-primary-container hover:underline font-label-sm transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container/30 rounded px-2 py-1 hover:text-primary" href="#creators">
          View all recommendations →
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

export default memo(Suggestions);
