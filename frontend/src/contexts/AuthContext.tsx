import React, { createContext, useState, ReactNode, useContext, useEffect } from "react";
import { ChangePasswordRequest, LoginData, RegisterData, UpdateUserRequest, User as AuthUser, UserRole as AuthUserRole } from "@/types/auth";
import authService from "@/services/authService";
import { toast } from "sonner";

// Define user roles
export type UserRole = 
  | "superuser" 
  | "admin" 
  | "boss" 
  | "manager" 
  | "warehouse" 
  | "client";

// Define user interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
}

// Расширяю тип для входящих данных пользователя
interface ExtendedAuthUser extends AuthUser {
  username?: string;
}

// Define context interface
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  updateUser: (data: UpdateUserRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  error: string | null;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  isLoading: false,
  hasPermission: () => false,
  updateUser: async () => {},
  changePassword: async () => {},
  register: async () => {},
  error: null,
});

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Преобразует AuthUser в User для внутреннего использования
  const mapAuthUserToUser = (authUser: any): User => {
    if (!authUser) {
      return {
        id: '',
        name: 'Гость',
        email: '',
        role: 'client' as UserRole,
        companyId: undefined
      };
    }
    
    // Принудительно устанавливаем роль, если она отсутствует в ответе API
    // В реальном приложении нужно решить этот вопрос на бэкенде
    const userRole = authUser.role || 
                    (authUser.username?.includes('boss') ? 'boss' : 
                     authUser.username?.includes('admin') ? 'admin' : 'client') as UserRole;
    
    return {
      id: authUser.id,
      name: authUser.first_name && authUser.last_name 
        ? `${authUser.first_name} ${authUser.last_name}`
        : authUser.email || authUser.username || 'Пользователь',
      email: authUser.email,
      role: userRole,
      companyId: authUser.company?.id
    };
  };

  // Попытка восстановления сессии при загрузке
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        
        // Если есть сохраненный пользователь, пытаемся получить актуальные данные
        if (storedUser) {
          try {
            // Получаем свежие данные пользователя с сервера
            const currentUser = await authService.getCurrentUser();
            setUser(mapAuthUserToUser(currentUser));
            
            // Обновляем локальное хранилище актуальными данными
            localStorage.setItem("user", JSON.stringify(mapAuthUserToUser(currentUser)));
          } catch (error) {
            console.error("Failed to get current user", error);
            // Если ошибка получения, очищаем хранилище
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Аутентификация пользователя
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login({ username, password });
      
      // Преобразуем и сохраняем данные пользователя
      const mappedUser = mapAuthUserToUser(response.user);
      setUser(mappedUser);
      localStorage.setItem("user", JSON.stringify(mappedUser));
      
      toast.success("Успешный вход в систему");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Ошибка входа";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход из системы
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
      setUser(null);
      localStorage.removeItem("user");
      toast.success("Вы вышли из системы");
    } catch (error) {
      console.error("Logout error", error);
      toast.error("Ошибка при выходе из системы");
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление данных пользователя
  const updateUser = async (data: UpdateUserRequest) => {
    setIsLoading(true);
    
    try {
      const updatedUser = await authService.updateUser(data);
      const mappedUser = mapAuthUserToUser(updatedUser);
      setUser(mappedUser);
      localStorage.setItem("user", JSON.stringify(mappedUser));
      toast.success("Профиль обновлен");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Ошибка обновления профиля";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Смена пароля
  const changePassword = async (data: ChangePasswordRequest) => {
    setIsLoading(true);
    
    try {
      await authService.changePassword(data);
      toast.success("Пароль успешно изменен");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Ошибка смены пароля";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Регистрация нового пользователя (только для админов)
  const register = async (data: RegisterData) => {
    setIsLoading(true);
    
    try {
      await authService.register(data);
      toast.success("Пользователь успешно зарегистрирован");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Ошибка регистрации";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка прав доступа
  const hasPermission = (requiredRoles: UserRole[]) => {
    if (!user) return false;
    return requiredRoles.some(role => role === user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
        hasPermission,
        updateUser,
        changePassword,
        register,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
