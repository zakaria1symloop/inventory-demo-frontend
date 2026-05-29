'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { caissesApi, dispensesApi, usersApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import { Caisse, CaisseTransaction, CaisseSettlement, CaisseSummary } from '@/lib/types';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  ArrowsRightLeftIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const typeDot: Record<string, string> = {
  principale: 'metric-dot-violet',
  vendeur: 'metric-dot-blue',
  livreur: 'metric-dot-green',
  cashvan: 'metric-dot-orange',
};

export default function CaissesPage() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const BackArrowIcon = isRTL ? ArrowRightIcon : ArrowLeftIcon;

  // Translate backend Arabic descriptions to current locale
  const translateDescription = useCallback((desc: string | undefined | null): string => {
    if (!desc) return '-';
    if (locale === 'ar') return desc;
    const replacements: [string, string][] = [
      ['دفعة لفاتورة شراء', t('caisses.descPaymentForPurchase')],
      ['دفعة لفاتورة بيع', t('caisses.descPaymentForSale')],
      ['دفعة لمرتجع شراء', t('caisses.descPaymentForPurchaseReturn')],
      ['دفعة لمرتجع بيع', t('caisses.descPaymentForSaleReturn')],
      ['دفع دين للعميل', t('caisses.descDebtPayment')],
      ['دفع دين', t('caisses.descDebtPaymentShort')],
      ['تحصيل كامل الرصيد', t('caisses.collectAllBalanceNotes')],
      ['تحويل مخزون', t('caisses.descStockTransfer')],
      ['تحويل من', t('caisses.descTransferFrom')],
      ['تحويل إلى', t('caisses.descTransferTo')],
      ['مرتجع شراء', t('caisses.descPurchaseReturn')],
      ['مرتجع بيع', t('caisses.descSaleReturn')],
      ['فاتورة شراء', t('caisses.descPurchaseInvoice')],
      ['فاتورة بيع', t('caisses.descSaleInvoice')],
      ['بيع متنقل', t('caisses.descVanSale')],
      ['تعديل رصيد', t('caisses.descAdjustment')],
      ['للعميل:', t('caisses.descForClient') + ':'],
      ['العميل:', t('caisses.descClient') + ':'],
      ['مصروف', t('caisses.descExpense')],
      ['تحصيل', t('caisses.descSettlement')],
      ['توصيل', t('caisses.descDelivery')],
    ];
    let result = desc;
    for (const [ar, translated] of replacements) {
      result = result.replaceAll(ar, translated);
    }
    return result;
  }, [locale, t]);

  const typeLabels: Record<string, string> = {
    principale: t('caisses.principale'),
    vendeur: t('caisses.vendeur'),
    livreur: t('caisses.livreur'),
    cashvan: t('caisses.cashvan'),
  };

  const sourceTypeLabels: Record<string, string> = {
    van_sale: t('caisses.sourceVanSale'),
    sale: t('caisses.sourceSale'),
    delivery: t('caisses.sourceDelivery'),
    payment: t('caisses.sourcePayment'),
    purchase: t('caisses.sourcePurchase'),
    dispense: t('caisses.sourceDispense'),
    settlement: t('caisses.sourceSettlement'),
    adjustment: t('caisses.sourceAdjustment'),
    transfer: t('caisses.sourceTransfer'),
    sale_return: t('caisses.sourceSaleReturn'),
    purchase_return: t('caisses.sourcePurchaseReturn'),
    stock_transfer: t('caisses.sourceStockTransfer'),
    'App\\Models\\Sale': t('caisses.sourceSale'),
    'App\\Models\\Purchase': t('caisses.sourcePurchase'),
    'App\\Models\\SaleReturn': t('caisses.sourceSaleReturn'),
    'App\\Models\\PurchaseReturn': t('caisses.sourcePurchaseReturn'),
  };

  const roleLabels: Record<string, string> = {
    admin: t('caisses.roleAdmin'),
    manager: t('caisses.roleManager'),
    seller: t('caisses.roleSeller'),
    livreur: t('caisses.roleLivreur'),
    cashvan: t('caisses.roleCashvan'),
  };

  const [summary, setSummary] = useState<CaisseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCaisse, setSelectedCaisse] = useState<Caisse | null>(null);
  const [transactions, setTransactions] = useState<CaisseTransaction[]>([]);
  const [settlements, setSettlements] = useState<CaisseSettlement[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleForm, setSettleForm] = useState({
    amount: 0,
    type: 'admin_collect' as string,
    notes: '',
  });
  const [isSettling, setIsSettling] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('');
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_caisse_id: 0,
    to_caisse_id: 0,
    amount: 0,
    notes: '',
  });
  const [isTransferring, setIsTransferring] = useState(false);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'other',
    amount: 0,
    description: '',
    notes: '',
  });
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [usersWithoutCaisse, setUsersWithoutCaisse] = useState<{ id: number; name: string; role: string; hasCaisse?: boolean }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newCaisseName, setNewCaisseName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameCaisse, setRenameCaisse] = useState<Caisse | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyForm, setAddMoneyForm] = useState({ amount: 0, notes: '' });
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [showCollectAllConfirm, setShowCollectAllConfirm] = useState(false);
  const [isCollectingAll, setIsCollectingAll] = useState(false);

  const [filteredTotals, setFilteredTotals] = useState<{ total_in: number; total_out: number; net: number } | null>(null);

  const [listSearch, setListSearch] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState('');

  const [showTour, setShowTour] = useState(false);

  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="caisses-header"]',
      title: t('caisses.tourHeaderStep'),
      desc: t('caisses.tourHeaderDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="caisses-summary"]',
      title: t('caisses.tourSummary'),
      desc: t('caisses.tourSummaryDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="caisses-grid"]',
      title: t('caisses.tourGrid'),
      desc: t('caisses.tourGridDesc'),
      position: 'top' as const,
    },
  ], [t]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await caissesApi.getSummary();
      setSummary(res.data);
    } catch {
      toast.error(t('caisses.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = async () => {
    setShowCreateModal(true);
    setSelectedUserId(0);
    setIsLoadingUsers(true);
    try {
      const usersRes = await usersApi.getAll({ per_page: 1000 });
      const allUsers = usersRes.data.data || usersRes.data || [];
      const caisseUserIds = new Set((summary?.caisses || []).map((c: Caisse) => c.user_id));
      const available = allUsers
        .filter((u: { id: number; role: string }) => u.role !== 'manager')
        .map((u: { id: number; name: string; role: string }) => ({
          ...u,
          hasCaisse: caisseUserIds.has(u.id),
        }));
      setUsersWithoutCaisse(available);
    } catch {
      toast.error(t('caisses.loadUsersError'));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error(t('caisses.selectUserError'));
      return;
    }
    setIsCreating(true);
    try {
      await caissesApi.create({ user_id: selectedUserId, name: newCaisseName || undefined });
      toast.success(t('caisses.createSuccess'));
      setShowCreateModal(false);
      await fetchSummary();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('caisses.createError'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleRename = async () => {
    if (!renameCaisse) return;
    setIsRenaming(true);
    try {
      await caissesApi.update(renameCaisse.id, { name: renameValue || null });
      toast.success(t('caisses.renameSuccess'));
      setShowRenameModal(false);
      setRenameCaisse(null);
      await fetchSummary();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('caisses.renameError'));
    } finally {
      setIsRenaming(false);
    }
  };

  const openCaisseDetail = async (caisse: Caisse) => {
    setSelectedCaisse(caisse);
    setIsLoadingDetail(true);
    setTransactionPage(1);
    setTransactionFilter('');
    setSourceFilter('');
    setDateFrom('');
    setDateTo('');
    try {
      const [detailRes, txRes] = await Promise.all([
        caissesApi.getOne(caisse.id),
        caissesApi.getTransactions(caisse.id, { per_page: 20, page: 1 }),
      ]);
      setSelectedCaisse(detailRes.data.caisse);
      setTransactions(txRes.data.data || []);
      setTransactionTotal(txRes.data.last_page || 1);
      setSettlements(detailRes.data.recent_settlements || []);
      if (txRes.data.totals) {
        setFilteredTotals(txRes.data.totals);
      }
    } catch {
      toast.error(t('caisses.loadDetailError'));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const hasActiveFilters = !!(transactionFilter || sourceFilter || dateFrom || dateTo);

  const loadTransactions = async (page: number, filter?: string, source?: string, from?: string, to?: string) => {
    if (!selectedCaisse) return;
    try {
      const params: Record<string, unknown> = { per_page: 20, page };
      if (filter) params.type = filter;
      if (source) params.source_type = source;
      if (from) params.from_date = from;
      if (to) params.to_date = to;
      const res = await caissesApi.getTransactions(selectedCaisse.id, params);
      setTransactions(res.data.data || []);
      setTransactionTotal(res.data.last_page || 1);
      setTransactionPage(page);
      if (res.data.totals) {
        setFilteredTotals(res.data.totals);
      }
    } catch {
      toast.error(t('caisses.loadTransactionsError'));
    }
  };

  const reloadTransactions = (overrides: { page?: number; filter?: string; source?: string; from?: string; to?: string } = {}) => {
    loadTransactions(
      overrides.page ?? 1,
      overrides.filter ?? transactionFilter,
      overrides.source ?? sourceFilter,
      overrides.from ?? dateFrom,
      overrides.to ?? dateTo,
    );
  };

  const setQuickDate = (range: 'today' | 'week' | 'month') => {
    const today = new Date();
    const toStr = today.toISOString().split('T')[0];
    let fromStr = toStr;
    if (range === 'week') {
      const d = new Date(today);
      d.setDate(d.getDate() - d.getDay());
      fromStr = d.toISOString().split('T')[0];
    } else if (range === 'month') {
      fromStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    }
    setDateFrom(fromStr);
    setDateTo(toStr);
    reloadTransactions({ from: fromStr, to: toStr });
  };

  const handleCollectAll = async () => {
    if (!selectedCaisse || Number(selectedCaisse.balance) <= 0) return;
    setIsCollectingAll(true);
    try {
      await caissesApi.settle(selectedCaisse.id, {
        amount: Number(selectedCaisse.balance),
        type: 'admin_collect',
        notes: t('caisses.collectAllBalanceNotes'),
      });
      toast.success(t('caisses.collectAllSuccess'));
      setShowCollectAllConfirm(false);
      await Promise.all([fetchSummary(), openCaisseDetail(selectedCaisse)]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('caisses.collectError'));
    } finally {
      setIsCollectingAll(false);
    }
  };

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaisse || addMoneyForm.amount <= 0) return;
    setIsAddingMoney(true);
    try {
      await caissesApi.adjust(selectedCaisse.id, {
        amount: addMoneyForm.amount,
        type: 'add',
        notes: addMoneyForm.notes || undefined,
      });
      toast.success(t('caisses.addMoneySuccess'));
      setShowAddMoneyModal(false);
      setAddMoneyForm({ amount: 0, notes: '' });
      await Promise.all([fetchSummary(), openCaisseDetail(selectedCaisse)]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('caisses.addMoneyError'));
    } finally {
      setIsAddingMoney(false);
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaisse || settleForm.amount <= 0) {
      toast.error(t('caisses.invalidAmount'));
      return;
    }
    setIsSettling(true);
    try {
      await caissesApi.settle(selectedCaisse.id, settleForm);
      toast.success(t('caisses.collectSuccess'));
      setShowSettleModal(false);
      setSettleForm({ amount: 0, type: 'admin_collect', notes: '' });
      await Promise.all([fetchSummary(), openCaisseDetail(selectedCaisse)]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('caisses.collectError'));
    } finally {
      setIsSettling(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.from_caisse_id || !transferForm.to_caisse_id || transferForm.amount <= 0) {
      toast.error(t('caisses.fillAllFields'));
      return;
    }
    setIsTransferring(true);
    try {
      await caissesApi.transfer(transferForm);
      toast.success(t('caisses.transferSuccess'));
      setShowTransferModal(false);
      setTransferForm({ from_caisse_id: 0, to_caisse_id: 0, amount: 0, notes: '' });
      await Promise.all([
        fetchSummary(),
        selectedCaisse ? openCaisseDetail(selectedCaisse) : Promise.resolve(),
      ]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('caisses.transferError'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaisse || expenseForm.amount <= 0) {
      toast.error(t('caisses.invalidAmount'));
      return;
    }
    setIsCreatingExpense(true);
    try {
      await dispensesApi.create({
        date: new Date().toISOString().split('T')[0],
        category: expenseForm.category,
        amount: expenseForm.amount,
        description: expenseForm.description,
        notes: expenseForm.notes,
        caisse_id: selectedCaisse.id,
      });
      toast.success(t('caisses.expenseSuccess'));
      setShowExpenseModal(false);
      setExpenseForm({ category: 'other', amount: 0, description: '', notes: '' });
      await Promise.all([fetchSummary(), openCaisseDetail(selectedCaisse)]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('caisses.expenseError'));
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const formatCurrency = (value: unknown) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 2 }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredCaisses = (summary?.caisses || []).filter((c) => {
    const matchesType = !listTypeFilter || c.type === listTypeFilter;
    const matchesSearch = !listSearch || (c.name || '').toLowerCase().includes(listSearch.toLowerCase()) || (c.user?.name || '').toLowerCase().includes(listSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const exportCaissesExcel = async () => {
    if (!summary) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(t('caisses.title'));
    ws.views = [{ rightToLeft: isRTL }];

    const headerRow = ws.addRow([
      t('caisses.caisseLabel'),
      t('caisses.selectUser'),
      t('caisses.txType'),
      t('caisses.balance'),
      t('caisses.active'),
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
    });

    filteredCaisses.forEach((c) => {
      const row = ws.addRow([
        c.name || c.user?.name || '-',
        c.user?.name || '-',
        typeLabels[c.type] || c.type,
        Number(c.balance),
        c.is_active ? t('caisses.active') : t('caisses.inactiveStatus'),
      ]);
      row.getCell(4).numFmt = '#,##0.00';
      const bal = Number(c.balance);
      if (bal > 0) row.getCell(4).font = { color: { argb: 'FF16A34A' } };
      else if (bal < 0) row.getCell(4).font = { color: { argb: 'FFDC2626' } };
    });

    const totalRow = ws.addRow(['', '', t('caisses.totalBalance'), filteredCaisses.reduce((s, c) => s + Number(c.balance), 0), '']);
    totalRow.eachCell((cell) => { cell.font = { bold: true, size: 12 }; });
    totalRow.getCell(4).numFmt = '#,##0.00';

    ws.columns.forEach((col) => { col.width = 20; });

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${t('caisses.title')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(t('caisses.exportSuccess'));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  // ──────────── Detail view ────────────
  if (selectedCaisse) {
    return (
      <>
      <div>
        <PageHeader
          title={selectedCaisse.name || `${t('caisses.caisseLabel')} ${selectedCaisse.user?.name || ''}`}
          subtitle={selectedCaisse.user?.name || undefined}
          pill={
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
              <span className={`metric-dot ${typeDot[selectedCaisse.type] || 'metric-dot-neutral'}`} aria-hidden />
              {typeLabels[selectedCaisse.type]}
            </span>
          }
        >
          <button
            onClick={() => setSelectedCaisse(null)}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <BackArrowIcon className="w-4 h-4" strokeWidth={1.8} />
            {t('caisses.back')}
          </button>
        </PageHeader>

        {/* Actions strip */}
        <div className="surface-pro p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] t-muted">{t('caisses.currentBalance')}</p>
            <p className="text-[20px] font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(selectedCaisse.balance)}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setSettleForm({ amount: 0, type: 'admin_collect', notes: '' }); setShowSettleModal(true); }}
              disabled={Number(selectedCaisse.balance) <= 0}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <CurrencyDollarIcon className="w-4 h-4" strokeWidth={1.8} />
              {t('caisses.collectPartial')}
            </button>
            <button
              onClick={() => setShowCollectAllConfirm(true)}
              disabled={Number(selectedCaisse.balance) <= 0}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" strokeWidth={1.8} />
              {t('caisses.collectAll')}
            </button>
            <button
              onClick={() => { setAddMoneyForm({ amount: 0, notes: '' }); setShowAddMoneyModal(true); }}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <PlusCircleIcon className="w-4 h-4" strokeWidth={1.8} />
              {t('caisses.addMoney')}
            </button>
            <button
              onClick={() => { setExpenseForm({ category: 'other', amount: 0, description: '', notes: '' }); setShowExpenseModal(true); }}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <MinusCircleIcon className="w-4 h-4" strokeWidth={1.8} />
              {t('caisses.expense')}
            </button>
            <button
              onClick={() => { setTransferForm({ from_caisse_id: selectedCaisse.id, to_caisse_id: 0, amount: 0, notes: '' }); setShowTransferModal(true); }}
              disabled={Number(selectedCaisse.balance) <= 0}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <ArrowsRightLeftIcon className="w-4 h-4" strokeWidth={1.8} />
              {t('caisses.transferToOther')}
            </button>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          trailing={hasActiveFilters ? (
            <button
              onClick={() => {
                setTransactionFilter('');
                setSourceFilter('');
                setDateFrom('');
                setDateTo('');
                reloadTransactions({ filter: '', source: '', from: '', to: '' });
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              {t('caisses.clearActiveFilters')}
            </button>
          ) : undefined}
        >
          <select
            value={transactionFilter}
            onChange={(e) => { setTransactionFilter(e.target.value); reloadTransactions({ filter: e.target.value }); }}
          >
            <option value="">{t('caisses.allTransactions')}</option>
            <option value="in">{t('caisses.incoming')}</option>
            <option value="out">{t('caisses.outgoing')}</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); reloadTransactions({ source: e.target.value }); }}
          >
            <option value="">{t('caisses.allSources')}</option>
            <option value="van_sale">{t('caisses.vanSale')}</option>
            <option value="delivery">{t('caisses.delivery')}</option>
            <option value="payment">{t('caisses.payment')}</option>
            <option value="dispense">{t('caisses.dispenseSource')}</option>
            <option value="settlement">{t('caisses.settlement')}</option>
            <option value="transfer">{t('caisses.transferSource')}</option>
            <option value="sale">{t('caisses.saleInvoice')}</option>
            <option value="purchase">{t('caisses.purchaseInvoice')}</option>
          </select>
          <DateInput
            value={dateFrom}
            onChange={(v) => { setDateFrom(v); reloadTransactions({ from: v }); }}
            placeholder={t('caisses.fromDate')}
          />
          <DateInput
            value={dateTo}
            onChange={(v) => { setDateTo(v); reloadTransactions({ to: v }); }}
            placeholder={t('caisses.toDate')}
          />
        </FilterBar>

        {/* Quick date chips */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto">
          <span className="text-[12px] t-muted">{t('caisses.quickPeriod')}:</span>
          <button onClick={() => setQuickDate('today')} className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t('caisses.today')}
          </button>
          <button onClick={() => setQuickDate('week')} className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t('caisses.thisWeek')}
          </button>
          <button onClick={() => setQuickDate('month')} className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t('caisses.thisMonth')}
          </button>
        </div>

        {/* Metric tiles */}
        {filteredTotals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
            <div className="metric-tile">
              <div className="flex items-center gap-1.5">
                <span className="metric-dot metric-dot-green" aria-hidden />
                <p className="metric-label truncate">{t('caisses.totalIn')}</p>
              </div>
              <p className="metric-value-currency">{formatCurrency(filteredTotals.total_in)}</p>
            </div>
            <div className="metric-tile">
              <div className="flex items-center gap-1.5">
                <span className="metric-dot metric-dot-red" aria-hidden />
                <p className="metric-label truncate">{t('caisses.totalOut')}</p>
              </div>
              <p className="metric-value-currency">{formatCurrency(filteredTotals.total_out)}</p>
            </div>
            <div className="metric-tile">
              <div className="flex items-center gap-1.5">
                <span className="metric-dot metric-dot-neutral" aria-hidden />
                <p className="metric-label truncate">{hasActiveFilters ? t('caisses.netFiltered') : t('caisses.net')}</p>
              </div>
              <p className="metric-value-currency">{formatCurrency(filteredTotals.net)}</p>
            </div>
            <div className="metric-tile">
              <div className="flex items-center gap-1.5">
                <span className="metric-dot metric-dot-blue" aria-hidden />
                <p className="metric-label truncate">{t('caisses.currentBalanceForCollection')}</p>
              </div>
              <p className="metric-value-currency">{formatCurrency(selectedCaisse.balance)}</p>
            </div>
          </div>
        )}

        {isLoadingDetail ? (
          <div className="flex items-center justify-center h-32"><div className="spinner"></div></div>
        ) : (
          <>
            {/* Transactions Table */}
            <div className="table-pro-wrap mb-4">
              <table className="table-pro">
                <thead>
                  <tr>
                    <th>{t('caisses.txDate')}</th>
                    <th>{t('caisses.txType')}</th>
                    <th>{t('caisses.txSource')}</th>
                    <th>{t('caisses.txDescription')}</th>
                    <th>{t('caisses.txBy')}</th>
                    <th className="text-end">{t('caisses.txAmount')}</th>
                    <th className="text-end">{t('caisses.txBalanceAfter')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 t-muted">{t('caisses.noTransactions')}</td></tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="tnum t-muted">{formatDate(tx.created_at)}</td>
                        <td>
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                            <span className={`metric-dot ${tx.type === 'in' ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                            {tx.type === 'in' ? t('caisses.incoming') : t('caisses.outgoing')}
                          </span>
                        </td>
                        <td className="t-muted">{sourceTypeLabels[tx.source_type || ''] || tx.source_type || '-'}</td>
                        <td>{translateDescription(tx.description)}</td>
                        <td className="t-muted">{tx.creator?.name || '-'}</td>
                        <td className="tnum t-strong">
                          {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="tnum">{formatCurrency(tx.balance_after)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {transactionTotal > 1 && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={() => reloadTransactions({ page: transactionPage - 1 })}
                  disabled={transactionPage <= 1}
                  className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
                >
                  {t('caisses.previous')}
                </button>
                <span className="text-[12px] text-gray-500 dark:text-gray-400">
                  {t('caisses.page')} {transactionPage} {t('caisses.of')} {transactionTotal}
                </span>
                <button
                  onClick={() => reloadTransactions({ page: transactionPage + 1 })}
                  disabled={transactionPage >= transactionTotal}
                  className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
                >
                  {t('caisses.next')}
                </button>
              </div>
            )}

            {/* Settlement History */}
            {settlements.length > 0 && (
              <div>
                <h2 className="surface-heading text-[14px] font-semibold mb-2">{t('caisses.settlementHistory')}</h2>
                <div className="table-pro-wrap">
                  <table className="table-pro compact">
                    <thead>
                      <tr>
                        <th>{t('caisses.stlDate')}</th>
                        <th>{t('caisses.stlType')}</th>
                        <th className="text-end">{t('caisses.stlAmount')}</th>
                        <th className="text-end">{t('caisses.stlBalanceBefore')}</th>
                        <th className="text-end">{t('caisses.stlBalanceAfter')}</th>
                        <th>{t('caisses.stlBy')}</th>
                        <th>{t('caisses.stlNotes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((s) => (
                        <tr key={s.id}>
                          <td className="tnum t-muted">{formatDate(s.created_at)}</td>
                          <td>
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                              <span className="metric-dot metric-dot-blue" aria-hidden />
                              {s.type === 'admin_collect' ? t('caisses.adminCollect') : t('caisses.sellerDeposit')}
                            </span>
                          </td>
                          <td className="tnum t-strong">{formatCurrency(s.amount)}</td>
                          <td className="tnum">{formatCurrency(s.balance_before)}</td>
                          <td className="tnum">{formatCurrency(s.balance_after)}</td>
                          <td className="t-muted">{s.settler?.name || '-'}</td>
                          <td className="t-muted">{translateDescription(s.notes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Expense Modal */}
        {showExpenseModal && selectedCaisse && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowExpenseModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
                <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                    {t('caisses.expenseFromCaisse')} {selectedCaisse.user?.name}
                  </h2>
                  <button onClick={() => setShowExpenseModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </header>
                <form onSubmit={handleCreateExpense} className="flex flex-col flex-1 overflow-hidden">
                  <main className="flex-1 overflow-y-auto p-5 space-y-4">
                    <p className="text-[13px] text-gray-600 dark:text-gray-400">
                      {t('caisses.currentBalanceLabel')} <span className="font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(selectedCaisse.balance)}</span>
                    </p>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.expenseCategory')} *</label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                        className="select w-full text-[14px] py-2"
                        required
                      >
                        <option value="salary">{t('caisses.categorySalary')}</option>
                        <option value="transport">{t('caisses.categoryTransport')}</option>
                        <option value="maintenance">{t('caisses.categoryMaintenance')}</option>
                        <option value="supplies">{t('caisses.categorySupplies')}</option>
                        <option value="other">{t('caisses.categoryOther')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.expenseAmount')} *</label>
                      <input
                        type="number"
                        value={expenseForm.amount || ''}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                        className="input w-full text-[14px] py-2 tnum"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.expenseDescriptionRequired')} *</label>
                      <input
                        type="text"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        className="input w-full text-[14px] py-2"
                        placeholder={t('caisses.expenseDescPlaceholder')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.expenseNotes')}</label>
                      <textarea
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                        className="input w-full text-[14px] py-2 resize-none"
                        rows={2}
                        placeholder={t('caisses.notesPlaceholder')}
                      />
                    </div>
                  </main>
                  <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                    <button type="button" onClick={() => setShowExpenseModal(false)} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {t('caisses.cancel')}
                    </button>
                    <button type="submit" disabled={isCreatingExpense} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
                      {isCreatingExpense ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.confirmExpense')}
                    </button>
                  </footer>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Settlement Modal */}
        {showSettleModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowSettleModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
                <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                    {t('caisses.collectFromCaisse')} {selectedCaisse.user?.name}
                  </h2>
                  <button onClick={() => setShowSettleModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </header>
                <form onSubmit={handleSettle} className="flex flex-col flex-1 overflow-hidden">
                  <main className="flex-1 overflow-y-auto p-5 space-y-4">
                    <p className="text-[13px] text-gray-600 dark:text-gray-400">
                      {t('caisses.currentBalanceLabel')} <span className="font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(selectedCaisse.balance)}</span>
                    </p>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.amountLabel')} *</label>
                      <input
                        type="number"
                        value={settleForm.amount}
                        onChange={(e) => setSettleForm({ ...settleForm, amount: parseFloat(e.target.value) || 0 })}
                        className="input w-full text-[14px] py-2 tnum"
                        min="0.01"
                        max={selectedCaisse.balance}
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.operationType')} *</label>
                      <select
                        value={settleForm.type}
                        onChange={(e) => setSettleForm({ ...settleForm, type: e.target.value })}
                        className="select w-full text-[14px] py-2"
                        required
                      >
                        <option value="admin_collect">{t('caisses.adminCollect')}</option>
                        <option value="seller_deposit">{t('caisses.sellerDeposit')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.notesLabel')}</label>
                      <textarea
                        value={settleForm.notes}
                        onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
                        className="input w-full text-[14px] py-2 resize-none"
                        rows={2}
                        placeholder={t('caisses.notesPlaceholder')}
                      />
                    </div>
                  </main>
                  <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                    <button type="button" onClick={() => setShowSettleModal(false)} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {t('caisses.cancel')}
                    </button>
                    <button type="submit" disabled={isSettling} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50">
                      {isSettling ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.confirmCollect')}
                    </button>
                  </footer>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Collect All Confirmation */}
        {showCollectAllConfirm && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCollectAllConfirm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
                <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('caisses.collectAllTitle')}</h2>
                  <button onClick={() => setShowCollectAllConfirm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </header>
                <main className="p-5 space-y-4">
                  <div className="surface-pro p-3 space-y-1.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="t-muted">{t('caisses.caisseLabel')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{selectedCaisse.name || selectedCaisse.user?.name}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="t-muted">{t('caisses.amountToCollect')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(selectedCaisse.balance)}</span>
                    </div>
                  </div>
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 text-center">{t('caisses.collectAllConfirm')}</p>
                </main>
                <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                  <button onClick={() => setShowCollectAllConfirm(false)} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {t('caisses.cancel')}
                  </button>
                  <button onClick={handleCollectAll} disabled={isCollectingAll} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">
                    {isCollectingAll ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.confirmCollect')}
                  </button>
                </footer>
              </div>
            </div>
          </>
        )}

        {/* Add Money Modal */}
        {showAddMoneyModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowAddMoneyModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
                <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                    {t('caisses.addMoneyTitle')} {selectedCaisse.user?.name}
                  </h2>
                  <button onClick={() => setShowAddMoneyModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </header>
                <form onSubmit={handleAddMoney} className="flex flex-col flex-1 overflow-hidden">
                  <main className="flex-1 overflow-y-auto p-5 space-y-4">
                    <p className="text-[13px] text-gray-600 dark:text-gray-400">{t('caisses.addMoneyHint')}</p>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.amountLabel')} *</label>
                      <input
                        type="number"
                        value={addMoneyForm.amount || ''}
                        onChange={(e) => setAddMoneyForm({ ...addMoneyForm, amount: parseFloat(e.target.value) || 0 })}
                        className="input w-full text-[14px] py-2 tnum"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.notesLabel')}</label>
                      <textarea
                        value={addMoneyForm.notes}
                        onChange={(e) => setAddMoneyForm({ ...addMoneyForm, notes: e.target.value })}
                        className="input w-full text-[14px] py-2 resize-none"
                        rows={2}
                        placeholder={t('caisses.addMoneyPlaceholder')}
                      />
                    </div>
                  </main>
                  <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                    <button type="button" onClick={() => setShowAddMoneyModal(false)} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {t('caisses.cancel')}
                    </button>
                    <button type="submit" disabled={isAddingMoney} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">
                      {isAddingMoney ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.confirmAdd')}
                    </button>
                  </footer>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && summary && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowTransferModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[560px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
              <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('caisses.transferTitle')}</h2>
                <button onClick={() => setShowTransferModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </header>
              <form onSubmit={handleTransfer} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.fromCaisse')} *</label>
                    <select
                      value={transferForm.from_caisse_id}
                      onChange={(e) => setTransferForm({ ...transferForm, from_caisse_id: parseInt(e.target.value) || 0, to_caisse_id: transferForm.to_caisse_id === parseInt(e.target.value) ? 0 : transferForm.to_caisse_id })}
                      className="select w-full text-[14px] py-2"
                      required
                    >
                      <option value={0}>{t('caisses.selectSource')}</option>
                      {summary.caisses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.user?.name} ({typeLabels[c.type]}) — {formatCurrency(c.balance)}
                        </option>
                      ))}
                    </select>
                    {transferForm.from_caisse_id > 0 && (
                      <p className="mt-1 text-[12px] t-muted">
                        {t('caisses.availableBalance')}{' '}
                        <span className="font-semibold text-gray-900 dark:text-white tnum">
                          {formatCurrency(summary.caisses.find((c) => c.id === transferForm.from_caisse_id)?.balance || 0)}
                        </span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.toCaisse')} *</label>
                    <select
                      value={transferForm.to_caisse_id}
                      onChange={(e) => setTransferForm({ ...transferForm, to_caisse_id: parseInt(e.target.value) || 0 })}
                      className="select w-full text-[14px] py-2"
                      required
                    >
                      <option value={0}>{t('caisses.selectDestination')}</option>
                      {summary.caisses
                        .filter((c) => c.id !== transferForm.from_caisse_id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.user?.name} ({typeLabels[c.type]}) — {formatCurrency(c.balance)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.transferAmount')} *</label>
                    <input
                      type="number"
                      value={transferForm.amount || ''}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })}
                      className="input w-full text-[14px] py-2 tnum"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.notesLabel')}</label>
                    <textarea
                      value={transferForm.notes}
                      onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                      className="input w-full text-[14px] py-2 resize-none"
                      rows={2}
                      placeholder={t('caisses.notesPlaceholder')}
                    />
                  </div>
                </main>
                <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                  <button type="button" onClick={() => setShowTransferModal(false)} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {t('caisses.cancel')}
                  </button>
                  <button type="submit" disabled={isTransferring} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50">
                    {isTransferring ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (<><ArrowsRightLeftIcon className="w-3.5 h-3.5" strokeWidth={1.8} />{t('caisses.confirmTransfer')}</>)}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </>
      )}
      </>
    );
  }

  // ──────────── List view ────────────
  return (
    <div>
      <div data-tour="caisses-header">
        <PageHeader title={t('caisses.title')} subtitle={t('caisses.subtitle')}>
          <button onClick={() => setShowTour(true)} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t('caisses.tourTitle')}
          </button>
          <button onClick={exportCaissesExcel} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" strokeWidth={1.8} />
            {t('caisses.exportExcel')}
          </button>
          <button
            onClick={() => { setTransferForm({ from_caisse_id: 0, to_caisse_id: 0, amount: 0, notes: '' }); setShowTransferModal(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" strokeWidth={1.8} />
            {t('caisses.transfer')}
          </button>
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors">
            <PlusIcon className="w-4 h-4" strokeWidth={2} />
            {t('caisses.addCaisse')}
          </button>
        </PageHeader>
      </div>

      {/* Metric tiles */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4" data-tour="caisses-summary">
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-blue" aria-hidden />
              <p className="metric-label truncate">{t('caisses.totalBalance')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(summary.total_balance)}</p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-green" aria-hidden />
              <p className="metric-label truncate">{t('caisses.todayIn')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(summary.today.total_in)}</p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-red" aria-hidden />
              <p className="metric-label truncate">{t('caisses.todayOut')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(summary.today.total_out)}</p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-violet" aria-hidden />
              <p className="metric-label truncate">{t('caisses.todaySettled')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(summary.today.total_settled)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        search={listSearch}
        onSearchChange={setListSearch}
        searchPlaceholder={t('caisses.searchByName')}
        trailing={
          <span className="text-[12px] t-muted whitespace-nowrap">
            {filteredCaisses.length} {t('caisses.caisseCount')}
          </span>
        }
      >
        <select value={listTypeFilter} onChange={(e) => setListTypeFilter(e.target.value)}>
          <option value="">{t('caisses.allTypes')}</option>
          <option value="principale">{t('caisses.principale')}</option>
          <option value="vendeur">{t('caisses.vendeur')}</option>
          <option value="livreur">{t('caisses.livreur')}</option>
          <option value="cashvan">{t('caisses.cashvan')}</option>
        </select>
        {(listSearch || listTypeFilter) && (
          <button onClick={() => { setListSearch(''); setListTypeFilter(''); }} className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <XMarkIcon className="w-3.5 h-3.5" />
            {t('caisses.clearFilters')}
          </button>
        )}
      </FilterBar>

      {/* Caisses grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5" data-tour="caisses-grid">
        {filteredCaisses.map((caisse) => (
          <div
            key={caisse.id}
            onClick={() => openCaisseDetail(caisse)}
            className="surface-pro p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-200">
                    {caisse.user?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">{caisse.name || caisse.user?.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      <span className={`metric-dot ${typeDot[caisse.type] || 'metric-dot-neutral'}`} aria-hidden />
                      {typeLabels[caisse.type]}
                    </span>
                    {caisse.name && (
                      <span className="text-[11px] t-muted">{caisse.user?.name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setRenameCaisse(caisse); setRenameValue(caisse.name || ''); setShowRenameModal(true); }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title={t('caisses.rename')}
                >
                  <PencilSquareIcon className="w-4 h-4" strokeWidth={1.8} />
                </button>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  <span className={`metric-dot ${caisse.is_active ? 'metric-dot-green' : 'metric-dot-neutral'}`} aria-hidden />
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200/80 dark:border-gray-700 pt-2">
              <p className="text-[11px] t-muted">{t('caisses.balance')}</p>
              <p className="text-[18px] font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(caisse.balance)}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredCaisses.length === 0 && (
        <div className="surface-pro text-center py-12 text-gray-500 dark:text-gray-400">
          <BanknotesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
          <p className="text-[14px] font-medium">
            {(listSearch || listTypeFilter) ? t('caisses.noResults') : t('caisses.noCaisses')}
          </p>
        </div>
      )}

      {/* Create Caisse Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCreateModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
              <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('caisses.createCaisseTitle')}</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </header>
              {isLoadingUsers ? (
                <main className="flex items-center justify-center py-8"><div className="spinner"></div></main>
              ) : (
                <form onSubmit={handleCreateCaisse} className="flex flex-col flex-1 overflow-hidden">
                  <main className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.selectUser')} *</label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(parseInt(e.target.value) || 0)}
                        className="select w-full text-[14px] py-2"
                        required
                      >
                        <option value={0}>{t('caisses.selectUserPlaceholder')}</option>
                        {usersWithoutCaisse.filter(u => !u.hasCaisse).length > 0 && (
                          <optgroup label={t('caisses.withoutCaisse')}>
                            {usersWithoutCaisse.filter(u => !u.hasCaisse).map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({roleLabels[u.role] || u.role})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {usersWithoutCaisse.filter(u => u.hasCaisse).length > 0 && (
                          <optgroup label={t('caisses.hasCaisse')}>
                            {usersWithoutCaisse.filter(u => u.hasCaisse).map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({roleLabels[u.role] || u.role})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <p className="text-[12px] t-muted mt-1">{t('caisses.caisseTypeHint')}</p>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.caisseName')}</label>
                      <input
                        type="text"
                        value={newCaisseName}
                        onChange={(e) => setNewCaisseName(e.target.value)}
                        className="input w-full text-[14px] py-2"
                        placeholder={t('caisses.caisseNamePlaceholder')}
                      />
                    </div>
                  </main>
                  <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {t('caisses.cancel')}
                    </button>
                    <button type="submit" disabled={isCreating || !selectedUserId} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50">
                      {isCreating ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.createCaisse')}
                    </button>
                  </footer>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      {/* Transfer Modal (list view) */}
      {showTransferModal && summary && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowTransferModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[560px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
              <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('caisses.transferTitle')}</h2>
                <button onClick={() => setShowTransferModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </header>
              <form onSubmit={handleTransfer} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.fromCaisse')} *</label>
                    <select
                      value={transferForm.from_caisse_id}
                      onChange={(e) => setTransferForm({ ...transferForm, from_caisse_id: parseInt(e.target.value) || 0, to_caisse_id: transferForm.to_caisse_id === parseInt(e.target.value) ? 0 : transferForm.to_caisse_id })}
                      className="select w-full text-[14px] py-2"
                      required
                    >
                      <option value={0}>{t('caisses.selectSource')}</option>
                      {summary.caisses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.user?.name} ({typeLabels[c.type]}) — {formatCurrency(c.balance)}
                        </option>
                      ))}
                    </select>
                    {transferForm.from_caisse_id > 0 && (
                      <p className="mt-1 text-[12px] t-muted">
                        {t('caisses.availableBalance')}{' '}
                        <span className="font-semibold text-gray-900 dark:text-white tnum">
                          {formatCurrency(summary.caisses.find((c) => c.id === transferForm.from_caisse_id)?.balance || 0)}
                        </span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.toCaisse')} *</label>
                    <select
                      value={transferForm.to_caisse_id}
                      onChange={(e) => setTransferForm({ ...transferForm, to_caisse_id: parseInt(e.target.value) || 0 })}
                      className="select w-full text-[14px] py-2"
                      required
                    >
                      <option value={0}>{t('caisses.selectDestination')}</option>
                      {summary.caisses
                        .filter((c) => c.id !== transferForm.from_caisse_id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.user?.name} ({typeLabels[c.type]}) — {formatCurrency(c.balance)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.transferAmount')} *</label>
                    <input
                      type="number"
                      value={transferForm.amount || ''}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })}
                      className="input w-full text-[14px] py-2 tnum"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.notesLabel')}</label>
                    <textarea
                      value={transferForm.notes}
                      onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                      className="input w-full text-[14px] py-2 resize-none"
                      rows={2}
                      placeholder={t('caisses.notesPlaceholder')}
                    />
                  </div>
                </main>
                <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                  <button type="button" onClick={() => setShowTransferModal(false)} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {t('caisses.cancel')}
                  </button>
                  <button type="submit" disabled={isTransferring} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50">
                    {isTransferring ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (<><ArrowsRightLeftIcon className="w-3.5 h-3.5" strokeWidth={1.8} />{t('caisses.confirmTransfer')}</>)}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Rename Caisse Modal */}
      {showRenameModal && renameCaisse && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowRenameModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
              <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('caisses.renameTitle')}</h2>
                <button onClick={() => setShowRenameModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </header>
              <main className="p-5 space-y-4">
                <p className="text-[13px] t-muted">{renameCaisse.user?.name} - {typeLabels[renameCaisse.type]}</p>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caisses.caisseName')}</label>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="input w-full text-[14px] py-2"
                    placeholder={t('caisses.newNamePlaceholder')}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRename(); } }}
                  />
                </div>
              </main>
              <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                <button onClick={() => setShowRenameModal(false)} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {t('caisses.cancel')}
                </button>
                <button onClick={handleRename} disabled={isRenaming} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50">
                  {isRenaming ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.saveRename')}
                </button>
              </footer>
            </div>
          </div>
        </>
      )}

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={tourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="caisses_tour_step"
        />
      )}
    </div>
  );
}
