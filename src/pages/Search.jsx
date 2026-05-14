import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { searchService, userService } from '../services/apiService';
import { useUser } from '../context/UserContext.jsx';
import Avatar from '../components/Avatar';

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
        <div className="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3">
          <label className="text-xs text-on-surface-variant">Search users, reels, and moments</label>
          <input
            className="mt-2 w-full bg-transparent text-base outline-none"
            placeholder="Search for people or posts"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? <p className="text-sm text-on-surface-variant">Searching...</p> : null}
        {error ? <p className="text-sm text-error">{error}</p> : null}

        {results.users.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-on-surface">People</h2>
            <div className="grid gap-3 md:grid-cols-2">
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
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary-container/30 ${
                      isActive
                        ? 'border-primary-container/40 bg-surface-container-lowest'
                        : 'border-outline-variant/30 bg-white hover:bg-surface-container-lowest'
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
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={item.profile?.avatar || item.profilePicture || item.avatar}
                        name={item.username || item.name}
                        alt={item.username || 'User'}
                        className="h-10 w-10"
                      />
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{item.username || item.name}</p>
                        <p className="text-xs text-on-surface-variant">{item.fullName || item.name}</p>
                      </div>
                    </div>
                    <button
                      className="rounded-full border border-outline-variant px-3 py-1 text-xs transition-colors hover:border-primary-container hover:text-primary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      onClick={() => handleToggleFollow(item._id || item.id, isFollowing)}
                      disabled={isSelf}
                    >
                      {isSelf ? 'You' : isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {results.posts.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-on-surface">Moments</h2>
            <div className="flex flex-col gap-6">
              {results.posts.map((post) => (
                <PostCard key={post._id || post.id} post={post} currentUser={user} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
