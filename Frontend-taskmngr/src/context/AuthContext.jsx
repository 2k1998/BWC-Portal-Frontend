// src/context/AuthContext.jsx
import React, { useEffect, useState, useCallback } from "react";
import { authApi } from "../api/apiService"; // must expose: login(email,password) -> {access_token}, getMe(token)
import AuthContext from "./AuthContextObject";

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("access_token") || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async (token) => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const me = await authApi.getMe(token); // GET /users/me
      // Expected shape includes: id, email, first_name, surname, role, ...
      setCurrentUser(me);
    } catch {
      // token invalid/expired
      localStorage.removeItem("access_token");
      setAccessToken(null);
      setCurrentUser(null);
    }
  }, []);

  // On mount: if token exists, fetch /users/me
  useEffect(() => {
    (async () => {
      try {
        await hydrateUser(accessToken);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, hydrateUser]);

  const login = useCallback(async (email, password) => {
    // POST /token -> { access_token }
    const data = await authApi.login(email, password);
    const token = data?.access_token;
    if (!token) throw new Error("No access_token returned from API");

    localStorage.setItem("access_token", token);
    setAccessToken(token);
    await hydrateUser(token); // fetch full profile immediately
    return true;
  }, [hydrateUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setAccessToken(null);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, currentUser, setCurrentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

