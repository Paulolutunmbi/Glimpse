import { useEffect, useMemo, useRef, useState } from 'react';
import { postService, userService } from '../services/apiService';
import { socket } from '../socket';
import CommentModal from './CommentModal';
import Avatar from './Avatar';

const formatCount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  if (numeric < 1000) return `${numeric}`;
  const formatted = (numeric / 1000).toFixed(numeric >= 10000 ? 0 : 1);
  return `${formatted.replace(/\.0$/, '')}k`;
};

export default function ReelCard({ reel, currentUser }) {
  const postId = useMemo(() => reel?._id || reel?.id, [reel]);
  const currentUserId = currentUser?.id || currentUser?._id || null;
  const followIds = useMemo(
    () => new Set((currentUser?.relations?.following || currentUser?.following || []).map(String)),
    [currentUser]
  );
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(Boolean(reel?.isLiked));
  const [likes, setLikes] = useState(
    Array.isArray(reel?.likes) ? reel.likes.length : reel?.likesCount ?? reel?.likes ?? 0
  );
  const [saved, setSaved] = useState(Boolean(reel?.isSaved));
  const [saves, setSaves] = useState(reel?.saveCount ?? 0);
  const [openComments, setOpenComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    reel?.author ? followIds.has(String(reel.author)) : false
  );

  const mediaItems = Array.isArray(reel?.media) ? reel.media : [];
  const videoItem = mediaItems.find((item) => item?.type === 'video') || mediaItems[0];
    useEffect(() => {
      if (!reel?.author) return;
      setIsFollowing(followIds.has(String(reel.author)));
    }, [followIds, reel]);
  const videoSrc = videoItem?.url || reel?.video || reel?.image || '';
  const avatarSrc = reel?.user?.avatar || reel?.user?.profilePicture || '';
  const avatarName = reel?.user?.username || reel?.user?.name || 'Creator';

  useEffect(() => {
    if (!postId) return;
    socket.emit('joinPost', postId);
    return () => {
      socket.emit('leavePost', postId);
    };
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = videoRef.current;
          if (!video) return;
          if (entry.isIntersecting) {
            video.play().catch(() => null);
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    const handlePostLiked = (payload) => {
      const targetId = payload?.postId || payload?.id;
      if (!targetId || targetId !== postId) return;

      const nextLikes = Array.isArray(payload?.likes) ? payload.likes : null;
      if (nextLikes) {
        setLikes(nextLikes.length);
        if (currentUserId) {
          setLiked(nextLikes.includes(currentUserId));
        }
        return;
      }

      if (typeof payload?.likesCount === 'number') {
        setLikes(payload.likesCount);
      }
      if (typeof payload?.isLiked === 'boolean') {
        setLiked(payload.isLiked);
      }
    };

    socket.on('post:liked', handlePostLiked);
    socket.on('postLiked', handlePostLiked);
    return () => {
      socket.off('post:liked', handlePostLiked);
      socket.off('postLiked', handlePostLiked);
    };
  }, [postId, currentUserId]);

  useEffect(() => {
    if (!postId) return;

    const handlePostSaved = (payload) => {
      const targetId = payload?.postId || payload?.id;
      if (!targetId || targetId !== postId) return;
      if (typeof payload?.saveCount === 'number') {
        setSaves(payload.saveCount);
      }
    };

    socket.on('postSaved', handlePostSaved);
    return () => {
      socket.off('postSaved', handlePostSaved);
    };
  }, [postId]);

  const handleLike = async () => {
    if (!postId) return;

    const previousLiked = liked;
    const previousLikes = likes;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setLikes(nextLiked ? previousLikes + 1 : Math.max(0, previousLikes - 1));

    try {
      const data = await postService.toggleLike(postId);
      if (Array.isArray(data?.likes)) {
        setLikes(data.likes.length);
      }
      if (typeof data?.isLiked === 'boolean') {
        setLiked(data.isLiked);
      }
    } catch (err) {
      console.error(err);
      setLiked(previousLiked);
      setLikes(previousLikes);
    }
  };

  const handleSave = async () => {
    if (!postId) return;
    const previousSaved = saved;
    const previousSaves = saves;
    const nextSaved = !previousSaved;

    setSaved(nextSaved);
    setSaves(nextSaved ? previousSaves + 1 : Math.max(0, previousSaves - 1));

    try {
      if (nextSaved) {
        await userService.savePost(postId);
      } else {
        await userService.unsavePost(postId);
      }
    } catch (err) {
      console.error(err);
      setSaved(previousSaved);
      setSaves(previousSaves);
    }
  };

  const handleShare = async () => {
    if (!postId) return;
    try {
      await postService.sharePost(postId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async () => {
    const authorId = reel?.author || reel?.userId || reel?.user?._id;
    if (!authorId) return;

    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);

    try {
      await userService.toggleFollow(authorId, isFollowing);
    } catch (err) {
      console.error(err);
      setIsFollowing(!nextFollowing);
    }
  };

  useEffect(() => {
    if (!postId) return;
    postService.trackView(postId).catch(() => null);
  }, [postId]);

  return (
    <article className="relative h-screen w-full snap-start overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={videoSrc}
            muted
            playsInline
            loop
            preload="metadata"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm text-gray-300">
            Reel unavailable
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/30" />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 px-6 pb-12">
        <div className="flex max-w-[70%] flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              alt={reel?.user?.username || 'Creator'}
              className="border border-white/20"
              name={avatarName}
              sizeClassName="h-10 w-10"
              src={avatarSrc}
              textClassName="text-[12px]"
            />
            <div>
              <p className="text-sm font-semibold">{reel?.user?.username || 'Creator'}</p>
              <p className="text-xs text-white/70">{reel?.location || reel?.user?.location || ''}</p>
            </div>
            {currentUserId && (reel?.author || reel?.userId) && String(reel?.author || reel?.userId) !== String(currentUserId) ? (
              <button
                className="ml-2 rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white transition hover:border-white hover:bg-white/10"
                type="button"
                onClick={handleFollow}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
          <p className="text-sm text-white/90">{reel?.caption || ''}</p>
          <div className="text-xs text-white/60">{reel?.hashtags?.map((tag) => `#${tag}`).join(' ')}</div>
        </div>

        <div className="flex flex-col items-center gap-4 text-white">
          <button
            onClick={handleLike}
            aria-label={liked ? 'Unlike reel' : 'Like reel'}
            className={`flex flex-col items-center gap-1 transition-all ${
              liked ? 'text-rose-400' : 'text-white'
            }`}
          >
            <span
              className="material-symbols-outlined text-[28px]"
              style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              favorite
            </span>
            <span className="text-xs">{formatCount(likes)}</span>
          </button>

          <button
            className="flex flex-col items-center gap-1 text-white"
            onClick={() => setOpenComments(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-[28px]">chat_bubble</span>
            <span className="text-xs">Comments</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white" onClick={handleShare} type="button">
            <span className="material-symbols-outlined text-[28px]">send</span>
            <span className="text-xs">Share</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white" onClick={handleSave} type="button">
            <span
              className="material-symbols-outlined text-[28px]"
              style={saved ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              bookmark
            </span>
            <span className="text-xs">{formatCount(saves)}</span>
          </button>
        </div>
      </div>

      <CommentModal
        post={reel}
        isOpen={openComments}
        onClose={() => setOpenComments(false)}
        liked={liked}
        likes={likes}
        onToggleLike={handleLike}
        currentUser={currentUser}
      />
    </article>
  );
}
