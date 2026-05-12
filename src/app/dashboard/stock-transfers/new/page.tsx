'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { stockTransfersApi, productsApi, warehousesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
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
    {
      target: '[data-tour="nst-title"]',
      title: t('stockTransfersNew.tourTitle1'),
      desc: t('stockTransfersNew.tourDesc1'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="nst-warehouses"]',
      title: t('stockTransfersNew.tourTitle2'),
      desc: t('stockTransfersNew.tourDesc2'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="nst-search"]',
      title: t('stockTransfersNew.tourTitle3'),
      desc: t('stockTransfersNew.tourDesc3'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="nst-items"]',
      title: t('stockTransfersNew.tourTitle4'),
      desc: t('stockTransfersNew.tourDesc4'),
      position: 'top' as const,
    },
    {
      target: '[data-tour="nst-summary"]',
      title: t('stockTransfersNew.tourTitle5'),
      desc: t('stockTransfersNew.tourDesc5'),
      position: 'right' as const,
    },
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="nst-title">
        <div>
          <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('stockTransfersNew.pageTitle')}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('stockTransfersNew.pageSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { localStorage.removeItem(storageKey); setShowTour(true); }}
            className="text-sm font-medium text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
            title={t('stockTransfersNew.tourBtn')}
          >
            {t('stockTransfersNew.tourBtn')}
          </button>
          <button
            onClick={() => router.push('/dashboard/stock-transfers')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeftIcon className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('stockTransfersNew.back')}
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1.5"><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono text-[10px]">F2</kbd> {t('stockTransfersNew.searchProduct')}</span>
        <span className="flex items-center gap-1.5"><kbd className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono text-[10px]">Enter</kbd> {t('stockTransfersNew.navigateFields')}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Warehouse Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5" data-tour="nst-warehouses">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <BuildingStorefrontIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{t('stockTransfersNew.transferInfo')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{t('stockTransfersNew.sourceWarehouse')} *</label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => {
                    setFromWarehouseId(Number(e.target.value) || '');
                    setItems([]);
                  }}
                  className="select w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="">{t('stockTransfersNew.selectSource')}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.assigned_user ? ` (${w.assigned_user.name})` : ''}{w.is_main ? ` - ${t('stockTransfersNew.main')}` : ''}
                    </option>
                  ))}
                </select>
                {loadingStock && (
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1">
                    <ArrowPathIcon className="w-3 h-3 animate-spin" />
                    {t('stockTransfersNew.loadingStock')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{t('stockTransfersNew.destWarehouse')} *</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(Number(e.target.value) || '')}
                  className={`select w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${toWarehouseId && !isDestCashvan ? 'border-red-400 ring-1 ring-red-200 dark:border-red-500 dark:ring-red-500/30' : ''}`}
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
                  <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-red-700 dark:text-red-400">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {t('stockTransfersNew.notCashvanWarning', { role: destUser?.role === 'livreur' ? t('stockTransfersNew.deliveryDriver') : t('stockTransfersNew.user') })}
                    </div>
                    <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 ms-5.5">
                      {t('stockTransfersNew.transferOnlyCashvanHint')}
                    </p>
                  </div>
                )}
                {isDestCashvan && getDriverName(toWarehouseId) && (
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-1 flex items-center gap-1">
                    <TruckIcon className="w-3 h-3" />
                    {t('stockTransfersNew.driver')}: {getDriverName(toWarehouseId)}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{t('stockTransfersNew.notes')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('stockTransfersNew.notesPlaceholder')}
                  className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700" data-tour="nst-search">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
                  <CubeIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{t('stockTransfersNew.products')} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({items.length})</span></h2>
              </div>
              <button
                onClick={toggleSearchMode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {searchMode === 'barcode' ? (
                  <><MagnifyingGlassIcon className="w-3.5 h-3.5" /> {t('stockTransfersNew.searchByName')}</>
                ) : (
                  <><QrCodeIcon className="w-3.5 h-3.5" /> {t('stockTransfersNew.searchByBarcode')}</>
                )}
              </button>
            </div>

            {!fromWarehouseId && (
              <div className="mx-5 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                {t('stockTransfersNew.selectSourceFirst')}
              </div>
            )}

            {/* Search Input */}
            <div className="px-5 py-3">
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
                    className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500`}
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
                    className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500`}
                    autoComplete="off"
                    autoFocus
                  />
                  {showDropdown && searchTerm && (
                    <div
                      ref={productListRef}
                      className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                    >
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-gray-500 dark:text-gray-400 text-center text-sm">{t('stockTransfersNew.noResults')}</div>
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
                                    ? 'bg-red-50/50 dark:bg-red-900/10 opacity-50 cursor-not-allowed'
                                    : isHighlighted
                                    ? 'bg-teal-50 dark:bg-teal-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-100">{product.name}</span>
                                    {ppp > 1 && (
                                      <span className="text-[10px] text-gray-400 dark:text-gray-500 ms-2">({ppp} {t('stockTransfersNew.piecesPerCarton')})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {alreadyAdded && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded font-bold">{t('stockTransfersNew.added')}</span>
                                    )}
                                    {fromWarehouseId ? (
                                      <span className={`text-xs font-bold ${isOutOfStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {stock > 0 ? `${t('stockTransfersNew.inStock')}: ${fmtStock(stock, ppp)}` : t('stockTransfersNew.outOfStock')}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400 dark:text-gray-500">{product.unit?.name || ''}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
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
            <div className="overflow-x-auto" data-tour="nst-items">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-700/50 border-y border-gray-100 dark:border-gray-700">
                    <th className="px-3 py-2.5 text-center w-10 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-3 py-2.5 text-start text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('stockTransfersNew.product')}</th>
                    <th className="px-3 py-2.5 text-center w-28 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('stockTransfersNew.cartonPiece')}</th>
                    <th className="px-3 py-2.5 text-center w-14 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('stockTransfersNew.unit')}</th>
                    <th className="px-3 py-2.5 text-center w-20 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('stockTransfersNew.count')}</th>
                    <th className="px-3 py-2.5 text-center w-20 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('stockTransfersNew.availableCol')}</th>
                    <th className="px-3 py-2.5 text-center w-20 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('stockTransfersNew.unitPrice')}</th>
                    <th className="px-3 py-2.5 text-center w-24 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('stockTransfersNew.amount')}</th>
                    <th className="px-3 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400 dark:text-gray-500">
                        <CubeIcon className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm font-medium">{t('stockTransfersNew.noProductsYet')}</p>
                        <p className="text-xs mt-1">
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
                        <tr key={item.product_id} className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 ${overStock ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                          <td className="px-3 py-2.5 text-center text-xs font-medium text-gray-400 dark:text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-sm text-gray-800 dark:text-gray-100">{item.product.name}</div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500">{item.product.barcode || item.product.sku || ''}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="space-y-1">
                              {/* Cartons row - blue */}
                              <div className="flex items-center gap-1 justify-center">
                                <button
                                  type="button"
                                  onClick={() => updateCartons(index, Math.max(0, item.quantity - 1))}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                  <MinusIcon className="w-3 h-3" />
                                </button>
                                <input
                                  ref={(el) => { inputRefs.current[`${index}-quantity`] = el; }}
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateCartons(index, Math.max(0, parseInt(e.target.value) || 0))}
                                  onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                                  onFocus={(e) => e.target.select()}
                                  className="input w-12 text-center text-sm py-0.5 border-blue-300 dark:border-blue-600 font-bold text-blue-700 dark:text-blue-400 dark:bg-gray-700"
                                  min="0"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateCartons(index, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                  <PlusIcon className="w-3 h-3" />
                                </button>
                              </div>
                              {/* Pieces row - orange */}
                              {hasPieces && (
                                <div className="flex items-center gap-1 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => updateExtraPieces(index, Math.max(0, item.extra_pieces - 1))}
                                    className="w-6 h-6 flex items-center justify-center rounded-lg border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                                  >
                                    <MinusIcon className="w-3 h-3" />
                                  </button>
                                  <input
                                    ref={(el) => { inputRefs.current[`${index}-extra_pieces`] = el; }}
                                    type="number"
                                    value={item.extra_pieces}
                                    onChange={(e) => updateExtraPieces(index, parseInt(e.target.value) || 0)}
                                    onKeyDown={(e) => handleKeyDown(e, index, 'extra_pieces')}
                                    onFocus={(e) => e.target.select()}
                                    className="input w-12 text-center text-sm py-0.5 border-orange-300 dark:border-orange-600 font-bold text-orange-700 dark:text-orange-400 dark:bg-gray-700"
                                    min="0"
                                    max={ppp - 1}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateExtraPieces(index, item.extra_pieces + 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-lg border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                                  >
                                    <PlusIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{ppp}</div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500">{item.product.unit?.name || t('stockTransfersNew.unitDefault')}</div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              ref={(el) => { inputRefs.current[`${index}-total_pieces`] = el; }}
                              type="number"
                              value={item.total_pieces}
                              onChange={(e) => updateTotalPieces(index, Math.max(0, parseInt(e.target.value) || 0))}
                              onKeyDown={(e) => handleKeyDown(e, index, 'total_pieces')}
                              onFocus={(e) => e.target.select()}
                              className="input w-16 text-center text-sm py-0.5 font-bold dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                              min="0"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {fromWarehouseId ? (
                              <span className={`text-xs font-bold ${overStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {fmtStock(stock, ppp)}
                              </span>
                            ) : <span className="text-gray-300 dark:text-gray-600">-</span>}
                            {overStock && (
                              <div className="text-[10px] text-red-600 dark:text-red-400 font-bold">{t('stockTransfersNew.exceeded')}</div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                            {item.unit_cost.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-center text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            {item.subtotal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
              <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400 dark:text-gray-500">
                {t('stockTransfersNew.tipEnterNextField')}
              </div>
            )}
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1" data-tour="nst-summary">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5 sticky top-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <DocumentTextIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{t('stockTransfersNew.transferSummary')}</h2>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 dark:text-gray-500">{t('stockTransfersNew.source')}:</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {fromWarehouseId ? warehouses.find(w => w.id === fromWarehouseId)?.name : <span className="text-gray-300 dark:text-gray-600">-</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 dark:text-gray-500">{t('stockTransfersNew.destination')}:</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {toWarehouseId ? warehouses.find(w => w.id === toWarehouseId)?.name : <span className="text-gray-300 dark:text-gray-600">-</span>}
                </span>
              </div>
              {getDriverName(toWarehouseId) && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{t('stockTransfersNew.driver')}:</span>
                  <span className={`text-sm font-bold ${isDestCashvan ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>{getDriverName(toWarehouseId)}</span>
                </div>
              )}
              {toWarehouseId && !isDestCashvan && (
                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-[10px] text-red-700 dark:text-red-400 font-medium">
                  {t('stockTransfersNew.notMobileSeller')}
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{t('stockTransfersNew.productCount')}:</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{items.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{t('stockTransfersNew.totalCartons')}:</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums">{getTotalCartons()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{t('stockTransfersNew.extraPieces')}:</span>
                  <span className="text-sm font-black text-orange-600 dark:text-orange-400 tabular-nums">{getTotalExtraPieces()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{t('stockTransfersNew.totalPieces')}:</span>
                  <span className="text-sm font-black text-gray-800 dark:text-gray-100 tabular-nums">{getTotalPieces()}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{t('stockTransfersNew.totalValue')}:</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(getTotalValue())}</span>
                </div>
              </div>
            </div>

            {hasStockErrors() && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                {t('stockTransfersNew.someProductsExceedStock')}
              </div>
            )}

            {/* Status Flow */}
            <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('stockTransfersNew.transferFlow')}:</p>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-lg font-bold">1. {t('stockTransfersNew.flowRequest')}</span>
                <ChevronLeftIcon className={`w-3 h-3 text-gray-300 dark:text-gray-600 ${isRTL ? '' : 'rotate-180'}`} />
                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg font-bold">2. {t('stockTransfersNew.flowLoading')}</span>
                <ChevronLeftIcon className={`w-3 h-3 text-gray-300 dark:text-gray-600 ${isRTL ? '' : 'rotate-180'}`} />
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-lg font-bold">3. {t('stockTransfersNew.flowDeparture')}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleSubmit}
                disabled={isSaving || items.length === 0 || hasStockErrors() || (!!toWarehouseId && !isDestCashvan)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-l from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5" />
                )}
                {isSaving ? t('stockTransfersNew.saving') : t('stockTransfersNew.createTransfer')}
              </button>
              <button
                onClick={() => router.push('/dashboard/stock-transfers')}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
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
