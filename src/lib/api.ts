import axios from 'axios';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rafik.tracksera.com/api';
console.log('API Base URL configured:', apiBaseUrl);

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (identifier: string, password: string) =>
    api.post('/login', { email: identifier, password }),
  register: (data: {
    register_with: 'email' | 'phone';
    company_name: string;
    name: string;
    email?: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) => api.post('/saas/register', data),
  googleAuth: (data: { credential: string; company_name?: string }) =>
    api.post('/saas/google-auth', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
  updateProfile: (data: { name: string; phone?: string }) =>
    api.put('/profile', data),
  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    api.put('/change-password', data),
};

// SaaS API (public, no tenant header)
export const saasApi = {
  forgotPassword: (email: string) =>
    api.post('/saas/forgot-password', { email }),
  resetPassword: (data: { email: string; otp: string; password: string; password_confirmation: string }) =>
    api.post('/saas/reset-password', data),
  sendVerificationOtp: (email: string) =>
    api.post('/saas/send-verification-otp', { email }),
  verifyEmail: (data: { email: string; otp: string }) =>
    api.post('/saas/verify-email', data),
};

// Tenant API
export const tenantApi = {
  getPlan: () => api.get('/tenant/plan'),
  getApps: () => api.get('/tenant/apps'),
};

// SaaS Payment API
export const saasPaymentApi = {
  upgrade: (plan: string) => api.post('/saas/payments/upgrade', { plan }),
  getStatus: (paymentId: number) => api.get(`/saas/payments/${paymentId}/status`),
  getHistory: () => api.get('/saas/payments/history'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
  getSalesChart: (params?: { period?: string }) => api.get('/dashboard/sales-chart', { params }),
  getTopProducts: (params?: { limit?: number }) => api.get('/dashboard/top-products', { params }),
  getTopClients: (params?: { limit?: number }) => api.get('/dashboard/top-clients', { params }),
  getLowStock: () => api.get('/dashboard/low-stock'),
  getSystemHealth: () => api.get('/dashboard/system-health'),
  fixMissingCaisses: () => api.post('/dashboard/fix-caisses'),
  getAppVersions: () => api.get('/tenant/apps'),
  uploadApk: (formData: FormData) =>
    api.post('/apps/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteApk: (type: string) => api.post('/apps/delete', { type }),
};

// Products API
export const productsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getOne: (id: number) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  generateBarcode: () => api.get('/products/generate-barcode'),
  findByBarcode: (barcode: string) => api.post('/products/find-by-barcode', { barcode }),
  getStock: (id: number) => api.get(`/products/${id}/stock`),
  getAvailableStock: (id: number, warehouseId: number) =>
    api.get(`/products/${id}/available-stock`, { params: { warehouse_id: warehouseId } }),
  getAvailableStockBulk: (warehouseId: number, productIds?: number[]) =>
    api.get('/products/available-stock/bulk', { params: { warehouse_id: warehouseId, product_ids: productIds } }),
  getPricesForClient: (clientId: number) =>
    api.get('/products/prices-for-client', { params: { client_id: clientId } }),
  downloadTemplate: () =>
    api.get('/products/import-template', { responseType: 'blob' }),
  previewImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  confirmImport: (rows: Record<string, unknown>[]) =>
    api.post('/products/import/confirm', { rows }),
};

// Categories API
export const categoriesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/categories', { params }),
  getOne: (id: number) => api.get(`/categories/${id}`),
  create: (data: Record<string, unknown>) => api.post('/categories', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Client Categories API
export const clientCategoriesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/client-categories', { params }),
  getOne: (id: number) => api.get(`/client-categories/${id}`),
  create: (data: Record<string, unknown>) => api.post('/client-categories', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/client-categories/${id}`, data),
  delete: (id: number) => api.delete(`/client-categories/${id}`),
};

// Brands API
export const brandsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/brands', { params }),
  getOne: (id: number) => api.get(`/brands/${id}`),
  create: (data: Record<string, unknown>) => api.post('/brands', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/brands/${id}`, data),
  delete: (id: number) => api.delete(`/brands/${id}`),
};

// Units API
export const unitsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/units', { params }),
  getOne: (id: number) => api.get(`/units/${id}`),
  create: (data: Record<string, unknown>) => api.post('/units', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/units/${id}`, data),
  delete: (id: number) => api.delete(`/units/${id}`),
  convert: (data: { from_unit_id: number; to_unit_id: number; quantity: number }) =>
    api.post('/units/convert', data),
};

// Warehouses API
export const warehousesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/warehouses', { params }),
  getOne: (id: number) => api.get(`/warehouses/${id}`),
  create: (data: Record<string, unknown>) => api.post('/warehouses', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/warehouses/${id}`, data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
  getStock: (id: number) => api.get(`/warehouses/${id}/stock`),
  assignUser: (id: number, userId: number | null) => api.post(`/warehouses/${id}/assign`, { user_id: userId }),
};

// Clients API
export const clientsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/clients', { params }),
  getOne: (id: number) => api.get(`/clients/${id}`),
  create: (data: Record<string, unknown>) => api.post('/clients', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/clients/${id}`, data),
  delete: (id: number) => api.delete(`/clients/${id}`),
  getBalance: (id: number) => api.get(`/clients/${id}/balance`),
  getOrders: (id: number) => api.get(`/clients/${id}/orders`),
  getSales: (id: number) => api.get(`/clients/${id}/sales`),
  getSalesDebt: (id: number) => api.get(`/clients/${id}/sales-debt`),
  transferWarehouse: (clientIds: number[], warehouseId: number) =>
    api.post('/clients/transfer-warehouse', { client_ids: clientIds, warehouse_id: warehouseId }),
  copyToWarehouse: (clientIds: number[], warehouseId: number) =>
    api.post('/clients/copy-warehouse', { client_ids: clientIds, warehouse_id: warehouseId }),
  cancelCopy: (id: number) => api.delete(`/clients/${id}/cancel-copy`),
  removeCopyFlag: (id: number) => api.post(`/clients/${id}/remove-copy-flag`),
  getStatement: (id: number, params?: Record<string, unknown>) =>
    api.get(`/clients/${id}/statement`, { params }),
  downloadStatement: (id: number, params?: Record<string, unknown>) =>
    api.get(`/clients/${id}/statement/pdf`, { params, responseType: 'blob' }),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/suppliers', { params }),
  getOne: (id: number) => api.get(`/suppliers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/suppliers', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
  getBalance: (id: number) => api.get(`/suppliers/${id}/balance`),
  getPurchases: (id: number) => api.get(`/suppliers/${id}/purchases`),
};

// Purchases API
export const purchasesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/purchases', { params }),
  getOne: (id: number) => api.get(`/purchases/${id}`),
  create: (data: Record<string, unknown>) => api.post('/purchases', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/purchases/${id}`, data),
  delete: (id: number) => api.delete(`/purchases/${id}`),
  createReturn: (id: number, data: Record<string, unknown>) => api.post(`/purchases/${id}/return`, data),
  confirm: (id: number, data?: Record<string, unknown>) => api.post(`/purchases/${id}/confirm`, data || {}),
  addPayment: (id: number, data: Record<string, unknown>) => api.post(`/purchases/${id}/payments`, data),
  downloadFacture: (id: number) => api.get(`/purchases/${id}/facture/pdf`, { responseType: 'blob' }),
  downloadBonCommande: (id: number) => api.get(`/purchases/${id}/bon-commande/pdf`, { responseType: 'blob' }),
  streamBonCommande: (id: number) => api.get(`/purchases/${id}/bon-commande/stream`, { responseType: 'blob' }),
};

// Purchase Orders API (Bons de Commande - no stock effect)
export const purchaseOrdersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/purchase-orders', { params }),
  getOne: (id: number) => api.get(`/purchase-orders/${id}`),
  create: (data: Record<string, unknown>) => api.post('/purchase-orders', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/purchase-orders/${id}`, data),
  delete: (id: number) => api.delete(`/purchase-orders/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/purchase-orders/${id}/status`, { status }),
  convertToPurchase: (id: number, data?: Record<string, unknown>) => api.post(`/purchase-orders/${id}/convert`, data || {}),
  downloadPdf: (id: number) => api.get(`/purchase-orders/${id}/pdf`, { responseType: 'blob' }),
  streamPdf: (id: number) => api.get(`/purchase-orders/${id}/stream`, { responseType: 'blob' }),
};

// Sales API
export const salesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/sales', { params }),
  getOne: (id: number) => api.get(`/sales/${id}`),
  create: (data: Record<string, unknown>) => api.post('/sales', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/sales/${id}`, data),
  delete: (id: number) => api.delete(`/sales/${id}`),
  confirm: (id: number, data?: Record<string, unknown>) => api.post(`/sales/${id}/confirm`, data || {}),
  createReturn: (id: number, data: Record<string, unknown>) => api.post(`/sales/${id}/return`, data),
  addPayment: (id: number, data: Record<string, unknown>) => api.post(`/sales/${id}/payments`, data),
  downloadFacture: (id: number) => api.get(`/sales/${id}/facture/pdf`, { responseType: 'blob' }),
  downloadBonLivraison: (id: number) => api.get(`/sales/${id}/bon-livraison/pdf`, { responseType: 'blob' }),
};

// Users API
export const usersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/users', { params }),
  getOne: (id: number) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: number, transferToAdmin?: boolean) =>
    api.delete(`/users/${id}`, { data: transferToAdmin ? { transfer_to_admin: true } : undefined }),
  resetPassword: (id: number, data: { password: string; password_confirmation: string }) =>
    api.post(`/users/${id}/reset-password`, data),
  toggleActive: (id: number) => api.post(`/users/${id}/toggle-active`),
  toggleCollectDebt: (id: number) => api.post(`/users/${id}/toggle-collect-debt`),
  getSellers: () => api.get('/sellers'),
  getLivreurs: () => api.get('/livreurs'),
};

// Vehicles API
export const vehiclesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/vehicles', { params }),
  getOne: (id: number) => api.get(`/vehicles/${id}`),
  create: (data: Record<string, unknown>) => api.post('/vehicles', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/vehicles/${id}`, data),
  delete: (id: number) => api.delete(`/vehicles/${id}`),
};

// Trips API
export const tripsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/trips', { params }),
  getOne: (id: number) => api.get(`/trips/${id}`),
  create: (data: Record<string, unknown>) => api.post('/trips', data),
  addStore: (tripId: number, data: { client_id: number }) => api.post(`/trips/${tripId}/stores`, data),
  visitStore: (tripId: number, storeId: number, data?: Record<string, unknown>) =>
    api.post(`/trips/${tripId}/stores/${storeId}/visit`, data),
  skipStore: (tripId: number, storeId: number, data?: { notes: string }) =>
    api.post(`/trips/${tripId}/stores/${storeId}/skip`, data),
  complete: (tripId: number) => api.post(`/trips/${tripId}/complete`),
  cancel: (tripId: number) => api.post(`/trips/${tripId}/cancel`),
};

// Orders API
export const ordersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  getOne: (id: number) => api.get(`/orders/${id}`),
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/orders/${id}`, data),
  delete: (id: number) => api.delete(`/orders/${id}`),
  confirm: (id: number, data?: Record<string, unknown>) => api.post(`/orders/${id}/confirm`, data),
  cancel: (id: number) => api.post(`/orders/${id}/cancel`),
  updateItemQuantity: (orderId: number, itemId: number, data: { quantity_confirmed: number }) =>
    api.put(`/orders/${orderId}/items/${itemId}`, data),
  getPending: () => api.get('/pending-orders'),
  getConfirmed: () => api.get('/confirmed-orders'),
  getUnassigned: () => api.get('/unassigned-orders'),
  getWithProblems: (params?: Record<string, unknown>) => api.get('/orders-with-problems', { params }),
  reportProblem: (id: number, data: { problem_description: string }) =>
    api.post(`/orders/${id}/report-problem`, data),
  resolveProblem: (id: number) => api.post(`/orders/${id}/resolve-problem`),
  downloadPdf: (id: number) => api.get(`/orders/${id}/pdf`, { responseType: 'blob' }),
  getPdfUrl: (id: number) => `${api.defaults.baseURL}/orders/${id}/pdf/stream`,
};

// Deliveries API
export const deliveriesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/deliveries', { params }),
  getOne: (id: number) => api.get(`/deliveries/${id}`),
  create: (data: Record<string, unknown>) => api.post('/deliveries', data),
  start: (id: number) => api.post(`/deliveries/${id}/start`),
  complete: (id: number) => api.post(`/deliveries/${id}/complete`),
  deliverOrder: (deliveryId: number, orderId: number, data?: Record<string, unknown>) =>
    api.post(`/deliveries/${deliveryId}/orders/${orderId}/deliver`, data),
  partialDelivery: (deliveryId: number, orderId: number, data: Record<string, unknown>) =>
    api.post(`/deliveries/${deliveryId}/orders/${orderId}/partial`, data),
  failOrder: (deliveryId: number, orderId: number, data: { reason: string }) =>
    api.post(`/deliveries/${deliveryId}/orders/${orderId}/fail`, data),
  postponeOrder: (deliveryId: number, orderId: number, data?: { notes: string }) =>
    api.post(`/deliveries/${deliveryId}/orders/${orderId}/postpone`, data),
  collectPayment: (deliveryId: number, orderId: number, data: { amount: number; notes?: string }) =>
    api.post(`/deliveries/${deliveryId}/orders/${orderId}/collect-payment`, data),
  processReturns: (id: number, data: { warehouse_id: number }) => api.post(`/deliveries/${id}/process-returns`, data),
  processReturn: (deliveryId: number, returnId: number, data: { warehouse_id: number }) =>
    api.post(`/deliveries/${deliveryId}/returns/${returnId}/process`, data),
  // Livreur-specific endpoints
  getMyActiveDelivery: () => api.get('/my-active-delivery'),
  getMyDeliveries: (params?: Record<string, unknown>) => api.get('/my-deliveries', { params }),
  getLivreurStock: () => api.get('/livreur-stock'),
  returnLivreurStock: (userId: number, data: { warehouse_id: number; items: Array<{ product_id: number; quantity: number; source_type: string; source_id: number | null }> }) =>
    api.post(`/livreur-stock/${userId}/return`, data),
};

// Van Sessions API (Selling from Van)
export const vanSessionsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/van-sessions', { params }),
  getOne: (id: number) => api.get(`/van-sessions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/van-sessions', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/van-sessions/${id}`, data),
  delete: (id: number) => api.delete(`/van-sessions/${id}`),
  start: (id: number) => api.post(`/van-sessions/${id}/start`),
  complete: (id: number) => api.post(`/van-sessions/${id}/complete`),
  cancel: (id: number) => api.post(`/van-sessions/${id}/cancel`),
  createSale: (sessionId: number, data: Record<string, unknown>) =>
    api.post(`/van-sessions/${sessionId}/sales`, data),
  getSales: (sessionId: number) => api.get(`/van-sessions/${sessionId}/sales`),
  getAvailableProducts: (sessionId: number) => api.get(`/van-sessions/${sessionId}/products`),
  getStats: (sessionId: number) => api.get(`/van-sessions/${sessionId}/stats`),
  getMyActiveSession: () => api.get('/my-active-van-session'),
};

// Product Requests API
export const productRequestsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/product-requests', { params }),
  getOne: (id: number) => api.get(`/product-requests/${id}`),
  create: (data: Record<string, unknown>) => api.post('/product-requests', data),
  approve: (id: number, data?: Record<string, unknown>) => api.post(`/product-requests/${id}/approve`, data),
  reject: (id: number, data?: Record<string, unknown>) => api.post(`/product-requests/${id}/reject`, data),
  fulfill: (id: number) => api.post(`/product-requests/${id}/fulfill`),
  pendingCount: () => api.get('/product-requests/pending-count'),
  update: (id: number, data: Record<string, unknown>) => api.put(`/product-requests/${id}`, data),
  delete: (id: number) => api.delete(`/product-requests/${id}`),
};

// Debtors API (Delivery-based only)
export const debtorsApi = {
  getAll: () => api.get('/debtors'),
  getClientDebt: (clientId: number) => api.get(`/debtors/${clientId}`),
};

// All Debtors API (Combined: Sales + Deliveries)
export const allDebtorsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/all-debtors', { params }),
  getClientDebt: (clientId: number) => api.get(`/all-debtors/${clientId}`),
};

// Creditors API (Suppliers we owe money to)
export const creditorsApi = {
  getAll: () => api.get('/creditors'),
  getSupplierDebt: (supplierId: number) => api.get(`/creditors/${supplierId}`),
};

// Adjustments API
export const adjustmentsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/adjustments', { params }),
  getOne: (id: number) => api.get(`/adjustments/${id}`),
  create: (data: Record<string, unknown>) => api.post('/adjustments', data),
  delete: (id: number) => api.delete(`/adjustments/${id}`),
  approve: (id: number) => api.post(`/adjustments/${id}/approve`),
  reject: (id: number) => api.post(`/adjustments/${id}/reject`),
};

// Payments API
export const paymentsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/payments', { params }),
  getOne: (id: number) => api.get(`/payments/${id}`),
  delete: (id: number) => api.delete(`/payments/${id}`),
};

// Stock Movements API
export const stockMovementsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/stock-movements', { params }),
  getByProduct: (productId: number, params?: Record<string, unknown>) =>
    api.get(`/stock-movements/product/${productId}`, { params }),
  getSummary: (params?: Record<string, unknown>) => api.get('/stock-movements/summary', { params }),
};

// Purchase Returns API
export const purchaseReturnsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/purchase-returns', { params }),
  getOne: (id: number) => api.get(`/purchase-returns/${id}`),
};

// Sale Returns API
export const saleReturnsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/sale-returns', { params }),
  getOne: (id: number) => api.get(`/sale-returns/${id}`),
};

// Location API
export const locationApi = {
  getAllDrivers: () => api.get('/location/drivers'),
  getActiveDrivers: (minutes?: number) => api.get('/location/drivers/active', { params: { minutes } }),
};

// Reports API
export const reportsApi = {
  // Sales Reports
  salesSummary: (params?: Record<string, unknown>) => api.get('/reports/sales/summary', { params }),
  salesByProduct: (params?: Record<string, unknown>) => api.get('/reports/sales/by-product', { params }),
  salesByClient: (params?: Record<string, unknown>) => api.get('/reports/sales/by-client', { params }),
  salesBySeller: (params?: Record<string, unknown>) => api.get('/reports/sales/by-seller', { params }),

  // Delivery Reports
  deliverySummary: (params?: Record<string, unknown>) => api.get('/reports/delivery/summary', { params }),
  deliveryByLivreur: (params?: Record<string, unknown>) => api.get('/reports/delivery/by-livreur', { params }),
  deliveryDetails: (params?: Record<string, unknown>) => api.get('/reports/delivery/details', { params }),

  // Stock Reports
  stockSummary: (params?: Record<string, unknown>) => api.get('/reports/stock/summary', { params }),
  stockMovements: (params?: Record<string, unknown>) => api.get('/reports/stock/movements', { params }),
  lowStockAlert: (params?: Record<string, unknown>) => api.get('/reports/stock/low-stock', { params }),

  // Financial Reports
  financialSummary: (params?: Record<string, unknown>) => api.get('/reports/financial/summary', { params }),
  clientBalances: (params?: Record<string, unknown>) => api.get('/reports/financial/client-balances', { params }),
  collectionsReport: (params?: Record<string, unknown>) => api.get('/reports/financial/collections', { params }),

  // Debt Reports
  debtSummary: (params?: Record<string, unknown>) => api.get('/reports/debt/summary', { params }),
  debtDetails: (params?: Record<string, unknown>) => api.get('/reports/debt/details', { params }),
  debtAging: (params?: Record<string, unknown>) => api.get('/reports/debt/aging', { params }),
  debtByClient: (clientId: number, params?: Record<string, unknown>) => api.get(`/reports/debt/client/${clientId}`, { params }),
};

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  getByGroup: (group: string) => api.get(`/settings/group/${group}`),
  update: (data: Record<string, unknown>) => api.put('/settings', data),
  uploadLogo: (formData: FormData) => api.post('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteLogo: () => api.delete('/settings/logo'),
  getCompanyInfo: () => api.get('/settings/company-info'),
  // Password protection
  hasPassword: () => api.get('/settings/has-password'),
  verifyPassword: (password: string) => api.post('/settings/verify-password', { password }),
  setPassword: (data: { current_password?: string; new_password: string }) =>
    api.post('/settings/set-password', data),
  removePassword: (password: string) => api.post('/settings/remove-password', { password }),
  // Backup & Restore
  createBackup: () =>
    api.post('/backup/create', {}, { responseType: 'blob', timeout: 300000 }),
  exportSql: () =>
    api.get('/backup/export-sql', { responseType: 'blob', timeout: 300000 }),
  restoreBackup: (file: File) => {
    const formData = new FormData();
    formData.append('backup', file);
    return api.post('/backup/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
    });
  },
  getBackupInfo: (file: File) => {
    const formData = new FormData();
    formData.append('backup', file);
    return api.post('/backup/info', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Employees API
export const employeesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/employees', { params }),
  getOne: (id: number) => api.get(`/employees/${id}`),
  getActive: () => api.get('/employees/active'),
  create: (data: Record<string, unknown>) => api.post('/employees', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
  toggleActive: (id: number) => api.post(`/employees/${id}/toggle-active`),
};

// Inventory API
export const inventoryApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/inventory', { params }),
  getByWarehouse: (warehouseId: number, params?: Record<string, unknown>) =>
    api.get(`/inventory/warehouse/${warehouseId}`, { params }),
  adjust: (data: { product_id: number; warehouse_id: number; quantity: number; type: string; reason?: string; is_loss?: boolean }) =>
    api.post('/inventory/adjust', data),
  count: (data: { product_id: number; warehouse_id: number; counted_quantity: number; notes?: string }) =>
    api.post('/inventory/count', data),
  transfer: (data: { product_id: number; from_warehouse_id: number; to_warehouse_id: number; quantity: number; notes?: string }) =>
    api.post('/inventory/transfer', data),
  getReport: (params: { warehouse_id: number; from_date?: string; to_date?: string }) =>
    api.get('/inventory/report', { params }),
};

// Caisses API
export const caissesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/caisses', { params }),
  getOne: (id: number) => api.get(`/caisses/${id}`),
  create: (data: { user_id: number; name?: string }) => api.post('/caisses', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/caisses/${id}`, data),
  getTransactions: (id: number, params?: Record<string, unknown>) =>
    api.get(`/caisses/${id}/transactions`, { params }),
  settle: (id: number, data: { amount: number; type: string; notes?: string }) =>
    api.post(`/caisses/${id}/settle`, data),
  adjust: (id: number, data: { amount: number; type: 'add' | 'remove'; notes?: string }) =>
    api.post(`/caisses/${id}/adjust`, data),
  transfer: (data: { from_caisse_id: number; to_caisse_id: number; amount: number; notes?: string }) =>
    api.post('/caisses/transfer', data),
  getMyCaisse: () => api.get('/caisses/my'),
  getSummary: () => api.get('/caisses/summary'),
};

// Stock Transfers API (Cashvan)
export const stockTransfersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/stock-transfers', { params }),
  getOne: (id: number) => api.get(`/stock-transfers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/stock-transfers', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/stock-transfers/${id}`, data),
  delete: (id: number) => api.delete(`/stock-transfers/${id}`),
  approve: (id: number) => api.post(`/stock-transfers/${id}/approve`),
  collect: (id: number, data?: { caisse_id?: number }) => api.post(`/stock-transfers/${id}/collect`, data),
};

// Dispenses (Expenses) API
export const dispensesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/dispenses', { params }),
  getOne: (id: number) => api.get(`/dispenses/${id}`),
  getCategories: () => api.get('/dispenses/categories'),
  getSummary: (params?: Record<string, unknown>) => api.get('/dispenses/summary', { params }),
  create: (data: Record<string, unknown>) => api.post('/dispenses', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/dispenses/${id}`, data),
  delete: (id: number) => api.delete(`/dispenses/${id}`),
};
