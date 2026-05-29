'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi, clientsApi, productsApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/dashboard';
import { useLocale } from '@/lib/i18n/context';

interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  client_category_id?: number;
  client_category?: { id: number; name: string };
}

interface Product {
  id: number;
  name: string;
  barcode?: string;
  retail_price: number;
  wholesale_price: number;
  min_selling_price: number;
  tax_percent: number;
  tax_type: 'exclusive' | 'inclusive';
  pieces_per_package: number;
  stock?: Array<{ warehouse_id: number; quantity: number }>;
}

interface Warehouse {
  id: number;
  name: string;
  is_main: boolean;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  extra_pieces: number;
  unit_price: number;
  pieces_per_package: number;
  discount: number;
  tax_percent: number;
  tax_amount: number;
  subtotal: number;
  total_with_tax: number;
  available_stock: number;
  min_price: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedClient, setSelectedClient] = useState<number>(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [globalTaxRate, setGlobalTaxRate] = useState<number>(0); // Default TVA 0% - user controls

  // Available stock state (product_id -> available quantity)
  const [availableStockMap, setAvailableStockMap] = useState<Record<number, number>>({});
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Client category prices (product_id -> category price)
  const [clientCategoryPrices, setClientCategoryPrices] = useState<Record<number, number>>({});

  // Search state
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch available stock when warehouse changes
  useEffect(() => {
    if (selectedWarehouse) {
      fetchAvailableStock();
    }
  }, [selectedWarehouse]);

  const fetchAvailableStock = async () => {
    if (!selectedWarehouse) return;
    setIsLoadingStock(true);
    try {
      const response = await productsApi.getAvailableStockBulk(selectedWarehouse);
      const stockData = response.data;
      const stockMap: Record<number, number> = {};
      stockData.forEach((item: { product_id: number; available_stock: number }) => {
        stockMap[item.product_id] = item.available_stock;
      });
      setAvailableStockMap(stockMap);
    } catch (error) {
      console.error('Error fetching available stock:', error);
    } finally {
      setIsLoadingStock(false);
    }
  };

  const fetchData = async () => {
    try {
      const [clientsRes, productsRes, warehousesRes] = await Promise.all([
        clientsApi.getAll({ per_page: 1000 }),
        productsApi.getAll({ per_page: 1000 }),
        warehousesApi.getAll(),
      ]);
      setClients(clientsRes.data.data || clientsRes.data);
      setProducts(productsRes.data.data || productsRes.data);
      const warehouseData = warehousesRes.data.data || warehousesRes.data;
      setWarehouses(warehouseData);
      const mainWarehouse = warehouseData.find((w: Warehouse) => w.is_main);
      if (mainWarehouse) setSelectedWarehouse(mainWarehouse.id);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const addProductToOrder = (product: Product) => {
    if (orderItems.find(item => item.product_id === product.id)) {
      toast.error('المنتج موجود بالفعل في الطلب');
      return;
    }

    if (!selectedWarehouse) {
      toast.error('يرجى اختيار المستودع أولاً');
      return;
    }

    // Use available stock from the map (considers reserved quantities)
    const availableStock = availableStockMap[product.id] ?? 0;

    if (availableStock < 1) {
      toast.error(`المنتج "${product.name}" غير متوفر في المخزون (الكمية المتاحة: ${availableStock})`);
      return;
    }

    const categoryPrice = clientCategoryPrices[product.id];
    const unitPrice = categoryPrice ?? (parseFloat(String(product.wholesale_price)) || parseFloat(String(product.retail_price)) || 0);
    const taxPercent = parseFloat(String(product.tax_percent)) || 0;
    const piecesPerPkg = Number(product.pieces_per_package) || 1;
    // Price per piece × pieces_per_package × quantity
    const subtotal = unitPrice * piecesPerPkg * 1; // qty=1 initially
    const taxAmount = (subtotal * taxPercent) / 100;
    const totalWithTax = product.tax_type === 'exclusive' ? subtotal + taxAmount : subtotal;

    setOrderItems([...orderItems, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      extra_pieces: 0,
      unit_price: unitPrice,
      pieces_per_package: piecesPerPkg,
      discount: 0,
      tax_percent: taxPercent,
      tax_amount: taxAmount,
      subtotal: subtotal,
      total_with_tax: totalWithTax,
      available_stock: availableStock,
      min_price: Number(product.min_selling_price) || 0,
    }]);

    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updateOrderItem = (index: number, field: string, value: number) => {
    const newItems = [...orderItems];
    const currentItem = newItems[index];
    const piecesPerPkg = Number(currentItem.pieces_per_package) || 1;

    // Clamp extra_pieces to 0..ppp-1
    if (field === 'extra_pieces') {
      value = Math.max(0, Math.min(value, piecesPerPkg - 1));
    }

    // Check stock availability when updating quantity or extra_pieces (both in pieces)
    if (field === 'quantity' || field === 'extra_pieces') {
      const newQty = field === 'quantity' ? (Number(value) || 0) : currentItem.quantity;
      const newExtra = field === 'extra_pieces' ? (Number(value) || 0) : currentItem.extra_pieces;
      const totalPieces = (newQty * piecesPerPkg) + newExtra;
      if (totalPieces > currentItem.available_stock) {
        toast.error(`الكمية المتوفرة: ${Math.round(currentItem.available_stock)} فقط`);
        return;
      }
    }

    const item = { ...currentItem, [field]: parseFloat(String(value)) || 0 };

    // Recalculate: price per piece × totalPieces - discount
    const qty = parseFloat(String(item.quantity)) || 0;
    const extraPieces = Number(item.extra_pieces) || 0;
    const price = parseFloat(String(item.unit_price)) || 0;
    const disc = parseFloat(String(item.discount)) || 0;
    const taxPct = parseFloat(String(item.tax_percent)) || 0;

    const totalPieces = (qty * piecesPerPkg) + extraPieces;
    const subtotal = (price * totalPieces) - disc;
    const taxAmount = (subtotal * taxPct) / 100;
    item.subtotal = subtotal;
    item.tax_amount = taxAmount;
    item.total_with_tax = subtotal + taxAmount;

    newItems[index] = item;
    setOrderItems(newItems);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const selectClient = async (client: Client) => {
    setSelectedClient(client.id);
    setClientSearch(client.name);
    setShowClientDropdown(false);

    // Fetch category prices for this client
    try {
      const response = await productsApi.getPricesForClient(client.id);
      const prices: Record<number, number> = response.data.prices || {};
      setClientCategoryPrices(prices);

      // Re-price existing order items with category prices
      if (Object.keys(prices).length > 0) {
        setOrderItems(prev => prev.map(item => {
          if (prices[item.product_id]) {
            const newPrice = prices[item.product_id];
            const piecesPerPkg = Number(item.pieces_per_package) || 1;
            const totalPieces = (item.quantity * piecesPerPkg) + (item.extra_pieces || 0);
            const subtotal = (newPrice * totalPieces) - item.discount;
            const taxAmount = (subtotal * item.tax_percent) / 100;
            return {
              ...item,
              unit_price: newPrice,
              subtotal,
              tax_amount: taxAmount,
              total_with_tax: subtotal + taxAmount,
            };
          }
          return item;
        }));
      }
    } catch {
      // Ignore - use default prices
      setClientCategoryPrices({});
    }
  };

  // Calculations - subtotal already includes quantity from updateOrderItem
  const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const totalTax = orderItems.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0);
  const grandTotal = subtotal + totalTax - (Number(orderDiscount) || 0);

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast.error('يرجى اختيار العميل');
      return;
    }
    if (!selectedWarehouse) {
      toast.error('يرجى اختيار المستودع');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('يرجى إضافة منتج واحد على الأقل');
      return;
    }

    // Validate prices and stock
    for (const item of orderItems) {
      if (item.unit_price < item.min_price) {
        toast.error(`سعر "${item.product_name}" أقل من الحد الأدنى (${item.min_price})`);
        return;
      }
      const ppp = Number(item.pieces_per_package) || 1;
      const totalPieces = (item.quantity * ppp) + (item.extra_pieces || 0);
      if (totalPieces > item.available_stock) {
        toast.error(`الكمية المطلوبة لـ "${item.product_name}" (${totalPieces}) أكبر من المتوفر (${Math.round(item.available_stock)})`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await ordersApi.create({
        client_id: selectedClient,
        warehouse_id: selectedWarehouse,
        date: new Date().toISOString().split('T')[0],
        discount: orderDiscount,
        tax: totalTax,
        notes: orderNotes,
        items: orderItems.map(item => {
          const ppp = Number(item.pieces_per_package) || 1;
          const totalPieces = (item.quantity * ppp) + (item.extra_pieces || 0);
          return {
            product_id: item.product_id,
            quantity: totalPieces,
            unit_price: item.unit_price,
            discount: item.discount,
            tax_percent: item.tax_percent,
          };
        }),
      });
      toast.success('تم إنشاء الطلب بنجاح');
      router.push('/dashboard/orders');
    } catch (error) {
      toast.error('خطأ في إنشاء الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.barcode?.includes(productSearch)
  ).slice(0, 10);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch)
  ).slice(0, 10);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <PageHeader
        title="إنشاء طلب جديد"
        subtitle="إضافة طلب جديد للعميل"
        breadcrumb={[
          { label: t('sidebar.orders'), href: '/dashboard/orders' },
          { label: 'إنشاء طلب جديد' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Client & Warehouse Selection */}
          <div className="surface-pro p-4">
            <h3 className="surface-heading mb-3">معلومات الطلب</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Search */}
              <div className="relative">
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  العميل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                      if (!e.target.value) setSelectedClient(0);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="ابحث عن عميل..."
                    className="input w-full text-[13px] py-2 pr-10"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {showClientDropdown && clientSearch && filteredClients.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => selectClient(client)}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="t-strong text-[13px]">{client.name}</div>
                        <div className="text-[12px] text-gray-500 dark:text-gray-400">
                          {client.phone || '-'} | {client.address || 'بدون عنوان'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warehouse Selection */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  المستودع <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
                  className="select w-full text-[13px] py-2"
                >
                  <option value={0}>اختر المستودع</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} {warehouse.is_main && '(الرئيسي)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="surface-pro p-4">
            <h3 className="surface-heading mb-3">المنتجات</h3>

            {/* Product Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="ابحث عن منتج بالاسم أو الباركود..."
                className="input w-full text-[13px] py-2 pr-10"
              />
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

              {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {isLoadingStock && (
                    <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-[12px]">جاري تحميل المخزون...</div>
                  )}
                  {filteredProducts.map((product) => {
                    // Use available stock from map (considers reserved quantities)
                    const availableStock = availableStockMap[product.id] ?? 0;
                    const rawStock = product.stock?.find(s => s.warehouse_id === selectedWarehouse)?.quantity || 0;
                    const reserved = Number(rawStock) - availableStock;
                    return (
                      <div
                        key={product.id}
                        onClick={() => addProductToOrder(product)}
                        className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${availableStock < 1 ? 'opacity-50' : ''}`}
                      >
                        <div className="flex justify-between">
                          <span className="t-strong text-[13px]">{product.name}</span>
                          <span className="tnum t-strong text-[13px]">
                            {formatCurrency(product.wholesale_price || product.retail_price)} /قطعة
                          </span>
                        </div>
                        {(product.pieces_per_package || 1) > 1 && (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 text-left">
                            {formatCurrency((product.wholesale_price || product.retail_price) * product.pieces_per_package)} /كرتون
                          </div>
                        )}
                        <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          <span>باركود: {product.barcode || '-'}</span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`metric-dot ${availableStock > 0 ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                            متاح: {availableStock}
                            {reserved > 0 && <span className="t-muted">(محجوز: {reserved})</span>}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          TVA: {product.tax_percent || globalTaxRate}% | الحد الأدنى: {formatCurrency(product.min_selling_price || 0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Items Table */}
            {orderItems.length > 0 ? (
              <div className="table-pro-wrap">
                <table className="table-pro compact">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th className="text-center">كرتون</th>
                      <th className="text-center">قطعة</th>
                      <th className="text-center">السعر/قطعة</th>
                      <th className="text-center">قطع/وحدة</th>
                      <th className="text-center">الخصم</th>
                      <th className="text-center">TVA</th>
                      <th className="text-center">المجموع</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => (
                      <tr key={item.product_id}>
                        <td>
                          <div className="t-strong text-[13px]">{item.product_name}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            متاح: {item.available_stock}
                          </div>
                        </td>
                        <td className="text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', Math.max(0, Number(e.target.value)))}
                            min={0}
                            className="input w-16 text-center !px-2 tnum text-[13px] py-1.5"
                          />
                          <div className="text-[10px] text-gray-500 mt-0.5">crt</div>
                        </td>
                        <td className="text-center">
                          {item.pieces_per_package > 1 ? (
                            <>
                              <input
                                type="number"
                                value={item.extra_pieces}
                                onChange={(e) => updateOrderItem(index, 'extra_pieces', Number(e.target.value))}
                                min={0}
                                max={item.pieces_per_package - 1}
                                className="input w-16 text-center !px-2 tnum text-[13px] py-1.5"
                              />
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                pc · {(item.quantity * item.pieces_per_package) + (item.extra_pieces || 0)}
                              </div>
                            </>
                          ) : (
                            <span className="t-muted">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateOrderItem(index, 'unit_price', Number(e.target.value))}
                            min={0}
                            className={`input w-24 text-center !px-2 tnum text-[13px] py-1.5 ${item.unit_price < item.min_price ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
                          />
                          {item.pieces_per_package > 1 && (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-0.5 tnum">
                              {formatCurrency(item.unit_price * item.pieces_per_package)}/crt
                            </div>
                          )}
                        </td>
                        <td className="text-center tnum t-muted">{item.pieces_per_package}</td>
                        <td className="text-center">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateOrderItem(index, 'discount', Number(e.target.value))}
                            min={0}
                            className="input w-20 text-center !px-2 tnum text-[13px] py-1.5"
                          />
                        </td>
                        <td className="text-center">
                          <div className="tnum text-[13px]">{item.tax_percent}%</div>
                          <div className="text-[11px] text-gray-500 tnum">{formatCurrency(item.tax_amount)}</div>
                        </td>
                        <td className="text-center tnum t-strong">
                          {formatCurrency(item.total_with_tax)}
                          <div className="text-[10px] text-gray-400 tnum">
                            {formatCurrency(item.subtotal)} + TVA
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => removeOrderItem(index)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-[13px]">
                <PlusIcon className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>ابحث عن منتج لإضافته إلى الطلب</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="surface-pro p-4">
            <h3 className="surface-heading mb-3">ملاحظات</h3>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="input w-full text-[13px] py-2"
              rows={3}
              placeholder="ملاحظات إضافية على الطلب..."
            />
          </div>
        </div>

        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-1">
          <div className="surface-pro p-4 sticky top-4">
            <h3 className="surface-heading mb-3">ملخص الطلب</h3>

            {selectedClient > 0 && (
              <div className="mb-4 p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">العميل المحدد</div>
                <div className="t-strong text-[13px] mt-0.5">{clients.find(c => c.id === selectedClient)?.name}</div>
              </div>
            )}

            <div className="space-y-2 mb-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">عدد المنتجات</span>
                <span className="tnum t-strong">{orderItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">إجمالي الكميات</span>
                <span className="tnum t-strong">{orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">المجموع الفرعي</span>
                <span className="tnum">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">TVA</span>
                <span className="tnum">{formatCurrency(totalTax)}</span>
              </div>

              {/* Order Discount */}
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">خصم إضافي</span>
                <input
                  type="number"
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(Number(e.target.value))}
                  min={0}
                  className="input w-24 text-left !px-2 tnum text-[13px] py-1.5"
                  placeholder="0"
                />
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 mb-4" />
            <div className="flex justify-between text-[14px] font-semibold text-gray-900 dark:text-white mb-1">
              <span>المجموع الكلي</span>
              <span className="tnum">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 text-left mb-4">
              شامل TVA
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || orderItems.length === 0 || !selectedClient || !selectedWarehouse}
                className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
              </button>
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                إلغاء
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
