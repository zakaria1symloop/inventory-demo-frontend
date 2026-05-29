'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { stockTransfersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';
import {
  PrinterIcon,
  TrashIcon,
  CheckCircleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

interface Warehouse {
  id: number;
  name: string;
  assigned_user?: { id: number; name: string } | null;
}

interface Product {
  id: number;
  name: string;
  barcode?: string;
  sku?: string;
  cost_price?: number;
  retail_price?: number;
  wholesale_price?: number;
  pieces_per_package?: number;
  unit?: { name: string; short_name?: string };
  unit_sale?: { name: string; short_name?: string };
}

interface StockTransferItem {
  id: number;
  product_id: number;
  quantity: number;
  product?: Product;
}

interface StockTransfer {
  id: number;
  reference: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  created_by: number;
  collected_by: number | null;
  approved_by: number | null;
  status: 'pending' | 'loading' | 'collected';
  collected_at: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  creator?: { id: number; name: string };
  collector?: { id: number; name: string };
  approver?: { id: number; name: string };
  items?: StockTransferItem[];
}

export default function StockTransferDetail() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { t, locale } = useLocale();

  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  const intlLocale = locale === 'fr' ? 'fr-DZ' : 'ar-DZ';

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(intlLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchTransfer();
  }, [id]);

  const fetchTransfer = async () => {
    setIsLoading(true);
    try {
      const response = await stockTransfersApi.getOne(id);
      setTransfer(response.data);
    } catch {
      toast.error(t('stockTransfersDetail.errorLoading'));
      router.push('/dashboard/stock-transfers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm(t('stockTransfersDetail.confirmApprove'))) return;
    setIsActioning(true);
    try {
      await stockTransfersApi.approve(id);
      toast.success(t('stockTransfersDetail.approvedSuccess'));
      fetchTransfer();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || t('stockTransfersDetail.errorApproving');
      toast.error(msg);
    } finally {
      setIsActioning(false);
    }
  };

  const handleCollect = async () => {
    if (!confirm(t('stockTransfersDetail.confirmCollect'))) return;
    setIsActioning(true);
    try {
      await stockTransfersApi.collect(id);
      toast.success(t('stockTransfersDetail.collectedSuccess'));
      fetchTransfer();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || t('stockTransfersDetail.errorCollecting');
      toast.error(msg);
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('stockTransfersDetail.confirmDelete'))) return;
    try {
      await stockTransfersApi.delete(id);
      toast.success(t('stockTransfersDetail.deletedSuccess'));
      router.push('/dashboard/stock-transfers');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('stockTransfersDetail.errorDeleting'));
    }
  };

  // NOTE: Print template is Arabic-only by design — not translated
  const handlePrint = () => {
    if (!transfer) return;
    const items = transfer.items || [];
    const sum = getSummary();

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تحويل مخزون - ${transfer.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; font-size: 14px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header .ref { font-size: 18px; color: #666; }
          .header .status { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-top: 8px; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-loading { background: #dbeafe; color: #1e40af; }
          .status-collected { background: #dcfce7; color: #166534; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { background: #f9f9f9; padding: 15px; border-radius: 8px; }
          .info-box h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
          .info-box p { font-size: 16px; font-weight: bold; }
          .info-box .sub { font-size: 12px; color: #888; font-weight: normal; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px 8px; text-align: right; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; font-size: 13px; }
          td { font-size: 13px; }
          .text-center { text-align: center; }
          .text-blue { color: #1d4ed8; }
          .text-orange { color: #c2410c; }
          tfoot td { background: #f5f5f5; font-weight: bold; }
          .summary { display: flex; gap: 20px; margin-top: 10px; }
          .summary-item { flex: 1; background: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 8px; text-align: center; }
          .summary-item .label { font-size: 12px; color: #0369a1; margin-bottom: 4px; }
          .summary-item .value { font-size: 20px; font-weight: bold; color: #0c4a6e; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          .notes { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
          .signature { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; }
          .signature-box { text-align: center; width: 200px; }
          .signature-box .line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>وصل تحويل مخزون</h1>
          <div class="ref">${transfer.reference}</div>
          <div class="status status-${transfer.status}">
            ${transfer.status === 'pending' ? 'طلب جديد' : transfer.status === 'loading' ? 'جاري التحميل' : 'تم التسليم'}
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>المستودع المصدر</h3>
            <p>${transfer.from_warehouse?.name || '-'}</p>
            ${transfer.from_warehouse?.assigned_user ? `<p class="sub">المسؤول: ${transfer.from_warehouse.assigned_user.name}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>المستودع الوجهة</h3>
            <p>${transfer.to_warehouse?.name || '-'}</p>
            ${transfer.to_warehouse?.assigned_user ? `<p class="sub">السائق: ${transfer.to_warehouse.assigned_user.name}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>تاريخ الإنشاء</h3>
            <p>${formatDate(transfer.created_at)}</p>
            <p class="sub">بواسطة: ${transfer.creator?.name || '-'}</p>
          </div>
          <div class="info-box">
            <h3>${transfer.status === 'collected' ? 'تاريخ التسليم' : 'تاريخ الموافقة'}</h3>
            <p>${transfer.collected_at ? formatDate(transfer.collected_at) : transfer.approved_at ? formatDate(transfer.approved_at) : '-'}</p>
            ${transfer.approver ? `<p class="sub">وافق: ${transfer.approver.name}</p>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>المنتج</th>
              <th class="text-center">كرتون</th>
              <th class="text-center">قطع إضافية</th>
              <th class="text-center">إجمالي القطع</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => {
              const d = getItemDetails(item);
              return `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.product?.name || '-'}${d.ppp > 1 ? ` <span style="font-size:11px;color:#888">(${d.ppp} ق/كرتون)</span>` : ''}</td>
                <td class="text-center text-blue">${d.cartons}</td>
                <td class="text-center text-orange">${d.extraPieces || '-'}</td>
                <td class="text-center" style="font-weight:bold">${d.totalPieces}</td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="text-center">الإجمالي (${sum.productCount} منتج)</td>
              <td class="text-center text-blue">${sum.totalCartons}</td>
              <td class="text-center text-orange">${sum.totalExtraPieces || '-'}</td>
              <td class="text-center" style="font-weight:bold">${sum.totalPieces}</td>
            </tr>
          </tfoot>
        </table>

        <div class="summary">
          <div class="summary-item">
            <div class="label">عدد المنتجات</div>
            <div class="value">${sum.productCount}</div>
          </div>
          <div class="summary-item">
            <div class="label">إجمالي الكراتين</div>
            <div class="value">${sum.totalCartons}</div>
          </div>
          <div class="summary-item">
            <div class="label">إجمالي القطع</div>
            <div class="value">${sum.totalPieces}</div>
          </div>
        </div>

        ${transfer.notes ? `<div class="notes"><strong>ملاحظات:</strong><p>${transfer.notes}</p></div>` : ''}

        <div class="signature">
          <div class="signature-box">
            <div class="line">توقيع المسؤول (المستودع)</div>
          </div>
          <div class="signature-box">
            <div class="line">توقيع السائق</div>
          </div>
        </div>

        <div class="footer">
          <p>تم الطباعة بتاريخ ${new Date().toLocaleDateString('ar-DZ')}</p>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 100);
      }, 250);
    }
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { dot: string; label: string }> = {
      pending: { dot: 'metric-dot-orange', label: t('stockTransfersDetail.statusPending') },
      loading: { dot: 'metric-dot-blue', label: t('stockTransfersDetail.statusLoading') },
      collected: { dot: 'metric-dot-green', label: t('stockTransfersDetail.statusCollected') },
    };
    return map[status] || { dot: 'metric-dot-neutral', label: status };
  };

  const getItemDetails = (item: StockTransferItem) => {
    const ppp = item.product?.pieces_per_package || 1;
    const totalPieces = Math.round(Number(item.quantity));
    const cartons = ppp > 1 ? Math.floor(totalPieces / ppp) : totalPieces;
    const extraPieces = ppp > 1 ? totalPieces % ppp : 0;
    const unitCost = Number(item.product?.cost_price) || 0;
    const subtotal = unitCost * totalPieces;
    return { ppp, totalPieces, cartons, extraPieces, unitCost, subtotal };
  };

  const getSummary = () => {
    const items = transfer?.items || [];
    let totalCartons = 0;
    let totalExtraPieces = 0;
    let totalPieces = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    for (const item of items) {
      const d = getItemDetails(item);
      totalCartons += d.cartons;
      totalExtraPieces += d.extraPieces;
      totalPieces += d.totalPieces;
      totalCostValue += d.subtotal;
      const retailPrice = Number(item.product?.retail_price) || 0;
      totalRetailValue += retailPrice * d.totalPieces;
    }

    return { totalCartons, totalExtraPieces, totalPieces, totalCostValue, totalRetailValue, productCount: items.length };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  if (!transfer) {
    return (
      <div>
        <PageHeader
          title={t('stockTransfersDetail.notFound')}
          breadcrumb={[
            { label: t('sidebar.stockTransfers'), href: '/dashboard/stock-transfers' },
            { label: '—' },
          ]}
        />
      </div>
    );
  }

  const statusInfo = getStatusInfo(transfer.status);
  const summary = getSummary();
  const stepOneDone = true;
  const stepTwoDone = transfer.status !== 'pending';
  const stepThreeDone = transfer.status === 'collected';

  return (
    <div>
      <PageHeader
        title={`${t('stockTransfersDetail.transferTitle')} ${transfer.reference}`}
        breadcrumb={[
          { label: t('sidebar.stockTransfers'), href: '/dashboard/stock-transfers' },
          { label: transfer.reference },
        ]}
        pill={
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
            <span className={`metric-dot ${statusInfo.dot}`} aria-hidden />
            {statusInfo.label}
          </span>
        }
      >
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={t('stockTransfersDetail.print')}
        >
          <PrinterIcon className="w-4 h-4" />
          {t('stockTransfersDetail.print')}
        </button>
      </PageHeader>

      {/* Status Progress */}
      <div className="surface-pro p-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-md border flex items-center justify-center tnum text-[13px] flex-shrink-0 ${stepOneDone ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500'}`}>
              1
            </div>
            <div className="min-w-0">
              <p className="t-strong text-[12px]">{t('stockTransfersDetail.stepRequest')}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 tnum">{formatDate(transfer.created_at)}</p>
            </div>
          </div>
          <div className={`flex-1 h-px ${stepTwoDone ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-md border flex items-center justify-center tnum text-[13px] flex-shrink-0 ${stepTwoDone ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : transfer.status === 'pending' ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'}`}>
              2
            </div>
            <div className="min-w-0">
              <p className="t-strong text-[12px]">{t('stockTransfersDetail.stepLoading')}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 tnum">{transfer.approved_at ? formatDate(transfer.approved_at) : '—'}</p>
            </div>
          </div>
          <div className={`flex-1 h-px ${stepThreeDone ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-md border flex items-center justify-center tnum text-[13px] flex-shrink-0 ${stepThreeDone ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400'}`}>
              3
            </div>
            <div className="min-w-0">
              <p className="t-strong text-[12px]">{t('stockTransfersDetail.stepDepart')}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 tnum">{transfer.collected_at ? formatDate(transfer.collected_at) : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transfer Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="surface-pro p-4">
            <h2 className="surface-heading mb-3">{t('stockTransfersDetail.transferInfo')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              <Field label={t('stockTransfersDetail.reference')} value={transfer.reference} mono />
              <Field label={t('stockTransfersDetail.createdAt')} value={formatDate(transfer.created_at)} mono />
              <Field label={t('stockTransfersDetail.sourceWarehouse')} value={transfer.from_warehouse?.name || '-'} sub={transfer.from_warehouse?.assigned_user ? `${t('stockTransfersDetail.manager')}: ${transfer.from_warehouse.assigned_user.name}` : undefined} />
              <Field label={t('stockTransfersDetail.destinationWarehouse')} value={transfer.to_warehouse?.name || '-'} sub={transfer.to_warehouse?.assigned_user ? `${t('stockTransfersDetail.driver')}: ${transfer.to_warehouse.assigned_user.name}` : undefined} />
              <Field label={t('stockTransfersDetail.createdBy')} value={transfer.creator?.name || '-'} />
              {transfer.approver && (
                <Field
                  label={t('stockTransfersDetail.approvedBy')}
                  value={transfer.approver.name}
                  sub={transfer.approved_at ? formatDate(transfer.approved_at) : undefined}
                />
              )}
              {transfer.collector && (
                <Field
                  label={t('stockTransfersDetail.collectedBy')}
                  value={transfer.collector.name}
                  sub={transfer.collected_at ? formatDate(transfer.collected_at) : undefined}
                />
              )}
              {transfer.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">{t('stockTransfersDetail.notes')}</p>
                  <p className="text-[13.5px] text-gray-900 dark:text-gray-100 font-medium leading-snug">{transfer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Card */}
          <div className="surface-pro p-4">
            <h2 className="surface-heading mb-3">
              {t('stockTransfersDetail.products')} ({transfer.items?.length || 0})
            </h2>
            <div className="table-pro-wrap">
              <table className="table-pro compact">
                <thead>
                  <tr>
                    <th className="text-center w-12">#</th>
                    <th>{t('stockTransfersDetail.product')}</th>
                    <th className="text-center">{t('stockTransfersDetail.unit')}</th>
                    <th className="text-center">{t('stockTransfersDetail.cartons')}</th>
                    <th className="text-center">{t('stockTransfersDetail.extraPieces')}</th>
                    <th className="text-center">{t('stockTransfersDetail.totalPieces')}</th>
                    <th className="text-center">{t('stockTransfersDetail.unitPrice')}</th>
                    <th className="text-center">{t('stockTransfersDetail.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.items?.map((item, index) => {
                    const d = getItemDetails(item);
                    return (
                      <tr key={item.id}>
                        <td className="text-center text-gray-500 tnum">{index + 1}</td>
                        <td>
                          <div className="t-strong">{item.product?.name || '-'}</div>
                          {(item.product?.barcode || item.product?.sku) && (
                            <div className="text-[11px] text-gray-400 font-mono">{item.product.barcode || item.product.sku}</div>
                          )}
                          {d.ppp > 1 && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">{d.ppp} {t('stockTransfersDetail.piecesPerCarton')}</div>
                          )}
                        </td>
                        <td className="text-center tnum t-muted">{item.product?.unit?.name || item.product?.unit_sale?.name || '-'}</td>
                        <td className="text-center tnum t-strong">{d.cartons}</td>
                        <td className="text-center tnum t-muted">{d.extraPieces > 0 ? d.extraPieces : '0'}</td>
                        <td className="text-center tnum t-strong">{d.totalPieces}</td>
                        <td className="text-center tnum">{d.unitCost.toFixed(2)}</td>
                        <td className="text-center tnum t-strong">{d.subtotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {(!transfer.items || transfer.items.length === 0) && (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-500 dark:text-gray-400 text-[13px]">{t('stockTransfersDetail.noProducts')}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-start t-strong">{t('stockTransfersDetail.total')}</td>
                    <td className="text-center tnum t-strong">{summary.totalCartons}</td>
                    <td className="text-center tnum t-strong">{summary.totalExtraPieces}</td>
                    <td className="text-center tnum t-strong">{summary.totalPieces}</td>
                    <td className="text-center t-muted">—</td>
                    <td className="text-center tnum t-strong">{formatCurrency(summary.totalCostValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="surface-pro p-4 sticky top-4">
            <h2 className="surface-heading mb-3">{t('stockTransfersDetail.actions')}</h2>

            <div className="space-y-2">
              {transfer.status === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={isActioning}
                    className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {isActioning ? <div className="spinner w-4 h-4 border-2"></div> : <CheckCircleIcon className="w-4 h-4" />}
                    {t('stockTransfersDetail.approveStartLoading')}
                  </button>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
                    {t('stockTransfersDetail.approveHint')}
                  </p>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    {t('stockTransfersDetail.deleteRequest')}
                  </button>
                </>
              )}

              {transfer.status === 'loading' && (
                <>
                  <div className="surface-pro p-3 text-[12px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="metric-dot metric-dot-blue" aria-hidden />
                      <p className="t-strong">{t('stockTransfersDetail.statusLoading')}</p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 ps-4">{t('stockTransfersDetail.loadingHint')}</p>
                  </div>

                  <button
                    onClick={handleCollect}
                    disabled={isActioning}
                    className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isActioning ? <div className="spinner w-4 h-4 border-2"></div> : <TruckIcon className="w-4 h-4" />}
                    {t('stockTransfersDetail.collectDepart')}
                  </button>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
                    {t('stockTransfersDetail.collectHint')}
                  </p>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    {t('stockTransfersDetail.cancelTransfer')}
                  </button>
                </>
              )}

              {transfer.status === 'collected' && (
                <div className="surface-pro p-4 text-center">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="metric-dot metric-dot-green" aria-hidden />
                    <CheckCircleIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="t-strong text-[13px]">{t('stockTransfersDetail.collectedSuccessTitle')}</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">
                    {t('stockTransfersDetail.collectedSuccessDesc')}
                  </p>
                  {transfer.collected_at && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 tnum">
                      {formatDate(transfer.collected_at)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <h3 className="surface-heading mb-2">{t('stockTransfersDetail.transferSummary')}</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersDetail.productCount')}</span>
                  <span className="tnum t-strong">{summary.productCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersDetail.totalCartonsLabel')}</span>
                  <span className="tnum t-strong">{summary.totalCartons}</span>
                </div>
                {summary.totalExtraPieces > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersDetail.extraPieces')}</span>
                    <span className="tnum t-strong">{summary.totalExtraPieces}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersDetail.totalPiecesLabel')}</span>
                  <span className="tnum t-strong">{summary.totalPieces}</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersDetail.costValue')}</span>
                  <span className="tnum t-strong">{formatCurrency(summary.totalCostValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersDetail.retailValue')}</span>
                  <span className="tnum t-strong">{formatCurrency(summary.totalRetailValue)}</span>
                </div>
                {summary.totalRetailValue > summary.totalCostValue && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersDetail.profitMargin')}</span>
                    <span className="tnum">
                      {formatCurrency(summary.totalRetailValue - summary.totalCostValue)}
                      {' '}({((summary.totalRetailValue - summary.totalCostValue) / summary.totalCostValue * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono = false, sub }: { label: string; value: string; mono?: boolean; sub?: string }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-[13.5px] text-gray-900 dark:text-gray-100 font-medium leading-snug ${mono ? 'tnum' : ''}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
