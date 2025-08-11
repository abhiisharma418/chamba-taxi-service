import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthAPI, setToken } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'customer' | 'driver';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: 'customer' | 'driver') => Promise<void>;
  signup: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps { children: ReactNode; }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const saved = localStorage.getItem('user');
        if (saved) setUser(JSON.parse(saved));
        // attempt refresh to get new access token
        const ref = await AuthAPI.refresh();
        if (ref?.data?.token) setToken(ref.data.token);
      } catch {}
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string, userType: 'customer' | 'driver') => {
    setIsLoading(true);
    try {
      const res = await AuthAPI.login({ email, password, userType });
      const token = res.data.token;
      setToken(token);
      const u: User = { id: res.data.user.id, name: res.data.user.name, email: res.data.user.email, type: res.data.user.role as any };
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: Omit<User, 'id'> & { password: string }) => {
    setIsLoading(true);
    try {
      const payload = { name: userData.name, email: userData.email, phone: userData.phone || '', role: userData.type, password: userData.password } as any;
      const res = await AuthAPI.register(payload);
      if (res?.data?.token) setToken(res.data.token);
      // After signup, consider auto-login via refresh
      const ref = await AuthAPI.refresh();
      if (ref?.data?.token) setToken(ref.data.token);
      const u: User = { id: Date.now().toString(), name: userData.name, email: userData.email, type: userData.type };
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try { await AuthAPI.logout(); } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};