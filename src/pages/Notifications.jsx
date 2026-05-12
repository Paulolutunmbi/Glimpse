import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { notificationService } from '../services/apiService';
import { useUser } from '../context/UserContext.jsx';
import { socket } from '../socket';

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

export default function Notifications() {
  const { user, refreshCounts } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const loadNotifications = useCallback(
    async ({ nextCursor = null, replace = false } = {}) => {
      if (!hasMore && nextCursor) return;
      if (nextCursor) setIsFetchingMore(true);

      try {
        const response = await notificationService.getNotifications({ cursor: nextCursor, limit: 20 });
        const incoming = Array.isArray(response?.data) ? response.data : [];
        setNotifications((prev) => (replace ? incoming : [...prev, ...incoming]));
        setCursor(response?.nextCursor || null);
        setHasMore(Boolean(response?.hasMore));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    },
    [hasMore]
  );

  useEffect(() => {
    setLoading(true);
    loadNotifications({ replace: true });
  }, [loadNotifications]);

  useEffect(() => {
    const handleNotificationCreated = (payload) => {
      const notification = payload?.notification || payload;
      if (!notification) return;
      setNotifications((prev) => {
        const exists = prev.some((item) => item._id === notification._id);
        if (exists) return prev;
        return [notification, ...prev];
      });
    };

    socket.on('notification:created', handleNotificationCreated);
    return () => socket.off('notification:created', handleNotificationCreated);
  }, []);

  const markRead = async (notificationId) => {
    try {
      await notificationService.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item))
      );
      refreshCounts();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      refreshCounts();
    } catch (err) {
      console.error(err);
    }
  };

  const emptyState = useMemo(
    () => !loading && notifications.length === 0,
    [loading, notifications.length]
  );

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <Navbar currentUser={user} />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-on-surface">Notifications</h1>
            <p className="text-sm text-on-surface-variant">Realtime updates from your activity.</p>
          </div>
          <button
            className="rounded-full border border-outline-variant px-4 py-2 text-xs font-semibold"
            type="button"
            onClick={markAllRead}
          >
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 text-sm">
            Loading notifications...
          </div>
        ) : null}

        {emptyState ? (
          <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
            You are all caught up.
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const actor = notification.actorSnapshot || {};
            return (
              <div
                key={notification._id}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
                  notification.isRead
                    ? 'border-outline-variant/30 bg-surface-container-lowest'
                    : 'border-primary-container/40 bg-white shadow-sm'
                }`}
              >
                <img
                  src={actor.avatar || '/images/glimpse-icon.png'}
                  alt={actor.username || 'User'}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm text-on-surface">
                    <span className="font-semibold">{actor.username || 'Someone'}</span>{' '}
                    {notification.preview || `sent you a ${notification.type}`}
                  </p>
                  <p className="text-xs text-on-surface-variant">{formatTime(notification.createdAt)}</p>
                </div>
                {!notification.isRead ? (
                  <button
                    className="rounded-full border border-outline-variant px-3 py-1 text-xs"
                    type="button"
                    onClick={() => markRead(notification._id)}
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {hasMore ? (
          <button
            className="mx-auto mt-4 rounded-full border border-outline-variant px-4 py-2 text-xs"
            type="button"
            onClick={() => loadNotifications({ nextCursor: cursor })}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? 'Loading...' : 'Load more'}
          </button>
        ) : null}
      </main>
    </div>
  );
}
