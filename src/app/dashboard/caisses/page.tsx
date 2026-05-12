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
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  ArrowsRightLeftIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  MinusCircleIcon,
  ArrowUpCircleIcon,
  PlusCircleIcon,
  FunnelIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const typeBadgeColors: Record<string, string> = {
  principale: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  vendeur: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  livreur: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cashvan: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function CaissesPage() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const BackArrowIcon = isRTL ? ArrowRightIcon : ArrowLeftIcon;

  // Translate backend Arabic descriptions to current locale
  const translateDescription = useCallback((desc: string | undefined | null): string => {
    if (!desc) return '-';
    if (locale === 'ar') return desc;
    // Replace Arabic patterns with translated equivalents (order matters - longest first)
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

  // Expense modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'other',
    amount: 0,
    description: '',
    notes: '',
  });
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);

  // Create caisse modal
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

  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // Source type filter
  const [sourceFilter, setSourceFilter] = useState('');
  // Add money modal
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyForm, setAddMoneyForm] = useState({ amount: 0, notes: '' });
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  // Confirm collect all
  const [showCollectAllConfirm, setShowCollectAllConfirm] = useState(false);
  const [isCollectingAll, setIsCollectingAll] = useState(false);

  // Totals from API
  const [filteredTotals, setFilteredTotals] = useState<{ total_in: number; total_out: number; net: number } | null>(null);

  // List view filters
  const [listSearch, setListSearch] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState('');

  // Guided tour
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
      // Show all users, mark those who already have a caisse
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

  // Helper to reload with all current filters
  const reloadTransactions = (overrides: { page?: number; filter?: string; source?: string; from?: string; to?: string } = {}) => {
    loadTransactions(
      overrides.page ?? 1,
      overrides.filter ?? transactionFilter,
      overrides.source ?? sourceFilter,
      overrides.from ?? dateFrom,
      overrides.to ?? dateTo,
    );
  };

  // Quick date helpers
  const setQuickDate = (range: 'today' | 'week' | 'month') => {
    const today = new Date();
    const toStr = today.toISOString().split('T')[0];
    let fromStr = toStr;
    if (range === 'week') {
      const d = new Date(today);
      d.setDate(d.getDate() - d.getDay()); // start of week (Sunday)
      fromStr = d.toISOString().split('T')[0];
    } else if (range === 'month') {
      fromStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    }
    setDateFrom(fromStr);
    setDateTo(toStr);
    reloadTransactions({ from: fromStr, to: toStr });
  };

  // Collect all balance
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

  // Add money to caisse (admin adjust)
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
      // Refresh data
      await Promise.all([
        fetchSummary(),
        openCaisseDetail(selectedCaisse),
      ]);
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
      await Promise.all([
        fetchSummary(),
        openCaisseDetail(selectedCaisse),
      ]);
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

  // Filtered caisses for list view
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

    // Header
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

    // Summary row
    const totalRow = ws.addRow(['', '', t('caisses.totalBalance'), filteredCaisses.reduce((s, c) => s + Number(c.balance), 0), '']);
    totalRow.eachCell((cell) => { cell.font = { bold: true, size: 12 }; });
    totalRow.getCell(4).numFmt = '#,##0.00';

    // Auto widths
    ws.columns.forEach((col) => { col.width = 20; });

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${t('caisses.title')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(t('caisses.exportSuccess'));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  // Detail view
  if (selectedCaisse) {
    return (
      <>
      <div className="space-y-5">
        {/* Detail Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setSelectedCaisse(null)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
              >
                <BackArrowIcon className="w-4 h-4" />
                {t('caisses.back')}
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
                  {selectedCaisse.name || `${t('caisses.caisseLabel')} ${selectedCaisse.user?.name}`}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${typeBadgeColors[selectedCaisse.type]}`}>
                    {typeLabels[selectedCaisse.type]}
                  </span>
                  {selectedCaisse.user?.name && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">{selectedCaisse.user.name}</span>
                  )}
                </div>
              </div>
            </div>
            <div className={`${isRTL ? 'text-left sm:text-left' : 'text-right sm:text-right'} flex-shrink-0`}>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('caisses.currentBalance')}</p>
              <p className={`text-2xl sm:text-3xl font-bold ${Number(selectedCaisse.balance) > 0 ? 'text-green-600 dark:text-green-400' : Number(selectedCaisse.balance) < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                {formatCurrency(selectedCaisse.balance)}
              </p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200/80 dark:border-gray-700">
            {/* Collect partial */}
            <button
              onClick={() => {
                setSettleForm({ amount: 0, type: 'admin_collect', notes: '' });
                setShowSettleModal(true);
              }}
              disabled={Number(selectedCaisse.balance) <= 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              {t('caisses.collectPartial')}
            </button>
            {/* Collect all */}
            <button
              onClick={() => setShowCollectAllConfirm(true)}
              disabled={Number(selectedCaisse.balance) <= 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              {t('caisses.collectAll')}
            </button>
            {/* Add money */}
            <button
              onClick={() => { setAddMoneyForm({ amount: 0, notes: '' }); setShowAddMoneyModal(true); }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 transition-all active:scale-[0.98]"
            >
              <PlusCircleIcon className="w-4 h-4" />
              {t('caisses.addMoney')}
            </button>
            {/* Expense */}
            <button
              onClick={() => { setExpenseForm({ category: 'other', amount: 0, description: '', notes: '' }); setShowExpenseModal(true); }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-all active:scale-[0.98]"
            >
              <MinusCircleIcon className="w-4 h-4" />
              {t('caisses.expense')}
            </button>
            {/* Transfer to another caisse */}
            <button
              onClick={() => {
                setTransferForm({ from_caisse_id: selectedCaisse.id, to_caisse_id: 0, amount: 0, notes: '' });
                setShowTransferModal(true);
              }}
              disabled={Number(selectedCaisse.balance) <= 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
              {t('caisses.transferToOther')}
            </button>
          </div>
        </div>

        {/* Filters + Quick dates */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <FunnelIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('caisses.quickPeriod')}</span>
            <button onClick={() => setQuickDate('today')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${dateFrom === new Date().toISOString().split('T')[0] && dateTo === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700'}`}>
              {t('caisses.today')}
            </button>
            <button onClick={() => setQuickDate('week')} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 transition-colors">
              {t('caisses.thisWeek')}
            </button>
            <button onClick={() => setQuickDate('month')} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 transition-colors">
              {t('caisses.thisMonth')}
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setTransactionFilter('');
                  setSourceFilter('');
                  setDateFrom('');
                  setDateTo('');
                  reloadTransactions({ filter: '', source: '', from: '', to: '' });
                }}
                className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 transition-colors"
              >
                {t('caisses.clearActiveFilters')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={transactionFilter}
              onChange={(e) => {
                setTransactionFilter(e.target.value);
                reloadTransactions({ filter: e.target.value });
              }}
              className="select text-sm"
            >
              <option value="">{t('caisses.allTransactions')}</option>
              <option value="in">{t('caisses.incoming')}</option>
              <option value="out">{t('caisses.outgoing')}</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                reloadTransactions({ source: e.target.value });
              }}
              className="select text-sm"
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
              onChange={(v) => {
                setDateFrom(v);
                reloadTransactions({ from: v });
              }}
              placeholder={t('caisses.fromDate')}
              className="text-sm"
            />
            <DateInput
              value={dateTo}
              onChange={(v) => {
                setDateTo(v);
                reloadTransactions({ to: v });
              }}
              placeholder={t('caisses.toDate')}
              className="text-sm"
            />
          </div>
        </div>

        {/* Summary Cards - always visible */}
        {filteredTotals && (
          <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className={`grid grid-cols-2 md:grid-cols-4 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
              <div className="group relative p-5 hover:bg-green-50/40 dark:hover:bg-green-900/10 transition-colors duration-200">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                <div className="text-center">
                  <div className="text-lg font-black text-green-600 dark:text-green-400 tabular-nums leading-none">{formatCurrency(filteredTotals.total_in)}</div>
                  <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('caisses.totalIn')}</div>
                </div>
              </div>
              <div className="group relative p-5 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors duration-200">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                <div className="text-center">
                  <div className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums leading-none">{formatCurrency(filteredTotals.total_out)}</div>
                  <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('caisses.totalOut')}</div>
                </div>
              </div>
              <div className="group relative p-5 hover:bg-gray-50/40 dark:hover:bg-gray-700/20 transition-colors duration-200">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gray-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                <div className="text-center">
                  <div className={`text-lg font-black tabular-nums leading-none ${Number(filteredTotals.net) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(filteredTotals.net)}</div>
                  <div className="text-[11px] font-semibold text-gray-400 mt-2">{hasActiveFilters ? t('caisses.netFiltered') : t('caisses.net')}</div>
                </div>
              </div>
              <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-200">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                <div className="text-center">
                  <div className={`text-lg font-black tabular-nums leading-none ${Number(selectedCaisse.balance) > 0 ? 'text-blue-600 dark:text-blue-400' : Number(selectedCaisse.balance) < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{formatCurrency(selectedCaisse.balance)}</div>
                  <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('caisses.currentBalanceForCollection')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoadingDetail ? (
          <div className="flex items-center justify-center h-32"><div className="spinner"></div></div>
        ) : (
          <>
            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-800/60">
                      <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.txDate')}</th>
                      <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.txType')}</th>
                      <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.txSource')}</th>
                      <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.txDescription')}</th>
                      <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.txBy')}</th>
                      <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.txAmount')}</th>
                      <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.txBalanceAfter')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">{t('caisses.noTransactions')}</td></tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(tx.created_at)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${tx.type === 'in' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {tx.type === 'in' ? t('caisses.incoming') : t('caisses.outgoing')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              {sourceTypeLabels[tx.source_type || ''] || tx.source_type || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{translateDescription(tx.description)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{tx.creator?.name || '-'}</td>
                          <td className={`px-4 py-3 font-medium ${tx.type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{formatCurrency(tx.balance_after)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {transactionTotal > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => reloadTransactions({ page: transactionPage - 1 })}
                    disabled={transactionPage <= 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {t('caisses.previous')}
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('caisses.page')} {transactionPage} {t('caisses.of')} {transactionTotal}
                  </span>
                  <button
                    onClick={() => reloadTransactions({ page: transactionPage + 1 })}
                    disabled={transactionPage >= transactionTotal}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {t('caisses.next')}
                  </button>
                </div>
              )}
            </div>

            {/* Settlement History */}
            {settlements.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('caisses.settlementHistory')}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-gray-800/60">
                        <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.stlDate')}</th>
                        <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.stlType')}</th>
                        <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.stlAmount')}</th>
                        <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.stlBalanceBefore')}</th>
                        <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.stlBalanceAfter')}</th>
                        <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.stlBy')}</th>
                        <th className="px-4 py-3 text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('caisses.stlNotes')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {settlements.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(s.created_at)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {s.type === 'admin_collect' ? t('caisses.adminCollect') : t('caisses.sellerDeposit')}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400">{formatCurrency(s.amount)}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatCurrency(s.balance_before)}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatCurrency(s.balance_after)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{s.settler?.name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{translateDescription(s.notes)}</td>
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
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowExpenseModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-l from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <MinusCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {t('caisses.expenseFromCaisse')} {selectedCaisse.user?.name}
                  </h2>
                </div>
                <button onClick={() => setShowExpenseModal(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('caisses.currentBalanceLabel')} <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedCaisse.balance)}</span>
                </p>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.expenseCategory')} *</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="select"
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
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.expenseAmount')} *</label>
                    <input
                      type="number"
                      value={expenseForm.amount || ''}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                      className="input"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.expenseDescriptionRequired')} *</label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="input"
                      placeholder={t('caisses.expenseDescPlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.expenseNotes')}</label>
                    <textarea
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                      className="input"
                      rows={2}
                      placeholder={t('caisses.notesPlaceholder')}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={isCreatingExpense} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50">
                      {isCreatingExpense ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.confirmExpense')}
                    </button>
                    <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {t('caisses.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Settlement Modal */}
        {showSettleModal && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSettleModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-l from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {t('caisses.collectFromCaisse')} {selectedCaisse.user?.name}
                  </h2>
                </div>
                <button onClick={() => setShowSettleModal(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('caisses.currentBalanceLabel')} <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedCaisse.balance)}</span>
                </p>
                <form onSubmit={handleSettle} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.amountLabel')} *</label>
                    <input
                      type="number"
                      value={settleForm.amount}
                      onChange={(e) => setSettleForm({ ...settleForm, amount: parseFloat(e.target.value) || 0 })}
                      className="input"
                      min="0.01"
                      max={selectedCaisse.balance}
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.operationType')} *</label>
                    <select
                      value={settleForm.type}
                      onChange={(e) => setSettleForm({ ...settleForm, type: e.target.value })}
                      className="select"
                      required
                    >
                      <option value="admin_collect">{t('caisses.adminCollect')}</option>
                      <option value="seller_deposit">{t('caisses.sellerDeposit')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.notesLabel')}</label>
                    <textarea
                      value={settleForm.notes}
                      onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
                      className="input"
                      rows={2}
                      placeholder={t('caisses.notesPlaceholder')}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={isSettling} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
                      {isSettling ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.confirmCollect')}
                    </button>
                    <button type="button" onClick={() => setShowSettleModal(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {t('caisses.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Collect All Confirmation */}
        {showCollectAllConfirm && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCollectAllConfirm(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-l from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{t('caisses.collectAllTitle')}</h2>
                </div>
                <button onClick={() => setShowCollectAllConfirm(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{t('caisses.caisseLabel')}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">{selectedCaisse.name || selectedCaisse.user?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{t('caisses.amountToCollect')}</span>
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">{formatCurrency(selectedCaisse.balance)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                  {t('caisses.collectAllConfirm')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCollectAll}
                    disabled={isCollectingAll}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isCollectingAll ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.confirmCollect')}
                  </button>
                  <button onClick={() => setShowCollectAllConfirm(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t('caisses.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Money Modal */}
        {showAddMoneyModal && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddMoneyModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-l from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <PlusCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {t('caisses.addMoneyTitle')} {selectedCaisse.user?.name}
                  </h2>
                </div>
                <button onClick={() => setShowAddMoneyModal(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('caisses.addMoneyHint')}
                </p>
                <form onSubmit={handleAddMoney} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.amountLabel')} *</label>
                    <input
                      type="number"
                      value={addMoneyForm.amount || ''}
                      onChange={(e) => setAddMoneyForm({ ...addMoneyForm, amount: parseFloat(e.target.value) || 0 })}
                      className="input"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.notesLabel')}</label>
                    <textarea
                      value={addMoneyForm.notes}
                      onChange={(e) => setAddMoneyForm({ ...addMoneyForm, notes: e.target.value })}
                      className="input"
                      rows={2}
                      placeholder={t('caisses.addMoneyPlaceholder')}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={isAddingMoney} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50">
                      {isAddingMoney ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.confirmAdd')}
                    </button>
                    <button type="button" onClick={() => setShowAddMoneyModal(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {t('caisses.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Modal (must be outside detail div for z-index) */}
      {showTransferModal && summary && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowTransferModal(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-indigo-500/10 dark:shadow-black/40 overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header with gradient ── */}
            <div className="relative bg-gradient-to-l from-violet-600 via-indigo-600 to-blue-600 px-6 py-5 overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 0L40 20L20 40L0 20z\' fill=\'%23fff\' fill-opacity=\'0.15\'/%3E%3C/svg%3E")', backgroundSize: '20px 20px' }} />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                    <ArrowsRightLeftIcon className="w-5.5 h-5.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">{t('caisses.transferTitle')}</h2>
                    <p className="text-xs text-white/60 mt-0.5">{t('caisses.title')}</p>
                  </div>
                </div>
                <button onClick={() => setShowTransferModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Form body ── */}
            <form onSubmit={handleTransfer} className="p-6 space-y-5">
              {/* Source & Destination with visual flow */}
              <div className="space-y-3">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                    <div className="w-5 h-5 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <ArrowTrendingDownIcon className="w-3 h-3 text-red-500 dark:text-red-400" />
                    </div>
                    {t('caisses.fromCaisse')}
                  </label>
                  <select
                    value={transferForm.from_caisse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, from_caisse_id: parseInt(e.target.value) || 0, to_caisse_id: transferForm.to_caisse_id === parseInt(e.target.value) ? 0 : transferForm.to_caisse_id })}
                    className="select w-full text-sm"
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
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('caisses.availableBalance')}{' '}
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {formatCurrency(summary.caisses.find((c) => c.id === transferForm.from_caisse_id)?.balance || 0)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Direction indicator */}
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                    <div className="w-5 h-5 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <ArrowTrendingUpIcon className="w-3 h-3 text-green-500 dark:text-green-400" />
                    </div>
                    {t('caisses.toCaisse')}
                  </label>
                  <select
                    value={transferForm.to_caisse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_caisse_id: parseInt(e.target.value) || 0 })}
                    className="select w-full text-sm"
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
              </div>

              {/* Amount — prominent field */}
              <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  {t('caisses.transferAmount')} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={transferForm.amount || ''}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })}
                    className="input w-full text-lg font-bold tabular-nums"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('caisses.notesLabel')}</label>
                <textarea
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="input w-full text-sm"
                  rows={2}
                  placeholder={t('caisses.notesPlaceholder')}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isTransferring ? (
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowsRightLeftIcon className="w-4 h-4" />
                      {t('caisses.confirmTransfer')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-5 py-3 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
                >
                  {t('caisses.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    );
  }

  // List view
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" data-tour="caisses-header">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{t('caisses.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('caisses.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowTour(true)} className="hidden sm:inline-block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            {t('caisses.tourTitle')}
          </button>
          <button onClick={exportCaissesExcel} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" />
            {t('caisses.exportExcel')}
          </button>
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors">
            <PlusIcon className="w-4 h-4" />
            {t('caisses.addCaisse')}
          </button>
          <button
            onClick={() => { setTransferForm({ from_caisse_id: 0, to_caisse_id: 0, amount: 0, notes: '' }); setShowTransferModal(true); }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
            {t('caisses.transfer')}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden" data-tour="caisses-summary">
          <div className={`grid grid-cols-2 md:grid-cols-4 md:divide-x ${isRTL ? 'md:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-800`}>
            <div className="group relative px-5 py-4 text-center hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors">
              <div className={`absolute top-0 right-0 left-0 h-[3px] ${isRTL ? 'rounded-tr-2xl' : 'rounded-tl-2xl'} bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform ${isRTL ? 'origin-right' : 'origin-left'}`} />
              <CurrencyDollarIcon className="w-5 h-5 mx-auto mb-1.5 text-blue-500" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('caisses.totalBalance')}</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(summary.total_balance)}</p>
            </div>
            <div className="group relative px-5 py-4 text-center hover:bg-green-50/30 dark:hover:bg-green-900/20 transition-colors">
              <div className="absolute top-0 right-0 left-0 h-[3px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <ArrowTrendingUpIcon className="w-5 h-5 mx-auto mb-1.5 text-green-500" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('caisses.todayIn')}</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.today.total_in)}</p>
            </div>
            <div className="group relative px-5 py-4 text-center hover:bg-red-50/30 dark:hover:bg-red-900/20 transition-colors">
              <div className="absolute top-0 right-0 left-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <ArrowTrendingDownIcon className="w-5 h-5 mx-auto mb-1.5 text-red-500" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('caisses.todayOut')}</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.today.total_out)}</p>
            </div>
            <div className="group relative px-5 py-4 text-center hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-colors">
              <div className={`absolute top-0 right-0 left-0 h-[3px] ${isRTL ? 'rounded-tl-2xl' : 'rounded-tr-2xl'} bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform ${isRTL ? 'origin-right' : 'origin-left'}`} />
              <CheckCircleIcon className="w-5 h-5 mx-auto mb-1.5 text-purple-500" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('caisses.todaySettled')}</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(summary.today.total_settled)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          placeholder={t('caisses.searchByName')}
          className="input text-sm max-w-xs"
        />
        <select
          value={listTypeFilter}
          onChange={(e) => setListTypeFilter(e.target.value)}
          className="select text-sm max-w-xs"
        >
          <option value="">{t('caisses.allTypes')}</option>
          <option value="principale">{t('caisses.principale')}</option>
          <option value="vendeur">{t('caisses.vendeur')}</option>
          <option value="livreur">{t('caisses.livreur')}</option>
          <option value="cashvan">{t('caisses.cashvan')}</option>
        </select>
        {(listSearch || listTypeFilter) && (
          <button onClick={() => { setListSearch(''); setListTypeFilter(''); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline self-center">
            {t('caisses.clearFilters')}
          </button>
        )}
        <span className={`text-sm text-gray-400 dark:text-gray-500 self-center ${isRTL ? 'mr-auto' : 'ml-auto'}`}>{filteredCaisses.length} {t('caisses.caisseCount')}</span>
      </div>

      {/* Caisses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="caisses-grid">
        {filteredCaisses.map((caisse) => (
          <div
            key={caisse.id}
            onClick={() => openCaisseDetail(caisse)}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-sm hover:shadow-lg cursor-pointer transition-all p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                    {caisse.user?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{caisse.name || caisse.user?.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeColors[caisse.type]}`}>
                      {typeLabels[caisse.type]}
                    </span>
                    {caisse.name && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{caisse.user?.name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setRenameCaisse(caisse); setRenameValue(caisse.name || ''); setShowRenameModal(true); }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title={t('caisses.rename')}
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                {caisse.is_active ? (
                  <span className="w-3 h-3 bg-green-500 rounded-full" title={t('caisses.active')}></span>
                ) : (
                  <span className="w-3 h-3 bg-gray-400 rounded-full" title={t('caisses.inactiveStatus')}></span>
                )}
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('caisses.balance')}</p>
              <p className={`text-2xl font-bold ${Number(caisse.balance) > 0 ? 'text-green-600 dark:text-green-400' : Number(caisse.balance) < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {formatCurrency(caisse.balance)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredCaisses.length === 0 && (
        <div className="text-center py-12">
          <BanknotesIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {(listSearch || listTypeFilter) ? t('caisses.noResults') : t('caisses.noCaisses')}
          </p>
        </div>
      )}

      {/* Create Caisse Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">{t('caisses.createCaisseTitle')}</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8"><div className="spinner"></div></div>
              ) : (
                <form onSubmit={handleCreateCaisse} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.selectUser')} *</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(parseInt(e.target.value) || 0)}
                      className="select"
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('caisses.caisseTypeHint')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.caisseName')}</label>
                    <input
                      type="text"
                      value={newCaisseName}
                      onChange={(e) => setNewCaisseName(e.target.value)}
                      className="input w-full"
                      placeholder={t('caisses.caisseNamePlaceholder')}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={isCreating || !selectedUserId} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
                      {isCreating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.createCaisse')}
                    </button>
                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {t('caisses.cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && summary && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowTransferModal(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-indigo-500/10 dark:shadow-black/40 overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header with gradient ── */}
            <div className="relative bg-gradient-to-l from-violet-600 via-indigo-600 to-blue-600 px-6 py-5 overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 0L40 20L20 40L0 20z\' fill=\'%23fff\' fill-opacity=\'0.15\'/%3E%3C/svg%3E")', backgroundSize: '20px 20px' }} />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                    <ArrowsRightLeftIcon className="w-5.5 h-5.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">{t('caisses.transferTitle')}</h2>
                    <p className="text-xs text-white/60 mt-0.5">{t('caisses.title')}</p>
                  </div>
                </div>
                <button onClick={() => setShowTransferModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Form body ── */}
            <form onSubmit={handleTransfer} className="p-6 space-y-5">
              {/* Source & Destination with visual flow */}
              <div className="space-y-3">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                    <div className="w-5 h-5 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <ArrowTrendingDownIcon className="w-3 h-3 text-red-500 dark:text-red-400" />
                    </div>
                    {t('caisses.fromCaisse')}
                  </label>
                  <select
                    value={transferForm.from_caisse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, from_caisse_id: parseInt(e.target.value) || 0, to_caisse_id: transferForm.to_caisse_id === parseInt(e.target.value) ? 0 : transferForm.to_caisse_id })}
                    className="select w-full text-sm"
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
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('caisses.availableBalance')}{' '}
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {formatCurrency(summary.caisses.find((c) => c.id === transferForm.from_caisse_id)?.balance || 0)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Direction indicator */}
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 p-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                    <div className="w-5 h-5 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <ArrowTrendingUpIcon className="w-3 h-3 text-green-500 dark:text-green-400" />
                    </div>
                    {t('caisses.toCaisse')}
                  </label>
                  <select
                    value={transferForm.to_caisse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_caisse_id: parseInt(e.target.value) || 0 })}
                    className="select w-full text-sm"
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
              </div>

              {/* Amount — prominent field */}
              <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
                <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  {t('caisses.transferAmount')} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={transferForm.amount || ''}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })}
                    className="input w-full text-lg font-bold tabular-nums"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('caisses.notesLabel')}</label>
                <textarea
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="input w-full text-sm"
                  rows={2}
                  placeholder={t('caisses.notesPlaceholder')}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isTransferring ? (
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowsRightLeftIcon className="w-4 h-4" />
                      {t('caisses.confirmTransfer')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-5 py-3 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
                >
                  {t('caisses.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Caisse Modal */}
      {showRenameModal && renameCaisse && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowRenameModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <PencilSquareIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">{t('caisses.renameTitle')}</h2>
              </div>
              <button onClick={() => setShowRenameModal(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{renameCaisse.user?.name} - {typeLabels[renameCaisse.type]}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('caisses.newName')}</label>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="input w-full"
                    placeholder={t('caisses.newNamePlaceholder')}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRename(); } }}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleRename} disabled={isRenaming} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
                    {isRenaming ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('caisses.saveRename')}
                  </button>
                  <button onClick={() => setShowRenameModal(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t('caisses.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
