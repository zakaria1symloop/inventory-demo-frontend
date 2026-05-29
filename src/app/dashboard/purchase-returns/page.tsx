'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { purchaseReturnsApi, suppliersApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import { EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PurchaseReturnItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  reason?: string;
  product?: { id: number; name: string };
}

interface PurchaseReturn {
  id: number;
  reference: string;
  purchase_id: number;
  supplier_id?: number;
  warehouse_id: number;
  date: string;
  total_amount: number;
  status: string;
  note?: string;
  purchase?: { id: number; reference: string };
  supplier?: { id: number; name: string };
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
  items?: PurchaseReturnItem[];
}

interface Supplier { id: number; name: string; }
interface Warehouse { id: number; name: string; }

const STATUS_DOT: Record<string, string> = {
  pending: 'metric-dot-orange',
  approved: 'metric-dot-green',
  rejected: 'metric-dot-red',
  completed: 'metric-dot-blue',
  cancelled: 'metric-dot-neutral',
};

export default function PurchaseReturnsPage() {
  const { t, locale } = useLocale();
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierFilter, warehouseFilter, fromDate, toDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        toast(t('purchases.prAddNote'), { icon: 'ℹ️', duration: 4000 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [t]);

  const fetchData = async () => {
    try {
      const [suppliersRes, warehousesRes] = await Promise.all([
        suppliersApi.getAll(),
        warehousesApi.getAll(),
      ]);
      setSuppliers(suppliersRes.data.data || suppliersRes.data);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, unknown> = {};
      if (searchTerm) params.search = searchTerm;
      if (supplierFilter) params.supplier_id = supplierFilter;
      if (warehouseFilter) params.warehouse_id = warehouseFilter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const response = await purchaseReturnsApi.getAll(params);
      setReturns(response.data.data || response.data);
    } catch {
      toast.error(t('purchases.prLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const viewDetails = async (id: number) => {
    try {
      const response = await purchaseReturnsApi.getOne(id);
      setSelectedReturn(response.data);
    } catch {
      toast.error(t('purchases.prDetailError'));
    }
  };

  const intlLocale = locale === 'fr' ? 'fr-DZ' : 'ar-DZ';
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(intlLocale, { year: 'numeric', month: 'short', day: 'numeric' });

  const filteredReturns = returns.filter((r) => {
    if (!searchTerm) return true;
    return r.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const hasActiveFilters = !!(searchTerm || supplierFilter || warehouseFilter || fromDate || toDate);

  const clearFilters = () => {
    setSearchTerm('');
    setSupplierFilter('');
    setWarehouseFilter('');
    setFromDate('');
    setToDate('');
  };

  const statusLabel = (status: string): string => {
    const key = String(status || '').toLowerCase();
    const labels: Record<string, string> = {
      pending: t('purchases.statusPending') || 'pending',
      approved: t('purchases.statusApproved') || 'approved',
      rejected: t('purchases.statusRejected') || 'rejected',
      completed: t('purchases.statusCompleted') || 'completed',
      cancelled: t('purchases.statusCancelled') || 'cancelled',
    };
    return labels[key] || status;
  };

  if (isLoading && returns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('purchases.prTitle')} />

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('purchases.prSearchRef')}
        trailing={
          hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            >
              {t('purchases.prClearFilters')}
            </button>
          )
        }
      >
        <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
          <option value="">{t('purchases.allSuppliers')}</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
          <option value="">{t('purchases.allWarehouses')}</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <DateInput value={fromDate} onChange={setFromDate} placeholder={t('purchases.fromDate')} />
        <DateInput value={toDate} onChange={setToDate} placeholder={t('purchases.toDate')} />
      </FilterBar>

      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th className="text-end">{t('purchases.reference')}</th>
              <th>{t('purchases.prPurchaseInvoice')}</th>
              <th>{t('purchases.supplier')}</th>
              <th>{t('purchases.warehouse')}</th>
              <th className="text-end">{t('purchases.date')}</th>
              <th className="text-end">{t('purchases.prAmount')}</th>
              <th>{t('purchases.status')}</th>
              <th className="text-end">{t('purchases.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan={8} className="t-empty">{t('purchases.prNoReturns')}</td>
              </tr>
            ) : (
              filteredReturns.map((ret) => (
                <tr key={ret.id}>
                  <td className="t-strong tnum">{ret.reference}</td>
                  <td>
                    <Link
                      href={`/dashboard/purchases/${ret.purchase_id}`}
                      className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:underline"
                    >
                      {ret.purchase?.reference || '—'}
                    </Link>
                  </td>
                  <td>{ret.supplier?.name || '—'}</td>
                  <td>{ret.warehouse?.name || '—'}</td>
                  <td className="t-muted tnum">{formatDate(ret.date)}</td>
                  <td className="text-end tnum t-strong">{formatCurrency(ret.total_amount)}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                      <span
                        className={`metric-dot ${STATUS_DOT[String(ret.status || '').toLowerCase()] || 'metric-dot-neutral'}`}
                        aria-hidden
                      />
                      {statusLabel(ret.status)}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      onClick={() => viewDetails(ret.id)}
                      className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                      aria-label={t('purchases.prDetailTitle')}
                    >
                      <EyeIcon className="w-4 h-4" strokeWidth={1.7} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal — centered, enterprise chrome */}
      {selectedReturn && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedReturn(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[720px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  {t('purchases.prDetailTitle')} · {selectedReturn.reference}
                </h2>
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                  aria-label={t('purchases.close')}
                >
                  <XMarkIcon className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                  <Field label={t('purchases.prPurchaseInvoice')} value={selectedReturn.purchase?.reference || '—'} />
                  <Field label={t('purchases.supplier')} value={selectedReturn.supplier?.name || '—'} />
                  <Field label={t('purchases.warehouse')} value={selectedReturn.warehouse?.name || '—'} />
                  <Field label={t('purchases.date')} value={formatDate(selectedReturn.date)} />
                  <Field label={t('purchases.prAmount')} value={formatCurrency(selectedReturn.total_amount)} mono />
                  <Field label={t('purchases.prUser')} value={selectedReturn.user?.name || '—'} />
                </div>

                {selectedReturn.note && (
                  <div className="surface-pro !py-3">
                    <p className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      {t('purchases.notes')}
                    </p>
                    <p className="text-[13px] text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                      {selectedReturn.note}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {t('purchases.product')}
                  </p>
                  <div className="table-pro-wrap">
                    <table className="table-pro compact">
                      <thead>
                        <tr>
                          <th>{t('purchases.prProductCol')}</th>
                          <th className="text-center">{t('purchases.prQtyCol')}</th>
                          <th className="text-end">{t('purchases.prUnitPrice')}</th>
                          <th className="text-end">{t('purchases.prTotalCol')}</th>
                          <th>{t('purchases.prReason')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReturn.items && selectedReturn.items.length > 0 ? (
                          selectedReturn.items.map((item) => (
                            <tr key={item.id}>
                              <td className="t-strong">{item.product?.name || '—'}</td>
                              <td className="text-center tnum">{item.quantity}</td>
                              <td className="text-end tnum">{formatCurrency(item.unit_price)}</td>
                              <td className="text-end tnum t-strong">{formatCurrency(item.quantity * item.unit_price)}</td>
                              <td className="t-muted">{item.reason || '—'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="t-empty">—</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40">
                <button onClick={() => setSelectedReturn(null)} className="btn btn-secondary text-[13px] h-9 px-4">
                  {t('purchases.close')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`text-[13.5px] text-gray-900 dark:text-gray-100 font-medium leading-snug ${mono ? 'tnum' : ''}`}>
        {value}
      </p>
    </div>
  );
}
