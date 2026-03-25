'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, brandsApi, unitsApi, clientCategoriesApi } from '@/lib/api';
import { PlusIcon, PencilIcon, TrashIcon, DocumentArrowDownIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import ImportPreviewPanel from '@/components/products/ImportPreviewPanel';
import type { ImportPreviewResponse, ImportRow } from '@/lib/types';
import DataTable from '@/components/ui/DataTable';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import type { Product, Category, Brand, Unit, ClientCategory } from '@/lib/types';
import { useLocale } from '@/lib/i18n/context';

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
  const { t, locale, dir } = useLocale();
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand_id: '',
    unit_buy_id: '',
    unit_sale_id: '',
    barcode: '',
    cost_price: '',
    stock_alert: '',
    tax_percent: '',
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
      unit_buy_id: '',
      unit_sale_id: '',
      barcode: '',
      cost_price: '',
      stock_alert: '',
      tax_percent: '',
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
      unit_buy_id: product.unit_buy_id?.toString() || '',
      unit_sale_id: product.unit_sale_id?.toString() || '',
      barcode: product.barcode || '',
      cost_price: product.cost_price?.toString() || '',
      stock_alert: product.stock_alert?.toString() || '',
      tax_percent: product.tax_percent?.toString() || '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryPrices = Object.entries(categoryPricesForm)
      .filter(([, price]) => price !== '' && price !== null)
      .map(([catId, price]) => ({
        client_category_id: parseInt(catId),
        price: parseFloat(price),
      }));

    const data = {
      ...formData,
      category_id: parseInt(formData.category_id) || null,
      brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
      unit_buy_id: parseInt(formData.unit_buy_id) || null,
      unit_sale_id: parseInt(formData.unit_sale_id) || null,
      cost_price: parseFloat(formData.cost_price) || 0,
      wholesale_price: 0,
      min_selling_price: 0,
      stock_alert: formData.stock_alert ? parseInt(formData.stock_alert) : null,
      tax_percent: formData.tax_percent ? parseFloat(formData.tax_percent) : 0,
      pieces_per_package: formData.pieces_per_package ? parseInt(formData.pieces_per_package) : 1,
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
    // Prefer available_stock (warehouse-specific with reserved deducted) if provided
    if (product.available_stock !== undefined) {
      return product.available_stock;
    }
    // Fallback to current_stock (total across warehouses)
    if (product.current_stock !== undefined) {
      return product.current_stock;
    }
    // Fallback to summing stock array
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

  const columns = [
    { key: 'name', title: t('common.name') },
    {
      key: 'category',
      title: t('stock.category'),
      render: (item: ProductWithStock) => item.category?.name || '-',
    },
    {
      key: 'brand',
      title: t('stock.brand'),
      render: (item: ProductWithStock) => item.brand?.name || '-',
    },
    {
      key: 'quantity',
      title: t('stock.quantity'),
      render: (item: ProductWithStock) => {
        const qty = getTotalStock(item);
        const isLow = item.stock_alert && qty <= item.stock_alert;
        const displayQty = Number.isInteger(qty) ? qty : Math.round(qty);
        return (
          <span className={isLow ? 'text-red-600 font-bold' : ''}>
            {displayQty}
          </span>
        );
      },
    },
    {
      key: 'cost_price',
      title: t('stock.costPrice'),
      render: (item: ProductWithStock) => {
        const unitName = item.unit_buy?.short_name || t('stock.unitLabel');
        return `${item.cost_price} د.ج/${unitName}`;
      },
    },
    {
      key: 'retail_price',
      title: t('stock.sellingPrice'),
      render: (item: ProductWithStock) => {
        const price = Number(item.retail_price);
        if (!price) return <span className="text-red-500 font-medium">{t('stock.notDefined')}</span>;
        const unitName = item.unit_sale?.short_name || t('stock.unitLabel');
        return <span className="font-medium text-green-700 dark:text-green-400">{item.retail_price} د.ج/{unitName}</span>;
      },
    },
    {
      key: 'category_prices',
      title: t('stock.categoryPrices'),
      render: (item: ProductWithStock) => {
        const prices = item.category_prices;
        if (!prices || prices.length === 0) {
          return <span className="text-gray-400">-</span>;
        }
        const ppp = item.pieces_per_package || 1;
        return (
          <div className="flex flex-wrap gap-1">
            {prices.map((cp) => (
              <span key={cp.id} className="inline-block px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
                {cp.price} د.ج
                {ppp > 1 && (
                  <span className="text-[10px] text-amber-500 dark:text-amber-500 me-1">({(Number(cp.price) * ppp).toFixed(0)} د.ج/كرتون)</span>
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
      render: (item: ProductWithStock) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(item);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-4 hidden sm:flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <span className="font-medium">{t('common.shortcuts') + ':'}</span>
          <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> {t('common.addNew')}</span>
        </div>
        <button
          onClick={() => { localStorage.removeItem('products_tour_step'); setShowTour(true); }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
        >
          <QuestionMarkCircleIcon className="w-4 h-4" />
          {t('common.guidedTour')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div data-tour="products-title">
          <h1 className="text-2xl font-bold text-gray-800">{t('stock.productsTitle')}</h1>
          <p className="text-gray-500 mt-1">{t('stock.productsSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadTemplate} className="btn btn-secondary" title="تحميل نموذج الاستيراد" data-tour="products-download-template">
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('stock.downloadTemplate')}</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary"
            disabled={importStep !== 'idle'}
            title="استيراد منتجات من Excel"
            data-tour="products-import"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{importStep === 'uploading' ? t('stock.reading') : t('stock.importExcel')}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className="hidden"
          />
          <button onClick={exportToPDF} className="btn btn-secondary" data-tour="products-export">
            <DocumentArrowDownIcon className="w-5 h-5" />
            PDF
          </button>
          <button onClick={exportToExcel} className="btn btn-secondary">
            <DocumentArrowDownIcon className="w-5 h-5" />
            Excel
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary" data-tour="products-add">
            <PlusIcon className="w-5 h-5" />
            {t('stock.addProduct')}
            <kbd className="hidden sm:inline bg-blue-700 px-1.5 py-0.5 rounded text-xs">Insert</kbd>
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto" data-tour="products-table">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          searchable
          searchPlaceholder={t('stock.searchProduct')}
          onSearch={setSearch}
          pagination={
            data && {
              currentPage: data.current_page,
              lastPage: data.last_page,
              total: data.total,
              perPage: data.per_page,
              onPageChange: setPage,
            }
          }
          emptyMessage={t('stock.noProducts')}
        />
      </div>

      {/* Floating Side Panel */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCloseModal} />
          {/* Panel */}
          <div className={`fixed top-0 bottom-0 z-50 w-full sm:w-[460px] sm:max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in duration-200 ${dir === 'rtl' ? 'left-0 sm:left-4 sm:top-4 sm:bottom-4 slide-in-from-left' : 'right-0 sm:right-4 sm:top-4 sm:bottom-4 slide-in-from-right'}`} data-tour="products-panel">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <h2 className="text-lg font-bold dark:text-white">{selectedProduct ? t('stock.editProduct') : t('stock.addNewProduct')}</h2>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div data-tour="products-form-name">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.productName')}</label>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.category')}</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
                      className="select w-full"
                      required
                    >
                      <option value="">{t('stock.selectCategory')}</option>
                      {(categories as Category[])?.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.brandFull')}</label>
                    <select
                      value={formData.brand_id}
                      onChange={(e) => setFormData((p) => ({ ...p, brand_id: e.target.value }))}
                      className="select w-full"
                    >
                      <option value="">{t('stock.selectBrand')}</option>
                      {(brands as Brand[])?.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-tour="products-form-units">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.buyUnit')}</label>
                    <select
                      value={formData.unit_buy_id}
                      onChange={(e) => setFormData((p) => ({ ...p, unit_buy_id: e.target.value }))}
                      className="select w-full"
                      required
                    >
                      <option value="">{t('stock.selectUnit')}</option>
                      {(units as Unit[])?.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.sellUnit')}</label>
                    <select
                      value={formData.unit_sale_id}
                      onChange={(e) => setFormData((p) => ({ ...p, unit_sale_id: e.target.value }))}
                      className="select w-full"
                      required
                    >
                      <option value="">{t('stock.selectUnit')}</option>
                      {(units as Unit[])?.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div data-tour="products-form-pieces">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('stock.piecesIn', { unit: (units as Unit[])?.find(u => u.id.toString() === formData.unit_buy_id)?.name || t('stock.unitLabel') })}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.costPricePerUnit')}</label>
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
                  </div>
                </div>

                {/* Category Prices */}
                {(clientCategories as ClientCategory[])?.length > 0 && (
                  <div className="border dark:border-gray-600 rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20" data-tour="products-form-catprices">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-400 text-sm mb-2">{t('stock.categoryPricesTitle')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(clientCategories as ClientCategory[])?.map((cat) => (
                        <div key={cat.id}>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">{cat.name}</label>
                          <input
                            type="number"
                            value={categoryPricesForm[cat.id.toString()] || ''}
                            onChange={(e) => setCategoryPricesForm(prev => ({ ...prev, [cat.id.toString()]: e.target.value }))}
                            className="input w-full text-sm"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock.stockAlert')}</label>
                    <input
                      type="number"
                      value={formData.stock_alert}
                      onChange={(e) => setFormData((p) => ({ ...p, stock_alert: e.target.value }))}
                      className="input w-full"
                      min="0"
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
              <div className="flex gap-3 px-5 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold dark:text-white">{t('stock.importResult')}</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center">
                  <div className="text-2xl font-bold">{importResult.created}</div>
                  <div className="text-xs">{t('stock.imported')}</div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-center">
                    <div className="text-2xl font-bold">{importResult.errors.length}</div>
                    <div className="text-xs">{t('stock.errorsCount')}</div>
                  </div>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-red-600">{t('stock.errorDetails')}</h4>
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-2 rounded">
                      <span className="font-medium">{t('stock.row')} {err.row}:</span> {err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button onClick={() => setImportResult(null)} className="btn btn-primary">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
