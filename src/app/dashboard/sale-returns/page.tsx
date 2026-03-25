'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { saleReturnsApi, clientsApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import { formatQty } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';

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

export default function SaleReturnsPage() {
  const { t, locale, dir } = useLocale();
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
  }, [clientFilter, warehouseFilter, fromDate, toDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Insert key or Alt+N: show info toast (no add modal exists)
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

  const handleSearch = () => {
    fetchReturns();
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

  const filteredReturns = returns.filter((r) => {
    if (!searchTerm) return true;
    return r.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading && returns.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-4 flex items-center gap-6 text-sm">
        <span className="font-medium">{t('saleReturns.shortcuts')}</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> {t('saleReturns.addNew')}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('saleReturns.title')}</h1>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <input
            type="text"
            placeholder={t('saleReturns.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="input"
          />
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="select"
          >
            <option value="">{t('saleReturns.allClients')}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="select"
          >
            <option value="">{t('saleReturns.allWarehouses')}</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
          <DateInput
            value={fromDate}
            onChange={(v) => setFromDate(v)}
            placeholder={t('saleReturns.fromDate')}
          />
          <DateInput
            value={toDate}
            onChange={(v) => setToDate(v)}
            placeholder={t('saleReturns.toDate')}
          />
        </div>

        {/* Table */}
        <table>
          <thead>
            <tr>
              <th>{t('saleReturns.reference')}</th>
              <th>{t('saleReturns.saleInvoice')}</th>
              <th>{t('saleReturns.client')}</th>
              <th>{t('saleReturns.warehouse')}</th>
              <th>{t('saleReturns.date')}</th>
              <th>{t('saleReturns.amount')}</th>
              <th>{t('saleReturns.status')}</th>
              <th>{t('saleReturns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {t('saleReturns.noReturns')}
                </td>
              </tr>
            ) : (
              filteredReturns.map((ret) => (
                <tr key={ret.id}>
                  <td className="font-mono text-sm">{ret.reference}</td>
                  <td>
                    <Link href={`/dashboard/sales/${ret.sale_id}`} className="text-blue-600 hover:underline">
                      {ret.sale?.reference}
                    </Link>
                  </td>
                  <td>{ret.client?.name || t('saleReturns.cashClient')}</td>
                  <td>{ret.warehouse?.name}</td>
                  <td>{formatDate(ret.date)}</td>
                  <td className="text-purple-600 font-medium">{formatCurrency(ret.total_amount)}</td>
                  <td>
                    <span className="badge bg-green-100 text-green-800">{ret.status}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => viewDetails(ret.id)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">{t('saleReturns.detailTitle', { ref: selectedReturn.reference })}</h2>
              <button onClick={() => setSelectedReturn(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('saleReturns.saleInvoiceLabel')}</span>
                <span className="me-2 font-medium dark:text-white">{selectedReturn.sale?.reference}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('saleReturns.clientLabel')}</span>
                <span className="me-2 font-medium dark:text-white">{selectedReturn.client?.name || t('saleReturns.cashClient')}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('saleReturns.warehouseLabel')}</span>
                <span className="me-2 font-medium dark:text-white">{selectedReturn.warehouse?.name}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('saleReturns.dateLabel')}</span>
                <span className="me-2 font-medium dark:text-white">{formatDate(selectedReturn.date)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('saleReturns.amountLabel')}</span>
                <span className="me-2 font-medium text-purple-600 dark:text-purple-400">{formatCurrency(selectedReturn.total_amount)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('saleReturns.userLabel')}</span>
                <span className="me-2 font-medium dark:text-white">{selectedReturn.user?.name}</span>
              </div>
            </div>

            {selectedReturn.note && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-750 rounded">
                <span className="text-gray-500 dark:text-gray-400">{t('saleReturns.notes')}</span>
                <p className="mt-1 dark:text-gray-200">{selectedReturn.note}</p>
              </div>
            )}

            <h3 className="font-semibold mb-2 dark:text-white">{t('saleReturns.products')}</h3>
            <table>
              <thead>
                <tr>
                  <th>{t('saleReturns.product')}</th>
                  <th>{t('saleReturns.quantity')}</th>
                  <th>{t('saleReturns.unitPrice')}</th>
                  <th>{t('saleReturns.total')}</th>
                  <th>{t('saleReturns.reason')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedReturn.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name}</td>
                    <td>{formatQty(item.quantity, item.product?.pieces_per_package)}</td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td>{formatCurrency(item.quantity * item.unit_price)}</td>
                    <td>{item.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedReturn(null)} className="btn btn-secondary">
                {t('saleReturns.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
