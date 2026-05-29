'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { stockTransfersApi, productsApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';

interface AssignedUser {
  id: number;
  name: string;
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

export default function EditStockTransferPage() {
  const router = useRouter();
  const params = useParams();
  const transferId = Number(params.id);
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [warehouses, setWarehouses] = useState<WarehouseWithUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<StockEntry[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searchMode, setSearchMode] = useState<'barcode' | 'name'>('barcode');
  const productListRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [fromWarehouseId, setFromWarehouseId] = useState<number | ''>('');
  const [toWarehouseId, setToWarehouseId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [reference, setReference] = useState('');

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

  const fetchInitialData = async () => {
    setIsLoadingData(true);
    try {
      const [warehousesRes, productsRes, transferRes] = await Promise.all([
        warehousesApi.getAll(),
        productsApi.getAll({ per_page: 1000 }),
        stockTransfersApi.getOne(transferId),
      ]);
      const whs = warehousesRes.data.data || warehousesRes.data;
      const prods = productsRes.data.data || productsRes.data;
      setWarehouses(whs);
      setProducts(prods);

      const transfer = transferRes.data;
      if (transfer.status !== 'pending') {
        toast.error(t('stockTransfersEdit.cannotEditApproved'));
        router.push('/dashboard/stock-transfers');
        return;
      }

      setReference(transfer.reference);
      setFromWarehouseId(transfer.from_warehouse_id);
      setToWarehouseId(transfer.to_warehouse_id);
      setNotes(transfer.notes || '');

      // Build items from transfer data (quantity is stored as total pieces)
      const loadedItems: TransferItem[] = (transfer.items || []).map((ti: { product_id: number; quantity: number; product?: Product }) => {
        const product = prods.find((p: Product) => p.id === ti.product_id) || ti.product;
        const ppp = product?.pieces_per_package || 1;
        const totalPieces = Math.round(Number(ti.quantity) || 0);
        const cartons = Math.floor(totalPieces / ppp);
        const extraPieces = totalPieces % ppp;
        const unitCost = Number(product?.cost_price) || 0;
        return {
          product_id: ti.product_id,
          product: product || { id: ti.product_id, name: t('stockTransfersEdit.unknown'), cost_price: 0 },
          quantity: cartons,
          extra_pieces: extraPieces,
          pieces_per_package: ppp,
          total_pieces: totalPieces,
          decimal_qty: cartons + extraPieces / ppp,
          unit_cost: unitCost,
          subtotal: unitCost * totalPieces,
        };
      });
      setItems(loadedItems);
    } catch {
      toast.error(t('stockTransfersEdit.errorLoadingData'));
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
      toast.error(`${product.name}: ${t('stockTransfersEdit.notAvailableInSource')}`);
      return;
    }
    const ppp = product.pieces_per_package || 1;
    const unitCost = Number(product.cost_price) || 0;
    const existingIndex = items.findIndex(item => item.product_id === product.id);
    if (existingIndex > -1) {
      const newItems = [...items];
      const item = newItems[existingIndex];
      item.quantity += qty;
      recalcItem(item);
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
  };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !barcodeInput.trim()) return;
    e.preventDefault();
    const product = products.find(p => p.barcode === barcodeInput.trim() || p.sku === barcodeInput.trim());
    if (product) addProduct(product);
    else toast.error(t('stockTransfersEdit.productNotFoundBarcode'));
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
      item.quantity += Math.floor(extra / ppp);
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
    setItems(newItems);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[rowIndex];
      const hasPieces = item && (item.pieces_per_package || 1) > 1;
      const fieldOrder = hasPieces ? ['quantity', 'extra_pieces', 'total_pieces'] : ['total_pieces'];
      const currentIdx = fieldOrder.indexOf(field);
      if (currentIdx < fieldOrder.length - 1) {
        const nextRef = inputRefs.current[`${rowIndex}-${fieldOrder[currentIdx + 1]}`];
        nextRef?.focus(); nextRef?.select();
      } else if (rowIndex < items.length - 1) {
        const nextRef = inputRefs.current[`${rowIndex + 1}-quantity`];
        nextRef?.focus(); nextRef?.select();
      }
    }
  }, [items]);

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
    if (cartons > 0 && pieces > 0) return `${cartons} ${t('stockTransfersEdit.carton')} ${pieces} ${t('stockTransfersEdit.piece')}`;
    if (cartons > 0) return `${cartons} ${t('stockTransfersEdit.carton')}`;
    if (pieces > 0) return `${pieces} ${t('stockTransfersEdit.piece')}`;
    return '0';
  };

  const hasStockErrors = () => {
    if (!fromWarehouseId) return false;
    return items.some(item => item.total_pieces > getStock(item.product_id));
  };

  const handleSubmit = async () => {
    if (!fromWarehouseId || !toWarehouseId) {
      toast.error(t('stockTransfersEdit.selectBothWarehouses'));
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      toast.error(t('stockTransfersEdit.warehousesMustDiffer'));
      return;
    }
    if (items.length === 0) {
      toast.error(t('stockTransfersEdit.addAtLeastOneProduct'));
      return;
    }

    setIsSaving(true);
    try {
      await stockTransfersApi.update(transferId, {
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        notes: notes || null,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.total_pieces,
        })),
      });
      toast.success(t('stockTransfersEdit.updateSuccess'));
      router.push('/dashboard/stock-transfers');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || t('stockTransfersEdit.updateError');
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

  if (isLoadingData) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <PageHeader
        title={t('stockTransfersEdit.editTransfer')}
        subtitle={reference ? `${t('stockTransfersEdit.reference')}: ${reference}` : undefined}
      >
        <button onClick={() => router.push('/dashboard/stock-transfers')} className="inline-flex items-center px-3 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">{t('stockTransfersEdit.back')}</button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Warehouses */}
          <div className="surface-pro p-4">
            <h2 className="surface-heading mb-3">{t('stockTransfersEdit.transferInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stockTransfersEdit.sourceWarehouse')} *</label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => { setFromWarehouseId(Number(e.target.value) || ''); }}
                  className="select"
                >
                  <option value="">{t('stockTransfersEdit.selectSourceWarehouse')}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.assigned_user ? ` (${w.assigned_user.name})` : ''}{w.is_main ? ` - ${t('stockTransfersEdit.main')}` : ''}
                    </option>
                  ))}
                </select>
                {loadingStock && <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">{t('stockTransfersEdit.loadingStock')}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stockTransfersEdit.destinationWarehouse')} *</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(Number(e.target.value) || '')}
                  className="select"
                >
                  <option value="">{t('stockTransfersEdit.selectDestWarehouse')}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.assigned_user ? ` (${w.assigned_user.name})` : ''}{w.is_main ? ` - ${t('stockTransfersEdit.main')}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stockTransfersEdit.notes')}</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('stockTransfersEdit.notesPlaceholder')} className="input" />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="surface-pro p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="surface-heading">{t('stockTransfersEdit.products')} ({items.length})</h2>
              <button onClick={toggleSearchMode} className="inline-flex items-center px-2.5 h-[30px] text-[12px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                {searchMode === 'barcode' ? t('stockTransfersEdit.searchByName') : t('stockTransfersEdit.searchByBarcode')}
              </button>
            </div>

            {searchMode === 'barcode' ? (
              <div className="mb-4">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeSubmit}
                  placeholder={t('stockTransfersEdit.barcodePlaceholder')}
                  className="input w-full"
                  autoComplete="off"
                />
              </div>
            ) : (
              <div className="relative mb-4">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); setHighlightIndex(-1); }}
                  onFocus={() => { if (searchTerm) setShowDropdown(true); }}
                  onKeyDown={(e) => {
                    const visible = filteredProducts.slice(0, 10);
                    const available = fromWarehouseId ? visible.filter(p => getStock(p.id) > 0) : visible;
                    if (e.key === 'Escape') { setShowDropdown(false); }
                    else if (e.key === 'ArrowDown') { e.preventDefault(); setShowDropdown(true); setHighlightIndex(Math.min(highlightIndex + 1, available.length - 1)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex(Math.max(highlightIndex - 1, 0)); }
                    else if (e.key === 'Enter') { e.preventDefault(); if (highlightIndex >= 0 && available[highlightIndex]) addProduct(available[highlightIndex]); else if (available.length === 1) addProduct(available[0]); }
                  }}
                  placeholder={t('stockTransfersEdit.searchPlaceholder')}
                  className="input w-full"
                  autoComplete="off"
                />
                {showDropdown && searchTerm && (
                  <div ref={productListRef} className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-gray-500 dark:text-gray-400 text-center">{t('stockTransfersEdit.noResults')}</div>
                    ) : (
                      (() => {
                        let availableIndex = -1;
                        return filteredProducts.slice(0, 10).map((product) => {
                          const stock = getStock(product.id);
                          const isOutOfStock = fromWarehouseId ? stock <= 0 : false;
                          if (!isOutOfStock) availableIndex++;
                          const isHighlighted = !isOutOfStock && highlightIndex === availableIndex;
                          const alreadyAdded = items.some(item => item.product_id === product.id);
                          return (
                            <button key={product.id} type="button" onClick={() => !isOutOfStock && addProduct(product)} disabled={isOutOfStock}
                              className={`w-full p-3 text-start border-b last:border-b-0 border-gray-200 dark:border-gray-700 ${isOutOfStock ? 'bg-red-50 dark:bg-red-900/20 opacity-50 cursor-not-allowed' : isHighlighted ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                                <div className="flex items-center gap-2">
                                  {alreadyAdded && <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">{t('stockTransfersEdit.added')}</span>}
                                  {fromWarehouseId ? (
                                    <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                      {stock > 0 ? `${t('stockTransfersEdit.available')}: ${fmtStock(stock, product.pieces_per_package || 1)}` : t('stockTransfersEdit.outOfStock')}
                                    </span>
                                  ) : <span className="text-sm text-gray-500 dark:text-gray-400">{product.unit?.name || ''}</span>}
                                </div>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{product.barcode || product.sku || ''}</div>
                            </button>
                          );
                        });
                      })()
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            <div className="table-pro-wrap">
              <table className="table-pro compact">
                <thead>
                  <tr>
                    <th className="text-center w-12">{t('stockTransfersEdit.colNum')}</th>
                    <th>{t('stockTransfersEdit.colDesignation')}</th>
                    <th className="text-center w-28">{t('stockTransfersEdit.colCartonPiece')}</th>
                    <th className="text-center w-16">{t('stockTransfersEdit.colUnit')}</th>
                    <th className="text-center w-20">{t('stockTransfersEdit.colCount')}</th>
                    <th className="text-center w-20">{t('stockTransfersEdit.colAvailable')}</th>
                    <th className="tnum w-24">{t('stockTransfersEdit.colUnitPrice')}</th>
                    <th className="tnum w-24">{t('stockTransfersEdit.colAmount')}</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={9} className="t-empty text-center py-8">{t('stockTransfersEdit.noProducts')}</td></tr>
                  ) : (
                    items.map((item, index) => {
                      const stock = getStock(item.product_id);
                      const overStock = fromWarehouseId && item.total_pieces > stock;
                      const ppp = item.pieces_per_package;
                      const hasPieces = ppp > 1;
                      return (
                        <tr key={item.product_id} className={overStock ? 'bg-red-50/40 dark:bg-red-900/10' : ''}>
                          <td className="text-center text-[12px] text-gray-500 dark:text-gray-400 tnum">{index + 1}</td>
                          <td>
                            <div className="text-[13px] font-medium text-gray-900 dark:text-white">{item.product.name}</div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">{item.product.barcode || item.product.sku || ''}</div>
                          </td>
                          <td>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => updateCartons(index, Math.max(0, item.quantity - 1))} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium">-</button>
                                <input ref={(el) => { inputRefs.current[`${index}-quantity`] = el; }} type="number" value={item.quantity} onChange={(e) => updateCartons(index, Math.max(0, parseInt(e.target.value) || 0))} onKeyDown={(e) => handleKeyDown(e, index, 'quantity')} onFocus={(e) => e.target.select()} className="input w-12 text-center text-sm py-0.5" min="0" />
                                <button type="button" onClick={() => updateCartons(index, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium">+</button>
                              </div>
                              {hasPieces && (
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => updateExtraPieces(index, Math.max(0, item.extra_pieces - 1))} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium">-</button>
                                  <input ref={(el) => { inputRefs.current[`${index}-extra_pieces`] = el; }} type="number" value={item.extra_pieces} onChange={(e) => updateExtraPieces(index, parseInt(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, index, 'extra_pieces')} onFocus={(e) => e.target.select()} className="input w-12 text-center text-sm py-0.5" min="0" max={ppp - 1} />
                                  <button type="button" onClick={() => updateExtraPieces(index, item.extra_pieces + 1)} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium">+</button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-center text-[13px] tnum">{ppp}</td>
                          <td className="text-center">
                            <input ref={(el) => { inputRefs.current[`${index}-total_pieces`] = el; }} type="number" value={item.total_pieces} onChange={(e) => updateTotalPieces(index, Math.max(0, parseInt(e.target.value) || 0))} onKeyDown={(e) => handleKeyDown(e, index, 'total_pieces')} onFocus={(e) => e.target.select()} className="input w-16 text-center text-sm py-0.5 font-medium" min="0" />
                          </td>
                          <td className="text-center">
                            {fromWarehouseId ? (
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-700 dark:text-gray-300">
                                <span className={`metric-dot ${overStock ? 'metric-dot-red' : 'metric-dot-green'}`} aria-hidden />
                                {fmtStock(stock, ppp)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="tnum">{item.unit_cost.toFixed(2)}</td>
                          <td className="tnum t-strong">{item.subtotal.toFixed(2)}</td>
                          <td>
                            <button type="button" onClick={() => removeItem(index)} className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="surface-pro p-4 sticky top-4">
            <h2 className="surface-heading mb-3">{t('stockTransfersEdit.transferSummary')}</h2>
            <div className="space-y-2 mb-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersEdit.source')}:</span>
                <span className="t-strong">{fromWarehouseId ? warehouses.find(w => w.id === fromWarehouseId)?.name : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersEdit.destination')}:</span>
                <span className="t-strong">{toWarehouseId ? warehouses.find(w => w.id === toWarehouseId)?.name : '-'}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersEdit.productCount')}:</span>
                <span className="t-strong tnum">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersEdit.totalCartons')}:</span>
                <span className="t-strong tnum">{getTotalCartons()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersEdit.extraPieces')}:</span>
                <span className="t-strong tnum">{getTotalExtraPieces()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('stockTransfersEdit.totalPieces')}:</span>
                <span className="t-strong tnum">{getTotalPieces()}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-[14px]">
                <span className="font-medium text-gray-900 dark:text-white">{t('stockTransfersEdit.totalValue')}:</span>
                <span className="font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(getTotalValue())}</span>
              </div>
            </div>

            {hasStockErrors() && (
              <div className="mb-3 text-[13px] inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <span className="metric-dot metric-dot-red" aria-hidden />
                {t('stockTransfersEdit.stockExceeded')}
              </div>
            )}

            <div className="space-y-2">
              <button onClick={handleSubmit} disabled={isSaving || items.length === 0 || hasStockErrors()} className="w-full inline-flex items-center justify-center px-4 h-[36px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50">
                {isSaving ? t('stockTransfersEdit.saving') : t('stockTransfersEdit.saveChanges')}
              </button>
              <button onClick={() => router.push('/dashboard/stock-transfers')} className="w-full inline-flex items-center justify-center px-4 h-[36px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">{t('stockTransfersEdit.cancel')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
