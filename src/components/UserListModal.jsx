import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { userService } from '../services/apiService';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';

export default function UserListModal({ userId, type, onClose, onFollowAction }) {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        let response;
        if (type === 'followers') {
          response = await userService.getFollowers(userId);
        } else {
          response = await userService.getFollowing(userId);
        }
        if (response?.success) {
          setUsers(response.data || []);
        } else {
          setError('Failed to fetch list.');
        }
      } catch (err) {
        console.error('Failed to load user list:', err);
        setError(err.response?.data?.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (userId && type) {
      fetchUsers();
    }
  }, [userId, type]);

  // Lock background body scroll and bind escape key
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handleFollowToggle = async (targetUser) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const targetId = targetUser.id || targetUser._id;
    setActionLoadingId(targetId);
    try {
      const currentlyFollowing = targetUser.isFollowing;
      if (currentlyFollowing) {
        await userService.unfollowUser(targetId);
      } else {
        await userService.followUser(targetId);
      }
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          const uId = u.id || u._id;
          if (String(uId) === String(targetId)) {
            return { ...u, isFollowing: !currentlyFollowing };
          }
          return u;
        })
      );

      // Trigger context refresh so current user stats are updated in real time
      await refreshUser();

      // Trigger callback to notify parent profile component if needed
      if (onFollowAction) {
        onFollowAction(targetId, !currentlyFollowing);
      }
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUserClick = (targetUsername) => {
    onClose();
    if (currentUser && String(currentUser.username) === String(targetUsername)) {
      navigate('/profile');
    } else {
      navigate(`/u/${targetUsername}`);
    }
  };

  const title = type === 'followers' ? 'Followers' : 'Following';

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[min(85dvh,500px)] max-h-[85dvh] w-full max-w-[min(100vw,440px)] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:h-auto sm:max-h-[70dvh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3 sm:px-5">
          <div className="w-10"></div> {/* Spacer for symmetry */}
          <h2 className="text-base font-bold text-on-surface sm:text-lg text-center flex-1">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        {/* Content body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-zinc-500">
              <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></span>
              Loading...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-red-500">{error}</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((userItem) => {
                const isSelf = currentUser && String(currentUser.id || currentUser._id) === String(userItem.id || userItem._id);
                return (
                  <div key={userItem.id || userItem._id} className="flex items-center justify-between py-1">
                    {/* User info */}
                    <div
                      className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer"
                      onClick={() => handleUserClick(userItem.username)}
                    >
                      <Avatar
                        src={userItem.avatar}
                        name={userItem.fullName || userItem.username}
                        className="w-10 h-10 border border-zinc-100 dark:border-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate text-sm font-semibold text-on-surface hover:underline">
                            {userItem.username}
                          </span>
                          <VerifiedBadge verified={userItem.verified} size={13} />
                        </div>
                        <p className="truncate text-xs text-zinc-500">
                          {userItem.fullName || userItem.username}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isSelf && currentUser && (
                      <button
                        type="button"
                        disabled={actionLoadingId === (userItem.id || userItem._id)}
                        onClick={() => handleFollowToggle(userItem)}
                        className={`ml-3 flex-shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                          userItem.isFollowing
                            ? 'border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                            : 'bg-primary text-white hover:bg-primary/95'
                        }`}
                      >
                        {actionLoadingId === (userItem.id || userItem._id) ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        ) : userItem.isFollowing ? (
                          'Following'
                        ) : (
                          'Follow'
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
