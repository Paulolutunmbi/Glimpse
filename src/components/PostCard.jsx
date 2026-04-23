import { useMemo, useState } from 'react';
import { likePost } from '../api/posts';

export default function PostCard({ post }) {
  const postId = useMemo(() => post?._id || post?.id, [post]);
  const { user, image, timestamp, comments, caption } = post;
  const [liked, setLiked] = useState(Boolean(post?.isLiked));
  const [likes, setLikes] = useState(
    Array.isArray(post?.likes) ? post.likes.length : (post?.likesCount ?? post?.likes ?? 0)
  );

  const handleLike = async () => {
    if (!postId) return;

    const previousLiked = liked;
    const previousLikes = likes;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setLikes(nextLiked ? previousLikes + 1 : Math.max(0, previousLikes - 1));

    try {
      const data = await likePost(postId);
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

  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img
            className="w-10 h-10 rounded-full object-cover border border-surface-variant cursor-pointer"
            alt={`close up profile photo of ${user?.username}`}
            src={user?.avatar}
          />
          <div>
            <h3 className="font-label-md text-on-surface leading-tight cursor-pointer hover:underline">
              {user?.username}
            </h3>
            <p className="font-body-sm text-on-surface-variant text-[12px]">
              {user?.location ? `${user.location} • ` : ''}{timestamp}
            </p>
          </div>
        </div>
        <button className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full transition-colors">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {/* Media */}
      <div className="w-full aspect-[4/5] bg-surface-variant relative">
        <img
          className="w-full h-full object-cover"
          alt="post content"
          src={image}
        />
      </div>

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
            <button className="text-on-surface hover:text-on-surface-variant transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined">chat_bubble</span>
            </button>
            <button className="text-on-surface hover:text-on-surface-variant transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <button className="text-on-surface hover:text-on-surface-variant transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">bookmark</span>
          </button>
        </div>

        <div className="font-label-md text-on-surface text-[13px]">
          {(likes ?? 0).toLocaleString()} {likes === 1 ? 'like' : 'likes'}
        </div>

        <div className="font-body-sm text-on-surface">
          <span className="font-label-md mr-1">{user?.username}</span>
          {caption}
        </div>

        {comments > 0 && (
          <button className="text-on-surface-variant font-body-sm text-[13px] text-left hover:underline w-max">
            View all {comments} comments
          </button>
        )}
      </div>
    </article>
  );
}
