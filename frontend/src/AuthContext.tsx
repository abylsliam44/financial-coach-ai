import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

interface User {
  id: string;
  email: string;
  username: string;
}

interface LoginResult {
  hasProfile: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  hasProfile: boolean | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
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
  login: async () => ({ hasProfile: false }),
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
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        setToken(storedToken);
        await checkUserAndProfile();
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);
  
  const login = async (email: string, password: string): Promise<LoginResult> => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token } = res.data;
    localStorage.setItem("token", access_token);
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setToken(access_token);
    
    const profileRes = await api.get("/onboarding/status");
    const profileStatus = profileRes.data.has_profile;
    
    await checkUserAndProfile();
    return { hasProfile: profileStatus };
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await api.post("/auth/register", { email, username, password });
    const { access_token } = res.data;
    localStorage.setItem("token", access_token);
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setToken(access_token);
    
    // After registration, user is authenticated but has no profile
    setIsAuthenticated(true);
    setHasProfile(false);
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
    try {
      const userRes = await api.get("/auth/me");
      setUser(userRes.data);
      setIsAuthenticated(true);
      
      const profileRes = await api.get("/onboarding/status");
      setHasProfile(profileRes.data.has_profile);
    } catch (error) {
      // This can happen if the token is invalid
      logout();
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