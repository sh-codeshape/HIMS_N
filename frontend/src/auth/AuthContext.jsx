import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import authService from "../api/services/authService";

const AuthContext = createContext(null);

const TOKEN_KEY = "hims_token";
const USER_KEY = "hims_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // On first load, validate any existing token (expiry, shape) before trusting it.
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
        if (isExpired) {
          logout();
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async ({ role, username, password }) => {
    const data = await authService.login({ role, username, password });
    // Expected backend response: { token, user: { id, name, role, ... } }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
