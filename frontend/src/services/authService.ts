import { api, saveTokens, clearTokens } from '@/lib/api';
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
    const response = await api.post<{access: string, refresh: string}>('/auth/jwt/create/', loginData);
    
    // Сразу сохраняем токены перед любыми другими запросами
    const tokens = {
      access: response.data.access,
      refresh: response.data.refresh
    };
    saveTokens(tokens);
    
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
    clearTokens();
  },

  /**
   * Регистрация нового пользователя (доступно только для админов и суперпользователей)
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/users/', data);
    return response.data;
  },

  /**
   * Получение данных текущего пользователя
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      // Получаем базовые данные пользователя из Djoser
      const userResponse = await api.get<any>('/auth/users/me/');
      const userData = userResponse.data;
      
      console.log('Базовые данные пользователя:', userData);
      
      try {
        // Получаем профиль пользователя с ролью и другими данными
        const profileResponse = await api.get<any>('/user-profiles/me/');
        const profileData = profileResponse.data;
        
        console.log('Профиль пользователя:', profileData);
        
        // Объединяем данные из обоих запросов
        const fullUserData = {
          ...userData,
          role: profileData.userGroup,
          first_name: profileData.user?.firstName || '',
          last_name: profileData.user?.lastName || '',
          phone: profileData.phone,
          company: profileData.company ? {
            id: String(profileData.company),
            name: profileData.companyName
          } : undefined
        };
        
        console.log('Полные данные пользователя:', fullUserData);
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
        
        console.log('Определена роль на основе username:', role);
        
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
    const response = await api.put<User>('/auth/users/me/', data);
    return response.data;
  },

  /**
   * Смена пароля пользователя
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('/auth/users/set_password/', data);
  },

  /**
   * Получение списка пользователей (только для админов)
   */
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/user-profiles/');
    return response.data;
  },

  /**
   * Получение пользователя по ID (только для админов)
   */
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/user-profiles/${id}/`);
    return response.data;
  },

  /**
   * Обновление пользователя по ID (только для админов)
   */
  updateUserById: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>(`/user-profiles/${id}/`, data);
    return response.data;
  },

  /**
   * Удаление пользователя по ID (только для админов)
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/user-profiles/${id}/`);
  }
};

export default authService; 