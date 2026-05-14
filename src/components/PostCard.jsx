import { memo, useEffect, useMemo, useState } from 'react';
import { postService, userService } from '../services/apiService';
import { socket } from '../socket';
import CommentModal from './CommentModal';
import Avatar from './Avatar';
import MediaCarousel from './MediaCarousel';

function PostCard({ post, currentUser }) {
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
  const [reposted, setReposted] = useState(Boolean(post?.isReposted));
  const [reposts, setReposts] = useState(post?.repostCount ?? 0);
  const [openComments, setOpenComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post?.commentsCount ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visibility, setVisibility] = useState(post?.visibility || 'public');
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [isRepostingLoading, setIsRepostingLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [repostCaption, setRepostCaption] = useState('');
  const [editForm, setEditForm] = useState({
    caption: post?.caption || '',
    location: post?.location || '',
    visibility: post?.visibility || 'public',
  });
  const [optimistic, setOptimistic] = useState(null);
  const effectiveCaption = optimistic?.caption ?? caption;
  const effectiveLocation = optimistic?.location ?? post?.location;
  const effectiveHashtags = optimistic?.hashtags ?? post?.hashtags ?? [];
  const currentUserId = currentUser?.id || currentUser?._id || null;
  const isOwner = currentUserId && String(currentUserId) === String(post?.author);

  // Extract hashtags from edit form caption in real-time
  const extractedHashtags = useMemo(() => {
    const hashtagRegex = /#[\w]+/g;
    const matches = editForm.caption.match(hashtagRegex) || [];
    return matches.map((tag) => tag.replace(/^#+/, ''));
  }, [editForm.caption]);

  useEffect(() => {
    setVisibility(post?.visibility || 'public');
    setEditForm({
      caption: post?.caption || '',
      location: post?.location || '',
      visibility: post?.visibility || 'public',
    });
    setOptimistic(null);
  }, [post?.visibility, post?.caption, post?.location]);

  useEffect(() => {
    setLiked(Boolean(post?.isLiked));
    setLikes(Array.isArray(post?.likes) ? post.likes.length : (post?.likesCount ?? post?.likes ?? 0));
    setSaved(Boolean(post?.isSaved));
    setSaves(post?.saveCount ?? 0);
    setReposted(Boolean(post?.isReposted));
    setReposts(post?.repostCount ?? 0);
    setCommentsCount(post?.commentsCount ?? 0);
  }, [
    postId,
    post?.isLiked,
    post?.likes,
    post?.likesCount,
    post?.isSaved,
    post?.saveCount,
    post?.isReposted,
    post?.repostCount,
    post?.commentsCount,
  ]);

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

  useEffect(() => {
    if (!postId) return;

    const handlePostUpdated = (payload) => {
      const updated = payload?.post || payload;
      const targetId = updated?._id || updated?.id;
      if (!targetId || targetId !== postId) return;
      setOptimistic(null);
      if (typeof updated?.visibility === 'string') {
        setVisibility(updated.visibility);
      }
      setEditForm((prev) => ({
        ...prev,
        caption: updated?.caption ?? prev.caption,
        location: updated?.location ?? prev.location,
        visibility: updated?.visibility ?? prev.visibility,
        hashtags: Array.isArray(updated?.hashtags) ? updated.hashtags.join(', ') : prev.hashtags,
      }));
    };

    socket.on('post:updated', handlePostUpdated);
    return () => socket.off('post:updated', handlePostUpdated);
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    const handlePostReposted = (payload) => {
      const targetId = payload?.originalPostId || payload?.postId;
      if (!targetId || targetId !== postId) return;
      if (typeof payload?.repostCount === 'number') {
        setReposts(payload.repostCount);
      }
    };

    const handlePostUnreposted = (payload) => {
      const targetId = payload?.originalPostId || payload?.postId;
      if (!targetId || targetId !== postId) return;
      if (typeof payload?.repostCount === 'number') {
        setReposts(Math.max(0, payload.repostCount));
      }
    };

    socket.on('post:reposted', handlePostReposted);
    socket.on('post:unreposted', handlePostUnreposted);
    return () => {
      socket.off('post:reposted', handlePostReposted);
      socket.off('post:unreposted', handlePostUnreposted);
    };
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    const handleCommentCreated = (payload) => {
      const targetId = payload?.postId;
      if (!targetId || targetId !== postId) return;
      setCommentsCount((prev) => Math.max(prev + 1, 0));
    };

    const handleCommentDeleted = (payload) => {
      const targetId = payload?.postId;
      if (!targetId || targetId !== postId) return;
      setCommentsCount((prev) => Math.max(prev - 1, 0));
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:deleted', handleCommentDeleted);
    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:deleted', handleCommentDeleted);
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

  const handleRepost = async () => {
    if (!postId) return;

    const previousReposted = reposted;
    const previousReposts = reposts;

    try {
      if (reposted) {
        // Remove repost
        setReposted(false);
        setReposts(Math.max(0, reposts - 1));
        await postService.undoRepost(postId);
      } else {
        // Create repost with optional caption
        setShowRepostModal(false);
        setIsRepostingLoading(true);
        setReposted(true);
        setReposts(reposts + 1);
        const repostData = repostCaption.trim() ? { caption: repostCaption.trim() } : {};
        await postService.repostPost(postId, repostData);
        setRepostCaption('');
      }
    } catch (err) {
      console.error('Repost failed:', err);
      setReposted(previousReposted);
      setReposts(previousReposts);
    } finally {
      setIsRepostingLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!postId || isSavingEdit) return;
    
    // Auto-extract hashtags from caption
    const hashtagRegex = /#[\w]+/g;
    const captionHashtags = (editForm.caption.match(hashtagRegex) || [])
      .map((tag) => tag.replace(/^#+/, ''))
      .filter(Boolean);
    
    const optimisticPayload = {
      caption: editForm.caption,
      location: editForm.location,
      visibility: editForm.visibility,
      hashtags: captionHashtags,
    };

    setOptimistic(optimisticPayload);
    setVisibility(editForm.visibility);
    setEditOpen(false);
    setMenuOpen(false);
    setIsSavingEdit(true);

    try {
      await postService.updatePost(postId, optimisticPayload);
    } catch (err) {
      console.error(err);
      setOptimistic(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postId || isDeleting) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(postId);
      setDeleteConfirmOpen(false);
      setMenuOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!postId) return;
    postService.trackView(postId).catch(() => null);
  }, [postId]);

  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">
      {/* Repost Header - Show if this is a reposted post */}
      {post?.isRepost && post?.reposter ? (
        <div className="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-dim px-4 py-3">
          <span className="material-symbols-outlined text-base text-on-surface-variant">
            repeat
          </span>
          <p className="text-xs text-on-surface-variant font-medium">
            Reshared by{' '}
            <span className="font-label-sm text-on-surface">
              {post.reposter.username || 'Someone'}
            </span>
          </p>
        </div>
      ) : null}

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
              {effectiveLocation || user?.location ? `${effectiveLocation || user?.location} • ` : ''}{timestamp}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            className="text-on-surface-variant hover:text-on-surface hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container/30 active:scale-90"
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Post options"
            aria-expanded={menuOpen}
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
          {menuOpen && isOwner ? (
            <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-outline-variant/30 bg-white dark:bg-gray-900 shadow-lg p-1">
              <p className="px-3 py-2 text-[11px] font-semibold text-on-surface-variant">Visibility</p>
              {['public', 'followers', 'friends', 'private'].map((option) => (
                <button
                  key={option}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ${
                    visibility === option 
                      ? 'bg-primary-container/20 text-on-surface font-semibold' 
                      : 'text-on-surface-variant hover:bg-gray-100 dark:hover:bg-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-primary-container/30`}
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
                    <span className="material-symbols-outlined text-base">check_circle</span>
                  ) : null}
                </button>
              ))}
              <div className="my-2 h-px bg-outline-variant/30" />
              <button
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-on-surface hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container/30"
                type="button"
                onClick={() => {
                  setEditOpen(true);
                  setMenuOpen(false);
                }}
              >
                <span>Edit Post</span>
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
              <button
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-error hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error/30"
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(true);
                  setMenuOpen(false);
                }}
              >
                <span>Delete Post</span>
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Media */}
      <MediaCarousel media={mediaItems} poster={post?.image} />

      {/* Interactions & Caption */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 sm:gap-4">
            {/* Like Button */}
            <button
              onClick={handleLike}
              aria-label={liked ? 'Unlike post' : 'Like post'}
              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-500/30 active:scale-90 ${
                liked
                  ? 'text-rose-500 bg-rose-500/10'
                  : 'text-on-surface hover:text-rose-500 hover:bg-rose-500/5'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                favorite
              </span>
            </button>
            <button
              className="p-2 rounded-full transition-all duration-200 text-on-surface hover:text-on-surface-variant hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-container/30 active:scale-90 flex items-center justify-center"
              onClick={() => setOpenComments(true)}
              aria-label="View comments"
            >
              <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
            </button>
            <button
              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500/30 active:scale-90 ${
                reposted
                  ? 'text-green-600 bg-green-600/10'
                  : 'text-on-surface hover:text-green-600 hover:bg-green-600/5'
              }`}
              onClick={() => setShowRepostModal(true)}
              type="button"
              aria-label={reposted ? 'Remove repost' : 'Share post'}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={reposted ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                repeat
              </span>
            </button>
            <button
              className="p-2 rounded-full transition-all duration-200 text-on-surface hover:text-on-surface-variant hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-container/30 active:scale-90 flex items-center justify-center"
              onClick={handleShare}
              type="button"
              aria-label="Share post"
            >
              <span className="material-symbols-outlined text-[22px]">send</span>
            </button>
          </div>
          <button
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500/30 active:scale-90 ${
              saved
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-on-surface hover:text-amber-500 hover:bg-amber-500/5'
            }`}
            onClick={handleSave}
            type="button"
            aria-label={saved ? 'Remove from saved' : 'Save post'}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={saved ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              bookmark
            </span>
          </button>
        </div>

        <div className="font-label-md text-on-surface text-sm">
          <span className="font-bold">{(likes ?? 0).toLocaleString()}</span> {likes === 1 ? 'like' : 'likes'}
        </div>
        <div className="font-body-sm text-on-surface-variant text-xs sm:text-sm flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setOpenComments(true)}
            className="hover:text-on-surface transition-colors cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-primary-container/30 rounded px-1"
          >
            <span className="font-bold">{commentsCount}</span> {commentsCount === 1 ? 'comment' : 'comments'}
          </button>
          <span>•</span>
          <span>
            <span className="font-bold">{reposts.toLocaleString()}</span> {reposts === 1 ? 'repost' : 'reposts'}
          </span>
          <span>•</span>
          <span>
            <span className="font-bold">{saves.toLocaleString()}</span> {saves === 1 ? 'save' : 'saves'}
          </span>
        </div>

        <div className="font-body-sm text-on-surface">
          <span className="font-label-md font-bold mr-1 hover:underline cursor-pointer transition-colors">{user?.username}</span>
          {effectiveCaption}
        </div>
        {Array.isArray(effectiveHashtags) && effectiveHashtags.length > 0 ? (
          <div className="text-xs text-primary font-medium flex flex-wrap gap-1">
            {effectiveHashtags.map((tag) => `#${String(tag).replace(/^#+/, '')}`).join(' ')}
          </div>
        ) : null}

      </div>

      {editOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm" onClick={() => setEditOpen(false)}>
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/30 bg-white dark:bg-gray-900 px-4 sm:px-6 py-4">
              <h3 className="font-semibold text-lg text-on-surface">Edit Post</h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-container/30"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {/* Caption */}
              <div className="space-y-2">
                <label className="block font-semibold text-on-surface">
                  Caption
                </label>
                <textarea
                  className="w-full rounded-lg border border-outline-variant/30 p-3 font-body-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container transition-all resize-none"
                  rows={5}
                  placeholder="Write a caption..."
                  value={editForm.caption}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, caption: event.target.value }))}
                />
                <p className="text-xs text-on-surface-variant">
                  {editForm.caption.length} characters
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label htmlFor="edit-location" className="block font-semibold text-on-surface">
                  Location
                </label>
                <input
                  id="edit-location"
                  type="text"
                  className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 font-body-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container transition-all"
                  placeholder="Add a location..."
                  value={editForm.location}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, location: event.target.value }))}
                />
              </div>

              {/* Hashtags Info */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50 p-3 text-xs text-blue-900 dark:text-blue-100">
                <p className="font-semibold text-blue-950 dark:text-blue-50 mb-1">💡 Hashtag Tip</p>
                <p>Hashtags are now auto-extracted from your caption. Just use # in your caption text!</p>
              </div>

              {/* Current Hashtags Display */}
              {extractedHashtags && extractedHashtags.length > 0 ? (
                <div className="space-y-2">
                  <label className="block font-semibold text-on-surface">
                    Detected Hashtags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {extractedHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Visibility */}
              <div className="space-y-2">
                <label htmlFor="edit-visibility" className="block font-semibold text-on-surface">
                  Visibility
                </label>
                <select
                  id="edit-visibility"
                  className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container transition-all bg-white dark:bg-gray-800 cursor-pointer"
                  value={editForm.visibility}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, visibility: event.target.value }))}
                >
                  <option value="public">🌍 Public - Everyone can see</option>
                  <option value="followers">👥 Followers - Only your followers</option>
                  <option value="friends">💫 Friends - Only mutual followers</option>
                  <option value="private">🔒 Private - Only you</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 border-t border-outline-variant/30 bg-white dark:bg-gray-900 px-4 sm:px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={isSavingEdit}
                className="rounded-lg border border-outline-variant/30 px-4 py-2 font-semibold text-on-surface hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-outline-variant/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90 transition-all duration-200 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95"
              >
                {isSavingEdit ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
                  <span className="material-symbols-outlined text-error text-lg">delete</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-on-surface">Delete this post?</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    This action cannot be undone. The post will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-outline-variant/30 px-6 py-4 flex justify-end gap-3">
              <button
                className="rounded-lg border border-outline-variant/30 px-4 py-2 font-semibold text-on-surface hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-outline-variant/50"
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-error px-4 py-2 font-semibold text-white hover:bg-error/90 transition-all duration-200 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-error/50 active:scale-95"
                type="button"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="border-b border-outline-variant/30 p-4 sm:p-6 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-on-surface">
                {reposted ? 'Remove Repost?' : 'Share this post'}
              </h2>
              <button
                type="button"
                onClick={() => setShowRepostModal(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-container/30"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 sm:p-6">
              {!reposted && (
                <>
                  <div>
                    <label className="block font-semibold text-on-surface mb-2">
                      Add a caption (optional)
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-outline-variant/30 p-3 font-body-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container transition-all resize-none"
                      rows={3}
                      placeholder="Share why you love this post..."
                      value={repostCaption}
                      onChange={(e) => setRepostCaption(e.target.value)}
                    />
                  </div>

                  {/* Original Post Preview */}
                  <div className="rounded-lg border border-outline-variant/30 overflow-hidden">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-outline-variant/30">
                      <p className="text-xs font-semibold text-on-surface-variant">Original Post</p>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar
                          className="h-8 w-8"
                          alt={`${user?.username} avatar`}
                          src={avatarSrc}
                          name={user?.username}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-on-surface truncate text-sm">
                            {user?.username}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {timestamp}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-on-surface line-clamp-3">
                        {caption}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {reposted && (
                <p className="text-sm text-on-surface-variant">
                  Are you sure you want to remove this repost from your profile? The original post will remain visible in your followers' feeds.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-outline-variant/30 bg-white dark:bg-gray-900 p-4 sm:p-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRepostModal(false);
                  setRepostCaption('');
                }}
                disabled={isRepostingLoading}
                className="flex-1 rounded-lg border border-outline-variant/30 px-4 py-2 font-semibold text-on-surface hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-outline-variant/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRepost}
                disabled={isRepostingLoading}
                className={`flex-1 rounded-lg px-4 py-2 font-semibold text-white transition-all duration-200 disabled:opacity-60 focus:outline-none focus:ring-2 active:scale-95 ${
                  reposted
                    ? 'bg-error hover:bg-error/90 focus:ring-error/50'
                    : 'bg-primary hover:bg-primary/90 focus:ring-primary/50'
                }`}
              >
                {isRepostingLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : reposted ? (
                  'Remove Repost'
                ) : (
                  'Share Post'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CommentModal
        post={{ ...post, caption: effectiveCaption, location: effectiveLocation, hashtags: effectiveHashtags }}
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

export default memo(PostCard);
