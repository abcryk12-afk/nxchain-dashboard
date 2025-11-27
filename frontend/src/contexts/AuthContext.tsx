import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔥 AuthContext - Checking for existing token/user');
    console.log('🔥 Current URL:', window.location.pathname);
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('🔥 Token found:', !!token);
    console.log('🔥 User data found:', !!userData);

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('🔥 Parsed user:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('🔥 Failed to parse user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    console.log('AuthContext - Login called with:', userData);
    console.log('AuthContext - Token received:', token);
    
    // Validate token before storing
    if (!token || typeof token !== 'string') {
      console.error('AuthContext - Invalid token received!');
      return;
    }
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    console.log('AuthContext - Token stored in localStorage');
    console.log('AuthContext - User stored in localStorage');
    console.log('AuthContext - User state set');
    
    // Verify token was stored
    const storedToken = localStorage.getItem('token');
    console.log('AuthContext - Verification - Token in localStorage:', !!storedToken);
  };

  const logout = () => {
    console.log('AuthContext - Logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
