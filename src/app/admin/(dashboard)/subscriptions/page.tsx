'use client';

import { useEffect, useState } from 'react';
import { adminSubscriptionsApi } from '@/lib/admin-api';

interface Subscription {
  id: number;
  tenant_id: number;
  plan: string;
  status: string;
  amount: number;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  tenant?: {
    id: number;
    name: string;
  };
}

interface PaginatedResponse {
  data: Subscription[];
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

const statusNames: Record<string, string> = {
  active: 'نشط',
  expired: 'منتهي',
  cancelled: 'ملغي',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.plan = planFilter;

      const res = await adminSubscriptionsApi.getAll(params);
      const data: PaginatedResponse = res.data;
      setSubscriptions(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page, search, statusFilter, planFilter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الاشتراكات</h1>
        <p className="text-sm text-gray-500 mt-1">إدارة جميع اشتراكات المستأجرين</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="بحث بالاسم أو المعرف..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="expired">منتهي</option>
          <option value="cancelled">ملغي</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">كل الخطط</option>
          <option value="free">مجاني</option>
          <option value="starter">المبتدئ</option>
          <option value="pro">المحترف</option>
          <option value="business">الأعمال</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-20 text-gray-500">لا توجد اشتراكات</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">#</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">المستأجر</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">الخطة</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">المبلغ</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">تاريخ البدء</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">تاريخ الانتهاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{sub.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {sub.tenant?.name || `#${sub.tenant_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                          {planNames[sub.plan] || sub.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[sub.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusNames[sub.status] || sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {sub.amount ? `${(sub.amount / 100).toLocaleString()} د.ج` : 'مجاني'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('ar-DZ') : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('ar-DZ') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-gray-500">
                  الإجمالي: {total} اشتراك
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    {page} / {lastPage}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(lastPage, page + 1))}
                    disabled={page === lastPage}
                    className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
