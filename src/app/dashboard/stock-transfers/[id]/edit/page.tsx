'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { stockTransfersApi, productsApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';

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
        toast.error('لا يمكن تعديل تحويل تمت الموافقة عليه');
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
          product: product || { id: ti.product_id, name: 'غير معروف', cost_price: 0 },
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
      toast.error('خطأ في تحميل البيانات');
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
      toast.error(`${product.name}: غير متوفر في المخزن المصدر`);
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
    else toast.error('منتج غير موجود بهذا الباركود');
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
    new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);

  const fmtStock = (totalPieces: number, ppp: number): string => {
    if (!ppp || ppp <= 1) return Math.round(totalPieces).toString();
    const cartons = Math.floor(totalPieces / ppp);
    const pieces = totalPieces % ppp;
    if (cartons > 0 && pieces > 0) return `${cartons} كرتون ${pieces} قطعة`;
    if (cartons > 0) return `${cartons} كرتون`;
    if (pieces > 0) return `${pieces} قطعة`;
    return '0';
  };

  const hasStockErrors = () => {
    if (!fromWarehouseId) return false;
    return items.some(item => item.total_pieces > getStock(item.product_id));
  };

  const handleSubmit = async () => {
    if (!fromWarehouseId || !toWarehouseId) {
      toast.error('يرجى اختيار المستودعين');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      toast.error('المستودع المصدر والوجهة يجب أن يكونا مختلفين');
      return;
    }
    if (items.length === 0) {
      toast.error('يرجى إضافة منتج واحد على الأقل');
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
      toast.success('تم تحديث التحويل بنجاح');
      router.push('/dashboard/stock-transfers');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'خطأ في تحديث التحويل';
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">تعديل التحويل</h1>
          {reference && <p className="text-sm text-gray-500 mt-1">المرجع: {reference}</p>}
        </div>
        <button onClick={() => router.push('/dashboard/stock-transfers')} className="btn btn-secondary">رجوع</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Warehouses */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">معلومات التحويل</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">المستودع المصدر *</label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => { setFromWarehouseId(Number(e.target.value) || ''); }}
                  className="select"
                >
                  <option value="">اختر المستودع المصدر</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.assigned_user ? ` (${w.assigned_user.name})` : ''}{w.is_main ? ' - رئيسي' : ''}
                    </option>
                  ))}
                </select>
                {loadingStock && <p className="text-xs text-blue-500 mt-1">جاري تحميل المخزون...</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المستودع الوجهة *</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(Number(e.target.value) || '')}
                  className="select"
                >
                  <option value="">اختر المستودع الوجهة</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.assigned_user ? ` (${w.assigned_user.name})` : ''}{w.is_main ? ' - رئيسي' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." className="input" />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">المنتجات ({items.length})</h2>
              <button onClick={toggleSearchMode} className="btn btn-sm btn-outline">
                {searchMode === 'barcode' ? 'البحث بالاسم' : 'البحث بالباركود'}
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
                  placeholder="امسح الباركود أو اكتب الرمز ثم Enter..."
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
                  placeholder="ابحث عن منتج بالاسم أو الباركود..."
                  className="input w-full"
                  autoComplete="off"
                />
                {showDropdown && searchTerm && (
                  <div ref={productListRef} className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">لا توجد نتائج</div>
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
                              className={`w-full p-3 text-right border-b last:border-b-0 dark:border-gray-700 ${isOutOfStock ? 'bg-red-50 opacity-50 cursor-not-allowed' : isHighlighted ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{product.name}</span>
                                <div className="flex items-center gap-2">
                                  {alreadyAdded && <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">مضاف</span>}
                                  {fromWarehouseId ? (
                                    <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                      {stock > 0 ? `متوفر: ${fmtStock(stock, product.pieces_per_package || 1)}` : 'غير متوفر'}
                                    </span>
                                  ) : <span className="text-sm text-gray-500">{product.unit?.name || ''}</span>}
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">{product.barcode || product.sku || ''}</div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-2 text-center w-12">الرقم</th>
                    <th className="px-2 py-2 text-right">التعيين</th>
                    <th className="px-2 py-2 text-center w-28">كرتون/قطعة</th>
                    <th className="px-2 py-2 text-center w-16">الوحدة</th>
                    <th className="px-2 py-2 text-center w-20">العدد</th>
                    <th className="px-2 py-2 text-center w-20">المتوفر</th>
                    <th className="px-2 py-2 text-center w-24">س. الوحدة</th>
                    <th className="px-2 py-2 text-center w-24">المبلغ</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-500">لم تتم إضافة أي منتجات</td></tr>
                  ) : (
                    items.map((item, index) => {
                      const stock = getStock(item.product_id);
                      const overStock = fromWarehouseId && item.total_pieces > stock;
                      const ppp = item.pieces_per_package;
                      const hasPieces = ppp > 1;
                      return (
                        <tr key={item.product_id} className={`border-b hover:bg-gray-50 ${overStock ? 'bg-red-50' : ''}`}>
                          <td className="px-2 py-2 text-center font-medium text-gray-500">{index + 1}</td>
                          <td className="px-2 py-2">
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-xs text-gray-500">{item.product.barcode || item.product.sku || ''}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => updateCartons(index, Math.max(0, item.quantity - 1))} className="w-6 h-6 flex items-center justify-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold">-</button>
                                <input ref={(el) => { inputRefs.current[`${index}-quantity`] = el; }} type="number" value={item.quantity} onChange={(e) => updateCartons(index, Math.max(0, parseInt(e.target.value) || 0))} onKeyDown={(e) => handleKeyDown(e, index, 'quantity')} onFocus={(e) => e.target.select()} className="input w-12 text-center text-sm py-0.5 border-blue-300" min="0" />
                                <button type="button" onClick={() => updateCartons(index, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold">+</button>
                              </div>
                              {hasPieces && (
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => updateExtraPieces(index, Math.max(0, item.extra_pieces - 1))} className="w-6 h-6 flex items-center justify-center rounded border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold">-</button>
                                  <input ref={(el) => { inputRefs.current[`${index}-extra_pieces`] = el; }} type="number" value={item.extra_pieces} onChange={(e) => updateExtraPieces(index, parseInt(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, index, 'extra_pieces')} onFocus={(e) => e.target.select()} className="input w-12 text-center text-sm py-0.5 border-orange-300" min="0" max={ppp - 1} />
                                  <button type="button" onClick={() => updateExtraPieces(index, item.extra_pieces + 1)} className="w-6 h-6 flex items-center justify-center rounded border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold">+</button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-sm">
                            <div className="text-blue-600 font-medium">{ppp}</div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input ref={(el) => { inputRefs.current[`${index}-total_pieces`] = el; }} type="number" value={item.total_pieces} onChange={(e) => updateTotalPieces(index, Math.max(0, parseInt(e.target.value) || 0))} onKeyDown={(e) => handleKeyDown(e, index, 'total_pieces')} onFocus={(e) => e.target.select()} className="input w-16 text-center text-sm py-0.5 font-medium" min="0" />
                          </td>
                          <td className="px-2 py-2 text-center">
                            {fromWarehouseId ? (
                              <span className={`font-bold text-sm ${overStock ? 'text-red-600' : 'text-green-600'}`}>{fmtStock(stock, ppp)}</span>
                            ) : '-'}
                          </td>
                          <td className="px-2 py-2 text-center text-sm font-medium">{item.unit_cost.toFixed(2)}</td>
                          <td className="px-2 py-2 text-center text-sm font-bold text-green-700">{item.subtotal.toFixed(2)}</td>
                          <td className="px-2 py-2">
                            <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800 p-1">
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
          <div className="card sticky top-4">
            <h2 className="text-lg font-semibold mb-4">ملخص التحويل</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">المصدر:</span>
                <span className="font-medium">{fromWarehouseId ? warehouses.find(w => w.id === fromWarehouseId)?.name : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الوجهة:</span>
                <span className="font-medium">{toWarehouseId ? warehouses.find(w => w.id === toWarehouseId)?.name : '-'}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-600">عدد المنتجات:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">إجمالي الكراتين:</span>
                <span className="font-bold text-blue-600">{getTotalCartons()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">قطع إضافية:</span>
                <span className="font-bold text-orange-600">{getTotalExtraPieces()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">إجمالي القطع:</span>
                <span className="font-bold">{getTotalPieces()}</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">القيمة الإجمالية:</span>
                <span className="font-bold text-green-700">{formatCurrency(getTotalValue())}</span>
              </div>
            </div>

            {hasStockErrors() && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                بعض المنتجات تتجاوز الكمية المتوفرة
              </div>
            )}

            <div className="space-y-3">
              <button onClick={handleSubmit} disabled={isSaving || items.length === 0 || hasStockErrors()} className="btn btn-primary w-full">
                {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button onClick={() => router.push('/dashboard/stock-transfers')} className="btn btn-secondary w-full">إلغاء</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
