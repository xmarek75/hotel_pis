import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "hotel_jwt_auth";

function toAuthState(session) {
  if (!session?.username || !session?.token) return null;
  return {
    username: session.username,
    role: session.role ?? null,
    token: session.token,
    authHeader: "Bearer " + session.token,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  // načti přihlášení po refreshi
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSession(toAuthState(parsed));
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore storage access issues (e.g., browser policy / private mode)
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      username: session?.username ?? null,
      role: session?.role ?? null,
      authHeader: session?.authHeader ?? null,
      isAuthed: !!session,
      login: ({ username, token, role }) => {
        const next = toAuthState({ username: username.trim(), token, role });
        if (!next) return;
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ username: next.username, token: next.token, role: next.role })
          );
        } catch {
          // ignore storage access issues, keep session in memory
        }
        setSession(next);
      },
      logout: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore storage access issues
        }
        setSession(null);
      },
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
