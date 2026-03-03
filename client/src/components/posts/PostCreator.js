import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { clearEngagementCache } from '../../hooks/useEngagement';

export const AuthContext = createContext();

// ── Axios interceptor setup (runs once) ──────────────────────────────────────
// We hold refs to the current tokens so the interceptor always reads fresh
// values without needing to re-attach on every state change.

let isRefreshing = false;
let failedQueue = []; // requests that arrived while a refresh was in-flight

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Keep refs so the interceptor closure always sees the latest values
  const tokenRef = useRef(token);
  const refreshTokenRef = useRef(localStorage.getItem('refreshToken'));

  // Sync axios default header whenever token changes
  useEffect(() => {
    tokenRef.current = token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // ── Helpers to persist tokens ────────────────────────────────────────────
  const persistTokens = (accessToken, refreshTkn) => {
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      tokenRef.current = accessToken;
    }
    if (refreshTkn) {
      localStorage.setItem('refreshToken', refreshTkn);
      refreshTokenRef.current = refreshTkn;
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    tokenRef.current = null;
    refreshTokenRef.current = null;
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  // ── Axios response interceptor — silent refresh on 401 ───────────────────
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only intercept 401s, skip if it's the refresh endpoint itself
        // or if we already retried this request
        if (
          error.response?.status !== 401 ||
          originalRequest._retry ||
          originalRequest.url?.includes('/api/auth/refresh-token') ||
          originalRequest.url?.includes('/api/auth/login') ||
          originalRequest.url?.includes('/api/auth/register')
        ) {
          return Promise.reject(error);
        }

        // No refresh token stored — can't recover, log out
        if (!refreshTokenRef.current) {
          clearTokens();
          return Promise.reject(error);
        }

        // If a refresh is already in-flight, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return axios(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await axios.post('/api/auth/refresh-token', {
            refreshToken: refreshTokenRef.current,
          });

          const newAccess = data.accessToken || data.token;
          const newRefresh = data.refreshToken || refreshTokenRef.current;

          persistTokens(newAccess, newRefresh);

          // Retry all queued requests with the new token
          processQueue(null, newAccess);

          // Retry the original request
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          return axios(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearTokens();
          // Only toast if user was previously authenticated (not on initial load)
          if (tokenRef.current) {
            toast.error('Session expired. Please log in again.');
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []); // runs once — uses refs, not stale closures

  // ── Load user on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/me');
          setUser(res.data.data);
          setIsAuthenticated(true);
        } catch (err) {
          // The interceptor will have already tried to refresh.
          // If we still failed, tokens are cleared automatically.
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // ── Register ─────────────────────────────────────────────────────────────
  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);

      persistTokens(res.data.token, res.data.refreshToken);
      setUser(res.data.user);
      setIsAuthenticated(true);

      toast.success('Registration successful!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });

      persistTokens(res.data.token, res.data.refreshToken);
      setUser(res.data.user);
      setIsAuthenticated(true);

      toast.success('Login successful!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch {
      // Server logout failed — still clear locally
    }
    clearTokens();
    clearEngagementCache();
    toast.success('Logged out successfully');
  };

  // ── Update profile ───────────────────────────────────────────────────────
  const updateProfile = async (formData) => {
    try {
      const res = await axios.put('/api/auth/update-profile', formData);
      setUser(res.data.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Profile update failed');
      return false;
    }
  };

  // ── Update bio ───────────────────────────────────────────────────────────
  const updateBio = async (bio) => {
    try {
      const res = await axios.put(
        '/api/auth/update-bio',
        { bio },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      setUser(res.data.data);
      return true;
    } catch (err) {
      // Fallback to profile endpoint if bio endpoint doesn't exist
      if (err.response?.status === 404) {
        try {
          const formData = new FormData();
          formData.append('bio', bio);
          const res = await axios.put('/api/auth/update-profile', formData);
          setUser(res.data.data);
          return true;
        } catch (fallbackErr) {
          toast.error(
            fallbackErr.response?.data?.message || 'Bio update failed'
          );
          return false;
        }
      }
      toast.error(err.response?.data?.message || 'Bio update failed');
      return false;
    }
  };

  // ── Notification preferences ─────────────────────────────────────────────
  const updateNotificationPreferences = async (preferences) => {
    try {
      const res = await axios.post(
        '/api/notifications/preferences',
        preferences
      );
      if (res.data.data?.user) setUser(res.data.data.user);
      toast.success('Notification preferences updated');
      return true;
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to update notification preferences'
      );
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        register,
        login,
        logout,
        updateProfile,
        updateBio,
        updateNotificationPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
