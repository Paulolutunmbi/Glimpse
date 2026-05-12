import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { userService } from '../services/apiService';
import { useUser } from '../context/UserContext.jsx';

export default function SavedMoments() {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(null);

  const normalizePost = (post) => {
    const likes = Array.isArray(post?.likes) ? post.likes : [];
    return {
      ...post,
      id: post._id || post.id,
      _id: post._id || post.id,
      likes,
      likesCount: likes.length || post.likesCount || post.likes || 0,
      isLiked: user?.id ? likes.includes(user.id) : false,
      isSaved: true,
    };
  };

  const loadSaved = useCallback(
    async ({ nextCursor = null, replace = false } = {}) => {
      if (!hasMore && nextCursor) return;
      if (nextCursor) setIsFetchingMore(true);
      setError(null);

      try {
        const response = await userService.getSavedMoments({ cursor: nextCursor, limit: 10 });
        const incoming = Array.isArray(response?.data) ? response.data : [];
        const normalized = incoming.map(normalizePost);
        setPosts((prev) => (replace ? normalized : [...prev, ...normalized]));
        setCursor(response?.nextCursor || null);
        setHasMore(Boolean(response?.hasMore));
      } catch (err) {
        console.error('Failed to load saved moments:', err);
        setError('Could not load saved moments.');
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    },
    [hasMore]
  );

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    loadSaved({ replace: true });
  }, [loadSaved]);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isFetchingMore) return;
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
      if (nearBottom) {
        loadSaved({ nextCursor: cursor });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [cursor, hasMore, isFetchingMore, loadSaved]);

  return (
    <>
      <Navbar currentUser={user} />

      <div className="flex-1 flex w-full min-h-screen px-4 md:px-6 lg:px-8 py-lg gap-xl">
        <div className="flex-1 w-full flex flex-col gap-lg pb-32 md:pb-8">
            <div>
              <h1 className="font-h2 text-on-surface">Saved Moments</h1>
              <p className="text-body-sm text-on-surface-variant">Your bookmarked posts.</p>
            </div>

            {loading && (
              <div className="rounded-xl bg-surface-container-lowest p-6 text-center text-on-surface-variant">
                Loading saved moments...
              </div>
            )}

            {error && !loading && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center text-red-600">
                <p className="font-semibold">⚠️ {error}</p>
                <button
                  className="mt-3 rounded-full border border-red-200 px-4 py-2 text-sm"
                  type="button"
                  onClick={() => loadSaved({ replace: true })}
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="rounded-xl bg-surface-container-lowest p-6 text-center text-on-surface-variant">
                You have not saved any moments yet.
              </div>
            )}

            {!loading &&
              !error &&
              posts.map((post) => <PostCard key={post._id} post={post} currentUser={user} />)}

            {isFetchingMore && (
              <div className="rounded-xl bg-surface-container-lowest p-6 text-center text-on-surface-variant">
                Loading more...
              </div>
            )}
        </div>
      </div>
    </>
  );
}
