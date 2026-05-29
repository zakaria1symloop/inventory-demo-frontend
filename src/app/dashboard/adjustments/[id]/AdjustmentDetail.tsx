'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { adjustmentsApi } from '@/lib/api';
import { formatQty } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';

interface AdjustmentItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  reason?: string | null;
  product?: { name: string; barcode?: string; pieces_per_package?: number };
}

interface AdjustmentRecord {
  id: number;
  reference?: string;
  type: 'addition' | 'subtraction';
  status: 'pending' | 'approved' | 'rejected';
  warehouse?: { name: string };
  total_amount: number;
  reason?: string | null;
  date?: string;
  items?: AdjustmentItem[];
}

export default function AdjustmentDetail() {
  const params = useParams();
  const { t, locale } = useLocale();
  const [id, setId] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState<AdjustmentRecord | null>(null);
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
    if (id) fetchAdjustment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAdjustment = async () => {
    if (!id) return;
    try {
      const response = await adjustmentsApi.getOne(parseInt(id));
      setAdjustment(response.data.data || response.data);
    } catch {
      toast.error(t('stock.loadDataError'));
    } finally {
      setIsLoading(false);
    }
  };

  const intlLocale = locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-US';
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(value);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }
  if (!adjustment) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-[14px]">
        {t('stock.adjNoResults')}
      </div>
    );
  }

  const isAddition = adjustment.type === 'addition';
  const typeLabel = isAddition ? t('stock.addition') : t('stock.subtraction');
  const typeDot = isAddition ? 'metric-dot-green' : 'metric-dot-red';

  const statusDot =
    adjustment.status === 'approved'
      ? 'metric-dot-green'
      : adjustment.status === 'rejected'
      ? 'metric-dot-red'
      : 'metric-dot-orange';
  const statusLabel =
    adjustment.status === 'approved'
      ? t('stock.approved')
      : adjustment.status === 'rejected'
      ? t('stock.rejected')
      : t('stock.pending');

  return (
    <div>
      <PageHeader
        title={adjustment.reference ?? `#${adjustment.id}`}
        breadcrumb={[
          { label: t('sidebar.adjustments'), href: '/dashboard/adjustments' },
          { label: adjustment.reference ?? `#${adjustment.id}` },
        ]}
      />

      {/* Summary tiles — only dots carry color */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className={`metric-dot ${typeDot}`} aria-hidden />
            <p className="metric-label truncate">{t('stock.type')}</p>
          </div>
          <p className="metric-value truncate">{typeLabel}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            <p className="metric-label truncate">{t('stock.warehouse')}</p>
          </div>
          <p className="metric-value truncate">{adjustment.warehouse?.name || '—'}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className={`metric-dot ${statusDot}`} aria-hidden />
            <p className="metric-label truncate">{t('stock.statusCol')}</p>
          </div>
          <p className="metric-value truncate">{statusLabel}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-violet" aria-hidden />
            <p className="metric-label truncate">{t('stock.value')}</p>
          </div>
          <p className="metric-value-currency">{formatCurrency(adjustment.total_amount)}</p>
        </div>
      </div>

      {/* Items table */}
      <div className="surface-pro !p-0">
        <h3 className="surface-heading px-4 pt-3.5 pb-3">{t('stock.product')}</h3>
        <div className="table-pro-wrap !border-0 !rounded-none">
          <table className="table-pro">
            <thead>
              <tr>
                <th>{t('stock.product')}</th>
                <th className="text-center">{t('stock.qty')}</th>
                <th className="text-center">{t('stock.unitCol')}</th>
                <th className="text-end">{t('stock.unitPriceColAdj')}</th>
                <th className="text-end">{t('stock.totalColAdj')}</th>
              </tr>
            </thead>
            <tbody>
              {adjustment.items && adjustment.items.length > 0 ? (
                adjustment.items.map((item) => {
                  const ppp = item.product?.pieces_per_package || 1;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="t-strong">{item.product?.name ?? '—'}</div>
                        {item.product?.barcode && (
                          <div className="t-muted">{item.product.barcode}</div>
                        )}
                      </td>
                      <td className="text-center tnum">{formatQty(item.quantity, ppp)}</td>
                      <td className="text-center tnum">{ppp}</td>
                      <td className="tnum">{formatCurrency(item.unit_price)}</td>
                      <td className="tnum">{formatCurrency(item.total)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="t-empty">{t('stock.adjNoResults')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adjustment.reason && (
        <div className="surface-pro mt-4">
          <h3 className="surface-heading mb-2">{t('stock.reason')}</h3>
          <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
            {adjustment.reason}
          </p>
        </div>
      )}
    </div>
  );
}
