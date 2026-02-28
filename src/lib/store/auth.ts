import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, tenantApi } from '../api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'seller' | 'livreur' | 'cashvan';
  avatar?: string;
  is_active: boolean;
  email_verified_at: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  tenantName: string | null;
  features: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { company_name: string; name: string; email: string; password: string; password_confirmation: string }) => Promise<void>;
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
      tenantId: null,
      tenantName: null,
      features: [],
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await authApi.login(email, password);
        const { user, token, tenant_id } = response.data;

        localStorage.setItem('token', token);
        if (tenant_id) {
          localStorage.setItem('tenantId', String(tenant_id));
        }

        set({
          user,
          token,
          tenantId: tenant_id ? String(tenant_id) : null,
          isAuthenticated: true,
          isLoading: false,
        });

        // Fetch tenant features after login
        get().fetchFeatures();
      },

      register: async (data) => {
        const response = await authApi.register(data);
        const { user, token, tenant_id } = response.data;

        localStorage.setItem('token', token);
        if (tenant_id) {
          localStorage.setItem('tenantId', String(tenant_id));
        }

        set({
          user,
          token,
          tenantId: tenant_id ? String(tenant_id) : null,
          isAuthenticated: true,
          isLoading: false,
        });

        // Fetch tenant features after register
        get().fetchFeatures();
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        }

        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');

        set({
          user: null,
          token: null,
          tenantId: null,
          tenantName: null,
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
          const tenantId = localStorage.getItem('tenantId');
          set({
            user: response.data,
            token,
            tenantId,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch tenant features after auth check
          get().fetchFeatures();
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('tenantId');
          set({
            user: null,
            token: null,
            tenantId: null,
            tenantName: null,
            features: [],
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      fetchFeatures: async () => {
        try {
          const response = await tenantApi.getPlan();
          const features = response.data.features || [];
          const tenantName = response.data.tenant_name || null;
          set({ features, tenantName });
        } catch {
          // Silently fail — features will be empty (show all by default)
        }
      },

      hasFeature: (key: string) => {
        const { features } = get();
        if (features.length === 0) return true; // No features loaded = show all
        return features.includes(key);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, tenantId: state.tenantId }),
    }
  )
);
