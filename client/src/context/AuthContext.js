// client/src/context/AuthContext.js
import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { clearEngagementCache } from '../hooks/useEngagement';

export const AuthContext = createContext();

// ── Synchronous header init ──────────────────────────────────────────────────
// Set the Authorization header BEFORE React renders any children.
// Without this, child useEffects (e.g. Home fetching posts) can fire before
// the AuthProvider's useEffect sets the header, causing optionalAuth to see
// no token and return hasLiked: false on every post.
const initialToken = localStorage.getItem('token');
if (initialToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refs so the interceptor closure always reads fresh values
  const tokenRef = useRef(token);
  const refreshTokenRef = useRef(localStorage.getItem('refreshToken'));

  // Keep refs in sync with state
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // ── Keep default auth header in sync with token state ──────────────────────
  // This handles token changes AFTER mount (login, refresh, logout).
  // The initial header was already set synchronously above.

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // ── Axios response interceptor — silent refresh on 401 ─────────────────────

  useEffect(() => {
    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, newToken = null) => {
      failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
          reject(error);
        } else {
          resolve(newToken);
        }
      });
      failedQueue = [];
    };

    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only handle 401s, skip refresh endpoint itself, skip already-retried
        if (
          error.response?.status !== 401 ||
          originalRequest._retry ||
          originalRequest.url?.includes('/api/auth/refresh-token') ||
          originalRequest.url?.includes('/api/auth/login')
        ) {
          return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((newToken) => {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const storedRefresh = refreshTokenRef.current;

        if (!storedRefresh) {
          isRefreshing = false;
          processQueue(error);
          handleForceLogout();
          return Promise.reject(error);
        }

        try {
          const res = await axios.post('/api/auth/refresh-token', {
            refreshToken: storedRefresh,
          });

          const newAccessToken = res.data.token;
          const newRefreshToken = res.data.refreshToken;

          // Persist new tokens
          localStorage.setItem('token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
            refreshTokenRef.current = newRefreshToken;
          }

          tokenRef.current = newAccessToken;
          setToken(newAccessToken);
          axios.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${newAccessToken}`;

          isRefreshing = false;
          processQueue(null, newAccessToken);

          // Retry the original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError);
          handleForceLogout();
          return Promise.reject(refreshError);
        }
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, []); // empty — interceptor uses refs, doesn't need re-attachment

  // ── Force logout (refresh failed) ──────────────────────────────────────────

  const handleForceLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    tokenRef.current = null;
    refreshTokenRef.current = null;
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    clearEngagementCache();
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // ── Load user on mount ─────────────────────────────────────────────────────

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/me');
          setUser(res.data.data);
          setIsAuthenticated(true);
        } catch (err) {
          // Interceptor will have tried refresh already — if we still fail, clear
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });

      const accessToken = res.data.token;
      const refreshToken = res.data.refreshToken;

      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        refreshTokenRef.current = refreshToken;
      }

      setToken(accessToken);
      setUser(res.data.user);
      setIsAuthenticated(true);

      toast.success('Login successful!');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      return false;
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = async () => {
    // Tell server to clear refresh token from DB
    try {
      await axios.post('/api/auth/logout');
    } catch {
      // Swallow — we're logging out anyway
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    tokenRef.current = null;
    refreshTokenRef.current = null;
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    clearEngagementCache();
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  // ── Update notification preferences ────────────────────────────────────────

  const updateNotificationPreferences = async (preferences) => {
    try {
      const res = await axios.post(
        '/api/notifications/preferences',
        preferences
      );
      if (res.data.data?.user) {
        setUser(res.data.data.user);
      }
      toast.success('Notification preferences updated');
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to update notification preferences';
      toast.error(msg);
      return false;
    }
  };

  // ── Update profile ─────────────────────────────────────────────────────────

  const updateProfile = async (formData) => {
    try {
      const res = await axios.put('/api/auth/update-profile', formData);
      setUser(res.data.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Profile update failed';
      toast.error(msg);
      return false;
    }
  };

  // ── Update bio ─────────────────────────────────────────────────────────────

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
      console.error('Bio update error:', err);

      // Fallback to profile endpoint if bio endpoint doesn't exist
      if (err.response?.status === 404) {
        try {
          const formData = new FormData();
          formData.append('bio', bio);
          const res = await axios.put('/api/auth/update-profile', formData);
          setUser(res.data.data);
          return true;
        } catch (fallbackErr) {
          const msg =
            fallbackErr.response?.data?.message || 'Bio update failed';
          toast.error(msg);
          return false;
        }
      }

      const msg = err.response?.data?.message || 'Bio update failed';
      toast.error(msg);
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
