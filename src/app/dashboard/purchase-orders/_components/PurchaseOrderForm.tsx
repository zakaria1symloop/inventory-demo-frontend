'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DateInput from '@/components/ui/DateInput';
import { purchaseOrdersApi, productsApi, suppliersApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  barcode: string;
  cost_price: number;
  pieces_per_package: number;
  unit_buy?: { id: number; name: string; short_name: string };
}

interface Supplier {
  id: number;
  name: string;
  phone?: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  barcode: string;
  quantity: number; // Number of packages
  pieces_per_package: number; // Pieces per package
  total_pieces: number; // Total pieces = quantity * pieces_per_package
  unit_price: number; // Price per 1 PIECE (not per package)
  original_price: number; // Original price per piece
  unit_name: string;
  discount: number;
  tax: number;
  subtotal: number; // = unit_price × pieces_per_package × quantity - discount + tax
}

interface PurchaseOrderFormProps {
  purchaseOrderId?: number;
}

export default function PurchaseOrderForm({ purchaseOrderId }: PurchaseOrderFormProps = {}) {
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const isEditMode = !!purchaseOrderId;
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const supplierSearchRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [supplierId, setSupplierId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<'fixed' | 'percent'>('fixed');
  const [tax, setTax] = useState<number>(0);
  const [taxMode, setTaxMode] = useState<'fixed' | 'percent'>('fixed');
  const [shipping, setShipping] = useState<number>(0);
  const [note, setNote] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);

  // Supplier search
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierHighlightIndex, setSupplierHighlightIndex] = useState(-1);
  const supplierListRef = useRef<HTMLDivElement>(null);

  // Product search
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productHighlightIndex, setProductHighlightIndex] = useState(-1);
  const productListRef = useRef<HTMLDivElement>(null);

  // Quick product entry modal
  const [quickEntryModal, setQuickEntryModal] = useState<{
    show: boolean;
    product: Product | null;
    quantity: number;
    unitPrice: number;
  }>({ show: false, product: null, quantity: 1, unitPrice: 0 });
  const quickQtyRef = useRef<HTMLInputElement>(null);
  const quickPriceRef = useRef<HTMLInputElement>(null);

  // Refs for keyboard navigation
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchData();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (quickEntryModal.show) return;

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          supplierSearchRef.current?.focus();
          break;
        case 'F2':
          e.preventDefault();
          productSearchRef.current?.focus();
          break;
        case 'F4':
          e.preventDefault();
          submitBtnRef.current?.click();
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [quickEntryModal.show]);

  const fetchData = async () => {
    try {
      const [suppliersRes, warehousesRes, productsRes] = await Promise.all([
        suppliersApi.getAll({ per_page: 1000 }),
        warehousesApi.getAll(),
        productsApi.getAll({ per_page: 1000 }),
      ]);
      setSuppliers(suppliersRes.data.data || suppliersRes.data);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
      setProducts(productsRes.data.data || productsRes.data);

      // Set default warehouse if only one and we're not editing
      const whs = warehousesRes.data.data || warehousesRes.data;
      if (!isEditMode && whs.length === 1) {
        setWarehouseId(whs[0].id.toString());
      }

      // If edit mode, fetch order and populate
      if (isEditMode && purchaseOrderId) {
        const orderRes = await purchaseOrdersApi.getOne(purchaseOrderId);
        const order = orderRes.data.data || orderRes.data;
        const allProducts: Product[] = productsRes.data.data || productsRes.data;
        const allSuppliers: Supplier[] = suppliersRes.data.data || suppliersRes.data;

        if (order.supplier_id) {
          setSupplierId(String(order.supplier_id));
          const sup = allSuppliers.find((s) => s.id === order.supplier_id);
          if (sup) setSupplierSearch(sup.name);
        }
        if (order.warehouse_id) setWarehouseId(String(order.warehouse_id));
        if (order.date) setDate(String(order.date).slice(0, 10));
        if (order.expected_delivery_date) setExpectedDeliveryDate(String(order.expected_delivery_date).slice(0, 10));
        setDiscount(Number(order.discount) || 0);
        setTax(Number(order.tax) || 0);
        setShipping(Number(order.shipping) || 0);
        setNote(order.note || '');
        setTerms(order.terms || '');

        const orderItems: OrderItem[] = (order.items || []).map((it: any) => {
          const prod = allProducts.find((p) => p.id === it.product_id);
          const piecesPerPkg = it.pieces_per_package || prod?.pieces_per_package || 1;
          // unit_price stored is per piece; quantity is in packages
          const qty = Number(it.quantity) || 0;
          const unitPrice = Number(it.unit_price) || 0;
          const itemDiscount = Number(it.discount) || 0;
          return {
            product_id: it.product_id,
            product_name: prod?.name || it.product?.name || '',
            barcode: prod?.barcode || it.product?.barcode || '',
            quantity: qty,
            pieces_per_package: piecesPerPkg,
            total_pieces: qty * piecesPerPkg,
            unit_price: unitPrice,
            original_price: Number(prod?.cost_price) || unitPrice,
            unit_name: prod?.unit_buy?.name || t('purchases.unit'),
            discount: itemDiscount,
            tax: Number(it.tax) || 0,
            subtotal: unitPrice * piecesPerPkg * qty - itemDiscount,
          };
        });
        setItems(orderItems);
      }
    } catch (error) {
      toast.error(t('purchases.dataLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const fieldOrder = ['quantity', 'unit_price', 'discount'];
      const currentFieldIndex = fieldOrder.indexOf(field);

      if (currentFieldIndex < fieldOrder.length - 1) {
        const nextField = fieldOrder[currentFieldIndex + 1];
        const nextRef = inputRefs.current[`${rowIndex}-${nextField}`];
        nextRef?.focus();
        nextRef?.select();
      } else if (rowIndex < items.length - 1) {
        const nextRef = inputRefs.current[`${rowIndex + 1}-quantity`];
        nextRef?.focus();
        nextRef?.select();
      } else {
        barcodeInputRef.current?.focus();
      }
    }
  }, [items.length]);

  // Open quick entry modal for product
  const openQuickEntryModal = (product: Product) => {
    if (!warehouseId) {
      toast.error(t('purchases.selectWarehouseFirst'));
      return;
    }
    setQuickEntryModal({
      show: true,
      product,
      quantity: 1,
      unitPrice: Number(product.cost_price) || 0,
    });
    setShowProductSearch(false);
    setBarcodeInput('');
    setTimeout(() => quickQtyRef.current?.select(), 50);
  };

  // Confirm quick entry and add product
  const confirmQuickEntry = () => {
    if (!quickEntryModal.product) return;
    const { product, quantity, unitPrice } = quickEntryModal;

    if (quantity <= 0) {
      toast.error(t('purchases.qtyMustBePositive'));
      return;
    }

    const existingIndex = items.findIndex((item) => item.product_id === product.id);

    if (existingIndex >= 0) {
      const existingItem = items[existingIndex];
      const newQty = existingItem.quantity + quantity;
      const piecesPerPkg = existingItem.pieces_per_package;
      // baseAmount = price × pieces × qty - discount
      const baseAmount = (unitPrice * piecesPerPkg * newQty) - existingItem.discount;
      const updatedItem = {
        ...existingItem,
        quantity: newQty,
        total_pieces: newQty * piecesPerPkg,
        unit_price: unitPrice, // Price per 1 piece
        subtotal: baseAmount,
      };
      const otherItems = items.filter((_, i) => i !== existingIndex);
      setItems([updatedItem, ...otherItems]);
    } else {
      const piecesPerPkg = product.pieces_per_package || 1;
      // baseAmount = price × pieces × qty
      const baseAmount = unitPrice * piecesPerPkg * quantity;
      const unitName = product.unit_buy?.name || t('purchases.unit');

      const newItem: OrderItem = {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode || '',
        quantity: quantity,
        pieces_per_package: piecesPerPkg,
        total_pieces: quantity * piecesPerPkg,
        unit_price: unitPrice, // Price per 1 piece
        original_price: Number(product.cost_price) || 0,
        unit_name: unitName,
        discount: 0,
        tax: 0,
        subtotal: baseAmount,
      };
      setItems([newItem, ...items]);
    }

    setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0 });
    barcodeInputRef.current?.focus();
  };

  const handleBarcodeSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const product = products.find((p) => p.barcode === barcodeInput.trim());
      if (product) {
        openQuickEntryModal(product);
      } else {
        toast.error(t('purchases.productNotFound'));
      }
    }
  };

  const updateItem = (index: number, field: 'quantity' | 'unit_price' | 'discount', value: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    const quantity = updated[index].quantity || 0;
    const unitPrice = updated[index].unit_price || 0; // Price per 1 piece
    const itemDiscount = updated[index].discount || 0;
    const piecesPerPkg = updated[index].pieces_per_package || 1;

    updated[index].total_pieces = quantity * piecesPerPkg;
    // subtotal = price × pieces × qty - discount
    updated[index].subtotal = (unitPrice * piecesPerPkg * quantity) - itemDiscount;

    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const computedDiscount = discountMode === 'percent'
    ? (totalAmount * (Number(discount) || 0) / 100)
    : (Number(discount) || 0);
  const afterDiscount = Math.max(0, totalAmount - computedDiscount);
  const computedTax = taxMode === 'percent'
    ? (afterDiscount * (Number(tax) || 0) / 100)
    : (Number(tax) || 0);
  const grandTotal = Math.max(0, afterDiscount + computedTax + (Number(shipping) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId) {
      toast.error(t('purchases.selectWarehouseError'));
      return;
    }

    if (items.length === 0) {
      toast.error(t('purchases.addAtLeastOneProduct'));
      return;
    }

    setIsSaving(true);

    try {
      // Resolve % to absolute amount before submitting (backend stores fixed values)
      const discountAmount = discountMode === 'percent'
        ? (totalAmount * (Number(discount) || 0) / 100)
        : (Number(discount) || 0);
      const taxAmount = taxMode === 'percent'
        ? (Math.max(0, totalAmount - discountAmount) * (Number(tax) || 0) / 100)
        : (Number(tax) || 0);

      const payload = {
        supplier_id: supplierId ? parseInt(supplierId) : null,
        warehouse_id: parseInt(warehouseId),
        date,
        expected_delivery_date: expectedDeliveryDate || null,
        discount: discountAmount,
        tax: taxAmount,
        shipping,
        note,
        terms,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          tax: item.tax,
        })),
      };

      if (isEditMode && purchaseOrderId) {
        await purchaseOrdersApi.update(purchaseOrderId, payload);
        toast.success(t('purchases.updatePoSuccess') || 'Updated');
        router.push('/dashboard/purchase-orders');
      } else {
        await purchaseOrdersApi.create(payload);
        toast.success(t('purchases.createPoSuccess'));
        router.push('/dashboard/purchase-orders');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.createPoError');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    const safeValue = isNaN(value) ? 0 : value;
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(safeValue);
  };

  // Filter by selected supplier — legacy products without supplier assignment still appear.
  const supplierIdNum = supplierId ? parseInt(supplierId) : null;
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (!supplierIdNum) return true;
    const ps = (p as any).supplier_id;
    return ps == null || Number(ps) === supplierIdNum;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Keyboard Shortcuts Bar — desktop only (no physical keyboard on mobile) */}
      <div className="hidden md:flex bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md mb-3 items-center gap-4 text-[12px]">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{t('purchases.shortcuts')}:</span>
        <span><kbd className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">F1</kbd> {t('purchases.supplierLabel')}</span>
        <span><kbd className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">F2</kbd> {t('purchases.product')}</span>
        <span><kbd className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">F4</kbd> {t('common.save')}</span>
        <span><kbd className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">↑↓</kbd> {t('purchases.navigate')}</span>
        <span><kbd className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">Enter</kbd> {t('purchases.confirm')}</span>
        <span><kbd className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">Esc</kbd> {t('purchases.close')}</span>
      </div>

      {/* Quick Entry Modal */}
      {quickEntryModal.show && quickEntryModal.product && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0 }); barcodeInputRef.current?.focus(); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[420px] max-h-[calc(100vh-3rem)] pointer-events-auto p-5">
            <h3 className="text-base font-semibold mb-3 text-center text-gray-900 dark:text-gray-100">{quickEntryModal.product.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.quantity')}</label>
                <input
                  ref={quickQtyRef}
                  type="number"
                  value={quickEntryModal.quantity}
                  onChange={(e) => setQuickEntryModal(prev => ({ ...prev, quantity: Number(e.target.value) || 0 }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      quickPriceRef.current?.focus();
                      quickPriceRef.current?.select();
                    } else if (e.key === 'Escape') {
                      setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0 });
                      barcodeInputRef.current?.focus();
                    }
                  }}
                  className="input w-full text-center text-xl"
                  min="1"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.unitPrice')}</label>
                <input
                  ref={quickPriceRef}
                  type="number"
                  value={quickEntryModal.unitPrice}
                  onChange={(e) => setQuickEntryModal(prev => ({ ...prev, unitPrice: Number(e.target.value) || 0 }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmQuickEntry();
                    } else if (e.key === 'Escape') {
                      setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0 });
                      barcodeInputRef.current?.focus();
                    }
                  }}
                  className="input w-full text-center text-xl"
                  min="0"
                />
              </div>
              <div className="text-center text-base font-semibold text-gray-900 dark:text-gray-100 tnum">
                {t('purchases.subtotal')}: {formatCurrency(quickEntryModal.unitPrice * (quickEntryModal.product?.pieces_per_package || 1) * quickEntryModal.quantity)}
                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                  ({quickEntryModal.unitPrice} × {quickEntryModal.product?.pieces_per_package || 1} {t('purchases.piece')} × {quickEntryModal.quantity})
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={confirmQuickEntry}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                >
                  {t('purchases.add')} (Enter)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0 });
                    barcodeInputRef.current?.focus();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('purchases.cancel')} (Esc)
                </button>
              </div>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Header */}
      <PageHeader
        title={isEditMode ? (t('purchases.editPoTitle') || 'Edit Purchase Order') : t('purchases.newPoTitle')}
        subtitle={t('purchases.newPoSubtitleFr')}
        breadcrumb={[
          { label: t('purchases.poTitle'), href: '/dashboard/purchase-orders' },
          { label: isEditMode ? (t('purchases.editPoTitle') || 'Edit') : t('purchases.newPoTitle') },
        ]}
      >
        <Link
          href="/dashboard/purchase-orders"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 rtl:rotate-180" />
          {t('purchases.cancel')}
        </Link>
      </PageHeader>

      {/* Info note */}
      <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3">
        {t('purchases.poNoStockEffect')}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="surface-pro">
              <h2 className="surface-heading mb-3">{t('purchases.orderInfo')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.supplierLabel')}</label>
                  <input
                    ref={supplierSearchRef}
                    type="text"
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                      if (!e.target.value) {
                        setSupplierId('');
                      }
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    onKeyDown={(e) => {
                      const filtered = suppliers.filter(s =>
                        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                        (s.phone && s.phone.includes(supplierSearch))
                      ).slice(0, 10);
                      const maxIndex = filtered.length;

                      if (e.key === 'Escape') {
                        setShowSupplierDropdown(false);
                        setSupplierHighlightIndex(-1);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setShowSupplierDropdown(true);
                        setSupplierHighlightIndex(prev => Math.min(prev + 1, maxIndex));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSupplierHighlightIndex(prev => Math.max(prev - 1, 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (supplierHighlightIndex === 0) {
                          setSupplierId('');
                          setSupplierSearch('');
                          setShowSupplierDropdown(false);
                          setSupplierHighlightIndex(-1);
                        } else if (supplierHighlightIndex > 0 && filtered[supplierHighlightIndex - 1]) {
                          const selected = filtered[supplierHighlightIndex - 1];
                          setSupplierId(selected.id.toString());
                          setSupplierSearch(selected.name);
                          setShowSupplierDropdown(false);
                          setSupplierHighlightIndex(-1);
                        } else if (filtered.length === 1) {
                          setSupplierId(filtered[0].id.toString());
                          setSupplierSearch(filtered[0].name);
                          setShowSupplierDropdown(false);
                          setSupplierHighlightIndex(-1);
                        }
                      }
                    }}
                    placeholder={t('purchases.searchSupplierPlaceholder')}
                    className="input w-full"
                    autoComplete="off"
                  />
                  {showSupplierDropdown && (
                    <div ref={supplierListRef} className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className={`px-3 py-2 cursor-pointer border-b border-gray-200 dark:border-gray-700 ${supplierHighlightIndex === 0 ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        onClick={() => {
                          setSupplierId('');
                          setSupplierSearch('');
                          setShowSupplierDropdown(false);
                          setSupplierHighlightIndex(-1);
                        }}
                      >
                        <span className="text-gray-500 dark:text-gray-400">{t('purchases.noSupplier')}</span>
                      </div>
                      {suppliers
                        .filter(s =>
                          s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                          (s.phone && s.phone.includes(supplierSearch))
                        )
                        .slice(0, 10)
                        .map((supplier, index) => (
                          <div
                            key={supplier.id}
                            className={`px-3 py-2 cursor-pointer ${supplierHighlightIndex === index + 1 ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            onClick={() => {
                              setSupplierId(supplier.id.toString());
                              setSupplierSearch(supplier.name);
                              setShowSupplierDropdown(false);
                              setSupplierHighlightIndex(-1);
                            }}
                          >
                            <div className="font-medium text-gray-900 dark:text-gray-100">{supplier.name}</div>
                            {supplier.phone && <div className="text-sm text-gray-500 dark:text-gray-400">{supplier.phone}</div>}
                          </div>
                        ))}
                    </div>
                  )}
                  {showSupplierDropdown && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSupplierDropdown(false)}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.warehouseLabel')} *</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="select w-full"
                    required
                  >
                    <option value="">{t('purchases.selectWarehouse')}</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.orderDate')} *</label>
                  <DateInput
                    value={date}
                    onChange={(v) => setDate(v)}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.expectedDelivery')}</label>
                  <DateInput
                    value={expectedDeliveryDate}
                    onChange={(v) => setExpectedDeliveryDate(v)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Product Search */}
            <div className="surface-pro">
              <h2 className="surface-heading mb-3">{t('purchases.addProducts')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.barcodeSearch')}</label>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeSearch}
                    className="input w-full"
                    placeholder={t('purchases.scanBarcode')}
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.nameSearch')}</label>
                  <input
                    ref={productSearchRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowProductSearch(true);
                      setProductHighlightIndex(-1);
                    }}
                    onFocus={() => {
                      setShowProductSearch(true);
                      setProductHighlightIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      const maxIndex = Math.min(filteredProducts.length, 10) - 1;

                      if (e.key === 'Escape') {
                        setShowProductSearch(false);
                        setProductHighlightIndex(-1);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setShowProductSearch(true);
                        setProductHighlightIndex(prev => Math.min(prev + 1, maxIndex));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setProductHighlightIndex(prev => Math.max(prev - 1, 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const prods = filteredProducts.slice(0, 10);
                        if (productHighlightIndex >= 0 && prods[productHighlightIndex]) {
                          openQuickEntryModal(prods[productHighlightIndex]);
                          setProductHighlightIndex(-1);
                        } else if (prods.length === 1) {
                          openQuickEntryModal(prods[0]);
                          setProductHighlightIndex(-1);
                        }
                      }
                    }}
                    className="input w-full"
                    placeholder={t('purchases.searchProduct')}
                  />
                  {showProductSearch && searchTerm && (
                    <div ref={productListRef} className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-gray-500 dark:text-gray-400 text-center">{t('purchases.noResults')}</div>
                      ) : (
                        filteredProducts.slice(0, 10).map((product, index) => {
                          const piecesPerPkg = product.pieces_per_package || 1;
                          const unitPrice = Number(product.cost_price) || 0;
                          const unitName = product.unit_buy?.short_name || t('purchases.unit');
                          const isHighlighted = productHighlightIndex === index;
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => openQuickEntryModal(product)}
                              className={`w-full p-3 text-start border-b last:border-b-0 border-gray-200 dark:border-gray-700 ${isHighlighted ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                              <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
                                <span>{product.barcode}</span>
                                <span>
                                  {formatCurrency(unitPrice)} / {unitName}
                                  {piecesPerPkg > 1 && <span className="text-gray-400 dark:text-gray-500 ms-1">({piecesPerPkg} {t('purchases.piece')})</span>}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="table-pro-wrap">
                <table className="table-pro compact">
                  <thead>
                    <tr>
                      <th className="text-center w-12">{t('purchases.number')}</th>
                      <th>{t('purchases.designation')}</th>
                      <th className="text-end w-20">{t('purchases.qty')}</th>
                      <th className="text-center w-16">{t('purchases.unit')}</th>
                      <th className="text-end w-28">{t('purchases.unitPrice')}</th>
                      <th className="text-end w-24">{t('purchases.discountLabel')}</th>
                      <th className="text-end w-28">{t('purchases.subtotal')}</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 t-empty">
                          {t('purchases.noProductsYet')}
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={index}>
                          <td className="text-center text-gray-500 dark:text-gray-400 tnum">{index + 1}</td>
                          <td>
                            <div className="font-medium text-gray-800 dark:text-gray-100">{item.product_name}</div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">{item.barcode}</div>
                          </td>
                          <td>
                            <input
                              ref={(el) => { inputRefs.current[`${index}-quantity`] = el; }}
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                              className="input w-full text-end !px-2 tnum"
                              min="0.01"
                              step="0.01"
                            />
                          </td>
                          <td className="text-center text-[12px] text-gray-600 dark:text-gray-300">
                            {item.unit_name}
                          </td>
                          <td>
                            <input
                              ref={(el) => { inputRefs.current[`${index}-unit_price`] = el; }}
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'unit_price')}
                              className="input w-full text-end !px-2 tnum"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td>
                            <input
                              ref={(el) => { inputRefs.current[`${index}-discount`] = el; }}
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'discount')}
                              className="input w-full text-end !px-2 tnum"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="text-end font-semibold text-gray-800 dark:text-gray-100 tnum">
                            {formatCurrency(Number(item.subtotal) || 0)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                              title={t('purchases.delete')}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t('purchases.enterTip')}
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="surface-pro">
              <h2 className="surface-heading mb-3">{t('purchases.notesAndTerms')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.notesLabel')}</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input w-full"
                    rows={3}
                    placeholder={t('purchases.additionalNotes')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('purchases.deliveryTerms')}</label>
                  <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="input w-full"
                    rows={3}
                    placeholder={t('purchases.deliveryTermsPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div>
            <div className="surface-pro sticky top-24">
              <h2 className="surface-heading mb-3">{t('purchases.orderSummary')}</h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-500 dark:text-gray-400">{t('purchases.totalProducts', { count: items.length })}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 tnum">{formatCurrency(totalAmount)}</span>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-400 mb-1">{t('purchases.discountLabel')}</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="input flex-1 tnum"
                      min="0"
                      step="0.01"
                    />
                    <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setDiscountMode('fixed')}
                        className={`px-2.5 text-[11px] font-medium ${discountMode === 'fixed' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                        aria-label="Fixed amount"
                      >DZD</button>
                      <button
                        type="button"
                        onClick={() => setDiscountMode('percent')}
                        className={`px-2.5 text-[11px] font-medium ${discountMode === 'percent' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                        aria-label="Percentage"
                      >%</button>
                    </div>
                  </div>
                  {discountMode === 'percent' && (
                    <div className="text-[11px] text-gray-400 mt-1 text-end tnum">= {formatCurrency(computedDiscount)}</div>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-400 mb-1">{t('purchases.taxLabel')}</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      className="input flex-1 tnum"
                      min="0"
                      step="0.01"
                    />
                    <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setTaxMode('fixed')}
                        className={`px-2.5 text-[11px] font-medium ${taxMode === 'fixed' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                      >DZD</button>
                      <button
                        type="button"
                        onClick={() => setTaxMode('percent')}
                        className={`px-2.5 text-[11px] font-medium ${taxMode === 'percent' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                      >%</button>
                    </div>
                  </div>
                  {taxMode === 'percent' && (
                    <div className="text-[11px] text-gray-400 mt-1 text-end tnum">= {formatCurrency(computedTax)}</div>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-400 mb-1">{t('purchases.shippingLabel')}</label>
                  <input
                    type="number"
                    value={shipping}
                    onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                    className="input w-full tnum"
                    min="0"
                    step="0.01"
                  />
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div className="flex justify-between items-center text-[15px] font-semibold">
                  <span className="text-gray-900 dark:text-gray-100">{t('purchases.finalTotal')}</span>
                  <span className="text-gray-900 dark:text-gray-100 tnum">{formatCurrency(grandTotal)}</span>
                </div>

                <button
                  ref={submitBtnRef}
                  type="submit"
                  disabled={isSaving || items.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? t('purchases.saving') : (isEditMode ? (t('purchases.updatePo') || t('common.save')) : t('purchases.createPo'))}
                </button>

                <Link href="/dashboard/purchase-orders" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {t('purchases.cancel')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Click outside to close product search */}
      {showProductSearch && (
        <div className="fixed inset-0 z-0" onClick={() => setShowProductSearch(false)} />
      )}
    </div>
  );
}
