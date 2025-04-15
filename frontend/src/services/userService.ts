import { api } from '@/lib/api';
import { UserRole } from '@/types/auth';
import { PaginatedResponse, UserProfile } from '@/types/user';

export interface UserFormData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  phone?: string;
  user_group: UserRole;
}

/**
 * Сервис для управления пользователями компании
 */
const userService = {
  /**
   * Получение списка пользователей компании
   */
  getCompanyUsers: async (): Promise<PaginatedResponse<UserProfile>> => {
    console.log('[userService] Запрос списка пользователей компании');
    console.log('[userService] Токен авторизации:', localStorage.getItem('access_token') ? 'Присутствует' : 'Отсутствует');
    
    try {
      const response = await api.get<PaginatedResponse<UserProfile>>('/userprofiles/');
      console.log('[userService] Успешный ответ от API');
      
      // Отладочная информация о структуре данных
      if (response.data && response.data.results) {
        console.log('[userService] Количество пользователей:', response.data.results.length);
        console.log('[userService] Пример первого пользователя:', JSON.stringify(response.data.results[0], null, 2));
      }
      
      return response.data;
    } catch (error) {
      console.error('[userService] Ошибка при запросе к API:', error);
      throw error;
    }
  },

  /**
   * Получение пользователя по ID
   */
  getUserById: async (id: string): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/userprofiles/${id}/`);
    return response.data;
  },

  /**
   * Создание нового пользователя компании
   */
  createUser: async (data: UserFormData): Promise<UserProfile> => {
    const response = await api.post<UserProfile>('/userprofiles/create_user/', data);
    return response.data;
  },

  /**
   * Обновление данных пользователя по ID
   */
  updateUser: async (id: string, data: Partial<UserFormData>): Promise<UserProfile> => {
    const response = await api.put<UserProfile>(`/userprofiles/${id}/`, data);
    return response.data;
  },

  /**
   * Удаление пользователя
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/userprofiles/${id}/`);
  }
};

export default userService; 