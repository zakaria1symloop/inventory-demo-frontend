'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { purchasesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import { formatQty, formatQtyLong } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowRightIcon,
  PrinterIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BanknotesIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  UserIcon,
  CreditCardIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { useLocale } from '@/lib/i18n/context';

interface PurchaseItem {
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
    pieces_per_package?: number;
    unit_buy?: { id: number; name: string; short_name: string };
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

interface Purchase {
  id: number;
  reference: string;
  supplier_id: number;
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
  status: 'pending' | 'received' | 'partial';
  payment_status: 'unpaid' | 'partial' | 'paid';
  note?: string;
  supplier?: { id: number; name: string; phone?: string; address?: string };
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
  items?: PurchaseItem[];
  payments?: Payment[];
  created_at: string;
  updated_at: string;
}

export default function PurchaseDetail() {
  const params = useParams();
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const [id, setId] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
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
    if (id) fetchPurchase();
  }, [id]);

  const fetchPurchase = async () => {
    if (!id) return;
    try {
      const response = await purchasesApi.getOne(parseInt(id));
      setPurchase(response.data.data || response.data);
    } catch (error) {
      toast.error(t('purchases.dataLoadError'));
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: ClockIcon, label: t('purchases.pendingLabel') },
      received: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircleIcon, label: t('purchases.receivedLabel') },
      partial: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: TruckIcon, label: t('purchases.partialLabel') },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      unpaid: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: XCircleIcon, label: t('purchases.unpaidLabel') },
      partial: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', icon: BanknotesIcon, label: t('purchases.partiallyPaid') },
      paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircleIcon, label: t('purchases.paidLabel') },
    };
    const config = statusConfig[status] || statusConfig.unpaid;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: t('purchases.cash'),
      bank: t('purchases.bankTransfer'),
      check: t('purchases.check'),
      other: t('purchases.other'),
    };
    return methods[method] || method;
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة شراء - ${purchase?.reference}</title>
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
          th, td { padding: 12px; text-align: right; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          .totals { margin-top: 20px; text-align: left; }
          .totals .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .totals .row.grand { font-size: 18px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>فاتورة شراء</h1>
          <div class="ref">${purchase?.reference}</div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>المورد</h3>
            <p>${purchase?.supplier?.name || '-'}</p>
            ${purchase?.supplier?.phone ? `<p style="font-size:12px;color:#666">${purchase.supplier.phone}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>التاريخ</h3>
            <p>${purchase?.date ? formatDate(purchase.date) : '-'}</p>
          </div>
          <div class="info-box">
            <h3>المستودع</h3>
            <p>${purchase?.warehouse?.name || '-'}</p>
          </div>
          <div class="info-box">
            <h3>المستخدم</h3>
            <p>${purchase?.user?.name || '-'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>المنتج</th>
              <th>ق/ك</th>
              <th>قطع</th>
              <th>كراتين</th>
              <th>السعر/قطعة</th>
              <th>الخصم</th>
              <th>الضريبة</th>
              <th>المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${purchase?.items?.map((item: any, index: number) => {
              const ppp = item.product?.pieces_per_package || 1;
              const totalPieces = Math.round(item.quantity);
              const cartons = Math.floor(totalPieces / ppp);
              const remainPcs = totalPieces % ppp;
              const cartonsDisplay = ppp > 1 ? (remainPcs > 0 ? cartons + ' + ' + remainPcs + '\u0642' : '' + cartons) : '-';
              return '<tr>'
                + '<td>' + (index + 1) + '</td>'
                + '<td>' + (item.product?.name || '-') + '</td>'
                + '<td style="text-align:center"><span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:10px;font-size:12px">' + ppp + '</span></td>'
                + '<td style="text-align:center;font-weight:bold">' + totalPieces + '</td>'
                + '<td style="text-align:center">' + cartonsDisplay + '</td>'
                + '<td>' + formatCurrency(item.unit_price) + '</td>'
                + '<td>' + formatCurrency(item.discount) + '</td>'
                + '<td>' + formatCurrency(item.tax) + '</td>'
                + '<td><strong>' + formatCurrency(item.subtotal) + '</strong></td>'
                + '</tr>';
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="row"><span>المجموع الفرعي:</span><span>${formatCurrency(purchase?.total_amount || 0)}</span></div>
          <div class="row"><span>الخصم:</span><span>${formatCurrency(purchase?.discount || 0)}</span></div>
          <div class="row"><span>الضريبة:</span><span>${formatCurrency(purchase?.tax || 0)}</span></div>
          <div class="row"><span>الشحن:</span><span>${formatCurrency(purchase?.shipping || 0)}</span></div>
          ${(purchase?.timbre || 0) > 0 ? `<div class="row"><span>الطابع:</span><span>${formatCurrency(purchase?.timbre || 0)}</span></div>` : ''}
          <div class="row grand"><span>المجموع النهائي:</span><span>${formatCurrency(purchase?.grand_total || 0)}</span></div>
          <div class="row"><span>المدفوع:</span><span>${formatCurrency(purchase?.paid_amount || 0)}</span></div>
          <div class="row" style="color: ${(purchase?.due_amount || 0) > 0 ? 'red' : 'green'}"><span>المتبقي:</span><span>${formatCurrency(purchase?.due_amount || 0)}</span></div>
        </div>

        ${purchase?.note ? `<div style="margin-top:30px;padding:15px;background:#f9f9f9;border-radius:8px"><strong>ملاحظات:</strong><p>${purchase.note}</p></div>` : ''}

        <div class="footer">
          <p>${t('purchases.printedAt')} ${new Date().toLocaleDateString('ar-DZ')}</p>
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
    if (!purchase) return;
    setIsDeleting(true);
    try {
      await purchasesApi.delete(purchase.id);
      toast.success(t('purchases.deleteSuccessDetail'));
      router.push('/dashboard/purchases');
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.deleteErrorDetail');
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const openPaymentModal = () => {
    if (!purchase) return;
    setPaymentData({
      amount: purchase.due_amount.toString(),
      payment_method: 'cash',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsPaymentOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchase) return;

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('purchases.validAmountError'));
      return;
    }

    if (amount > purchase.due_amount) {
      toast.error(t('purchases.amountExceedsError'));
      return;
    }

    setIsProcessingPayment(true);
    try {
      await purchasesApi.addPayment(purchase.id, {
        amount,
        payment_method: paymentData.payment_method,
        notes: paymentData.notes,
        date: paymentData.date,
      });
      toast.success(t('purchases.paymentSuccessful'));
      setIsPaymentOpen(false);
      fetchPurchase(); // Reload purchase data
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.paymentError');
      toast.error(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayFull = async () => {
    if (!purchase || purchase.due_amount <= 0) return;

    setIsProcessingPayment(true);
    try {
      await purchasesApi.addPayment(purchase.id, {
        amount: parseFloat(String(purchase.due_amount)),
        payment_method: 'cash',
        notes: t('purchases.fullPaymentNote'),
        date: new Date().toISOString().split('T')[0],
      });
      toast.success(t('purchases.fullPaymentDone'));
      fetchPurchase();
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.paymentError');
      toast.error(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleConfirm = async () => {
    if (!purchase || purchase.status !== 'pending') return;
    setIsConfirming(true);
    try {
      await purchasesApi.confirm(purchase.id);
      toast.success(t('purchases.confirmSuccessDetail'));
      fetchPurchase();
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.confirmErrorDetail');
      toast.error(message);
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('purchases.notFoundTitle')}</h3>
        <Link href="/dashboard/purchases" className="text-blue-600 hover:text-blue-800">
          {t('purchases.backToPurchases')}
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
            href="/dashboard/purchases"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{purchase.reference}</h1>
            <p className="text-sm text-gray-500">
              {t('purchases.createdAt', { date: formatDate(purchase.created_at) })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {purchase.status === 'pending' && (
            <>
              <button
                onClick={handleConfirm}
                className="btn bg-green-600 text-white hover:bg-green-700 shadow-sm"
                disabled={isConfirming}
              >
                <CheckCircleIcon className="w-5 h-5" />
                {isConfirming ? t('purchases.confirming') : t('purchases.confirmReceipt')}
              </button>
              <Link
                href={`/dashboard/purchases/edit/${purchase.id}`}
                className="btn btn-secondary"
              >
                <PencilIcon className="w-5 h-5" />
                {t('purchases.edit')}
              </Link>
              <button
                onClick={handlePrint}
                className="btn btn-secondary"
              >
                <PrinterIcon className="w-5 h-5" />
                {t('purchases.print')}
              </button>
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="btn bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <TrashIcon className="w-5 h-5" />
                {t('purchases.delete')}
              </button>
            </>
          )}
          {purchase.status === 'received' && (
            <>
              {purchase.due_amount > 0 && (
                <>
                  <button
                    onClick={openPaymentModal}
                    className="btn btn-primary"
                    disabled={isProcessingPayment}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    {t('purchases.addPayment')}
                  </button>
                  <button
                    onClick={handlePayFull}
                    className="btn bg-green-600 text-white hover:bg-green-700"
                    disabled={isProcessingPayment}
                  >
                    <BanknotesIcon className="w-5 h-5" />
                    {t('purchases.payAll')}
                  </button>
                </>
              )}
              <Link
                href={`/dashboard/purchases/edit/${purchase.id}`}
                className="btn btn-secondary"
              >
                <PencilIcon className="w-5 h-5" />
                {t('purchases.edit')}
              </Link>
              <button
                onClick={handlePrint}
                className="btn btn-secondary"
              >
                <PrinterIcon className="w-5 h-5" />
                {t('purchases.print')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BuildingStorefrontIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('purchases.supplier')}</p>
              <p className="font-semibold">{purchase.supplier?.name || t('purchases.noSupplierLabel')}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('purchases.date')}</p>
              <p className="font-semibold">{formatDate(purchase.date)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500 mb-2">{t('purchases.receivingStatus')}</p>
          {getStatusBadge(purchase.status)}
        </div>

        <div className="card">
          <p className="text-sm text-gray-500 mb-2">{t('purchases.paymentStatusLabel')}</p>
          {purchase.status === 'pending' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <ClockIcon className="w-4 h-4" />
              {t('purchases.awaitingConfirm')}
            </span>
          ) : (
            getPaymentStatusBadge(purchase.payment_status)
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Table */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">{t('purchases.products', { count: String(purchase.items?.length || 0) })}</h3>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th className="text-center w-12">#</th>
                    <th>{t('purchases.product')}</th>
                    <th className="text-center">{t('purchases.quantity')}</th>
                    <th className="text-center">{t('purchases.price')}</th>
                    <th className="text-center">{t('purchases.piecesPerUnit')}</th>
                    <th className="text-center">{t('purchases.discount')}</th>
                    <th className="text-center">{t('purchases.tax')}</th>
                    <th className="text-center">{t('purchases.subtotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.items?.map((item, index) => {
                    const piecesPerPkg = item.product?.pieces_per_package || 1;
                    return (
                      <tr key={item.id}>
                        <td className="text-center text-gray-500">{index + 1}</td>
                        <td>
                          <div className="font-medium">{item.product?.name || '-'}</div>
                          {item.product?.barcode && (
                            <div className="text-xs text-gray-400">{item.product.barcode}</div>
                          )}
                        </td>
                        <td className="text-center font-semibold">{formatQty(item.quantity, piecesPerPkg)}</td>
                        <td className="text-center">
                          {formatCurrency(item.unit_price)}
                          {piecesPerPkg > 1 && (
                            <div className="text-xs text-blue-500">({formatCurrency(item.unit_price * piecesPerPkg)}/carton)</div>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {piecesPerPkg}
                          </span>
                        </td>
                        <td className="text-center text-red-600 dark:text-red-400">{item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}</td>
                        <td className="text-center text-blue-600 dark:text-blue-400">{item.tax > 0 ? formatCurrency(item.tax) : '-'}</td>
                        <td className="text-center font-semibold">
                          {formatCurrency(item.subtotal)}
                          <div className="text-xs text-gray-400">
                            {item.unit_price} × {piecesPerPkg} × {formatQty(item.quantity, piecesPerPkg)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments History */}
          {purchase.payments && purchase.payments.length > 0 && (
            <div className="card mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('purchases.paymentHistory', { count: String(purchase.payments.length) })}</h3>
                <span className="text-sm text-gray-500">
                  {t('purchases.totalPaid')}: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(purchase.paid_amount)}</span>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th className="text-center w-12">#</th>
                      <th className="text-center">{t('purchases.paymentRef')}</th>
                      <th className="text-center">{t('purchases.paymentDate')}</th>
                      <th className="text-center">{t('purchases.paymentMethod')}</th>
                      <th className="text-center">{t('purchases.amount')}</th>
                      <th className="text-center">{t('purchases.by')}</th>
                      <th>{t('purchases.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.payments.map((payment, index) => (
                      <tr key={payment.id}>
                        <td className="text-center text-gray-500">{index + 1}</td>
                        <td className="text-center font-mono text-sm">{payment.reference}</td>
                        <td className="text-center">{formatDate(payment.date)}</td>
                        <td className="text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            payment.payment_method === 'cash' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                            payment.payment_method === 'bank' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                            payment.payment_method === 'check' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {getPaymentMethodLabel(payment.payment_method)}
                          </span>
                        </td>
                        <td className="text-center font-semibold text-green-600 dark:text-green-400">{formatCurrency(payment.amount)}</td>
                        <td className="text-center text-gray-600 dark:text-gray-400">{payment.user?.name || '-'}</td>
                        <td className="text-gray-500 text-sm">{payment.notes || '-'}</td>
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
            <h3 className="text-lg font-semibold mb-4">{t('purchases.invoiceSummary')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{t('purchases.subtotalAmount')}</span>
                <span>{formatCurrency(purchase.total_amount)}</span>
              </div>
              {purchase.discount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>{t('purchases.discount')}</span>
                  <span>-{formatCurrency(purchase.discount)}</span>
                </div>
              )}
              {purchase.tax > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>{t('purchases.tax')}</span>
                  <span>+{formatCurrency(purchase.tax)}</span>
                </div>
              )}
              {purchase.shipping > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('purchases.shipping')}</span>
                  <span>+{formatCurrency(purchase.shipping)}</span>
                </div>
              )}
              {purchase.timbre > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{locale === 'ar' ? 'الطابع' : 'Timbre'}</span>
                  <span>+{formatCurrency(purchase.timbre)}</span>
                </div>
              )}
              <hr className="dark:border-gray-700" />
              <div className="flex justify-between text-lg font-bold">
                <span>{t('purchases.grandTotal')}</span>
                <span className="text-green-600 dark:text-green-400">{formatCurrency(purchase.grand_total)}</span>
              </div>
              {purchase.status === 'pending' ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 text-center">
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">{t('purchases.unconfirmedInvoice')}</p>
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">{t('purchases.debtAfterConfirm')}</p>
                </div>
              ) : (
                <>
                  <hr className="dark:border-gray-700" />
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t('purchases.paidAmount')}</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(purchase.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>{t('purchases.remainingAmount')}</span>
                    <span className={purchase.due_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                      {formatCurrency(purchase.due_amount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">{t('purchases.additionalInfo')}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <TruckIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('purchases.warehouse')}</p>
                  <p className="font-medium">{purchase.warehouse?.name || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('purchases.by')}</p>
                  <p className="font-medium">{purchase.user?.name || '-'}</p>
                </div>
              </div>
              {purchase.supplier?.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('purchases.supplierPhone')}</p>
                    <p className="font-medium">{purchase.supplier.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {purchase.note && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">{t('purchases.notes')}</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{purchase.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('purchases.deleteInvoice')}
        message={t('purchases.deleteInvoiceMsg', { ref: purchase.reference })}
        isLoading={isDeleting}
      />

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={t('purchases.addPaymentTitle')}
      >
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">{t('purchases.totalAmountLabel')}</span>
              <span className="font-semibold">{formatCurrency(purchase.grand_total)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">{t('purchases.paidAmount')}:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(purchase.paid_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('purchases.remainingAmount')}:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(purchase.due_amount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.amount')}</label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
              className="input w-full"
              placeholder="0.00"
              min="0"
              max={purchase.due_amount}
              step="0.01"
              required
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, amount: purchase.due_amount.toString() }))}
                className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
              >
                {t('purchases.fullAmount')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentData(prev => ({ ...prev, amount: (purchase.due_amount / 2).toFixed(2) }))}
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t('purchases.halfAmount')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.paymentMethod')}</label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value as any }))}
              className="select w-full"
              required
            >
              <option value="cash">{t('purchases.cash')}</option>
              <option value="bank">{t('purchases.bankTransfer')}</option>
              <option value="check">{t('purchases.check')}</option>
              <option value="other">{t('purchases.other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.paymentDate')}</label>
            <DateInput
              value={paymentData.date}
              onChange={(v) => setPaymentData(prev => ({ ...prev, date: v }))}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.notes')}</label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              className="input w-full"
              rows={2}
              placeholder={t('purchases.optionalNotes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsPaymentOpen(false)}
              className="btn btn-secondary"
            >
              {t('purchases.cancel')}
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
                  {t('purchases.confirmPayment')}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
