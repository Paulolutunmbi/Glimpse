import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import PostCard from '../components/PostCard';
import Suggestions from '../components/Suggestions';
import { useUser } from '../context/UserContext.jsx';
import { postService, userService } from '../services/apiService';
import { socket } from '../socket';

const defaultTopics = [
  { name: 'All' },
  { name: 'MinimalistDesign' },
  { name: 'CoffeeCulture' },
  { name: 'UrbanPhotography' },
  { name: 'SlowLiving' },
  { name: 'Architecture' },
  { name: 'PlantLife' },
];

export default function Home() {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState(defaultTopics);
  const [suggestions, setSuggestions] = useState([]);
  const [activeTopic, setActiveTopic] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUserId = user?.id || user?._id || null;

  const normalizePost = useMemo(
    () => (post) => {
      const likes = Array.isArray(post?.likes) ? post.likes : [];
      return {
        ...post,
        id: post._id || post.id,
        _id: post._id || post.id,
        media: post.media?.length
          ? post.media
          : post.image
            ? [{ url: post.image, alt: post.title || post.caption }]
            : [],
        likes,
        likesCount: likes.length || post.likesCount || 0,
        isLiked: currentUserId ? likes.includes(String(currentUserId)) : false,
        timestamp: formatTimestamp(post.createdAt),
      };
    },
    [currentUserId]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    postService
      .getAllPosts({
        tag: activeTopic === 'All' ? undefined : activeTopic,
        search: search || undefined,
      })
      .then((data) => {
        if (cancelled) return;
        setPosts(Array.isArray(data) ? data.map(normalizePost) : []);
      })
      .catch(() => {
        if (!cancelled) setError('Could not connect to the server. Start the backend and try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTopic, search, normalizePost]);

  useEffect(() => {
    postService
      .getTopics()
      .then((data) => {
        if (Array.isArray(data) && data.length) setTopics(data);
      })
      .catch(() => setTopics(defaultTopics));

    userService
      .getSuggestedCreators()
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => setSuggestions([]));
  }, []);

  useEffect(() => {
    const handlePostCreated = (payload) => {
      const newPost = payload?.post || payload;
      if (!newPost) return;
      setPosts((prev) => {
        const exists = prev.some((item) => item._id === newPost._id || item.id === newPost._id);
        if (exists) return prev;
        return [normalizePost(newPost), ...prev];
      });
    };

    const handlePostLiked = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setPosts((prev) =>
        prev.map((item) => {
          if (item._id !== postId && item.id !== postId) return item;
          const likes = Array.isArray(payload?.likes) ? payload.likes : item.likes || [];
          return {
            ...item,
            likes,
            likesCount:
              typeof payload?.likesCount === 'number' ? payload.likesCount : likes.length || item.likesCount,
            isLiked: currentUserId ? likes.includes(String(currentUserId)) : item.isLiked,
          };
        })
      );
    };

    const handlePostDeleted = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setPosts((prev) => prev.filter((item) => item._id !== postId && item.id !== postId));
    };

    socket.on('postCreated', handlePostCreated);
    socket.on('postLiked', handlePostLiked);
    socket.on('postDeleted', handlePostDeleted);

    return () => {
      socket.off('postCreated', handlePostCreated);
      socket.off('postLiked', handlePostLiked);
      socket.off('postDeleted', handlePostDeleted);
    };
  }, [currentUserId, normalizePost]);

  return (
    <div className="min-h-screen bg-background text-on-background antialiased selection:bg-primary-container selection:text-white">
      <Navbar currentUser={user} search={search} onSearchChange={setSearch} />
      <Sidebar />

      <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 md:px-8 lg:ml-64 lg:max-w-none lg:pb-8">
        <label className="relative mb-6 block md:hidden">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            className="w-full rounded-full border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 text-body-md text-on-surface shadow-sm outline-none focus:border-primary-container"
            placeholder="Search moments..."
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <section className="mb-6 md:mb-10">
          <h1 className="mb-2 font-h1 text-h1 text-on-surface md:hidden">Discover Moments</h1>
          <h1 className="mb-2 hidden font-display text-display text-on-surface md:block lg:hidden">
            Discover Moments
          </h1>
          <h1 className="mb-6 hidden font-h2 text-h2 text-on-surface lg:block">Trending Topics</h1>
          <p className="mb-4 hidden text-body-lg text-secondary md:block lg:hidden font-body-lg">
            Explore curated flashes of life, art, and quiet beauty.
          </p>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 pt-2 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
            {topics.map((topic) => {
              const label = topic.name || topic;
              const active = activeTopic === label;
              return (
                <button
                  key={label}
                  onClick={() => setActiveTopic(label)}
                  className={`press-in whitespace-nowrap rounded-full px-4 py-2 transition-colors md:px-6 ${
                    active
                      ? 'bg-secondary-container text-on-secondary-container md:bg-primary-container md:text-white'
                      : 'border border-outline-variant bg-surface text-on-surface hover:bg-secondary-container hover:border-transparent'
                  } font-label-sm`}
                >
                  {label === 'All' ? (
                    <>
                      <span className="md:hidden">All</span>
                      <span className="hidden md:inline">#All</span>
                    </>
                  ) : (
                    `#${label}`
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-lg xl:flex-row">
          <section className="flex-1">
            {loading && <LoadingGrid />}
            {error && !loading && (
              <div className="rounded-[16px] border border-error-container bg-error-container/50 p-6 text-center text-error">
                {error}
              </div>
            )}
            {!loading && !error && posts.length === 0 && (
              <div className="rounded-[16px] bg-surface-container-lowest p-8 text-center text-secondary ambient-card">
                No moments found.
              </div>
            )}
            {!loading && !error && posts.length > 0 && (
              <div className="masonry-feed">
                {posts.map((post) => (
                  <PostCard key={post._id || post.id} post={post} currentUser={user} />
                ))}
              </div>
            )}
          </section>

          <Suggestions suggestions={suggestions} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="ambient-card overflow-hidden rounded-[16px] bg-surface animate-pulse">
          <div className="aspect-[4/5] bg-surface-variant" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-surface-variant" />
            <div className="h-3 w-1/2 rounded bg-surface-variant" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTimestamp(isoString) {
  if (!isoString) return '';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
