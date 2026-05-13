import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../context/UserContext.jsx';
import { postService } from '../services/apiService';
import { socket } from '../socket';
import ReelCard from '../components/ReelCard';

const canViewPost = ({ post, viewerId, relations }) => {
  if (!post) return false;
  if (!viewerId) return post.visibility === 'public';
  if (String(post.author) === String(viewerId)) return true;

  const following = new Set((relations?.following || []).map(String));
  const followers = new Set((relations?.followers || []).map(String));
  const isMutual = following.has(String(post.author)) && followers.has(String(post.author));

  if (post.visibility === 'public') return true;
  if (post.visibility === 'followers') return following.has(String(post.author));
  if (post.visibility === 'friends') return isMutual;
  if (post.visibility === 'private') return false;
  return false;
};

export default function Reels() {
  const { user, relations, savedPosts } = useUser();
  const [reels, setReels] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const sentinelRef = useRef(null);
  const cursorRef = useRef(null);
  const hasMoreRef = useRef(true);
  const requestIdRef = useRef(0);
  const savedIdsRef = useRef(new Set());
  const currentUserId = user?.id || user?._id || null;

  const savedIds = useMemo(
    () => new Set((savedPosts || []).map((item) => item._id || item.id)),
    [savedPosts]
  );

  useEffect(() => {
    savedIdsRef.current = savedIds;
  }, [savedIds]);

  const normalizeReel = useCallback(
    (post) => {
      const likes = Array.isArray(post?.likes) ? post.likes : [];
      const postId = post._id || post.id;
      return {
        ...post,
        id: postId,
        _id: postId,
        likes,
        likesCount: likes.length || post.likesCount || post.likes || 0,
        isLiked: currentUserId ? likes.includes(currentUserId) : false,
        isSaved: savedIdsRef.current.has(postId),
      };
    },
    [currentUserId]
  );

  const loadReels = useCallback(
    async ({ nextCursor = null, replace = false } = {}) => {
      if (!hasMoreRef.current && nextCursor) return;
      if (nextCursor) setIsFetchingMore(true);
      const requestId = ++requestIdRef.current;

      try {
        const response = await postService.getFeed({ type: 'reels', cursor: nextCursor, limit: 8 });
        const incoming = Array.isArray(response?.data) ? response.data : [];
        const normalized = incoming.map(normalizeReel);
        if (requestId !== requestIdRef.current) return;
        setReels((prev) => {
          const byId = new Map((replace ? [] : prev).map((item) => [String(item._id || item.id), item]));
          normalized.forEach((item) => {
            byId.set(String(item._id || item.id), item);
          });
          return Array.from(byId.values());
        });
        const next = response?.nextCursor || null;
        const more = Boolean(response?.hasMore);
        cursorRef.current = next;
        hasMoreRef.current = more;
        setHasMore(more);
      } catch (err) {
        console.error('Failed to load reels:', err);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
        setIsFetchingMore(false);
      }
    },
    [normalizeReel]
  );

  useEffect(() => {
    setLoading(true);
    requestIdRef.current += 1;
    setHasMore(true);
    cursorRef.current = null;
    hasMoreRef.current = true;
    loadReels({ replace: true });
  }, [loadReels, currentUserId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isFetchingMore) {
            loadReels({ nextCursor: cursorRef.current });
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, loadReels]);

  useEffect(() => {
    const handlePostCreated = (payload) => {
      const newPost = payload?.post || payload;
      if (!newPost || newPost.type !== 'video') return;
      if (!canViewPost({ post: newPost, viewerId: currentUserId, relations })) return;
      setReels((prev) => {
        const exists = prev.some((item) => item._id === newPost._id || item.id === newPost._id);
        if (exists) return prev;
        return [normalizeReel(newPost), ...prev];
      });
    };

    const handlePostLiked = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setReels((prev) =>
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
      setReels((prev) => prev.filter((item) => item._id !== postId && item.id !== postId));
    };

    const handlePostUpdated = (payload) => {
      const incoming = payload?.post || payload;
      const postId = incoming?._id || incoming?.id;
      if (!postId) return;
      setReels((prev) =>
        prev.map((item) =>
          item._id === postId || item.id === postId
            ? normalizeReel({ ...item, ...incoming })
            : item
        )
      );
    };

    const handlePostSaved = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setReels((prev) =>
        prev.map((item) =>
          item._id === postId || item.id === postId
            ? { ...item, saveCount: payload?.saveCount ?? item.saveCount }
            : item
        )
      );
    };

    const handleVisibility = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setReels((prev) =>
        prev.filter((item) => {
          if (item._id !== postId && item.id !== postId) return true;
          const next = { ...item, visibility: payload?.visibility || item.visibility };
          return canViewPost({ post: next, viewerId: currentUserId, relations });
        })
      );
    };

    socket.on('post:created', handlePostCreated);
    socket.on('post:updated', handlePostUpdated);
    socket.on('post:liked', handlePostLiked);
    socket.on('postDeleted', handlePostDeleted);
    socket.on('post:deleted', handlePostDeleted);
    socket.on('postSaved', handlePostSaved);
    socket.on('post:visibility', handleVisibility);

    return () => {
      socket.off('post:created', handlePostCreated);
      socket.off('post:updated', handlePostUpdated);
      socket.off('post:liked', handlePostLiked);
      socket.off('postDeleted', handlePostDeleted);
      socket.off('post:deleted', handlePostDeleted);
      socket.off('postSaved', handlePostSaved);
      socket.off('post:visibility', handleVisibility);
    };
  }, [currentUserId, normalizeReel, relations]);

  return (
    <div className="h-screen w-full bg-black text-white">
      {loading ? (
        <div className="flex h-full items-center justify-center">Loading reels...</div>
      ) : reels.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-white/70">
          No reels yet. Create a video post to get started.
        </div>
      ) : (
        <div className="h-full w-full snap-y snap-mandatory overflow-y-auto scroll-smooth overscroll-contain touch-pan-y">
          {reels.map((reel) => (
            <ReelCard key={reel._id || reel.id} reel={reel} currentUser={user} />
          ))}
          <div ref={sentinelRef} className="h-8" />
          {isFetchingMore ? (
            <div className="flex items-center justify-center pb-6 text-xs text-white/70">Loading more...</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
