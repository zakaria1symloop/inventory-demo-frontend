'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, brandsApi, unitsApi, clientCategoriesApi, suppliersApi } from '@/lib/api';
import { PlusIcon, PencilIcon, TrashIcon, DocumentArrowDownIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import ImportPreviewPanel from '@/components/products/ImportPreviewPanel';
import type { ImportPreviewResponse, ImportRow } from '@/lib/types';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import type { Product, Category, Brand, Unit, ClientCategory } from '@/lib/types';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar, SelectWithCreate } from '@/components/dashboard';
import type { SelectWithCreateOption } from '@/components/dashboard';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface StockItem {
  quantity: number;
  warehouse?: { name: string };
}

interface ProductWithStock extends Product {
  stock?: StockItem[];
  available_stock?: number;
  current_stock?: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [importStep, setImportStep] = useState<'idle' | 'uploading' | 'preview' | 'confirming'>('idle');
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryPricesForm, setCategoryPricesForm] = useState<Record<string, string>>({});
  const [showTour, setShowTour] = useState(false);
  // Inline create state for client categories (multi-row section, not a single select).
  const [newClientCategoryName, setNewClientCategoryName] = useState('');
  const [showAddClientCategory, setShowAddClientCategory] = useState(false);
  const [creatingClientCategory, setCreatingClientCategory] = useState(false);
  const { t, locale, dir } = useLocale();
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand_id: '',
    supplier_id: '',
    unit_buy_id: '',
    unit_sale_id: '',
    barcode: '',
    cost_price: '',
    stock_alert: '',
    tax_percent: '',
    tax_included: false,
    pieces_per_package: '1',
    is_active: true,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Insert key or Alt+N: Open add product modal
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        handleOpenCreate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: async () => {
      const response = await productsApi.getAll({ page, search, per_page: 15, warehouse_id: 1 });
      return response.data;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const response = await categoriesApi.getAll({ active_only: true });
      return response.data;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ['brands-list'],
    queryFn: async () => {
      const response = await brandsApi.getAll({ active_only: true });
      return response.data;
    },
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list-products'],
    queryFn: async () => {
      const response = await suppliersApi.getAll({ per_page: 1000 });
      return response.data?.data || response.data;
    },
  });
  const suppliers = (suppliersData as Array<{ id: number; name: string }> | undefined) || [];

  const { data: clientCategories } = useQuery({
    queryKey: ['client-categories-list'],
    queryFn: async () => {
      const response = await clientCategoriesApi.getAll();
      return response.data;
    },
  });

  const { data: units } = useQuery({
    queryKey: ['units-list'],
    queryFn: async () => {
      const response = await unitsApi.getAll({ active_only: true });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('common.addedSuccess', { item: t('stock.productName') }));
      handleCloseModal();
    },
    onError: () => toast.error(t('common.errorAdd')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('common.updatedSuccess', { item: t('stock.productName') }));
      handleCloseModal();
    },
    onError: () => toast.error(t('common.errorUpdate')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('common.deletedSuccess', { item: t('stock.productName') }));
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('common.errorDelete');
      toast.error(message);
      setIsDeleteOpen(false);
    },
  });

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      category_id: '',
      brand_id: '',
      supplier_id: '',
      unit_buy_id: '',
      unit_sale_id: '',
      barcode: '',
      cost_price: '',
      stock_alert: '',
      tax_percent: '',
      tax_included: false,
      pieces_per_package: '1',
      is_active: true,
    });
    setCategoryPricesForm({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id?.toString() || '',
      brand_id: product.brand_id?.toString() || '',
      supplier_id: (product as any).supplier_id?.toString() || '',
      unit_buy_id: product.unit_buy_id?.toString() || '',
      unit_sale_id: product.unit_sale_id?.toString() || '',
      barcode: product.barcode || '',
      cost_price: product.cost_price?.toString() || '',
      stock_alert: product.stock_alert?.toString() || '',
      tax_percent: product.tax_percent?.toString() || '',
      tax_included: Boolean(product.tax_included),
      pieces_per_package: (product.pieces_per_package || 1).toString(),
      is_active: product.is_active,
    });
    // Load existing category prices
    const pricesMap: Record<string, string> = {};
    if (product.category_prices) {
      product.category_prices.forEach((cp) => {
        pricesMap[cp.client_category_id.toString()] = cp.price.toString();
      });
    }
    setCategoryPricesForm(pricesMap);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleQuickCreateClientCategory = async () => {
    const name = newClientCategoryName.trim();
    if (!name) return;
    setCreatingClientCategory(true);
    try {
      await clientCategoriesApi.create({ name });
      await queryClient.invalidateQueries({ queryKey: ['client-categories-list'] });
      setNewClientCategoryName('');
      setShowAddClientCategory(false);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ??
        t('common.errorAdd');
      toast.error(msg);
    } finally {
      setCreatingClientCategory(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryPrices = Object.entries(categoryPricesForm)
      .filter(([, price]) => price !== '' && price !== null)
      .map(([catId, price]) => ({
        client_category_id: parseInt(catId),
        price: parseFloat(price),
      }));

    // Block sell price < buy price (both are per piece)
    const ppp = parseInt(formData.pieces_per_package) || 1;
    const costPerPiece = parseFloat(formData.cost_price) || 0;
    const tooLow = categoryPrices.find(cp => cp.price < costPerPiece);
    if (tooLow) {
      toast.error(t('stock.sellBelowCost') || 'سعر البيع لا يمكن أن يكون أقل من سعر الشراء');
      return;
    }

    const data = {
      ...formData,
      category_id: parseInt(formData.category_id) || null,
      brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
      unit_buy_id: parseInt(formData.unit_buy_id) || null,
      unit_sale_id: parseInt(formData.unit_sale_id) || null,
      cost_price: parseFloat(formData.cost_price) || 0,
      wholesale_price: 0,
      min_selling_price: 0,
      stock_alert: formData.stock_alert ? parseInt(formData.stock_alert) : null,
      tax_percent: formData.tax_percent ? parseFloat(formData.tax_percent) : 0,
      tax_included: formData.tax_included ? 1 : 0,
      pieces_per_package: ppp,
      category_prices: categoryPrices,
    };

    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleGenerateBarcode = async () => {
    try {
      const response = await productsApi.generateBarcode();
      setFormData((prev) => ({ ...prev, barcode: response.data.barcode }));
    } catch {
      toast.error(t('stock.barcodeError'));
    }
  };

  const getTotalStock = (product: ProductWithStock): number => {
    // Show physical stock (matches the inventory page).
    // available_stock deducts reserved quantities and is only meaningful inside order forms,
    // so we don't use it here — it caused users to see 0 in products vs 1 in inventory.
    if (product.current_stock !== undefined) {
      return product.current_stock;
    }
    if (!product.stock || product.stock.length === 0) return 0;
    return product.stock.reduce((sum, s) => sum + (parseFloat(String(s.quantity)) || 0), 0);
  };

  const exportToPDF = () => {
    const products = data?.data || [];
    const printContent = `
      <html>
      <head>
        <title>Liste des Produits</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          .low-stock { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Liste des Produits</h1>
        <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Categorie</th>
              <th>Marque</th>
              <th>Quantite</th>
              <th>Prix Achat</th>
              <th>Prix Vente</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((p: ProductWithStock) => {
              const qty = getTotalStock(p);
              const isLow = p.stock_alert && qty <= p.stock_alert;
              const sellPrices = p.category_prices?.map(cp => `${cp.price}`).join(' / ') || '-';
              return `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.category?.name || '-'}</td>
                  <td>${p.brand?.name || '-'}</td>
                  <td class="${isLow ? 'low-stock' : ''}">${qty}</td>
                  <td>${p.cost_price} DA</td>
                  <td>${sellPrices} DA</td>
                  <td>${p.is_active ? 'Actif' : 'Inactif'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToExcel = () => {
    const products = data?.data || [];
    let csv = '\uFEFF'; // BOM for UTF-8
    csv += 'Nom,Categorie,Marque,Quantite,Prix Achat,Prix Vente,Statut\n';
    products.forEach((p: ProductWithStock) => {
      const qty = getTotalStock(p);
      const sellPrices = p.category_prices?.map(cp => cp.price).join(' / ') || '-';
      csv += `"${p.name}","${p.category?.name || '-'}","${p.brand?.name || '-'}",${qty},${p.cost_price},"${sellPrices}","${p.is_active ? 'Actif' : 'Inactif'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(t('stock.exportSuccess'));
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await productsApi.downloadTemplate();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'نموذج_استيراد_المنتجات.xlsx';
      link.click();
      toast.success(t('stock.templateDownloaded'));
    } catch {
      toast.error(t('stock.templateError'));
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStep('uploading');
    setImportResult(null);
    try {
      const response = await productsApi.previewImport(file);
      setPreviewData(response.data);
      setImportStep('preview');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('stock.fileReadError'));
      setImportStep('idle');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async (rows: ImportRow[]) => {
    setImportStep('confirming');
    try {
      const response = await productsApi.confirmImport(rows as unknown as Record<string, unknown>[]);
      const result = response.data;
      setImportResult(result);
      setImportStep('idle');
      setPreviewData(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (result.created > 0) {
        toast.success(t('stock.importSuccess', { count: result.created }));
      }
      if (result.errors?.length > 0) {
        toast.error(t('stock.importErrors', { count: result.errors.length }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('stock.importProductsError'));
      setImportStep('preview');
    }
  };

  const handleCancelImport = () => {
    setImportStep('idle');
    setPreviewData(null);
  };

  const productsTourSteps: TourStep[] = [
    {
      target: '[data-tour="products-title"]',
      title: t('stock.tourProductsTitle'),
      desc: t('stock.tourProductsDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="products-add"]',
      title: t('stock.tourAddProductTitle'),
      desc: t('stock.tourAddProductDesc'),
      position: 'bottom',
      requireClick: true,
    },
    {
      target: '[data-tour="products-form-name"]',
      title: t('stock.tourProductNameTitle'),
      desc: t('stock.tourProductNameDesc'),
      position: 'right',
    },
    {
      target: '[data-tour="products-form-category"]',
      title: t('stock.tourCategoryBrandTitle'),
      desc: t('stock.tourCategoryBrandDesc'),
      position: 'right',
    },
    {
      target: '[data-tour="products-form-units"]',
      title: t('stock.tourUnitsTitle'),
      desc: t('stock.tourUnitsDesc'),
      position: 'right',
    },
    {
      target: '[data-tour="products-form-pieces"]',
      title: t('stock.tourPiecesTitle'),
      desc: t('stock.tourPiecesDesc'),
      position: 'right',
    },
    {
      target: '[data-tour="products-form-prices"]',
      title: t('stock.tourPricesTitle'),
      desc: t('stock.tourPricesDesc'),
      position: 'right',
    },
    {
      target: '[data-tour="products-form-catprices"]',
      title: t('stock.tourCatPricesTitle'),
      desc: t('stock.tourCatPricesDesc'),
      position: 'right',
    },
    {
      target: '[data-tour="products-form-cancel"]',
      title: t('stock.tourCloseFormTitle'),
      desc: t('stock.tourCloseFormDesc'),
      position: 'top',
      requireClick: true,
    },
    {
      target: '[data-tour="products-download-template"]',
      title: t('stock.tourDownloadTitle'),
      desc: t('stock.tourDownloadDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="products-import"]',
      title: t('stock.tourImportTitle'),
      desc: t('stock.tourImportDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="products-export"]',
      title: t('stock.tourExportTitle'),
      desc: t('stock.tourExportDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="products-table"]',
      title: t('stock.tourTableTitle'),
      desc: t('stock.tourTableDesc'),
      position: 'bottom',
    },
  ];

  const columns: Array<{
    key: string;
    title: string;
    align?: 'start' | 'center' | 'end';
    numeric?: boolean;
    render: (item: ProductWithStock) => React.ReactNode;
  }> = [
    {
      key: 'name',
      title: t('common.name'),
      render: (item) => <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>,
    },
    {
      key: 'category',
      title: t('stock.category'),
      render: (item) => item.category?.name || '-',
    },
    {
      key: 'brand',
      title: t('stock.brand'),
      render: (item) => item.brand?.name || '-',
    },
    {
      key: 'quantity',
      title: t('stock.quantity'),
      numeric: true,
      render: (item) => {
        const qty = getTotalStock(item);
        const isLow = item.stock_alert && qty <= item.stock_alert;
        const displayQty = Number.isInteger(qty) ? qty : Math.round(qty);
        if (isLow) {
          return (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
              <span className="metric-dot metric-dot-red" aria-hidden />
              {displayQty}
            </span>
          );
        }
        return <span>{displayQty}</span>;
      },
    },
    {
      key: 'cost_price',
      title: t('stock.costPrice'),
      numeric: true,
      render: (item) => {
        const unitName = item.unit_buy?.short_name || t('stock.unitLabel');
        return `${item.cost_price} د.ج/${unitName}`;
      },
    },
    {
      key: 'retail_price',
      title: t('stock.sellingPrice'),
      numeric: true,
      render: (item) => {
        const price = Number(item.retail_price);
        if (!price) {
          return (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
              <span className="metric-dot metric-dot-red" aria-hidden />
              {t('stock.notDefined')}
            </span>
          );
        }
        const unitName = item.unit_sale?.short_name || t('stock.unitLabel');
        return <span className="font-medium">{item.retail_price} د.ج/{unitName}</span>;
      },
    },
    {
      key: 'category_prices',
      title: t('stock.categoryPrices'),
      render: (item) => {
        const prices = item.category_prices;
        if (!prices || prices.length === 0) {
          return <span className="text-gray-400">-</span>;
        }
        const ppp = item.pieces_per_package || 1;
        return (
          <div className="flex flex-wrap gap-1">
            {prices.map((cp) => (
              <span
                key={cp.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60"
              >
                <span className="tnum">{cp.price} د.ج</span>
                {ppp > 1 && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 me-1 tnum">
                    ({(Number(cp.price) * ppp).toFixed(0)} د.ج/كرتون)
                  </span>
                )}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: t('common.actions'),
      align: 'end',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md transition-colors"
            aria-label={t('common.update')}
          >
            <PencilIcon className="w-4 h-4" strokeWidth={1.7} />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(item);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md transition-colors"
            aria-label="Delete"
          >
            <TrashIcon className="w-4 h-4" strokeWidth={1.7} />
          </button>
        </div>
      ),
    },
  ];

  const products = (data?.data || []) as ProductWithStock[];

  return (
    <div className="space-y-4">
      <div data-tour="products-title">
      <PageHeader
        title={t('stock.productsTitle')}
        subtitle={t('stock.productsSubtitle')}
      >
        <button
          onClick={() => { localStorage.removeItem('products_tour_step'); setShowTour(true); }}
          className="btn btn-secondary text-[13px] h-8 px-3"
        >
          <QuestionMarkCircleIcon className="w-4 h-4" strokeWidth={1.8} />
          <span className="hidden sm:inline">{t('common.guidedTour')}</span>
        </button>
        <button onClick={handleDownloadTemplate} className="btn btn-secondary text-[13px] h-8 px-3" title="تحميل نموذج الاستيراد" data-tour="products-download-template">
          <ArrowDownTrayIcon className="w-4 h-4" strokeWidth={1.8} />
          <span className="hidden md:inline">{t('stock.downloadTemplate')}</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary text-[13px] h-8 px-3"
          disabled={importStep !== 'idle'}
          title="استيراد منتجات من Excel"
          data-tour="products-import"
        >
          <ArrowUpTrayIcon className="w-4 h-4" strokeWidth={1.8} />
          <span className="hidden md:inline">{importStep === 'uploading' ? t('stock.reading') : t('stock.importExcel')}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleImportFile}
          className="hidden"
        />
        <button onClick={exportToPDF} className="btn btn-secondary text-[13px] h-8 px-3" data-tour="products-export">
          <DocumentArrowDownIcon className="w-4 h-4" strokeWidth={1.8} />
          PDF
        </button>
        <button onClick={exportToExcel} className="btn btn-secondary text-[13px] h-8 px-3">
          <DocumentArrowDownIcon className="w-4 h-4" strokeWidth={1.8} />
          Excel
        </button>
        <button onClick={handleOpenCreate} className="btn btn-primary text-[13px] h-8 px-3" data-tour="products-add">
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          {t('stock.addProduct')}
        </button>
      </PageHeader>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t('stock.searchProduct')}
      />

      <div data-tour="products-table">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="spinner" />
          </div>
        ) : (
          <div className="table-pro-wrap">
            <table className="table-pro">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={col.align === 'end' || col.numeric ? 'text-end' : col.align === 'center' ? 'text-center' : 'text-start'}
                    >
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="t-empty">
                      {t('stock.noProducts')}
                    </td>
                  </tr>
                ) : (
                  products.map((item) => (
                    <tr key={item.id}>
                      {columns.map((col) => (
                        <td
                          key={`${item.id}-${col.key}`}
                          className={[
                            col.numeric ? 'tnum' : '',
                            col.align === 'end' ? 'text-end' : col.align === 'center' ? 'text-center' : '',
                          ].join(' ').trim()}
                        >
                          {col.render(item)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-[12px] text-gray-500 dark:text-gray-400">
              {(data.current_page - 1) * data.per_page + 1}–
              {Math.min(data.current_page * data.per_page, data.total)} / {data.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(data.current_page - 1)}
                disabled={data.current_page === 1}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="prev"
              >
                <ChevronRightIcon className="w-4 h-4 rtl:hidden" />
                <ChevronLeftIcon className="w-4 h-4 ltr:hidden" />
              </button>
              <span className="text-[12px] tnum px-2 text-gray-600 dark:text-gray-300">
                {data.current_page} / {data.last_page}
              </span>
              <button
                onClick={() => setPage(data.current_page + 1)}
                disabled={data.current_page === data.last_page}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="next"
              >
                <ChevronLeftIcon className="w-4 h-4 rtl:hidden" />
                <ChevronRightIcon className="w-4 h-4 ltr:hidden" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Side Panel */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCloseModal} />
          {/* Centered dialog — wider so inline create forms breathe */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[680px] max-h-[calc(100vh-3rem)] pointer-events-auto"
            data-tour="products-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">{selectedProduct ? t('stock.editProduct') : t('stock.addNewProduct')}</h2>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors" aria-label={t('common.close')}>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div data-tour="products-form-name">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.productName')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="input w-full"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-tour="products-form-category">
                  <SelectWithCreate
                    label={t('stock.category')}
                    required
                    value={formData.category_id}
                    onChange={(v) => setFormData((p) => ({ ...p, category_id: v }))}
                    options={((categories as Category[]) ?? []).map((c): SelectWithCreateOption => ({ value: String(c.id), label: c.name }))}
                    placeholder={t('stock.selectCategory')}
                    createTitle={t('stock.addCategory') !== 'stock.addCategory' ? t('stock.addCategory') : t('stock.category')}
                    fields={[{ key: 'name', label: t('stock.category'), required: true, placeholder: t('stock.category') }]}
                    createLabel={t('common.add')}
                    cancelLabel={t('common.cancel')}
                    onCreate={async (payload) => {
                      const res = await categoriesApi.create({ name: payload.name, is_active: true });
                      const c = res.data;
                      return { value: String(c.id), label: c.name };
                    }}
                    onCreated={() => queryClient.invalidateQueries({ queryKey: ['categories-list'] })}
                  />
                  <SelectWithCreate
                    label={t('stock.brandFull')}
                    value={formData.brand_id}
                    onChange={(v) => setFormData((p) => ({ ...p, brand_id: v }))}
                    options={((brands as Brand[]) ?? []).map((b): SelectWithCreateOption => ({ value: String(b.id), label: b.name }))}
                    placeholder={t('stock.selectBrand')}
                    createTitle={t('stock.brandFull')}
                    fields={[{ key: 'name', label: t('stock.brandFull'), required: true, placeholder: t('stock.brandFull') }]}
                    createLabel={t('common.add')}
                    cancelLabel={t('common.cancel')}
                    onCreate={async (payload) => {
                      const res = await brandsApi.create({ name: payload.name, is_active: true });
                      const b = res.data;
                      return { value: String(b.id), label: b.name };
                    }}
                    onCreated={() => queryClient.invalidateQueries({ queryKey: ['brands-list'] })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SelectWithCreate
                    label={t('stock.supplier')}
                    value={formData.supplier_id}
                    onChange={(v) => setFormData((p) => ({ ...p, supplier_id: v }))}
                    options={suppliers.map((s): SelectWithCreateOption => ({ value: String(s.id), label: s.name }))}
                    placeholder={t('stock.selectSupplier')}
                    createTitle={t('stock.supplier')}
                    fields={[
                      { key: 'name', label: t('stock.supplier'), required: true, placeholder: t('stock.supplier') },
                      { key: 'phone', label: 'Tel', placeholder: '0500000000' },
                    ]}
                    createLabel={t('common.add')}
                    cancelLabel={t('common.cancel')}
                    onCreate={async (payload) => {
                      const res = await suppliersApi.create({
                        name: payload.name,
                        ...(payload.phone ? { phone: payload.phone } : {}),
                        is_active: true,
                      });
                      const s = res.data;
                      return { value: String(s.id), label: s.name };
                    }}
                    onCreated={() => queryClient.invalidateQueries({ queryKey: ['suppliers-list-products'] })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-tour="products-form-units">
                  <SelectWithCreate
                    label={t('stock.buyUnit')}
                    required
                    value={formData.unit_buy_id}
                    onChange={(v) => setFormData((p) => ({ ...p, unit_buy_id: v }))}
                    options={((units as Unit[]) ?? []).map((u): SelectWithCreateOption => ({ value: String(u.id), label: u.name }))}
                    placeholder={t('stock.selectUnit')}
                    createTitle={t('stock.buyUnit')}
                    fields={[
                      { key: 'name', label: t('stock.unitLabel'), required: true, placeholder: 'Carton' },
                      { key: 'short_name', label: t('stock.unitLabel') + ' (short)', required: true, placeholder: 'crt' },
                    ]}
                    createLabel={t('common.add')}
                    cancelLabel={t('common.cancel')}
                    onCreate={async (payload) => {
                      const res = await unitsApi.create({
                        name: payload.name,
                        short_name: payload.short_name,
                        is_active: true,
                      });
                      const u = res.data;
                      return { value: String(u.id), label: u.name };
                    }}
                    onCreated={() => queryClient.invalidateQueries({ queryKey: ['units-list'] })}
                  />
                  <SelectWithCreate
                    label={t('stock.sellUnit')}
                    required
                    value={formData.unit_sale_id}
                    onChange={(v) => setFormData((p) => ({ ...p, unit_sale_id: v }))}
                    options={((units as Unit[]) ?? []).map((u): SelectWithCreateOption => ({ value: String(u.id), label: u.name }))}
                    placeholder={t('stock.selectUnit')}
                    createTitle={t('stock.sellUnit')}
                    fields={[
                      { key: 'name', label: t('stock.unitLabel'), required: true, placeholder: 'Piece' },
                      { key: 'short_name', label: t('stock.unitLabel') + ' (short)', required: true, placeholder: 'pc' },
                    ]}
                    createLabel={t('common.add')}
                    cancelLabel={t('common.cancel')}
                    onCreate={async (payload) => {
                      const res = await unitsApi.create({
                        name: payload.name,
                        short_name: payload.short_name,
                        is_active: true,
                      });
                      const u = res.data;
                      return { value: String(u.id), label: u.name };
                    }}
                    onCreated={() => queryClient.invalidateQueries({ queryKey: ['units-list'] })}
                  />
                </div>

                <div data-tour="products-form-pieces">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('stock.piecesIn', { unit: (units as Unit[])?.find(u => u.id.toString() === formData.unit_buy_id)?.name || t('stock.unitLabel') })} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.pieces_per_package}
                    onChange={(e) => setFormData((p) => ({ ...p, pieces_per_package: e.target.value }))}
                    className="input w-full"
                    min="1"
                    placeholder="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.barcode')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData((p) => ({ ...p, barcode: e.target.value }))}
                      className="input flex-1"
                    />
                    <button type="button" onClick={handleGenerateBarcode} className="btn btn-secondary text-sm">
                      {t('stock.generate')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-tour="products-form-prices">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.costPricePerUnit')} <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => setFormData((p) => ({ ...p, cost_price: e.target.value }))}
                      className="input w-full"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    {(parseInt(formData.pieces_per_package) || 1) > 1 && parseFloat(formData.cost_price) > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 tnum">
                        {(parseFloat(formData.cost_price) * (parseInt(formData.pieces_per_package) || 1)).toFixed(2)} د.ج/{(units as Unit[])?.find(u => u.id.toString() === formData.unit_buy_id)?.short_name || (units as Unit[])?.find(u => u.id.toString() === formData.unit_buy_id)?.name || t('stock.unitLabel')}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.taxPercent')}</label>
                    <input
                      type="number"
                      value={formData.tax_percent}
                      onChange={(e) => setFormData((p) => ({ ...p, tax_percent: e.target.value }))}
                      className="input w-full"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                    />
                    {/* TVA inclusive / exclusive — drives invoice generation later */}
                    {parseFloat(formData.tax_percent) > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, tax_included: false }))}
                          className={`flex-1 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                            !formData.tax_included
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title="TVA added on top of the price"
                        >
                          {t('stock.taxExclusive') !== 'stock.taxExclusive' ? t('stock.taxExclusive') : 'HT (excl.)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, tax_included: true }))}
                          className={`flex-1 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                            formData.tax_included
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title="TVA already included in the price"
                        >
                          {t('stock.taxInclusive') !== 'stock.taxInclusive' ? t('stock.taxInclusive') : 'TTC (incl.)'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Prices — per client category */}
                {(() => {
                  const costPerPiece = parseFloat(formData.cost_price) || 0;
                  const cats = (clientCategories as ClientCategory[]) ?? [];
                  return (
                    <div
                      className="border border-gray-200/80 dark:border-gray-700 rounded-md p-3 bg-gray-50/60 dark:bg-gray-900/40"
                      data-tour="products-form-catprices"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          {t('stock.categoryPricesTitle')}
                        </h4>
                        {!showAddClientCategory && (
                          <button
                            type="button"
                            onClick={() => setShowAddClientCategory(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                          >
                            <PlusIcon className="w-3 h-3" strokeWidth={2.2} />
                            {t('common.add')}
                          </button>
                        )}
                      </div>
                      {cats.length === 0 && !showAddClientCategory && (
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 py-1">
                          —
                        </p>
                      )}
                      {cats.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {cats.map((cat) => {
                            const raw = categoryPricesForm[cat.id.toString()] || '';
                            const numeric = parseFloat(raw);
                            const isBelowCost = raw !== '' && !isNaN(numeric) && costPerPiece > 0 && numeric < costPerPiece;
                            return (
                              <div key={cat.id}>
                                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">{cat.name}</label>
                                <input
                                  type="number"
                                  value={raw}
                                  onChange={(e) => setCategoryPricesForm(prev => ({ ...prev, [cat.id.toString()]: e.target.value }))}
                                  className={`input w-full text-[13px] py-1.5 ${isBelowCost ? 'border-red-400 ring-1 ring-red-100 bg-red-50/40' : ''}`}
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                                {isBelowCost && (
                                  <p className="text-[10.5px] text-red-600 dark:text-red-400 mt-0.5">{t('stock.sellBelowCost')}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {showAddClientCategory && (
                        <div className="mt-2 pt-2 border-t border-gray-200/80 dark:border-gray-700 flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-[10.5px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">
                              {t('stock.categoryPricesTitle')}
                            </label>
                            <input
                              type="text"
                              value={newClientCategoryName}
                              onChange={(e) => setNewClientCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleQuickCreateClientCategory();
                                }
                              }}
                              placeholder={t('common.name') !== 'common.name' ? t('common.name') : 'Name'}
                              className="input w-full text-[13px] py-1.5"
                              autoFocus
                            />
                          </div>
                          <button
                            type="button"
                            disabled={creatingClientCategory || !newClientCategoryName.trim()}
                            onClick={handleQuickCreateClientCategory}
                            className="btn btn-primary text-[12px] py-1.5 px-3"
                          >
                            {creatingClientCategory ? '...' : t('common.add')}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddClientCategory(false); setNewClientCategoryName(''); }}
                            disabled={creatingClientCategory}
                            className="btn btn-secondary text-[12px] py-1.5 px-3"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.stockAlert')} <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={formData.stock_alert}
                      onChange={(e) => setFormData((p) => ({ ...p, stock_alert: e.target.value }))}
                      className="input w-full"
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('stock.activeProduct')}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Fixed bottom buttons */}
              <div className="flex gap-3 px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 flex-shrink-0">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="spinner w-4 h-4"></span>
                  ) : selectedProduct ? t('common.update') : t('common.add')}
                </button>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary flex-1" data-tour="products-form-cancel">
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => selectedProduct && deleteMutation.mutate(selectedProduct.id)}
        title={t('stock.deleteProduct')}
        message={t('common.confirmDeleteMsg', { name: selectedProduct?.name || '' })}
        isLoading={deleteMutation.isPending}
      />

      {/* Import Results Modal */}
      {/* Import Preview Panel */}
      {(importStep === 'preview' || importStep === 'confirming') && previewData && (
        <ImportPreviewPanel
          previewData={previewData}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
          isImporting={importStep === 'confirming'}
        />
      )}

      {/* Import Results Modal */}
      {showTour && (
        <GuidedTour
          steps={productsTourSteps}
          storageKey="products_tour_step"
          onComplete={() => setShowTour(false)}
        />
      )}

      {importResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden border border-gray-200/80 dark:border-gray-700">
            <div className="p-5 border-b border-gray-200/80 dark:border-gray-700">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">{t('stock.importResult')}</h3>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="metric-tile">
                  <div className="flex items-center gap-1.5">
                    <span className="metric-dot metric-dot-green" aria-hidden />
                    <p className="metric-label truncate">{t('stock.imported')}</p>
                  </div>
                  <p className="metric-value tnum">{importResult.created}</p>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="metric-tile">
                    <div className="flex items-center gap-1.5">
                      <span className="metric-dot metric-dot-red" aria-hidden />
                      <p className="metric-label truncate">{t('stock.errorsCount')}</p>
                    </div>
                    <p className="metric-value tnum">{importResult.errors.length}</p>
                  </div>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[12px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('stock.errorDetails')}</h4>
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="text-[13px] text-gray-700 dark:text-gray-300 p-2 rounded border border-gray-200/80 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40">
                      <span className="inline-flex items-center gap-1.5 font-medium me-1.5">
                        <span className="metric-dot metric-dot-red" aria-hidden />
                        {t('stock.row')} {err.row}:
                      </span>
                      {err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200/80 dark:border-gray-700 flex justify-end">
              <button onClick={() => setImportResult(null)} className="btn btn-primary text-[13px] h-8 px-3">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
