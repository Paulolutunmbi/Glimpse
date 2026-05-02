import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import API from "../api/axios";

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
  const nextClientId = useRef(1);

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

  const handleClose = useCallback(() => {
    setMenuOpenId(null);
    handleCancelEdit();
    onClose();
  }, [handleCancelEdit, onClose]);

  useEffect(() => {
    if (!postId) return;

    const fetchComments = async () => {
      try {
        const res = await API.get(`/api/comments/${postId}`);
        const data = res.data;
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

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

    const res = await API.post("/api/comments", payload);
    const newComment = res.data;
    const resolvedComment = {
      ...newComment,
      text: newComment?.text ?? trimmed,
      username: newComment?.username ?? currentUser?.username ?? "Guest",
      userId: newComment?.userId ?? currentUserId ?? null,
      avatar: newComment?.avatar ?? currentUser?.avatar ?? null,
      clientId:
        newComment?._id || newComment?.id
          ? undefined
          : `client-${nextClientId.current++}`,
    };

    setComments((prev) => [...prev, resolvedComment]);
    setText("");
  };

  const handleStartEdit = (comment) => {
    setEditingId(getCommentKey(comment));
    setEditingText(comment?.text || "");
    setMenuOpenId(null);
  };

  const handleSaveEdit = () => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setComments((prev) =>
      prev.map((comment) =>
        getCommentKey(comment) === editingId
          ? { ...comment, text: trimmed }
          : comment
      )
    );
    handleCancelEdit();
  };

  const handleDeleteComment = (comment) => {
    const key = getCommentKey(comment);
    setComments((prev) => prev.filter((item) => getCommentKey(item) !== key));
    if (editingId === key) handleCancelEdit();
    const commentId = comment?._id || comment?.id;
    if (!commentId) return;
    API.delete(`/api/comments/${commentId}`).catch((err) => {
      console.error(err);
    });
  };

  const isActive = text.trim().length > 0;

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] p-2 sm:p-4 md:p-6"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full h-[100vh] overflow-y-auto md:h-[90vh] md:w-[640px] lg:w-[720px] md:rounded-2xl rounded-none flex flex-col shadow-xl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="relative w-full h-56 sm:h-64 shrink-0">
          <img
            alt="Post"
            className="w-full h-full object-cover"
            src={imageSources[0]}
          />
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
                className="material-symbols-outlined text-[28px]"
                style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                favorite
              </span>
            </button>
            <button className="text-on-surface hover:text-primary-container transition-colors duration-200 focus:outline-none flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">
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

        <div className="px-4 py-3 flex flex-col gap-4 bg-white">
          {comments.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              No comments yet. Be the first to say something.
            </p>
          )}
          {comments.map((c) => {
            const isOwner =
              (currentUser?.username && c.username === currentUser.username) ||
              (currentUserId && c.userId === currentUserId);
            const commentKey = getCommentKey(c);
            return (
              <div key={commentKey} className="flex gap-3">
                <img
                  alt={c.username || "Comment author"}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  src={
                    c.avatar ||
                    currentUser?.avatar ||
                    post?.user?.avatar ||
                    "/images/glimpse-icon.png"
                  }
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
                      <span className="font-body-sm text-on-surface-variant">
                        {c.text}
                      </span>
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
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-variant"
                          onClick={() => handleStartEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteComment(c)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-surface-variant p-3">
          <div className="relative flex items-center">
            <input
              className="w-full bg-surface-variant border-none rounded-full py-sm pl-md pr-xl font-body-sm text-on-surface placeholder:text-secondary focus:ring-2 focus:ring-primary-container focus:outline-none"
              placeholder="Write a comment..."
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isActive) handleComment();
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
              <img
                src="/images/send-icon.png"
                alt="Send"
                className="w-4 h-4"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CommentModal;
