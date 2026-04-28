import { useEffect, useMemo, useState } from "react";

const CommentModal = ({ post, isOpen, onClose }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  const postId = useMemo(() => post?._id || post?.id, [post]);
  const imageSrc = post?.imageUrl || post?.image;

  useEffect(() => {
    if (!postId) return;

    const fetchComments = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/comments/${postId}`
        );
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchComments();
  }, [postId]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleComment = async () => {
    if (!text.trim() || !postId) return;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId,
        text,
      }),
    });

    const newComment = await res.json();
    setComments((prev) => [...prev, newComment]);
    setText("");
  };

  const isActive = text.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* IMAGE */}
        {imageSrc && (
          <img src={imageSrc} className="w-full h-64 object-cover" />
        )}

        {/* ACTIONS */}
        <div className="flex items-center gap-4 p-3 border-b">
          <button className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined">favorite</span>
            Like
          </button>
          <button className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined">chat_bubble</span>
            Comment
          </button>
        </div>

        {/* COMMENTS */}
        <div className="h-60 overflow-y-auto px-4 py-2">
          {comments.map((c) => (
            <div key={c._id} className="mb-2">
              <span className="font-semibold">{c.username}</span>
              <span className="ml-2">{c.text}</span>
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="flex items-center gap-2 border-t p-3">
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-1 outline-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isActive) handleComment();
            }}
          />

          <img
            src="/images/send-icon.png"
            alt="Send"
            className={`h-6 w-6 cursor-pointer ${
              isActive ? "opacity-100" : "opacity-40 pointer-events-none"
            }`}
            onClick={handleComment}
          />
        </div>

        {/* CANCEL */}
        <button className="w-full py-2 text-center border-t" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CommentModal;
