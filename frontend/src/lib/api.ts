import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// Базовый URL для API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Типы для токенов
interface Tokens {
  access: string;
  refresh?: string;
}

// Функция для сохранения токенов
const saveTokens = (tokens: Tokens): void => {
  localStorage.setItem('access_token', tokens.access);
  if (tokens.refresh) {
    localStorage.setItem('refresh_token', tokens.refresh);
  }
};

// Функция для очистки токенов
const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Получение токена доступа
const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Получение токена обновления
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

// Проверка, есть ли токены
const hasTokens = (): boolean => {
  return !!getAccessToken();
};

// Перехватчик запросов для добавления заголовка авторизации
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      // Для JWT используем формат "Bearer {token}"
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Получаем оригинальный запрос
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Если сервер вернул 401 (Unauthorized) и у нас есть refresh token
    if (error.response?.status === 401 && !originalRequest._retry && getRefreshToken()) {
      originalRequest._retry = true;
      
      try {
        // Пытаемся обновить токен
        const response = await axios.post(
          `${API_BASE_URL}/auth/jwt/refresh/`,
          { refresh: getRefreshToken() }
        );
        
        // Сохраняем новый токен доступа
        saveTokens({ access: response.data.access });
        
        // Обновляем заголовок авторизации в оригинальном запросе
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
        }
        
        // Повторяем оригинальный запрос с новым токеном
        return api(originalRequest);
      } catch (refreshError) {
        // При ошибке обновления токена очищаем все данные и перенаправляем на страницу входа
        console.error('Ошибка обновления токена', refreshError);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Обработка других ошибок
    const errorData = error.response?.data as Record<string, any> || {};
    const errorMessage = errorData.detail || 
                         errorData.message || 
                         error.message || 
                         'Произошла ошибка';
    
    // Показываем ошибку пользователю
    toast.error(errorMessage);
    
    // Для критических ошибок авторизации перенаправляем на страницу входа
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearTokens();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export { api, saveTokens, clearTokens, getAccessToken, getRefreshToken, hasTokens }; 