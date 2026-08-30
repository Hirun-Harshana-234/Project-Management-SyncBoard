import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getAccessToken, refreshSession, setAccessToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const data = getAccessToken() ? await api.get("/auth/me") : await refreshSession();
        if (active) setUser(data.user);
      } catch {
        setAccessToken(null);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => { active = false; };
  }, []);

  async function login(loginValue, password) {
    const data = await api.post("/auth/login", { login: loginValue, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }

  async function register(form) {
    const data = await api.post("/auth/register", form);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }

  async function logout() {
    try { await api.post("/auth/logout", {}); } catch { /* A local logout must always succeed. */ }
    setAccessToken(null);
    setUser(null);
  }

  async function updateProfile(changes) {
    const data = await api.patch("/auth/profile", changes);
    setUser(data.user);
    return data.user;
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, updateProfile, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}

