import { apiClient } from '@/api/apiClient';
import { 
  AuthResponse, 
  ChangePasswordRequest, 
  LoginData, 
  RegisterData, 
  UpdateUserRequest, 
  User 
} from '@/types/auth';

/**
 * Сервис для работы с аутентификацией и управлением пользователями
 */
const authService = {
  /**
   * Вход пользователя
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    // Подготавливаем данные для бэкенда
    const loginData = {
      username: data.username,
      password: data.password
    };
    
    // Получаем токены JWT
    const response = await apiClient.post<{access: string, refresh: string}>('/auth/jwt/create/', loginData);
    
    // Сразу сохраняем токены перед любыми другими запросами
    const tokens = {
      access: response.data.access,
      refresh: response.data.refresh
    };
    
    // Сохраняем токены в localStorage
    localStorage.setItem('access_token', tokens.access);
    if (tokens.refresh) {
      localStorage.setItem('refresh_token', tokens.refresh);
    }
    
    // Теперь запрашиваем данные пользователя, уже с установленным токеном
    const user = await authService.getCurrentUser();
    
    // Формируем структуру ответа, которую ожидает фронтенд
    const authResponse: AuthResponse = {
      user,
      token: tokens
    };
    
    return authResponse;
  },

  /**
   * Выход пользователя
   */
  logout: async (): Promise<void> => {
    // JWT не имеет специального эндпоинта для логаута
    // Просто очищаем токены на клиенте
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  /**
   * Регистрация нового пользователя (доступно только для админов и суперпользователей)
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/users/', data);
    return response.data;
  },

  /**
   * Получение данных текущего пользователя
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      // Получаем базовые данные пользователя из Djoser
      const userResponse = await apiClient.get<any>('/auth/users/me/');
      const userData = userResponse.data;
      
      try {
        // Получаем профиль пользователя с ролью и другими данными
        const profileResponse = await apiClient.get<any>('/userprofiles/me/');
        const profileData = profileResponse.data;
        
        // Объединяем данные из обоих запросов
        const fullUserData = {
          ...userData,
          role: profileData.userGroup || profileData.user_group,
          first_name: profileData.user?.firstName || profileData.user?.first_name || '',
          last_name: profileData.user?.lastName || profileData.user?.last_name || '',
          phone: profileData.phone,
          company: profileData.company ? {
            id: String(profileData.company),
            name: profileData.companyName || profileData.company_name
          } : undefined
        };
        
        return fullUserData;
      } catch (profileError) {
        console.error('Ошибка при получении профиля пользователя:', profileError);
        
        // Определяем роль на основе username из первого запроса, если профиль недоступен
        const username = userData?.username?.toLowerCase() || userData?.email?.toLowerCase() || '';
        let role: 'superuser' | 'admin' | 'boss' | 'manager' | 'warehouse' | 'client' = 'client';
        
        if (username.includes('super') || username.includes('root')) {
          role = 'superuser';
        } else if (username.includes('admin')) {
          role = 'admin';
        } else if (username.includes('boss')) {
          role = 'boss';
        } else if (username.includes('manager')) {
          role = 'manager';
        } else if (username.includes('warehouse')) {
          role = 'warehouse';
        }
        
        return {
          ...userData,
          role
        };
      }
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      throw error; // Пробрасываем ошибку дальше, чтобы компонент мог ее обработать
    }
  },

  /**
   * Обновление данных пользователя
   */
  updateUser: async (data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>('/auth/users/me/', data);
    return response.data;
  },

  /**
   * Смена пароля пользователя
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post('/auth/users/set_password/', data);
  },

  /**
   * Получение списка пользователей (только для админов)
   */
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/userprofiles/');
    return response.data;
  },

  /**
   * Получение пользователя по ID (только для админов)
   */
  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/userprofiles/${id}/`);
    return response.data;
  },

  /**
   * Обновление пользователя по ID (только для админов)
   */
  updateUserById: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/userprofiles/${id}/`, data);
    return response.data;
  },

  /**
   * Удаление пользователя по ID (только для админов)
   */
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/userprofiles/${id}/`);
  }
};

export default authService; 