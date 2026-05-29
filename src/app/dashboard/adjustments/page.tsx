'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adjustmentsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import { PlusIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Adjustment {
  id: number;
  reference: string;
  warehouse_id: number;
  user_id: number;
  date: string;
  type: 'addition' | 'subtraction';
  reason?: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
}

export default function AdjustmentsPage() {
  const router = useRouter();
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { t, locale } = useLocale();

  useEffect(() => {
    fetchAdjustments();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        router.push('/dashboard/adjustments/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const fetchAdjustments = async () => {
    try {
      const response = await adjustmentsApi.getAll();
      setAdjustments(response.data.data || response.data);
    } catch (error) {
      toast.error(t('common.loadError', { item: t('stock.adjustmentsTitle') }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm(t('stock.confirmApprove'))) return;
    try {
      await adjustmentsApi.approve(id);
      toast.success(t('stock.approvedSuccess'));
      fetchAdjustments();
    } catch (error) {
      toast.error(t('stock.approveError'));
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm(t('stock.confirmReject'))) return;
    try {
      await adjustmentsApi.reject(id);
      toast.success(t('stock.rejectedSuccess'));
      fetchAdjustments();
    } catch (error) {
      toast.error(t('stock.rejectError'));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ');
  };

  const getTypeInfo = (type: string): { dot: string; text: string } => {
    return type === 'addition'
      ? { dot: 'metric-dot-green', text: t('stock.addition') }
      : { dot: 'metric-dot-red', text: t('stock.subtraction') };
  };

  const getStatusInfo = (status: string): { dot: string; text: string } => {
    const map: Record<string, { dot: string; text: string }> = {
      pending: { dot: 'metric-dot-orange', text: t('stock.pending') },
      approved: { dot: 'metric-dot-green', text: t('stock.approved') },
      rejected: { dot: 'metric-dot-red', text: t('stock.rejected') },
    };
    return map[status] || { dot: 'metric-dot-neutral', text: status };
  };

  const filteredAdjustments = adjustments.filter(a => {
    const matchesSearch = a.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <PageHeader title={t('stock.adjustmentsTitle')}>
        <button
          onClick={() => router.push('/dashboard/adjustments/new')}
          className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          {t('stock.addAdjustment')}
        </button>
      </PageHeader>

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.search')}
      >
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t('stock.allStatuses')}</option>
          <option value="pending">{t('stock.pending')}</option>
          <option value="approved">{t('stock.approved')}</option>
          <option value="rejected">{t('stock.rejected')}</option>
        </select>
      </FilterBar>

      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th>{t('stock.reference')}</th>
              <th>{t('stock.warehouse')}</th>
              <th>{t('stock.userCol')}</th>
              <th>{t('common.date')}</th>
              <th>{t('stock.type')}</th>
              <th className="text-end">{t('stock.value')}</th>
              <th>{t('stock.reason')}</th>
              <th>{t('common.status')}</th>
              <th className="text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdjustments.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 t-muted">{t('stock.noAdjustments')}</td></tr>
            ) : (
              filteredAdjustments.map((adj) => {
                const typeInfo = getTypeInfo(adj.type);
                const statusInfo = getStatusInfo(adj.status);
                return (
                  <tr key={adj.id}>
                    <td>
                      <span className="font-mono font-semibold text-gray-800 dark:text-gray-100">{adj.reference}</span>
                    </td>
                    <td>{adj.warehouse?.name || '-'}</td>
                    <td className="t-muted">{adj.user?.name || '-'}</td>
                    <td className="tnum t-muted">{formatDate(adj.date)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className={`metric-dot ${typeInfo.dot}`} aria-hidden />
                        {typeInfo.text}
                      </span>
                    </td>
                    <td className="tnum t-strong">{formatCurrency(adj.total_amount)}</td>
                    <td className="t-muted">{adj.reason || '-'}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className={`metric-dot ${statusInfo.dot}`} aria-hidden />
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/adjustments/${adj.id}`)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title={t('stock.viewDetails')}
                        >
                          <EyeIcon className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                        {adj.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(adj.id)}
                              className="p-1.5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                              title={t('stock.approve')}
                            >
                              <CheckIcon className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => handleReject(adj.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                              title={t('stock.reject')}
                            >
                              <XMarkIcon className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </>
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
  );
}
