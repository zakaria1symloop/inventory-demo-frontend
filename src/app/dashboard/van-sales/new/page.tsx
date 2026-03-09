'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { vanSessionsApi, productsApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';
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
      toast.error('معلومات الجلسة غير مكتملة');
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
      toast.error('خطأ في تحميل المنتجات');
    }
  };

  const getAvailableStock = (productId: number): number => {
    const stock = stockInfo.find(s => s.product_id === productId);
    return stock ? stock.quantity : 0;
  };

  const addProduct = (product: Product) => {
    const existingIndex = items.findIndex(i => i.product_id === product.id);
    if (existingIndex >= 0) {
      toast.error('المنتج مضاف مسبقاً');
      return;
    }

    const availableStock = getAvailableStock(product.id);
    if (availableStock <= 0) {
      toast.error('لا توجد كمية متوفرة من هذا المنتج');
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
      toast.error(`الكمية المتوفرة: ${item.available_stock}`);
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
      toast.error('يجب إضافة منتج واحد على الأقل');
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
      toast.success('تم إنشاء جلسة البيع المتنقل بنجاح');
      router.push('/dashboard/van-sales');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في إنشاء الجلسة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
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
        <Link href="/dashboard/van-sales" className="text-gray-500 hover:text-gray-700">
          <ArrowRightIcon className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">جلسة بيع متنقل جديدة</h1>
          <p className="text-gray-500 mt-1">إضافة المنتجات للتحميل على الشاحنة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Search */}
          <div className="card p-4">
            <div className="relative">
              <input
                ref={productSearchRef}
                type="text"
                placeholder="بحث عن منتج بالاسم أو الباركود..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowProductSearch(e.target.value.length > 0);
                }}
                onFocus={() => setShowProductSearch(searchTerm.length > 0)}
                className="input input-bordered w-full pr-10"
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

              {/* Search Results Dropdown */}
              {showProductSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">لا توجد نتائج</div>
                  ) : (
                    filteredProducts.map(product => {
                      const stock = getAvailableStock(product.id);
                      return (
                        <button
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className="w-full px-4 py-3 text-right hover:bg-gray-50 flex justify-between items-center border-b last:border-b-0"
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.sku} {product.barcode && `| ${product.barcode}`}
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-green-600">{formatCurrency(product.retail_price)}</div>
                            <div className={`text-sm ${stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                              متوفر: {stock}
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
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المنتج</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">المتوفر</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">السعر</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الكمية</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">المجموع</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      لم يتم إضافة منتجات بعد
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.product_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-gray-500">{item.product.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {item.available_stock}
                      </td>
                      <td className="px-4 py-3 text-center">
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
                            className="input input-bordered input-sm w-20 text-center"
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
                      <td className="px-4 py-3 text-center font-medium">
                        {formatCurrency(item.quantity * item.product.retail_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeProduct(index)}
                          className="btn btn-ghost btn-sm text-red-600"
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
          <div className="card p-4 space-y-4">
            <h3 className="font-bold text-lg">ملخص الجلسة</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">عدد المنتجات:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">إجمالي الوحدات:</span>
                <span className="font-medium">{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-medium">القيمة الإجمالية:</span>
                <span className="font-bold text-green-600">{formatCurrency(totalValue)}</span>
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
                  إنشاء الجلسة
                </>
              )}
            </button>
          </div>

          <div className="card p-4 bg-blue-50">
            <h4 className="font-medium text-blue-800 mb-2">ملاحظة</h4>
            <p className="text-sm text-blue-700">
              بعد إنشاء الجلسة، يمكنك بدء البيع من صفحة التفاصيل. سيتم خصم المخزون عند بدء الجلسة وإرجاع المنتجات غير المباعة عند الإنتهاء.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
