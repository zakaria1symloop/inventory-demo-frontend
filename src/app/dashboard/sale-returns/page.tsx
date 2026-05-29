'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { saleReturnsApi, clientsApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import { formatQty } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import { EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SaleReturnItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  reason?: string;
  product?: { id: number; name: string; pieces_per_package?: number };
}

interface SaleReturn {
  id: number;
  reference: string;
  sale_id: number;
  client_id?: number;
  warehouse_id: number;
  date: string;
  total_amount: number;
  status: string;
  note?: string;
  sale?: { id: number; reference: string };
  client?: { id: number; name: string };
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
  items?: SaleReturnItem[];
}

interface Client { id: number; name: string; }
interface Warehouse { id: number; name: string; }

const STATUS_DOT: Record<string, string> = {
  pending: 'metric-dot-orange',
  approved: 'metric-dot-green',
  rejected: 'metric-dot-red',
  completed: 'metric-dot-blue',
  cancelled: 'metric-dot-neutral',
};

export default function SaleReturnsPage() {
  const { t, locale } = useLocale();
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilter, warehouseFilter, fromDate, toDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        toast(t('saleReturns.returnsFromSaleInvoice'), { icon: 'ℹ️' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [t]);

  const fetchData = async () => {
    try {
      const [clientsRes, warehousesRes] = await Promise.all([
        clientsApi.getAll(),
        warehousesApi.getAll(),
      ]);
      setClients(clientsRes.data.data || clientsRes.data);
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
      if (clientFilter) params.client_id = clientFilter;
      if (warehouseFilter) params.warehouse_id = warehouseFilter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const response = await saleReturnsApi.getAll(params);
      setReturns(response.data.data || response.data);
    } catch (error) {
      toast.error(t('saleReturns.errorLoadingReturns'));
    } finally {
      setIsLoading(false);
    }
  };

  const viewDetails = async (id: number) => {
    try {
      const response = await saleReturnsApi.getOne(id);
      setSelectedReturn(response.data);
    } catch (error) {
      toast.error(t('saleReturns.errorLoadingDetails'));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusLabel = (status: string) => {
    const statusKey = String(status || '').toLowerCase();
    const labels: Record<string, string> = {
      pending: t('saleReturns.statusPending'),
      approved: t('saleReturns.statusApproved'),
      rejected: t('saleReturns.statusRejected'),
      completed: t('saleReturns.statusCompleted'),
      cancelled: t('saleReturns.statusCancelled'),
    };
    return labels[statusKey] || status;
  };

  const filteredReturns = returns.filter((r) => {
    if (!searchTerm) return true;
    return r.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const hasActiveFilters = !!(searchTerm || clientFilter || warehouseFilter || fromDate || toDate);

  if (isLoading && returns.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t('saleReturns.title')} />

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('saleReturns.searchPlaceholder')}
        trailing={
          hasActiveFilters ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setClientFilter('');
                setWarehouseFilter('');
                setFromDate('');
                setToDate('');
              }}
              className="text-[12px] font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {t('saleReturns.clearFilters')}
            </button>
          ) : undefined
        }
      >
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
        >
          <option value="">{t('saleReturns.allClients')}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
        >
          <option value="">{t('saleReturns.allWarehouses')}</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
          ))}
        </select>
        <DateInput value={fromDate} onChange={setFromDate} placeholder={t('saleReturns.fromDate')} />
        <DateInput value={toDate} onChange={setToDate} placeholder={t('saleReturns.toDate')} />
      </FilterBar>

      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th className="text-end">{t('saleReturns.reference')}</th>
              <th>{t('saleReturns.saleInvoice')}</th>
              <th>{t('saleReturns.client')}</th>
              <th>{t('saleReturns.warehouse')}</th>
              <th className="text-end">{t('saleReturns.date')}</th>
              <th className="text-end">{t('saleReturns.amount')}</th>
              <th>{t('saleReturns.status')}</th>
              <th className="text-end">{t('saleReturns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan={8} className="t-empty">{t('saleReturns.noReturns')}</td>
              </tr>
            ) : (
              filteredReturns.map((ret) => (
                <tr key={ret.id}>
                  <td className="t-strong tnum">{ret.reference}</td>
                  <td>
                    <Link
                      href={`/dashboard/sales/${ret.sale_id}`}
                      className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:underline"
                    >
                      {ret.sale?.reference || '—'}
                    </Link>
                  </td>
                  <td>{ret.client?.name || t('saleReturns.cashClient')}</td>
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
                      aria-label={t('saleReturns.detailTitle', { ref: ret.reference })}
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

      {/* Detail Modal */}
      {selectedReturn && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedReturn(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[720px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  {t('saleReturns.detailTitle', { ref: selectedReturn.reference })}
                </h2>
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                  aria-label={t('saleReturns.close')}
                >
                  <XMarkIcon className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                  <Field label={t('saleReturns.saleInvoiceLabel')} value={selectedReturn.sale?.reference || '—'} />
                  <Field label={t('saleReturns.clientLabel')} value={selectedReturn.client?.name || t('saleReturns.cashClient')} />
                  <Field label={t('saleReturns.warehouseLabel')} value={selectedReturn.warehouse?.name || '—'} />
                  <Field label={t('saleReturns.dateLabel')} value={formatDate(selectedReturn.date)} />
                  <Field label={t('saleReturns.amountLabel')} value={formatCurrency(selectedReturn.total_amount)} mono />
                  <Field label={t('saleReturns.userLabel')} value={selectedReturn.user?.name || '—'} />
                </div>

                {selectedReturn.note && (
                  <div className="surface-pro !py-3">
                    <p className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      {t('saleReturns.notes')}
                    </p>
                    <p className="text-[13px] text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                      {selectedReturn.note}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {t('saleReturns.products')}
                  </p>
                  <div className="table-pro-wrap">
                    <table className="table-pro compact">
                      <thead>
                        <tr>
                          <th>{t('saleReturns.product')}</th>
                          <th className="text-center">{t('saleReturns.quantity')}</th>
                          <th className="text-end">{t('saleReturns.unitPrice')}</th>
                          <th className="text-end">{t('saleReturns.total')}</th>
                          <th>{t('saleReturns.reason')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReturn.items && selectedReturn.items.length > 0 ? (
                          selectedReturn.items.map((item) => (
                            <tr key={item.id}>
                              <td className="t-strong">{item.product?.name || '—'}</td>
                              <td className="text-center tnum">{formatQty(item.quantity, item.product?.pieces_per_package)}</td>
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
                  {t('saleReturns.close')}
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
