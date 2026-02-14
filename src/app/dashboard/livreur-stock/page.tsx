'use client';

import { useState, useEffect } from 'react';
import { deliveriesApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  barcode?: string;
  retail_price?: number;
  cost_price?: number;
}

interface DeliveryStockItem {
  product_id: number;
  product: Product;
  quantity_loaded: number;
  quantity_delivered: number;
  quantity_returned: number;
  remaining: number;
}

interface VanSessionStockItem {
  product_id: number;
  product: Product;
  quantity_loaded: number;
  quantity_sold: number;
  quantity_returned: number;
  available: number;
}

interface Vehicle {
  id: number;
  name: string;
  plate_number?: string;
}

interface LivreurDelivery {
  id: number;
  reference: string;
  status: string;
  date: string;
  vehicle?: Vehicle;
  total_orders: number;
  delivered_count: number;
  failed_count: number;
  total_amount: number;
  collected_amount: number;
  stock: DeliveryStockItem[];
}

interface LivreurVanSession {
  id: number;
  reference: string;
  status: string;
  date: string;
  vehicle?: Vehicle;
  total_loaded_value: number;
  total_sales: number;
  total_collected: number;
  sales_count: number;
  items: VanSessionStockItem[];
}

interface LivreurEntry {
  user: { id: number; name: string; phone?: string; role: string };
  deliveries: LivreurDelivery[];
  van_sessions: LivreurVanSession[];
  totals: { total_loaded: number; total_remaining: number };
}

interface LivreurStockData {
  livreurs: LivreurEntry[];
  summary: {
    total_active_livreurs: number;
    total_active_deliveries: number;
    total_active_van_sessions: number;
    total_products_loaded: number;
    total_products_remaining: number;
  };
}

const statusLabels: Record<string, string> = {
  preparing: 'تحضير',
  in_progress: 'قيد التوصيل',
  active: 'نشطة',
};

const statusColors: Record<string, string> = {
  preparing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function LivreurStockPage() {
  const [data, setData] = useState<LivreurStockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLivreur, setExpandedLivreur] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await deliveriesApi.getLivreurStock();
      setData(res.data);
    } catch {
      toast.error('خطأ في تحميل بيانات مخزون السائقين');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 2 }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ar-DZ').format(value);
  };

  const getProgressPercent = (delivered: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((delivered / total) * 100);
  };

  const filteredLivreurs = data?.livreurs.filter((l) =>
    !searchTerm || l.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">مخزون السائقين</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">البضاعة الموجودة حاليا في الشاحنات</p>
        </div>
        <button onClick={() => { setIsLoading(true); fetchData(); }} className="btn btn-secondary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          تحديث
        </button>
      </div>

      {/* Summary KPIs */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-xs text-blue-600 dark:text-blue-400 mb-1">سائقين نشطين</h3>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{data.summary.total_active_livreurs}</p>
          </div>
          <div className="card bg-orange-50 dark:bg-orange-900/20">
            <h3 className="text-xs text-orange-600 dark:text-orange-400 mb-1">توصيلات نشطة</h3>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{data.summary.total_active_deliveries}</p>
          </div>
          <div className="card bg-purple-50 dark:bg-purple-900/20">
            <h3 className="text-xs text-purple-600 dark:text-purple-400 mb-1">جلسات بيع متنقل</h3>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{data.summary.total_active_van_sessions}</p>
          </div>
          <div className="card bg-green-50 dark:bg-green-900/20">
            <h3 className="text-xs text-green-600 dark:text-green-400 mb-1">إجمالي محمّل</h3>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatNumber(data.summary.total_products_loaded)}</p>
          </div>
          <div className="card bg-red-50 dark:bg-red-900/20">
            <h3 className="text-xs text-red-600 dark:text-red-400 mb-1">متبقي في الشاحنات</h3>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatNumber(data.summary.total_products_remaining)}</p>
          </div>
        </div>
      )}

      {/* Search */}
      {data && data.livreurs.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم..."
            className="input max-w-xs"
          />
        </div>
      )}

      {/* Livreurs List */}
      {filteredLivreurs.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg">لا يوجد سائقين نشطين حاليا</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">لا توجد توصيلات أو جلسات بيع متنقل قيد التنفيذ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLivreurs.map((livreur) => {
            const isExpanded = expandedLivreur === livreur.user.id;
            const progressPercent = livreur.totals.total_loaded > 0
              ? getProgressPercent(livreur.totals.total_loaded - livreur.totals.total_remaining, livreur.totals.total_loaded)
              : 0;

            return (
              <div key={livreur.user.id} className="card">
                {/* Livreur Header - Always visible */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedLivreur(isExpanded ? null : livreur.user.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                        {livreur.user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold dark:text-white text-lg">{livreur.user.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {livreur.user.phone && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{livreur.user.phone}</span>
                        )}
                        <div className="flex items-center gap-1">
                          {livreur.deliveries.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                              {livreur.deliveries.length} توصيل
                            </span>
                          )}
                          {livreur.van_sessions.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                              {livreur.van_sessions.length} بيع متنقل
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Summary stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">محمّل</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{formatNumber(livreur.totals.total_loaded)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">متبقي</p>
                        <p className="font-bold text-orange-600 dark:text-orange-400">{formatNumber(livreur.totals.total_remaining)}</p>
                      </div>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500 dark:text-gray-400">التقدم</span>
                          <span className="font-medium dark:text-white">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${progressPercent >= 80 ? 'bg-green-500' : progressPercent >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Mobile summary (visible on small screens) */}
                <div className="flex md:hidden items-center gap-4 mt-3 pt-3 border-t dark:border-gray-700">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">محمّل</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{formatNumber(livreur.totals.total_loaded)}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">متبقي</p>
                    <p className="font-bold text-orange-600 dark:text-orange-400">{formatNumber(livreur.totals.total_remaining)}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">التقدم</span>
                      <span className="font-medium dark:text-white">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${progressPercent >= 80 ? 'bg-green-500' : progressPercent >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-6">
                    {/* Deliveries */}
                    {livreur.deliveries.map((delivery) => (
                      <div key={`del-${delivery.id}`} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-medium dark:text-white">{delivery.reference}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[delivery.status]}`}>
                              {statusLabels[delivery.status]}
                            </span>
                            {delivery.vehicle && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {delivery.vehicle.name} {delivery.vehicle.plate_number ? `(${delivery.vehicle.plate_number})` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              الطلبات: <span className="font-medium text-gray-800 dark:text-gray-200">{delivery.delivered_count}/{delivery.total_orders}</span>
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              محصّل: <span className="font-medium text-green-600">{formatCurrency(delivery.collected_amount)}</span>
                            </span>
                          </div>
                        </div>

                        {delivery.stock.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                  <th className="text-right py-2 font-medium">المنتج</th>
                                  <th className="text-center py-2 font-medium">محمّل</th>
                                  <th className="text-center py-2 font-medium">تم تسليم</th>
                                  <th className="text-center py-2 font-medium">مرتجع</th>
                                  <th className="text-center py-2 font-medium">متبقي</th>
                                  <th className="text-center py-2 font-medium">%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {delivery.stock.map((s) => {
                                  const pct = getProgressPercent(s.quantity_delivered, s.quantity_loaded);
                                  return (
                                    <tr key={s.product_id} className="border-b dark:border-gray-700/50 last:border-0">
                                      <td className="py-2">
                                        <span className="text-sm font-medium dark:text-white">{s.product?.name}</span>
                                        {s.product?.barcode && (
                                          <span className="text-xs text-gray-400 mr-2">({s.product.barcode})</span>
                                        )}
                                      </td>
                                      <td className="text-center text-sm dark:text-gray-300">{formatNumber(s.quantity_loaded)}</td>
                                      <td className="text-center text-sm text-green-600 font-medium">{formatNumber(s.quantity_delivered)}</td>
                                      <td className="text-center text-sm text-red-500">{formatNumber(s.quantity_returned)}</td>
                                      <td className="text-center">
                                        <span className={`text-sm font-bold ${s.remaining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600'}`}>
                                          {formatNumber(s.remaining)}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <div className="inline-flex items-center gap-1">
                                          <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                            <div
                                              className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{pct}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Van Sessions */}
                    {livreur.van_sessions.map((session) => (
                      <div key={`van-${session.id}`} className="bg-purple-50/50 dark:bg-purple-900/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-medium dark:text-white">{session.reference}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status]}`}>
                              {statusLabels[session.status]}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              بيع متنقل
                            </span>
                            {session.vehicle && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {session.vehicle.name} {session.vehicle.plate_number ? `(${session.vehicle.plate_number})` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              مبيعات: <span className="font-medium text-gray-800 dark:text-gray-200">{session.sales_count}</span>
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              محصّل: <span className="font-medium text-green-600">{formatCurrency(session.total_collected)}</span>
                            </span>
                          </div>
                        </div>

                        {session.items.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                  <th className="text-right py-2 font-medium">المنتج</th>
                                  <th className="text-center py-2 font-medium">محمّل</th>
                                  <th className="text-center py-2 font-medium">مباع</th>
                                  <th className="text-center py-2 font-medium">مرتجع</th>
                                  <th className="text-center py-2 font-medium">متاح</th>
                                  <th className="text-center py-2 font-medium">%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {session.items.map((item) => {
                                  const pct = getProgressPercent(item.quantity_sold, item.quantity_loaded);
                                  return (
                                    <tr key={item.product_id} className="border-b dark:border-gray-700/50 last:border-0">
                                      <td className="py-2">
                                        <span className="text-sm font-medium dark:text-white">{item.product?.name}</span>
                                        {item.product?.barcode && (
                                          <span className="text-xs text-gray-400 mr-2">({item.product.barcode})</span>
                                        )}
                                      </td>
                                      <td className="text-center text-sm dark:text-gray-300">{formatNumber(item.quantity_loaded)}</td>
                                      <td className="text-center text-sm text-green-600 font-medium">{formatNumber(item.quantity_sold)}</td>
                                      <td className="text-center text-sm text-red-500">{formatNumber(item.quantity_returned)}</td>
                                      <td className="text-center">
                                        <span className={`text-sm font-bold ${item.available > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600'}`}>
                                          {formatNumber(item.available)}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <div className="inline-flex items-center gap-1">
                                          <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                            <div
                                              className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{pct}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
