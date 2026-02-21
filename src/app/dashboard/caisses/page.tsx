'use client';

import { useState, useEffect, useMemo } from 'react';
import { caissesApi, dispensesApi, usersApi } from '@/lib/api';
import { Caisse, CaisseTransaction, CaisseSettlement, CaisseSummary } from '@/lib/types';
import toast from 'react-hot-toast';

const typeLabels: Record<string, string> = {
  principale: 'رئيسية',
  vendeur: 'بائع',
  livreur: 'سائق',
  cashvan: 'متنقل',
};

const typeBadgeColors: Record<string, string> = {
  principale: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  vendeur: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  livreur: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cashvan: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const sourceTypeLabels: Record<string, string> = {
  van_sale: 'بيع متنقل',
  delivery: 'توصيل',
  payment: 'دفعة',
  dispense: 'مصروف',
  settlement: 'تحصيل',
  adjustment: 'تعديل',
  transfer: 'تحويل',
};

export default function CaissesPage() {
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

  // Creator filter
  const [creatorFilter, setCreatorFilter] = useState('');

  // Totals from API
  const [filteredTotals, setFilteredTotals] = useState<{ total_in: number; total_out: number; net: number } | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await caissesApi.getSummary();
      setSummary(res.data);
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'مدير',
    manager: 'مسير',
    seller: 'بائع',
    livreur: 'سائق',
    cashvan: 'متنقل',
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
      toast.error('خطأ في تحميل المستخدمين');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('يرجى اختيار مستخدم');
      return;
    }
    setIsCreating(true);
    try {
      await caissesApi.create({ user_id: selectedUserId, name: newCaisseName || undefined });
      toast.success('تم إنشاء الصندوق بنجاح');
      setShowCreateModal(false);
      await fetchSummary();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في إنشاء الصندوق');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRename = async () => {
    if (!renameCaisse) return;
    setIsRenaming(true);
    try {
      await caissesApi.update(renameCaisse.id, { name: renameValue || null });
      toast.success('تم تحديث الاسم بنجاح');
      setShowRenameModal(false);
      setRenameCaisse(null);
      await fetchSummary();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في تحديث الاسم');
    } finally {
      setIsRenaming(false);
    }
  };

  const openCaisseDetail = async (caisse: Caisse) => {
    setSelectedCaisse(caisse);
    setIsLoadingDetail(true);
    setTransactionPage(1);
    setTransactionFilter('');
    setCreatorFilter('');
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
      toast.error('خطأ في تحميل تفاصيل الصندوق');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const loadTransactions = async (page: number, filter?: string, creator?: string) => {
    if (!selectedCaisse) return;
    try {
      const params: Record<string, unknown> = { per_page: 20, page };
      if (filter) params.type = filter;
      if (creator) params.created_by = creator;
      const res = await caissesApi.getTransactions(selectedCaisse.id, params);
      setTransactions(res.data.data || []);
      setTransactionTotal(res.data.last_page || 1);
      setTransactionPage(page);
      if (res.data.totals) {
        setFilteredTotals(res.data.totals);
      }
    } catch {
      toast.error('خطأ في تحميل الحركات');
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaisse || settleForm.amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsSettling(true);
    try {
      await caissesApi.settle(selectedCaisse.id, settleForm);
      toast.success('تمت عملية التحصيل بنجاح');
      setShowSettleModal(false);
      setSettleForm({ amount: 0, type: 'admin_collect', notes: '' });
      // Refresh data
      await Promise.all([
        fetchSummary(),
        openCaisseDetail(selectedCaisse),
      ]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في عملية التحصيل');
    } finally {
      setIsSettling(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.from_caisse_id || !transferForm.to_caisse_id || transferForm.amount <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsTransferring(true);
    try {
      await caissesApi.transfer(transferForm);
      toast.success('تم التحويل بنجاح');
      setShowTransferModal(false);
      setTransferForm({ from_caisse_id: 0, to_caisse_id: 0, amount: 0, notes: '' });
      await fetchSummary();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في عملية التحويل');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaisse || expenseForm.amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
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
      toast.success('تم إضافة المصروف بنجاح');
      setShowExpenseModal(false);
      setExpenseForm({ category: 'other', amount: 0, description: '', notes: '' });
      await Promise.all([
        fetchSummary(),
        openCaisseDetail(selectedCaisse),
      ]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في إضافة المصروف');
    } finally {
      setIsCreatingExpense(false);
    }
  };

  // Get unique creators from transactions
  const uniqueCreators = useMemo(() => {
    const creators = new Map<number, string>();
    transactions.forEach(tx => {
      if (tx.creator?.id && tx.creator?.name) {
        creators.set(tx.creator.id, tx.creator.name);
      }
    });
    return Array.from(creators.entries()).map(([id, name]) => ({ id, name }));
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 2 }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  // Detail view
  if (selectedCaisse) {
    return (
      <div>
        <button
          onClick={() => setSelectedCaisse(null)}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          العودة للقائمة
        </button>

        {/* Caisse Info Header */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold dark:text-white mb-1">
                {selectedCaisse.name || `صندوق ${selectedCaisse.user?.name}`}
              </h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${typeBadgeColors[selectedCaisse.type]}`}>
                {typeLabels[selectedCaisse.type]}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">الرصيد الحالي</p>
              <p className={`text-3xl font-bold ${selectedCaisse.balance > 0 ? 'text-green-600 dark:text-green-400' : selectedCaisse.balance < 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>
                {formatCurrency(selectedCaisse.balance)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setSettleForm({
                  amount: selectedCaisse.balance,
                  type: 'admin_collect',
                  notes: '',
                });
                setShowSettleModal(true);
              }}
              disabled={selectedCaisse.balance <= 0}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              تحصيل
            </button>
            <button
              onClick={() => {
                setExpenseForm({ category: 'other', amount: 0, description: '', notes: '' });
                setShowExpenseModal(true);
              }}
              className="btn bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              مصروف
            </button>
          </div>
        </div>

        {isLoadingDetail ? (
          <div className="flex items-center justify-center h-32"><div className="spinner"></div></div>
        ) : (
          <>
            {/* Transaction Totals */}
            {filteredTotals && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card bg-green-50 dark:bg-green-900/20 py-3">
                  <p className="text-xs text-green-600 dark:text-green-400">الوارد</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(filteredTotals.total_in)}
                  </p>
                </div>
                <div className="card bg-red-50 dark:bg-red-900/20 py-3">
                  <p className="text-xs text-red-600 dark:text-red-400">الصادر</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(filteredTotals.total_out)}
                  </p>
                </div>
                <div className="card bg-blue-50 dark:bg-blue-900/20 py-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400">الصافي</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(filteredTotals.net)}
                  </p>
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold dark:text-white">سجل الحركات</h2>
                <div className="flex items-center gap-3">
                  <select
                    value={creatorFilter}
                    onChange={(e) => {
                      setCreatorFilter(e.target.value);
                      loadTransactions(1, transactionFilter, e.target.value);
                    }}
                    className="select max-w-xs"
                  >
                    <option value="">كل المستخدمين</option>
                    {uniqueCreators.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={transactionFilter}
                    onChange={(e) => {
                      setTransactionFilter(e.target.value);
                      loadTransactions(1, e.target.value, creatorFilter);
                    }}
                    className="select max-w-xs"
                  >
                    <option value="">كل الحركات</option>
                    <option value="in">وارد</option>
                    <option value="out">صادر</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>النوع</th>
                      <th>المصدر</th>
                      <th>الوصف</th>
                      <th>بواسطة</th>
                      <th>المبلغ</th>
                      <th>الرصيد بعد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-500">لا توجد حركات</td></tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="text-sm">{formatDate(tx.created_at)}</td>
                          <td>
                            <span className={`badge ${tx.type === 'in' ? 'badge-success' : 'badge-danger'}`}>
                              {tx.type === 'in' ? 'وارد' : 'صادر'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-secondary">
                              {sourceTypeLabels[tx.source_type || ''] || tx.source_type || '-'}
                            </span>
                          </td>
                          <td className="text-sm">{tx.description || '-'}</td>
                          <td className="text-sm text-gray-600 dark:text-gray-400">{tx.creator?.name || '-'}</td>
                          <td className={`font-medium ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td className="font-medium">{formatCurrency(tx.balance_after)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {transactionTotal > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => loadTransactions(transactionPage - 1, transactionFilter, creatorFilter)}
                    disabled={transactionPage <= 1}
                    className="btn btn-secondary btn-sm"
                  >
                    السابق
                  </button>
                  <span className="text-sm dark:text-gray-300">
                    صفحة {transactionPage} من {transactionTotal}
                  </span>
                  <button
                    onClick={() => loadTransactions(transactionPage + 1, transactionFilter, creatorFilter)}
                    disabled={transactionPage >= transactionTotal}
                    className="btn btn-secondary btn-sm"
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>

            {/* Settlement History */}
            {settlements.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold dark:text-white mb-4">سجل التحصيلات</h2>
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                        <th>الرصيد قبل</th>
                        <th>الرصيد بعد</th>
                        <th>بواسطة</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((s) => (
                        <tr key={s.id}>
                          <td className="text-sm">{formatDate(s.created_at)}</td>
                          <td>
                            <span className="badge badge-primary">
                              {s.type === 'admin_collect' ? 'تحصيل إداري' : 'إيداع بائع'}
                            </span>
                          </td>
                          <td className="font-medium text-red-600">{formatCurrency(s.amount)}</td>
                          <td>{formatCurrency(s.balance_before)}</td>
                          <td>{formatCurrency(s.balance_after)}</td>
                          <td>{s.settler?.name || '-'}</td>
                          <td className="text-sm">{s.notes || '-'}</td>
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
          <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
            <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">
                مصروف من صندوق {selectedCaisse.user?.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                الرصيد الحالي: <span className="font-bold text-green-600">{formatCurrency(selectedCaisse.balance)}</span>
              </p>
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">التصنيف *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="select"
                    required
                  >
                    <option value="salary">رواتب</option>
                    <option value="transport">نقل</option>
                    <option value="maintenance">صيانة</option>
                    <option value="supplies">لوازم</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">المبلغ *</label>
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
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">الوصف *</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="input"
                    placeholder="وصف المصروف..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">ملاحظات</label>
                  <textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="ملاحظات اختيارية..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={isCreatingExpense} className="btn bg-red-600 text-white hover:bg-red-700 flex-1">
                    {isCreatingExpense ? 'جاري الإضافة...' : 'تأكيد المصروف'}
                  </button>
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="btn btn-secondary">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settlement Modal */}
        {showSettleModal && (
          <div className="modal-overlay" onClick={() => setShowSettleModal(false)}>
            <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">
                تحصيل من صندوق {selectedCaisse.user?.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                الرصيد الحالي: <span className="font-bold text-green-600">{formatCurrency(selectedCaisse.balance)}</span>
              </p>
              <form onSubmit={handleSettle} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">المبلغ *</label>
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
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">نوع العملية *</label>
                  <select
                    value={settleForm.type}
                    onChange={(e) => setSettleForm({ ...settleForm, type: e.target.value })}
                    className="select"
                    required
                  >
                    <option value="admin_collect">تحصيل إداري</option>
                    <option value="seller_deposit">إيداع بائع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">ملاحظات</label>
                  <textarea
                    value={settleForm.notes}
                    onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="ملاحظات اختيارية..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={isSettling} className="btn btn-primary flex-1">
                    {isSettling ? 'جاري التحصيل...' : 'تأكيد التحصيل'}
                  </button>
                  <button type="button" onClick={() => setShowSettleModal(false)} className="btn btn-secondary">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">الصناديق</h1>
        <div className="flex gap-3">
          <button
            onClick={openCreateModal}
            className="btn bg-green-600 text-white hover:bg-green-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة صندوق
          </button>
          <button
            onClick={() => {
              setTransferForm({ from_caisse_id: 0, to_caisse_id: 0, amount: 0, notes: '' });
              setShowTransferModal(true);
            }}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            تحويل بين الصناديق
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-sm text-blue-600 dark:text-blue-400 mb-1">إجمالي الأرصدة</h3>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(summary.total_balance)}</p>
          </div>
          <div className="card bg-green-50 dark:bg-green-900/20">
            <h3 className="text-sm text-green-600 dark:text-green-400 mb-1">وارد اليوم</h3>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(summary.today.total_in)}</p>
          </div>
          <div className="card bg-red-50 dark:bg-red-900/20">
            <h3 className="text-sm text-red-600 dark:text-red-400 mb-1">صادر اليوم</h3>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(summary.today.total_out)}</p>
          </div>
          <div className="card bg-purple-50 dark:bg-purple-900/20">
            <h3 className="text-sm text-purple-600 dark:text-purple-400 mb-1">محصّل اليوم</h3>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(summary.today.total_settled)}</p>
          </div>
        </div>
      )}

      {/* Caisses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summary?.caisses.map((caisse) => (
          <div
            key={caisse.id}
            onClick={() => openCaisseDetail(caisse)}
            className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-600"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                    {caisse.user?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold dark:text-white">{caisse.name || caisse.user?.name}</h3>
                  <div className="flex items-center gap-1">
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
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
                  title="تغيير الاسم"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                {caisse.is_active ? (
                  <span className="w-3 h-3 bg-green-500 rounded-full" title="نشط"></span>
                ) : (
                  <span className="w-3 h-3 bg-gray-400 rounded-full" title="غير نشط"></span>
                )}
              </div>
            </div>
            <div className="border-t dark:border-gray-700 pt-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">الرصيد</p>
              <p className={`text-2xl font-bold ${caisse.balance > 0 ? 'text-green-600 dark:text-green-400' : caisse.balance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {formatCurrency(caisse.balance)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {(!summary || summary.caisses.length === 0) && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          لا توجد صناديق
        </div>
      )}

      {/* Create Caisse Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">إضافة صندوق جديد</h2>
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8"><div className="spinner"></div></div>
            ) : (
              <form onSubmit={handleCreateCaisse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">المستخدم *</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(parseInt(e.target.value) || 0)}
                    className="select"
                    required
                  >
                    <option value={0}>اختر المستخدم</option>
                    {usersWithoutCaisse.filter(u => !u.hasCaisse).length > 0 && (
                      <optgroup label="بدون صندوق">
                        {usersWithoutCaisse.filter(u => !u.hasCaisse).map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({roleLabels[u.role] || u.role})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {usersWithoutCaisse.filter(u => u.hasCaisse).length > 0 && (
                      <optgroup label="لديهم صندوق">
                        {usersWithoutCaisse.filter(u => u.hasCaisse).map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({roleLabels[u.role] || u.role})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">سيتم تحديد نوع الصندوق تلقائياً حسب دور المستخدم</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">اسم الصندوق</label>
                  <input
                    type="text"
                    value={newCaisseName}
                    onChange={(e) => setNewCaisseName(e.target.value)}
                    className="input w-full"
                    placeholder="اختياري - مثال: صندوق المبيعات"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={isCreating || !selectedUserId} className="btn btn-primary flex-1">
                    {isCreating ? 'جاري الإنشاء...' : 'إنشاء الصندوق'}
                  </button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && summary && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">تحويل بين الصناديق</h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">من صندوق *</label>
                <select
                  value={transferForm.from_caisse_id}
                  onChange={(e) => setTransferForm({ ...transferForm, from_caisse_id: parseInt(e.target.value) || 0, to_caisse_id: transferForm.to_caisse_id === parseInt(e.target.value) ? 0 : transferForm.to_caisse_id })}
                  className="select"
                  required
                >
                  <option value={0}>اختر الصندوق المصدر</option>
                  {summary.caisses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.user?.name} ({typeLabels[c.type]}) - {formatCurrency(c.balance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">إلى صندوق *</label>
                <select
                  value={transferForm.to_caisse_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_caisse_id: parseInt(e.target.value) || 0 })}
                  className="select"
                  required
                >
                  <option value={0}>اختر الصندوق الوجهة</option>
                  {summary.caisses
                    .filter((c) => c.id !== transferForm.from_caisse_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.user?.name} ({typeLabels[c.type]}) - {formatCurrency(c.balance)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">المبلغ *</label>
                <input
                  type="number"
                  value={transferForm.amount || ''}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })}
                  className="input"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
                {transferForm.from_caisse_id > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    الرصيد المتاح: {formatCurrency(summary.caisses.find((c) => c.id === transferForm.from_caisse_id)?.balance || 0)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">ملاحظات</label>
                <textarea
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="ملاحظات اختيارية..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isTransferring} className="btn btn-primary flex-1">
                  {isTransferring ? 'جاري التحويل...' : 'تأكيد التحويل'}
                </button>
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Caisse Modal */}
      {showRenameModal && renameCaisse && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">تغيير اسم الصندوق</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{renameCaisse.user?.name} - {typeLabels[renameCaisse.type]}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">الاسم الجديد</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="input w-full"
                  placeholder="اسم الصندوق"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRename(); } }}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleRename} disabled={isRenaming} className="btn btn-primary flex-1">
                  {isRenaming ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button onClick={() => setShowRenameModal(false)} className="btn btn-secondary">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
