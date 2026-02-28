'use client';

import { useEffect, useState } from 'react';
import { adminPaymentsApi } from '@/lib/admin-api';

interface Payment {
  id: number;
  tenant_id: number;
  plan_from: string;
  plan_to: string;
  amount: string;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  tenant?: {
    id: number;
    name: string;
  };
}

interface PaymentsSummary {
  total_paid: string;
  this_month: string;
  pending_count: number;
}

interface PaginatedPayments {
  data: Payment[];
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
  paid: 'مدفوع',
  pending: 'معلق',
  failed: 'فشل',
};

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await adminPaymentsApi.getAll(params);
      const paginatedData: PaginatedPayments = res.data.payments;
      setPayments(paginatedData.data);
      setLastPage(paginatedData.last_page);
      setTotal(paginatedData.total);
      setSummary(res.data.summary);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, search, statusFilter, fromDate, toDate]);

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toLocaleString()} د.ج`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">المدفوعات</h1>
        <p className="text-sm text-gray-500 mt-1">تتبع جميع مدفوعات المنصة</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500 mb-1">إجمالي المدفوعات</p>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.total_paid)}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500 mb-1">هذا الشهر</p>
            <p className="text-2xl font-bold text-green-600">{formatAmount(summary.this_month)}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500 mb-1">معلقة</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pending_count}</p>
          </div>
        </div>
      )}

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
          <option value="paid">مدفوع</option>
          <option value="pending">معلق</option>
          <option value="failed">فشل</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="من تاريخ"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="إلى تاريخ"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">لا توجد مدفوعات</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">#</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">المستأجر</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">الترقية</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">المبلغ</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{payment.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {payment.tenant?.name || `#${payment.tenant_id}`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="text-gray-400">{planNames[payment.plan_from] || payment.plan_from}</span>
                        <span className="mx-1">&rarr;</span>
                        <span className="font-medium">{planNames[payment.plan_to] || payment.plan_to}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatAmount(payment.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[payment.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusNames[payment.status] || payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {payment.paid_at
                          ? new Date(payment.paid_at).toLocaleDateString('ar-DZ')
                          : new Date(payment.created_at).toLocaleDateString('ar-DZ')}
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
                  الإجمالي: {total} عملية دفع
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
