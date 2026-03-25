'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { vanSessionsApi, productsApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  retail_price: number;
  wholesale_price: number;
  cost_price: number;
  pieces_per_package: number;
  category?: { id: number; name: string };
}

interface StockInfo {
  product_id: number;
  quantity: number;
}

interface SessionItem {
  product_id: number;
  product: Product;
  quantity: number;
  available_stock: number;
}

export default function NewVanSessionPage() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const router = useRouter();
  const searchParams = useSearchParams();
  const productSearchRef = useRef<HTMLInputElement>(null);

  // Get params from URL
  const livreurId = searchParams.get('livreur_id');
  const vehicleId = searchParams.get('vehicle_id');
  const warehouseId = searchParams.get('warehouse_id');
  const date = searchParams.get('date');
  const notes = searchParams.get('notes') || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockInfo, setStockInfo] = useState<StockInfo[]>([]);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  useEffect(() => {
    if (!livreurId || !warehouseId || !date) {
      toast.error(t('vanSales.incompleteSessionInfo'));
      router.push('/dashboard/van-sales');
      return;
    }
    fetchProducts();
  }, [livreurId, warehouseId, date, router]);

  const fetchProducts = async () => {
    try {
      const [productsRes, stockRes] = await Promise.all([
        productsApi.getAll({ per_page: 1000 }),
        warehousesApi.getStock(parseInt(warehouseId!)),
      ]);
      setProducts(productsRes.data.data || productsRes.data);
      setStockInfo(stockRes.data.data || stockRes.data);
    } catch (error) {
      toast.error(t('vanSales.errorLoadingProducts'));
    }
  };

  const getAvailableStock = (productId: number): number => {
    const stock = stockInfo.find(s => s.product_id === productId);
    return stock ? stock.quantity : 0;
  };

  const addProduct = (product: Product) => {
    const existingIndex = items.findIndex(i => i.product_id === product.id);
    if (existingIndex >= 0) {
      toast.error(t('vanSales.productAlreadyAdded'));
      return;
    }

    const availableStock = getAvailableStock(product.id);
    if (availableStock <= 0) {
      toast.error(t('vanSales.noStockAvailable'));
      return;
    }

    setItems([
      ...items,
      {
        product_id: product.id,
        product,
        quantity: 1,
        available_stock: availableStock,
      },
    ]);
    setSearchTerm('');
    setShowProductSearch(false);
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    const item = newItems[index];
    if (quantity > item.available_stock) {
      toast.error(`${t('vanSales.availableQuantity')} ${item.available_stock}`);
      return;
    }
    if (quantity < 1) {
      quantity = 1;
    }
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const removeProduct = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error(t('vanSales.mustAddProduct'));
      return;
    }

    setIsSubmitting(true);
    try {
      await vanSessionsApi.create({
        livreur_id: parseInt(livreurId!),
        vehicle_id: vehicleId ? parseInt(vehicleId) : null,
        warehouse_id: parseInt(warehouseId!),
        date,
        notes,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });
      toast.success(t('vanSales.sessionCreated'));
      router.push('/dashboard/van-sales');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('vanSales.errorCreatingSession'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.product.retail_price, 0);

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.barcode?.includes(term);
  }).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/van-sales" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowRightIcon className={`w-6 h-6 ${!isRTL ? 'rotate-180' : ''}`} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('vanSales.newSessionTitle')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('vanSales.newSessionSubtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Search */}
          <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
            <div className="relative">
              <input
                ref={productSearchRef}
                type="text"
                placeholder={t('vanSales.searchProductPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowProductSearch(e.target.value.length > 0);
                }}
                onFocus={() => setShowProductSearch(searchTerm.length > 0)}
                className={`input input-bordered w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${isRTL ? 'pr-10' : 'pl-10'}`}
              />
              <MagnifyingGlassIcon className={`w-5 h-5 absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />

              {/* Search Results Dropdown */}
              {showProductSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">{t('vanSales.noResults')}</div>
                  ) : (
                    filteredProducts.map(product => {
                      const stock = getAvailableStock(product.id);
                      return (
                        <button
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className="w-full px-4 py-3 text-start hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.sku} {product.barcode && `| ${product.barcode}`}
                            </div>
                          </div>
                          <div className={isRTL ? 'text-left' : 'text-right'}>
                            <div className="font-medium text-green-600 dark:text-green-400">{formatCurrency(product.retail_price)}</div>
                            <div className={`text-sm ${stock > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-500 dark:text-red-400'}`}>
                              {t('vanSales.available')} {stock}
                            </div>
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
          <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">{t('vanSales.product')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">{t('vanSales.availableStock')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">{t('vanSales.price')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">{t('vanSales.quantity')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">{t('vanSales.total')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t('vanSales.noProductsAdded')}
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.product.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.product.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                        {item.available_stock}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                        {formatCurrency(item.product.retail_price)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="btn btn-sm btn-ghost"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                            className="input input-bordered input-sm w-20 text-center dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            min={1}
                            max={item.available_stock}
                          />
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="btn btn-sm btn-ghost"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.quantity * item.product.retail_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeProduct(index)}
                          className="btn btn-ghost btn-sm text-red-600 dark:text-red-400"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{t('vanSales.sessionSummary')}</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('vanSales.productCount')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('vanSales.totalUnits')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-lg">
                <span className="font-medium text-gray-900 dark:text-gray-100">{t('vanSales.totalValue')}</span>
                <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(totalValue)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || items.length === 0}
              className="btn btn-primary w-full"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5" />
                  {t('vanSales.createSession')}
                </>
              )}
            </button>
          </div>

          <div className="card p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t('vanSales.noteTitle')}</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {t('vanSales.noteText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
