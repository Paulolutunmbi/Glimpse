import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API, { onAuthLogout } from '../api/axios';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const nextUser = response?.data?.data?.user || response?.data?.user || null;
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

  useEffect(() => {
    const unsubscribe = onAuthLogout(() => {
      setUser(null);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const setAuthToken = useCallback((token) => {
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
      isLoading,
      refreshUser,
      setAuthToken,
      updateUser,
      logout,
    }),
    [user, isLoading, refreshUser, setAuthToken, updateUser, logout]
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
