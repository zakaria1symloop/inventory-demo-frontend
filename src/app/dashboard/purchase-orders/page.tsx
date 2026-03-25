'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { purchaseOrdersApi, suppliersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
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
    const badges: Record<string, { class: string; text: string }> = {
      draft: { class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', text: t('purchases.draft') },
      sent: { class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', text: t('purchases.sent') },
      confirmed: { class: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', text: t('purchases.confirmed') },
      received: { class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', text: t('purchases.received') },
      cancelled: { class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', text: t('purchases.cancelled') },
    };
    return badges[status] || { class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', text: status };
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DocumentDuplicateIcon className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">{t('purchases.poTitle')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('purchases.poSubtitle')}</p>
          </div>
        </div>
        <Link
          href="/dashboard/purchase-orders/new"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('purchases.addNewPo')}
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <DocumentDuplicateIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800 dark:text-green-200">{t('purchases.whatIsPo')}</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {t('purchases.poExplanation')}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder={t('purchases.searchRefOrSupplier')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select max-w-xs"
          >
            <option value="">{t('purchases.allStatuses')}</option>
            <option value="draft">{t('purchases.draft')}</option>
            <option value="sent">{t('purchases.sent')}</option>
            <option value="confirmed">{t('purchases.confirmed')}</option>
            <option value="received">{t('purchases.received')}</option>
            <option value="cancelled">{t('purchases.cancelled')}</option>
          </select>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="select max-w-xs"
          >
            <option value="">{t('purchases.allSuppliers')}</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>{t('purchases.reference')}</th>
                <th>{t('purchases.supplier')}</th>
                <th>{t('purchases.warehouse')}</th>
                <th>{t('purchases.date')}</th>
                <th>{t('purchases.total')}</th>
                <th>{t('purchases.status')}</th>
                <th>{t('purchases.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">{t('purchases.noPurchaseOrders')}</td></tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  const canEdit = order.status === 'draft' || order.status === 'sent';
                  const canDelete = order.status !== 'received';
                  const canConvert = order.status === 'confirmed' || order.status === 'sent';

                  return (
                    <tr key={order.id}>
                      <td className="font-medium dark:text-gray-200">{order.reference}</td>
                      <td className="dark:text-gray-300">{order.supplier?.name || '-'}</td>
                      <td className="dark:text-gray-300">{order.warehouse?.name || '-'}</td>
                      <td className="dark:text-gray-300">{formatDate(order.date)}</td>
                      <td className="font-semibold dark:text-gray-200">{formatCurrency(order.grand_total)}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {/* View */}
                          <Link
                            href={`/dashboard/purchase-orders/${order.id}`}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded"
                            title={t('purchases.viewDetails')}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>

                          {/* Edit */}
                          {canEdit && (
                            <Link
                              href={`/dashboard/purchase-orders/${order.id}/edit`}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-900/40 rounded"
                              title={t('purchases.edit')}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPdf(order.id, order.reference)}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-900/40 rounded"
                            title={t('purchases.downloadPdf')}
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>

                          {/* Print */}
                          <button
                            onClick={() => handlePrintPdf(order.id)}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-200 dark:hover:bg-purple-900/40 rounded"
                            title={t('purchases.printBtn')}
                          >
                            <PrinterIcon className="w-4 h-4" />
                          </button>

                          {/* Status Actions */}
                          {order.status === 'draft' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'sent')}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-200 dark:hover:bg-blue-900/40 rounded"
                              title={t('purchases.sendToSupplier')}
                            >
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                          )}

                          {order.status === 'sent' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-900/40 rounded"
                              title={t('purchases.confirmOrder')}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          )}

                          {/* Convert to Purchase */}
                          {canConvert && (
                            <button
                              onClick={() => handleConvertToPurchase(order.id)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-200 dark:hover:bg-emerald-900/40 rounded"
                              title={t('purchases.receiveAndConvert')}
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-200 dark:hover:bg-red-900/40 rounded"
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
    </div>
  );
}
