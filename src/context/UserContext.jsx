import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthLogout } from '../api/axios';
import { userService } from '../services/apiService';
import { socket } from '../socket';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const response = await userService.getMe();
      const nextUser = response?.data?.user || response?.user || null;
      setUser(nextUser);
      return nextUser;
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const refreshProfile = useCallback(async (userId) => {
    // Global user flow: MongoDB is the source of truth, this endpoint is the
    // single profile read model, and pages consume this shared context instead
    // of running their own profile fetches or trusting local drafts.
    if (!userId) {
      setProfile(null);
      setIsProfileLoading(false);
      return null;
    }

    setIsProfileLoading(true);
    try {
      const response = await userService.getProfileById(userId);
      const payload = response?.data || response?.profile || null;
      if (payload?.user) {
        setUser((prev) => ({ ...prev, ...payload.user }));
      }
      setProfile(payload);
      return payload;
    } catch {
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const updateProfileState = useCallback((payload) => {
    if (!payload) return;
    setProfile(payload);
    if (payload.user) {
      setUser((prev) => ({ ...prev, ...payload.user }));
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      refreshProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user?.id, refreshProfile]);

  useEffect(() => {
    const unsubscribe = onAuthLogout(() => {
      setUser(null);
      setIsLoading(false);
      setProfile(null);
      setIsProfileLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;

    // Realtime writes broadcast MongoDB-backed snapshots. When an event only
    // carries an id, we refetch the same canonical endpoint as a fallback.
    const handleProfileUpdated = (payload) => {
      if (!payload || String(payload.userId) !== String(user.id)) return;
      if (payload.profile) {
        setProfile(payload.profile);
        if (payload.profile.user) {
          setUser((prev) => ({ ...prev, ...payload.profile.user }));
        }
      } else {
        refreshProfile(user.id);
      }
    };

    const handlePostChanged = (payload) => {
      const targetUserId = payload?.userId;
      if (!targetUserId || String(targetUserId) !== String(user.id)) return;
      if (payload.profile) {
        updateProfileState(payload.profile);
        return;
      }
      refreshProfile(user.id);
    };

    const handleFollowUpdated = (payload) => {
      if (
        !payload ||
        (String(payload.userId) !== String(user.id) &&
          String(payload.targetUserId) !== String(user.id))
      ) {
        return;
      }
      refreshProfile(user.id);
    };

    socket.on('profileUpdated', handleProfileUpdated);
    socket.on('postCreated', handlePostChanged);
    socket.on('postDeleted', handlePostChanged);
    socket.on('followUpdated', handleFollowUpdated);

    return () => {
      socket.off('profileUpdated', handleProfileUpdated);
      socket.off('postCreated', handlePostChanged);
      socket.off('postDeleted', handlePostChanged);
      socket.off('followUpdated', handleFollowUpdated);
    };
  }, [user?.id, refreshProfile, updateProfileState]);

  const setAuthToken = useCallback((token) => {
    // localStorage keeps only the transport token; profile/user data is always
    // reloaded from the API and refreshed by socket events.
    if (!token) {
      localStorage.removeItem('token');
      setUser(null);
      return;
    }

    localStorage.setItem('token', token);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isProfileLoading,
      refreshUser,
      refreshProfile,
      setAuthToken,
      updateUser,
      updateProfileState,
      logout,
    }),
    [
      user,
      profile,
      isLoading,
      isProfileLoading,
      refreshUser,
      refreshProfile,
      setAuthToken,
      updateUser,
      updateProfileState,
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
