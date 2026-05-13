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
  const [menuOpen, setMenuOpen] = useState(false);
  const [visibility, setVisibility] = useState(post?.visibility || 'public');
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [isRepostingLoading, setIsRepostingLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    caption: post?.caption || '',
    location: post?.location || '',
    visibility: post?.visibility || 'public',
    hashtags: Array.isArray(post?.hashtags) ? post.hashtags.join(', ') : '',
  });
  const [optimistic, setOptimistic] = useState(null);
  const effectiveCaption = optimistic?.caption ?? caption;
  const effectiveLocation = optimistic?.location ?? post?.location;
  const effectiveHashtags = optimistic?.hashtags ?? post?.hashtags ?? [];
  const currentUserId = currentUser?.id || currentUser?._id || null;
  const isOwner = currentUserId && String(currentUserId) === String(post?.author);

  useEffect(() => {
    setVisibility(post?.visibility || 'public');
    setEditForm({
      caption: post?.caption || '',
      location: post?.location || '',
      visibility: post?.visibility || 'public',
      hashtags: Array.isArray(post?.hashtags) ? post.hashtags.join(', ') : '',
    });
    setOptimistic(null);
  }, [post?.visibility, post?.caption, post?.location, post?.hashtags]);

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
        // Create repost
        setShowRepostModal(false);
        setIsRepostingLoading(true);
        setReposted(true);
        setReposts(reposts + 1);
        await postService.repostPost(postId, {});
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
    const hashtags = editForm.hashtags
      .split(',')
      .map((item) => item.trim().replace(/^#+/, ''))
      .filter(Boolean);

    const optimisticPayload = {
      caption: editForm.caption,
      location: editForm.location,
      visibility: editForm.visibility,
      hashtags,
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
              <div className="my-2 h-px bg-outline-variant/30" />
              <button
                className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-on-surface"
                type="button"
                onClick={() => {
                  setEditOpen(true);
                  setMenuOpen(false);
                }}
              >
                Edit Post
              </button>
              <button
                className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-error"
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(true);
                  setMenuOpen(false);
                }}
              >
                Delete Post
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
              className={`${
                reposted
                  ? 'text-green-600'
                  : 'text-on-surface hover:text-green-500'
              } transition-colors flex items-center justify-center`}
              onClick={() => setShowRepostModal(true)}
              type="button"
              title={reposted ? 'Unrepost' : 'Repost'}
            >
              <span
                className="material-symbols-outlined"
                style={reposted ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                repeat
              </span>
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
          {reposts.toLocaleString()} {reposts === 1 ? 'repost' : 'reposts'} • {saves.toLocaleString()} {saves === 1 ? 'save' : 'saves'}
        </div>

        <div className="font-body-sm text-on-surface">
          <span className="font-label-md mr-1">{user?.username}</span>
          {effectiveCaption}
        </div>
        {Array.isArray(effectiveHashtags) && effectiveHashtags.length > 0 ? (
          <div className="text-xs text-on-surface-variant">
            {effectiveHashtags.map((tag) => `#${String(tag).replace(/^#+/, '')}`).join(' ')}
          </div>
        ) : null}

      </div>

      {editOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setEditOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-lg font-semibold text-on-surface">Edit Post</h3>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-on-surface-variant">
                Caption
                <textarea
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 p-3"
                  rows={3}
                  value={editForm.caption}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, caption: event.target.value }))}
                />
              </label>
              <label className="block text-sm text-on-surface-variant">
                Location
                <input
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 px-3 py-2"
                  value={editForm.location}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, location: event.target.value }))}
                />
              </label>
              <label className="block text-sm text-on-surface-variant">
                Hashtags (comma separated)
                <input
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 px-3 py-2"
                  value={editForm.hashtags}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, hashtags: event.target.value }))}
                />
              </label>
              <label className="block text-sm text-on-surface-variant">
                Visibility
                <select
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 px-3 py-2"
                  value={editForm.visibility}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, visibility: event.target.value }))}
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers</option>
                  <option value="friends">Friends</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-outline-variant/30 px-4 py-2" type="button" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button
                className="rounded-lg bg-primary-container px-4 py-2 text-white disabled:opacity-60"
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-lg font-semibold text-on-surface">Delete this post?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-outline-variant/30 px-4 py-2" type="button" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </button>
              <button
                className="rounded-lg bg-error px-4 py-2 text-white disabled:opacity-60"
                type="button"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center">
          <div className="w-full rounded-t-2xl bg-white p-6 sm:w-96 sm:rounded-2xl">
            <h2 className="mb-4 text-lg font-semibold">
              {reposted ? 'Remove Repost?' : 'Repost this post?'}
            </h2>
            <p className="mb-6 text-sm text-on-surface-variant">
              {reposted
                ? 'This post will be removed from your profile.'
                : 'This will be added to your profile.'}
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg border border-outline-variant bg-surface px-4 py-2 font-semibold transition-colors hover:bg-zinc-100"
                onClick={() => setShowRepostModal(false)}
                disabled={isRepostingLoading}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                onClick={handleRepost}
                disabled={isRepostingLoading}
              >
                {isRepostingLoading ? 'Loading...' : reposted ? 'Remove' : 'Repost'}
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
