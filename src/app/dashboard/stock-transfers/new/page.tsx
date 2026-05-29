'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { stockTransfersApi, productsApi, warehousesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/dashboard';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface AssignedUser {
  id: number;
  name: string;
  role?: string;
  warehouse_id: number;
}

interface WarehouseWithUser {
  id: number;
  name: string;
  is_main: boolean;
  assigned_user?: AssignedUser | null;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  cost_price: number;
  retail_price?: number;
  wholesale_price?: number;
  unit?: { id: number; name: string; short_name?: string };
  pieces_per_package?: number;
  stock?: { product_id: number; warehouse_id: number; quantity: number }[];
}

interface StockEntry {
  product_id: number;
  quantity: number;
}

interface TransferItem {
  product_id: number;
  product: Product;
  quantity: number;
  extra_pieces: number;
  pieces_per_package: number;
  total_pieces: number;
  decimal_qty: number;
  unit_cost: number;
  subtotal: number;
}

export default function NewStockTransferPage() {
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [warehouses, setWarehouses] = useState<WarehouseWithUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<StockEntry[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searchMode, setSearchMode] = useState<'barcode' | 'name'>('barcode');
  const productListRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [fromWarehouseId, setFromWarehouseId] = useState<number | ''>('');
  const [toWarehouseId, setToWarehouseId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);

  // Refs for keyboard navigation
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const tourSteps: TourStep[] = useMemo(() => [
    { target: '[data-tour="nst-title"]', title: t('stockTransfersNew.tourTitle1'), desc: t('stockTransfersNew.tourDesc1'), position: 'bottom' as const },
    { target: '[data-tour="nst-warehouses"]', title: t('stockTransfersNew.tourTitle2'), desc: t('stockTransfersNew.tourDesc2'), position: 'bottom' as const },
    { target: '[data-tour="nst-search"]', title: t('stockTransfersNew.tourTitle3'), desc: t('stockTransfersNew.tourDesc3'), position: 'bottom' as const },
    { target: '[data-tour="nst-items"]', title: t('stockTransfersNew.tourTitle4'), desc: t('stockTransfersNew.tourDesc4'), position: 'top' as const },
    { target: '[data-tour="nst-summary"]', title: t('stockTransfersNew.tourTitle5'), desc: t('stockTransfersNew.tourDesc5'), position: 'right' as const },
  ], [t]);

  useEffect(() => {
    fetchInitialData();
    const saved = localStorage.getItem('transferSearchMode');
    if (saved === 'barcode' || saved === 'name') setSearchMode(saved);
  }, []);

  const fetchWarehouseStock = useCallback(async (whId: number) => {
    setLoadingStock(true);
    try {
      const response = await warehousesApi.getStock(whId);
      const data = response.data;
      const stockList: StockEntry[] = (Array.isArray(data) ? data : data.data || []).map(
        (s: { product_id: number; quantity: number }) => ({
          product_id: s.product_id,
          quantity: Number(s.quantity) || 0,
        })
      );
      setWarehouseStock(stockList);
    } catch {
      setWarehouseStock([]);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  useEffect(() => {
    if (fromWarehouseId) {
      fetchWarehouseStock(fromWarehouseId as number);
    } else {
      setWarehouseStock([]);
    }
  }, [fromWarehouseId, fetchWarehouseStock]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (searchMode === 'barcode') barcodeInputRef.current?.focus();
        else searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchMode]);

  const fetchInitialData = async () => {
    setIsLoadingData(true);
    try {
      const [warehousesRes, productsRes] = await Promise.all([
        warehousesApi.getAll(),
        productsApi.getAll({ per_page: 1000 })
      ]);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
      setProducts(productsRes.data.data || productsRes.data);
    } catch {
      toast.error(t('stockTransfersNew.errorLoadingData'));
    } finally {
      setIsLoadingData(false);
    }
  };

  const getStock = (productId: number): number => {
    const entry = warehouseStock.find(s => s.product_id === productId);
    return entry ? entry.quantity : 0;
  };

  const toggleSearchMode = () => {
    const newMode = searchMode === 'barcode' ? 'name' : 'barcode';
    setSearchMode(newMode);
    localStorage.setItem('transferSearchMode', newMode);
    setBarcodeInput('');
    setSearchTerm('');
    setShowDropdown(false);
    setTimeout(() => {
      if (newMode === 'barcode') barcodeInputRef.current?.focus();
      else searchInputRef.current?.focus();
    }, 50);
  };

  const addProduct = (product: Product, qty: number = 1) => {
    const stock = getStock(product.id);
    if (fromWarehouseId && stock <= 0) {
      toast.error(`${product.name}: ${t('stockTransfersNew.notAvailableInSource')}`);
      return;
    }
    const ppp = product.pieces_per_package || 1;
    const unitCost = Number(product.cost_price) || 0;
    const existingIndex = items.findIndex(item => item.product_id === product.id);
    if (existingIndex > -1) {
      const newItems = [...items];
      const item = newItems[existingIndex];
      item.quantity += qty;
      item.total_pieces = item.quantity * item.pieces_per_package + item.extra_pieces;
      item.decimal_qty = item.quantity + item.extra_pieces / item.pieces_per_package;
      item.subtotal = item.unit_cost * item.total_pieces;
      newItems.splice(existingIndex, 1);
      setItems([item, ...newItems]);
    } else {
      const totalPieces = qty * ppp;
      const newItem: TransferItem = {
        product_id: product.id,
        product,
        quantity: qty,
        extra_pieces: 0,
        pieces_per_package: ppp,
        total_pieces: totalPieces,
        decimal_qty: qty,
        unit_cost: unitCost,
        subtotal: unitCost * totalPieces,
      };
      setItems([newItem, ...items]);
    }
    setShowDropdown(false);
    setSearchTerm('');
    setBarcodeInput('');
    setHighlightIndex(-1);
    if (searchMode === 'barcode') barcodeInputRef.current?.focus();
    else searchInputRef.current?.focus();
  };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !barcodeInput.trim()) return;
    e.preventDefault();
    const product = products.find(p =>
      p.barcode === barcodeInput.trim() || p.sku === barcodeInput.trim()
    );
    if (product) {
      addProduct(product);
    } else {
      toast.error(t('stockTransfersNew.productNotFoundByBarcode'));
    }
    setBarcodeInput('');
  };

  const recalcItem = (item: TransferItem) => {
    item.total_pieces = item.quantity * item.pieces_per_package + item.extra_pieces;
    item.decimal_qty = item.quantity + item.extra_pieces / item.pieces_per_package;
    item.subtotal = item.unit_cost * item.total_pieces;
  };

  const updateCartons = (index: number, cartons: number) => {
    if (cartons < 0) return;
    const newItems = [...items];
    newItems[index].quantity = cartons;
    recalcItem(newItems[index]);
    setItems(newItems);
  };

  const updateExtraPieces = (index: number, extra: number) => {
    if (extra < 0) return;
    const newItems = [...items];
    const item = newItems[index];
    const ppp = item.pieces_per_package;
    if (extra >= ppp) {
      const addCartons = Math.floor(extra / ppp);
      item.quantity += addCartons;
      item.extra_pieces = extra % ppp;
    } else {
      item.extra_pieces = extra;
    }
    recalcItem(item);
    setItems(newItems);
  };

  const updateTotalPieces = (index: number, newTotal: number) => {
    if (newTotal < 0) return;
    const newItems = [...items];
    const item = newItems[index];
    const ppp = item.pieces_per_package;
    item.quantity = Math.floor(newTotal / ppp);
    item.extra_pieces = newTotal % ppp;
    item.total_pieces = newTotal;
    item.decimal_qty = item.quantity + item.extra_pieces / ppp;
    item.subtotal = item.unit_cost * newTotal;

    const stock = getStock(item.product_id);
    if (fromWarehouseId && item.total_pieces > stock) {
      toast.error(`${item.product.name}: ${t('stockTransfersNew.availableOnly')} ${fmtStock(stock, ppp)}`);
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[rowIndex];
      const hasPieces = item && (item.pieces_per_package || 1) > 1;
      const fieldOrder = hasPieces
        ? ['quantity', 'extra_pieces', 'total_pieces']
        : ['total_pieces'];
      const currentIdx = fieldOrder.indexOf(field);

      if (currentIdx < fieldOrder.length - 1) {
        const nextField = fieldOrder[currentIdx + 1];
        const nextRef = inputRefs.current[`${rowIndex}-${nextField}`];
        nextRef?.focus();
        nextRef?.select();
      } else if (rowIndex < items.length - 1) {
        const nextRef = inputRefs.current[`${rowIndex + 1}-quantity`];
        nextRef?.focus();
        nextRef?.select();
      } else {
        if (searchMode === 'barcode') barcodeInputRef.current?.focus();
        else searchInputRef.current?.focus();
      }
    }
  }, [items, searchMode]);

  const getTotalPieces = () => items.reduce((sum, item) => sum + item.total_pieces, 0);
  const getTotalCartons = () => items.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalExtraPieces = () => items.reduce((sum, item) => sum + item.extra_pieces, 0);
  const getTotalValue = () => items.reduce((sum, item) => sum + item.subtotal, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);

  const fmtStock = (totalPieces: number, ppp: number): string => {
    if (!ppp || ppp <= 1) return Math.round(totalPieces).toString();
    const cartons = Math.floor(totalPieces / ppp);
    const pieces = totalPieces % ppp;
    if (cartons > 0 && pieces > 0) return `${cartons} ${t('stockTransfersNew.carton')} ${pieces} ${t('stockTransfersNew.piece')}`;
    if (cartons > 0) return `${cartons} ${t('stockTransfersNew.carton')}`;
    if (pieces > 0) return `${pieces} ${t('stockTransfersNew.piece')}`;
    return '0';
  };

  const hasStockErrors = () => {
    if (!fromWarehouseId) return false;
    return items.some(item => item.total_pieces > getStock(item.product_id));
  };

  const handleSubmit = async () => {
    if (!fromWarehouseId) { toast.error(t('stockTransfersNew.selectSourceWarehouse')); return; }
    if (!toWarehouseId) { toast.error(t('stockTransfersNew.selectDestWarehouse')); return; }
    if (fromWarehouseId === toWarehouseId) { toast.error(t('stockTransfersNew.warehousesMustDiffer')); return; }
    const destWh = warehouses.find(w => w.id === toWarehouseId);
    if (destWh?.assigned_user && destWh.assigned_user.role !== 'cashvan') {
      toast.error(t('stockTransfersNew.transferOnlyCashvan'));
      return;
    }
    if (items.length === 0) { toast.error(t('stockTransfersNew.addAtLeastOneProduct')); return; }
    const errors: string[] = [];
    for (const item of items) {
      const available = getStock(item.product_id);
      if (item.total_pieces > available) {
        errors.push(`${item.product.name}: ${t('stockTransfersNew.requested')} ${fmtStock(item.total_pieces, item.pieces_per_package)}, ${t('stockTransfersNew.available')} ${fmtStock(available, item.pieces_per_package)}`);
      }
    }
    if (errors.length > 0) { toast.error(errors.join('\n')); return; }

    setIsSaving(true);
    try {
      await stockTransfersApi.create({
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        notes: notes || null,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.total_pieces,
        }))
      });
      toast.success(t('stockTransfersNew.transferCreatedSuccess'));
      router.push('/dashboard/stock-transfers');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || t('stockTransfersNew.errorCreatingTransfer');
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const getDriverName = (whId: number | ''): string => {
    if (!whId) return '';
    const wh = warehouses.find(w => w.id === whId);
    return wh?.assigned_user?.name || '';
  };

  const getDestWarehouseUser = (whId: number | '') => {
    if (!whId) return null;
    const wh = warehouses.find(w => w.id === whId);
    return wh?.assigned_user || null;
  };

  const destUser = getDestWarehouseUser(toWarehouseId);
  const isDestCashvan = !toWarehouseId || !destUser || destUser.role === 'cashvan';

  const storageKey = 'new_stock_transfer_tour_step';

  if (isLoadingData) {
    return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8"></div></div>;
  }

  return (
    <div>
      <div data-tour="nst-title">
        <PageHeader
          title={t('stockTransfersNew.pageTitle')}
          subtitle={t('stockTransfersNew.pageSubtitle')}
          breadcrumb={[
            { label: t('sidebar.stockTransfers'), href: '/dashboard/stock-transfers' },
            { label: t('stockTransfersNew.pageTitle') },
          ]}
        >
          <button
            onClick={() => { localStorage.removeItem(storageKey); setShowTour(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={t('stockTransfersNew.tourBtn')}
          >
            {t('stockTransfersNew.tourBtn')}
          </button>
        </PageHeader>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500 mb-4">
        <span className="flex items-center gap-1.5"><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono text-[10px]">F2</kbd> {t('stockTransfersNew.searchProduct')}</span>
        <span className="flex items-center gap-1.5"><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono text-[10px]">Enter</kbd> {t('stockTransfersNew.navigateFields')}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Warehouse Selection */}
          <div className="surface-pro p-4" data-tour="nst-warehouses">
            <h2 className="surface-heading mb-3">{t('stockTransfersNew.transferInfo')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stockTransfersNew.sourceWarehouse')} *</label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => {
                    setFromWarehouseId(Number(e.target.value) || '');
                    setItems([]);
                  }}
                  className="select w-full text-[13px] py-2"
                >
                  <option value="">{t('stockTransfersNew.selectSource')}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.assigned_user ? ` (${w.assigned_user.name})` : ''}{w.is_main ? ` - ${t('stockTransfersNew.main')}` : ''}
                    </option>
                  ))}
                </select>
                {loadingStock && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <ArrowPathIcon className="w-3 h-3 animate-spin" />
                    {t('stockTransfersNew.loadingStock')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stockTransfersNew.destWarehouse')} *</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(Number(e.target.value) || '')}
                  className={`select w-full text-[13px] py-2 ${toWarehouseId && !isDestCashvan ? 'border-red-400 dark:border-red-500' : ''}`}
                >
                  <option value="">{t('stockTransfersNew.selectDest')}</option>
                  {warehouses.map(w => {
                    const roleLabel = w.assigned_user?.role === 'cashvan' ? t('stockTransfersNew.mobileSeller') : w.assigned_user?.role === 'livreur' ? t('stockTransfersNew.deliveryDriver') : '';
                    return (
                      <option key={w.id} value={w.id}>
                        {w.name}{w.assigned_user ? ` (${w.assigned_user.name}${roleLabel ? ' - ' + roleLabel : ''})` : ''}{w.is_main ? ` - ${t('stockTransfersNew.main')}` : ''}
                      </option>
                    );
                  })}
                </select>
                {toWarehouseId && !isDestCashvan && (
                  <div className="mt-2 p-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-200">
                      <span className="metric-dot metric-dot-red" aria-hidden />
                      <ExclamationTriangleIcon className="w-3.5 h-3.5 text-gray-400" />
                      {t('stockTransfersNew.notCashvanWarning', { role: destUser?.role === 'livreur' ? t('stockTransfersNew.deliveryDriver') : t('stockTransfersNew.user') })}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 ms-5">
                      {t('stockTransfersNew.transferOnlyCashvanHint')}
                    </p>
                  </div>
                )}
                {isDestCashvan && getDriverName(toWarehouseId) && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                    <span className="metric-dot metric-dot-green" aria-hidden />
                    {t('stockTransfersNew.driver')}: {getDriverName(toWarehouseId)}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stockTransfersNew.notes')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('stockTransfersNew.notesPlaceholder')}
                  className="input w-full text-[13px] py-2"
                />
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="surface-pro overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700" data-tour="nst-search">
              <div className="flex items-center gap-2">
                <h2 className="surface-heading">{t('stockTransfersNew.products')}</h2>
                <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">({items.length})</span>
              </div>
              <button
                onClick={toggleSearchMode}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {searchMode === 'barcode' ? (
                  <><MagnifyingGlassIcon className="w-3.5 h-3.5" /> {t('stockTransfersNew.searchByName')}</>
                ) : (
                  <><QrCodeIcon className="w-3.5 h-3.5" /> {t('stockTransfersNew.searchByBarcode')}</>
                )}
              </button>
            </div>

            {!fromWarehouseId && (
              <div className="mx-4 mt-3 p-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[12px] text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <span className="metric-dot metric-dot-orange" aria-hidden />
                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {t('stockTransfersNew.selectSourceFirst')}
              </div>
            )}

            {/* Search Input */}
            <div className="px-4 py-3">
              {searchMode === 'barcode' ? (
                <div className="relative">
                  <QrCodeIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeSubmit}
                    placeholder={t('stockTransfersNew.barcodePlaceholder')}
                    className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-[13px] py-2`}
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="relative">
                  <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                      setHighlightIndex(-1);
                    }}
                    onFocus={() => {
                      if (searchTerm) setShowDropdown(true);
                      setHighlightIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      const visible = filteredProducts.slice(0, 10);
                      const availableVisible = fromWarehouseId
                        ? visible.filter(p => getStock(p.id) > 0)
                        : visible;
                      const maxIndex = availableVisible.length - 1;

                      if (e.key === 'Escape') {
                        setShowDropdown(false);
                        setHighlightIndex(-1);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setShowDropdown(true);
                        const newIndex = Math.min(highlightIndex + 1, maxIndex);
                        setHighlightIndex(newIndex);
                        setTimeout(() => {
                          productListRef.current?.querySelector(`[data-index="${newIndex}"]`)?.scrollIntoView({ block: 'nearest' });
                        }, 0);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const newIndex = Math.max(highlightIndex - 1, 0);
                        setHighlightIndex(newIndex);
                        setTimeout(() => {
                          productListRef.current?.querySelector(`[data-index="${newIndex}"]`)?.scrollIntoView({ block: 'nearest' });
                        }, 0);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (highlightIndex >= 0 && availableVisible[highlightIndex]) {
                          addProduct(availableVisible[highlightIndex]);
                        } else if (availableVisible.length === 1) {
                          addProduct(availableVisible[0]);
                        }
                      }
                    }}
                    placeholder={t('stockTransfersNew.searchPlaceholder')}
                    className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-[13px] py-2`}
                    autoComplete="off"
                    autoFocus
                  />
                  {showDropdown && searchTerm && (
                    <div
                      ref={productListRef}
                      className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-gray-500 dark:text-gray-400 text-center text-[13px]">{t('stockTransfersNew.noResults')}</div>
                      ) : (
                        (() => {
                          let availableIndex = -1;
                          return filteredProducts.slice(0, 10).map((product) => {
                            const stock = getStock(product.id);
                            const isOutOfStock = fromWarehouseId ? stock <= 0 : false;
                            if (!isOutOfStock) availableIndex++;
                            const currentAvailableIndex = availableIndex;
                            const isHighlighted = !isOutOfStock && highlightIndex === currentAvailableIndex;
                            const alreadyAdded = items.some(item => item.product_id === product.id);
                            const ppp = product.pieces_per_package || 1;
                            return (
                              <button
                                key={product.id}
                                type="button"
                                data-index={isOutOfStock ? undefined : currentAvailableIndex}
                                onClick={() => !isOutOfStock && addProduct(product)}
                                disabled={isOutOfStock}
                                className={`w-full p-3 text-start border-b last:border-b-0 border-gray-100 dark:border-gray-700 ${
                                  isOutOfStock
                                    ? 'opacity-50 cursor-not-allowed'
                                    : isHighlighted
                                    ? 'bg-gray-100 dark:bg-gray-700'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="t-strong text-[13px]">{product.name}</span>
                                    {ppp > 1 && (
                                      <span className="text-[10px] text-gray-400 dark:text-gray-500 ms-2">({ppp} {t('stockTransfersNew.piecesPerCarton')})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {alreadyAdded && (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 dark:text-gray-300">
                                        <span className="metric-dot metric-dot-green" aria-hidden />
                                        {t('stockTransfersNew.added')}
                                      </span>
                                    )}
                                    {fromWarehouseId ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 dark:text-gray-300">
                                        <span className={`metric-dot ${isOutOfStock ? 'metric-dot-red' : 'metric-dot-green'}`} aria-hidden />
                                        {stock > 0 ? `${t('stockTransfersNew.inStock')}: ${fmtStock(stock, ppp)}` : t('stockTransfersNew.outOfStock')}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-gray-400 dark:text-gray-500">{product.unit?.name || ''}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                                  {product.barcode || product.sku || ''}
                                </div>
                              </button>
                            );
                          });
                        })()
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div data-tour="nst-items" className="table-pro-wrap">
              <table className="table-pro compact">
                <thead>
                  <tr>
                    <th className="text-center w-10">#</th>
                    <th>{t('stockTransfersNew.product')}</th>
                    <th className="text-center">{t('stockTransfersNew.cartonPiece')}</th>
                    <th className="text-center">{t('stockTransfersNew.unit')}</th>
                    <th className="text-center">{t('stockTransfersNew.count')}</th>
                    <th className="text-center">{t('stockTransfersNew.availableCol')}</th>
                    <th className="text-center">{t('stockTransfersNew.unitPrice')}</th>
                    <th className="text-center">{t('stockTransfersNew.amount')}</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <CubeIcon className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p className="text-[13px] font-medium">{t('stockTransfersNew.noProductsYet')}</p>
                        <p className="text-[11px] mt-1">
                          {searchMode === 'barcode' ? t('stockTransfersNew.scanOrTypeBarcode') : t('stockTransfersNew.searchByNameHint')}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const stock = getStock(item.product_id);
                      const overStock = !!fromWarehouseId && item.total_pieces > stock;
                      const ppp = item.pieces_per_package;
                      const hasPieces = ppp > 1;
                      return (
                        <tr key={item.product_id} className={overStock ? 'bg-red-50/40 dark:bg-red-900/10' : ''}>
                          <td className="text-center tnum text-gray-500">{index + 1}</td>
                          <td>
                            <div className="t-strong">{item.product.name}</div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{item.product.barcode || item.product.sku || ''}</div>
                          </td>
                          <td className="text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <div className="flex items-center gap-1">
                                <input
                                  ref={(el) => { inputRefs.current[`${index}-quantity`] = el; }}
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateCartons(index, Math.max(0, parseInt(e.target.value) || 0))}
                                  onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                                  onFocus={(e) => e.target.select()}
                                  className="input w-14 text-center !px-2 tnum text-[13px] py-1"
                                  min="0"
                                />
                                <span className="text-[10px] text-gray-500">crt</span>
                              </div>
                              {hasPieces && (
                                <div className="flex items-center gap-1">
                                  <input
                                    ref={(el) => { inputRefs.current[`${index}-extra_pieces`] = el; }}
                                    type="number"
                                    value={item.extra_pieces}
                                    onChange={(e) => updateExtraPieces(index, parseInt(e.target.value) || 0)}
                                    onKeyDown={(e) => handleKeyDown(e, index, 'extra_pieces')}
                                    onFocus={(e) => e.target.select()}
                                    className="input w-14 text-center !px-2 tnum text-[13px] py-1"
                                    min="0"
                                    max={ppp - 1}
                                  />
                                  <span className="text-[10px] text-gray-500">pc</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="tnum t-muted text-[12px]">{ppp}</div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500">{item.product.unit?.name || t('stockTransfersNew.unitDefault')}</div>
                          </td>
                          <td className="text-center">
                            <input
                              ref={(el) => { inputRefs.current[`${index}-total_pieces`] = el; }}
                              type="number"
                              value={item.total_pieces}
                              onChange={(e) => updateTotalPieces(index, Math.max(0, parseInt(e.target.value) || 0))}
                              onKeyDown={(e) => handleKeyDown(e, index, 'total_pieces')}
                              onFocus={(e) => e.target.select()}
                              className="input w-16 text-center !px-2 tnum text-[13px] py-1"
                              min="0"
                            />
                          </td>
                          <td className="text-center">
                            {fromWarehouseId ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 dark:text-gray-300">
                                <span className={`metric-dot ${overStock ? 'metric-dot-red' : 'metric-dot-green'}`} aria-hidden />
                                {fmtStock(stock, ppp)}
                              </span>
                            ) : <span className="t-muted">—</span>}
                            {overStock && (
                              <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold">{t('stockTransfersNew.exceeded')}</div>
                            )}
                          </td>
                          <td className="text-center tnum">
                            {item.unit_cost.toFixed(2)}
                          </td>
                          <td className="text-center tnum t-strong">
                            {item.subtotal.toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1.5 rounded text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {items.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-400 dark:text-gray-500">
                {t('stockTransfersNew.tipEnterNextField')}
              </div>
            )}
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1" data-tour="nst-summary">
          <div className="surface-pro p-4 sticky top-4">
            <h2 className="surface-heading mb-3">{t('stockTransfersNew.transferSummary')}</h2>

            <div className="space-y-2 mb-4 text-[13px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersNew.source')}</span>
                <span className="t-strong">
                  {fromWarehouseId ? warehouses.find(w => w.id === fromWarehouseId)?.name : <span className="t-muted">—</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersNew.destination')}</span>
                <span className="t-strong">
                  {toWarehouseId ? warehouses.find(w => w.id === toWarehouseId)?.name : <span className="t-muted">—</span>}
                </span>
              </div>
              {getDriverName(toWarehouseId) && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersNew.driver')}</span>
                  <span className="inline-flex items-center gap-1.5 t-strong">
                    <span className={`metric-dot ${isDestCashvan ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                    {getDriverName(toWarehouseId)}
                  </span>
                </div>
              )}
              {toWarehouseId && !isDestCashvan && (
                <div className="p-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[11px] text-gray-700 dark:text-gray-200">
                  {t('stockTransfersNew.notMobileSeller')}
                </div>
              )}

              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersNew.productCount')}</span>
                <span className="tnum t-strong">{items.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersNew.totalCartons')}</span>
                <span className="tnum t-strong">{getTotalCartons()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersNew.extraPieces')}</span>
                <span className="tnum t-strong">{getTotalExtraPieces()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersNew.totalPieces')}</span>
                <span className="tnum t-strong">{getTotalPieces()}</span>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between items-center text-[14px] font-semibold text-gray-900 dark:text-white">
                <span>{t('stockTransfersNew.totalValue')}</span>
                <span className="tnum">{formatCurrency(getTotalValue())}</span>
              </div>
            </div>

            {hasStockErrors() && (
              <div className="mb-3 p-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[12px] text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <span className="metric-dot metric-dot-red" aria-hidden />
                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {t('stockTransfersNew.someProductsExceedStock')}
              </div>
            )}

            {/* Status Flow */}
            <div className="mb-4 p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('stockTransfersNew.transferFlow')}</p>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                  <span className="metric-dot metric-dot-orange" aria-hidden />
                  1. {t('stockTransfersNew.flowRequest')}
                </span>
                <span className="text-gray-300 dark:text-gray-600">›</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                  <span className="metric-dot metric-dot-blue" aria-hidden />
                  2. {t('stockTransfersNew.flowLoading')}
                </span>
                <span className="text-gray-300 dark:text-gray-600">›</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                  <span className="metric-dot metric-dot-green" aria-hidden />
                  3. {t('stockTransfersNew.flowDeparture')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSubmit}
                disabled={isSaving || items.length === 0 || hasStockErrors() || (!!toWarehouseId && !isDestCashvan)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                {isSaving ? t('stockTransfersNew.saving') : t('stockTransfersNew.createTransfer')}
              </button>
              <button
                onClick={() => router.push('/dashboard/stock-transfers')}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('stockTransfersNew.cancel')}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 text-center">
              {t('stockTransfersNew.willBeCreatedAsPending')}
            </p>
          </div>
        </div>
      </div>

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={tourSteps}
          storageKey={storageKey}
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
