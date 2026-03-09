'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { vanSessionsApi, usersApi, vehiclesApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TruckIcon,
  PlayIcon,
  StopIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface VanSession {
  id: number;
  reference: string;
  livreur_id: number;
  vehicle_id?: number;
  warehouse_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  status: 'preparing' | 'active' | 'completed' | 'cancelled';
  total_loaded_value: number;
  total_sales: number;
  total_collected: number;
  total_credit: number;
  total_returned_value: number;
  sales_count: number;
  notes?: string;
  livreur?: { id: number; name: string };
  vehicle?: { id: number; plate_number: string; model: string };
  warehouse?: { id: number; name: string };
}

interface User {
  id: number;
  name: string;
}

interface Vehicle {
  id: number;
  plate_number: string;
  model: string;
}

interface Warehouse {
  id: number;
  name: string;
}

export default function VanSalesPage() {
  const [sessions, setSessions] = useState<VanSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [livreurFilter, setLivreurFilter] = useState('');

  // Data for filters and form
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    livreur_id: '',
    vehicle_id: '',
    warehouse_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [sessionsRes, livreursRes, vehiclesRes, warehousesRes] = await Promise.all([
        vanSessionsApi.getAll(),
        usersApi.getLivreurs(),
        vehiclesApi.getAll(),
        warehousesApi.getAll(),
      ]);
      setSessions(sessionsRes.data.data || sessionsRes.data);
      setLivreurs(livreursRes.data.data || livreursRes.data);
      setVehicles(vehiclesRes.data.data || vehiclesRes.data);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStart = async (id: number) => {
    if (!confirm('هل تريد بدء جلسة البيع المتنقل؟')) return;
    try {
      await vanSessionsApi.start(id);
      toast.success('تم بدء الجلسة بنجاح');
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'خطأ في بدء الجلسة';
      const errors = error.response?.data?.errors;
      if (errors) {
        toast.error(errors.join('\n'));
      } else {
        toast.error(message);
      }
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm('هل تريد إنهاء جلسة البيع وإرجاع المنتجات غير المباعة؟')) return;
    try {
      await vanSessionsApi.complete(id);
      toast.success('تم إنهاء الجلسة بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في إنهاء الجلسة');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الجلسة؟')) return;
    try {
      await vanSessionsApi.cancel(id);
      toast.success('تم إلغاء الجلسة بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في إلغاء الجلسة');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجلسة؟')) return;
    try {
      await vanSessionsApi.delete(id);
      toast.success('تم حذف الجلسة بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في حذف الجلسة');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to new page for adding products
    window.location.href = `/dashboard/van-sales/new?livreur_id=${formData.livreur_id}&vehicle_id=${formData.vehicle_id}&warehouse_id=${formData.warehouse_id}&date=${formData.date}&notes=${encodeURIComponent(formData.notes)}`;
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return '0 د.ج.';
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-DZ');
  };

  const formatTime = (datetime: string | undefined) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      preparing: { class: 'badge-warning', text: 'قيد التحضير' },
      active: { class: 'badge-info', text: 'نشط' },
      completed: { class: 'badge-success', text: 'مكتمل' },
      cancelled: { class: 'badge-error', text: 'ملغي' },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesSearch = session.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.livreur?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || session.status === statusFilter;
      const matchesLivreur = !livreurFilter || session.livreur_id.toString() === livreurFilter;
      return matchesSearch && matchesStatus && matchesLivreur;
    });
  }, [sessions, searchTerm, statusFilter, livreurFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const parseNum = (val: any) => {
      const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
      return isNaN(num) ? 0 : num;
    };

    return {
      total: sessions.length,
      preparing: sessions.filter(s => s.status === 'preparing').length,
      active: sessions.filter(s => s.status === 'active').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      totalSales: sessions.reduce((sum, s) => sum + parseNum(s.total_sales), 0),
      totalCollected: sessions.reduce((sum, s) => sum + parseNum(s.total_collected), 0),
      totalCredit: sessions.reduce((sum, s) => sum + parseNum(s.total_credit), 0),
    };
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">البيع المتنقل</h1>
          <p className="text-gray-500 mt-1">إدارة جلسات البيع من الشاحنة</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          جلسة جديدة
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="card bg-blue-50 p-4">
          <div className="text-blue-600 text-sm font-medium">إجمالي الجلسات</div>
          <div className="text-2xl font-bold text-blue-700">{kpis.total}</div>
        </div>
        <div className="card bg-yellow-50 p-4">
          <div className="text-yellow-600 text-sm font-medium">قيد التحضير</div>
          <div className="text-2xl font-bold text-yellow-700">{kpis.preparing}</div>
        </div>
        <div className="card bg-cyan-50 p-4">
          <div className="text-cyan-600 text-sm font-medium">نشط</div>
          <div className="text-2xl font-bold text-cyan-700">{kpis.active}</div>
        </div>
        <div className="card bg-green-50 p-4">
          <div className="text-green-600 text-sm font-medium">مكتمل</div>
          <div className="text-2xl font-bold text-green-700">{kpis.completed}</div>
        </div>
        <div className="card bg-purple-50 p-4">
          <div className="text-purple-600 text-sm font-medium">إجمالي المبيعات</div>
          <div className="text-lg font-bold text-purple-700">{formatCurrency(kpis.totalSales)}</div>
        </div>
        <div className="card bg-emerald-50 p-4">
          <div className="text-emerald-600 text-sm font-medium">المحصل</div>
          <div className="text-lg font-bold text-emerald-700">{formatCurrency(kpis.totalCollected)}</div>
        </div>
        <div className="card bg-red-50 p-4">
          <div className="text-red-600 text-sm font-medium">الآجل</div>
          <div className="text-lg font-bold text-red-700">{formatCurrency(kpis.totalCredit)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="بحث بالمرجع أو السائق..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered"
          >
            <option value="">جميع الحالات</option>
            <option value="preparing">قيد التحضير</option>
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
          <select
            value={livreurFilter}
            onChange={(e) => setLivreurFilter(e.target.value)}
            className="select select-bordered"
          >
            <option value="">جميع السائقين</option>
            {livreurs.map(livreur => (
              <option key={livreur.id} value={livreur.id}>{livreur.name}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="btn btn-outline inline-flex items-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            تحديث
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المرجع</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">السائق</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المركبة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المستودع</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">التاريخ</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الوقت</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">المبيعات</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">المحصل</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    لا توجد جلسات
                  </td>
                </tr>
              ) : (
                filteredSessions.map(session => {
                  const statusBadge = getStatusBadge(session.status);
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{session.reference}</td>
                      <td className="px-4 py-3">{session.livreur?.name || '-'}</td>
                      <td className="px-4 py-3">
                        {session.vehicle ? `${session.vehicle.plate_number}` : '-'}
                      </td>
                      <td className="px-4 py-3">{session.warehouse?.name || '-'}</td>
                      <td className="px-4 py-3 text-center">{formatDate(session.date)}</td>
                      <td className="px-4 py-3 text-center">
                        {session.start_time ? (
                          <span className="text-sm">
                            {formatTime(session.start_time)}
                            {session.end_time && ` - ${formatTime(session.end_time)}`}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col">
                          <span className="font-medium">{session.sales_count} عملية</span>
                          <span className="text-sm text-gray-500">{formatCurrency(session.total_sales)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col">
                          <span className="text-green-600 font-medium">{formatCurrency(session.total_collected)}</span>
                          {parseFloat(String(session.total_credit)) > 0 && (
                            <span className="text-sm text-red-500">آجل: {formatCurrency(session.total_credit)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/dashboard/van-sales/${session.id}`}
                            className="btn btn-ghost btn-xs"
                            title="عرض"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>

                          {session.status === 'preparing' && (
                            <>
                              <button
                                onClick={() => handleStart(session.id)}
                                className="btn btn-ghost btn-xs text-green-600"
                                title="بدء"
                              >
                                <PlayIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(session.id)}
                                className="btn btn-ghost btn-xs text-red-600"
                                title="حذف"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {session.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleComplete(session.id)}
                                className="btn btn-ghost btn-xs text-blue-600"
                                title="إنهاء"
                              >
                                <StopIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(session.id)}
                                className="btn btn-ghost btn-xs text-red-600"
                                title="إلغاء"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">جلسة بيع متنقل جديدة</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">السائق</label>
                <select
                  value={formData.livreur_id}
                  onChange={(e) => setFormData({ ...formData, livreur_id: e.target.value })}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">اختر السائق</option>
                  {livreurs.map(livreur => (
                    <option key={livreur.id} value={livreur.id}>{livreur.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">المركبة</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="select select-bordered w-full"
                >
                  <option value="">اختر المركبة (اختياري)</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number} - {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">المستودع</label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">اختر المستودع</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">التاريخ</label>
                <DateInput
                  value={formData.date}
                  onChange={(v) => setFormData({ ...formData, date: v })}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="textarea textarea-bordered w-full"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  التالي: إضافة المنتجات
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
