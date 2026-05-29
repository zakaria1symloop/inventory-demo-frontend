'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { purchaseOrdersApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import { ArrowLeftIcon, PencilIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/dashboard';

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
  const statusDot: Record<string, string> = {
    pending: 'metric-dot-orange',
    confirmed: 'metric-dot-blue',
    received: 'metric-dot-green',
    cancelled: 'metric-dot-red',
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={order.reference}
        breadcrumb={[
          { label: t('purchases.poTitle') || 'Purchase orders', href: '/dashboard/purchase-orders' },
          { label: order.reference },
        ]}
        pill={
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
            <span className={`metric-dot ${statusDot[order.status] || 'metric-dot-neutral'}`} aria-hidden />
            {statusLabel[order.status] || order.status}
          </span>
        }
      >
        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          {t('purchases.downloadPdf') || 'PDF'}
        </button>
        {order.status !== 'received' && order.status !== 'cancelled' && (
          <Link
            href={`/dashboard/purchase-orders/${order.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            {t('common.edit') || 'Edit'}
          </Link>
        )}
      </PageHeader>

      {order.purchase && (
        <p className="text-[12px] text-gray-500 dark:text-gray-400">
          {t('purchases.convertedTo') || 'Converted to purchase'}: <span className="font-mono text-gray-700 dark:text-gray-200">{order.purchase.reference}</span>
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="surface-pro">
            <h2 className="surface-heading mb-3">{t('purchases.orderInfo') || 'Order Info'}</h2>
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('purchases.supplierLabel') || 'Supplier'}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{order.supplier?.name || '—'}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('purchases.warehouseLabel') || 'Warehouse'}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{order.warehouse?.name || '—'}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('purchases.orderDate') || 'Date'}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mt-0.5 tnum">{order.date}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('purchases.expectedDelivery') || 'Expected delivery'}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mt-0.5 tnum">{order.expected_delivery_date || '—'}</div>
              </div>
              {order.user && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('common.createdBy') || 'Created by'}</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{order.user.name}</div>
                </div>
              )}
            </div>
          </div>

          <div className="surface-pro">
            <h2 className="surface-heading mb-3">{t('purchases.items') || 'Items'}</h2>
            <div className="table-pro-wrap">
              <table className="table-pro compact">
                <thead>
                  <tr>
                    <th>{t('purchases.designation') || 'Product'}</th>
                    <th className="text-end w-20">{t('purchases.qty') || 'Qty'}</th>
                    <th className="text-end w-28">{t('purchases.unitPrice') || 'Unit price'}</th>
                    <th className="text-end w-24">{t('purchases.discountLabel') || 'Discount'}</th>
                    <th className="text-end w-28">{t('purchases.subtotal') || 'Subtotal'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it) => (
                    <tr key={it.id}>
                      <td>
                        <div className="font-medium text-gray-800 dark:text-gray-100">{it.product?.name || '—'}</div>
                        {it.product?.barcode && <div className="text-[11px] text-gray-500 dark:text-gray-400">{it.product.barcode}</div>}
                      </td>
                      <td className="text-end tnum">{Number(it.quantity)}</td>
                      <td className="text-end tnum">{formatCurrency(Number(it.unit_price))}</td>
                      <td className="text-end tnum">{formatCurrency(Number(it.discount) || 0)}</td>
                      <td className="text-end font-semibold text-gray-800 dark:text-gray-100 tnum">{formatCurrency(Number(it.subtotal) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(order.note || order.terms) && (
            <div className="surface-pro">
              <h2 className="surface-heading mb-3">{t('purchases.notesAndTerms') || 'Notes & Terms'}</h2>
              {order.note && (
                <div className="mb-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{t('purchases.notesLabel') || 'Notes'}</div>
                  <div className="text-[13px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{order.note}</div>
                </div>
              )}
              {order.terms && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{t('purchases.deliveryTerms') || 'Delivery terms'}</div>
                  <div className="text-[13px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{order.terms}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="surface-pro sticky top-24">
            <h2 className="surface-heading mb-3">{t('purchases.orderSummary') || 'Summary'}</h2>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.subtotal') || 'Subtotal'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 tnum">{formatCurrency(Number(order.total_amount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.discountLabel') || 'Discount'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 tnum">{formatCurrency(Number(order.discount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.taxLabel') || 'Tax'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 tnum">{formatCurrency(Number(order.tax) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.shippingLabel') || 'Shipping'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 tnum">{formatCurrency(Number(order.shipping) || 0)}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-[15px] font-semibold">
                <span className="text-gray-900 dark:text-gray-100">{t('purchases.finalTotal') || 'Total'}</span>
                <span className="text-gray-900 dark:text-gray-100 tnum">{formatCurrency(Number(order.grand_total) || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
