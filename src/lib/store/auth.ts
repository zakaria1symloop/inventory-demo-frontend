import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'seller' | 'livreur' | 'cashvan';
  role_id?: number;
  permission_keys?: string[];
  avatar?: string;
  is_active: boolean;
  email_verified_at: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  features: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  fetchFeatures: () => Promise<void>;
  hasFeature: (key: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      features: [],
      isLoading: true,
      isAuthenticated: false,

      login: async (identifier: string, password: string) => {
        const response = await authApi.login(identifier, password);
        const { user, token, tenant_id } = response.data;

        localStorage.setItem('token', token);
        if (tenant_id) {
          localStorage.setItem('tenantId', String(tenant_id));
        }

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        }

        localStorage.removeItem('token');

        set({
          user: null,
          token: null,
          features: [],
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');

        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await authApi.getUser();
          set({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            features: [],
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      fetchFeatures: async () => {
        // Single-tenant: no feature gating, always show all
      },

      hasFeature: (key: string) => {
        const { features } = get();
        if (features.length === 0) return true; // No features loaded = show all
        return features.includes(key);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
