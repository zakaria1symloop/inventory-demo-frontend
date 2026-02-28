'use client';

import { useEffect, useState } from 'react';
import { adminDashboardApi, adminTenantsApi } from '@/lib/admin-api';
import Link from 'next/link';

interface DashboardData {
  total_tenants: number;
  active_tenants: number;
  inactive_tenants: number;
  tenants_by_plan: Record<string, number>;
  revenue_estimate: number;
  unread_messages: number;
  latest_version: string;
  pending_updates: number;
  recent_tenants: Array<{
    id: number;
    name: string;
    plan: string;
    is_active: boolean;
    created_at: string;
  }>;
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

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const fetchData = () => {
    adminDashboardApi.getStats()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBulkUpdate = async () => {
    if (!data || data.pending_updates === 0) return;
    if (!confirm(`هل تريد تحديث ${data.pending_updates} مستأجر إلى الإصدار v${data.latest_version}؟\n\nسيتم تشغيل migrations على جميع المستأجرين المفعلين للتحديثات.`)) return;
    setBulkUpdating(true);
    setBulkResult(null);
    try {
      const res = await adminTenantsApi.pushBulkUpdate();
      setBulkResult(res.data.message);
      fetchData();
    } catch (error: any) {
      setBulkResult(error.response?.data?.message || 'فشل التحديث الجماعي');
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) return <p className="text-center text-gray-500 py-20">خطأ في تحميل البيانات</p>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي المستأجرين"
          value={data.total_tenants}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="مستأجرين نشطين"
          value={data.active_tenants}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="الإيرادات الشهرية (تقدير)"
          value={`${data.revenue_estimate.toLocaleString()} د.ج`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
          color="bg-amber-50 text-amber-600"
        />
        <Link href="/admin/messages">
          <StatCard
            label="رسائل غير مقروءة"
            value={data.unread_messages}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            }
            color="bg-red-50 text-red-600"
          />
        </Link>
      </div>

      {/* Pending Updates Banner */}
      {data.pending_updates > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                ⬆️
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {data.pending_updates} مستأجر بحاجة للتحديث
                </p>
                <p className="text-sm text-gray-500">
                  الإصدار الحالي: v{data.latest_version}
                </p>
              </div>
            </div>
            <button
              onClick={handleBulkUpdate}
              disabled={bulkUpdating}
              className="px-5 py-2.5 text-sm font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {bulkUpdating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري التحديث...
                </span>
              ) : (
                'تحديث الكل'
              )}
            </button>
          </div>
          {bulkResult && (
            <p className="mt-3 text-sm font-medium text-gray-700 bg-white rounded-lg p-3">
              {bulkResult}
            </p>
          )}
        </div>
      )}

      {/* Tenants by Plan */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">المستأجرين حسب الخطة</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {['free', 'starter', 'pro', 'business'].map((plan) => (
            <div key={plan} className="text-center p-4 bg-gray-50 rounded-xl">
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${planColors[plan]}`}>
                {planNames[plan]}
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{data.tenants_by_plan[plan] || 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">آخر المستأجرين</h3>
          <Link href="/admin/tenants" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            عرض الكل
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-right py-3 px-2 font-medium">ID</th>
                <th className="text-right py-3 px-2 font-medium">الاسم</th>
                <th className="text-right py-3 px-2 font-medium">الخطة</th>
                <th className="text-right py-3 px-2 font-medium">الحالة</th>
                <th className="text-right py-3 px-2 font-medium">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-500">#{tenant.id}</td>
                  <td className="py-3 px-2 font-medium">
                    <Link href={`/admin/tenants/${tenant.id}`} className="text-blue-600 hover:underline">
                      {tenant.name}
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${planColors[tenant.plan]}`}>
                      {planNames[tenant.plan]}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tenant.is_active ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-500">
                    {new Date(tenant.created_at).toLocaleDateString('ar-DZ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
