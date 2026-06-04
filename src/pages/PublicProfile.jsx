import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';
import UserListModal from '../components/UserListModal';
import { userService } from '../services/apiService';
import { shareToClipboard } from '../utils/share';

const PublicProfile = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await userService.getPublicProfileByUsername(username);
        if (response.success) {
          setProfile(response.data);
          setStats(response.data.stats);
          setPosts(response.data.posts || []);
          setIsFollowing(
            response.data.relations?.followers?.includes(currentUser?.id)
          );
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadProfile();
    }
  }, [username, currentUser?.id]);

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      if (isFollowing) {
        await userService.unfollowUser(profile.user.id);
        setIsFollowing(false);
      } else {
        await userService.followUser(profile.user.id);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    }
  };

  const handleShareProfile = async () => {
    if (!username || isSharing) return;
    setIsSharing(true);
    try {
      await shareToClipboard({ type: 'profile', id: username });
      setShareMessage('Profile link copied!');
      setTimeout(() => setShareMessage(''), 2000);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      setShareMessage('Failed to copy link');
      setTimeout(() => setShareMessage(''), 2000);
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body-md antialiased pt-16 pb-20 md:pb-0 flex items-center justify-center">
        <div>Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body-md antialiased pt-16 pb-20 md:pb-0">
        <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)] backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <button
              onClick={() => navigate('/')}
              className="text-zinc-500 transition-colors duration-200 hover:text-zinc-900"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-lg font-semibold">Profile Not Found</h1>
            <div />
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-6 py-12">
          <p className="text-center text-zinc-500">
            {error || 'The profile you are looking for does not exist or is private.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-center font-semibold text-white transition-colors duration-200 hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const avatar = profile.profile?.avatar || profile.user?.avatar || '';
  const coverImage = profile.profile?.coverImage || '';
  const bio = profile.profile?.bio || '';
  const displayName = profile.user?.fullName || profile.user?.name || profile.user?.username || '';
  const handle = profile.user?.username || '@user';
  const postsCount = stats?.postsCount ?? posts.length;
  const followersCount = stats?.followersCount ?? profile.relations?.followers?.length ?? 0;
  const followingCount = stats?.followingCount ?? profile.relations?.following?.length ?? 0;

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased pt-16 pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <button
            onClick={() => navigate('/')}
            className="rounded-full p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-50"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="inline-flex items-center justify-center gap-1 font-semibold">
              <span>{displayName}</span>
              <VerifiedBadge verified={profile.user?.verified} size={13} />
            </h1>
            <p className="flex items-center justify-center gap-1 text-sm text-zinc-500">
              <span>@{handle}</span>
              <VerifiedBadge verified={profile.user?.verified} size={11} />
            </p>
          </div>
          <button
            onClick={handleShareProfile}
            disabled={isSharing}
            className="rounded-full p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-50"
            title="Share profile"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
        {shareMessage && (
          <div className="px-6 py-2 text-sm text-green-600">{shareMessage}</div>
        )}
      </header>

      <main className="mx-auto max-w-2xl">
        {/* Cover Image */}
        {coverImage && (
          <div className="relative h-48 overflow-hidden bg-zinc-200">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Profile Section */}
        <div className="border-b border-zinc-100 px-6 pb-6">
          {/* Avatar */}
          <div className="mb-4 -mt-12 flex items-end justify-between">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-zinc-200">
              {avatar ? (
                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <Avatar name={displayName} />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {currentUser && String(currentUser.id) !== String(profile.user.id) && (
                <button
                  onClick={handleFollow}
                  className={`rounded-full px-6 py-2 font-semibold transition-colors duration-200 ${
                    isFollowing
                      ? 'border border-primary text-primary hover:bg-red-50'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              <button
                onClick={handleShareProfile}
                disabled={isSharing}
                className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-50"
                title="Copy profile link"
              >
                <span className="material-symbols-outlined text-xl">link</span>
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-4">
            <h1 className="inline-flex items-center gap-1 text-xl font-bold">
              <span>{displayName}</span>
              <VerifiedBadge verified={profile.user?.verified} size={15} />
            </h1>
            <p className="flex items-center gap-1 text-sm text-zinc-500">
              <span>@{handle}</span>
              <VerifiedBadge verified={profile.user?.verified} size={11} />
            </p>
          </div>

          {bio && <p className="mb-4 text-sm text-on-background/80">{bio}</p>}

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div className="hover:underline cursor-pointer">
              <span className="font-semibold">{postsCount}</span>
              <span className="text-zinc-500 ml-1">Posts</span>
            </div>
            <div
              className="hover:underline cursor-pointer"
              onClick={() => setModalType('followers')}
            >
              <span className="font-semibold">{followersCount}</span>
              <span className="text-zinc-500 ml-1">Followers</span>
            </div>
            <div
              className="hover:underline cursor-pointer"
              onClick={() => setModalType('following')}
            >
              <span className="font-semibold">{followingCount}</span>
              <span className="text-zinc-500 ml-1">Following</span>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="divide-y divide-zinc-100">
          {posts.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-500">
              <p>No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post._id}
                className="border-b border-zinc-100 p-6 transition-colors duration-200 hover:bg-zinc-50 cursor-pointer"
                onClick={() => navigate(`/posts/${post._id}`)}
              >
                <div className="flex gap-4">
                  <img
                    src={post.user?.avatar || ''}
                    alt={post.user?.name}
                    className="h-10 w-10 rounded-full bg-zinc-200"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold">{post.user?.name}</h3>
                      <VerifiedBadge verified={post.user?.verified} size={12} />
                      <span className="text-zinc-500">@{post.user?.username}</span>
                    </div>
                    {post.caption && <p className="mt-2 text-sm">{post.caption}</p>}
                    {post.image && (
                      <img
                        src={post.image}
                        alt=""
                        className="mt-3 rounded-lg max-h-96 w-full object-cover"
                      />
                    )}
                    <div className="mt-3 flex gap-6 text-xs text-zinc-500">
                      <span>{post.comments || 0} Comments</span>
                      <span>{post.likes?.length || 0} Likes</span>
                      <span>{post.repostCount || 0} Reposts</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicProfile;
