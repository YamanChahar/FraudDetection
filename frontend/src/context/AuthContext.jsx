import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  refreshSession,
  logoutUser,
  fetchCurrentUser,
} from '../services/authApi';
import { setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on initial mount
  const checkAuth = useCallback(async () => {
    const refreshToken = sessionStorage.getItem('trace_refresh_token');
    if (!refreshToken) {
      setUser(null);
      setAuthToken(null);
      setIsLoading(false);
      return;
    }

    try {
      // Rotate / refresh token on initial load
      const res = await refreshSession(refreshToken);
      if (res.success && res.data?.tokens) {
        setAuthToken(res.data.tokens.accessToken);
        sessionStorage.setItem('trace_refresh_token', res.data.tokens.refreshToken);
        setUser(res.data.user);
      } else {
        // Fallback: try fetching /me if access token exists
        const meRes = await fetchCurrentUser();
        if (meRes.success) {
          setUser(meRes.data);
        }
      }
    } catch {
      // Session invalid or expired: clean up
      sessionStorage.removeItem('trace_refresh_token');
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.success && res.data) {
      const { user: authUser, tokens } = res.data;
      setAuthToken(tokens.accessToken);
      sessionStorage.setItem('trace_refresh_token', tokens.refreshToken);
      setUser(authUser);
      return authUser;
    }
    throw new Error('Login failed');
  };

  // Register handler
  const register = async (userData) => {
    const res = await registerUser(userData);
    if (res.success && res.data) {
      const { user: authUser, tokens } = res.data;
      setAuthToken(tokens.accessToken);
      sessionStorage.setItem('trace_refresh_token', tokens.refreshToken);
      setUser(authUser);
      return authUser;
    }
    throw new Error('Registration failed');
  };

  // Logout handler
  const logout = async () => {
    const refreshToken = sessionStorage.getItem('trace_refresh_token');
    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } catch (err) {
      console.warn('Logout network notice:', err.message);
    } finally {
      sessionStorage.removeItem('trace_refresh_token');
      setAuthToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
