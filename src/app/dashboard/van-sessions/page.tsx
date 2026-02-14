'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { vanSessionsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { VanSession } from '@/lib/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const statusLabels: Record<string, { class: string; text: string }> = {
  preparing: { class: 'badge-warning', text: 'في الانتظار' },
  active: { class: 'badge-success', text: 'نشطة' },
  completed: { class: 'badge-info', text: 'مكتملة' },
  cancelled: { class: 'badge-danger', text: 'ملغية' },
};

export default function VanSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<VanSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        router.push('/dashboard/van-sessions/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const fetchSessions = async () => {
    try {
      const response = await vanSessionsApi.getAll({ per_page: 50 });
      setSessions(response.data.data || response.data);
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setIsCancelling(true);
    try {
      await vanSessionsApi.cancel(cancelId);
      toast.success('تم إلغاء الجلسة');
      setCancelId(null);
      fetchSessions();
    } catch {
      toast.error('خطأ في إلغاء الجلسة');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('ar-DZ');
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);

  const filteredSessions = sessions.filter(s => !statusFilter || s.status === statusFilter);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-4 flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> إضافة جديد</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">جلسات البيع المتنقل</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة جلسات البيع المتنقل</p>
        </div>
        <Link href="/dashboard/van-sessions/new" className="btn btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          جلسة جديدة
          <kbd className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs mr-1">Insert</kbd>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="text-yellow-600 dark:text-yellow-400 text-sm">في الانتظار</div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {sessions.filter(s => s.status === 'preparing').length}
          </div>
        </div>
        <div className="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-green-600 dark:text-green-400 text-sm">نشطة</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {sessions.filter(s => s.status === 'active').length}
          </div>
        </div>
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="text-blue-600 dark:text-blue-400 text-sm">مكتملة</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {sessions.filter(s => s.status === 'completed').length}
          </div>
        </div>
        <div className="card bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <div className="text-purple-600 dark:text-purple-400 text-sm">إجمالي المبيعات</div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {formatCurrency(sessions.reduce((sum, s) => sum + (s.total_sales || 0), 0))}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="card">
        <div className="flex gap-4 mb-4">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select max-w-xs">
            <option value="">كل الحالات</option>
            <option value="preparing">في الانتظار</option>
            <option value="active">نشطة</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغية</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>المرجع</th>
                <th>السائق</th>
                <th>المستودع</th>
                <th>المركبة</th>
                <th>التاريخ</th>
                <th>قيمة التحميل</th>
                <th>المبيعات</th>
                <th>المحصل</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500 dark:text-gray-400">لا توجد جلسات</td></tr>
              ) : (
                filteredSessions.map((session) => {
                  const badge = statusLabels[session.status] || { class: 'badge-secondary', text: session.status };
                  return (
                    <tr key={session.id}>
                      <td className="font-medium">{session.reference || `#${session.id}`}</td>
                      <td>{session.livreur?.name || '-'}</td>
                      <td>{session.warehouse?.name || '-'}</td>
                      <td>{session.vehicle?.name || '-'}</td>
                      <td>{formatDate(session.date)}</td>
                      <td>{formatCurrency(session.total_loaded_value || 0)}</td>
                      <td className="font-medium">{session.sales_count || 0}</td>
                      <td className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(session.total_collected || 0)}</td>
                      <td><span className={`badge ${badge.class}`}>{badge.text}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/van-sessions/${session.id}`}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"
                            title="عرض التفاصيل"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          {(session.status === 'preparing' || session.status === 'active') && (
                            <button
                              onClick={() => setCancelId(session.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
                              title="إلغاء الجلسة"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={cancelId !== null}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="إلغاء الجلسة"
        message="هل أنت متأكد من إلغاء هذه الجلسة؟ سيتم إرجاع المخزون للمستودع."
        isLoading={isCancelling}
      />
    </div>
  );
}
