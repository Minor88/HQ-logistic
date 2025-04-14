// Роли пользователей
export type UserRole = 
  | "superuser" 
  | "admin" 
  | "boss" 
  | "manager" 
  | "warehouse" 
  | "client";

// Базовая информация о компании для пользователя
export interface Company {
  id: string;
  name: string;
}

// Основная информация о пользователе
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  company?: Company;
}

// Данные для входа в систему
export interface LoginData {
  username: string; // Может содержать email или имя пользователя
  password: string;
}

// Данные для регистрации
export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// Ответ при входе или регистрации
export interface AuthResponse {
  user: User;
  token: {
    access: string;
    refresh?: string;
  };
}

// Данные для обновления информации пользователя
export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

// Данные для смены пароля
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Состояние авторизации
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Данные для создания администратора компании
 */
export interface AdminFormData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  phone?: string;
} 