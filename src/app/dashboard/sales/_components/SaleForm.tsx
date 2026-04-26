'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DateInput from '@/components/ui/DateInput';
import { salesApi, productsApi, clientsApi, warehousesApi, clientCategoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import { useLocale } from '@/lib/i18n/context';

interface StockItem {
  quantity: number;
  warehouse_id: number;
}

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
  min_selling_price?: number;
  pieces_per_package?: number;
  unit_sale?: { id: number; name: string; short_name: string };
  stock?: StockItem[];
  category_prices?: ProductCategoryPrice[];
}

interface Client {
  id: number;
  name: string;
  code?: string;
  phone?: string;
  balance?: number;
  credit_limit?: number;
  is_active?: boolean;
  client_category_id?: number;
  client_category?: { id: number; name: string };
}

interface ClientDebtInfo {
  balance: number;
  credit_limit: number;
  available_credit: number;
  unpaid_orders?: Array<{
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

interface SaleItem {
  product_id: number;
  product_name: string;
  barcode: string;
  quantity: number; // Number of packages/units (cartons)
  extra_pieces: number; // Extra pieces (0 to pieces_per_package - 1)
  pieces_per_package: number; // Pieces per package
  total_pieces: number; // Total pieces = quantity * pieces_per_package + extra_pieces
  unit_price: number; // Price per 1 PIECE (not per package)
  original_price: number; // Original price per piece
  unit_name: string; // Unit name
  discount: number;
  tax: number;
  subtotal: number; // = unit_price × total_pieces - discount + tax
  available_stock: number;
  min_selling_price: number;
  cost_price: number;
}

interface SaleFormProps {
  saleId?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SaleForm({ saleId = null, onSuccess, onCancel }: SaleFormProps) {
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);

  const isEditMode = saleId !== null;
  const [showTour, setShowTour] = useState(false);

  const saleFormTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="sf-shortcuts"]',
      title: t('saleForm.tourShortcutsTitle'),
      desc: t('saleForm.tourShortcutsDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="sf-info"]',
      title: t('saleForm.tourInfoTitle'),
      desc: t('saleForm.tourInfoDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="sf-products"]',
      title: t('saleForm.tourProductsTitle'),
      desc: t('saleForm.tourProductsDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="sf-items"]',
      title: t('saleForm.tourItemsTitle'),
      desc: t('saleForm.tourItemsDesc'),
      position: 'top' as const,
    },
    {
      target: '[data-tour="sf-summary"]',
      title: t('saleForm.tourSummaryTitle'),
      desc: t('saleForm.tourSummaryDesc'),
      position: 'left' as const,
    },
    {
      target: '[data-tour="sf-save"]',
      title: t('saleForm.tourSaveTitle'),
      desc: t('saleForm.tourSaveDesc'),
      position: 'left' as const,
    },
  ], [t]);

  const [clients, setClients] = useState<Client[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientCategories, setClientCategories] = useState<ClientCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saleDataLoaded, setSaleDataLoaded] = useState(false);

  // Form state
  const [clientId, setClientId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [timbre, setTimbre] = useState<number>(0);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Client debt info
  const [clientDebt, setClientDebt] = useState<ClientDebtInfo | null>(null);
  const [loadingDebt, setLoadingDebt] = useState(false);

  // Client search
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientHighlightIndex, setClientHighlightIndex] = useState(-1);
  const [clientStatusFilter, setClientStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const clientSearchRef = useRef<HTMLInputElement>(null);
  const clientListRef = useRef<HTMLDivElement>(null);

  // Product search
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productHighlightIndex, setProductHighlightIndex] = useState(-1);
  const productListRef = useRef<HTMLDivElement>(null);

  // Search mode toggle (barcode or name) - saved to localStorage
  const [searchMode, setSearchMode] = useState<'barcode' | 'name'>('barcode');

  // Quick product entry modal
  const [quickEntryModal, setQuickEntryModal] = useState<{
    show: boolean;
    product: Product | null;
    quantity: number;
    unitPrice: number;
    categoryPrices: Record<number, number>;
  }>({ show: false, product: null, quantity: 1, unitPrice: 0, categoryPrices: {} });
  const quickQtyRef = useRef<HTMLInputElement>(null);
  const quickPriceRef = useRef<HTMLInputElement>(null);
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
      // Don't trigger if modal is open or typing in input
      if (quickEntryModal.show) return;

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          clientSearchRef.current?.focus();
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

  // Fetch client debt when client changes
  useEffect(() => {
    if (clientId) {
      fetchClientDebt(parseInt(clientId));
    } else {
      setClientDebt(null);
    }
  }, [clientId]);

  // Load sale data in edit mode - wait for clients and products to be loaded first
  useEffect(() => {
    if (isEditMode && saleId && clients.length > 0 && products.length > 0 && !saleDataLoaded) {
      loadSaleData(saleId);
    }
  }, [isEditMode, saleId, clients.length, products.length, saleDataLoaded]);

  const fetchData = async () => {
    try {
      const [clientsRes, warehousesRes, productsRes, catRes] = await Promise.all([
        clientsApi.getAll({ per_page: 1000 }),
        warehousesApi.getAll(),
        productsApi.getAll({ per_page: 1000 }),
        clientCategoriesApi.getAll().catch(() => ({ data: { data: [] } })),
      ]);
      setClients(clientsRes.data.data || clientsRes.data);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
      setProducts(productsRes.data.data || productsRes.data);
      setClientCategories(catRes.data.data || catRes.data || []);

      // Set default warehouse if only one
      const whs = warehousesRes.data.data || warehousesRes.data;
      if (whs.length === 1) {
        setWarehouseId(whs[0].id.toString());
      }
    } catch (error) {
      toast.error(t('saleForm.dataLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientDebt = async (id: number) => {
    setLoadingDebt(true);
    try {
      const [balanceRes, debtRes] = await Promise.all([
        clientsApi.getBalance(id),
        clientsApi.getSalesDebt(id).catch(() => ({ data: { sales: [], totals: { total_remaining: 0 } } }))
      ]);
      // Use the actual sum of unpaid sales, not the client balance
      // This is more accurate because client.balance might be out of sync
      const actualDebt = debtRes.data.totals?.total_remaining || 0;
      setClientDebt({
        balance: actualDebt,
        credit_limit: balanceRes.data.credit_limit || 0,
        available_credit: balanceRes.data.available_credit || 0,
        unpaid_orders: debtRes.data.sales || []
      });
    } catch (error) {
      console.error('Error fetching client debt:', error);
      setClientDebt(null);
    } finally {
      setLoadingDebt(false);
    }
  };

  const loadSaleData = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await salesApi.getOne(id);
      const sale = response.data;

      // Set form fields (only editable fields)
      setDiscount(sale.discount || 0);
      setTax(sale.tax_percentage || 0);
      setShipping(sale.shipping || 0);
      setTimbre(sale.timbre_percentage || 0);
      setNote(sale.note || '');
      setPaidAmount(sale.paid_amount || 0);

      // Set read-only fields
      if (sale.client_id) {
        setClientId(sale.client_id.toString());
        // Use client data from sale response or find in clients list
        const clientName = sale.client?.name || clients.find(c => c.id === sale.client_id)?.name || '';
        setClientSearch(clientName);
      } else {
        setClientId('');
        setClientSearch('');
      }
      setWarehouseId(sale.warehouse_id?.toString() || '');
      setDate(sale.date?.split(' ')[0] || new Date().toISOString().split('T')[0]);

      // Load items for edit mode
      if (sale.items && Array.isArray(sale.items)) {
        const wId = sale.warehouse_id ? parseInt(sale.warehouse_id) : null;
        const loadedItems: SaleItem[] = sale.items.map((item: any) => {
          const ppp = item.product?.pieces_per_package || 1;
          const totalPieces = Math.floor(Number(item.quantity) || 0);
          // Split integer pieces back into cartons + extra pieces
          const cartons = Math.floor(totalPieces / ppp);
          const extraPieces = totalPieces % ppp;
          // In edit mode: available = current warehouse stock + this item's original qty
          // (because the sale already deducted these pieces from stock)
          // Use products list (which has stock data) since sale API doesn't include stock
          const productFromList = products.find((p: Product) => p.id === item.product_id);
          const currentStock = wId && productFromList?.stock
            ? Number(productFromList.stock.find((s: StockItem) => s.warehouse_id === wId)?.quantity) || 0
            : 0;
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
            unit_name: item.product?.unit_sale?.short_name || t('saleForm.unit'),
            discount: item.discount || 0,
            tax: item.tax || 0,
            subtotal: item.subtotal || 0,
            available_stock: currentStock + totalPieces,
            min_selling_price: item.product?.min_selling_price || 0,
            cost_price: item.product?.cost_price || 0,
          };
        });
        setItems(loadedItems);
      }

      toast.success(t('saleForm.invoiceLoaded'));
      setSaleDataLoaded(true);
    } catch (error) {
      toast.error(t('saleForm.invoiceLoadError'));
      console.error('Error loading sale data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductStock = (product: Product): number => {
    if (!product.stock || !warehouseId) return 0;
    const warehouseStock = product.stock.find(s => s.warehouse_id === parseInt(warehouseId));
    return Number(warehouseStock?.quantity) || 0;
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Build field order dynamically based on whether item has ppp > 1
      const item = items[rowIndex];
      const hasPieces = item && (item.pieces_per_package || 1) > 1;
      const fieldOrder = hasPieces
        ? ['quantity', 'extra_pieces', 'total_pieces', 'unit_price', 'discount']
        : ['quantity', 'total_pieces', 'unit_price', 'discount'];
      const currentFieldIndex = fieldOrder.indexOf(field);

      if (currentFieldIndex < fieldOrder.length - 1) {
        // Move to next field in same row
        const nextField = fieldOrder[currentFieldIndex + 1];
        const nextRef = inputRefs.current[`${rowIndex}-${nextField}`];
        nextRef?.focus();
        nextRef?.select();
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
  }, [items]);

  const addProduct = (product: Product, quantity: number = 1) => {
    if (!warehouseId) {
      toast.error(t('saleForm.selectWarehouseFirst'));
      return;
    }

    const availableStock = getProductStock(product);
    const existingIndex = items.findIndex((item) => item.product_id === product.id);

    if (existingIndex >= 0) {
      const existingItem = items[existingIndex];
      const ppp = existingItem.pieces_per_package || 1;
      const newQty = existingItem.quantity + quantity;
      const newTotalPieces = (newQty * ppp) + (existingItem.extra_pieces || 0);
      if (newTotalPieces > availableStock) {
        toast.error(t('saleForm.availableQtyOnly', { qty: formatStockQty(availableStock, ppp) }));
        return;
      }
      const updatedItem = {
        ...existingItem,
        quantity: newQty,
        total_pieces: newTotalPieces
      };
      updatedItem.subtotal = calculateSubtotal(updatedItem);
      const otherItems = items.filter((_, i) => i !== existingIndex);
      setItems([updatedItem, ...otherItems]);
    } else {
      const piecesPerPkg = product.pieces_per_package || 1;
      const totalPieces = quantity * piecesPerPkg;
      if (availableStock < totalPieces) {
        toast.error(t('saleForm.productNotInStock', { name: product.name }));
        return;
      }
      const unitPrice = getDefaultPrice(product);
      const minUnitPrice = Number(product.min_selling_price) || 0;
      const unitName = product.unit_sale?.name || t('saleForm.unit');

      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        quantity: quantity,
        extra_pieces: 0,
        pieces_per_package: piecesPerPkg,
        total_pieces: totalPieces,
        unit_price: unitPrice, // Price per 1 piece
        original_price: unitPrice,
        unit_name: unitName,
        discount: 0,
        tax: 0,
        subtotal: unitPrice * totalPieces, // price × totalPieces
        available_stock: availableStock,
        min_selling_price: minUnitPrice,
        cost_price: Number(product.cost_price) || 0,
      };
      setItems([newItem, ...items]);
    }

    setSearchTerm('');
    setShowProductSearch(false);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Get available prices for a product as labeled chips
  // If client has a category, only show that category's price
  const getProductPrices = (product: Product): Array<{ label: string; price: number; color: string }> => {
    const prices: Array<{ label: string; price: number; color: string }> = [];
    const seen = new Set<number>();

    // If client has a category, show only the category price
    if (clientId) {
      const selectedClient = clients.find(c => c.id.toString() === clientId);
      if (selectedClient?.client_category_id && product.category_prices) {
        const categoryPrice = product.category_prices.find(
          cp => cp.client_category_id === selectedClient.client_category_id
        );
        if (categoryPrice && categoryPrice.price > 0) {
          const catName = selectedClient.client_category?.name ||
            clientCategories.find(c => c.id === selectedClient.client_category_id)?.name ||
            t('saleForm.clientCategory');
          prices.push({ label: catName, price: categoryPrice.price, color: 'amber' });
          return prices;
        }
      }
    }

    // No client category - show all prices
    const retailPrice = Number(product.retail_price) || 0;
    const wholesalePrice = Number(product.wholesale_price) || 0;

    if (wholesalePrice > 0 && !seen.has(wholesalePrice)) {
      prices.push({ label: t('saleForm.wholesale'), price: wholesalePrice, color: 'green' });
      seen.add(wholesalePrice);
    }
    if (retailPrice > 0 && !seen.has(retailPrice)) {
      prices.push({ label: t('saleForm.retail'), price: retailPrice, color: 'blue' });
      seen.add(retailPrice);
    }

    if (product.category_prices && product.category_prices.length > 0) {
      for (const cp of product.category_prices) {
        if (cp.price > 0 && !seen.has(cp.price)) {
          const catName = clientCategories.find(c => c.id === cp.client_category_id)?.name || t('saleForm.categoryLabel', { id: String(cp.client_category_id) });
          prices.push({ label: catName, price: cp.price, color: 'amber' });
          seen.add(cp.price);
        }
      }
    }

    return prices;
  };

  // Get best default price for a product (uses client category price if available)
  const getDefaultPrice = (product: Product): number => {
    // If a client is selected and has a category, use that category's price
    if (clientId) {
      const selectedClient = clients.find(c => c.id.toString() === clientId);
      if (selectedClient?.client_category_id && product.category_prices) {
        const categoryPrice = product.category_prices.find(
          cp => cp.client_category_id === selectedClient.client_category_id
        );
        if (categoryPrice && categoryPrice.price > 0) {
          return categoryPrice.price;
        }
      }
    }
    return Number(product.retail_price) || 0;
  };

  // Open quick entry modal for product
  const openQuickEntryModal = (product: Product) => {
    if (!warehouseId) {
      toast.error(t('saleForm.selectWarehouseFirst'));
      return;
    }
    setQuickEntryModal({
      show: true,
      product,
      quantity: 1,
      unitPrice: getDefaultPrice(product),
      categoryPrices: {},
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
      toast.error(t('saleForm.qtyMustBePositive'));
      return;
    }

    // Block if price is below cost price
    const costPrice = Number(product.cost_price) || 0;
    if (unitPrice > 0 && unitPrice < costPrice) {
      toast.error(t('saleForm.belowCostPrice', { price: String(costPrice) }));
      return;
    }

    const availableStock = getProductStock(product);
    const existingIndex = items.findIndex((item) => item.product_id === product.id);

    if (existingIndex >= 0) {
      const existingItem = items[existingIndex];
      const ppp = existingItem.pieces_per_package || 1;
      const newQty = existingItem.quantity + quantity;
      const newTotalPieces = (newQty * ppp) + (existingItem.extra_pieces || 0);
      if (newTotalPieces > availableStock) {
        toast.error(t('saleForm.availableQtyOnly', { qty: formatStockQty(availableStock, ppp) }));
        return;
      }
      const updatedItem = {
        ...existingItem,
        quantity: newQty,
        total_pieces: newTotalPieces,
        unit_price: unitPrice,
      };
      updatedItem.subtotal = calculateSubtotal(updatedItem);
      const otherItems = items.filter((_, i) => i !== existingIndex);
      setItems([updatedItem, ...otherItems]);
    } else {
      const piecesPerPkg = product.pieces_per_package || 1;
      const totalPieces = quantity * piecesPerPkg;
      if (availableStock < totalPieces) {
        toast.error(t('saleForm.availableQtyOnly', { qty: formatStockQty(availableStock, piecesPerPkg) }));
        return;
      }
      const minUnitPrice = Number(product.min_selling_price) || 0;
      const unitName = product.unit_sale?.name || t('saleForm.unit');

      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        quantity: quantity,
        extra_pieces: 0,
        pieces_per_package: piecesPerPkg,
        total_pieces: totalPieces,
        unit_price: unitPrice, // Price per 1 piece
        original_price: getDefaultPrice(product),
        unit_name: unitName,
        discount: 0,
        tax: 0,
        subtotal: unitPrice * totalPieces, // price × totalPieces
        available_stock: availableStock,
        min_selling_price: minUnitPrice,
        cost_price: costPrice,
      };
      setItems([newItem, ...items]);
    }

    setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0, categoryPrices: {} });
    barcodeInputRef.current?.focus();
  };

  const handleBarcodeSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const product = products.find((p) => p.barcode === barcodeInput.trim());
      if (product) {
        openQuickEntryModal(product);
      } else {
        toast.error(t('saleForm.productNotFound'));
      }
    }
  };

  const updateTotalPieces = (index: number, newTotalPieces: number) => {
    const updated = [...items];
    const ppp = updated[index].pieces_per_package || 1;
    const newCartons = Math.floor(newTotalPieces / ppp);
    const newExtra = newTotalPieces % ppp;

    // Check stock (both in pieces)
    if (newTotalPieces > updated[index].available_stock) {
      toast.error(t('saleForm.availableQtyOnly', { qty: formatStockQty(updated[index].available_stock, ppp) }));
      return;
    }

    updated[index].quantity = newCartons;
    updated[index].extra_pieces = newExtra;
    updated[index].total_pieces = newTotalPieces;
    updated[index].subtotal = calculateSubtotal(updated[index]);
    setItems(updated);
  };

  const updateItem = (index: number, field: 'quantity' | 'extra_pieces' | 'unit_price' | 'discount' | 'tax', value: number) => {
    const updated = [...items];
    let numValue = Number(value) || 0;
    const ppp = updated[index].pieces_per_package || 1;

    // Clamp extra_pieces to 0..ppp-1
    if (field === 'extra_pieces') {
      numValue = Math.max(0, Math.min(numValue, ppp - 1));
    }

    if (field === 'quantity' || field === 'extra_pieces') {
      const newQty = field === 'quantity' ? numValue : updated[index].quantity;
      const newExtra = field === 'extra_pieces' ? numValue : updated[index].extra_pieces;
      const totalPieces = (newQty * ppp) + newExtra;
      if (totalPieces > updated[index].available_stock) {
        toast.error(t('saleForm.availableQtyOnly', { qty: formatStockQty(updated[index].available_stock, ppp) }));
        return;
      }
      if (field === 'quantity') {
        updated[index].quantity = numValue;
      } else {
        updated[index].extra_pieces = numValue;
      }
      updated[index].total_pieces = (updated[index].quantity * ppp) + updated[index].extra_pieces;
    } else if (field === 'unit_price') {
      if (updated[index].cost_price > 0 && numValue > 0 && numValue < updated[index].cost_price) {
        toast.error(t('saleForm.belowCostPrice', { price: String(updated[index].cost_price) }));
        return;
      }
      updated[index].unit_price = numValue;
    } else if (field === 'discount') {
      updated[index].discount = numValue;
    } else if (field === 'tax') {
      updated[index].tax = numValue;
    }

    updated[index].subtotal = calculateSubtotal(updated[index]);
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = (item: SaleItem): number => {
    const qty = Number(item.quantity) || 0;
    const extraPieces = Number(item.extra_pieces) || 0;
    const price = Number(item.unit_price) || 0; // Price per 1 piece
    const piecesPerPkg = Number(item.pieces_per_package) || 1;
    const disc = Number(item.discount) || 0;
    const itemTax = Number(item.tax) || 0;
    // totalPieces = (qty × piecesPerPkg) + extraPieces
    const totalPieces = (qty * piecesPerPkg) + extraPieces;
    // subtotal = price × totalPieces - discount + tax
    return (price * totalPieces) - disc + itemTax;
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const afterDiscount = totalAmount - (Number(discount) || 0);
  const taxAmount = afterDiscount * ((Number(tax) || 0) / 100);
  const timbreAmount = afterDiscount * ((Number(timbre) || 0) / 100);
  const grandTotal = Math.max(0, afterDiscount + taxAmount + timbreAmount + (Number(shipping) || 0));

  // Calculate how payment is applied
  // previousDebt = what the client already owes us BEFORE this sale
  const previousDebt = Number(clientDebt?.balance) || 0;
  const currentPaidAmount = Number(paidAmount) || 0;

  // If paid more than current sale, extra goes to previous debt
  const appliedToCurrentSale = Math.min(currentPaidAmount, grandTotal);
  const appliedToPreviousDebt = Math.max(0, currentPaidAmount - grandTotal);
  const remainingFromSale = grandTotal - appliedToCurrentSale;
  const remainingPreviousDebt = Math.max(0, previousDebt - appliedToPreviousDebt);
  const totalRemainingDebt = remainingFromSale + remainingPreviousDebt;

  const buildSalePayload = (status: 'completed' | 'draft' = 'completed') => {
    return {
      client_id: clientId ? parseInt(clientId) : null,
      warehouse_id: parseInt(warehouseId),
      date,
      discount,
      tax: taxAmount,
      tax_percentage: tax,
      shipping,
      timbre: timbreAmount,
      timbre_percentage: timbre,
      note,
      paid_amount: paidAmount,
      status,
      items: items.map((item) => {
        const ppp = Number(item.pieces_per_package) || 1;
        const totalPieces = (item.quantity * ppp) + (item.extra_pieces || 0);
        return {
          product_id: item.product_id,
          quantity: totalPieces,
          unit_price: item.unit_price,
          discount: item.discount,
          tax: item.tax,
        };
      }),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && saleId) {
      // Edit mode - send items along with metadata
      setIsSaving(true);
      try {
        const ppp = (item: SaleItem) => Number(item.pieces_per_package) || 1;
        await salesApi.update(saleId, {
          client_id: clientId ? parseInt(clientId) : null,
          warehouse_id: warehouseId ? parseInt(warehouseId) : null,
          date,
          discount,
          tax: taxAmount,
          shipping,
          timbre: timbreAmount,
          timbre_percentage: timbre,
          note,
          paid_amount: paidAmount,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: (item.quantity * ppp(item)) + (item.extra_pieces || 0),
            unit_price: item.unit_price,
            discount: item.discount,
            tax: item.tax,
          })),
        });

        toast.success(t('saleForm.invoiceUpdated'));
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard/sales');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || t('saleForm.invoiceUpdateError'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Create mode validation
    if (!warehouseId) {
      toast.error(t('saleForm.selectWarehouse'));
      return;
    }

    if (items.length === 0) {
      toast.error(t('saleForm.addAtLeastOneProduct'));
      return;
    }

    for (const item of items) {
      const ppp = Number(item.pieces_per_package) || 1;
      const totalPieces = (item.quantity * ppp) + (item.extra_pieces || 0);
      if (totalPieces > item.available_stock) {
        toast.error(t('saleForm.qtyExceedsStock', { name: item.product_name, qty: formatStockQty(item.available_stock, ppp) }));
        return;
      }
      if (item.cost_price > 0 && item.unit_price > 0 && item.unit_price < item.cost_price) {
        toast.error(t('saleForm.belowCostForProduct', { name: item.product_name, price: String(item.cost_price) }));
        return;
      }
    }

    setIsSaving(true);

    try {
      // Update product prices if changed
      for (const item of items) {
        if (item.unit_price !== item.original_price) {
          try {
            await productsApi.update(item.product_id, { retail_price: item.unit_price });
          } catch (error) {
            console.error(`Failed to update price for product ${item.product_id}:`, error);
          }
        }
      }

      await salesApi.create(buildSalePayload('completed'));

      toast.success(t('saleForm.invoiceCreated'));
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/sales');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('saleForm.invoiceCreateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!warehouseId) {
      toast.error(t('saleForm.selectWarehouse'));
      return;
    }

    if (items.length === 0) {
      toast.error(t('saleForm.addAtLeastOneProduct'));
      return;
    }

    setIsSaving(true);
    try {
      await salesApi.create(buildSalePayload('draft'));
      toast.success(t('saleForm.draftSaved'));
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/sales');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('saleForm.draftSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  // Format stock quantity (already in pieces) as cartons + pieces
  const formatStockQty = (stockPieces: number, piecesPerPackage: number): string => {
    const ppp = piecesPerPackage || 1;
    const total = Math.floor(stockPieces);
    if (ppp <= 1) return `${total} ${t('saleForm.piece')}`;
    const cartons = Math.floor(total / ppp);
    const pieces = total % ppp;
    if (pieces === 0) return `${cartons} ${t('saleForm.carton')}`;
    if (cartons === 0) return `${total} ${t('saleForm.piece')}`;
    return `${cartons} ${t('saleForm.carton')} + ${pieces} ${t('saleForm.pieceSuffix')}`;
  };

  // Only show products with available stock > 0
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    const stock = getProductStock(p);
    return stock > 0;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Keyboard Shortcuts Bar */}
      <div className="bg-gradient-to-l from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black text-white px-5 py-2.5 rounded-xl mb-5 hidden sm:flex items-center gap-5 text-sm shadow-sm" data-tour="sf-shortcuts">
        <span className="font-bold text-slate-300 text-xs tracking-wide">{t('saleForm.shortcuts')}</span>
        <div className="w-px h-4 bg-slate-700" />
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono text-blue-300">F1</kbd> <span className="text-slate-400">{t('saleForm.shortcutClient')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono text-blue-300">F2</kbd> <span className="text-slate-400">{t('saleForm.shortcutProduct')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono text-emerald-300">F3</kbd> <span className="text-slate-400">{t('saleForm.shortcutAmount')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono text-amber-300">F4</kbd> <span className="text-slate-400">{t('saleForm.shortcutSave')}</span></span>
        <div className="w-px h-4 bg-slate-700" />
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono">↑↓</kbd> <span className="text-slate-400">{t('saleForm.shortcutNavigate')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono">Enter</kbd> <span className="text-slate-400">{t('saleForm.shortcutConfirm')}</span></span>
        <span><kbd className="bg-slate-700/80 px-2 py-0.5 rounded-md text-[11px] font-mono">Esc</kbd> <span className="text-slate-400">{t('saleForm.shortcutClose')}</span></span>
        <button
          onClick={() => setShowTour(true)}
          className="ms-auto flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          title={t('saleForm.tourTooltip')}
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
          <span className="text-slate-400">{t('saleForm.tourBtn')}</span>
        </button>
      </div>

      {/* Quick Entry Modal */}
      {quickEntryModal.show && quickEntryModal.product && (() => {
        const ppp = quickEntryModal.product?.pieces_per_package || 1;
        const costPrice = Number(quickEntryModal.product?.cost_price) || 0;
        const isBelowCost = quickEntryModal.unitPrice > 0 && quickEntryModal.unitPrice < costPrice;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full sm:w-[480px] max-w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-emerald-400 to-teal-500 rounded-t-2xl" />
            <div className="p-6">
              <h3 className="text-lg font-extrabold mb-5 text-center text-gray-900 dark:text-gray-100">{quickEntryModal.product.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">{t('saleForm.quantity')}</label>
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
                        setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0, categoryPrices: {} });
                        barcodeInputRef.current?.focus();
                      }
                    }}
                    className="input w-full text-center text-xl font-bold"
                    min="1"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">{t('saleForm.sellingPricePerPiece')}</label>
                  <input
                    ref={quickPriceRef}
                    type="number"
                    value={quickEntryModal.unitPrice}
                    onChange={(e) => setQuickEntryModal(prev => ({ ...prev, unitPrice: Number(e.target.value) || 0 }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isBelowCost) {
                          confirmQuickEntry();
                        }
                      } else if (e.key === 'Escape') {
                        setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0, categoryPrices: {} });
                        barcodeInputRef.current?.focus();
                      }
                    }}
                    className={`input w-full text-center text-xl font-bold ${isBelowCost ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}`}
                    min="0"
                    step="0.01"
                  />
                  {isBelowCost && (
                    <p className="text-red-500 text-xs mt-1.5 text-center font-medium">
                      {t('saleForm.belowCostPrice', { price: String(costPrice) })}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-center">
                  <div className="text-lg font-black text-blue-700 dark:text-blue-300">
                    {t('saleForm.totalLabel')} {formatCurrency(quickEntryModal.unitPrice * ppp * quickEntryModal.quantity)}
                  </div>
                  <div className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5">
                    ({quickEntryModal.unitPrice} × {ppp} {t('saleForm.perPiece')} × {quickEntryModal.quantity})
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={confirmQuickEntry}
                    disabled={isBelowCost}
                    className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all ${isBelowCost ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {t('saleForm.addEnter')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickEntryModal({ show: false, product: null, quantity: 1, unitPrice: 0, categoryPrices: {} });
                      barcodeInputRef.current?.focus();
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all"
                  >
                    {t('saleForm.cancelEsc')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onCancel ? (
            <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
              <svg className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${dir === 'ltr' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <Link href="/dashboard/sales" className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
              <svg className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${dir === 'ltr' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-none">{isEditMode ? t('saleForm.editSaleInvoice') : t('saleForm.newSaleInvoice')}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{isEditMode ? t('saleForm.editSubtitle') : t('saleForm.newSubtitle')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm" data-tour="sf-info">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('saleForm.invoiceInfo')}</span>
                </div>
              </div>
              <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('saleForm.client')}</label>
                  <input
                    ref={clientSearchRef}
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                      if (!e.target.value) {
                        setClientId('');
                        setClientDebt(null);
                      }
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    onKeyDown={(e) => {
                      const filtered = clients.filter(c => {
                        const matchesSearch = c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          (c.code && c.code.toLowerCase().includes(clientSearch.toLowerCase())) ||
                          (c.phone && c.phone.includes(clientSearch));
                        const matchesStatus = clientStatusFilter === 'all' ||
                          (clientStatusFilter === 'active' && c.is_active !== false) ||
                          (clientStatusFilter === 'inactive' && c.is_active === false);
                        return matchesSearch && matchesStatus;
                      }).slice(0, 10);
                      const maxIndex = filtered.length; // 0 = cash client, 1+ = filtered clients

                      if (e.key === 'Escape') {
                        setShowClientDropdown(false);
                        setClientHighlightIndex(-1);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setShowClientDropdown(true);
                        const newIndex = Math.min(clientHighlightIndex + 1, maxIndex);
                        setClientHighlightIndex(newIndex);
                        // Scroll to highlighted item
                        setTimeout(() => {
                          const item = clientListRef.current?.querySelector(`[data-client-index="${newIndex}"]`);
                          item?.scrollIntoView({ block: 'nearest' });
                        }, 0);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const newIndex = Math.max(clientHighlightIndex - 1, 0);
                        setClientHighlightIndex(newIndex);
                        // Scroll to highlighted item
                        setTimeout(() => {
                          const item = clientListRef.current?.querySelector(`[data-client-index="${newIndex}"]`);
                          item?.scrollIntoView({ block: 'nearest' });
                        }, 0);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (clientHighlightIndex === 0) {
                          setClientId('');
                          setClientSearch('');
                          setClientDebt(null);
                          setShowClientDropdown(false);
                          setClientHighlightIndex(-1);
                        } else if (clientHighlightIndex > 0 && filtered[clientHighlightIndex - 1]) {
                          const selected = filtered[clientHighlightIndex - 1];
                          setClientId(selected.id.toString());
                          setClientSearch(selected.name);
                          setShowClientDropdown(false);
                          setClientHighlightIndex(-1);
                        } else if (filtered.length === 1) {
                          setClientId(filtered[0].id.toString());
                          setClientSearch(filtered[0].name);
                          setShowClientDropdown(false);
                          setClientHighlightIndex(-1);
                        }
                      }
                    }}
                    placeholder={t('saleForm.searchClientPlaceholder')}
                    className="input w-full"
                    autoComplete="off"
                  />
                  {/* Selected client code chip */}
                  {clientId && (() => {
                    const sel = clients.find(c => c.id.toString() === clientId);
                    return sel?.code ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{sel.code}</span>
                        {sel.is_active === false && (
                          <span className="text-[10px] font-medium text-red-600 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 px-2 py-0.5 rounded-md">{t('saleForm.disabled')}</span>
                        )}
                      </div>
                    ) : null;
                  })()}
                  {showClientDropdown && (
                    <div ref={clientListRef} className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-72 overflow-hidden flex flex-col">
                      {/* Status filter tabs */}
                      <div className="flex items-center border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 px-1 py-1 gap-1 flex-shrink-0">
                        {([
                          { key: 'all' as const, label: t('saleForm.allFilter') },
                          { key: 'active' as const, label: t('saleForm.activeFilter') },
                          { key: 'inactive' as const, label: t('saleForm.inactiveFilter') },
                        ]).map(tab => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setClientStatusFilter(tab.key); setClientHighlightIndex(-1); }}
                            className={`flex-1 text-[11px] font-semibold py-1 rounded-lg transition-all ${
                              clientStatusFilter === tab.key
                                ? tab.key === 'inactive'
                                  ? 'bg-red-500 text-white shadow-sm'
                                  : tab.key === 'active'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-white text-gray-700 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-white/60'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      {/* Scrollable list */}
                      <div className="overflow-y-auto flex-1">
                      <div
                        data-client-index="0"
                        className={`px-3 py-2.5 cursor-pointer border-b border-gray-100 flex items-center gap-2 ${clientHighlightIndex === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        onClick={() => {
                          setClientId('');
                          setClientSearch('');
                          setClientDebt(null);
                          setShowClientDropdown(false);
                          setClientHighlightIndex(-1);
                        }}
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{t('saleForm.cashClient')}</span>
                      </div>
                      {(() => {
                        const filtered = clients.filter(c => {
                          const matchesSearch = c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                            (c.code && c.code.toLowerCase().includes(clientSearch.toLowerCase())) ||
                            (c.phone && c.phone.includes(clientSearch));
                          const matchesStatus = clientStatusFilter === 'all' ||
                            (clientStatusFilter === 'active' && c.is_active !== false) ||
                            (clientStatusFilter === 'inactive' && c.is_active === false);
                          return matchesSearch && matchesStatus;
                        }).slice(0, 10);

                        if (filtered.length === 0) {
                          return <div className="px-4 py-6 text-center text-gray-400 text-sm">{t('saleForm.noResults')}</div>;
                        }

                        return filtered.map((client, index) => (
                          <div
                            key={client.id}
                            data-client-index={index + 1}
                            className={`px-3 py-2.5 cursor-pointer transition-all border-b border-gray-50 last:border-0 ${
                              clientHighlightIndex === index + 1
                                ? 'bg-blue-50'
                                : client.is_active === false
                                  ? 'bg-red-50/40 hover:bg-red-50/70'
                                  : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setClientId(client.id.toString());
                              setClientSearch(client.name);
                              setShowClientDropdown(false);
                              setClientHighlightIndex(-1);
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                client.is_active === false
                                  ? 'bg-red-100 text-red-500'
                                  : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600'
                              }`}>
                                {client.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-semibold text-sm truncate ${client.is_active === false ? 'text-gray-400' : 'text-gray-800'}`}>{client.name}</span>
                                  {client.is_active !== false && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                  )}
                                  {client.is_active === false && (
                                    <span className="text-[9px] font-bold text-red-500 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded flex-shrink-0">{t('saleForm.disabled')}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {client.code && (
                                    <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">{client.code}</span>
                                  )}
                                  {client.phone && (
                                    <span className="text-[11px] text-gray-400" dir="ltr">{client.phone}</span>
                                  )}
                                </div>
                              </div>
                              {client.client_category?.name && (
                                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">{client.client_category.name}</span>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                      </div>
                    </div>
                  )}
                  {/* Click outside to close */}
                  {showClientDropdown && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowClientDropdown(false)}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('saleForm.warehouse')}</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="select w-full"
                    required
                  >
                    <option value="">{t('saleForm.chooseWarehouse')}</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('saleForm.dateLabel')}</label>
                  <DateInput
                    value={date}
                    onChange={(v) => setDate(v)}
                    className="w-full"
                    required
                  />
                </div>
              </div>

              {/* Client Debt Info */}
              {clientId && (
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                  {loadingDebt ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">{t('saleForm.loadingDebt')}</div>
                  ) : clientDebt ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-orange-800 dark:text-orange-300">{t('saleForm.previousDebt')}</span>
                        <span className={`font-bold text-lg ${clientDebt.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(clientDebt.balance)}
                        </span>
                      </div>
                      {(() => {
                        const selectedClient = clients.find(c => c.id.toString() === clientId);
                        const categoryName = selectedClient?.client_category?.name;
                        return categoryName ? (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{t('saleForm.priceCategory')}</span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{categoryName}</span>
                          </div>
                        ) : null;
                      })()}
                      {clientDebt.unpaid_orders && clientDebt.unpaid_orders.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                          <div className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">{t('saleForm.unpaidInvoices')}</div>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {clientDebt.unpaid_orders.slice(0, 5).map((order) => (
                              <div key={order.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">{order.reference}</span>
                                <span className="text-red-600">{formatCurrency(order.due_amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-green-600 dark:text-green-400">{t('saleForm.noPreviousDebt')}</div>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Product Search */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm" data-tour="sf-products">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('saleForm.addProducts')}</span>
                    {items.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">{t('saleForm.productCount', { count: items.length })}</span>
                    )}
                  </div>
                {/* Search Mode Toggle */}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${searchMode === 'barcode' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>{t('saleForm.barcodeMode')}</span>
                    <button
                      type="button"
                      onClick={toggleSearchMode}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        searchMode === 'name' ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                      style={{ direction: 'ltr' }}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-all duration-200 ${
                          searchMode === 'name' ? 'mr-0.5 ml-auto' : 'ml-0.5 mr-auto'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium ${searchMode === 'name' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>{t('saleForm.nameMode')}</span>
                  </div>
                </div>
              </div>

              <div className="p-5">
              <div className="mb-4">
                {searchMode === 'barcode' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('saleForm.barcodeSearch')}</label>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={handleBarcodeSearch}
                      className="input w-full"
                      placeholder={t('saleForm.scanBarcodePlaceholder')}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('saleForm.nameSearch')}</label>
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
                        const visibleProducts = filteredProducts.slice(0, 10);
                        const maxIndex = visibleProducts.length - 1;

                        if (e.key === 'Escape') {
                          setShowProductSearch(false);
                          setProductHighlightIndex(-1);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setShowProductSearch(true);
                          const newIndex = Math.min(productHighlightIndex + 1, maxIndex);
                          setProductHighlightIndex(newIndex);
                          setTimeout(() => {
                            const item = productListRef.current?.querySelector(`[data-index="${newIndex}"]`);
                            item?.scrollIntoView({ block: 'nearest' });
                          }, 0);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const newIndex = Math.max(productHighlightIndex - 1, 0);
                          setProductHighlightIndex(newIndex);
                          setTimeout(() => {
                            const item = productListRef.current?.querySelector(`[data-index="${newIndex}"]`);
                            item?.scrollIntoView({ block: 'nearest' });
                          }, 0);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (productHighlightIndex >= 0 && visibleProducts[productHighlightIndex]) {
                            openQuickEntryModal(visibleProducts[productHighlightIndex]);
                            setProductHighlightIndex(-1);
                          } else if (visibleProducts.length === 1) {
                            openQuickEntryModal(visibleProducts[0]);
                            setProductHighlightIndex(-1);
                          }
                        }
                      }}
                      className="input w-full"
                      placeholder={t('saleForm.searchProductPlaceholder')}
                      autoFocus
                    />
                    {showProductSearch && searchTerm && (
                      <div ref={productListRef} className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="p-3 text-gray-500 dark:text-gray-400 text-center">{t('saleForm.noProductResults')}</div>
                        ) : (
                          filteredProducts.slice(0, 10).map((product, index) => {
                            const stock = getProductStock(product);
                            const ppp = product.pieces_per_package || 1;
                            const price = getDefaultPrice(product);
                            const isHighlighted = productHighlightIndex === index;
                            return (
                              <button
                                key={product.id}
                                type="button"
                                data-index={index}
                                onClick={() => openQuickEntryModal(product)}
                                className={`w-full p-3 text-start border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${isHighlighted ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{product.name}</span>
                                  <span className="text-sm font-bold text-green-600">
                                    {formatStockQty(stock, ppp)}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
                                  <span>{product.barcode}</span>
                                  <span>
                                    {formatCurrency(price)} / {t('saleForm.perPiece')}
                                    {ppp > 1 && (
                                      <span className="text-gray-400 me-1">({formatCurrency(price * ppp)} / {t('saleForm.perCarton')})</span>
                                    )}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Items Table - New Format */}
              <div className="overflow-x-auto" data-tour="sf-items">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-2 py-2.5 text-center w-12 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('saleForm.numberCol')}</th>
                      <th className="px-2 py-2.5 text-start text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('saleForm.designationCol')}</th>
                      <th className="px-2 py-2.5 text-center w-28 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('saleForm.cartonPieceCol')}</th>
                      <th className="px-2 py-2.5 text-center w-16 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('saleForm.unitCol')}</th>
                      <th className="px-2 py-2.5 text-center w-20 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('saleForm.countCol')}</th>
                      <th className="px-2 py-2.5 text-center w-20 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('saleForm.availableCol')}</th>
                      <th className="px-2 py-2.5 text-center w-24 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('saleForm.unitPriceCol')}</th>
                      <th className="px-2 py-2.5 text-center w-20 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('saleForm.discountCol')}</th>
                      <th className="px-2 py-2.5 text-center w-24 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('saleForm.amountCol')}</th>
                      <th className="px-2 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">{t('saleForm.noProductsYet')}</p>
                            <p className="text-xs text-gray-300 dark:text-gray-600">{t('saleForm.useBarcodeOrName')}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => {
                        const isBelowCostPrice = item.cost_price > 0 && item.unit_price > 0 && item.unit_price < item.cost_price;
                        return (
                          <tr key={index} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors duration-150 ${isBelowCostPrice ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                            <td className="px-2 py-2 text-center font-medium text-gray-500 dark:text-gray-400">{index + 1}</td>
                            <td className="px-2 py-2">
                              <div className="font-medium dark:text-gray-200">{item.product_name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{item.barcode}</div>
                              {isBelowCostPrice && (
                                <div className="text-xs text-red-600 font-bold">{t('saleForm.belowCostLabel', { price: formatCurrency(item.cost_price) })}</div>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <div className="space-y-1">
                                {/* Cartons row - blue */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updateItem(index, 'quantity', Math.max(0, item.quantity - 1))}
                                    className="w-6 h-6 flex items-center justify-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold"
                                  >-</button>
                                  <input
                                    ref={(el) => { inputRefs.current[`${index}-quantity`] = el; }}
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', Math.max(0, parseInt(e.target.value) || 0))}
                                    onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                                    className="input w-12 text-center text-sm py-0.5 border-blue-300"
                                    min="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold"
                                  >+</button>
                                </div>
                                {/* Pieces row - orange (only if ppp > 1) */}
                                {item.pieces_per_package > 1 && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => updateItem(index, 'extra_pieces', Math.max(0, item.extra_pieces - 1))}
                                      className="w-6 h-6 flex items-center justify-center rounded border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold"
                                    >-</button>
                                    <input
                                      ref={(el) => { inputRefs.current[`${index}-extra_pieces`] = el; }}
                                      type="number"
                                      value={item.extra_pieces}
                                      onChange={(e) => updateItem(index, 'extra_pieces', parseInt(e.target.value) || 0)}
                                      onKeyDown={(e) => handleKeyDown(e, index, 'extra_pieces')}
                                      className="input w-12 text-center text-sm py-0.5 border-orange-300"
                                      min="0"
                                      max={item.pieces_per_package - 1}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateItem(index, 'extra_pieces', item.extra_pieces + 1)}
                                      className="w-6 h-6 flex items-center justify-center rounded border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold"
                                    >+</button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-sm">
                              <div className="text-blue-600 font-medium">{item.pieces_per_package}</div>
                              <div className="text-xs text-gray-500">{item.unit_name}</div>
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
                                className="input w-16 text-center text-sm py-0.5 font-medium"
                                min="0"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              {(() => {
                                const ppp = item.pieces_per_package || 1;
                                const totalPieces = (item.quantity * ppp) + (item.extra_pieces || 0);
                                const overStock = totalPieces > item.available_stock;
                                return (
                                  <span className={`text-sm font-bold ${overStock ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatStockQty(item.available_stock, ppp)}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                ref={(el) => { inputRefs.current[`${index}-unit_price`] = el; }}
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                onKeyDown={(e) => handleKeyDown(e, index, 'unit_price')}
                                className={`input w-full text-center ${isBelowCostPrice ? 'border-red-500 bg-red-50' : ''}`}
                                min="0"
                                step="0.01"
                              />
                              {item.pieces_per_package > 1 && (
                                <div className="text-[10px] text-blue-500 dark:text-blue-400 text-center mt-0.5">
                                  {t('saleForm.perCartonPrice', { price: formatCurrency(item.unit_price * item.pieces_per_package) })}
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
                            <td className="px-2 py-2 text-center font-bold text-green-600">
                              {formatCurrency(item.subtotal)}
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

              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {t('saleForm.enterNextField')}
              </div>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">{t('saleForm.notes')}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input w-full"
                rows={2}
                placeholder={t('saleForm.addNotesPlaceholder')}
              />
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div>
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm sticky top-24" data-tour="sf-summary">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('saleForm.invoiceSummary')}</span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('saleForm.productsTotal', { count: items.length })}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(totalAmount)}</span>
                </div>

                {/* Compact 3-column: Discount / Tax / Shipping */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1">{t('saleForm.discountLabel')}</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="input w-full text-center text-sm py-1.5"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1">{t('saleForm.taxLabel')}</label>
                    <input
                      type="number"
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      className="input w-full text-center text-sm py-1.5"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    {tax > 0 && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 text-center">= {formatCurrency(taxAmount)}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1">{t('saleForm.shippingLabel')}</label>
                    <input
                      type="number"
                      value={shipping}
                      onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                      className="input w-full text-center text-sm py-1.5"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1">{locale === 'ar' ? 'الطابع %' : 'Timbre %'}</label>
                    <input
                      type="number"
                      value={timbre}
                      onChange={(e) => setTimbre(parseFloat(e.target.value) || 0)}
                      className="input w-full text-center text-sm py-1.5"
                      min="0"
                      step="0.01"
                    />
                    {timbre > 0 && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 text-center">= {formatCurrency(timbreAmount)}</div>
                    )}
                  </div>
                </div>

                {/* Grand Total */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{t('saleForm.finalTotal')}</span>
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">{t('saleForm.paidAmount')}</label>
                  <input
                    ref={paidAmountRef}
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitBtnRef.current?.focus();
                      }
                    }}
                    className="input w-full text-lg font-bold text-center"
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                  {clientId && previousDebt > 0 && (
                    <div className="mt-2 text-[11px] text-blue-500 dark:text-blue-400 text-center">
                      {t('saleForm.payMoreHint')}
                    </div>
                  )}
                </div>

                {/* Payment Breakdown */}
                {clientId && clientDebt ? (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl space-y-2">
                    {/* Summary at top */}
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-800 mb-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="dark:text-gray-300">{t('saleForm.thisInvoice')}</span>
                        <span className="font-bold dark:text-gray-200">{formatCurrency(grandTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="dark:text-gray-300">{t('saleForm.plusPreviousDebt')}</span>
                        <span className="font-bold dark:text-gray-200">{formatCurrency(previousDebt)}</span>
                      </div>
                      <hr className="my-1 dark:border-gray-700" />
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="dark:text-gray-300">{t('saleForm.equalsTotal')}</span>
                        <span className="text-orange-600 dark:text-orange-400">{formatCurrency(grandTotal + previousDebt)}</span>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">{t('saleForm.paymentDistribution', { amount: formatCurrency(currentPaidAmount) })}</div>

                    {currentPaidAmount > 0 ? (
                      <>
                        {/* Applied to current sale */}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{t('saleForm.deductedFromInvoice')}</span>
                          <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(appliedToCurrentSale)}</span>
                        </div>

                        {/* Applied to previous debt */}
                        {appliedToPreviousDebt > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{t('saleForm.deductedFromPreviousDebt')}</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(appliedToPreviousDebt)}</span>
                          </div>
                        )}

                        <hr className="border-orange-200 dark:border-orange-800" />
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-1">{t('saleForm.noPaidAmountEntered')}</div>
                    )}

                    {/* Remaining */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('saleForm.invoiceRemaining')}</span>
                      <span className={`font-medium ${remainingFromSale > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(remainingFromSale)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('saleForm.previousDebtRemaining')}</span>
                      <span className={`font-medium ${remainingPreviousDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(remainingPreviousDebt)}
                      </span>
                    </div>

                    <hr className="border-orange-200 dark:border-orange-800" />

                    {/* Total remaining */}
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-orange-800 dark:text-orange-300">{t('saleForm.totalDebtAfterCollection')}</span>
                      <span className={`text-lg ${totalRemainingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(totalRemainingDebt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('saleForm.remainingFromInvoice')}</span>
                      <span className={`font-bold ${remainingFromSale > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(remainingFromSale)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1" data-tour="sf-save">
                  <button
                    ref={submitBtnRef}
                    type="submit"
                    disabled={isSaving || items.length === 0}
                    className="w-full px-4 py-2.5 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? t('saleForm.saving') : (
                      <span className="flex items-center justify-center gap-2">
                        {t('saleForm.saveInvoice')}
                        <kbd className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">F4</kbd>
                      </span>
                    )}
                  </button>

                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSaving || items.length === 0}
                      className="w-full px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? t('saleForm.saving') : t('saleForm.saveDraft')}
                    </button>
                  )}

                  {onCancel ? (
                    <button type="button" onClick={onCancel} className="w-full px-4 py-2 text-sm font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all text-center">
                      {t('saleForm.cancel')}
                    </button>
                  ) : (
                    <Link href="/dashboard/sales" className="w-full px-4 py-2 text-sm font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 text-center block">
                      {t('saleForm.cancel')}
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
          steps={saleFormTourSteps}
          storageKey="sale_form_tour_step"
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
