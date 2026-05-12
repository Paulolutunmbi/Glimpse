import { useMemo, useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import Suggestions from '../components/Suggestions';
import StoryRow from '../components/StoryRow';
import Avatar from '../components/Avatar';
import { useUser } from '../context/UserContext.jsx';
import { discoveryService, postService, searchService, userService } from '../services/apiService';
import { socket } from '../socket';

export default function Home() {
  const { user, savedPosts, relations, refreshUser } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [feedType, setFeedType] = useState('latest');
  const [discovery, setDiscovery] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [followOverrides, setFollowOverrides] = useState({});
  const currentUserId = user?.id || user?._id || null;

  const closeDiscover = useCallback(() => {
    setDiscoverOpen(false);
    setDiscoverQuery('');
    setDiscoverResults([]);
  }, []);

  const canViewPost = useCallback(
    (post) => {
      if (!post) return false;
      if (!currentUserId) return post.visibility === 'public';
      if (String(post.author) === String(currentUserId)) return true;
      const following = new Set((relations?.following || []).map(String));
      const followers = new Set((relations?.followers || []).map(String));
      const isMutual = following.has(String(post.author)) && followers.has(String(post.author));
      if (post.visibility === 'public') return true;
      if (post.visibility === 'followers') return following.has(String(post.author));
      if (post.visibility === 'friends') return isMutual;
      if (post.visibility === 'private') return false;
      return false;
    },
    [currentUserId, relations]
  );

  const savedIds = useMemo(
    () => new Set((savedPosts || []).map((item) => item._id || item.id)),
    [savedPosts]
  );

  const followingIds = useMemo(
    () => new Set((relations?.following || []).map(String)),
    [relations]
  );

  const normalizePost = (post, userId) => {
    const likes = Array.isArray(post?.likes) ? post.likes : [];
    const postId = post._id || post.id;
    return {
      ...post,
      id: post._id || post.id,
      _id: post._id || post.id,
      likes,
      likesCount: likes.length || post.likesCount || post.likes || 0,
      isLiked: userId ? likes.includes(userId) : false,
      isSaved: savedIds.has(postId),
      timestamp: formatTimestamp(post.createdAt),
    };
  };

  const stories = useMemo(() => {
    if (!user) return [];
    return [
      {
        id: user?.id || user?._id || 'you',
        username: 'You',
        avatar: user?.profilePicture || user?.avatar || '',
        isYou: true,
        hasStory: Boolean(user?.hasStory),
      },
    ];
  }, [user]);

  const loadFeed = useCallback(
    async ({ nextCursor = null, replace = false } = {}) => {
      if (!hasMore && nextCursor) return;
      if (nextCursor) setIsFetchingMore(true);
      setError(null);

      try {
        const response = await postService.getFeed({
          type: feedType,
          cursor: nextCursor,
          limit: 10,
        });
        const incoming = Array.isArray(response?.data) ? response.data : [];
        const normalized = incoming.map((p) => normalizePost(p, currentUserId));
        setPosts((prev) => (replace ? normalized : [...prev, ...normalized]));
        setCursor(response?.nextCursor || null);
        setHasMore(Boolean(response?.hasMore));
      } catch (err) {
        console.error('Failed to load posts:', err);
        setError('Could not connect to the server. Is the backend running?');
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    },
    [currentUserId, feedType, hasMore]
  );

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    loadFeed({ replace: true });
  }, [feedType, loadFeed]);

  useEffect(() => {
    let isMounted = true;
    discoveryService
      .getDiscovery()
      .then((data) => {
        if (!isMounted) return;
        setDiscovery(data);
      })
      .catch(() => null);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isFetchingMore) return;
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
      if (nearBottom) {
        loadFeed({ nextCursor: cursor });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [cursor, hasMore, isFetchingMore, loadFeed]);

  useEffect(() => {
    if (!discoverQuery.trim()) {
      setDiscoverResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setDiscoverLoading(true);
      try {
        const response = await searchService.search({ query: discoverQuery, limit: 8 });
        setDiscoverResults(Array.isArray(response?.users) ? response.users : []);
      } catch (err) {
        console.error(err);
        setDiscoverResults([]);
      } finally {
        setDiscoverLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [discoverQuery]);

  const handleToggleFollow = async (targetId, isFollowing) => {
    if (!targetId) return;
    setFollowOverrides((prev) => ({ ...prev, [targetId]: !isFollowing }));
    try {
      await userService.toggleFollow(targetId, isFollowing);
      setFollowOverrides((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
      refreshUser();
    } catch (err) {
      console.error(err);
      setFollowOverrides((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    }
  };

  const discoverList = discoverQuery.trim()
    ? discoverResults
    : discovery?.suggestedCreators || [];

  useEffect(() => {
    const handlePostCreated = (payload) => {
      const newPost = payload?.post || payload;
      if (!newPost) return;
      if (!canViewPost(newPost)) return;
      setPosts((prev) => {
        const exists = prev.some((item) => item._id === newPost._id || item.id === newPost._id);
        if (exists) return prev;
        return [normalizePost(newPost, currentUserId), ...prev];
      });
    };

    const handlePostLiked = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setPosts((prev) =>
        prev.map((item) => {
          if (item._id !== postId && item.id !== postId) return item;
          const likes = Array.isArray(payload?.likes) ? payload.likes : item.likes || [];
          return {
            ...item,
            likes,
            likesCount:
              typeof payload?.likesCount === 'number'
                ? payload.likesCount
                : likes.length || item.likesCount,
            isLiked: currentUserId ? likes.includes(currentUserId) : item.isLiked,
          };
        })
      );
    };

    const handlePostDeleted = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setPosts((prev) => prev.filter((item) => item._id !== postId && item.id !== postId));
    };

    socket.on('post:created', handlePostCreated);
    socket.on('post:liked', handlePostLiked);
    socket.on('postDeleted', handlePostDeleted);
    const handlePostSaved = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setPosts((prev) =>
        prev.map((item) =>
          item._id === postId || item.id === postId
            ? { ...item, saveCount: payload?.saveCount ?? item.saveCount }
            : item
        )
      );
    };

    socket.on('postSaved', handlePostSaved);

    const handleVisibility = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setPosts((prev) =>
        prev.filter((item) => {
          if (item._id !== postId && item.id !== postId) return true;
          const next = { ...item, visibility: payload?.visibility || item.visibility };
          return canViewPost(next);
        })
      );
    };

    socket.on('post:visibility', handleVisibility);

    return () => {
      socket.off('post:created', handlePostCreated);
      socket.off('post:liked', handlePostLiked);
      socket.off('postDeleted', handlePostDeleted);
      socket.off('postSaved', handlePostSaved);
      socket.off('post:visibility', handleVisibility);
    };
  }, [currentUserId, canViewPost]);

  return (
    <>
      <Navbar currentUser={user} />

      <div className="flex-1 flex w-full min-h-screen px-4 md:px-6 lg:px-8 py-lg gap-xl">

          {/* Central Feed */}
          <div className="flex-1 w-full flex flex-col gap-lg pb-32 md:pb-8 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { key: 'latest', label: 'Latest' },
                { key: 'following', label: 'Following' },
                { key: 'personalized', label: 'For You' },
                { key: 'trending', label: 'Trending' },
                { key: 'reels', label: 'Reels' },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`rounded-full px-4 py-2 text-[12px] font-label-md transition-colors ${
                    feedType === item.key
                      ? 'bg-primary-container text-white'
                      : 'bg-surface-container text-on-surface'
                  }`}
                  type="button"
                  onClick={() => setFeedType(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {/* Story/Status Row */}
            {stories.length > 0 ? <StoryRow stories={stories} /> : null}

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col gap-lg">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-container-lowest rounded-xl shadow animate-pulse"
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 rounded-full bg-surface-variant" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-surface-variant rounded w-1/3" />
                        <div className="h-2 bg-surface-variant rounded w-1/4" />
                      </div>
                    </div>
                    <div className="w-full aspect-[4/5] bg-surface-variant" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-surface-variant rounded w-1/4" />
                      <div className="h-3 bg-surface-variant rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center text-red-600">
                <p className="font-semibold">⚠️ {error}</p>
                <p className="text-sm mt-1 text-red-400">
                  Start the backend with <code className="font-mono bg-red-100 px-1 rounded">npm run dev</code> inside /Backend
                </p>
                <button
                  className="mt-3 rounded-full border border-red-200 px-4 py-2 text-sm"
                  type="button"
                  onClick={() => loadFeed({ replace: true })}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Feed Cards */}
            {!loading &&
              !error &&
              posts.map((post) => (
                <PostCard key={post._id} post={post} currentUser={user} />
              ))}

            {isFetchingMore && (
              <div className="rounded-xl bg-surface-container-lowest p-6 text-center text-on-surface-variant">
                Loading more moments...
              </div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="rounded-xl bg-surface-container-lowest p-6 text-center text-on-surface-variant">
                No moments yet. Follow creators to fill your feed.
              </div>
            )}
          </div>

          {/* Right Panel (Suggestions) */}
          <div className="hidden md:block">
            <Suggestions
              currentUser={user}
              suggestions={discovery?.suggestedCreators || []}
              discovery={discovery}
              onFollowChange={() => loadFeed({ replace: true })}
            />
          </div>
      </div>

      <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-3 md:hidden">
        {fabOpen ? (
          <div className="flex flex-col items-end gap-2">
            <button
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-on-surface shadow-lg transition-all duration-200 hover:bg-surface-container"
              type="button"
              onClick={() => {
                setDiscoverOpen(true);
                setFabOpen(false);
              }}
            >
              Discover People
            </button>
          </div>
        ) : null}
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-white shadow-[0_10px_25px_rgba(255,90,95,0.35)] transition-transform duration-200 active:scale-95"
          type="button"
          onClick={() => setFabOpen((prev) => !prev)}
          aria-label="Open discover menu"
        >
          <span className="material-symbols-outlined text-[28px]">
            {fabOpen ? 'close' : 'person_add'}
          </span>
        </button>
      </div>

      {discoverOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 md:hidden"
          onClick={closeDiscover}
        >
          <div
            className="max-h-[85vh] w-full rounded-3xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Find New Friends</p>
                <h2 className="mt-1 text-lg font-semibold text-on-surface">Discover People</h2>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
                onClick={closeDiscover}
                aria-label="Close discover"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3">
              <label className="text-xs text-on-surface-variant">Search people</label>
              <input
                className="mt-2 w-full bg-transparent text-base outline-none"
                placeholder="Search by username or name"
                value={discoverQuery}
                onChange={(event) => setDiscoverQuery(event.target.value)}
              />
            </div>

            {discoverLoading ? (
              <p className="mt-4 text-sm text-on-surface-variant">Searching...</p>
            ) : null}

            <div className="mt-4 space-y-3 overflow-y-auto pb-safe">
              {discoverList.length === 0 ? (
                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                  No suggestions yet. Try a different search.
                </div>
              ) : null}

              {discoverList.map((person) => {
                const id = String(person._id || person.id || '');
                if (!id) return null;
                const override = Object.prototype.hasOwnProperty.call(followOverrides, id)
                  ? followOverrides[id]
                  : null;
                const isFollowing = typeof override === 'boolean'
                  ? override
                  : followingIds.has(id) || person.isFollowing;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-white px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        src={person.profile?.avatar || person.profilePicture || person.avatar}
                        name={person.username || person.name}
                        alt={person.username || 'User'}
                        className="h-12 w-12"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-on-surface">
                          {person.username || person.name}
                        </p>
                        {person.fullName || person.name ? (
                          <p className="truncate text-xs text-on-surface-variant">
                            {person.fullName || person.name}
                          </p>
                        ) : null}
                        {typeof person.mutualCount === 'number' && person.mutualCount > 0 ? (
                          <p className="text-[11px] text-on-surface-variant">
                            {person.mutualCount} mutual connections
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                        isFollowing
                          ? 'border border-outline-variant text-on-surface'
                          : 'bg-primary-container text-white'
                      }`}
                      type="button"
                      onClick={() => handleToggleFollow(id, isFollowing)}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function formatTimestamp(isoString) {
  if (!isoString) return '';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
