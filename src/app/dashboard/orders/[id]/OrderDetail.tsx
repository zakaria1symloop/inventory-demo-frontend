'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ordersApi } from '@/lib/api';
import { formatQty } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard';
import { useLocale } from '@/lib/i18n/context';

export default function OrderDetail() {
  const params = useParams();
  const { t, locale } = useLocale();
  const [id, setId] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract ID from URL for static export compatibility
  useEffect(() => {
    const paramId = params.id as string;
    if (paramId && paramId !== '_') {
      setId(paramId);
    } else if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const urlId = pathParts[pathParts.length - 1];
      if (urlId && urlId !== '_') {
        setId(urlId);
      }
    }
  }, [params.id]);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const response = await ordersApi.getOne(Number(id));
      setOrder(response.data.data || response.data);
    } catch (error) {
      toast.error(t('orders.toastDetailLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    const loc = locale === 'ar' ? 'ar-DZ' : 'fr-DZ';
    return new Intl.NumberFormat(loc, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateString: string) => {
    const loc = locale === 'ar' ? 'ar-DZ' : 'fr-DZ';
    return new Date(dateString).toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusDotAndLabel = (status: string) => {
    const map: Record<string, { dot: string; label: string }> = {
      pending: { dot: 'metric-dot-orange', label: t('orders.statusPending') },
      confirmed: { dot: 'metric-dot-blue', label: t('orders.statusConfirmed') },
      assigned: { dot: 'metric-dot-violet', label: t('orders.statusAssigned') },
      delivered: { dot: 'metric-dot-green', label: t('orders.statusDelivered') },
      partial: { dot: 'metric-dot-orange', label: t('orders.statusPartial') },
      cancelled: { dot: 'metric-dot-red', label: t('orders.statusCancelled') },
    };
    return map[status] || { dot: 'metric-dot-neutral', label: status };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <PageHeader
          title={t('orders.title')}
          breadcrumb={[
            { label: t('sidebar.orders'), href: '/dashboard/orders' },
            { label: '—' },
          ]}
        />
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-[14px]">
          <Link href="/dashboard/orders" className="hover:text-gray-700 dark:hover:text-gray-200 underline-offset-2 hover:underline">
            {t('orders.title')}
          </Link>
        </div>
      </div>
    );
  }

  const status = getStatusDotAndLabel(order.status);

  return (
    <div>
      <PageHeader
        title={order.reference}
        subtitle={order.client?.name ? `${t('orders.detailClient')} · ${order.client.name}` : undefined}
        breadcrumb={[
          { label: t('sidebar.orders'), href: '/dashboard/orders' },
          { label: order.reference },
        ]}
      />

      {/* ─── Metric tiles ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className={`metric-dot ${status.dot}`} aria-hidden />
            <p className="metric-label truncate">{t('orders.filterStatus')}</p>
          </div>
          <p className="metric-value truncate">{status.label}</p>
        </div>

        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            <p className="metric-label truncate">{t('saleDetail.date')}</p>
          </div>
          <p className="metric-value truncate">{formatDate(order.date)}</p>
        </div>

        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            <p className="metric-label truncate">{t('orders.detailWarehouse')}</p>
          </div>
          <p className="metric-value truncate">{order.warehouse?.name || '-'}</p>
        </div>

        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-green" aria-hidden />
            <p className="metric-label truncate">{t('orders.detailTotal')}</p>
          </div>
          <p className="metric-value metric-value-currency">{formatCurrency(order.grand_total)}</p>
        </div>
      </div>

      {/* ─── Items ─── */}
      <div className="surface-pro p-4">
        <h3 className="surface-heading mb-3">{t('orders.thProduct')}</h3>
        <div className="table-pro-wrap">
          <table className="table-pro compact">
            <thead>
              <tr>
                <th>{t('orders.thProduct')}</th>
                <th className="text-center">{t('orders.thQuantityOrdered')}</th>
                <th className="text-center">{t('orders.thPrice')}</th>
                <th className="text-center">{t('saleDetail.piecesPerUnit')}</th>
                <th className="text-center">{t('saleDetail.discount')}</th>
                <th className="text-center">{t('orders.thTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any) => {
                const piecesPerPackage = item.product?.pieces_per_package || 1;
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="t-strong">{item.product?.name}</div>
                      {item.product?.barcode && (
                        <div className="text-[11px] text-gray-400">{item.product.barcode}</div>
                      )}
                    </td>
                    <td className="text-center tnum t-strong">{formatQty(item.quantity_ordered, piecesPerPackage)}</td>
                    <td className="text-center tnum">
                      {formatCurrency(item.unit_price)}
                      {piecesPerPackage > 1 && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          ({formatCurrency(item.unit_price * piecesPerPackage)}/{t('orders.unitCarton')})
                        </div>
                      )}
                    </td>
                    <td className="text-center tnum t-muted">{piecesPerPackage}</td>
                    <td className="text-center tnum t-muted">{item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}</td>
                    <td className="text-center tnum t-strong">
                      {formatCurrency(item.subtotal)}
                      <div className="text-[11px] text-gray-400">
                        {item.unit_price} × {piecesPerPackage} × {formatQty(item.quantity_ordered, piecesPerPackage)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
