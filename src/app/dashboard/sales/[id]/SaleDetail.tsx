'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { salesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import { useLocale } from '@/lib/i18n/context';

import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  PrinterIcon,
  TrashIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { PageHeader } from '@/components/dashboard';

interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    barcode?: string;
    cost_price?: number;
    pieces_per_package?: number;
    unit_sale?: { id: number; name: string; short_name: string };
  };
}

interface Payment {
  id: number;
  reference: string;
  amount: number;
  payment_method: 'cash' | 'bank' | 'check' | 'other';
  date: string;
  notes?: string;
  user?: { id: number; name: string };
  created_at: string;
}

interface Sale {
  id: number;
  reference: string;
  client_id?: number;
  warehouse_id: number;
  user_id: number;
  date: string;
  total_amount: number;
  discount: number;
  tax: number;
  shipping: number;
  timbre: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'draft';
  payment_status: 'unpaid' | 'partial' | 'paid';
  note?: string;
  client?: { id: number; name: string; code?: string; phone?: string; address?: string };
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
  items?: SaleItem[];
  payments?: Payment[];
  created_at: string;
  updated_at: string;
}

export default function SaleDetail() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [id, setId] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Payment modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'cash' as 'cash' | 'bank' | 'check' | 'other',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

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
    if (id) fetchSale();
  }, [id]);

  const fetchSale = async () => {
    if (!id) return;
    try {
      const response = await salesApi.getOne(parseInt(id));
      setSale(response.data.data || response.data);
    } catch (error) {
      toast.error(t('saleDetail.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    const safeValue = isNaN(value) ? 0 : value;
    const loc = locale === 'ar' ? 'ar-DZ' : 'fr-DZ';
    return new Intl.NumberFormat(loc, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(safeValue);
  };

  const formatDate = (dateString: string) => {
    const loc = locale === 'ar' ? 'ar-DZ' : 'fr-DZ';
    return new Date(dateString).toLocaleDateString(loc, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleConfirmDraft = async () => {
    if (!sale) return;
    setIsConfirming(true);
    try {
      await salesApi.confirm(sale.id);
      toast.success(t('saleDetail.confirmSuccess'));
      fetchSale();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('saleDetail.confirmError'));
    } finally {
      setIsConfirming(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { dot: string; label: string }> = {
      draft: { dot: 'metric-dot-blue', label: t('saleDetail.draft') },
      pending: { dot: 'metric-dot-orange', label: t('saleDetail.pending') },
      completed: { dot: 'metric-dot-green', label: t('saleDetail.completed') },
      cancelled: { dot: 'metric-dot-red', label: t('saleDetail.cancelled') },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
        <span className={`metric-dot ${config.dot}`} aria-hidden />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { dot: string; label: string }> = {
      unpaid: { dot: 'metric-dot-red', label: t('saleDetail.unpaid') },
      partial: { dot: 'metric-dot-orange', label: t('saleDetail.partial') },
      paid: { dot: 'metric-dot-green', label: t('saleDetail.paid') },
    };
    const config = statusConfig[status] || statusConfig.unpaid;
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
        <span className={`metric-dot ${config.dot}`} aria-hidden />
        {config.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: t('saleDetail.cash'),
      bank: t('saleDetail.bankTransfer'),
      check: t('saleDetail.check'),
      other: t('saleDetail.other'),
    };
    return methods[method] || method;
  };

  const getPaymentMethodDot = (method: string) => {
    const dots: Record<string, string> = {
      cash: 'metric-dot-green',
      bank: 'metric-dot-blue',
      check: 'metric-dot-orange',
      other: 'metric-dot-neutral',
    };
    return dots[method] || 'metric-dot-neutral';
  };

  const handlePrint = () => {
    const printDir = locale === 'ar' ? 'rtl' : 'ltr';
    const printLang = locale;
    const textAlign = locale === 'ar' ? 'right' : 'left';
    const printContent = `
      <!DOCTYPE html>
      <html dir="${printDir}" lang="${printLang}">
      <head>
        <meta charset="UTF-8">
        <title>${t('saleDetail.saleInvoice')} - ${sale?.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; font-size: 14px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header .ref { font-size: 18px; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { background: #f9f9f9; padding: 15px; border-radius: 8px; }
          .info-box h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
          .info-box p { font-size: 16px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px; text-align: ${textAlign}; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          .totals { margin-top: 20px; }
          .totals .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .totals .row.grand { font-size: 18px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('saleDetail.saleInvoice')}</h1>
          <div class="ref">${sale?.reference}</div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>${t('saleDetail.client')}</h3>
            <p>${sale?.client?.name || t('saleDetail.cashClient')}</p>
            ${sale?.client?.code ? `<p style="font-size:11px;color:#4338ca;font-family:monospace;margin-top:2px">${sale.client.code}</p>` : ''}
            ${sale?.client?.phone ? `<p style="font-size:12px;color:#666">${sale.client.phone}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>${t('saleDetail.date')}</h3>
            <p>${sale?.date ? formatDate(sale.date) : '-'}</p>
          </div>
          <div class="info-box">
            <h3>${t('saleDetail.warehouse')}</h3>
            <p>${sale?.warehouse?.name || '-'}</p>
          </div>
          <div class="info-box">
            <h3>${t('saleDetail.seller')}</h3>
            <p>${sale?.user?.name || '-'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>${t('saleDetail.product')}</th>
              <th style="text-align:center">${t('saleDetail.piecesPerUnit')}</th>
              <th style="text-align:center">${t('saleDetail.cartons')}</th>
              <th style="text-align:center">${t('saleDetail.pieces')}</th>
              <th style="text-align:center">${t('saleDetail.total')}</th>
              <th style="text-align:center">${t('saleDetail.price')}</th>
              <th style="text-align:center">${t('saleDetail.subtotalCol')}</th>
            </tr>
          </thead>
          <tbody>
            ${sale?.items?.map((item: any) => {
              const ppp = item.product?.pieces_per_package || 1;
              const totalPieces = Math.round(item.quantity);
              const cartons = ppp > 1 ? Math.floor(totalPieces / ppp) : 0;
              const remainPcs = ppp > 1 ? totalPieces % ppp : totalPieces;
              return '<tr>'
                + '<td>' + (item.product?.name || '-') + '</td>'
                + '<td style="text-align:center"><span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:10px;font-size:12px">' + (ppp > 1 ? ppp : '-') + '</span></td>'
                + '<td style="text-align:center;font-weight:bold">' + (ppp > 1 ? cartons : '-') + '</td>'
                + '<td style="text-align:center">' + (ppp > 1 ? remainPcs : '-') + '</td>'
                + '<td style="text-align:center"><span style="background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:6px;font-weight:bold">' + totalPieces + '</span></td>'
                + '<td style="text-align:center">' + formatCurrency(item.unit_price) + '</td>'
                + '<td style="text-align:center;font-weight:bold">' + formatCurrency(item.subtotal) + '</td>'
                + '</tr>';
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="row"><span>${t('saleDetail.subtotal')}:</span><span>${formatCurrency(sale?.total_amount || 0)}</span></div>
          <div class="row"><span>${t('saleDetail.discount')}:</span><span>${formatCurrency(sale?.discount || 0)}</span></div>
          <div class="row"><span>${t('saleDetail.tax')}:</span><span>${formatCurrency(sale?.tax || 0)}</span></div>
          <div class="row"><span>${t('saleDetail.shipping')}:</span><span>${formatCurrency(sale?.shipping || 0)}</span></div>
          ${(sale?.timbre || 0) > 0 ? `<div class="row"><span>${locale === 'ar' ? 'الطابع' : 'Timbre'}:</span><span>${formatCurrency(sale?.timbre || 0)}</span></div>` : ''}
          <div class="row grand"><span>${t('saleDetail.grandTotal')}:</span><span>${formatCurrency(sale?.grand_total || 0)}</span></div>
          <div class="row"><span>${t('saleDetail.paidAmount')}:</span><span>${formatCurrency(sale?.paid_amount || 0)}</span></div>
          <div class="row" style="color: ${(sale?.due_amount || 0) > 0 ? 'red' : 'green'}"><span>${t('saleDetail.remaining')}:</span><span>${formatCurrency(sale?.due_amount || 0)}</span></div>
        </div>

        ${sale?.note ? `<div style="margin-top:30px;padding:15px;background:#f9f9f9;border-radius:8px"><strong>${t('saleDetail.notes')}:</strong><p>${sale.note}</p></div>` : ''}

        <div class="footer">
          <p>${t('saleDetail.printedAt', { date: new Date().toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ') })}</p>
        </div>
      </body>
      </html>
    `;

    // Create iframe for printing (works better on Vercel/CSP-restricted environments)
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

      // Wait for content to load, then print
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Remove iframe after printing
        setTimeout(() => document.body.removeChild(iframe), 100);
      }, 250);
    }
  };

  const handleDelete = async () => {
    if (!sale) return;
    setIsDeleting(true);
    try {
      await salesApi.delete(sale.id);
      toast.success(t('saleDetail.deleteSuccess'));
      router.push('/dashboard/sales');
    } catch (error: any) {
      const message = error.response?.data?.message || t('saleDetail.deleteError');
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const openPaymentModal = () => {
    if (!sale) return;
    setPaymentData({
      amount: sale.due_amount.toString(),
      payment_method: 'cash',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsPaymentOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('saleDetail.validAmountError'));
      return;
    }

    if (amount > sale.due_amount) {
      toast.error(t('saleDetail.amountExceedsError'));
      return;
    }

    setIsProcessingPayment(true);
    try {
      await salesApi.addPayment(sale.id, {
        amount,
        payment_method: paymentData.payment_method,
        notes: paymentData.notes,
        date: paymentData.date,
      });
      toast.success(t('saleDetail.paymentSuccess'));
      setIsPaymentOpen(false);
      fetchSale();
    } catch (error: any) {
      const message = error.response?.data?.message || t('saleDetail.paymentError');
      toast.error(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayFull = async () => {
    if (!sale || sale.due_amount <= 0) return;

    setIsProcessingPayment(true);
    try {
      await salesApi.addPayment(sale.id, {
        amount: parseFloat(String(sale.due_amount)),
        payment_method: 'cash',
        notes: t('saleDetail.fullPaymentNote'),
        date: new Date().toISOString().split('T')[0],
      });
      toast.success(t('saleDetail.fullPaymentDone'));
      fetchSale();
    } catch (error: any) {
      const message = error.response?.data?.message || t('saleDetail.fullPaymentError');
      toast.error(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div>
        <PageHeader
          title={t('saleDetail.notFound')}
          breadcrumb={[
            { label: t('sidebar.saleInvoices'), href: '/dashboard/sales' },
            { label: t('saleDetail.notFound') },
          ]}
        />
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-[14px]">
          <Link href="/dashboard/sales" className="hover:text-gray-700 dark:hover:text-gray-200 underline-offset-2 hover:underline">
            {t('saleDetail.backToSales')}
          </Link>
        </div>
      </div>
    );
  }

  // Profit calc
  const totalCost = sale.items?.reduce((sum, item) => {
    const totalPieces = Math.round(item.quantity);
    const costPrice = Number(item.product?.cost_price) || 0;
    return sum + (costPrice * totalPieces);
  }, 0) || 0;
  const totalSell = sale.items?.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0) || 0;
  const profit = totalSell - totalCost;

  return (
    <div>
      <PageHeader
        title={sale.reference}
        subtitle={t('saleDetail.createdAt', { date: formatDate(sale.created_at) })}
        breadcrumb={[
          { label: t('sidebar.saleInvoices'), href: '/dashboard/sales' },
          { label: sale.reference },
        ]}
      >
        {sale.due_amount > 0 && (
          <>
            <button
              onClick={openPaymentModal}
              disabled={isProcessingPayment}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <CreditCardIcon className="w-4 h-4" />
              {t('saleDetail.addPayment')}
            </button>
            <button
              onClick={handlePayFull}
              disabled={isProcessingPayment}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <BanknotesIcon className="w-4 h-4" />
              {t('saleDetail.payAll')}
            </button>
          </>
        )}
        {sale.status === 'draft' && (
          <button
            onClick={handleConfirmDraft}
            disabled={isConfirming}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircleIcon className="w-4 h-4" />
            {isConfirming ? t('saleDetail.confirming') : t('saleDetail.confirmInvoice')}
          </button>
        )}
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <PrinterIcon className="w-4 h-4" />
          {t('saleDetail.print')}
        </button>
        <button
          onClick={() => setIsDeleteOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          {t('saleDetail.delete')}
        </button>
      </PageHeader>

      {/* ─── Metric tiles ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            <p className="metric-label truncate">{t('saleDetail.client')}</p>
          </div>
          <p className="metric-value truncate">{sale.client?.name || t('saleDetail.cashClient')}</p>
        </div>

        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            <p className="metric-label truncate">{t('saleDetail.date')}</p>
          </div>
          <p className="metric-value truncate">{formatDate(sale.date)}</p>
        </div>

        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            <p className="metric-label truncate">{t('saleDetail.saleStatus')}</p>
          </div>
          <div className="mt-1">{getStatusBadge(sale.status)}</div>
        </div>

        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            <p className="metric-label truncate">{t('saleDetail.paymentStatus')}</p>
          </div>
          <div className="mt-1">{getPaymentStatusBadge(sale.payment_status)}</div>
        </div>
      </div>

      {/* ─── Main grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items + payments column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profit summary */}
          <div className="surface-pro p-4">
            <h3 className="surface-heading mb-3">{t('saleDetail.invoiceSummary')}</h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="metric-tile">
                <div className="flex items-center gap-1.5">
                  <span className="metric-dot metric-dot-orange" aria-hidden />
                  <p className="metric-label truncate">{t('saleDetail.totalPurchasePrice')}</p>
                </div>
                <p className="metric-value metric-value-currency">{formatCurrency(totalCost)}</p>
              </div>
              <div className="metric-tile">
                <div className="flex items-center gap-1.5">
                  <span className="metric-dot metric-dot-green" aria-hidden />
                  <p className="metric-label truncate">{t('saleDetail.totalSalePrice')}</p>
                </div>
                <p className="metric-value metric-value-currency">{formatCurrency(totalSell)}</p>
              </div>
              <div className="metric-tile">
                <div className="flex items-center gap-1.5">
                  <span className={`metric-dot ${profit >= 0 ? 'metric-dot-blue' : 'metric-dot-red'}`} aria-hidden />
                  <p className="metric-label truncate">{t('saleDetail.profitMargin')}</p>
                </div>
                <p className="metric-value metric-value-currency">{formatCurrency(profit)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="surface-pro p-4">
            <h3 className="surface-heading mb-3">
              {t('saleDetail.products', { count: String(sale.items?.length || 0) })}
            </h3>
            <div className="table-pro-wrap">
              <table className="table-pro compact">
                <thead>
                  <tr>
                    <th>{t('saleDetail.product')}</th>
                    <th className="text-center">{t('saleDetail.piecesPerUnit')}</th>
                    <th className="text-center">{t('saleDetail.cartons')}</th>
                    <th className="text-center">{t('saleDetail.pieces')}</th>
                    <th className="text-center">{t('saleDetail.total')}</th>
                    <th className="text-center">{t('saleDetail.price')}</th>
                    <th className="text-center">{t('saleDetail.subtotalCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items?.map((item) => {
                    const piecesPerPkg = item.product?.pieces_per_package || 1;
                    const totalPieces = Math.round(item.quantity);
                    const cartons = piecesPerPkg > 1 ? Math.floor(totalPieces / piecesPerPkg) : 0;
                    const remainPcs = piecesPerPkg > 1 ? totalPieces % piecesPerPkg : totalPieces;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="t-strong">{item.product?.name || '-'}</div>
                          {item.product?.barcode && (
                            <div className="text-[11px] text-gray-400">{item.product.barcode}</div>
                          )}
                        </td>
                        <td className="text-center tnum t-muted">{piecesPerPkg > 1 ? piecesPerPkg : '-'}</td>
                        <td className="text-center tnum t-strong">{piecesPerPkg > 1 ? cartons : '-'}</td>
                        <td className="text-center tnum t-muted">{piecesPerPkg > 1 ? remainPcs : '-'}</td>
                        <td className="text-center tnum t-strong">{totalPieces}</td>
                        <td className="text-center tnum">{formatCurrency(item.unit_price)}</td>
                        <td className="text-center tnum t-strong">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments History */}
          {sale.payments && sale.payments.length > 0 && (
            <div className="surface-pro p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="surface-heading">
                  {t('saleDetail.paymentHistory', { count: String(sale.payments.length) })}
                </h3>
                <span className="text-[12px] text-gray-500 dark:text-gray-400">
                  {t('saleDetail.totalPaid')}:{' '}
                  <span className="t-strong tnum">{formatCurrency(sale.paid_amount)}</span>
                </span>
              </div>
              <div className="table-pro-wrap">
                <table className="table-pro compact">
                  <thead>
                    <tr>
                      <th className="text-center w-12">#</th>
                      <th className="text-center">{t('saleDetail.reference')}</th>
                      <th className="text-center">{t('saleDetail.paymentDate')}</th>
                      <th className="text-center">{t('saleDetail.paymentMethod')}</th>
                      <th className="text-center">{t('saleDetail.amount')}</th>
                      <th className="text-center">{t('saleDetail.by')}</th>
                      <th>{t('saleDetail.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.payments.map((payment, index) => (
                      <tr key={payment.id}>
                        <td className="text-center text-gray-500 tnum">{index + 1}</td>
                        <td className="text-center font-mono text-[12px] tnum">{payment.reference}</td>
                        <td className="text-center tnum">{formatDate(payment.date)}</td>
                        <td className="text-center">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                            <span className={`metric-dot ${getPaymentMethodDot(payment.payment_method)}`} aria-hidden />
                            {getPaymentMethodLabel(payment.payment_method)}
                          </span>
                        </td>
                        <td className="text-center tnum t-strong">{formatCurrency(payment.amount)}</td>
                        <td className="text-center t-muted">{payment.user?.name || '-'}</td>
                        <td className="t-muted text-[12px]">{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="surface-pro p-4">
            <h3 className="surface-heading mb-3">{t('saleDetail.invoiceSummary')}</h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{t('saleDetail.subtotal')}</span>
                <span className="tnum">{formatCurrency(sale.total_amount)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('saleDetail.discount')}</span>
                  <span className="tnum">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('saleDetail.tax')}</span>
                  <span className="tnum">+{formatCurrency(sale.tax)}</span>
                </div>
              )}
              {sale.shipping > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('saleDetail.shipping')}</span>
                  <span className="tnum">+{formatCurrency(sale.shipping)}</span>
                </div>
              )}
              {sale.timbre > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{locale === 'ar' ? 'الطابع' : 'Timbre'}</span>
                  <span className="tnum">+{formatCurrency(sale.timbre)}</span>
                </div>
              )}
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-[14px] font-semibold text-gray-900 dark:text-white">
                <span>{t('saleDetail.grandTotal')}</span>
                <span className="tnum">{formatCurrency(sale.grand_total)}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{t('saleDetail.paidAmount')}</span>
                <span className="tnum">{formatCurrency(sale.paid_amount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                <span>{t('saleDetail.remaining')}</span>
                <span className="tnum">{formatCurrency(sale.due_amount)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="surface-pro p-4">
            <h3 className="surface-heading mb-3">{t('saleDetail.additionalInfo')}</h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('saleDetail.warehouse')}</span>
                <span className="text-gray-700 dark:text-gray-200 font-medium">{sale.warehouse?.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('saleDetail.seller')}</span>
                <span className="text-gray-700 dark:text-gray-200 font-medium">{sale.user?.name || '-'}</span>
              </div>
              {sale.client?.code && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('saleDetail.client')}</span>
                  <span className="text-gray-700 dark:text-gray-200 font-mono text-[12px]">{sale.client.code}</span>
                </div>
              )}
              {sale.client?.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('saleDetail.clientPhone')}</span>
                  <span className="text-gray-700 dark:text-gray-200 font-medium tnum">{sale.client.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {sale.note && (
            <div className="surface-pro p-4">
              <h3 className="surface-heading mb-2">{t('saleDetail.notes')}</h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{sale.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('saleDetail.deleteInvoice')}
        message={t('saleDetail.deleteConfirmMsg', { ref: sale.reference })}
        isLoading={isDeleting}
      />

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={t('saleDetail.addPaymentTitle')}
      >
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="surface-pro p-3 text-[13px]">
            <div className="flex justify-between mb-1.5">
              <span className="text-gray-600 dark:text-gray-400">{t('saleDetail.totalAmountLabel')}</span>
              <span className="tnum t-strong">{formatCurrency(sale.grand_total)}</span>
            </div>
            <div className="flex justify-between mb-1.5">
              <span className="text-gray-600 dark:text-gray-400">{t('saleDetail.paidLabel')}</span>
              <span className="tnum t-strong">{formatCurrency(sale.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-gray-700 dark:text-gray-200">{t('saleDetail.remainingLabel')}</span>
              <span className="tnum">{formatCurrency(sale.due_amount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('saleDetail.amountField')}</label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
              className="input w-full text-[14px] py-2"
              placeholder="0.00"
              min="0"
              max={sale.due_amount}
              step="0.01"
              required
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, amount: sale.due_amount.toString() }))}
                className="text-[11px] font-medium px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('saleDetail.fullAmount')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, amount: (sale.due_amount / 2).toFixed(2) }))}
                className="text-[11px] font-medium px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('saleDetail.halfAmount')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('saleDetail.paymentMethodField')}</label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value as any }))}
              className="select w-full text-[14px] py-2"
              required
            >
              <option value="cash">{t('saleDetail.cash')}</option>
              <option value="bank">{t('saleDetail.bankTransfer')}</option>
              <option value="check">{t('saleDetail.check')}</option>
              <option value="other">{t('saleDetail.other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('saleDetail.dateField')}</label>
            <DateInput
              value={paymentData.date}
              onChange={(v) => setPaymentData(prev => ({ ...prev, date: v }))}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('saleDetail.notesField')}</label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              className="input w-full text-[14px] py-2"
              rows={2}
              placeholder={t('saleDetail.optionalNotes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsPaymentOpen(false)}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('saleDetail.cancel')}
            </button>
            <button
              type="submit"
              disabled={isProcessingPayment}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <span className="spinner w-4 h-4"></span>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  {t('saleDetail.confirmPayment')}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
