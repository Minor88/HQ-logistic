import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Создаем axios-инстанс с базовыми настройками
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Важно для CORS с credentials
});

// Глобальная настройка для отправки авторизационного токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок и автоматическое обновление токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Пытаемся обновить токен, если ошибка 401 и запрос еще не повторялся
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Получаем refresh токен
        const refresh = localStorage.getItem('refresh');
        if (!refresh) {
          throw new Error('No refresh token found');
        }
        
        // Пытаемся обновить токен
        const response = await axios.post(
          `${API_URL}/auth/jwt/refresh/`, 
          new URLSearchParams({ refresh }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            withCredentials: true
          }
        );
        
        // Если успешно, сохраняем новый токен и повторяем запрос
        const newToken = response.data.access;
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Если не удалось обновить токен, удаляем токены и перенаправляем на логин
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        
        // Перенаправляем только если это не API-запрос на auth-страницы
        if (!originalRequest.url?.includes('/auth/')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 