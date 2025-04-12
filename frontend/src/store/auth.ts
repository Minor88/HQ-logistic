import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await api.post('/auth/token/login/', { username, password });
          set({ token: data.auth_token });
          await useAuthStore.getState().getCurrentUser();
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Ошибка входа' });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        api.post('/auth/token/logout/');
        set({ token: null, user: null });
      },

      getCurrentUser: async () => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await api.get('/auth/users/me/');
          set({ user: data });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Ошибка получения данных пользователя' });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
); 