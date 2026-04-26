'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminTenantsApi } from '@/lib/admin-api';
import Link from 'next/link';

interface Tenant {
  id: number;
  name: string;
  plan: string;
  product_limit: number;
  user_limit: number;
  is_active: boolean;
  deactivate_at: string | null;
  updates_enabled: boolean;
  app_version: string;
  trial_ends_at: string | null;
  created_at: string;
}

interface PaginatedResponse {
  data: Tenant[];
  current_page: number;
  last_page: number;
  total: number;
}

const planNames: Record<string, string> = {
  free: 'مجاني',
  starter: 'المبتدئ',
  pro: 'المحترف',
  business: 'الأعمال',
};

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  business: 'bg-amber-100 text-amber-700',
};

export default function AdminTenantsPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 15 };
      if (search) params.search = search;
      if (planFilter) params.plan = planFilter;
      if (statusFilter !== '') params.is_active = statusFilter;

      const res = await adminTenantsApi.getAll(params);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, statusFilter, page]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleToggleActive = async (id: number) => {
    try {
      await adminTenantsApi.toggleActive(id);
      fetchTenants();
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportSql = async (tenant: Tenant) => {
    setExportingId(tenant.id);
    try {
      const response = await adminTenantsApi.exportSql(tenant.id);
      const blob = new Blob([response.data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tenant.name}_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert('خطأ في تصدير قاعدة البيانات');
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await adminTenantsApi.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchTenants();
    } catch (error) {
      console.error(error);
      alert('خطأ في حذف المستأجر');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="بحث بالاسم أو ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الخطط</option>
            <option value="free">مجاني</option>
            <option value="starter">المبتدئ</option>
            <option value="pro">المحترف</option>
            <option value="business">الأعمال</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الحالات</option>
            <option value="1">نشط</option>
            <option value="0">معطل</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="text-center text-gray-500 py-20">لا يوجد مستأجرين</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-500">
                    <th className="text-right py-3 px-4 font-medium">ID</th>
                    <th className="text-right py-3 px-4 font-medium">الاسم</th>
                    <th className="text-right py-3 px-4 font-medium">الخطة</th>
                    <th className="text-right py-3 px-4 font-medium">حد المنتجات</th>
                    <th className="text-right py-3 px-4 font-medium">حد المستخدمين</th>
                    <th className="text-right py-3 px-4 font-medium">الحالة</th>
                    <th className="text-right py-3 px-4 font-medium">الإصدار</th>
                    <th className="text-right py-3 px-4 font-medium">تاريخ التسجيل</th>
                    <th className="text-right py-3 px-4 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((tenant) => (
                    <tr key={tenant.id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">#{tenant.id}</td>
                      <td className="py-3 px-4 font-medium">
                        <Link href={`/admin/tenants/${tenant.id}`} className="text-blue-600 hover:underline">
                          {tenant.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${planColors[tenant.plan]}`}>
                          {planNames[tenant.plan]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{tenant.product_limit}</td>
                      <td className="py-3 px-4 text-gray-600">{tenant.user_limit >= 999999 ? '∞' : tenant.user_limit}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {tenant.is_active ? 'نشط' : 'معطل'}
                          </span>
                          {tenant.deactivate_at && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700" title={`سيتم التعطيل في ${new Date(tenant.deactivate_at).toLocaleDateString('ar-DZ')}`}>
                              &#9200; {Math.ceil((new Date(tenant.deactivate_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}ي
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          tenant.updates_enabled ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          v{tenant.app_version || '1.0'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(tenant.created_at).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/tenants/${tenant.id}`}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            تفاصيل
                          </Link>
                          <button
                            onClick={() => handleExportSql(tenant)}
                            disabled={exportingId === tenant.id}
                            className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            title="تصدير SQL"
                          >
                            {exportingId === tenant.id ? (
                              <div className="spinner w-3.5 h-3.5"></div>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleActive(tenant.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              tenant.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {tenant.is_active ? 'تعطيل' : 'تفعيل'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(tenant)}
                            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="حذف المستأجر"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">
                  إجمالي {data.total} مستأجر
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <span className="text-sm text-gray-600">
                    {data.current_page} / {data.last_page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
                    disabled={page === data.last_page}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">حذف المستأجر</h3>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 font-medium mb-2">
                هل أنت متأكد من حذف المستأجر التالي؟ سيتم حذف قاعدة البيانات وجميع البيانات نهائياً.
              </p>
              <p className="text-sm text-red-600">
                هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <p><span className="text-gray-500">الاسم:</span> <span className="font-medium">{deleteConfirm.name}</span></p>
              <p><span className="text-gray-500">ID:</span> <span className="font-medium">#{deleteConfirm.id}</span></p>
              <p><span className="text-gray-500">الخطة:</span> <span className="font-medium">{planNames[deleteConfirm.plan]}</span></p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
