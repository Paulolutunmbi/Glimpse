import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { commentService } from "../services/apiService";
import { socket } from "../socket";
import Avatar from "./Avatar";

const CommentModal = ({
  post,
  isOpen,
  onClose,
  liked,
  likes,
  onToggleLike,
  currentUser,
}) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const nextClientId = useRef(1);
  const commentsContainerRef = useRef(null);
  const editWindowMinutes = Number(import.meta.env.VITE_COMMENT_EDIT_WINDOW_MINUTES || 15);
  const deleteWindowMinutes = Number(import.meta.env.VITE_COMMENT_DELETE_WINDOW_MINUTES || editWindowMinutes);

  const postId = useMemo(() => post?._id || post?.id, [post]);
  const imageSrc = post?.imageUrl || post?.image;
  const imageSources = useMemo(() => {
    if (Array.isArray(post?.images)) {
      return post.images.filter(Boolean);
    }
    return imageSrc ? [imageSrc] : [];
  }, [post, imageSrc]);
  const emojiReactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];
  const postUsername = post?.user?.username || post?.username || "User";
  const caption = post?.caption || "";
  const isLiked = typeof liked === "boolean" ? liked : Boolean(post?.isLiked);
  const currentUserId =
    currentUser?.id ?? currentUser?._id ?? currentUser?.userId ?? null;
  const likeCount =
    typeof likes === "number"
      ? likes
      : Array.isArray(post?.likes)
      ? post.likes.length
      : post?.likesCount ?? post?.likes ?? 0;
  const commentCount =
    comments.length || post?.commentsCount || post?.comments?.length || post?.comments || 0;

  const formatCount = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0";
    if (numeric < 1000) return `${numeric}`;
    const formatted = (numeric / 1000).toFixed(numeric >= 10000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, "")}k`;
  };

  const getCommentKey = (comment) =>
    comment?._id || comment?.id || comment?.clientId || `${comment?.text}-${comment?.username}`;

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingText("");
  }, []);

  const upsertComment = useCallback((incoming) => {
    const incomingId = incoming?._id || incoming?.id;
    setComments((prev) => {
      if (!incomingId) return [...prev, incoming];
      const index = prev.findIndex((item) => item._id === incomingId || item.id === incomingId);
      if (index === -1) return [...prev, incoming];
      const next = [...prev];
      next[index] = { ...next[index], ...incoming };
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    setMenuOpenId(null);
    setConfirmDeleteId(null);
    handleCancelEdit();
    onClose();
  }, [handleCancelEdit, onClose]);

  useEffect(() => {
    if (!postId) return;

    const fetchComments = async () => {
      try {
        const data = await commentService.getByPost(postId);
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (!isOpen || !postId) return;

    socket.emit("joinPost", postId);

    const handleCommentCreated = (payload) => {
      const incoming = payload?.comment || payload;
      if (!incoming) return;
      upsertComment(incoming);
    };

    const handleCommentUpdated = (payload) => {
      const incoming = payload?.comment || payload;
      const incomingId = incoming?._id || incoming?.id;
      if (!incomingId) return;
      upsertComment(incoming);
    };

    const handleCommentDeleted = (payload) => {
      const commentId = payload?.commentId || payload?.id || payload;
      if (!commentId) return;
      setComments((prev) => prev.filter((item) => item._id !== commentId && item.id !== commentId));
    };

    socket.on("comment:created", handleCommentCreated);
    socket.on("comment:updated", handleCommentUpdated);
    socket.on("comment:deleted", handleCommentDeleted);

    return () => {
      socket.emit("leavePost", postId);
      socket.off("comment:created", handleCommentCreated);
      socket.off("comment:updated", handleCommentUpdated);
      socket.off("comment:deleted", handleCommentDeleted);
    };
  }, [isOpen, postId, upsertComment]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
      setNowTs(Date.now());
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      document.body.style.overscrollBehavior = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      document.body.style.overscrollBehavior = "auto";
    };
  }, [isOpen]);

  // Auto-scroll to latest comment
  useEffect(() => {
    if (commentsContainerRef.current && comments.length > 0) {
      setTimeout(() => {
        const container = commentsContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 0);
    }
  }, [comments.length]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;
      if (editingId) {
        handleCancelEdit();
        return;
      }
      handleClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, editingId, handleCancelEdit, handleClose]);

  const handleComment = async (value = text) => {
    if (!postId) return;
    const trimmed = value.trim();
    if (!trimmed) return;

    setError("");

    // Create client ID for optimistic update
    const clientId = `client-${nextClientId.current++}`;
    const optimisticComment = {
      _id: clientId,
      clientId,
      text: trimmed,
      username: currentUser?.username ?? "Guest",
      userId: currentUserId ?? null,
      avatar: currentUser?.avatar ?? null,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistic update - add comment immediately
    upsertComment(optimisticComment);
    setText("");

    const payload = {
      postId,
      text: trimmed,
    };

    if (currentUser?.username) {
      payload.username = currentUser.username;
    }
    if (currentUserId) {
      payload.userId = currentUserId;
    }
    if (currentUser?.avatar) {
      payload.avatar = currentUser.avatar;
    }

    try {
      const newComment = await commentService.create(payload);
      const resolvedComment = {
        ...newComment,
        text: newComment?.text ?? trimmed,
        username: newComment?.username ?? currentUser?.username ?? "Guest",
        userId: newComment?.userId ?? currentUserId ?? null,
        avatar: newComment?.avatar ?? currentUser?.avatar ?? null,
        isOptimistic: false,
      };

      // Replace optimistic comment with real one
      upsertComment(resolvedComment);
    } catch {
      // Remove optimistic comment on error
      setComments((prev) => prev.filter((item) => item.clientId !== clientId));
      setError("Failed to post comment. Please try again.");
    }
  };

  const handleStartEdit = (comment) => {
    setEditingId(getCommentKey(comment));
    setEditingText(comment?.text || "");
    setMenuOpenId(null);
  };

  const handleSaveEdit = async () => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setError("");

    const previousComments = comments;
    const target = comments.find((comment) => getCommentKey(comment) === editingId);
    const commentId = target?._id || target?.id;

    setComments((prev) =>
      prev.map((comment) =>
        getCommentKey(comment) === editingId ? { ...comment, text: trimmed } : comment
      )
    );
    handleCancelEdit();

    if (!commentId) return;

    try {
      const response = await commentService.update(commentId, { text: trimmed });
      const updated = response?.data || response?.comment || response?.data?.comment || response;
      if (updated) {
        setComments((prev) =>
          prev.map((comment) =>
            (comment._id === commentId || comment.id === commentId) ? { ...comment, ...updated } : comment
          )
        );
      }
    } catch (err) {
      setComments(previousComments);
      setError(err?.response?.data?.error || "Failed to update comment. Please try again.");
    }
  };

  const handleDeleteComment = async (comment) => {
    const key = getCommentKey(comment);
    const previousComments = comments;
    setComments((prev) => prev.filter((item) => getCommentKey(item) !== key));
    if (editingId === key) handleCancelEdit();
    setConfirmDeleteId(null);
    const commentId = comment?._id || comment?.id;
    if (!commentId) return;
    try {
      await commentService.remove(commentId);
    } catch (err) {
      setComments(previousComments);
      setError(err?.response?.data?.error || "Failed to delete comment. Please try again.");
    }
  };

  const resolveCommentPermissions = (comment) => {
    const commentId = comment?._id || comment?.id;
    const isOwner =
      (currentUser?.username && comment.username === currentUser.username) ||
      (currentUserId && String(comment.userId) === String(currentUserId));
    if (!isOwner) {
      return { isOwner: false, canEdit: false, canDelete: false, commentId };
    }

    if (typeof comment?.canEdit === "boolean" || typeof comment?.canDelete === "boolean") {
      return {
        isOwner,
        canEdit: Boolean(comment?.canEdit),
        canDelete: Boolean(comment?.canDelete),
        commentId,
      };
    }

    const createdAt = comment?.createdAt ? new Date(comment.createdAt).getTime() : 0;
    return {
      isOwner,
      canEdit: createdAt ? nowTs - createdAt <= editWindowMinutes * 60 * 1000 : false,
      canDelete: createdAt ? nowTs - createdAt <= deleteWindowMinutes * 60 * 1000 : false,
      commentId,
    };
  };

  const isActive = text.trim().length > 0;

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] p-0 sm:p-0 md:p-6"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full h-[100vh] overflow-y-hidden md:h-[92vh] md:w-[900px] lg:w-[1100px] md:rounded-2xl rounded-none flex flex-col shadow-xl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left: Image area */}
          <div className="w-full md:w-1/2 lg:w-2/3 bg-surface-variant flex items-stretch justify-stretch overflow-hidden rounded-t-none md:rounded-l-2xl">
            {imageSources[0] ? (
              <img
                alt="Post"
                className="w-full h-full object-cover"
                src={imageSources[0]}
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-surface-variant text-on-surface-variant">
                No image available
              </div>
            )}
          </div>

          {/* Right: Comments panel */}
          <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col min-h-0">
            <div className="sticky top-0 z-10 bg-white border-b border-surface-variant p-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="text-on-surface hover:text-primary-container transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <span className="font-label-md text-on-surface">Comments</span>
            </div>

            <div className="p-4 border-b border-surface-variant bg-white">
              <p className="font-label-md text-on-surface">{postUsername}</p>
              {caption && (
                <p className="font-body-sm text-on-surface-variant">{caption}</p>
              )}
            </div>

            <div className="p-4 flex items-center justify-between border-b border-surface-variant bg-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onToggleLike?.()}
                  className={`${
                    isLiked ? "text-primary-container" : "text-on-surface"
                  } hover:text-primary-container transition-colors duration-200 focus:outline-none flex items-center justify-center`}
                  aria-label={isLiked ? "Unlike post" : "Like post"}
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    favorite
                  </span>
                </button>
                <button className="text-on-surface hover:text-primary-container transition-colors duration-200 focus:outline-none flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">
                    chat_bubble
                  </span>
                </button>
              </div>
              <div className="font-label-md text-secondary">
                {formatCount(likeCount)} Likes | {formatCount(commentCount)} Comments
              </div>
            </div>

            <div className="p-3 flex items-center justify-between overflow-x-auto gap-2 border-b border-surface-variant bg-white">
              {emojiReactions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleComment(emoji)}
                  className="text-2xl hover:scale-110 transition-transform duration-200 focus:outline-none bg-surface-variant hover:bg-surface-dim rounded-full w-10 h-10 flex items-center justify-center cursor-pointer"
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 bg-white" ref={commentsContainerRef} style={{ maxHeight: 'calc(100vh - 180px)' }}>
              {error ? (
                <div className="rounded-lg border border-error/30 bg-error-container px-3 py-2 text-sm text-on-error-container">
                  {error}
                </div>
              ) : null}
              {comments.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-4">
                  No comments yet. Be the first to say something.
                </p>
              )}
              {comments.map((c) => {
                const permissions = resolveCommentPermissions(c);
                const isOwner = permissions.isOwner;
                const commentKey = getCommentKey(c);
                return (
                  <div key={commentKey} className="flex gap-3">
                    <Avatar
                      alt={c.username || "Comment author"}
                      className="h-8 w-8 shrink-0"
                      src={
                        c.avatar ||
                        currentUser?.profilePicture ||
                        currentUser?.avatar ||
                        post?.user?.avatar ||
                        ''
                      }
                      name={c.username || currentUser?.username || post?.user?.username}
                    />
                    <div className="flex-1 flex items-start gap-2">
                      <div className="flex-1 bg-surface-variant rounded-xl p-3 rounded-tl-none">
                        <span className="font-label-md text-on-surface block mb-1">
                          {c.username || "Guest"}
                        </span>
                        {editingId === commentKey ? (
                          <input
                            className="w-full bg-white border border-surface-variant rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveEdit();
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                handleCancelEdit();
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="font-body-sm text-on-surface-variant">
                            <span>{c.text}</span>
                            {c?.isEdited ? (
                              <span className="ml-2 text-[11px] font-medium text-on-surface-variant/80">edited</span>
                            ) : null}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                            isOwner
                              ? "text-on-surface hover:bg-surface-variant"
                              : "text-on-surface-variant cursor-default"
                          }`}
                          onClick={() => {
                            if (!isOwner) return;
                            setMenuOpenId((prev) =>
                              prev === commentKey ? null : commentKey
                            );
                          }}
                          aria-label="Comment options"
                          aria-disabled={!isOwner}
                        >
                          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                        </button>
                        {menuOpenId === commentKey && (
                          <div className="absolute right-0 mt-2 w-28 rounded-lg border border-surface-variant bg-white shadow-lg overflow-hidden z-10">
                            {permissions.canEdit ? (
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-variant"
                                onClick={() => handleStartEdit(c)}
                              >
                                Edit
                              </button>
                            ) : null}
                            {permissions.canDelete ? (
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => setConfirmDeleteId(commentKey)}
                              >
                                Delete
                              </button>
                            ) : null}
                            {!permissions.canEdit && !permissions.canDelete ? (
                              <div className="px-3 py-2 text-[11px] text-on-surface-variant">Time window expired</div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-surface-variant p-3 space-y-2">
              <div className="relative flex items-center">
                <input
                  className="w-full bg-surface-variant border-none rounded-full py-sm pl-md pr-xl font-body-sm text-on-surface placeholder:text-secondary focus:ring-2 focus:ring-primary-container focus:outline-none"
                  placeholder="Write a comment... (try @mentions)"
                  type="text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    // Simple @ mention detection
                    const lastAt = e.target.value.lastIndexOf('@');
                    if (lastAt !== -1) {
                      const afterAt = e.target.value.substring(lastAt + 1);
                      if (/^[\w]*$/.test(afterAt) && afterAt.length <= 20 && afterAt.length > 0) {
                        setMentionQuery(afterAt);
                        setShowMentions(true);
                      } else {
                        setShowMentions(false);
                      }
                    } else {
                      setShowMentions(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isActive && !showMentions) handleComment();
                  }}
                />
                <button
                  className={`absolute right-sm top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? "text-primary-container hover:bg-surface-dim"
                      : "text-secondary opacity-50 cursor-not-allowed"
                  }`}
                  type="button"
                  onClick={handleComment}
                  disabled={!isActive}
                  aria-label="Send comment"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>

              {/* @Mention Suggestions */}
              {showMentions && mentionQuery && (
                <div className="bg-surface-dim rounded-lg border border-outline-variant/30 p-1 text-sm max-h-40 overflow-y-auto">
                  {[
                    { username: 'john_doe', avatar: null },
                    { username: 'jane_smith', avatar: null },
                    { username: 'alex_jones', avatar: null },
                    { username: postUsername, avatar: post?.user?.avatar || null },
                  ]
                    .filter((u) => u.username.toLowerCase().includes(mentionQuery.toLowerCase()))
                    .slice(0, 5)
                    .map((user) => (
                      <button
                        key={user.username}
                        type="button"
                        onClick={() => {
                          const lastAtIndex = text.lastIndexOf('@');
                          if (lastAtIndex !== -1) {
                            const before = text.substring(0, lastAtIndex);
                            const newText = `${before}@${user.username} `;
                            setText(newText);
                            setShowMentions(false);
                            setMentionQuery('');
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-surface-variant rounded transition-colors flex items-center gap-2"
                      >
                        <Avatar
                          className="h-6 w-6"
                          alt={user.username}
                          src={user.avatar || ''}
                          name={user.username}
                        />
                        <span className="text-xs">{user.username}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="w-full max-w-xs rounded-2xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-base font-semibold text-on-surface">Delete comment?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-outline-variant/30 px-4 py-2"
                type="button"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-error px-4 py-2 text-white"
                type="button"
                onClick={() => {
                  const target = comments.find((item) => getCommentKey(item) === confirmDeleteId);
                  if (target) {
                    handleDeleteComment(target);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CommentModal;
