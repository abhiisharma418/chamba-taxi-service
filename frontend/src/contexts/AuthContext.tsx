import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthAPI, setToken } from '../lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'driver' | 'admin';
  avatar?: string;
  licenseNumber?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User, token: string) => Promise<void>;
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

  const login = async (userData: User, token: string) => {
    setIsLoading(true);
    try {
      setToken(token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch (error) {
      console.log('Logout API call failed, proceeding with local logout:', error);
      // Continue with local logout even if API call fails
    }

    // Always perform local cleanup regardless of API success/failure
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
