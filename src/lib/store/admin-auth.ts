import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminAuthApi } from '../admin-api';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await adminAuthApi.login(email, password);
        const { admin, token } = response.data;

        localStorage.setItem('adminToken', token);

        set({
          admin,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        try {
          await adminAuthApi.logout();
        } catch {
          // Ignore logout errors
        }

        localStorage.removeItem('adminToken');

        set({
          admin: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('adminToken');

        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await adminAuthApi.me();
          set({
            admin: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.removeItem('adminToken');
          set({
            admin: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
