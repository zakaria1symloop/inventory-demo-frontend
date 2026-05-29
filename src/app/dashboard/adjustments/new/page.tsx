'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adjustmentsApi, productsApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';
import { MagnifyingGlassIcon, XMarkIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  unit?: { id: number; name: string };
}

interface Warehouse {
  id: number;
  name: string;
}

interface AdjustmentItem {
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
}

export default function NewAdjustmentPage() {
  const router = useRouter();
  const { t } = useLocale();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Form data
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'addition' | 'subtraction'>('addition');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<AdjustmentItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [warehousesRes, productsRes] = await Promise.all([
        warehousesApi.getAll(),
        productsApi.getAll({ per_page: 1000 })
      ]);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
      setProducts(productsRes.data.data || productsRes.data);
    } catch (error) {
      toast.error(t('stock.loadDataError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const product = products.find(
        p => p.barcode === barcodeInput.trim() || p.sku === barcodeInput.trim()
      );
      if (product) {
        addProduct(product);
        setBarcodeInput('');
      } else {
        toast.error(t('stock.productNotFound'));
      }
    }
  };

  const addProduct = (product: Product) => {
    const existingIndex = items.findIndex(item => item.product_id === product.id);
    if (existingIndex > -1) {
      // Increase quantity if already exists
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      setItems(newItems);
    } else {
      // Add new product
      setItems([...items, {
        product_id: product.id,
        product: product,
        quantity: 1,
        unit_price: product.cost_price
      }]);
    }
    setShowProductSearch(false);
    setSearchTerm('');
    barcodeInputRef.current?.focus();
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return;
    const newItems = [...items];
    newItems[index].unit_price = price;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const handleSubmit = async () => {
    if (!warehouseId) {
      toast.error(t('stock.adjSelectWarehouseRequired'));
      return;
    }
    if (items.length === 0) {
      toast.error(t('stock.adjAddOneProduct'));
      return;
    }

    setIsSaving(true);
    try {
      const adjustmentData = {
        warehouse_id: warehouseId,
        date: date,
        type: type,
        reason: reason || null,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      await adjustmentsApi.create(adjustmentData);
      toast.success(t('stock.adjCreatedSuccess'));
      router.push('/dashboard/adjustments');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('stock.adjCreateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const typeDot = type === 'addition' ? 'metric-dot-green' : 'metric-dot-red';

  return (
    <div>
      <PageHeader
        title={t('stock.newAdjustmentTitle')}
        breadcrumb={[
          { label: t('sidebar.adjustments'), href: '/dashboard/adjustments' },
          { label: t('stock.newAdjustmentTitle') },
        ]}
      >
        <button
          onClick={() => router.push('/dashboard/adjustments')}
          className="btn btn-secondary text-[13px] h-9 px-4"
        >
          {t('stock.adjBack')}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="surface-pro">
            <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700">
              <h2 className="surface-heading">{t('stock.adjustmentInfo')}</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.warehouseRequired')}</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(Number(e.target.value))}
                  className="select text-[14px] py-2"
                >
                  <option value="">{t('stock.adjSelectWarehouse')}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.dateRequired')}</label>
                <DateInput value={date} onChange={(v) => setDate(v)} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.adjustmentTypeRequired')}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'addition' | 'subtraction')}
                  className="select text-[14px] py-2"
                >
                  <option value="addition">{t('stock.adjAdditionLong')}</option>
                  <option value="subtraction">{t('stock.adjSubtractionLong')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.reason')}</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('stock.adjReasonPlaceholder')}
                  className="input text-[14px] py-2"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="surface-pro">
            <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700">
              <h2 className="surface-heading">{t('stock.productsHeading')}</h2>
            </div>
            <div className="p-4">
              {/* Barcode + search */}
              <div className="flex gap-2 mb-3">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeSearch}
                  placeholder={t('stock.scanBarcodePlaceholder')}
                  className="input flex-1 text-[14px] py-2"
                />
                <button
                  type="button"
                  onClick={() => setShowProductSearch(true)}
                  className="btn btn-secondary text-[13px] h-9 px-3 inline-flex items-center gap-1.5"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" strokeWidth={1.8} />
                  {t('stock.searchProductBtn')}
                </button>
              </div>

              {/* Items Table */}
              {items.length > 0 ? (
                <div className="table-pro-wrap">
                  <table className="table-pro compact">
                    <thead>
                      <tr>
                        <th>{t('stock.product')}</th>
                        <th>{t('stock.skuCol')}</th>
                        <th>{t('stock.unitCol')}</th>
                        <th className="text-center w-[110px]">{t('stock.qty')}</th>
                        <th className="text-center w-[130px]">{t('stock.unitPriceColAdj')}</th>
                        <th className="text-end w-[120px]">{t('stock.totalColAdj')}</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.product_id}>
                          <td className="t-strong">{item.product.name}</td>
                          <td className="t-muted">{item.product.sku}</td>
                          <td>{item.product.unit?.name || '—'}</td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                              min="1"
                              className="input w-full !px-2 text-center text-[13px] py-1 font-semibold tnum"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="input w-full !px-2 text-center text-[13px] py-1 font-semibold tnum"
                            />
                          </td>
                          <td className="tnum t-strong">{formatCurrency(item.quantity * item.unit_price)}</td>
                          <td className="text-end">
                            <button
                              onClick={() => removeItem(index)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              aria-label="remove"
                            >
                              <TrashIcon className="w-4 h-4" strokeWidth={1.7} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                  <p className="text-[13px] font-medium">{t('stock.noProductsAdded')}</p>
                  <p className="text-[11px] mt-1">{t('stock.scanOrSearchHint')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="lg:col-span-1">
          <div className="surface-pro sticky top-4">
            <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700">
              <h2 className="surface-heading">{t('stock.adjustmentSummary')}</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-gray-600 dark:text-gray-400">{t('stock.adjTypeLabel')}</span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900 dark:text-gray-100">
                  <span className={`metric-dot ${typeDot}`} aria-hidden />
                  {type === 'addition' ? t('stock.addition') : t('stock.subtraction')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-gray-600 dark:text-gray-400">{t('stock.productsCountLabel')}</span>
                <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 tnum">{items.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-gray-600 dark:text-gray-400">{t('stock.totalQtyLabel')}</span>
                <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 tnum">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{t('stock.totalValueLabel')}</span>
                <span className="text-[15px] font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(getTotalAmount())}</span>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSaving || items.length === 0}
                  className="btn btn-primary w-full text-[13px] h-9 inline-flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="spinner w-4 h-4 border-2"></div>
                      {t('common.saving')}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" strokeWidth={2} />
                      {t('stock.createAdjustment')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => router.push('/dashboard/adjustments')}
                  className="btn btn-secondary w-full text-[13px] h-9"
                >
                  {t('stock.adjCancel')}
                </button>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center pt-1 leading-relaxed">
                {t('stock.adjPendingNotice')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Search Modal — centered enterprise */}
      {showProductSearch && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowProductSearch(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[540px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">{t('stock.searchProductTitle')}</h3>
                <button
                  onClick={() => setShowProductSearch(false)}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <div className="p-4">
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.7} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('stock.searchByNameSkuBarcode')}
                    className="input w-full ltr:pl-9 rtl:pr-9 text-[14px] py-2"
                    autoFocus
                  />
                </div>
                <div className="max-h-[55vh] overflow-y-auto -mx-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-gray-400 text-center py-8 text-[13px]">{t('stock.adjNoResults')}</p>
                  ) : (
                    filteredProducts.slice(0, 30).map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-md transition-colors text-start"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{product.sku}</p>
                        </div>
                        <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum flex-shrink-0 ms-3">{formatCurrency(product.cost_price)}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40">
                <button
                  onClick={() => setShowProductSearch(false)}
                  className="btn btn-secondary text-[13px] h-9 px-4"
                >
                  {t('stock.adjClose')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
