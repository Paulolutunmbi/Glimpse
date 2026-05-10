import { useMemo, useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import PostCard from '../components/PostCard';
import Suggestions from '../components/Suggestions';
import StoryRow from '../components/StoryRow';
import { useUser } from '../context/UserContext.jsx';
import { postService } from '../services/apiService';
import { socket } from '../socket';
import { mockStories, mockSuggestions } from '../data/posts';

export default function Home() {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUserId = user?.id || user?._id || null;

  const normalizePost = (post, userId) => {
    const likes = Array.isArray(post?.likes) ? post.likes : [];
    return {
      ...post,
      id: post._id || post.id,
      _id: post._id || post.id,
      likes,
      likesCount: likes.length || post.likesCount || post.likes || 0,
      isLiked: userId ? likes.includes(userId) : false,
      timestamp: formatTimestamp(post.createdAt),
    };
  };

  const stories = useMemo(() => {
    const avatarSrc = user?.profilePicture || user?.avatar || '/images/glimpse-icon.png';
    const youStory = {
      id: 'you',
      username: 'You',
      avatar: avatarSrc,
      isYou: true,
      hasStory: false,
    };

    return [youStory, ...mockStories.filter((story) => story.id !== 'you')];
  }, [user]);

  useEffect(() => {
    postService
      .getAllPosts()
      .then((data) => {
        const normalised = Array.isArray(data)
          ? data.map((p) => normalizePost(p, currentUserId))
          : [];
        setPosts(normalised);
      })
      .catch((err) => {
        console.error('Failed to load posts:', err);
        setError('Could not connect to the server. Is the backend running?');
      })
      .finally(() => setLoading(false));
  }, [currentUserId]);

  useEffect(() => {
    const handlePostCreated = (payload) => {
      const newPost = payload?.post || payload;
      if (!newPost) return;
      setPosts((prev) => {
        const exists = prev.some((item) => item._id === newPost._id || item.id === newPost._id);
        if (exists) return prev;
        return [normalizePost(newPost, currentUserId), ...prev];
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
              typeof payload?.likesCount === 'number'
                ? payload.likesCount
                : likes.length || item.likesCount,
            isLiked: currentUserId ? likes.includes(currentUserId) : item.isLiked,
          };
        })
      );
    };

    const handlePostDeleted = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setPosts((prev) => prev.filter((item) => item._id !== postId && item.id !== postId));
    };

    socket.on('post:created', handlePostCreated);
    socket.on('postCreated', handlePostCreated);
    socket.on('post:liked', handlePostLiked);
    socket.on('postLiked', handlePostLiked);
    socket.on('postDeleted', handlePostDeleted);

    return () => {
      socket.off('post:created', handlePostCreated);
      socket.off('postCreated', handlePostCreated);
      socket.off('post:liked', handlePostLiked);
      socket.off('postLiked', handlePostLiked);
      socket.off('postDeleted', handlePostDeleted);
    };
  }, [currentUserId]);

  return (
    <div className="bg-background text-on-background font-body-md w-full min-h-screen flex antialiased">
      {/* SideNavBar (Desktop) */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col relative w-full">
        {/* TopAppBar */}
        <Navbar currentUser={user} />

        {/* Feed & Right Panel Container */}
        <div className="flex-1 flex w-full min-h-screen px-4 md:px-6 lg:px-8 py-lg gap-xl">

          {/* Central Feed */}
          <div className="flex-1 w-full flex flex-col gap-lg pb-32 lg:pb-8">
            {/* Story/Status Row */}
            <StoryRow stories={stories} />

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col gap-lg">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-container-lowest rounded-xl shadow animate-pulse"
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 rounded-full bg-surface-variant" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-surface-variant rounded w-1/3" />
                        <div className="h-2 bg-surface-variant rounded w-1/4" />
                      </div>
                    </div>
                    <div className="w-full aspect-[4/5] bg-surface-variant" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-surface-variant rounded w-1/4" />
                      <div className="h-3 bg-surface-variant rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center text-red-600">
                <p className="font-semibold">⚠️ {error}</p>
                <p className="text-sm mt-1 text-red-400">
                  Start the backend with <code className="font-mono bg-red-100 px-1 rounded">npm run dev</code> inside /Backend
                </p>
              </div>
            )}

            {/* Feed Cards */}
            {!loading &&
              !error &&
              posts.map((post) => (
                <PostCard key={post._id} post={post} currentUser={user} />
              ))}
          </div>

          {/* Right Panel (Suggestions) */}
          <Suggestions currentUser={user} suggestions={mockSuggestions} />
        </div>
      </main>

      {/* BottomNavBar (Mobile) */}
      <BottomNav />
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
