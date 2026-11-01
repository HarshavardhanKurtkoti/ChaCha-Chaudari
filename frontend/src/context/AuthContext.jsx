import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { decodeJwt, isTokenExpired } from '../utils/jwt';
import { getApiUrl } from '../config/api';

export const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: () => false,
  login: () => {},
  logout: () => {},
  updateUser: async () => {},
  openLoginModal: () => {},
  closeLoginModal: () => {},
  showLoginModal: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Initialize from localStorage and check token expiration
  const initializeAuth = useCallback(() => {
    try {
      const storedToken = localStorage.getItem('userToken');
      const storedProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');

      if (storedToken) {
        if (isTokenExpired(storedToken)) {
          // Token expired: clear it
          localStorage.removeItem('userToken');
          setToken(null);
          setUser(storedProfile || null);
        } else {
          setToken(storedToken);
          const claims = decodeJwt(storedToken) || {};
          const merged = {
            ...(storedProfile || {}),
            name: storedProfile?.name || claims.name,
            email: storedProfile?.email || claims.email,
            age: storedProfile?.age ?? claims.age,
          };
          setUser(merged);
        }
      } else if (storedProfile) {
        setUser(storedProfile);
        setToken(null);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();

    // Listen to cross-component and cross-tab events for backwards compatibility
    const handleLogin = (e) => {
      const t = e?.detail?.token || localStorage.getItem('userToken');
      if (t) {
        setToken(t);
        const claims = decodeJwt(t) || {};
        setUser((prev) => ({
          ...(prev || {}),
          ...claims,
        }));
      }
    };

    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };

    const handleProfile = (e) => {
      if (e?.detail) {
        setUser((prev) => ({ ...(prev || {}), ...e.detail }));
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'userToken' || e.key === 'userProfile') {
        initializeAuth();
      }
    };

    window.addEventListener('user-logged-in', handleLogin);
    window.addEventListener('user-logged-out', handleLogout);
    window.addEventListener('profile-updated', handleProfile);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('user-logged-in', handleLogin);
      window.removeEventListener('user-logged-out', handleLogout);
      window.removeEventListener('profile-updated', handleProfile);
      window.removeEventListener('storage', handleStorage);
    };
  }, [initializeAuth]);

  const login = useCallback((newToken, newProfile = null) => {
    if (newToken) {
      localStorage.setItem('userToken', newToken);
      setToken(newToken);
    }
    if (newProfile) {
      localStorage.setItem('userProfile', JSON.stringify(newProfile));
      setUser(newProfile);
    } else if (newToken) {
      const claims = decodeJwt(newToken) || {};
      setUser(claims);
    }
    setShowLoginModal(false);
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { token: newToken } }));
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userProfile');
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    window.dispatchEvent(new CustomEvent('user-logged-out'));
  }, []);

  const updateUser = useCallback(async (details) => {
    try {
      const prev = JSON.parse(localStorage.getItem('userProfile') || 'null') || {};
      const updated = { ...prev, ...details, updatedAt: Date.now() };
      localStorage.setItem('userProfile', JSON.stringify(updated));
      setUser(updated);
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updated }));

      const currentToken = localStorage.getItem('userToken');
      if (currentToken && !isTokenExpired(currentToken)) {
        try {
          const res = await fetch(getApiUrl('/auth/update_profile'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentToken}`,
            },
            body: JSON.stringify({ name: updated.name, age: updated.age }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.token) {
            localStorage.setItem('userToken', data.token);
            setToken(data.token);
            window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { token: data.token } }));
          }
        } catch {
          // Network failure while updating backend profile
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const isAuthenticated = useCallback(() => {
    if (!token) return false;
    return !isTokenExpired(token);
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    openLoginModal: () => setShowLoginModal(true),
    closeLoginModal: () => setShowLoginModal(false),
    showLoginModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;

