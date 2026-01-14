import React, { createContext, useContext, useMemo, useState } from "react";
import { clearStoredUser, getStoredUser, setStoredUser } from "./authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ✅ στο refresh ξεκινάει από localStorage
  const [user, setUser] = useState(() => getStoredUser());

  const login = (u) => {
    setStoredUser(u);
    setUser(u);
  };

  const logout = () => {
    clearStoredUser();
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
