'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DateInput from '@/components/ui/DateInput';
import { purchasesApi, productsApi, suppliersApi, warehousesApi, creditorsApi, clientCategoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';

interface ProductCategoryPrice {
  id: number;
  product_id: number;
  client_category_id: number;
  price: number;
}

interface ClientCategory {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  barcode: string;
  cost_price: number;
  retail_price: number;
  wholesale_price?: number;
  tax_percent: number;
  pieces_per_package: number;
  unit_buy?: { id: number; name: string; short_name: string };
  category_prices?: ProductCategoryPrice[];
}

interface Supplier {
  id: number;
  name: string;
  phone?: string;
  balance?: number;
}

interface SupplierDebtInfo {
  balance: number;
  unpaid_purchases?: Array<{
    id: number;
    reference: string;
    due_amount: number;
    date: string;
  }>;
}

interface Warehouse {
  id: number;
  name: string;
}

interface PurchaseItem {
  product_id: number;
  product_name: string;
  barcode: string;
  quantity: number; // Number of cartons
  extra_pieces: number; // Extra pieces (0 to pieces_per_package - 1)
  pieces_per_package: number; // Pieces per package
  total_pieces: number; // Total pieces = quantity * pieces_per_package + extra_pieces
  unit_price: number; // Price per 1 PIECE (not per package)
  price_mode?: 'piece' | 'carton'; // How user wants to enter price (display only; unit_price always per piece)
  original_price: number; // Original price per piece
  selling_price?: number; // Selling price per piece - updates product price
  unit_name: string; // Unit name
  discount: number;
  tax_percent: number;
  tax: number;
  subtotal: number; // = unit_price × total_pieces - discount + tax
}

interface PurchaseFormProps {
  purchaseId?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PurchaseForm({ purchaseId = null, onSuccess, onCancel }: PurchaseFormProps) {
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);

  const isEditMode = purchaseId !== null;
  const [showTour, setShowTour] = useState(false);

  const purchaseFormTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="pf-shortcuts"]',
      title: t('purchases.pfTourShortcutsTitle'),
      desc: t('purchases.pfTourShortcutsDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="pf-info"]',
      title: t('purchases.pfTourInfoTitle'),
      desc: t('purchases.pfTourInfoDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="pf-products"]',
      title: t('purchases.pfTourProductsTitle'),
      desc: t('purchases.pfTourProductsDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="pf-items"]',
      title: t('purchases.pfTourItemsTitle'),
      desc: t('purchases.pfTourItemsDesc'),
      position: 'top' as const,
    },
    {
      target: '[data-tour="pf-summary"]',
      title: t('purchases.pfTourSummaryTitle'),
      desc: t('purchases.pfTourSummaryDesc'),
      position: 'left' as const,
    },
    {
      target: '[data-tour="pf-save"]',
      title: t('purchases.pfTourSaveTitle'),
      desc: t('purchases.pfTourSaveDesc'),
      position: 'left' as const,
    },
  ], [t]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientCategories, setClientCategories] = useState<ClientCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [purchaseDataLoaded, setPurchaseDataLoaded] = useState(false);
  // In edit mode, the supplier balance already includes this purchase's unpaid amount.
  // Track the original due_amount so we can subtract it when computing "previous debt".
  const [originalDueAmount, setOriginalDueAmount] = useState<number>(0);

  // Form state
  const [supplierId, setSupplierId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount');
  const [tax, setTax] = useState<number>(0);
  const [taxMode, setTaxMode] = useState<'amount' | 'percent'>('amount');
  const [shipping, setShipping] = useState<number>(0);
  const [timbre, setTimbre] = useState<number>(0);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Supplier debt info
  const [supplierDebt, setSupplierDebt] = useState<SupplierDebtInfo | null>(null);
  const [loadingDebt, setLoadingDebt] = useState(false);

  // Supplier search
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierHighlightIndex, setSupplierHighlightIndex] = useState(-1);
  const supplierSearchRef = useRef<HTMLInputElement>(null);
  const supplierListRef = useRef<HTMLDivElement>(null);

  // Inline creation
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [creatingWarehouse, setCreatingWarehouse] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');

  // Product search
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productHighlightIndex, setProductHighlightIndex] = useState(-1);
  const productListRef = useRef<HTMLDivElement>(null);

  // Search mode toggle (barcode or name) - saved to localStorage
  const [searchMode, setSearchMode] = useState<'barcode' | 'name'>('barcode');

  // Warehouse stock
  const [warehouseStock, setWarehouseStock] = useState<Record<number, number>>({});

  // Quick product entry modal
  const [quickEntryModal, setQuickEntryModal] = useState<{
    show: boolean;
    product: Product | null;
    quantity: number;
    unitPrice: number;
    sellingPrice: number;
    categoryPrices: Record<number, number>;
  }>({ show: false, product: null, quantity: 1, unitPrice: 0, sellingPrice: 0, categoryPrices: {} });
  const quickQtyRef = useRef<HTMLInputElement>(null);
  const quickPriceRef = useRef<HTMLInputElement>(null);
  const quickSellingRef = useRef<HTMLInputElement>(null);
  const catPriceRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const paidAmountRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Refs for keyboard navigation
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchData();
    // Load search mode from localStorage
    const savedSearchMode = localStorage.getItem('productSearchMode');
    if (savedSearchMode === 'barcode' || savedSearchMode === 'name') {
      setSearchMode(savedSearchMode);
    }
  }, []);

  // Pre-fill from product request (sessionStorage)
  useEffect(() => {
    if (isEditMode || products.length === 0) return;
    const preFillJson = sessionStorage.getItem('purchasePreFill');
    if (!preFillJson) return;
    sessionStorage.removeItem('purchasePreFill');
    try {
      const preFill = JSON.parse(preFillJson);
      if (preFill.warehouse_id) {
        setWarehouseId(preFill.warehouse_id.toString());
      }
      if (preFill.note) {
        setNote(preFill.note);
      }
      if (preFill.items && Array.isArray(preFill.items)) {
        const preFillItems: PurchaseItem[] = preFill.items.map((pi: Record<string, unknown>) => {
          const piecesPerPkg = Number(pi.pieces_per_package) || 1;
          const unitPrice = Number(pi.unit_price) || 0;
          const qty = Number(pi.quantity) || 1;
          const totalPieces = qty * piecesPerPkg;
          const baseAmount = unitPrice * totalPieces;
          return {
            product_id: Number(pi.product_id),
            product_name: String(pi.product_name || ''),
            barcode: String(pi.barcode || ''),
            quantity: qty,
            extra_pieces: 0,
            pieces_per_package: piecesPerPkg,
            total_pieces: totalPieces,
            unit_price: unitPrice,
            original_price: unitPrice,
            unit_name: String(pi.unit_name || t('purchases.pfUnit')),
            discount: 0,
            tax_percent: 0,
            tax: 0,
            subtotal: baseAmount,
          };
        });
        if (preFillItems.length > 0) {
          setItems(preFillItems);
          toast.success(t('purchases.pfProductsLoaded', { count: preFillItems.length }));
        }
      }
    } catch {
      // Silent fail
    }
  }, [products.length, isEditMode]);

  // Load purchase data in edit mode - wait for suppliers to be loaded first
  useEffect(() => {
    if (isEditMode && purchaseId && suppliers.length > 0 && !purchaseDataLoaded) {
      loadPurchaseData(purchaseId);
    }
  }, [isEditMode, purchaseId, suppliers.length, purchaseDataLoaded]);

  // Save search mode to localStorage when changed
  const toggleSearchMode = () => {
    const newMode = searchMode === 'barcode' ? 'name' : 'barcode';
    setSearchMode(newMode);
    localStorage.setItem('productSearchMode', newMode);
    // Clear search inputs when switching
    setBarcodeInput('');
    setSearchTerm('');
    setShowProductSearch(false);
    // Focus the search input
    setTimeout(() => {
      if (newMode === 'barcode') {
        barcodeInputRef.current?.focus();
      } else {
        productSearchRef.current?.focus();
      }
    }, 50);
  };

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
        case 'F3':
          e.preventDefault();
          paidAmountRef.current?.focus();
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

  // Fetch warehouse stock when warehouse changes
  useEffect(() => {
    if (warehouseId) {
      warehousesApi.getStock(parseInt(warehouseId)).then((res) => {
        const stockMap: Record<number, number> = {};
        (res.data || []).forEach((s: { product_id: number; quantity: number }) => {
          stockMap[s.product_id] = Number(s.quantity) || 0;
        });
        setWarehouseStock(stockMap);
      }).catch(() => setWarehouseStock({}));
    } else {
      setWarehouseStock({});
    }
  }, [warehouseId]);

  // Fetch supplier debt when supplier changes
  useEffect(() => {
    if (supplierId) {
      fetchSupplierDebt(parseInt(supplierId));
    } else {
      setSupplierDebt(null);
    }
  }, [supplierId]);

  const fetchData = async () => {
    try {
      const [suppliersRes, warehousesRes, productsRes, catRes] = await Promise.all([
        suppliersApi.getAll({ per_page: 1000 }),
        warehousesApi.getAll(),
        productsApi.getAll({ per_page: 1000 }),
        clientCategoriesApi.getAll().catch(() => ({ data: { data: [] } })),
      ]);
      setSuppliers(suppliersRes.data.data || suppliersRes.data);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
      setProducts(productsRes.data.data || productsRes.data);
      setClientCategories(catRes.data.data || catRes.data || []);

      // Set default warehouse if only one
      const whs = warehousesRes.data.data || warehousesRes.data;
      if (whs.length === 1) {
        setWarehouseId(whs[0].id.toString());
      }
    } catch (error) {
      toast.error(t('purchases.dataLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupplierDebt = async (id: number) => {
    setLoadingDebt(true);
    try {
      const debtRes = await creditorsApi.getSupplierDebt(id).catch(() => ({ data: { purchases: [], totals: { total_remaining: 0 } } }));
      // Use the actual sum of unpaid purchases, not the supplier balance
      // This is more accurate because supplier.balance might be out of sync
      const actualDebt = debtRes.data.totals?.total_remaining || 0;
      setSupplierDebt({
        balance: actualDebt,
        unpaid_purchases: debtRes.data.purchases || []
      });
    } catch (error) {
      console.error('Error fetching supplier debt:', error);
      setSupplierDebt(null);
    } finally {
      setLoadingDebt(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) { toast.error(t('purchases.pfEnterSupplierName')); return; }
    try {
      setCreatingSupplier(true);
      const res = await suppliersApi.create({ name: newSupplierName.trim(), phone: newSupplierPhone.trim() || null });
      const created = res.data?.data || res.data;
      setSuppliers(prev => [...prev, created]);
      setSupplierId(created.id.toString());
      setSupplierSearch(created.name);
      setShowSupplierDropdown(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
      toast.success(t('purchases.pfSupplierCreated', { name: created.name }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('purchases.pfSupplierCreateError'));
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleCreateWarehouse = async () => {
    if (!newWarehouseName.trim()) { toast.error(t('purchases.pfEnterWarehouseName')); return; }
    try {
      setCreatingWarehouse(true);
      const res = await warehousesApi.create({ name: newWarehouseName.trim() });
      const created = res.data?.data || res.data;
      setWarehouses(prev => [...prev, created]);
      setWarehouseId(created.id.toString());
      setNewWarehouseName('');
      toast.success(t('purchases.pfWarehouseCreated', { name: created.name }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('purchases.pfWarehouseCreateError'));
    } finally {
      setCreatingWarehouse(false);
    }
  };

  const loadPurchaseData = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await purchasesApi.getOne(id);
      const purchase = response.data;

      // Set form fields (only editable fields)
      setDiscount(purchase.discount || 0);
      setTax(purchase.tax || 0);
      setShipping(purchase.shipping || 0);
      setTimbre(purchase.timbre_percentage || 0);
      setNote(purchase.note || '');
      setPaidAmount(purchase.paid_amount || 0);
      setOriginalDueAmount(Number(purchase.due_amount) || 0);

      // Set read-only fields
      if (purchase.supplier_id) {
        setSupplierId(purchase.supplier_id.toString());
        // Use supplier data from purchase response or find in suppliers list
        const supplierName = purchase.supplier?.name || suppliers.find(s => s.id === purchase.supplier_id)?.name || '';
        setSupplierSearch(supplierName);
      }
      setWarehouseId(purchase.warehouse_id?.toString() || '');
      setDate(purchase.date?.split(' ')[0] || new Date().toISOString().split('T')[0]);

      // Load items
      if (purchase.items && Array.isArray(purchase.items)) {
        const loadedItems: PurchaseItem[] = purchase.items.map((item: any) => {
          const ppp = item.product?.pieces_per_package || 1;
          const totalPieces = Math.floor(Number(item.quantity) || 0);
          const cartons = Math.floor(totalPieces / ppp);
          const extraPieces = totalPieces % ppp;
          return {
            product_id: item.product_id,
            product_name: item.product?.name || '',
            barcode: item.product?.barcode || '',
            quantity: cartons,
            extra_pieces: extraPieces,
            pieces_per_package: ppp,
            total_pieces: totalPieces,
            unit_price: item.unit_price,
            original_price: item.unit_price,
            unit_name: item.product?.unit_buy?.short_name || t('purchases.pfUnit'),
            discount: item.discount || 0,
            tax_percent: item.product?.tax_percent || 0,
            tax: item.tax || 0,
            subtotal: item.subtotal || 0,
          };
        });
        setItems(loadedItems);
      }

      toast.success(t('purchases.pfInvoiceLoaded'));
      setPurchaseDataLoaded(true);
    } catch (error) {
      toast.error(t('purchases.pfInvoiceLoadError'));
      console.error('Error loading purchase data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Define field order for navigation
      const fieldOrder = ['quantity', 'extra_pieces', 'total_pieces', 'unit_price', 'discount'];
      const currentFieldIndex = fieldOrder.indexOf(field);

      if (currentFieldIndex < fieldOrder.length - 1) {
        // Move to next field in same row
        const nextField = fieldOrder[currentFieldIndex + 1];
        const nextRef = inputRefs.current[`${rowIndex}-${nextField}`];
        if (nextRef) {
          nextRef.focus();
          nextRef.select();
        } else {
          // Skip missing fields (e.g., extra_pieces when ppp=1)
          for (let i = currentFieldIndex + 2; i < fieldOrder.length; i++) {
            const skipRef = inputRefs.current[`${rowIndex}-${fieldOrder[i]}`];
            if (skipRef) {
              skipRef.focus();
              skipRef.select();
              break;
            }
          }
        }
      } else if (rowIndex < items.length - 1) {
        // Move to first field of next row
        const nextRef = inputRefs.current[`${rowIndex + 1}-quantity`];
        nextRef?.focus();
        nextRef?.select();
      } else {
        // Last field of last row - focus barcode input for next product
        barcodeInputRef.current?.focus();
      }
    }
  }, [items.length]);

  const addProduct = (product: Product, quantity: number = 1) => {
    const existingIndex = items.findIndex((item) => item.product_id === product.id);

    if (existingIndex >= 0) {
      // Update quantity if product already exists - move to top
      const existingItem = items[existingIndex];
      const newQty = existingItem.quantity + quantity;
      const unitPrice = existingItem.unit_price; // Price per 1 piece
      const discount = existingItem.discount;
      const taxPercent = existingItem.tax_percent;
      const piecesPerPkg = existingItem.pieces_per_package;
      // baseAmount = price × pieces × qty - discount
      const baseAmount = (unitPrice * piecesPerPkg * newQty) - discount;
      const updatedItem = {
        ...existingItem,
        quantity: newQty,
        total_pieces: newQty * piecesPerPkg,
        tax: (baseAmount * taxPercent) / 100,
        subtotal: baseAmount + (baseAmount * taxPercent) / 100,
      };
      const otherItems = items.filter((_, i) => i !== existingIndex);
      setItems([updatedItem, ...otherItems]);
    } else {
      // Add new product at the top of the list
      const piecesPerPkg = product.pieces_per_package || 1;
      const unitPrice = parseFloat(String(product.cost_price)) || 0; // Price per 1 piece
      const taxPercent = parseFloat(String(product.tax_percent)) || 0;
      const totalPieces = quantity * piecesPerPkg;
      // baseAmount = price × totalPieces
      const baseAmount = unitPrice * totalPieces;
      const taxAmount = (baseAmount * taxPercent) / 100;
      const unitName = product.unit_buy?.name || t('purchases.pfUnit');

      const newItem: PurchaseItem = {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode || '',
        quantity: quantity,
        extra_pieces: 0,
        pieces_per_package: piecesPerPkg,
        total_pieces: totalPieces,
        unit_price: unitPrice, // Price per 1 piece
        original_price: unitPrice,
        unit_name: unitName,
        discount: 0,
        tax_percent: taxPercent,
        tax: taxAmount,
        subtotal: baseAmount + taxAmount,
      };
      setItems([newItem, ...items]);
    }

    setSearchTerm('');
    setShowProductSearch(false);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Open quick entry modal for product
  const openQuickEntryModal = (product: Product) => {
    if (!warehouseId) {
      toast.error(t('purchases.selectWarehouseFirst'));
      return;
    }
    // Build category prices map from existing product data
    const catPrices: Record<number, number> = {};
    if (product.category_prices) {
      for (const cp of product.category_prices) {
        catPrices[cp.client_category_id] = Number(cp.price) || 0;
      }
    }
    // Ensure all categories have an entry
    for (const cat of clientCategories) {
      if (!(cat.id in catPrices)) {
        catPrices[cat.id] = 0;
      }
    }
    setQuickEntryModal({
      show: true,
      product,
      quantity: 1,
      unitPrice: Number(product.cost_price) || 0,
      sellingPrice: Number(product.retail_price) || 0,
      categoryPrices: catPrices,
    });
    setShowProductSearch(false);
    setBarcodeInput('');
    setTimeout(() => quickQtyRef.current?.select(), 50);
  };

  // Confirm quick entry and add product
  const confirmQuickEntry = () => {
    if (!quickEntryModal.product) return;
    const { product, quantity, unitPrice, sellingPrice, categoryPrices } = quickEntryModal;

    if (quantity <= 0) {
      toast.error(t('purchases.qtyMustBePositive'));
      return;
    }

    // Save category prices + selling price to product in background
    const priceUpdates: Record<string, unknown> = {};
    const catPricesArray = Object.entries(categoryPrices)
      .filter(([, price]) => price > 0)
      .map(([catId, price]) => ({ client_category_id: Number(catId), price }));
    if (catPricesArray.length > 0) {
      priceUpdates.category_prices = catPricesArray;
    }
    if (Object.keys(priceUpdates).length > 0) {
      productsApi.update(product.id, priceUpdates).catch((err: unknown) => {
        console.error('Failed to update product prices:', err);
      });
    }

    const existingIndex = items.findIndex((item) => item.product_id === product.id);

    if (existingIndex >= 0) {
      const existingItem = items[existingIndex];
      const newQty = existingItem.quantity + quantity;
      const taxPercent = existingItem.tax_percent;
      const piecesPerPkg = existingItem.pieces_per_package;
      const baseAmount = (unitPrice * piecesPerPkg * newQty) - existingItem.discount;
      const updatedItem = {
        ...existingItem,
        quantity: newQty,
        total_pieces: newQty * piecesPerPkg,
        unit_price: unitPrice,
        tax: (baseAmount * taxPercent) / 100,
        subtotal: baseAmount + (baseAmount * taxPercent) / 100,
      };
      const otherItems = items.filter((_, i) => i !== existingIndex);
      setItems([updatedItem, ...otherItems]);
    } else {
      const piecesPerPkg = product.pieces_per_package || 1;
      const taxPercent = parseFloat(String(product.tax_percent)) || 0;
      const totalPieces = quantity * piecesPerPkg;
      const baseAmount = unitPrice * totalPieces;
      const taxAmount = (baseAmount * taxPercent) / 100;
      const unitName = product.unit_buy?.name || t('purchases.pfUnit');

      const newItem: PurchaseItem = {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode || '',
        quantity: quantity,
        extra_pieces: 0,
        pieces_per_package: piecesPerPkg,
        total_pieces: totalPieces,
        unit_price: unitPrice,
        original_price: Number(product.cost_price) || 0,
        selling_price: sellingPrice > 0 ? sellingPrice : undefined,
        unit_name: unitName,
        discount: 0,
        tax_percent: taxPercent,
        tax: taxAmount,
        subtotal: baseAmount + taxAmount,
      };
      setItems([newItem, ...items]);
    }

    setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0, sellingPrice: 0, categoryPrices: {} });
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

  const updateItem = (index: number, field: 'quantity' | 'extra_pieces' | 'unit_price' | 'discount' | 'price_mode', value: number | 'piece' | 'carton') => {
    const updated = [...items];
    const piecesPerPkg = updated[index].pieces_per_package || 1;

    // Clamp extra_pieces to 0..ppp-1
    if (field === 'extra_pieces' && typeof value === 'number') {
      value = Math.max(0, Math.min(value, piecesPerPkg - 1));
    }

    updated[index] = { ...updated[index], [field]: value } as typeof updated[number];

    // Recalculate: price × total_pieces - discount + tax
    const quantity = updated[index].quantity || 0;
    const extraPieces = updated[index].extra_pieces || 0;
    const unitPrice = updated[index].unit_price || 0; // Price per 1 piece
    const discount = updated[index].discount || 0;
    const taxPercent = updated[index].tax_percent || 0;

    const totalPieces = (quantity * piecesPerPkg) + extraPieces;
    updated[index].total_pieces = totalPieces;
    // baseAmount = price × totalPieces - discount
    const baseAmount = (unitPrice * totalPieces) - discount;
    updated[index].tax = (baseAmount * taxPercent) / 100;
    updated[index].subtotal = baseAmount + updated[index].tax;

    setItems(updated);
  };

  const updateTotalPieces = (index: number, newTotalPieces: number) => {
    const updated = [...items];
    const ppp = updated[index].pieces_per_package || 1;
    const newCartons = Math.floor(newTotalPieces / ppp);
    const newExtra = newTotalPieces % ppp;

    updated[index].quantity = newCartons;
    updated[index].extra_pieces = newExtra;
    updated[index].total_pieces = newTotalPieces;

    // Recalculate subtotal
    const unitPrice = updated[index].unit_price || 0;
    const discount = updated[index].discount || 0;
    const taxPercent = updated[index].tax_percent || 0;
    const baseAmount = (unitPrice * newTotalPieces) - discount;
    updated[index].tax = (baseAmount * taxPercent) / 100;
    updated[index].subtotal = baseAmount + updated[index].tax;

    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const discountAmount = discountMode === 'percent'
    ? (totalAmount * (Number(discount) || 0)) / 100
    : (Number(discount) || 0);
  const afterDiscount = totalAmount - discountAmount;
  const taxAmount = taxMode === 'percent'
    ? (afterDiscount * (Number(tax) || 0)) / 100
    : (Number(tax) || 0);
  const timbreAmount = afterDiscount * ((Number(timbre) || 0) / 100);
  const grandTotal = Math.max(0, afterDiscount + taxAmount + (Number(shipping) || 0) + timbreAmount);

  // Calculate how payment is applied
  // previousDebt = what we already owe the supplier BEFORE this purchase.
  // In edit mode, the supplier balance already includes this purchase's
  // due_amount — subtract it to avoid double-counting.
  const rawSupplierBalance = Number(supplierDebt?.balance) || 0;
  const previousDebt = isEditMode
    ? Math.max(0, rawSupplierBalance - originalDueAmount)
    : rawSupplierBalance;
  const currentPaidAmount = Number(paidAmount) || 0;

  // If paid more than current purchase, extra goes to previous debt
  const appliedToCurrentPurchase = Math.min(currentPaidAmount, grandTotal);
  const appliedToPreviousDebt = Math.max(0, currentPaidAmount - grandTotal);
  const remainingFromPurchase = grandTotal - appliedToCurrentPurchase;
  const remainingPreviousDebt = Math.max(0, previousDebt - appliedToPreviousDebt);
  const totalRemainingDebt = remainingFromPurchase + remainingPreviousDebt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && purchaseId) {
      // Edit mode - send full data including items
      if (items.length === 0) {
        toast.error(t('purchases.addAtLeastOneProduct'));
        return;
      }
      setIsSaving(true);
      try {
        // Update product prices if changed
        for (const item of items) {
          if (item.unit_price !== item.original_price) {
            try {
              await productsApi.update(item.product_id, { cost_price: item.unit_price });
            } catch (error) {
              console.error(`Failed to update price for product ${item.product_id}:`, error);
            }
          }
        }

        await purchasesApi.update(purchaseId, {
          supplier_id: supplierId ? parseInt(supplierId) : null,
          warehouse_id: parseInt(warehouseId),
          date,
          discount: discountAmount,
          tax: taxAmount,
          shipping,
          timbre: timbreAmount,
          timbre_percentage: timbre,
          note,
          paid_amount: paidAmount,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.total_pieces,
            unit_price: item.unit_price,
            discount: item.discount,
            tax: item.tax,
          })),
        });

        toast.success(t('purchases.pfInvoiceUpdated'));
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard/purchases');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || t('purchases.pfInvoiceUpdateError'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Create mode validation
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
      // Update product prices if changed
      for (const item of items) {
        if (item.unit_price !== item.original_price) {
          try {
            await productsApi.update(item.product_id, { cost_price: item.unit_price });
          } catch (error) {
            console.error(`Failed to update price for product ${item.product_id}:`, error);
          }
        }
      }

      await purchasesApi.create({
        supplier_id: supplierId ? parseInt(supplierId) : null,
        warehouse_id: parseInt(warehouseId),
        date,
        discount: discountAmount,
        tax: taxAmount,
        shipping,
        timbre: timbreAmount,
        timbre_percentage: timbre,
        note,
        paid_amount: paidAmount,
        status: 'received',
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.total_pieces,
          unit_price: item.unit_price,
          discount: item.discount,
          tax: item.tax,
        })),
      });

      toast.success(t('purchases.pfInvoiceCreated'));
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/purchases');
      }
    } catch (error) {
      toast.error(t('purchases.pfInvoiceCreateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
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
      await purchasesApi.create({
        supplier_id: supplierId ? parseInt(supplierId) : null,
        warehouse_id: parseInt(warehouseId),
        date,
        discount: discountAmount,
        tax: taxAmount,
        shipping,
        timbre: timbreAmount,
        timbre_percentage: timbre,
        note,
        paid_amount: paidAmount,
        status: 'pending',
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.total_pieces,
          unit_price: item.unit_price,
          discount: item.discount,
          tax: item.tax,
        })),
      });
      toast.success(t('purchases.pfDraftSaved'));
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/purchases');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('purchases.pfDraftSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatStockQty = (stockPieces: number, ppp: number): string => {
    const total = Math.floor(stockPieces);
    if (!ppp || ppp <= 1) return String(total);
    const cartons = Math.floor(total / ppp);
    const pieces = total % ppp;
    if (cartons > 0 && pieces > 0) return `${cartons} ${t('purchases.pfPerCarton')} ${pieces} ${t('purchases.pfPerPiece')}`;
    if (cartons > 0) return `${cartons} ${t('purchases.pfPerCarton')}`;
    if (pieces > 0) return `${pieces} ${t('purchases.pfPerPiece')}`;
    return '0';
  };

  const formatCurrency = (value: number) => {
    const safeValue = isNaN(value) ? 0 : value;
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(safeValue);
  };

  // When a supplier is selected, filter to that supplier's products plus
  // products with no supplier set (so unassigned legacy inventory still shows).
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
      {/* Keyboard Shortcuts Bar */}
      <div className="bg-gradient-to-l from-slate-800 to-slate-900 text-white px-5 py-2.5 rounded-xl mb-5 hidden sm:flex items-center gap-5 text-sm shadow-sm" data-tour="pf-shortcuts">
        <span className="font-bold text-slate-300 text-xs tracking-wide">{t('purchases.pfShortcuts')}</span>
        <div className="w-px h-4 bg-slate-700" />
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono text-blue-300">F1</kbd> <span className="text-slate-400">{t('purchases.pfShortcutSupplier')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono text-blue-300">F2</kbd> <span className="text-slate-400">{t('purchases.pfShortcutProduct')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono text-emerald-300">F3</kbd> <span className="text-slate-400">{t('purchases.pfShortcutAmount')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono text-amber-300">F4</kbd> <span className="text-slate-400">{t('purchases.pfShortcutSave')}</span></span>
        <div className="w-px h-4 bg-slate-700" />
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono">↑↓</kbd> <span className="text-slate-400">{t('purchases.pfShortcutNavigate')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono">Enter</kbd> <span className="text-slate-400">{t('purchases.pfShortcutConfirm')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono">Esc</kbd> <span className="text-slate-400">{t('purchases.pfShortcutClose')}</span></span>
        <button
          onClick={() => setShowTour(true)}
          className={`${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors`}
          title={t('common.guidedTour')}
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
          <span className="text-slate-400">{t('purchases.pfTourBtn')}</span>
        </button>
      </div>

      {/* Quick Entry Modal — same enterprise design as SaleForm.
         Purchases ADD to stock, so we don't validate stock here, but we
         still show current stock at the top as useful context (so the
         user knows "I have 0, buying 50, will end with 50"). */}
      {quickEntryModal.show && quickEntryModal.product && (() => {
        const product = quickEntryModal.product;
        const ppp = product.pieces_per_package || 1;
        const currentStock = warehouseStock[product.id] || 0;
        const requestedPieces = (quickEntryModal.quantity || 0) * ppp;
        const sortedCats = clientCategories.slice().sort((a, b) => a.id - b.id);

        const stockDot = currentStock <= 0
          ? 'metric-dot-red'
          : currentStock < ppp * 5
          ? 'metric-dot-orange'
          : 'metric-dot-green';

        const closeModal = () => {
          setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0, sellingPrice: 0, categoryPrices: {} });
          barcodeInputRef.current?.focus();
        };

        const canConfirm = (quickEntryModal.quantity || 0) > 0;

        return (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={closeModal} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200 dark:border-gray-700">
                <header className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate">{product.name}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-gray-600 dark:text-gray-400">
                    <span className={`metric-dot ${stockDot}`} aria-hidden />
                    {warehouseId
                      ? `${t('purchases.pfAvailable')} ${formatStockQty(currentStock, ppp)}`
                      : t('purchases.selectWarehouseFirst')}
                  </div>
                </header>
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <label className="flex items-center justify-between text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      <span>{t('purchases.pfQtyLabel')}</span>
                      {ppp > 1 && (quickEntryModal.quantity || 0) > 0 && (
                        <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400 tnum">
                          = {requestedPieces} {t('purchases.pfPerPiece')}
                        </span>
                      )}
                    </label>
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
                          closeModal();
                        }
                      }}
                      className="input w-full text-center text-[15px] font-semibold tnum"
                      min="1"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('purchases.pfPurchasePricePerPiece')}</label>
                    <input
                      ref={quickPriceRef}
                      type="number"
                      value={quickEntryModal.unitPrice}
                      onChange={(e) => setQuickEntryModal(prev => ({ ...prev, unitPrice: Number(e.target.value) || 0 }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (canConfirm) confirmQuickEntry();
                        } else if (e.key === 'Escape') {
                          closeModal();
                        }
                      }}
                      className="input w-full text-center text-[15px] font-semibold tnum"
                      min="0"
                      step="0.01"
                    />
                    {ppp > 1 && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-center tnum">
                        {t('purchases.pfCartonPrice')} {formatCurrency(quickEntryModal.unitPrice * ppp)}
                      </p>
                    )}
                  </div>

                  {/* Category prices (purchase-specific feature) */}
                  {sortedCats.length > 0 && (
                    <div className="surface-pro !p-3 space-y-2">
                      <p className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
                        {t('purchases.pfSellingPricesPerPiece')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sortedCats.map((cat, catIdx) => (
                          <div key={cat.id}>
                            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">{cat.name}</label>
                            <input
                              ref={(el) => { catPriceRefs.current[cat.id] = el; if (catIdx === 0 && !quickSellingRef.current) quickSellingRef.current = el; }}
                              type="number"
                              value={quickEntryModal.categoryPrices[cat.id] || ''}
                              onChange={(e) => setQuickEntryModal(prev => ({
                                ...prev,
                                categoryPrices: { ...prev.categoryPrices, [cat.id]: Number(e.target.value) || 0 }
                              }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (canConfirm) confirmQuickEntry();
                                } else if (e.key === 'Escape') {
                                  closeModal();
                                }
                              }}
                              className="input w-full text-center text-[13px] py-1.5 tnum"
                              min="0"
                              placeholder="0.00"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-center">
                    <div className="text-[15px] font-semibold text-gray-900 dark:text-white tnum">
                      {t('purchases.pfTotalSum')} {formatCurrency(quickEntryModal.unitPrice * ppp * quickEntryModal.quantity)}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      ({quickEntryModal.unitPrice} × {ppp} {t('purchases.pfPerPiece')} × {quickEntryModal.quantity})
                    </div>
                  </div>
                </main>
                <footer className="flex gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={confirmQuickEntry}
                    disabled={!canConfirm}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-md text-white bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('purchases.pfAddBtn')}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </footer>
              </div>
            </div>
          </>
        );
      })()}

      {/* Header */}
      {onCancel ? (
        <div className="mb-4">
          <h1 className="text-[20px] md:text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight leading-tight">
            {isEditMode ? t('purchases.editInvoice') : t('purchases.newPurchaseInvoice')}
          </h1>
          <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
            {isEditMode ? t('purchases.editInvoiceDesc') : t('purchases.newInvoiceDesc')}
          </p>
        </div>
      ) : (
        <PageHeader
          title={isEditMode ? t('purchases.editInvoice') : t('purchases.newPurchaseInvoice')}
          subtitle={isEditMode ? t('purchases.editInvoiceDesc') : t('purchases.newInvoiceDesc')}
          breadcrumb={[
            { label: t('purchases.title'), href: '/dashboard/purchases' },
            { label: isEditMode ? t('purchases.editInvoice') : t('purchases.newPurchaseInvoice') },
          ]}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Basic Info */}
            <div className="surface-pro" data-tour="pf-info">
              <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700">
                <h2 className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{t('purchases.pfInvoiceInfo')}</h2>
              </div>
              <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.pfSupplier')}</label>
                  <input
                    ref={supplierSearchRef}
                    type="text"
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                      if (!e.target.value) {
                        setSupplierId('');
                        setSupplierDebt(null);
                      }
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    onKeyDown={(e) => {
                      const filtered = suppliers.filter(s =>
                        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                        (s.phone && s.phone.includes(supplierSearch))
                      ).slice(0, 10);
                      const maxIndex = filtered.length; // 0 = no supplier, 1+ = filtered suppliers

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
                          setSupplierDebt(null);
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
                    placeholder={t('purchases.pfSearchSupplierPlaceholder')}
                    className="input w-full"
                    autoComplete="off"
                  />
                  {showSupplierDropdown && (
                    <div ref={supplierListRef} className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className={`px-3 py-2 cursor-pointer border-b dark:border-gray-700 ${supplierHighlightIndex === 0 ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        onClick={() => {
                          setSupplierId('');
                          setSupplierSearch('');
                          setSupplierDebt(null);
                          setShowSupplierDropdown(false);
                          setSupplierHighlightIndex(-1);
                        }}
                      >
                        <span className="text-gray-500 dark:text-gray-400">{t('purchases.pfNoSupplier')}</span>
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
                            className={`px-3 py-2 cursor-pointer ${supplierHighlightIndex === index + 1 ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-blue-50 dark:hover:bg-gray-700'}`}
                            onClick={() => {
                              setSupplierId(supplier.id.toString());
                              setSupplierSearch(supplier.name);
                              setShowSupplierDropdown(false);
                              setSupplierHighlightIndex(-1);
                            }}
                          >
                            <div className="font-medium">{supplier.name}</div>
                            {supplier.phone && <div className="text-sm text-gray-500">{supplier.phone}</div>}
                          </div>
                        ))}
                      {suppliers.filter(s =>
                        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                        (s.phone && s.phone.includes(supplierSearch))
                      ).length === 0 && !newSupplierName && (
                        <div className="px-3 py-2 text-gray-400 text-sm text-center">{t('purchases.pfNoResults')}</div>
                      )}
                      {/* Inline create supplier */}
                      <div className="border-t border-gray-100 p-2.5">
                        {newSupplierName || suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || (s.phone && s.phone.includes(supplierSearch))).length === 0 ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newSupplierName || (supplierSearch && !suppliers.some(s => s.name === supplierSearch) ? supplierSearch : '')}
                              onChange={(e) => setNewSupplierName(e.target.value)}
                              onFocus={() => { if (!newSupplierName && supplierSearch) setNewSupplierName(supplierSearch); }}
                              placeholder={t('purchases.pfNewSupplierNamePlaceholder')}
                              className="input w-full text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <input
                              type="text"
                              value={newSupplierPhone}
                              onChange={(e) => setNewSupplierPhone(e.target.value)}
                              placeholder={t('purchases.pfPhonePlaceholder')}
                              className="input w-full text-sm"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSupplier(); } }}
                            />
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCreateSupplier(); }}
                                disabled={creatingSupplier}
                                className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {creatingSupplier ? '...' : t('purchases.pfCreateSupplier')}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setNewSupplierName(''); setNewSupplierPhone(''); }}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setNewSupplierName(supplierSearch || ''); }}
                            className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2 justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            {t('purchases.pfCreateNewSupplier')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Click outside to close */}
                  {showSupplierDropdown && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSupplierDropdown(false)}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.pfWarehouse')}</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setCreatingWarehouse(true);
                        setWarehouseId('');
                      } else {
                        setWarehouseId(e.target.value);
                      }
                    }}
                    className="select w-full text-[14px] py-2"
                    required={!creatingWarehouse}
                  >
                    <option value="">{t('purchases.pfChooseWarehouse')}</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                    <option value="__new__">{t('purchases.pfCreateNewWarehouse')}</option>
                  </select>
                  {creatingWarehouse && (
                    <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
                      <input
                        type="text"
                        value={newWarehouseName}
                        onChange={(e) => setNewWarehouseName(e.target.value)}
                        placeholder={t('purchases.pfNewWarehouseNamePlaceholder')}
                        className="input w-full text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateWarehouse(); } else if (e.key === 'Escape') { setCreatingWarehouse(false); setNewWarehouseName(''); } }}
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={handleCreateWarehouse}
                          className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          {t('purchases.pfCreate')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCreatingWarehouse(false); setNewWarehouseName(''); }}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.pfDate')}</label>
                  <DateInput
                    value={date}
                    onChange={(v) => setDate(v)}
                    className="w-full"
                    required
                  />
                </div>
              </div>

              {/* Supplier Debt Info */}
              {supplierId && (
                <div className="mt-4 p-4 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/80 dark:border-blue-800 rounded-xl">
                  {loadingDebt ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">{t('purchases.pfLoadingDebt')}</div>
                  ) : supplierDebt ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-800 dark:text-blue-300">{t('purchases.pfSupplierDebt')}</span>
                        <span className={`font-bold text-lg ${supplierDebt.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(supplierDebt.balance)}
                        </span>
                      </div>
                      {supplierDebt.unpaid_purchases && supplierDebt.unpaid_purchases.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">{t('purchases.pfUnpaidInvoices')}</div>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {supplierDebt.unpaid_purchases.slice(0, 5).map((purchase) => (
                              <div key={purchase.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">{purchase.reference}</span>
                                <span className="text-red-600">{formatCurrency(purchase.due_amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-green-600 dark:text-green-400">{t('purchases.pfNoPreviousDebt')}</div>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Product Search */}
            <div className="surface-pro" data-tour="pf-products">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <h2 className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{t('purchases.pfAddProducts')}</h2>
                  {items.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 tnum">
                      <span className="metric-dot metric-dot-neutral" aria-hidden />
                      {items.length} {t('purchases.pfProduct')}
                    </span>
                  )}
                </div>
                {/* Search Mode Toggle */}
                <div className="flex items-center gap-2.5">
                  <span className={`text-[12px] ${searchMode === 'barcode' ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-400'}`}>{t('purchases.pfBarcode')}</span>
                  <button
                    type="button"
                    onClick={toggleSearchMode}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                      searchMode === 'name' ? 'bg-gray-700 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    style={{ direction: 'ltr' }}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white dark:bg-gray-900 transition-all duration-200 ${
                        searchMode === 'name' ? 'mr-1 ml-auto' : 'ml-1 mr-auto'
                      }`}
                    />
                  </button>
                  <span className={`text-[12px] ${searchMode === 'name' ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-400'}`}>{t('purchases.pfName')}</span>
                </div>
              </div>

              <div className="px-4 pt-3 pb-0 mb-3">
                {searchMode === 'barcode' ? (
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.pfBarcodeSearch')}</label>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={handleBarcodeSearch}
                      className="input w-full"
                      placeholder={t('purchases.pfScanBarcode')}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.pfNameSearch')}</label>
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
                          const newIndex = Math.min(productHighlightIndex + 1, maxIndex);
                          setProductHighlightIndex(newIndex);
                          // Scroll to highlighted item
                          setTimeout(() => {
                            const item = productListRef.current?.querySelector(`[data-index="${newIndex}"]`);
                            item?.scrollIntoView({ block: 'nearest' });
                          }, 0);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const newIndex = Math.max(productHighlightIndex - 1, 0);
                          setProductHighlightIndex(newIndex);
                          // Scroll to highlighted item
                          setTimeout(() => {
                            const item = productListRef.current?.querySelector(`[data-index="${newIndex}"]`);
                            item?.scrollIntoView({ block: 'nearest' });
                          }, 0);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          const products = filteredProducts.slice(0, 10);
                          if (productHighlightIndex >= 0 && products[productHighlightIndex]) {
                            openQuickEntryModal(products[productHighlightIndex]);
                            setProductHighlightIndex(-1);
                          } else if (products.length === 1) {
                            openQuickEntryModal(products[0]);
                            setProductHighlightIndex(-1);
                          }
                        }
                      }}
                      className="input w-full"
                      placeholder={t('purchases.pfSearchProduct')}
                      autoFocus
                    />
                    {showProductSearch && searchTerm && (
                      <div ref={productListRef} className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="p-3 text-gray-500 text-center">{t('purchases.pfNoProductResults')}</div>
                        ) : (
                          filteredProducts.slice(0, 10).map((product, index) => {
                            const piecesPerPkg = product.pieces_per_package || 1;
                            const unitPrice = Number(product.cost_price) || 0;
                            const unitName = product.unit_buy?.short_name || t('purchases.pfUnit');
                            const isHighlighted = productHighlightIndex === index;
                            return (
                              <button
                                key={product.id}
                                type="button"
                                data-index={index}
                                onClick={() => openQuickEntryModal(product)}
                                className={`w-full p-3 ${dir === 'rtl' ? 'text-right' : 'text-left'} border-b last:border-b-0 ${isHighlighted ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              >
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500 flex justify-between">
                                  <span>{product.barcode}</span>
                                  <span>
                                    {formatCurrency(unitPrice)} / {t('purchases.pfPerPiece')}
                                    {piecesPerPkg > 1 && (
                                      <span className={`text-blue-500 dark:text-blue-400 ${dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>({formatCurrency(unitPrice * piecesPerPkg)} / {t('purchases.pfPerCarton')})</span>
                                    )}
                                  </span>
                                </div>
                                {warehouseId && (
                                  <div className="text-xs text-blue-600 dark:text-blue-400">
                                    {t('purchases.pfAvailable')} {formatStockQty(warehouseStock[product.id] || 0, piecesPerPkg)}
                                  </div>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="px-4 pb-4" data-tour="pf-items">
                <div className="table-pro-wrap">
                <table className="table-pro compact">
                  <thead>
                    <tr>
                      <th className="text-center w-10">#</th>
                      <th>{t('purchases.pfDesignation')}</th>
                      <th className="text-center w-24">{t('purchases.pfStockAvail')}</th>
                      <th className="text-center w-[120px]">{t('purchases.pfQtyCol')}</th>
                      <th className="text-center w-20">{t('purchases.pfUnitCol')}</th>
                      <th className="text-center w-[100px]">{t('purchases.pfCountCol')}</th>
                      <th className="text-center w-[120px]">{t('purchases.pfUnitPriceCol')}</th>
                      <th className="text-center w-[100px]">{t('purchases.pfDiscountCol')}</th>
                      <th className="text-center w-16">TVA</th>
                      <th className="text-center w-[110px]">{t('purchases.pfAmountCol')}</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-semibold">{t('purchases.pfNoProductsYet')}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('purchases.pfSearchHint')}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={index} className="group">
                          <td className="text-center tnum t-muted">{index + 1}</td>
                          <td>
                            <div className="t-strong">{item.product_name}</div>
                            <div className="text-[11px] text-gray-500">{item.barcode}</div>
                          </td>
                          <td className="text-center tnum">
                            {warehouseId ? (
                              <span className="text-gray-700 dark:text-gray-200 font-medium">
                                {formatStockQty(warehouseStock[item.product_id] || 0, item.pieces_per_package)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <div className="space-y-1">
                              {/* Cartons */}
                              <div className="flex items-center gap-1.5">
                                <input
                                  ref={(el) => { inputRefs.current[`${index}-quantity`] = el; }}
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', Math.max(0, parseInt(e.target.value) || 0))}
                                  onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                                  className="input w-full !px-2 text-center text-[13px] py-1 font-semibold tnum"
                                  min="0"
                                />
                                {item.pieces_per_package > 1 && (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">crt</span>
                                )}
                              </div>
                              {/* Extra pieces (only if ppp > 1) */}
                              {item.pieces_per_package > 1 && (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    ref={(el) => { inputRefs.current[`${index}-extra_pieces`] = el; }}
                                    type="number"
                                    value={item.extra_pieces}
                                    onChange={(e) => updateItem(index, 'extra_pieces', parseInt(e.target.value) || 0)}
                                    onKeyDown={(e) => handleKeyDown(e, index, 'extra_pieces')}
                                    className="input w-full !px-2 text-center text-[13px] py-1 font-semibold tnum"
                                    min="0"
                                    max={item.pieces_per_package - 1}
                                  />
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">pc</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-center tnum">
                            <div className="t-strong">{item.pieces_per_package}</div>
                            <div className="text-[11px] text-gray-500">{item.unit_name}</div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              ref={(el) => { inputRefs.current[`${index}-total_pieces`] = el; }}
                              type="number"
                              value={item.total_pieces}
                              onChange={(e) => updateTotalPieces(index, Math.max(0, parseInt(e.target.value) || 0))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const nextRef = inputRefs.current[`${index}-unit_price`];
                                  nextRef?.focus();
                                  nextRef?.select();
                                }
                              }}
                              className="input w-full !px-2 text-center text-[13px] py-1 font-semibold tnum"
                              min="0"
                            />
                          </td>
                          <td className="px-2 py-2">
                            {item.pieces_per_package > 1 && (
                              <div className="flex items-center justify-center gap-0.5 mb-1">
                                <button
                                  type="button"
                                  onClick={() => updateItem(index, 'price_mode', 'piece')}
                                  className={`text-[9px] px-1.5 py-0.5 rounded ${(item.price_mode ?? 'piece') === 'piece' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                                >قطعة</button>
                                <button
                                  type="button"
                                  onClick={() => updateItem(index, 'price_mode', 'carton')}
                                  className={`text-[9px] px-1.5 py-0.5 rounded ${item.price_mode === 'carton' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                                >كرتون</button>
                              </div>
                            )}
                            <input
                              ref={(el) => { inputRefs.current[`${index}-unit_price`] = el; }}
                              type="number"
                              value={item.price_mode === 'carton' ? +(item.unit_price * item.pieces_per_package).toFixed(2) : item.unit_price}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value) || 0;
                                const ppp = Math.max(1, item.pieces_per_package || 1);
                                const perPiece = item.price_mode === 'carton' ? v / ppp : v;
                                updateItem(index, 'unit_price', perPiece);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, index, 'unit_price')}
                              className="input w-full text-center"
                              min="0"
                              step="0.01"
                            />
                            {item.pieces_per_package > 1 && (
                              <div className="text-[10px] text-blue-500 dark:text-blue-400 text-center mt-0.5">
                                {item.price_mode === 'carton'
                                  ? `${formatCurrency(item.unit_price)}/${t('purchases.pfPerPiece') || 'قطعة'}`
                                  : `${formatCurrency(item.unit_price * item.pieces_per_package)}/${t('purchases.pfPerCarton')}`}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              ref={(el) => { inputRefs.current[`${index}-discount`] = el; }}
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'discount')}
                              className="input w-full text-center"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="text-center tnum">
                            <div className="t-strong">{item.tax_percent}%</div>
                            <div className="text-gray-500 text-[11px]">{formatCurrency(item.tax)}</div>
                          </td>
                          <td className="text-center tnum t-strong">
                            {formatCurrency(item.subtotal)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-60 group-hover:opacity-100 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="px-4 pb-3 text-[11px] text-gray-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t('purchases.pfEnterNextField')}
              </div>
            </div>

            {/* Notes */}
            <div className="surface-pro p-4">
              <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('purchases.pfNotes')}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input w-full text-[14px] py-2"
                rows={2}
                placeholder={t('purchases.pfAddNotes')}
              />
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div>
            <div className="surface-pro sticky top-24" data-tour="pf-summary">
              <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700">
                <h2 className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{t('purchases.pfInvoiceSummary')}</h2>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('purchases.pfProductsTotal', { count: items.length })}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(totalAmount)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-gray-400">{t('purchases.pfDiscountLabel')}</label>
                      <div className="flex gap-0.5">
                        <button type="button" onClick={() => setDiscountMode('amount')} className={`text-[9px] px-1.5 py-0.5 rounded ${discountMode === 'amount' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'}`}>د.ج</button>
                        <button type="button" onClick={() => setDiscountMode('percent')} className={`text-[9px] px-1.5 py-0.5 rounded ${discountMode === 'percent' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'}`}>%</button>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="input w-full text-center text-sm"
                      min="0"
                      step="0.01"
                    />
                    {discountMode === 'percent' && discount > 0 && (
                      <div className="text-[10px] text-gray-400 mt-0.5 text-center">= {formatCurrency(discountAmount)}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-gray-400">{t('purchases.pfTaxLabel')}</label>
                      <div className="flex gap-0.5">
                        <button type="button" onClick={() => setTaxMode('amount')} className={`text-[9px] px-1.5 py-0.5 rounded ${taxMode === 'amount' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'}`}>د.ج</button>
                        <button type="button" onClick={() => setTaxMode('percent')} className={`text-[9px] px-1.5 py-0.5 rounded ${taxMode === 'percent' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'}`}>%</button>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      className="input w-full text-center text-sm"
                      min="0"
                      step="0.01"
                    />
                    {taxMode === 'percent' && tax > 0 && (
                      <div className="text-[10px] text-gray-400 mt-0.5 text-center">= {formatCurrency(taxAmount)}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t('purchases.pfShippingLabel')}</label>
                    <input
                      type="number"
                      value={shipping}
                      onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                      className="input w-full text-center text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">{locale === 'ar' ? 'الطابع %' : 'Timbre %'}</label>
                    <input
                      type="number"
                      value={timbre}
                      onChange={(e) => setTimbre(parseFloat(e.target.value) || 0)}
                      className="input w-full text-center text-sm"
                      min="0"
                      step="0.01"
                    />
                    {timbre > 0 && (
                      <div className="text-[10px] text-gray-400 mt-0.5 text-center">= {formatCurrency(timbreAmount)}</div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700" />

                <div className="flex justify-between items-center p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{t('purchases.pfFinalTotal')}</span>
                  <span className="text-[16px] font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(grandTotal)}</span>
                </div>

                {/* Payment Section */}
                <div className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('purchases.pfPaidAmount')}</label>
                  <input
                    ref={paidAmountRef}
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="input w-full text-[15px] font-semibold text-center tnum py-2"
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                  {supplierId && previousDebt > 0 && (
                    <div className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 text-center">
                      {t('purchases.pfPayMoreHint')}
                    </div>
                  )}
                </div>

                {/* Payment Breakdown */}
                {supplierId && supplierDebt ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-gray-700/50 border border-slate-200/60 dark:border-gray-600 rounded-xl space-y-2">
                    {/* Summary at top */}
                    <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-gray-700 mb-2 space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{t('purchases.pfThisInvoice')}</span>
                        <span className="font-bold tabular-nums">{formatCurrency(grandTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{t('purchases.pfPreviousDebt')}</span>
                        <span className="font-bold text-red-600 tabular-nums">{formatCurrency(previousDebt)}</span>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-gray-600 my-1" />
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-slate-700 dark:text-slate-300">{t('purchases.pfTotalSum')}</span>
                        <span className="text-blue-700 dark:text-blue-400 tabular-nums">{formatCurrency(grandTotal + previousDebt)}</span>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">{t('purchases.pfPaymentDistribution', { amount: formatCurrency(currentPaidAmount) })}</div>

                    {currentPaidAmount > 0 ? (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{t('purchases.pfDeductedFromInvoice')}</span>
                          <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(appliedToCurrentPurchase)}</span>
                        </div>

                        {appliedToPreviousDebt > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">{t('purchases.pfDeductedFromPreviousDebt')}</span>
                            <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(appliedToPreviousDebt)}</span>
                          </div>
                        )}

                        <div className="h-px bg-slate-200" />
                      </>
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-1">{t('purchases.pfNoPaidAmount')}</div>
                    )}

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('purchases.pfInvoiceRemaining')}</span>
                      <span className={`font-semibold tabular-nums ${remainingFromPurchase > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(remainingFromPurchase)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('purchases.pfPreviousDebtRemaining')}</span>
                      <span className={`font-semibold tabular-nums ${remainingPreviousDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(remainingPreviousDebt)}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-gray-600" />

                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-gray-700">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t('purchases.pfTotalDebtAfterPayment')}</span>
                      <span className={`text-lg font-black tabular-nums ${totalRemainingDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(totalRemainingDebt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200/60 dark:border-gray-600 rounded-xl">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('purchases.pfRemainingFromInvoice')}</span>
                      <span className={`font-black tabular-nums ${remainingFromPurchase > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(remainingFromPurchase)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1" data-tour="pf-save">
                  <button
                    ref={submitBtnRef}
                    type="submit"
                    disabled={isSaving || items.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? t('purchases.saving') : t('purchases.saveInvoice')}
                    {!isSaving && <kbd className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">F4</kbd>}
                  </button>

                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSaving || items.length === 0}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? t('purchases.saving') : t('purchases.saveAsDraft')}
                    </button>
                  )}

                  {onCancel ? (
                    <button type="button" onClick={onCancel} className="w-full inline-flex items-center justify-center px-4 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {t('common.cancel')}
                    </button>
                  ) : (
                    <Link href="/dashboard/purchases" className="w-full inline-flex items-center justify-center px-4 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {t('common.cancel')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Click outside to close product search */}
      {showProductSearch && (
        <div className="fixed inset-0 z-0" onClick={() => setShowProductSearch(false)} />
      )}

      {showTour && (
        <GuidedTour
          steps={purchaseFormTourSteps}
          storageKey="purchase_form_tour_step"
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
