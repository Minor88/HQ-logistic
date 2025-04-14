import { Company } from './company';

/**
 * Роли пользователей
 */
export type UserRole = 
  | 'superuser'   // Суперпользователь (управляет компаниями)
  | 'admin'       // Администратор компании
  | 'boss'        // Руководитель компании
  | 'manager'     // Менеджер компании
  | 'warehouse'   // Работник склада
  | 'client'      // Клиент
  | 'guest';      // Гость

/**
 * Интерфейс базового пользователя системы из Django
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * Интерфейс профиля пользователя
 */
export interface UserProfile {
  id: number;
  user: User;
  company: Company | null;
  user_group: UserRole;
  role_display: string;
  phone?: string;
  is_active: boolean;
}

/**
 * Интерфейс данных профиля пользователя для списка
 */
export interface UserProfileListItem {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  company: {
    id: number;
    name: string;
  } | null;
  user_group: string;
  role_display: string;
  phone: string | null;
  is_active: boolean;
} 