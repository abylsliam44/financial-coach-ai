import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  user: null,
  login: async () => {},
  logout: () => {},
  checkAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  useEffect(() => {
    if (token) {
      checkAuth();
    }
    // eslint-disable-next-line
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token } = res.data;
    localStorage.setItem("token", access_token);
    setToken(access_token);
    setIsAuthenticated(true);
    await checkAuth();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    window.location.replace("/auth/login");
  };

  const checkAuth = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      setIsAuthenticated(true);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}; 