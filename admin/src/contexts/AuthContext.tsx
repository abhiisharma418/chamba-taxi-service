import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminAPI, setToken } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { useAuth };

interface AuthProviderProps { 
  children: ReactNode; 
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const saved = localStorage.getItem('admin-user');
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load admin user:', error);
      }
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await AdminAPI.login({ email, password });
      const token = res.data.token;
      setToken(token);
      const adminUser: User = {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role
      };
      setUser(adminUser);
      localStorage.setItem('admin-user', JSON.stringify(adminUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AdminAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
