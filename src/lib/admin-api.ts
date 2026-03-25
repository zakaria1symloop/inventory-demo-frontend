import axios from 'axios';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://logistics-demo.symloop.com/api';

const adminApi = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor — uses adminToken, never sends X-Tenant-Id
adminApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — 401 redirects to /admin/login
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;

// Admin Auth API
export const adminAuthApi = {
  login: (email: string, password: string) =>
    adminApi.post('/admin/login', { email, password }),
  logout: () => adminApi.post('/admin/logout'),
  me: () => adminApi.get('/admin/me'),
};

// Admin Dashboard API
export const adminDashboardApi = {
  getStats: () => adminApi.get('/admin/dashboard'),
};

// Admin Tenants API
export const adminTenantsApi = {
  getAll: (params?: Record<string, unknown>) => adminApi.get('/admin/tenants', { params }),
  getOne: (id: number) => adminApi.get(`/admin/tenants/${id}`),
  updatePlan: (id: number, plan: string) => adminApi.put(`/admin/tenants/${id}/plan`, { plan }),
  toggleActive: (id: number) => adminApi.post(`/admin/tenants/${id}/toggle-active`),
  getProductCount: (id: number) => adminApi.get(`/admin/tenants/${id}/product-count`),
  grantFullAccess: (id: number) => adminApi.post(`/admin/tenants/${id}/grant-full-access`),
  toggleUpdates: (id: number) => adminApi.post(`/admin/tenants/${id}/toggle-updates`),
  pushUpdate: (id: number) => adminApi.post(`/admin/tenants/${id}/push-update`),
  pushBulkUpdate: () => adminApi.post(`/admin/tenants/bulk-update`),
  getUpdateLogs: (id: number) => adminApi.get(`/admin/tenants/${id}/update-logs`),
  getFeatures: (id: number) => adminApi.get(`/admin/tenants/${id}/features`),
  updateFeatures: (id: number, features: string[]) => adminApi.put(`/admin/tenants/${id}/features`, { features }),
  resetFeatures: (id: number) => adminApi.post(`/admin/tenants/${id}/reset-features`),
  updateStatus: (id: number, data: { action: string; deactivate_at?: string }) =>
    adminApi.post(`/admin/tenants/${id}/update-status`, data),
  createUser: (id: number, data: { name: string; email: string; password: string; role: string; force?: boolean }) =>
    adminApi.post(`/admin/tenants/${id}/users`, data),
  impersonate: (id: number) => adminApi.post(`/admin/tenants/${id}/impersonate`),
  toggleUserVerification: (tenantId: number, userId: number) =>
    adminApi.post(`/admin/tenants/${tenantId}/users/${userId}/toggle-verification`),
  toggleOtpRequired: (id: number) => adminApi.post(`/admin/tenants/${id}/toggle-otp`),
  exportSql: (id: number) => adminApi.get(`/admin/tenants/${id}/export-sql`, { responseType: 'blob', timeout: 300000 }),
  delete: (id: number) => adminApi.delete(`/admin/tenants/${id}`),
};

// Admin Contact Messages API
export const adminMessagesApi = {
  getAll: (params?: Record<string, unknown>) => adminApi.get('/admin/contact-messages', { params }),
  getOne: (id: number) => adminApi.get(`/admin/contact-messages/${id}`),
  markAsRead: (id: number) => adminApi.post(`/admin/contact-messages/${id}/read`),
  delete: (id: number) => adminApi.delete(`/admin/contact-messages/${id}`),
};

// Admin Subscriptions API
export const adminSubscriptionsApi = {
  getAll: (params?: Record<string, unknown>) => adminApi.get('/admin/subscriptions', { params }),
};

// Admin Payments API
export const adminPaymentsApi = {
  getAll: (params?: Record<string, unknown>) => adminApi.get('/admin/payments', { params }),
};

// Admin Settings API
export const adminSettingsApi = {
  listAdmins: () => adminApi.get('/admin/settings/admins'),
  createAdmin: (data: { name: string; email: string; password: string }) =>
    adminApi.post('/admin/settings/admins', data),
  toggleAdminActive: (id: number) => adminApi.post(`/admin/settings/admins/${id}/toggle-active`),
  deleteAdmin: (id: number) => adminApi.delete(`/admin/settings/admins/${id}`),
};

// Admin APK Management API
export const adminApksApi = {
  getAll: () => adminApi.get('/admin/apks'),
  upload: (file: File, type: string, version: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('version', version);
    return adminApi.post('/admin/apks/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (type: string) => adminApi.post('/admin/apks/delete', { type }),
};

// Public Contact API (no auth needed)
export const contactApi = {
  send: (data: { name: string; email: string; phone?: string; company?: string; message: string }) =>
    axios.post(`${apiBaseUrl}/contact`, data),
};
