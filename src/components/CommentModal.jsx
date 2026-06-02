import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { commentService } from "../services/apiService";
import { socket } from "../socket";
import Avatar from "./Avatar";
import VerifiedBadge from "./VerifiedBadge";

const CommentModal = ({
  post,
  isOpen,
  onClose,
  liked,
  likes,
  onToggleLike,
  onCommentCountChange,
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
  const [replyTo, setReplyTo] = useState(null);
  const nextClientId = useRef(1);
  const commentsContainerRef = useRef(null);
  const inputRef = useRef(null);
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

  const matchesOptimistic = (existing, incoming) => {
    if (!existing?.isOptimistic || !incoming) return false;
    const existingUserId = existing?.userId || existing?.user?._id || existing?.user?.id;
    const incomingUserId = incoming?.userId || incoming?.user?._id || incoming?.user?.id;
    const existingParent = existing?.parentCommentId || existing?.parentId || null;
    const incomingParent = incoming?.parentCommentId || incoming?.parentId || null;
    if (existingParent || incomingParent) {
      if (String(existingParent || "") !== String(incomingParent || "")) return false;
    }
    if (existingUserId && incomingUserId && String(existingUserId) !== String(incomingUserId)) return false;
    return String(existing?.text || "").trim() === String(incoming?.text || "").trim();
  };

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingText("");
  }, []);

  const upsertComment = useCallback((incoming) => {
    setComments((prev) => {
      const incomingId = getCommentId(incoming);
      const incomingClientId = incoming?.clientId;
      const index = prev.findIndex((item) => {
        const itemId = getCommentId(item);
        if (incomingId && itemId && String(itemId) === String(incomingId)) return true;
        if (incomingClientId && item?.clientId === incomingClientId) return true;
        return false;
      });

      if (index !== -1) {
        const next = [...prev];
        next[index] = { ...next[index], ...incoming, isOptimistic: false };
        return next;
      }

      if (incomingId) {
        const optimisticIndex = prev.findIndex((item) => matchesOptimistic(item, incoming));
        if (optimisticIndex !== -1) {
          const next = [...prev];
          next[optimisticIndex] = { ...next[optimisticIndex], ...incoming, isOptimistic: false };
          return next;
        }
      }

      if (!incomingId) {
        const optimisticIndex = prev.findIndex((item) => matchesOptimistic(item, incoming));
        if (optimisticIndex !== -1) return prev;
      }

      return [...prev, incoming];
    });
  }, []);

  const handleClose = useCallback(() => {
    setMenuOpenId(null);
    setConfirmDeleteId(null);
    handleCancelEdit();
    setReplyTo(null);
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

    const parentCommentId = replyTo?._id || replyTo?.id || null;

    // Create client ID for optimistic update
    const clientId = `client-${nextClientId.current++}`;
    const optimisticComment = {
      _id: clientId,
      clientId,
      text: trimmed,
      username: currentUser?.username ?? "Guest",
      userId: currentUserId ?? null,
      avatar: currentUser?.avatar ?? null,
      parentCommentId,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistic update - add comment immediately
    upsertComment(optimisticComment);
    if (typeof onCommentCountChange === "function") {
      onCommentCountChange(1);
    }
    setText("");
    setReplyTo(null);

    const payload = {
      postId,
      text: trimmed,
    };

    if (parentCommentId) {
      payload.parentCommentId = parentCommentId;
    }

    if (currentUser?.username) {
      payload.username = currentUser.username;
    }
    if (currentUserId) {
      payload.userId = currentUserId;
    }
    if (currentUser?.avatar) {
      payload.avatar = currentUser.avatar;
    }
    payload.clientId = clientId;

    try {
      const newComment = await commentService.create(payload);
      const resolvedComment = {
        ...newComment,
        text: newComment?.text ?? trimmed,
        username: newComment?.username ?? currentUser?.username ?? "Guest",
        userId: newComment?.userId ?? currentUserId ?? null,
        avatar: newComment?.avatar ?? currentUser?.avatar ?? null,
        parentCommentId: newComment?.parentCommentId ?? parentCommentId,
        isOptimistic: false,
      };

      // Replace optimistic comment with real one
      upsertComment(resolvedComment);
    } catch {
      // Remove optimistic comment on error
      setComments((prev) => prev.filter((item) => item.clientId !== clientId));
      if (typeof onCommentCountChange === "function") {
        onCommentCountChange(-1);
      }
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
    if (typeof onCommentCountChange === "function") {
      onCommentCountChange(-1);
    }
    if (editingId === key) handleCancelEdit();
    setConfirmDeleteId(null);
    const commentId = comment?._id || comment?.id;
    if (!commentId) return;
    try {
      await commentService.remove(commentId);
    } catch (err) {
      setComments(previousComments);
      if (typeof onCommentCountChange === "function") {
        onCommentCountChange(1);
      }
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

  const { topLevelComments, repliesByParent } = useMemo(() => {
    const byParent = new Map();
    const roots = [];
    comments.forEach((comment) => {
      const parentId = comment?.parentCommentId || comment?.parentId || null;
      if (!parentId) {
        roots.push(comment);
        return;
      }
      const key = String(parentId);
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(comment);
    });
    return { topLevelComments: roots, repliesByParent: byParent };
  }, [comments]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/60 p-0 md:items-center md:p-6"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full h-[100dvh] max-h-[100dvh] overflow-hidden md:h-auto md:max-h-[85vh] md:w-[min(88vw,860px)] lg:w-[min(80vw,900px)] md:rounded-2xl rounded-none flex flex-col shadow-xl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left: Image area */}
          <div className="w-full md:w-[58%] max-h-56 shrink-0 bg-surface-variant flex items-stretch justify-stretch overflow-hidden rounded-t-none md:max-h-none md:rounded-l-2xl">
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
          <div className="w-full md:w-[44%] flex flex-col min-h-0 overflow-hidden">
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
              <p className="font-label-md text-on-surface inline-flex items-center gap-1">
                <span>{postUsername}</span>
                <VerifiedBadge verified={post?.user?.verified} size={12} />
              </p>
              {caption && (
                <p className="font-body-sm text-on-surface-variant">{caption}</p>
              )}
              {post?.isRepostedByUser ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-surface-variant px-3 py-1 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">repeat</span>
                  <span className="font-semibold text-on-surface">Reposted</span>
                </div>
              ) : null}
            </div>

            <div className="p-4 flex items-center justify-between border-b border-surface-variant bg-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onToggleLike?.()}
                  className={`px-3 py-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 active:scale-90 flex items-center justify-center ${
                    isLiked ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20" : "text-on-surface hover:text-rose-500 hover:bg-rose-500/5"
                  }`}
                  aria-label={isLiked ? "Unlike post" : "Like post"}
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    favorite
                  </span>
                </button>
                <button className="px-3 py-2 rounded-full text-on-surface hover:text-primary-container hover:bg-primary-container/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container/30 active:scale-90 flex items-center justify-center">
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
                  className="text-2xl hover:scale-125 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container/30 bg-surface-variant hover:bg-primary-container/20 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer active:scale-100"
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-4 bg-white" ref={commentsContainerRef}>
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
              {topLevelComments.map((c) => {
                const permissions = resolveCommentPermissions(c);
                const isOwner = permissions.isOwner;
                const commentKey = getCommentKey(c);
                const commentId = getCommentId(c);
                const replies = commentId ? repliesByParent.get(String(commentId)) || [] : [];
                return (
                  <div key={commentKey} className="flex flex-col gap-3">
                    <div className="flex gap-3">
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
                          <span className="font-label-md text-on-surface block mb-1 inline-flex items-center gap-1">
                            <span>{c.username || "Guest"}</span>
                            <VerifiedBadge verified={c.verified} size={12} />
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

                    <div className="flex items-center gap-3 pl-11 text-xs text-on-surface-variant">
                      <button
                        type="button"
                        className="hover:text-on-surface transition-colors"
                        onClick={() => {
                          setReplyTo(c);
                          inputRef.current?.focus();
                        }}
                      >
                        Reply
                      </button>
                    </div>

                    {replies.length > 0 ? (
                      <div className="flex flex-col gap-3 pl-11">
                        {replies.map((reply) => {
                          const replyKey = getCommentKey(reply);
                          return (
                            <div key={replyKey} className="flex gap-3">
                              <Avatar
                                alt={reply.username || "Reply author"}
                                className="h-7 w-7 shrink-0"
                                src={
                                  reply.avatar ||
                                  currentUser?.profilePicture ||
                                  currentUser?.avatar ||
                                  post?.user?.avatar ||
                                  ''
                                }
                                name={reply.username || currentUser?.username || post?.user?.username}
                              />
                              <div className="flex-1 bg-surface-container-lowest rounded-xl p-3">
                                <span className="font-label-md text-on-surface block mb-1 inline-flex items-center gap-1">
                                  <span>{reply.username || "Guest"}</span>
                                  <VerifiedBadge verified={reply.verified} size={12} />
                                </span>
                                <div className="font-body-sm text-on-surface-variant">
                                  <span>{reply.text}</span>
                                  {reply?.isEdited ? (
                                    <span className="ml-2 text-[11px] font-medium text-on-surface-variant/80">edited</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-surface-variant p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] space-y-2">
              {replyTo ? (
                <div className="flex items-center justify-between rounded-lg bg-surface-dim px-3 py-2 text-xs text-on-surface-variant">
                  <span>
                    Replying to <span className="font-semibold text-on-surface inline-flex items-center gap-1">@{replyTo.username || "User"}<VerifiedBadge verified={replyTo.verified} size={12} /></span>
                  </span>
                  <button
                    type="button"
                    className="text-on-surface-variant hover:text-on-surface"
                    onClick={() => setReplyTo(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
              <div className="relative flex items-center">
                <input
                  className="w-full bg-surface-variant border-2 border-transparent rounded-full py-sm pl-md pr-xl font-body-sm text-on-surface placeholder:text-secondary focus:ring-2 focus:ring-primary-container focus:outline-none focus:border-primary-container focus:bg-white transition-all duration-200"
                  placeholder="Write a comment... (try @mentions)"
                  type="text"
                  value={text}
                  ref={inputRef}
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
                  className={`absolute right-sm top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? "text-primary-container hover:bg-primary-container/10 active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary-container/30"
                      : "text-secondary opacity-40 cursor-not-allowed"
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
                <div className="bg-surface-dim rounded-lg border border-outline-variant/30 p-1 text-sm max-h-40 overflow-y-auto shadow-sm">
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
                        <span className="text-xs inline-flex items-center gap-1">
                          <span>{user.username}</span>
                          <VerifiedBadge verified={user.verified} size={11} />
                        </span>
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
