'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vanSessionsApi, usersApi, vehiclesApi, productsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  role: string;
}

interface Vehicle {
  id: number;
  name: string;
  plate_number?: string;
}

interface Product {
  id: number;
  name: string;
  retail_price: number;
  cost_price: number;
  pieces_per_package?: number;
  barcode?: string;
}

interface SessionItem {
  product_id: number;
  product_name: string;
  quantity: number;
  retail_price: number;
}

export default function EditVanSession() {
  const params = useParams();
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);

  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [sessionRef, setSessionRef] = useState('');

  const [formData, setFormData] = useState({
    livreur_id: '',
    vehicle_id: '',
    date: '',
    notes: '',
  });

  const [items, setItems] = useState<SessionItem[]>([]);

  // Extract ID
  useEffect(() => {
    const paramId = params.id as string;
    if (paramId && paramId !== '_') {
      setId(paramId);
    } else if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const idx = pathParts.indexOf('van-sessions');
      if (idx >= 0 && pathParts[idx + 1]) {
        setId(pathParts[idx + 1]);
      }
    }
  }, [params.id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [sessionRes, livreursRes, vehiclesRes, productsRes] = await Promise.all([
        vanSessionsApi.getOne(parseInt(id)),
        usersApi.getAll({ roles: 'livreur,cashvan', active_only: true, per_page: 100 }),
        vehiclesApi.getAll({ per_page: 100 }),
        productsApi.getAll({ per_page: 500 }),
      ]);

      const session = sessionRes.data.data || sessionRes.data;

      if (session.status !== 'preparing') {
        toast.error('لا يمكن تعديل الجلسة بعد البدء');
        router.push(`/dashboard/van-sessions/${id}`);
        return;
      }

      setSessionRef(session.reference || `#${session.id}`);
      setFormData({
        livreur_id: String(session.livreur_id),
        vehicle_id: session.vehicle_id ? String(session.vehicle_id) : '',
        date: session.date,
        notes: session.notes || '',
      });

      const allProducts = productsRes.data.data || productsRes.data;
      setProducts(allProducts);

      // Map existing items
      if (session.items && session.items.length > 0) {
        setItems(session.items.map((item: { product_id: number; quantity_loaded: number; product?: { name: string; retail_price: number } }) => {
          const prod = allProducts.find((p: Product) => p.id === item.product_id);
          return {
            product_id: item.product_id,
            product_name: item.product?.name || prod?.name || `منتج #${item.product_id}`,
            quantity: item.quantity_loaded,
            retail_price: item.product?.retail_price || prod?.retail_price || 0,
          };
        }));
      }

      setLivreurs((livreursRes.data.data || livreursRes.data).filter((u: User) => u.role === 'livreur' || u.role === 'cashvan'));
      setVehicles(vehiclesRes.data.data || vehiclesRes.data);
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = (product: Product) => {
    if (items.find(i => i.product_id === product.id)) {
      toast.error('المنتج مضاف مسبقاً');
      return;
    }
    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      retail_price: product.retail_price,
    }]);
    setProductSearch('');
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) return;
    setItems(items.map(i => i.product_id === productId ? { ...i, quantity } : i));
  };

  const removeItem = (productId: number) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.retail_price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!formData.livreur_id) {
      toast.error('يرجى اختيار السائق');
      return;
    }
    if (items.length === 0) {
      toast.error('يرجى إضافة منتج واحد على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      await vanSessionsApi.update(parseInt(id), {
        livreur_id: parseInt(formData.livreur_id),
        vehicle_id: formData.vehicle_id ? parseInt(formData.vehicle_id) : null,
        date: formData.date,
        notes: formData.notes || null,
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      });
      toast.success('تم تحديث الجلسة بنجاح');
      router.push(`/dashboard/van-sessions/${id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في تحديث الجلسة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);

  const filteredProducts = products.filter(p =>
    productSearch.length >= 1 &&
    (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
     (p.barcode && p.barcode.includes(productSearch)))
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">تعديل الجلسة {sessionRef}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">تعديل معلومات الجلسة والمنتجات المحملة</p>
        </div>
        <Link href={`/dashboard/van-sessions/${id}`} className="btn btn-secondary">رجوع</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Info */}
          <div className="lg:col-span-1">
            <div className="card space-y-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2">معلومات الجلسة</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السائق / البائع المتنقل *</label>
                <select
                  value={formData.livreur_id}
                  onChange={(e) => setFormData(p => ({ ...p, livreur_id: e.target.value }))}
                  className="select"
                  required
                >
                  <option value="">اختر السائق...</option>
                  {livreurs.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.role === 'cashvan' ? 'بائع متنقل' : 'سائق'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المركبة</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData(p => ({ ...p, vehicle_id: e.target.value }))}
                  className="select"
                >
                  <option value="">بدون مركبة</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} {v.plate_number ? `(${v.plate_number})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="input"
                  rows={3}
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">عدد المنتجات:</span>
                  <span className="font-bold dark:text-white">{items.length}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">إجمالي الكمية:</span>
                  <span className="font-bold dark:text-white">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="flex justify-between border-t dark:border-gray-700 pt-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">القيمة الإجمالية:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalValue)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? <span className="spinner w-4 h-4"></span> : 'حفظ التعديلات'}
              </button>
            </div>
          </div>

          {/* Products Selection */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2 mb-4">المنتجات المحملة</h2>

              {/* Product Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="input"
                  placeholder="ابحث عن منتج بالاسم أو الباركود..."
                />
                {filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="w-full px-4 py-2 text-right hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center"
                      >
                        <span className="dark:text-white">{product.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(product.retail_price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items Table */}
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p>ابحث عن منتجات وأضفها للجلسة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>المجموع</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.product_id}>
                          <td>{idx + 1}</td>
                          <td className="font-medium dark:text-white">{item.product_name}</td>
                          <td>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product_id, parseFloat(e.target.value) || 0)}
                              className="input w-24 text-center"
                              min="0.01"
                              step="0.01"
                            />
                          </td>
                          <td className="text-gray-500 dark:text-gray-400">{formatCurrency(item.retail_price)}</td>
                          <td className="font-medium dark:text-white">{formatCurrency(item.quantity * item.retail_price)}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeItem(item.product_id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={4} className="text-left dark:text-white">الإجمالي</td>
                        <td className="text-blue-600 dark:text-blue-400">{formatCurrency(totalValue)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
