import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  hasProfile: boolean | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfileStatus: (status: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  user: null,
  hasProfile: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfileStatus: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        await checkUserAndProfile();
      } else {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);
  
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token } = res.data;
      localStorage.setItem("token", access_token);
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setToken(access_token);
      
      await checkUserAndProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/register", { email, username, password });
      const { access_token } = res.data;
      localStorage.setItem("token", access_token);
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setToken(access_token);
      
      // After registration, user is authenticated but has no profile
      await checkUserAndProfile(); // This will set the user
      setHasProfile(false); // Explicitly set, as they just registered
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setHasProfile(null);
    window.location.replace("/auth/login");
  };

  const checkUserAndProfile = async () => {
    setIsLoading(true);
    try {
      const userRes = await api.get("/auth/me");
      setUser(userRes.data);
      setIsAuthenticated(true);
      
      const profileRes = await api.get("/onboarding/status");
      setHasProfile(profileRes.data.has_profile);
    } catch (error) {
      // This can happen if the token is invalid
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileStatus = (status: boolean) => {
    setHasProfile(status);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        user,
        hasProfile,
        isLoading,
        login,
        register,
        logout,
        updateProfileStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 