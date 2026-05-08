import { useEffect, useMemo, useState } from 'react';
import { postService } from '../services/apiService';
import { socket } from '../socket';

const compactNumber = (value = 0) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function PostCard({ post, currentUser }) {
  const postId = useMemo(() => post?._id || post?.id, [post]);
  const currentUserId = currentUser?.id || currentUser?._id || null;
  const initialLikes = Array.isArray(post?.likes) ? post.likes.length : post?.likesCount || 0;
  const initialSaved = Array.isArray(post?.savedBy) && currentUserId
    ? post.savedBy.includes(currentUserId)
    : false;
  const [liked, setLiked] = useState(Boolean(post?.isLiked));
  const [likes, setLikes] = useState(initialLikes);
  const [saved, setSaved] = useState(initialSaved);

  useEffect(() => {
    if (!postId) return undefined;
    socket.emit('joinPost', postId);
    return () => socket.emit('leavePost', postId);
  }, [postId]);

  useEffect(() => {
    if (!postId) return undefined;

    const handlePostLiked = (payload) => {
      const targetId = payload?.postId || payload?.id;
      if (!targetId || targetId !== postId) return;
      const nextLikes = Array.isArray(payload?.likes) ? payload.likes : null;
      if (nextLikes) {
        setLikes(nextLikes.length);
        if (currentUserId) setLiked(nextLikes.includes(currentUserId));
      } else if (typeof payload?.likesCount === 'number') {
        setLikes(payload.likesCount);
      }
    };

    socket.on('postLiked', handlePostLiked);
    return () => socket.off('postLiked', handlePostLiked);
  }, [postId, currentUserId]);

  const handleLike = async () => {
    if (!postId) return;
    const previousLiked = liked;
    const previousLikes = likes;
    const nextLiked = !previousLiked;
    setLiked(nextLiked);
    setLikes(nextLiked ? previousLikes + 1 : Math.max(0, previousLikes - 1));

    try {
      const data = await postService.toggleLike(postId);
      if (Array.isArray(data?.likes)) setLikes(data.likes.length);
      if (typeof data?.isLiked === 'boolean') setLiked(data.isLiked);
    } catch {
      setLiked(previousLiked);
      setLikes(previousLikes);
    }
  };

  const handleSave = async () => {
    if (!postId) return;
    const previous = saved;
    setSaved(!previous);
    try {
      const data = await postService.toggleSave(postId);
      if (typeof data?.isSaved === 'boolean') setSaved(data.isSaved);
    } catch {
      setSaved(previous);
    }
  };

  if (post.type === 'text' || post.type === 'quote') {
    return (
      <TextMoment
        post={post}
        liked={liked}
        likes={likes}
        onLike={handleLike}
      />
    );
  }

  if (post.type === 'gallery') {
    return <GalleryMoment post={post} onSave={handleSave} saved={saved} />;
  }

  if (post.type === 'video') {
    return (
      <VideoMoment
        post={post}
        liked={liked}
        likes={likes}
        onLike={handleLike}
      />
    );
  }

  return (
    <ImageMoment
      post={post}
      liked={liked}
      likes={likes}
      saved={saved}
      onLike={handleLike}
      onSave={handleSave}
    />
  );
}

function ImageMoment({ post, liked, likes, saved, onLike, onSave }) {
  const image = post.media?.[0]?.url || post.image;

  return (
    <article className="masonry-item ambient-card overflow-hidden rounded-[16px] bg-surface transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <img alt={post.title || post.caption} className="h-full w-full object-cover" src={image} />
        <button
          onClick={onLike}
          className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 shadow-sm backdrop-blur-sm"
        >
          <span className={`material-symbols-outlined text-[16px] text-primary-container ${liked ? 'material-symbols-filled' : ''}`}>
            favorite
          </span>
          <span className="font-label-sm text-on-surface">{compactNumber(likes)}</span>
        </button>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="line-clamp-2 text-body-md text-on-surface font-body-md">{post.caption}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <img alt={post.user?.username} className="h-6 w-6 rounded-full object-cover" src={post.user?.avatar || '/images/glimpse-icon.png'} />
            <span className="truncate font-label-sm text-on-surface-variant">
              {post.user?.name || post.user?.username}
            </span>
          </div>
          <button className="text-on-surface-variant transition-colors hover:text-primary-container" onClick={onSave}>
            <span className={`material-symbols-outlined text-[20px] ${saved ? 'material-symbols-filled' : ''}`}>
              bookmark
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

function VideoMoment({ post, liked, likes, onLike }) {
  const image = post.media?.[0]?.url || post.image;

  return (
    <article className="masonry-item ambient-card overflow-hidden rounded-[16px] bg-surface-container-lowest transition-transform duration-300 hover:-translate-y-1">
      <div className="group relative aspect-square w-full cursor-pointer overflow-hidden">
        <img alt={post.title || post.caption} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={image} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-md">
            <span className="material-symbols-outlined material-symbols-filled text-[28px]">play_arrow</span>
          </div>
        </div>
        {post.duration && (
          <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm font-label-sm">
            {post.duration}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <img alt={post.user?.username} className="h-6 w-6 rounded-full object-cover" src={post.user?.avatar || '/images/glimpse-icon.png'} />
          <span className="font-label-sm text-on-surface">@{post.user?.username}</span>
        </div>
        <p className="mb-4 text-body-sm text-on-surface-variant font-body-sm">{post.caption}</p>
        <div className="flex items-center justify-between border-t border-surface-variant pt-3">
          <button className="press-in flex items-center gap-1 text-secondary transition-colors hover:text-primary-container" onClick={onLike}>
            <span className={`material-symbols-outlined text-[20px] ${liked ? 'material-symbols-filled text-primary-container' : ''}`}>favorite</span>
            <span className="font-label-sm">{compactNumber(likes)}</span>
          </button>
          <button className="press-in text-secondary transition-colors hover:text-primary-container">
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function TextMoment({ post, liked, likes, onLike }) {
  const isDarkQuote = post.type === 'quote';

  return (
    <article
      className={`masonry-item ambient-card rounded-[16px] p-6 transition-transform duration-300 hover:-translate-y-1 ${
        isDarkQuote ? 'bg-inverse-surface text-inverse-on-surface' : 'bg-secondary-container'
      }`}
    >
      {isDarkQuote ? (
        <>
          <span className="material-symbols-outlined material-symbols-filled mb-4 text-primary-fixed-dim">format_quote</span>
          <p className="text-h3 italic leading-relaxed text-inverse-on-surface font-h3">
            "{post.quote || post.caption}"
          </p>
          <div className="mt-6 flex items-center justify-between border-t border-outline/30 pt-4">
            <span className="font-label-sm text-outline-variant">{post.category || 'Design Philosophy'}</span>
            <button className="text-outline-variant transition-colors hover:text-primary-fixed" onClick={onLike}>
              <span className={`material-symbols-outlined text-[20px] ${liked ? 'material-symbols-filled' : ''}`}>favorite</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img alt={post.user?.username} className="h-8 w-8 rounded-full object-cover border border-white" src={post.user?.avatar || '/images/glimpse-icon.png'} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-label-md text-on-secondary-container leading-none">
                  {post.user?.name || post.user?.username}
                </span>
                <span className="text-[10px] text-on-secondary-container/70 font-label-sm">{post.timestamp}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-secondary-container/70">more_horiz</span>
          </div>
          <h3 className="mb-3 font-h3 text-on-secondary-container">{post.title}</h3>
          <p className="text-body-md text-on-secondary-container/90 font-body-md">{post.caption}</p>
          <div className="mt-5 flex items-center gap-4">
            <button className="press-in flex items-center gap-1 text-on-secondary-container/80 transition-colors hover:text-primary-container" onClick={onLike}>
              <span className={`material-symbols-outlined text-[20px] ${liked ? 'material-symbols-filled text-primary-container' : ''}`}>favorite</span>
              <span className="font-label-sm">{compactNumber(likes)}</span>
            </button>
            <button className="press-in flex items-center gap-1 text-on-secondary-container/80">
              <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              <span className="font-label-sm">{post.comments || 0}</span>
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function GalleryMoment({ post, saved, onSave }) {
  const images = post.media?.length ? post.media : [{ url: post.image, alt: post.caption }];

  return (
    <article className="masonry-item ambient-card overflow-hidden rounded-[16px] bg-surface transition-transform duration-300 hover:-translate-y-1">
      <div className="grid grid-cols-2 gap-1 p-1">
        {images.slice(0, 2).map((image, index) => (
          <img
            key={image.url}
            alt={image.alt || post.caption}
            className={`h-full w-full object-cover ${index === 0 ? 'rounded-tl-[12px]' : 'rounded-tr-[12px]'}`}
            src={image.url}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-body-md text-on-surface font-body-md">{post.caption}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {post.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded bg-surface-container-high px-2 py-1 text-[10px] text-on-surface-variant font-label-sm">
              #{tag}
            </span>
          ))}
          <button className="ml-auto text-on-surface-variant transition-colors hover:text-primary-container" onClick={onSave}>
            <span className={`material-symbols-outlined text-[18px] ${saved ? 'material-symbols-filled' : ''}`}>bookmark</span>
          </button>
        </div>
      </div>
    </article>
  );
}
