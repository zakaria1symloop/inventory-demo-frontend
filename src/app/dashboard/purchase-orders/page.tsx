'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { purchaseOrdersApi, suppliersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  DocumentDuplicateIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface PurchaseOrder {
  id: number;
  reference: string;
  supplier_id: number;
  warehouse_id: number;
  date: string;
  expected_delivery_date?: string;
  total_amount: number;
  discount: number;
  tax: number;
  shipping: number;
  grand_total: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  note?: string;
  supplier?: { id: number; name: string };
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
  purchase_id?: number;
}

interface Supplier { id: number; name: string; }

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        purchaseOrdersApi.getAll(),
        suppliersApi.getAll(),
      ]);
      setOrders(ordersRes.data.data || ordersRes.data);
      setSuppliers(suppliersRes.data.data || suppliersRes.data);
    } catch (error) {
      toast.error(t('purchases.dataLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('purchases.deletePoConfirm'))) return;
    try {
      await purchaseOrdersApi.delete(id);
      toast.success(t('purchases.deletePoSuccess'));
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.deletePoError');
      toast.error(message);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await purchaseOrdersApi.updateStatus(id, status);
      toast.success(t('purchases.statusUpdateSuccess'));
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.statusUpdateError');
      toast.error(message);
    }
  };

  const handleConvertToPurchase = async (id: number) => {
    if (!confirm(t('purchases.convertConfirm'))) return;
    try {
      await purchaseOrdersApi.convertToPurchase(id);
      toast.success(t('purchases.convertSuccess'));
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.convertError');
      toast.error(message);
    }
  };

  const handleDownloadPdf = async (id: number, reference: string) => {
    try {
      const response = await purchaseOrdersApi.downloadPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bon-commande-${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('purchases.downloadPoSuccess'));
    } catch (error) {
      toast.error(t('purchases.downloadPoError'));
    }
  };

  const handlePrintPdf = async (id: number) => {
    try {
      const response = await purchaseOrdersApi.streamPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      toast.error(t('purchases.printPoError'));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { dot: string; text: string }> = {
      draft:     { dot: 'metric-dot-neutral', text: t('purchases.draft') },
      sent:      { dot: 'metric-dot-blue',    text: t('purchases.sent') },
      confirmed: { dot: 'metric-dot-green',   text: t('purchases.confirmed') },
      received:  { dot: 'metric-dot-green',   text: t('purchases.received') },
      cancelled: { dot: 'metric-dot-red',     text: t('purchases.cancelled') },
    };
    return badges[status] || { dot: 'metric-dot-neutral', text: status };
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    const matchesSupplier = !supplierFilter || o.supplier_id === parseInt(supplierFilter);
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t('purchases.poTitle')} subtitle={t('purchases.poSubtitle')}>
        <Link
          href="/dashboard/purchase-orders/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t('purchases.addNewPo')}
        </Link>
      </PageHeader>

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('purchases.searchRefOrSupplier')}
      >
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t('purchases.allStatuses')}</option>
          <option value="draft">{t('purchases.draft')}</option>
          <option value="sent">{t('purchases.sent')}</option>
          <option value="confirmed">{t('purchases.confirmed')}</option>
          <option value="received">{t('purchases.received')}</option>
          <option value="cancelled">{t('purchases.cancelled')}</option>
        </select>
        <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
          <option value="">{t('purchases.allSuppliers')}</option>
          {suppliers.map(supplier => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>
      </FilterBar>

      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th>{t('purchases.reference')}</th>
              <th>{t('purchases.supplier')}</th>
              <th>{t('purchases.warehouse')}</th>
              <th className="text-end">{t('purchases.date')}</th>
              <th className="text-end">{t('purchases.total')}</th>
              <th>{t('purchases.status')}</th>
              <th>{t('purchases.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <DocumentDuplicateIcon className="w-6 h-6 text-gray-300 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('purchases.noPurchaseOrders')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const statusBadge = getStatusBadge(order.status);
                const canEdit = order.status === 'draft' || order.status === 'sent';
                const canDelete = order.status !== 'received';
                const canConvert = order.status === 'confirmed' || order.status === 'sent';

                return (
                  <tr key={order.id} className="group">
                    <td className="font-mono font-semibold text-gray-800 dark:text-gray-100">{order.reference}</td>
                    <td className="font-medium text-gray-700 dark:text-gray-300">{order.supplier?.name || '-'}</td>
                    <td className="text-gray-500">{order.warehouse?.name || '-'}</td>
                    <td className="text-gray-500 tnum">{formatDate(order.date)}</td>
                    <td className="font-semibold text-gray-800 dark:text-gray-100 tnum">{formatCurrency(order.grand_total)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className={`metric-dot ${statusBadge.dot}`} aria-hidden />
                        {statusBadge.text}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/purchase-orders/${order.id}`}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          title={t('purchases.viewDetails')}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>

                        {canEdit && (
                          <Link
                            href={`/dashboard/purchase-orders/${order.id}/edit`}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={t('purchases.edit')}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                        )}

                        <button
                          onClick={() => handleDownloadPdf(order.id, order.reference)}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          title={t('purchases.downloadPdf')}
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePrintPdf(order.id)}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          title={t('purchases.printBtn')}
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </button>

                        {order.status === 'draft' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'sent')}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={t('purchases.sendToSupplier')}
                          >
                            <PaperAirplaneIcon className="w-4 h-4" />
                          </button>
                        )}

                        {order.status === 'sent' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={t('purchases.confirmOrder')}
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}

                        {canConvert && (
                          <button
                            onClick={() => handleConvertToPurchase(order.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={t('purchases.receiveAndConvert')}
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                            title={t('purchases.delete')}
                          >
                            <TrashIcon className="w-4 h-4" />
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
  );
}
