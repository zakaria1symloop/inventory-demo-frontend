'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  quantity: number;       // cartons
  extra_pieces: number;   // extra pieces (0 to ppp-1)
  pieces_per_package: number;
  total_pieces: number;   // total pieces = quantity * ppp + extra_pieces
  decimal_qty: number;    // quantity to send to API = cartons + extra_pieces/ppp
  unit_cost: number;      // cost per piece
  subtotal: number;       // unit_cost × total_pieces
}

export default function NewStockTransferPage() {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [warehouses, setWarehouses] = useState<WarehouseWithUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<StockEntry[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

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

  useEffect(() => {
    fetchInitialData();
    const saved = localStorage.getItem('transferSearchMode');
    if (saved === 'barcode' || saved === 'name') setSearchMode(saved);
  }, []);

  // Fetch warehouse stock when source warehouse changes
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

  // Global keyboard shortcuts
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
      item.total_pieces = item.quantity * item.pieces_per_package + item.extra_pieces;
      item.decimal_qty = item.quantity + item.extra_pieces / item.pieces_per_package;
      item.subtotal = item.unit_cost * item.total_pieces;
      // Move to top
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
      toast.error('منتج غير موجود بهذا الباركود');
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
    const item = newItems[index];
    item.quantity = cartons;
    recalcItem(item);
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
    if (fromWarehouseId && item.decimal_qty > stock) {
      toast.error(`${item.product.name}: المتوفر ${fmtStock(stock, ppp)} فقط`);
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Keyboard navigation in table
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

  const getTotalPieces = () => {
    return items.reduce((sum, item) => sum + item.total_pieces, 0);
  };

  const getTotalCartons = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalExtraPieces = () => {
    return items.reduce((sum, item) => sum + item.extra_pieces, 0);
  };

  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const fmtStock = (qty: number, ppp: number): string => {
    if (!ppp || ppp <= 1) return Math.round(qty).toString();
    const cartons = Math.floor(qty);
    const pieces = Math.round((qty - cartons) * ppp);
    if (cartons > 0 && pieces > 0) return `${cartons} كرتون ${pieces} قطعة`;
    if (cartons > 0) return `${cartons} كرتون`;
    if (pieces > 0) return `${pieces} قطعة`;
    return '0';
  };

  const hasStockErrors = () => {
    if (!fromWarehouseId) return false;
    return items.some(item => item.decimal_qty > getStock(item.product_id));
  };

  const handleSubmit = async () => {
    if (!fromWarehouseId) {
      toast.error('يرجى اختيار المستودع المصدر');
      return;
    }
    if (!toWarehouseId) {
      toast.error('يرجى اختيار المستودع الوجهة');
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
    const errors: string[] = [];
    for (const item of items) {
      const available = getStock(item.product_id);
      if (item.decimal_qty > available) {
        errors.push(`${item.product.name}: المطلوب ${fmtStock(item.decimal_qty, item.pieces_per_package)}، المتوفر ${fmtStock(available, item.pieces_per_package)}`);
      }
    }
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return;
    }

    setIsSaving(true);
    try {
      await stockTransfersApi.create({
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        notes: notes || null,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.decimal_qty,
        }))
      });
      toast.success('تم إنشاء طلب التحويل بنجاح');
      router.push('/dashboard/stock-transfers');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'خطأ في إنشاء التحويل';
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

  // Get driver name for selected destination warehouse
  const getDriverName = (whId: number | ''): string => {
    if (!whId) return '';
    const wh = warehouses.find(w => w.id === whId);
    return wh?.assigned_user?.name || '';
  };

  if (isLoadingData) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-4 flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">F2</kbd> بحث منتج</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Enter</kbd> تنقل بين الحقول</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">تحويل مخزون جديد</h1>
        <button onClick={() => router.push('/dashboard/stock-transfers')} className="btn btn-secondary">
          رجوع
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">معلومات التحويل</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">المستودع المصدر *</label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => {
                    setFromWarehouseId(Number(e.target.value) || '');
                    setItems([]);
                  }}
                  className="select"
                >
                  <option value="">اختر المستودع المصدر</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.assigned_user ? ` (${w.assigned_user.name})` : ''}{w.is_main ? ' - رئيسي' : ''}
                    </option>
                  ))}
                </select>
                {loadingStock && (
                  <p className="text-xs text-blue-500 mt-1">جاري تحميل المخزون...</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المستودع الوجهة (مستودع السائق) *</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(Number(e.target.value) || '')}
                  className="select"
                >
                  <option value="">اختر مستودع السائق</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.assigned_user ? ` (${w.assigned_user.name})` : ''}{w.is_main ? ' - رئيسي' : ''}
                    </option>
                  ))}
                </select>
                {getDriverName(toWarehouseId) && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    السائق: {getDriverName(toWarehouseId)}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Products Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">المنتجات ({items.length})</h2>
              <button onClick={toggleSearchMode} className="btn btn-sm btn-outline">
                {searchMode === 'barcode' ? 'البحث بالاسم' : 'البحث بالباركود'}
              </button>
            </div>

            {!fromWarehouseId && (
              <div className="p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
                اختر المستودع المصدر أولاً لعرض المخزون المتوفر
              </div>
            )}

            {/* Search Input - Barcode Mode */}
            {searchMode === 'barcode' ? (
              <div className="mb-4">
                <div className="relative">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeSubmit}
                    placeholder="امسح الباركود أو اكتب الرمز ثم Enter..."
                    className="input w-full pr-10"
                    autoComplete="off"
                    autoFocus
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              /* Search Input - Name Mode */
              <div className="relative mb-4">
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
                  placeholder="ابحث عن منتج بالاسم أو الباركود..."
                  className="input w-full"
                  autoComplete="off"
                  autoFocus
                />
                {showDropdown && searchTerm && (
                  <div
                    ref={productListRef}
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">لا توجد نتائج</div>
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
                              className={`w-full p-3 text-right border-b last:border-b-0 dark:border-gray-700 ${
                                isOutOfStock
                                  ? 'bg-red-50 dark:bg-red-900/10 opacity-50 cursor-not-allowed'
                                  : isHighlighted
                                  ? 'bg-blue-100 dark:bg-blue-900/40'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{product.name}</span>
                                  {ppp > 1 && (
                                    <span className="text-xs text-gray-500 mr-2">({ppp} قطعة/كرتون)</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {alreadyAdded && (
                                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">مضاف</span>
                                  )}
                                  {fromWarehouseId ? (
                                    <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                      {stock > 0 ? `متوفر: ${fmtStock(stock, product.pieces_per_package || 1)}` : 'غير متوفر'}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-500">{product.unit?.name || ''}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
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

            {/* Items Table - Same layout as Sales */}
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
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        لم تتم إضافة أي منتجات بعد
                        <p className="text-sm mt-1">
                          {searchMode === 'barcode' ? 'امسح الباركود أو اكتب الرمز' : 'ابحث عن منتج بالاسم'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const stock = getStock(item.product_id);
                      const overStock = fromWarehouseId && item.decimal_qty > stock;
                      const ppp = item.pieces_per_package;
                      const hasPieces = ppp > 1;
                      return (
                        <tr key={item.product_id} className={`border-b hover:bg-gray-50 ${overStock ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                          <td className="px-2 py-2 text-center font-medium text-gray-500">{index + 1}</td>
                          <td className="px-2 py-2">
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-xs text-gray-500">{item.product.barcode || item.product.sku || ''}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="space-y-1">
                              {/* Cartons row - blue */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateCartons(index, Math.max(0, item.quantity - 1))}
                                  className="w-6 h-6 flex items-center justify-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold"
                                >-</button>
                                <input
                                  ref={(el) => { inputRefs.current[`${index}-quantity`] = el; }}
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateCartons(index, Math.max(0, parseInt(e.target.value) || 0))}
                                  onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                                  onFocus={(e) => e.target.select()}
                                  className="input w-12 text-center text-sm py-0.5 border-blue-300"
                                  min="0"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateCartons(index, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold"
                                >+</button>
                              </div>
                              {/* Pieces row - orange (only if ppp > 1) */}
                              {hasPieces && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updateExtraPieces(index, Math.max(0, item.extra_pieces - 1))}
                                    className="w-6 h-6 flex items-center justify-center rounded border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold"
                                  >-</button>
                                  <input
                                    ref={(el) => { inputRefs.current[`${index}-extra_pieces`] = el; }}
                                    type="number"
                                    value={item.extra_pieces}
                                    onChange={(e) => updateExtraPieces(index, parseInt(e.target.value) || 0)}
                                    onKeyDown={(e) => handleKeyDown(e, index, 'extra_pieces')}
                                    onFocus={(e) => e.target.select()}
                                    className="input w-12 text-center text-sm py-0.5 border-orange-300"
                                    min="0"
                                    max={ppp - 1}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateExtraPieces(index, item.extra_pieces + 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold"
                                  >+</button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-sm">
                            <div className="text-blue-600 font-medium">{ppp}</div>
                            <div className="text-xs text-gray-500">{item.product.unit?.name || 'وحدة'}</div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              ref={(el) => { inputRefs.current[`${index}-total_pieces`] = el; }}
                              type="number"
                              value={item.total_pieces}
                              onChange={(e) => updateTotalPieces(index, Math.max(0, parseInt(e.target.value) || 0))}
                              onKeyDown={(e) => handleKeyDown(e, index, 'total_pieces')}
                              onFocus={(e) => e.target.select()}
                              className="input w-16 text-center text-sm py-0.5 font-medium"
                              min="0"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            {fromWarehouseId ? (
                              <span className={`font-bold text-sm ${overStock ? 'text-red-600' : 'text-green-600'}`}>
                                {fmtStock(stock, item.pieces_per_package)}
                              </span>
                            ) : '-'}
                            {overStock && (
                              <div className="text-[10px] text-red-600">تجاوز!</div>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center text-sm font-medium">
                            {item.unit_cost.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-center text-sm font-bold text-green-700">
                            {item.subtotal.toFixed(2)}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              نصيحة: اضغط Enter للانتقال للحقل التالي
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-lg font-semibold mb-4">ملخص التحويل</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">المصدر:</span>
                <span className="font-medium">
                  {fromWarehouseId ? warehouses.find(w => w.id === fromWarehouseId)?.name : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">الوجهة:</span>
                <span className="font-medium">
                  {toWarehouseId ? warehouses.find(w => w.id === toWarehouseId)?.name : '-'}
                </span>
              </div>
              {getDriverName(toWarehouseId) && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">السائق:</span>
                  <span className="font-medium text-blue-600">{getDriverName(toWarehouseId)}</span>
                </div>
              )}
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">عدد المنتجات:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">إجمالي الكراتين:</span>
                <span className="font-bold text-blue-600">{getTotalCartons()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">قطع إضافية:</span>
                <span className="font-bold text-orange-600">{getTotalExtraPieces()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">إجمالي القطع:</span>
                <span className="font-bold">{getTotalPieces()}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">القيمة الإجمالية:</span>
                <span className="font-bold text-green-700">{formatCurrency(getTotalValue())}</span>
              </div>
            </div>

            {hasStockErrors() && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                بعض المنتجات تتجاوز الكمية المتوفرة في المخزن المصدر
              </div>
            )}

            {/* Status Flow */}
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-2">مسار التحويل:</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">طلب</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">تحميل</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-medium">انطلاق</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={isSaving || items.length === 0 || hasStockErrors()}
                className="btn btn-primary w-full"
              >
                {isSaving ? (
                  <>
                    <div className="spinner w-4 h-4 border-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    إنشاء التحويل
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/dashboard/stock-transfers')}
                className="btn btn-secondary w-full"
              >
                إلغاء
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-4 text-center">
              سيتم إنشاء الطلب بحالة &quot;طلب جديد&quot; ويحتاج للموافقة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
