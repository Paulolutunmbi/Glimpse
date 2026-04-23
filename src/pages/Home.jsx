import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import PostCard from '../components/PostCard';
import Suggestions from '../components/Suggestions';
import StoryRow from '../components/StoryRow';

import { getPosts } from '../api/posts';
import { mockStories, mockCurrentUser, mockSuggestions } from '../data/posts';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPosts()
      .then((data) => {
        const normalised = data.map((p) => ({
          ...p,
          id: p._id,
          _id: p._id,
          isLiked: Array.isArray(p.likes) ? p.likes.includes('guest') : false,
          likesCount: Array.isArray(p.likes) ? p.likes.length : p.likes ?? 0,
          timestamp: formatTimestamp(p.createdAt),
        }));
        setPosts(normalised);
      })
      .catch((err) => {
        console.error('Failed to load posts:', err);
        setError('Could not connect to the server. Is the backend running?');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex antialiased">
      {/* SideNavBar (Desktop) */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col relative w-full">
        {/* TopAppBar */}
        <Navbar currentUser={mockCurrentUser} />

        {/* Feed & Right Panel Container */}
        <div className="flex-1 flex justify-center w-full max-w-container_max_width mx-auto px-4 md:px-margin_desktop py-lg gap-xl">

          {/* Central Feed */}
          <div className="flex-1 max-w-[600px] w-full flex flex-col gap-lg pb-32 lg:pb-8">
            {/* Story/Status Row */}
            <StoryRow stories={mockStories} />

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
                <PostCard key={post._id} post={post} />
              ))}
          </div>

          {/* Right Panel (Suggestions) */}
          <Suggestions currentUser={mockCurrentUser} suggestions={mockSuggestions} />
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
