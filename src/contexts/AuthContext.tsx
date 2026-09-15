import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, type AuthUser } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  // Регистрация и вход
  register: (data: { phone: string; password: string; password_confirm: string }) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    const u = await apiService.getCurrentUser();
    if (u) setUser(u);
    else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiService
      .getCurrentUser()
      .then((u) => {
        if (u) setUser(u);
        else localStorage.removeItem('token');
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  /** Регистрация */
  const register = async (data: { phone: string; password: string; password_confirm: string }) => {
    const { token, user: u } = await apiService.register(data);
    localStorage.setItem('token', token);
    setUser(u);
  };

  /** Вход */
  const login = async (phone: string, password: string) => {
    const { token, user: u } = await apiService.login(phone, password);
    localStorage.setItem('token', token);
    setUser(u);
  };

  const signOut = async () => {
    await apiService.logout();
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
