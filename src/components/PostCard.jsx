import { useEffect, useMemo, useState } from 'react';
import { postService, userService } from '../services/apiService';
import { socket } from '../socket';
import CommentModal from './CommentModal';
import Avatar from './Avatar';
import MediaCarousel from './MediaCarousel';

export default function PostCard({ post, currentUser }) {
  const postId = useMemo(() => post?._id || post?.id, [post]);
  const { user, timestamp, caption } = post;
  const avatarSrc = user?.avatar || user?.profilePicture || '';
  const mediaItems = Array.isArray(post?.media) ? post.media : post?.image ? [{ url: post.image }] : [];
  const [liked, setLiked] = useState(Boolean(post?.isLiked));
  const [likes, setLikes] = useState(
    Array.isArray(post?.likes) ? post.likes.length : (post?.likesCount ?? post?.likes ?? 0)
  );
  const [saved, setSaved] = useState(Boolean(post?.isSaved));
  const [saves, setSaves] = useState(post?.saveCount ?? 0);
  const [openComments, setOpenComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visibility, setVisibility] = useState(post?.visibility || 'public');
  const currentUserId = currentUser?.id || currentUser?._id || null;
  const isOwner = currentUserId && String(currentUserId) === String(post?.author);

  useEffect(() => {
    setVisibility(post?.visibility || 'public');
  }, [post?.visibility]);

  useEffect(() => {
    if (!postId) return;
    socket.emit('joinPost', postId);
    return () => {
      socket.emit('leavePost', postId);
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
    return () => {
      socket.off('post:liked', handlePostLiked);
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

  useEffect(() => {
    if (!postId) return;
    postService.trackView(postId).catch(() => null);
  }, [postId]);

  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar
            className="h-10 w-10 border border-surface-variant cursor-pointer"
            alt={`close up profile photo of ${user?.username || 'user'}`}
            src={avatarSrc}
            name={user?.username || user?.name}
          />
          <div>
            <h3 className="font-label-md text-on-surface leading-tight cursor-pointer hover:underline">
              {user?.username}
            </h3>
            <p className="font-body-sm text-on-surface-variant text-[12px]">
              {post?.location || user?.location ? `${post?.location || user?.location} • ` : ''}{timestamp}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full transition-colors"
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
          {menuOpen && isOwner ? (
            <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-outline-variant/30 bg-white p-2 text-xs shadow-lg">
              <p className="px-2 pb-2 text-[11px] text-on-surface-variant">Visibility</p>
              {['public', 'followers', 'friends', 'private'].map((option) => (
                <button
                  key={option}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left transition ${
                    visibility === option ? 'bg-surface-container text-on-surface' : 'text-on-surface-variant'
                  }`}
                  type="button"
                  onClick={async () => {
                    setVisibility(option);
                    setMenuOpen(false);
                    try {
                      await postService.updateVisibility(postId, option);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  <span className="capitalize">{option}</span>
                  {visibility === option ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Media */}
      <MediaCarousel media={mediaItems} poster={post?.image} />

      {/* Interactions & Caption */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {/* Like Button */}
            <button
              onClick={handleLike}
              aria-label={liked ? 'Unlike post' : 'Like post'}
              className={`${
                liked
                  ? 'text-rose-500'
                  : 'text-on-surface hover:text-rose-400'
              } transition-all duration-150 active:scale-90 flex items-center justify-center`}
            >
              <span
                className="material-symbols-outlined"
                style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                favorite
              </span>
            </button>
            <button
              className="text-on-surface hover:text-on-surface-variant transition-colors flex items-center justify-center"
              onClick={() => setOpenComments(true)}
            >
              <span className="material-symbols-outlined">chat_bubble</span>
            </button>
            <button
              className="text-on-surface hover:text-on-surface-variant transition-colors flex items-center justify-center"
              onClick={handleShare}
              type="button"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <button
            className="text-on-surface hover:text-on-surface-variant transition-colors flex items-center justify-center"
            onClick={handleSave}
            type="button"
          >
            <span
              className="material-symbols-outlined"
              style={saved ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              bookmark
            </span>
          </button>
        </div>

        <div className="font-label-md text-on-surface text-[13px]">
          {(likes ?? 0).toLocaleString()} {likes === 1 ? 'like' : 'likes'}
        </div>
        <div className="font-body-sm text-on-surface-variant text-[12px]">
          {saves.toLocaleString()} {saves === 1 ? 'save' : 'saves'}
        </div>

        <div className="font-body-sm text-on-surface">
          <span className="font-label-md mr-1">{user?.username}</span>
          {caption}
        </div>

      </div>

      <CommentModal
        post={post}
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
