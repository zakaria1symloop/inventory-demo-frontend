'use client';

import { useEffect, useState } from 'react';
import { adminSettingsApi } from '@/lib/admin-api';
import { useAdminAuthStore } from '@/lib/store/admin-auth';
import toast from 'react-hot-toast';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const { admin } = useAdminAuthStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminSettingsApi.listAdmins();
      setAdmins(res.data);
    } catch {
      toast.error('خطأ في تحميل المشرفين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminSettingsApi.createAdmin(formData);
      toast.success('تم إنشاء حساب المشرف بنجاح');
      setShowCreateForm(false);
      setFormData({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في إنشاء الحساب');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await adminSettingsApi.toggleAdminActive(id);
      toast.success(res.data.message);
      fetchAdmins();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في تغيير الحالة');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشرف؟')) return;
    try {
      const res = await adminSettingsApi.deleteAdmin(id);
      toast.success(res.data.message);
      fetchAdmins();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في حذف الحساب');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة حسابات المشرفين</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showCreateForm ? 'إلغاء' : 'إضافة مشرف'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إنشاء حساب مشرف جديد</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {creating ? 'جاري...' : 'إنشاء'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-20 text-gray-500">لا يوجد مشرفين</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الاسم</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">البريد</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">تاريخ الإنشاء</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {admins.map((a) => {
                  const isSelf = a.id === admin?.id;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{a.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {a.name}
                        {isSelf && (
                          <span className="mr-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded">
                            أنت
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          a.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {a.is_active ? 'مفعل' : 'معطل'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(a.created_at).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(a.id)}
                              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                a.is_active
                                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              {a.is_active ? 'تعطيل' : 'تفعيل'}
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="px-3 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
