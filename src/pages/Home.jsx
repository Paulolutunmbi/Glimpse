import { useMemo, useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import Suggestions from '../components/Suggestions';
import StoryRow from '../components/StoryRow';
import { useUser } from '../context/UserContext.jsx';
import { discoveryService, postService } from '../services/apiService';
import { socket } from '../socket';
import { mockStories, mockSuggestions } from '../data/posts';

export default function Home() {
  const { user, savedPosts, relations } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [feedType, setFeedType] = useState('latest');
  const [discovery, setDiscovery] = useState(null);
  const currentUserId = user?.id || user?._id || null;

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
    const avatarSrc = user?.profilePicture || user?.avatar || '/images/glimpse-icon.png';
    const youStory = {
      id: 'you',
      username: 'You',
      avatar: avatarSrc,
      isYou: true,
      hasStory: false,
    };

    return [youStory, ...mockStories.filter((story) => story.id !== 'you')];
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
    socket.on('postCreated', handlePostCreated);
    socket.on('post:liked', handlePostLiked);
    socket.on('postLiked', handlePostLiked);
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
      socket.off('postCreated', handlePostCreated);
      socket.off('post:liked', handlePostLiked);
      socket.off('postLiked', handlePostLiked);
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
          <div className="flex-1 w-full flex flex-col gap-lg pb-32 md:pb-8">
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
            <StoryRow stories={stories} />

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
          <Suggestions
            currentUser={user}
            suggestions={discovery?.suggestedCreators || mockSuggestions}
            discovery={discovery}
            onFollowChange={() => loadFeed({ replace: true })}
          />
      </div>
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
