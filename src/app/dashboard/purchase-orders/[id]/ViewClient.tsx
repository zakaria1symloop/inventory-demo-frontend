'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { purchaseOrdersApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import { ArrowLeftIcon, PencilIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface POItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  subtotal: number;
  product?: { id: number; name: string; barcode?: string; pieces_per_package?: number; unit_buy?: { name: string; short_name: string } };
}

interface PurchaseOrder {
  id: number;
  reference: string;
  supplier_id: number | null;
  warehouse_id: number;
  date: string;
  expected_delivery_date?: string | null;
  total_amount: number;
  discount: number;
  tax: number;
  shipping: number;
  grand_total: number;
  status: 'pending' | 'confirmed' | 'received' | 'cancelled' | string;
  note?: string;
  terms?: string;
  supplier?: { id: number; name: string; phone?: string };
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
  items?: POItem[];
  purchase?: { id: number; reference: string } | null;
}

export default function ViewClient() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const id = params?.id ? parseInt(params.id as string) : null;

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(id)) return;
    (async () => {
      try {
        const res = await purchaseOrdersApi.getOne(id);
        setOrder(res.data.data || res.data);
      } catch {
        toast.error(t('purchases.dataLoadError') || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  const formatCurrency = (value: number) => {
    const safe = isNaN(Number(value)) ? 0 : Number(value);
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(safe);
  };

  const handleDownloadPdf = async () => {
    if (!order) return;
    try {
      const res = await purchaseOrdersApi.downloadPdf(order.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.reference || 'purchase-order'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('purchases.pdfDownloadError') || 'PDF download failed');
    }
  };

  if (!id || isNaN(id)) {
    return <div className="p-6">{t('purchases.invalidInvoiceId') || 'Invalid order ID'}</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  if (!order) {
    return <div className="p-6">{t('purchases.orderNotFound') || 'Order not found'}</div>;
  }

  const statusLabel: Record<string, string> = {
    pending: t('purchases.statusPending') || 'Pending',
    confirmed: t('purchases.statusConfirmed') || 'Confirmed',
    received: t('purchases.statusReceived') || 'Received',
    cancelled: t('purchases.statusCancelled') || 'Cancelled',
  };
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    received: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/purchase-orders" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{order.reference}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabel[order.status] || order.status}
              </span>
              {order.purchase && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('purchases.convertedTo') || 'Converted to purchase'}: {order.purchase.reference}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadPdf} className="btn btn-secondary inline-flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" />
            {t('purchases.downloadPdf') || 'PDF'}
          </button>
          {order.status !== 'received' && order.status !== 'cancelled' && (
            <Link href={`/dashboard/purchase-orders/${order.id}/edit`} className="btn btn-primary inline-flex items-center gap-2">
              <PencilIcon className="w-4 h-4" />
              {t('common.edit') || 'Edit'}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('purchases.orderInfo') || 'Order Info'}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">{t('purchases.supplierLabel') || 'Supplier'}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{order.supplier?.name || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">{t('purchases.warehouseLabel') || 'Warehouse'}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{order.warehouse?.name || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">{t('purchases.orderDate') || 'Date'}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{order.date}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">{t('purchases.expectedDelivery') || 'Expected delivery'}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{order.expected_delivery_date || '—'}</div>
              </div>
              {order.user && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400">{t('common.createdBy') || 'Created by'}</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{order.user.name}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('purchases.items') || 'Items'}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-100 dark:bg-green-900/30">
                    <th className="px-2 py-2 text-start text-gray-700 dark:text-gray-300">{t('purchases.designation') || 'Product'}</th>
                    <th className="px-2 py-2 text-center w-20 text-gray-700 dark:text-gray-300">{t('purchases.qty') || 'Qty'}</th>
                    <th className="px-2 py-2 text-center w-24 text-gray-700 dark:text-gray-300">{t('purchases.unitPrice') || 'Unit price'}</th>
                    <th className="px-2 py-2 text-center w-20 text-gray-700 dark:text-gray-300">{t('purchases.discountLabel') || 'Discount'}</th>
                    <th className="px-2 py-2 text-center w-24 text-gray-700 dark:text-gray-300">{t('purchases.subtotal') || 'Subtotal'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it) => (
                    <tr key={it.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-2 py-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{it.product?.name || '—'}</div>
                        {it.product?.barcode && <div className="text-xs text-gray-500 dark:text-gray-400">{it.product.barcode}</div>}
                      </td>
                      <td className="px-2 py-2 text-center">{Number(it.quantity)}</td>
                      <td className="px-2 py-2 text-center">{formatCurrency(Number(it.unit_price))}</td>
                      <td className="px-2 py-2 text-center">{formatCurrency(Number(it.discount) || 0)}</td>
                      <td className="px-2 py-2 text-center font-bold text-green-600 dark:text-green-400">{formatCurrency(Number(it.subtotal) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(order.note || order.terms) && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('purchases.notesAndTerms') || 'Notes & Terms'}</h2>
              {order.note && (
                <div className="mb-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('purchases.notesLabel') || 'Notes'}</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{order.note}</div>
                </div>
              )}
              {order.terms && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('purchases.deliveryTerms') || 'Delivery terms'}</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{order.terms}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="card sticky top-24">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('purchases.orderSummary') || 'Summary'}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.subtotal') || 'Subtotal'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(Number(order.total_amount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.discountLabel') || 'Discount'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(Number(order.discount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.taxLabel') || 'Tax'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(Number(order.tax) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.shippingLabel') || 'Shipping'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(Number(order.shipping) || 0)}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900 dark:text-gray-100">{t('purchases.finalTotal') || 'Total'}</span>
                <span className="text-green-600 dark:text-green-400">{formatCurrency(Number(order.grand_total) || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
