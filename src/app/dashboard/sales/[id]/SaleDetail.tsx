'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { salesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import { useLocale } from '@/lib/i18n/context';

import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  PrinterIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BanknotesIcon,
  TruckIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';

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
  const { t, locale, dir } = useLocale();
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

  const BackArrowIcon = dir === 'rtl' ? ArrowRightIcon : ArrowLeftIcon;

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
    const statusConfig: Record<string, { bg: string; darkBg: string; text: string; darkText: string; icon: any; label: string }> = {
      draft: { bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-800', darkText: 'dark:text-blue-300', icon: ClockIcon, label: t('saleDetail.draft') },
      pending: { bg: 'bg-yellow-100', darkBg: 'dark:bg-yellow-900/30', text: 'text-yellow-800', darkText: 'dark:text-yellow-300', icon: ClockIcon, label: t('saleDetail.pending') },
      completed: { bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', text: 'text-green-800', darkText: 'dark:text-green-300', icon: CheckCircleIcon, label: t('saleDetail.completed') },
      cancelled: { bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', text: 'text-red-800', darkText: 'dark:text-red-300', icon: XCircleIcon, label: t('saleDetail.cancelled') },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.darkBg} ${config.text} ${config.darkText}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; darkBg: string; text: string; darkText: string; icon: any; label: string }> = {
      unpaid: { bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', text: 'text-red-800', darkText: 'dark:text-red-300', icon: XCircleIcon, label: t('saleDetail.unpaid') },
      partial: { bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', text: 'text-orange-800', darkText: 'dark:text-orange-300', icon: BanknotesIcon, label: t('saleDetail.partial') },
      paid: { bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', text: 'text-green-800', darkText: 'dark:text-green-300', icon: CheckCircleIcon, label: t('saleDetail.paid') },
    };
    const config = statusConfig[status] || statusConfig.unpaid;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.darkBg} ${config.text} ${config.darkText}`}>
        <Icon className="w-4 h-4" />
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
      <div className="text-center py-16">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('saleDetail.notFound')}</h3>
        <Link href="/dashboard/sales" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          {t('saleDetail.backToSales')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sales"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <BackArrowIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sale.reference}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('saleDetail.createdAt', { date: formatDate(sale.created_at) })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sale.due_amount > 0 && (
            <>
              <button
                onClick={openPaymentModal}
                className="btn btn-primary"
                disabled={isProcessingPayment}
              >
                <CreditCardIcon className="w-5 h-5" />
                {t('saleDetail.addPayment')}
              </button>
              <button
                onClick={handlePayFull}
                className="btn bg-green-600 text-white hover:bg-green-700"
                disabled={isProcessingPayment}
              >
                <CheckCircleIcon className="w-5 h-5" />
                {t('saleDetail.payAll')}
              </button>
            </>
          )}
          {sale.status === 'draft' && (
            <button
              onClick={handleConfirmDraft}
              disabled={isConfirming}
              className="btn bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircleIcon className="w-5 h-5" />
              {isConfirming ? t('saleDetail.confirming') : t('saleDetail.confirmInvoice')}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
          >
            <PrinterIcon className="w-5 h-5" />
            {t('saleDetail.print')}
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="btn bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <TrashIcon className="w-5 h-5" />
            {t('saleDetail.delete')}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('saleDetail.client')}</p>
              <p className="font-semibold dark:text-gray-100">{sale.client?.name || t('saleDetail.cashClient')}</p>
              {sale.client?.code && (
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">{sale.client.code}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('saleDetail.date')}</p>
              <p className="font-semibold dark:text-gray-100">{formatDate(sale.date)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('saleDetail.saleStatus')}</p>
          {getStatusBadge(sale.status)}
        </div>

        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('saleDetail.paymentStatus')}</p>
          {getPaymentStatusBadge(sale.payment_status)}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Table */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Summary totals at top */}
            {(() => {
              const totalCost = sale.items?.reduce((sum, item) => {
                const ppp = item.product?.pieces_per_package || 1;
                const totalPieces = Math.round(item.quantity);
                const costPrice = Number(item.product?.cost_price) || 0;
                return sum + (costPrice * totalPieces);
              }, 0) || 0;
              const totalSell = sale.items?.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0) || 0;
              const profit = totalSell - totalCost;
              return (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
                    <p className="text-xs text-orange-600 dark:text-orange-400">{t('saleDetail.totalPurchasePrice')}</p>
                    <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{formatCurrency(totalCost)}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600 dark:text-green-400">{t('saleDetail.totalSalePrice')}</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(totalSell)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600 dark:text-blue-400">{t('saleDetail.profitMargin')}</p>
                    <p className={`text-lg font-bold ${profit >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(profit)}</p>
                  </div>
                </div>
              );
            })()}

            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">{t('saleDetail.products', { count: String(sale.items?.length || 0) })}</h3>
            <div className="overflow-x-auto">
              <table>
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
                  {sale.items?.map((item, index) => {
                    const piecesPerPkg = item.product?.pieces_per_package || 1;
                    const totalPieces = Math.round(item.quantity);
                    const cartons = piecesPerPkg > 1 ? Math.floor(totalPieces / piecesPerPkg) : 0;
                    const remainPcs = piecesPerPkg > 1 ? totalPieces % piecesPerPkg : totalPieces;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="font-medium dark:text-gray-100">{item.product?.name || '-'}</div>
                          {item.product?.barcode && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">{item.product.barcode}</div>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {piecesPerPkg > 1 ? piecesPerPkg : '-'}
                          </span>
                        </td>
                        <td className="text-center font-bold dark:text-gray-100">{piecesPerPkg > 1 ? cartons : '-'}</td>
                        <td className="text-center text-gray-600 dark:text-gray-400">{piecesPerPkg > 1 ? remainPcs : '-'}</td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                            {totalPieces}
                          </span>
                        </td>
                        <td className="text-center dark:text-gray-300">{formatCurrency(item.unit_price)}</td>
                        <td className="text-center font-semibold dark:text-gray-100">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments History */}
          {sale.payments && sale.payments.length > 0 && (
            <div className="card mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold dark:text-gray-100">{t('saleDetail.paymentHistory', { count: String(sale.payments.length) })}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('saleDetail.totalPaid')}: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(sale.paid_amount)}</span>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table>
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
                        <td className="text-center text-gray-500 dark:text-gray-400">{index + 1}</td>
                        <td className="text-center font-mono text-sm dark:text-gray-300">{payment.reference}</td>
                        <td className="text-center dark:text-gray-300">{formatDate(payment.date)}</td>
                        <td className="text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            payment.payment_method === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            payment.payment_method === 'bank' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            payment.payment_method === 'check' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {getPaymentMethodLabel(payment.payment_method)}
                          </span>
                        </td>
                        <td className="text-center font-semibold text-green-600 dark:text-green-400">{formatCurrency(payment.amount)}</td>
                        <td className="text-center text-gray-600 dark:text-gray-400">{payment.user?.name || '-'}</td>
                        <td className="text-gray-500 dark:text-gray-400 text-sm">{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">{t('saleDetail.invoiceSummary')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{t('saleDetail.subtotal')}</span>
                <span>{formatCurrency(sale.total_amount)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>{t('saleDetail.discount')}</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>{t('saleDetail.tax')}</span>
                  <span>+{formatCurrency(sale.tax)}</span>
                </div>
              )}
              {sale.shipping > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('saleDetail.shipping')}</span>
                  <span>+{formatCurrency(sale.shipping)}</span>
                </div>
              )}
              <hr className="dark:border-gray-700" />
              <div className="flex justify-between text-lg font-bold dark:text-gray-100">
                <span>{t('saleDetail.grandTotal')}</span>
                <span className="text-green-600 dark:text-green-400">{formatCurrency(sale.grand_total)}</span>
              </div>
              <hr className="dark:border-gray-700" />
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{t('saleDetail.paidAmount')}</span>
                <span className="text-green-600 dark:text-green-400">{formatCurrency(sale.paid_amount)}</span>
              </div>
              <div className="flex justify-between font-semibold dark:text-gray-100">
                <span>{t('saleDetail.remaining')}</span>
                <span className={sale.due_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                  {formatCurrency(sale.due_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">{t('saleDetail.additionalInfo')}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <BuildingStorefrontIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('saleDetail.warehouse')}</p>
                  <p className="font-medium dark:text-gray-100">{sale.warehouse?.name || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('saleDetail.seller')}</p>
                  <p className="font-medium dark:text-gray-100">{sale.user?.name || '-'}</p>
                </div>
              </div>
              {sale.client?.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('saleDetail.clientPhone')}</p>
                    <p className="font-medium dark:text-gray-100">{sale.client.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {sale.note && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">{t('saleDetail.notes')}</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{sale.note}</p>
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
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">{t('saleDetail.totalAmountLabel')}</span>
              <span className="font-semibold dark:text-gray-100">{formatCurrency(sale.grand_total)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">{t('saleDetail.paidLabel')}</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(sale.paid_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('saleDetail.remainingLabel')}</span>
              <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(sale.due_amount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('saleDetail.amountField')}</label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
              className="input w-full"
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
                className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
              >
                {t('saleDetail.fullAmount')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, amount: (sale.due_amount / 2).toFixed(2) }))}
                className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t('saleDetail.halfAmount')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('saleDetail.paymentMethodField')}</label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value as any }))}
              className="select w-full"
              required
            >
              <option value="cash">{t('saleDetail.cash')}</option>
              <option value="bank">{t('saleDetail.bankTransfer')}</option>
              <option value="check">{t('saleDetail.check')}</option>
              <option value="other">{t('saleDetail.other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('saleDetail.dateField')}</label>
            <DateInput
              value={paymentData.date}
              onChange={(v) => setPaymentData(prev => ({ ...prev, date: v }))}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('saleDetail.notesField')}</label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              className="input w-full"
              rows={2}
              placeholder={t('saleDetail.optionalNotes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsPaymentOpen(false)}
              className="btn btn-secondary"
            >
              {t('saleDetail.cancel')}
            </button>
            <button
              type="submit"
              disabled={isProcessingPayment}
              className="btn btn-primary"
            >
              {isProcessingPayment ? (
                <span className="spinner w-5 h-5"></span>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
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
