import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { searchService, userService } from '../services/apiService';
import { useUser } from '../context/UserContext.jsx';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';

export default function Search() {
  const { user, relations, savedPosts, refreshCounts } = useUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeUserId, setActiveUserId] = useState(null);

  const following = useMemo(
    () => new Set((relations?.following || []).map(String)),
    [relations]
  );

  const savedIds = useMemo(
    () => new Set((savedPosts || []).map((item) => item._id || item.id)),
    [savedPosts]
  );

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] });
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await searchService.search({ query, limit: 10 });
        const normalizedPosts = (response?.posts || []).map((post) => {
          const likes = Array.isArray(post?.likes) ? post.likes : [];
          const postId = post._id || post.id;
          const currentUserId = user?.id || user?._id || null;
          return {
            ...post,
            likes,
            likesCount: likes.length || post.likesCount || post.likes || 0,
            isLiked: currentUserId ? likes.includes(currentUserId) : false,
            isSaved: savedIds.has(postId),
          };
        });
        setResults({
          users: response?.users || [],
          posts: normalizedPosts,
        });
      } catch (err) {
        console.error(err);
        setError('Search failed. Try again.');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleToggleFollow = async (targetId, isFollowing) => {
    if (!targetId || String(targetId) === String(user?.id || user?._id || '')) return;
    try {
      setResults((prev) => ({
        ...prev,
        users: prev.users.map((item) =>
          String(item._id || item.id) === String(targetId)
            ? { ...item, _isFollowing: !isFollowing }
            : item
        ),
      }));
      if (isFollowing) {
        await userService.unfollowUser(targetId);
      } else {
        await userService.followUser(targetId);
      }
      refreshCounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <Navbar currentUser={user} search={query} onSearchChange={setQuery} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-safe md:px-8">
        <div className="mb-8 sticky top-16 z-20 rounded-2xl border-2 border-outline-variant/30 bg-white dark:bg-gray-900 px-4 py-4 shadow-sm transition-all duration-200 focus-within:border-primary-container focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary-container/30">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Search users, moments & reels</label>
          <div className="mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              className="flex-1 bg-transparent text-lg outline-none text-on-surface placeholder-on-surface-variant/60"
              placeholder="Find creators, moments, #hashtags..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
            {query && (
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container/30"
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12">
            <div className="inline-block w-3 h-3 bg-primary-container rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="inline-block w-3 h-3 bg-primary-container rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="inline-block w-3 h-3 bg-primary-container rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-2 text-sm text-on-surface-variant">Searching...</span>
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        ) : null}

        {!query && !loading && (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">search</span>
            <p className="text-on-surface-variant font-medium mb-2">Start searching to discover</p>
            <p className="text-sm text-on-surface-variant">Find creators, moments, or specific #hashtags</p>
          </div>
        )}

        {results.users.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined">people</span>
              People ({results.users.length})
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {results.users.map((item) => {
                const isFollowing =
                  typeof item._isFollowing === 'boolean'
                    ? item._isFollowing
                    : following.has(String(item._id || item.id));
                const userId = String(item._id || item.id);
                const isActive = activeUserId === userId;
                const isSelf = String(userId) === String(user?.id || user?._id || '');
                return (
                  <div
                    key={userId}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-container/30 ${
                      isActive
                        ? 'border-primary-container/40 bg-primary-container/5 shadow-md'
                        : 'border-outline-variant/30 bg-white dark:bg-gray-800 hover:border-primary-container/20 hover:shadow-sm active:scale-95'
                    }`}
                    role="button"
                    tabIndex={0}
                    onPointerDown={() => setActiveUserId(userId)}
                    onPointerUp={() => setTimeout(() => setActiveUserId(null), 180)}
                    onPointerLeave={() => setActiveUserId(null)}
                    onBlur={() => setActiveUserId(null)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        setActiveUserId(userId);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={item.profile?.avatar || item.profilePicture || item.avatar}
                        name={item.username || item.name}
                        alt={item.username || 'User'}
                        className="h-12 w-12 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="inline-flex max-w-full items-center gap-1 text-sm font-bold text-on-surface">
                          <span className="truncate">{item.username || item.name}</span>
                          <VerifiedBadge verified={item.verified} size={12} />
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">{item.fullName || item.name}</p>
                      </div>
                    </div>
                    <button
                      className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 active:scale-95 ${
                        isSelf
                          ? 'bg-surface-container text-on-surface-variant cursor-default'
                          : isFollowing
                          ? 'border border-primary-container text-primary-container hover:bg-primary-container/10 dark:bg-gray-700'
                          : 'bg-primary-container text-white hover:bg-primary-container/90 focus:ring-primary-container/30'
                      }`}
                      type="button"
                      onClick={() => handleToggleFollow(item._id || item.id, isFollowing)}
                      disabled={isSelf}
                      aria-label={isSelf ? 'Your account' : isFollowing ? 'Unfollow user' : 'Follow user'}
                    >
                      {isSelf ? '✓ You' : isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {results.posts.length > 0 ? (
          <section>
            <h2 className="mb-4 text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined">image</span>
              Moments ({results.posts.length})
            </h2>
            <div className="flex flex-col gap-6">
              {results.posts.map((post) => (
                <PostCard key={post._id || post.id} post={post} currentUser={user} />
              ))}
            </div>
          </section>
        ) : null}

        {query && !loading && results.users.length === 0 && results.posts.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">search_off</span>
            <p className="text-on-surface-variant font-medium">No results found for "{query}"</p>
            <p className="text-sm text-on-surface-variant mt-2">Try different keywords or #hashtags</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
