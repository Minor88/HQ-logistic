// Типы для аутентификации и работы с пользователями

// Роли пользователей
export type UserRole = 'superuser' | 'admin' | 'boss' | 'manager' | 'warehouse' | 'client';

// Интерфейс пользователя
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  phone?: string;
  role: UserRole;
  company?: {
    id: number;
    name: string;
  };
  role_display?: string;
  is_active?: boolean;
}

// Данные для входа
export interface LoginData {
  email: string;
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

// Запрос на обновление данных пользователя
export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

// Запрос на изменение пароля
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Ответ от API с токеном
export interface AuthResponse {
  auth_token: string;
}

// Профиль пользователя из UserProfile
export interface UserProfile {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  company: number;
  company_name: string;
  user_group: UserRole;
  role_display: string;
  phone?: string;
} 