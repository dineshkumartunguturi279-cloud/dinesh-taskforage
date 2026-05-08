/**
 * Authentication Context Provider.
 * Manages user state, login, signup, logout, and auto-refresh.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for forced logout events
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await authAPI.getProfile();
      setUser(res.data.data);
    } catch {
      // Try refresh
      try {
        const res = await authAPI.refresh();
        setUser(res.data.data);
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    setUser(res.data.data);
    return res.data;
  };

  const signup = async (name, email, password, confirm_password) => {
    const res = await authAPI.signup({ name, email, password, confirm_password });
    setUser(res.data.data);
    return res.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore errors
    }
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateProfile(data);
    setUser(res.data.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
