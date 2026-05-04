import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "hotel_jwt_auth";

const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      authHeader: `Bearer ${parsed.token}`
    };
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredAuth());

  const login = useCallback(({ username, token, role }) => {
    const newUser = { 
      username: username.trim(), 
      token, 
      role: role ?? 'user',
      authHeader: `Bearer ${token}` 
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.error("Persistence failed", e);
    }
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Persistence failed", e);
    }
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthed: !!user,
    username: user?.username ?? null,
    role: user?.role ?? null,
    authHeader: user?.authHeader ?? null,
    login,
    logout,
  }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}