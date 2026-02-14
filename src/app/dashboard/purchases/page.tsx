'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { purchasesApi, suppliersApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import PurchaseForm from './_components/PurchaseForm';
import {
  PlusIcon,
  XMarkIcon,
  ListBulletIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  EyeIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface Purchase {
  id: number;
  reference: string;
  supplier_id: number;
  warehouse_id: number;
  date: string;
  total_amount: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: 'pending' | 'received' | 'partial';
  payment_status: 'unpaid' | 'partial' | 'paid';
  note?: string;
  supplier?: { id: number; name: string };
  warehouse?: { id: number; name: string };
}

interface Tab {
  id: string;
  type: 'list' | 'new' | 'edit' | 'view';
  title: string;
  purchaseId?: number;
  reference?: string;
}

export default function PurchasesPage() {
  // Tab state
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'list', type: 'list', title: 'قائمة الفواتير' }
  ]);
  const [activeTabId, setActiveTabId] = useState('list');

  // List data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Generate unique tab ID
  const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Open new tab
  const openNewTab = useCallback(() => {
    const newTab: Tab = {
      id: generateTabId(),
      type: 'new',
      title: 'فاتورة جديدة',
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  // Open edit tab
  const openEditTab = useCallback((purchaseId: number, reference: string) => {
    // Check if tab already exists
    const existingTab = tabs.find(t => t.type === 'edit' && t.purchaseId === purchaseId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: Tab = {
      id: generateTabId(),
      type: 'edit',
      title: `تعديل ${reference}`,
      purchaseId,
      reference,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs]);

  // Close tab
  const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (tabId === 'list') return; // Can't close list tab

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      // If closing active tab, switch to previous tab or list
      if (activeTabId === tabId) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveTab = newTabs[closedIndex - 1] || newTabs[0];
        setActiveTabId(newActiveTab.id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  // Handle form success (close tab and refresh list)
  const handleFormSuccess = useCallback((tabId: string) => {
    closeTab(tabId);
    setActiveTabId('list');
    fetchData();
  }, [closeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        openNewTab();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId !== 'list') {
          closeTab(activeTabId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openNewTab, closeTab, activeTabId]);

  const fetchData = async () => {
    try {
      const [purchasesRes] = await Promise.all([
        purchasesApi.getAll(),
      ]);
      setPurchases(purchasesRes.data.data || purchasesRes.data);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    try {
      await purchasesApi.delete(id);
      toast.success('تم حذف الفاتورة بنجاح');
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'خطأ في حذف الفاتورة';
      toast.error(message);
    }
  };

  const canDelete = (purchase: Purchase) => {
    return purchase.payment_status === 'unpaid' && purchase.paid_amount === 0;
  };

  const handleDownloadFacture = async (id: number, reference: string) => {
    try {
      const response = await purchasesApi.downloadFacture(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bon-achat-${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل الفاتورة بنجاح');
    } catch (error) {
      toast.error('خطأ في تحميل الفاتورة');
    }
  };

  const handleDownloadBonCommande = async (id: number, reference: string) => {
    try {
      const response = await purchasesApi.downloadBonCommande(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bon-commande-${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل بون الطلب بنجاح');
    } catch (error) {
      toast.error('خطأ في تحميل بون الطلب');
    }
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return '0 د.ج.';
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-DZ');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      pending: { class: 'badge-warning', text: 'معلق' },
      received: { class: 'badge-success', text: 'مستلم' },
      partial: { class: 'badge-info', text: 'جزئي' },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      unpaid: { class: 'badge-danger', text: 'غير مدفوع' },
      partial: { class: 'badge-warning', text: 'جزئي' },
      paid: { class: 'badge-success', text: 'مدفوع' },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Render tab content
  const renderTabContent = (tab: Tab) => {
    switch (tab.type) {
      case 'list':
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">المشتريات</h1>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/purchases/creditors"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <BanknotesIcon className="w-5 h-5" />
                  الديون للموردين
                </Link>
                <button onClick={openNewTab} className="btn btn-primary inline-flex items-center gap-2">
                  <PlusIcon className="w-5 h-5" />
                  إضافة فاتورة شراء
                  <kbd className="bg-blue-700 px-1.5 py-0.5 rounded text-xs">Insert</kbd>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="card">
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input max-w-xs"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select max-w-xs"
                >
                  <option value="">كل الحالات</option>
                  <option value="pending">معلق</option>
                  <option value="received">مستلم</option>
                  <option value="partial">جزئي</option>
                </select>
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>المرجع</th>
                      <th>المورد</th>
                      <th>المستودع</th>
                      <th>التاريخ</th>
                      <th>الإجمالي</th>
                      <th>المدفوع</th>
                      <th>المتبقي</th>
                      <th>الحالة</th>
                      <th>الدفع</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.length === 0 ? (
                      <tr><td colSpan={10} className="text-center py-8 text-gray-500">لا توجد فواتير شراء</td></tr>
                    ) : (
                      filteredPurchases.map((purchase) => {
                        const statusBadge = getStatusBadge(purchase.status);
                        const paymentBadge = getPaymentBadge(purchase.payment_status);
                        return (
                          <tr key={purchase.id}>
                            <td className="font-medium">{purchase.reference}</td>
                            <td>{purchase.supplier?.name || '-'}</td>
                            <td>{purchase.warehouse?.name || '-'}</td>
                            <td>{formatDate(purchase.date)}</td>
                            <td>{formatCurrency(purchase.grand_total)}</td>
                            <td className="text-green-600">{formatCurrency(purchase.paid_amount)}</td>
                            <td className="text-red-600">{formatCurrency(purchase.due_amount)}</td>
                            <td><span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span></td>
                            <td><span className={`badge ${paymentBadge.class}`}>{paymentBadge.text}</span></td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditTab(purchase.id, purchase.reference)}
                                  className="text-amber-600 hover:text-amber-800"
                                  title="تعديل"
                                >
                                  <PencilSquareIcon className="w-5 h-5" />
                                </button>
                                <Link href={`/dashboard/purchases/${purchase.id}`} className="text-gray-600 hover:text-gray-800" title="عرض">
                                  <EyeIcon className="w-5 h-5" />
                                </Link>
                                <button onClick={() => handleDownloadFacture(purchase.id, purchase.reference)} className="text-blue-600 hover:text-blue-800" title="بون الشراء">
                                  <DocumentTextIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDownloadBonCommande(purchase.id, purchase.reference)} className="text-green-600 hover:text-green-800" title="بون الطلب">
                                  <ClipboardDocumentListIcon className="w-5 h-5" />
                                </button>
                                {canDelete(purchase) && (
                                  <button onClick={() => handleDelete(purchase.id)} className="text-red-600 hover:text-red-800" title="حذف">
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );

      case 'new':
        return (
          <PurchaseForm
            key={tab.id}
            onSuccess={() => handleFormSuccess(tab.id)}
            onCancel={() => closeTab(tab.id)}
          />
        );

      case 'edit':
        return (
          <PurchaseForm
            key={tab.id}
            purchaseId={tab.purchaseId}
            onSuccess={() => handleFormSuccess(tab.id)}
            onCancel={() => closeTab(tab.id)}
          />
        );

      default:
        return null;
    }
  };

  const getTabIcon = (type: Tab['type']) => {
    switch (type) {
      case 'list':
        return <ListBulletIcon className="w-4 h-4" />;
      case 'new':
        return <DocumentPlusIcon className="w-4 h-4" />;
      case 'edit':
        return <PencilSquareIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-2 flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> فاتورة جديدة</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Ctrl+W</kbd> إغلاق التبويب</span>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 pt-2 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors cursor-pointer
              ${activeTabId === tab.id
                ? 'bg-white border-gray-200 text-blue-600'
                : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {getTabIcon(tab.type)}
            <span className="max-w-[150px] truncate">{tab.title}</span>
            {tab.type !== 'list' && (
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="p-0.5 rounded hover:bg-gray-300 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* Add New Tab Button */}
        <button
          onClick={openNewTab}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          title="فاتورة جديدة"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white p-4 overflow-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTabId === tab.id ? 'block' : 'hidden'}
          >
            {renderTabContent(tab)}
          </div>
        ))}
      </div>
    </div>
  );
}
