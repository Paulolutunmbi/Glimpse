import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import Avatar from '../components/Avatar';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, stats, relations, posts, savedPosts } = useUser();
  const [activeTab, setActiveTab] = useState('posts');

  const gridItems = useMemo(() => (activeTab === 'saved' ? savedPosts : posts), [
    activeTab,
    posts,
    savedPosts,
  ]);

  const avatar = profile?.avatar || user?.profilePicture || user?.avatar || '';
  const displayName = user?.fullName || user?.name || user?.username || '';
  const handle = user?.username || user?.name || '';
  const bio = profile?.bio || user?.bio || '';
  const postsCount = stats?.postsCount ?? posts.length;
  const followersCount = stats?.followersCount ?? relations?.followers?.length ?? 0;
  const followingCount = stats?.followingCount ?? relations?.following?.length ?? 0;

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased pt-16 pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 font-['Plus_Jakarta_Sans'] text-[#FF5A5F]">
          <img
            src="/images/glimpse-logo-light-dark.png"
            alt="Glimpse"
            className="h-8 w-auto object-contain"
          />
          <button
            className="rounded-full p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-50"
            type="button"
            aria-label="Open settings"
            onClick={() => navigate('/settings')}
          >
            <span className="material-symbols-outlined text-[#FF5A5F]">settings</span>
          </button>
        </div>
      </header>

      <main className="mx-auto mt-xl max-w-[1200px] px-margin_mobile md:px-margin_desktop">
        <section className="mb-xxl flex w-full flex-col items-center text-center">
          <div className="mb-md">
            <Avatar
              alt="Profile portrait"
              className="border-4 border-surface-container-lowest shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)]"
              name={displayName || handle || 'Glimpse'}
              sizeClassName="h-32 w-32"
              src={avatar}
              textClassName="text-[20px]"
            />
          </div>
          {displayName ? (
            <h1 className="mb-xs font-h1 text-h1 text-on-surface">{displayName}</h1>
          ) : null}
          {handle ? (
            <p className="mb-md font-body-md text-body-md text-on-surface-variant">
              @{handle}
            </p>
          ) : null}
          {bio ? (
            <p className="mb-lg max-w-[420px] font-body-md text-body-md text-on-surface md:max-w-md">
              {bio}
            </p>
          ) : (
            <p className="mb-lg max-w-[420px] font-body-md text-body-md text-on-surface-variant md:max-w-md">
              No bio yet.
            </p>
          )}
          <div className="mb-xl flex flex-wrap justify-center gap-md">
            <button
              className="rounded-lg border-b-2 border-primary/20 bg-primary-container px-lg py-sm font-label-md text-label-md text-on-primary shadow-sm transition-all active:scale-95"
              type="button"
              onClick={() => navigate('/settings')}
            >
              Edit Profile
            </button>
            <button
              className="rounded-lg border border-outline-variant bg-surface px-lg py-sm font-label-md text-label-md text-on-surface transition-all active:scale-95"
              type="button"
            >
              Share Profile
            </button>
          </div>

          <div className="flex w-full max-w-lg justify-center gap-xxl border-t border-outline-variant/30 pt-lg">
            <div className="flex flex-col items-center">
              <span className="font-h3 text-h3 text-on-surface">{postsCount}</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Moments
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-h3 text-h3 text-on-surface">{followersCount}</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Followers
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-h3 text-h3 text-on-surface">{followingCount}</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Following
              </span>
            </div>
          </div>
        </section>

        <div className="mb-xl flex justify-center gap-xl border-b border-outline-variant/30">
          <button
            className={`flex items-center gap-xs border-b-2 pb-sm font-label-md text-label-md ${
              activeTab === 'posts'
                ? 'border-primary-container text-on-surface'
                : 'border-transparent text-on-surface-variant'
            }`}
            type="button"
            onClick={() => setActiveTab('posts')}
          >
            <span className="material-symbols-outlined text-[20px]">grid_on</span>
            Moments
          </button>
          <button
            className={`flex items-center gap-xs border-b-2 pb-sm font-label-md text-label-md transition-colors hover:text-on-surface ${
              activeTab === 'saved'
                ? 'border-primary-container text-on-surface'
                : 'border-transparent text-on-surface-variant'
            }`}
            type="button"
            onClick={() => setActiveTab('saved')}
          >
            <span className="material-symbols-outlined text-[20px]">bookmark_border</span>
            Saved
          </button>
        </div>

        <div className="grid grid-cols-3 gap-[2px] md:gap-md">
          {gridItems.length ? (
            gridItems.map((item) => (
              <div
                key={item._id || item.id || item.image}
                className="group relative aspect-square overflow-hidden bg-surface-container shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)] md:rounded-[16px]"
              >
                <img
                  alt={item.caption || 'Glimpse moment'}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={item.image}
                />
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
              No moments yet. Share your first glimpse.
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-zinc-100 bg-white py-3 pb-safe font-['Plus_Jakarta_Sans'] text-[11px] font-medium shadow-[0_-10px_20px_-4px_rgba(0,0,0,0.04)] md:hidden">
        <button
          className="flex flex-col items-center justify-center text-zinc-400 transition-all duration-150 ease-out active:scale-90"
          type="button"
        >
          <span className="material-symbols-outlined mb-1">grid_view</span>
          Feed
        </button>
        <button
          className="flex flex-col items-center justify-center text-zinc-400 transition-all duration-150 ease-out active:scale-90"
          type="button"
        >
          <span className="material-symbols-outlined mb-1">search</span>
          Explore
        </button>
        <button
          className="flex flex-col items-center justify-center text-zinc-400 transition-all duration-150 ease-out active:scale-90"
          type="button"
        >
          <span className="material-symbols-outlined mb-1">add_circle</span>
          Capture
        </button>
        <button
          className="flex flex-col items-center justify-center rounded-xl bg-[#FF5A5F]/5 px-3 py-1 text-[#FF5A5F] transition-all duration-150 ease-out active:scale-90"
          type="button"
        >
          <span
            className="material-symbols-outlined mb-1"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person
          </span>
          Profile
        </button>
      </nav>
    </div>
  );
};

export default Profile;
