import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API, { onAuthLogout, onAdminAccessAttempt } from '../api/axios';
import { messageService, notificationService } from '../services/apiService';
import { setSocketAuth, socket } from '../socket';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [relations, setRelations] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const response = await API.get('/api/user/me');
      const payload = response?.data?.data || null;
      const nextUser = payload?.user || response?.data?.user || null;
      setUser(nextUser);
      setProfile(payload?.profile || null);
      setStats(payload?.stats || null);
      setRelations(payload?.relations || null);
      setPosts(payload?.posts || []);
      setSavedPosts(payload?.savedPosts || []);
      return nextUser;
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
        setProfile(null);
        setStats(null);
        setRelations(null);
        setPosts([]);
        setSavedPosts([]);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCounts = useCallback(async () => {
    if (!user?.id && !user?._id) return;
    try {
      const notifications = await notificationService.getNotifications({ limit: 1 });
      setNotificationCount(Number(notifications?.unreadCount) || 0);
    } catch {
      setNotificationCount(0);
    }

    try {
      const conversations = await messageService.getConversations();
      const list = Array.isArray(conversations?.data) ? conversations.data : [];
      const totalUnread = list.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
      setMessageCount(totalUnread);
    } catch {
      setMessageCount(0);
    }
  }, [user]);

  useEffect(() => {
    setSocketAuth(localStorage.getItem('token'));
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return;
    socket.emit('joinUser', userId);
    refreshCounts();

    const handleNotificationCreated = () => {
      setNotificationCount((prev) => prev + 1);
    };

    const handleConversationUpdated = () => {
      refreshCounts();
    };

    const handleFollowUpdated = (payload) => {
      if (!payload?.userId) return;
      if (String(payload.userId) === String(userId)) {
        refreshUser();
      }
    };

    const handlePostUpdated = (payload) => {
      const incoming = payload?.post || payload;
      const postId = incoming?._id || incoming?.id;
      if (!postId) return;
      setPosts((prev) =>
        prev.map((item) =>
          String(item._id || item.id) === String(postId)
            ? { ...item, ...incoming }
            : item
        )
      );
      setSavedPosts((prev) =>
        prev.map((item) =>
          String(item._id || item.id) === String(postId)
            ? { ...item, ...incoming }
            : item
        )
      );
    };

    const handlePostDeleted = (payload) => {
      const postId = payload?.postId || payload?.id;
      if (!postId) return;
      setPosts((prev) => prev.filter((item) => String(item._id || item.id) !== String(postId)));
      setSavedPosts((prev) => prev.filter((item) => String(item._id || item.id) !== String(postId)));
    };

    const handlePostCreated = (payload) => {
      const incoming = payload?.post || payload;
      if (!incoming) return;
      if (String(incoming.author) !== String(userId)) return;
      setPosts((prev) => {
        const postId = String(incoming._id || incoming.id);
        if (prev.some((item) => String(item._id || item.id) === postId)) return prev;
        return [incoming, ...prev];
      });
    };

    socket.on('notification:created', handleNotificationCreated);
    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('followUpdated', handleFollowUpdated);
    socket.on('post:updated', handlePostUpdated);
    socket.on('postDeleted', handlePostDeleted);
    socket.on('post:deleted', handlePostDeleted);
    socket.on('post:created', handlePostCreated);

    return () => {
      socket.emit('leaveUser', userId);
      socket.off('notification:created', handleNotificationCreated);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('followUpdated', handleFollowUpdated);
      socket.off('post:updated', handlePostUpdated);
      socket.off('postDeleted', handlePostDeleted);
      socket.off('post:deleted', handlePostDeleted);
      socket.off('post:created', handlePostCreated);
    };
  }, [user?.id, user?._id, refreshCounts, refreshUser]);

  useEffect(() => {
    const unsubscribeAuthLogout = onAuthLogout(() => {
      setUser(null);
      setProfile(null);
      setStats(null);
      setRelations(null);
      setPosts([]);
      setSavedPosts([]);
      setIsLoading(false);
    });

    const unsubscribeAdminAccess = onAdminAccessAttempt(({ attemptsRemaining }) => {
      if (typeof attemptsRemaining === 'number') {
        sessionStorage.setItem(
          'accessAlert',
          JSON.stringify({
            message: 'Unauthorized access detected.',
            attemptsRemaining,
          })
        );
      }
    });

    return () => {
      unsubscribeAuthLogout();
      unsubscribeAdminAccess();
    };
  }, []);

  const setAuthToken = useCallback((token) => {
    if (!token) {
      localStorage.removeItem('token');
      setSocketAuth(null);
      setUser(null);
      setProfile(null);
      setStats(null);
      setRelations(null);
      setPosts([]);
      setSavedPosts([]);
      return;
    }

    localStorage.setItem('token', token);
    setSocketAuth(token);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const updateProfilePayload = useCallback((payload) => {
    if (!payload) return;
    if (payload.user) setUser(payload.user);
    if (payload.profile) setProfile(payload.profile);
    if (payload.stats) setStats(payload.stats);
    if (payload.relations) setRelations(payload.relations);
    if (Array.isArray(payload.posts)) setPosts(payload.posts);
    if (Array.isArray(payload.savedPosts)) setSavedPosts(payload.savedPosts);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setSocketAuth(null);
    setUser(null);
    setProfile(null);
    setStats(null);
    setRelations(null);
    setPosts([]);
    setSavedPosts([]);
    setIsLoading(false);
    setNotificationCount(0);
    setMessageCount(0);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      stats,
      relations,
      posts,
      savedPosts,
      isLoading,
      notificationCount,
      messageCount,
      refreshUser,
      refreshCounts,
      setAuthToken,
      updateUser,
      updateProfilePayload,
      logout,
    }),
    [
      user,
      profile,
      stats,
      relations,
      posts,
      savedPosts,
      isLoading,
      notificationCount,
      messageCount,
      refreshUser,
      refreshCounts,
      setAuthToken,
      updateUser,
      updateProfilePayload,
      logout,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
