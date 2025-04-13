import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginData, RegisterData, UpdateUserRequest, ChangePasswordRequest } from '../types/auth';
import api from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateUserRequest) => Promise<boolean>;
  changePassword: (data: ChangePasswordRequest) => Promise<boolean>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/auth/users/me/');
          setUser(response.data);
        }
      } catch (err) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      setError(null);
      const response = await api.post('/auth/jwt/create/', 
        new URLSearchParams({
          username: data.username,
          password: data.password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          withCredentials: true
        }
      );
      
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      
      // Убедимся, что токен точно сохранен перед запросом
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const userResponse = await api.get('/auth/users/me/');
        setUser(userResponse.data);
      } catch (userError) {
        console.error('Error getting user data:', userError);
        setError('Ошибка при получении данных пользователя');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Ошибка при входе');
      throw err;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      await api.post('/auth/users/', data);
      await login({ username: data.email, password: data.password });
    } catch (err) {
      setError('Ошибка при регистрации');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/token/logout/');
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      setUser(null);
    } catch (err) {
      setError('Ошибка при выходе');
      throw err;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      setError(null);
      const response = await api.put('/auth/users/me/', data);
      setUser(response.data);
    } catch (err) {
      setError('Ошибка при обновлении данных');
      throw err;
    }
  };

  const updateProfile = async (data: UpdateUserRequest) => {
    try {
      setError(null);
      const response = await api.put('/auth/users/me/', data);
      setUser(response.data);
      return true;
    } catch (err) {
      setError('Ошибка при обновлении профиля');
      throw err;
    }
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    try {
      setError(null);
      const response = await api.post('/auth/users/me/set_password/', data);
      return true;
    } catch (err) {
      setError('Ошибка при изменении пароля');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, isAuthenticated: !!user, login, register, logout, updateProfile, changePassword, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 