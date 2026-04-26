'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminTenantsApi } from '@/lib/admin-api';
import Link from 'next/link';

interface TenantUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean | number;
  email_verified_at: string | null;
  created_at: string;
}

interface Subscription {
  id: number;
  plan: string;
  status: string;
  starts_at: string;
  ends_at?: string;
  price?: number;
}

interface PlanInfo {
  id: string;
  product_limit: number;
  user_limit: number;
  price: number;
  extra_user_price: number;
}

interface TenantStats {
  user_count: number;
  product_count: number;
  client_count: number;
  order_count: number;
  sale_count: number;
  users: TenantUser[];
}

interface UpdateLog {
  id: number;
  from_version: string;
  to_version: string;
  status: 'success' | 'failed';
  migrations_run: string[] | null;
  error_message: string | null;
  created_at: string;
}

interface FeatureModule {
  key: string;
  name: string;
  enabled: boolean;
  is_plan_default: boolean;
}

interface FeaturesData {
  tenant_id: number;
  plan: string;
  is_custom: boolean;
  enabled_features: string[];
  plan_defaults: string[];
  grouped_modules: Record<string, FeatureModule[]>;
}

interface Tenant {
  id: number;
  name: string;
  database_name: string;
  plan: string;
  product_limit: number;
  user_limit: number;
  is_active: boolean;
  otp_required: boolean;
  deactivate_at: string | null;
  updates_enabled: boolean;
  app_version: string;
  latest_version: string;
  last_updated_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  current_price: number;
  emails: string[];
  active_subscription: Subscription | null;
  subscriptions: Subscription[];
  stats: TenantStats;
  plans_info: Record<string, PlanInfo>;
}

const planNames: Record<string, string> = {
  free: 'مجاني',
  starter: 'المبتدئ',
  pro: 'المحترف',
  business: 'الأعمال',
};

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 border-gray-300',
  starter: 'bg-blue-100 text-blue-700 border-blue-300',
  pro: 'bg-purple-100 text-purple-700 border-purple-300',
  business: 'bg-amber-100 text-amber-700 border-amber-300',
};

const roleNames: Record<string, string> = {
  admin: 'مدير',
  manager: 'مسؤول',
  seller: 'بائع',
  livreur: 'سائق توصيل',
  cashvan: 'كاش فان',
};

export default function AdminTenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [featuresData, setFeaturesData] = useState<FeaturesData | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [updating, setUpdating] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [granting, setGranting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'seller' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userLimitWarning, setUserLimitWarning] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [exportingSql, setExportingSql] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [tenantRes, logsRes, featuresRes] = await Promise.all([
        adminTenantsApi.getOne(id),
        adminTenantsApi.getUpdateLogs(id),
        adminTenantsApi.getFeatures(id),
      ]);
      setTenant(tenantRes.data);
      setSelectedPlan(tenantRes.data.plan);
      setUpdateLogs(logsRes.data.logs || []);
      setFeaturesData(featuresRes.data);
      setSelectedFeatures(featuresRes.data.enabled_features || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePlanChange = async () => {
    if (!tenant || selectedPlan === tenant.plan) return;
    setUpdating(true);
    try {
      const res = await adminTenantsApi.updatePlan(id, selectedPlan);
      showMessage('success', res.data.message);
      await fetchData();
    } catch (error) {
      console.error(error);
      showMessage('error', 'خطأ في تحديث الخطة');
    } finally {
      setUpdating(false);
    }
  };

  const handleActivate = async () => {
    if (!tenant) return;
    try {
      const res = await adminTenantsApi.updateStatus(id, { action: 'activate' });
      showMessage('success', res.data.message);
      await fetchData();
    } catch (error) {
      console.error(error);
      showMessage('error', 'خطأ في تفعيل المستأجر');
    }
  };

  const handleDeactivate = async () => {
    if (!tenant) return;
    if (!confirm('هل أنت متأكد من تعطيل هذا المستأجر فوراً؟')) return;
    try {
      const res = await adminTenantsApi.updateStatus(id, { action: 'deactivate' });
      showMessage('success', res.data.message);
      await fetchData();
    } catch (error) {
      console.error(error);
      showMessage('error', 'خطأ في تعطيل المستأجر');
    }
  };

  const handleScheduleDeactivation = async () => {
    if (!scheduleDate) return;
    try {
      const res = await adminTenantsApi.updateStatus(id, { action: 'schedule', deactivate_at: scheduleDate });
      showMessage('success', res.data.message);
      setShowSchedule(false);
      setScheduleDate('');
      await fetchData();
    } catch (error: any) {
      console.error(error);
      showMessage('error', error.response?.data?.message || 'خطأ في جدولة التعطيل');
    }
  };

  const handleCancelSchedule = async () => {
    try {
      const res = await adminTenantsApi.updateStatus(id, { action: 'activate' });
      showMessage('success', 'تم إلغاء جدولة التعطيل.');
      await fetchData();
    } catch (error) {
      console.error(error);
      showMessage('error', 'خطأ في إلغاء الجدولة');
    }
  };

  const handleQuickSchedule = async (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const dateStr = date.toISOString().split('T')[0];
    try {
      const res = await adminTenantsApi.updateStatus(id, { action: 'schedule', deactivate_at: dateStr });
      showMessage('success', res.data.message);
      setShowSchedule(false);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      showMessage('error', error.response?.data?.message || 'خطأ في جدولة التعطيل');
    }
  };

  const handleCreateUser = async (force = false) => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setCreatingUser(true);
    setUserLimitWarning(null);
    try {
      const res = await adminTenantsApi.createUser(id, { ...newUser, force });
      showMessage('success', res.data.message);
      setShowCreateUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'seller' });
      await fetchData();
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403 && error.response?.data?.limit) {
        setUserLimitWarning(error.response.data.message);
      } else {
        showMessage('error', error.response?.data?.message || 'خطأ في إنشاء المستخدم');
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUpdates = async () => {
    if (!tenant) return;
    try {
      const res = await adminTenantsApi.toggleUpdates(id);
      showMessage('success', res.data.message);
      await fetchData();
    } catch (error) {
      console.error(error);
      showMessage('error', 'خطأ في تغيير حالة التحديثات');
    }
  };

  const handlePushUpdate = async () => {
    if (!tenant) return;
    if (!confirm(`هل تريد تحديث "${tenant.name}" من v${tenant.app_version} إلى v${tenant.latest_version}؟\n\nسيتم تشغيل migrations قاعدة البيانات وتحديث الإصدار.`)) return;
    setPushing(true);
    try {
      const res = await adminTenantsApi.pushUpdate(id);
      showMessage('success', res.data.message);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      showMessage('error', error.response?.data?.message || 'فشل التحديث');
    } finally {
      setPushing(false);
    }
  };

  const handleGrantFullAccess = async () => {
    if (!tenant) return;
    if (!confirm('هل أنت متأكد من منح الوصول الكامل لهذا المستأجر؟\n\nسيتم: تغيير الخطة إلى الأعمال، إزالة حد المنتجات، تفعيل الحساب لمدة 10 سنوات.')) return;
    setGranting(true);
    try {
      const res = await adminTenantsApi.grantFullAccess(id);
      showMessage('success', res.data.message);
      await fetchData();
    } catch (error) {
      console.error(error);
      showMessage('error', 'خطأ في منح الوصول الكامل');
    } finally {
      setGranting(false);
    }
  };

  const handleImpersonate = async () => {
    if (!tenant) return;
    setImpersonating(true);
    try {
      const res = await adminTenantsApi.impersonate(id);
      const { token, tenant_id } = res.data;
      const impData = btoa(JSON.stringify({ token, tenantId: String(tenant_id) }));
      window.open(`/dashboard?imp=${encodeURIComponent(impData)}`, '_blank');
    } catch (error) {
      console.error(error);
      showMessage('error', 'خطأ في الدخول للوحة التحكم');
    } finally {
      setImpersonating(false);
    }
  };

  const handleToggleOtp = async () => {
    if (!tenant) return;
    try {
      const res = await adminTenantsApi.toggleOtpRequired(id);
      showMessage('success', res.data.message);
      await fetchData();
    } catch {
      showMessage('error', 'خطأ في تغيير حالة التحقق');
    }
  };

  const handleExportSql = async () => {
    setExportingSql(true);
    try {
      const response = await adminTenantsApi.exportSql(id);
      const blob = new Blob([response.data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tenant?.name || 'tenant'}_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showMessage('success', 'تم تصدير قاعدة البيانات بنجاح');
    } catch {
      showMessage('error', 'خطأ في تصدير قاعدة البيانات');
    } finally {
      setExportingSql(false);
    }
  };

  const handleToggleUserVerification = async (userId: number) => {
    try {
      const res = await adminTenantsApi.toggleUserVerification(id, userId);
      showMessage('success', res.data.message);
      await fetchData();
    } catch {
      showMessage('error', 'خطأ في تغيير حالة التحقق');
    }
  };

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const toggleGroupFeatures = (groupModules: FeatureModule[]) => {
    const groupKeys = groupModules.map((m) => m.key);
    const allSelected = groupKeys.every((k) => selectedFeatures.includes(k));
    if (allSelected) {
      setSelectedFeatures((prev) => prev.filter((f) => !groupKeys.includes(f)));
    } else {
      setSelectedFeatures((prev) => [...new Set([...prev, ...groupKeys])]);
    }
  };

  const handleSaveFeatures = async () => {
    setSavingFeatures(true);
    try {
      const res = await adminTenantsApi.updateFeatures(id, selectedFeatures);
      showMessage('success', res.data.message);
      await fetchData();
    } catch (error) {
      console.error(error);
      showMessage('error', 'خطأ في تحديث الميزات');
    } finally {
      setSavingFeatures(false);
    }
  };

  const handleResetFeatures = async () => {
    if (!confirm('هل تريد إعادة تعيين الميزات إلى الإعدادات الافتراضية للخطة الحالية؟')) return;
    setSavingFeatures(true);
    try {
      const res = await adminTenantsApi.resetFeatures(id);
      showMessage('success', res.data.message);
      await fetchData();
    } catch (error) {
      console.error(error);
      showMessage('error', 'خطأ في إعادة تعيين الميزات');
    } finally {
      setSavingFeatures(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!tenant) {
    return <p className="text-center text-gray-500 py-20">المستأجر غير موجود</p>;
  }

  const isOutdated = tenant.app_version !== tenant.latest_version;

  return (
    <div className="space-y-6">
      {/* Toast Message */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Back */}
      <Link href="/admin/tenants" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        العودة للقائمة
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">{tenant.name}</h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {tenant.is_active ? 'نشط' : 'معطل'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${planColors[tenant.plan]}`}>
                {planNames[tenant.plan]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">#{tenant.id} &mdash; {tenant.database_name}</p>
            {tenant.emails && tenant.emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tenant.emails.map((email, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                    {email}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleImpersonate}
              disabled={!tenant.is_active || impersonating}
              className="px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {impersonating ? 'جاري الدخول...' : 'الدخول للوحة التحكم'}
            </button>

            {/* Actions dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
              </button>

              {showActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                  <div className="absolute left-0 top-full mt-2 bg-white border rounded-xl shadow-xl z-50 w-72 py-2">
                    {/* Access section */}
                    <p className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">الوصول والحالة</p>
                    <button
                      onClick={() => { handleGrantFullAccess(); setShowActions(false); }}
                      disabled={granting}
                      className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors flex items-center gap-3 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      {granting ? 'جاري المنح...' : 'منح وصول كامل'}
                    </button>
                    {tenant.is_active ? (
                      <button
                        onClick={() => { setShowActions(false); setShowSchedule(true); }}
                        className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        تعطيل المستأجر
                      </button>
                    ) : (
                      <button
                        onClick={() => { handleActivate(); setShowActions(false); }}
                        className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        تفعيل المستأجر
                      </button>
                    )}

                    <div className="border-t my-1.5 mx-3" />

                    {/* Updates section */}
                    <p className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">التحديثات</p>
                    <button
                      onClick={() => { handleToggleUpdates(); setShowActions(false); }}
                      className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                      </svg>
                      {tenant.updates_enabled ? 'تعطيل التحديثات التلقائية' : 'تفعيل التحديثات التلقائية'}
                    </button>
                    {isOutdated && (
                      <button
                        onClick={() => { handlePushUpdate(); setShowActions(false); }}
                        disabled={pushing}
                        className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors flex items-center gap-3 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        {pushing ? 'جاري التحديث...' : `تحديث إلى v${tenant.latest_version}`}
                      </button>
                    )}

                    <div className="border-t my-1.5 mx-3" />

                    {/* Verification section */}
                    <p className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">التحقق</p>
                    <button
                      onClick={() => { handleToggleOtp(); setShowActions(false); }}
                      className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span className="flex-1">{tenant.otp_required ? 'تعطيل التحقق بالبريد (OTP)' : 'تفعيل التحقق بالبريد (OTP)'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tenant.otp_required ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tenant.otp_required ? 'مفعل' : 'معطل'}
                      </span>
                    </button>

                    <div className="border-t my-1.5 mx-3" />

                    {/* Data Export section */}
                    <p className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">تصدير البيانات</p>
                    <button
                      onClick={() => { handleExportSql(); setShowActions(false); }}
                      disabled={exportingSql}
                      className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-3 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                      {exportingSql ? 'جاري التصدير...' : 'تصدير SQL'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick status bar */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${tenant.updates_enabled ? 'bg-teal-500' : 'bg-gray-300'}`} />
            التحديثات {tenant.updates_enabled ? 'مفعلة' : 'معطلة'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${tenant.otp_required ? 'bg-blue-500' : 'bg-gray-300'}`} />
            OTP {tenant.otp_required ? 'مطلوب' : 'غير مطلوب'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${isOutdated ? 'bg-orange-500' : 'bg-green-500'}`} />
            v{tenant.app_version} {isOutdated ? `(متاح v${tenant.latest_version})` : '(محدّث)'}
          </div>
          {tenant.trial_ends_at && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full ${new Date(tenant.trial_ends_at) < new Date() ? 'bg-red-500' : 'bg-yellow-500'}`} />
              التجربة: {new Date(tenant.trial_ends_at).toLocaleDateString('ar-DZ')}
            </div>
          )}
          <div className="text-xs text-gray-400 mr-auto">
            تاريخ التسجيل: {new Date(tenant.created_at).toLocaleDateString('ar-DZ')}
          </div>
        </div>
      </div>

      {/* Deactivation Schedule Popover */}
      {showSchedule && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-orange-800">خيارات تعطيل المستأجر</p>
            <button onClick={() => setShowSchedule(false)} className="text-orange-400 hover:text-orange-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <button
                onClick={() => { handleDeactivate(); setShowSchedule(false); }}
                className="w-full px-4 py-3 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                تعطيل فوري
              </button>
            </div>
            <div>
              <p className="text-xs text-orange-600 mb-2 font-medium">جدولة التعطيل بعد:</p>
              <div className="flex gap-2 mb-3">
                {[5, 10, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => { handleQuickSchedule(d); setShowSchedule(false); }}
                    className="flex-1 px-3 py-2 text-xs font-medium bg-white border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    {d} يوم
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-3 py-2 text-xs border border-orange-200 rounded-lg bg-white"
                />
                <button
                  onClick={() => { handleScheduleDeactivation(); setShowSchedule(false); }}
                  disabled={!scheduleDate}
                  className="px-4 py-2 text-xs font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  جدولة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Deactivation Banner */}
      {tenant.deactivate_at && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-orange-800">جدولة التعطيل</p>
              <p className="text-xs text-orange-600">
                سيتم تعطيل هذا المستأجر في {new Date(tenant.deactivate_at).toLocaleDateString('ar-DZ')}
                {' '}({Math.ceil((new Date(tenant.deactivate_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} يوم متبقي)
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelSchedule}
            className="px-4 py-2 text-xs font-bold bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
          >
            إلغاء الجدولة
          </button>
        </div>
      )}

      {/* Version & Update Section */}
      <div className={`rounded-xl border p-6 ${isOutdated ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOutdated ? 'bg-orange-100' : 'bg-green-100'}`}>
              {isOutdated ? (
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">إصدار التطبيق</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${isOutdated ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}`}>
                  v{tenant.app_version}
                </span>
                {isOutdated && (
                  <>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="px-2.5 py-1 rounded-lg text-sm font-bold bg-green-200 text-green-800">
                      v{tenant.latest_version}
                    </span>
                  </>
                )}
              </div>
              {tenant.last_updated_at && (
                <p className="text-xs text-gray-500 mt-1">
                  آخر تحديث: {new Date(tenant.last_updated_at).toLocaleDateString('ar-DZ')} — {new Date(tenant.last_updated_at).toLocaleTimeString('ar-DZ')}
                </p>
              )}
            </div>
          </div>
          <div>
            {isOutdated ? (
              <button
                onClick={handlePushUpdate}
                disabled={pushing}
                className="px-6 py-3 text-sm font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {pushing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    جاري التحديث...
                  </span>
                ) : (
                  `تحديث إلى v${tenant.latest_version}`
                )}
              </button>
            ) : (
              <span className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg">
                محدّث بالكامل
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="المستخدمون"
          value={`${tenant.stats.user_count} / ${tenant.user_limit >= 999999 ? '∞' : tenant.user_limit}`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          color="bg-blue-50 text-blue-700"
          iconBg="bg-blue-100"
        />
        <StatCard
          label="المنتجات"
          value={`${tenant.stats.product_count} / ${tenant.product_limit >= 999999 ? '∞' : tenant.product_limit}`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" /></svg>}
          color="bg-green-50 text-green-700"
          iconBg="bg-green-100"
        />
        <StatCard
          label="العملاء"
          value={tenant.stats.client_count}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>}
          color="bg-purple-50 text-purple-700"
          iconBg="bg-purple-100"
        />
        <StatCard
          label="الطلبات"
          value={tenant.stats.order_count}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
          color="bg-orange-50 text-orange-700"
          iconBg="bg-orange-100"
        />
        <StatCard
          label="المبيعات"
          value={tenant.stats.sale_count}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-emerald-50 text-emerald-700"
          iconBg="bg-emerald-100"
        />
      </div>

      {/* Features Management */}
      {featuresData && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">الميزات والوحدات</h3>
              {featuresData.is_custom && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">مخصص</span>
              )}
              <span className="text-xs text-gray-500">
                ({selectedFeatures.length} من {Object.values(featuresData.grouped_modules).flat().length} ميزة)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFeatures}
                disabled={savingFeatures}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                إعادة تعيين للافتراضي
              </button>
              <button
                onClick={handleSaveFeatures}
                disabled={savingFeatures}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingFeatures ? 'جاري الحفظ...' : 'حفظ الميزات'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(featuresData.grouped_modules).map(([group, modules]) => {
              const groupKeys = modules.map((m) => m.key);
              const allChecked = groupKeys.every((k) => selectedFeatures.includes(k));
              const someChecked = groupKeys.some((k) => selectedFeatures.includes(k));

              return (
                <div key={group} className="border rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer pb-2 border-b">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={() => toggleGroupFeatures(modules)}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-sm font-bold text-gray-800">{group}</span>
                    <span className="text-xs text-gray-400 mr-auto">
                      {groupKeys.filter((k) => selectedFeatures.includes(k)).length}/{modules.length}
                    </span>
                  </label>
                  <div className="space-y-1.5">
                    {modules.map((module) => (
                      <label key={module.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(module.key)}
                          onChange={() => toggleFeature(module.key)}
                          className="accent-blue-600 w-3.5 h-3.5"
                        />
                        <span className="text-sm text-gray-700 flex-1">{module.name}</span>
                        {module.is_plan_default && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" title="ضمن الخطة الافتراضية" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              ضمن الخطة الافتراضية ({planNames[featuresData.plan]})
            </span>
            {featuresData.is_custom && (
              <span className="text-yellow-600">الميزات مخصصة — تختلف عن الإعدادات الافتراضية للخطة</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Info */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">معلومات المستأجر</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="الحالة">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {tenant.is_active ? 'نشط' : 'معطل'}
              </span>
            </InfoItem>
            <InfoItem label="الخطة الحالية">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${planColors[tenant.plan]}`}>
                {planNames[tenant.plan]}
              </span>
            </InfoItem>
            <InfoItem label="التحديثات">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                tenant.updates_enabled ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tenant.updates_enabled ? 'مفعلة' : 'معطلة'}
              </span>
            </InfoItem>
            <InfoItem label="التحقق بالبريد (OTP)">
              <button
                onClick={handleToggleOtp}
                className={`px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                  tenant.otp_required ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tenant.otp_required ? 'مطلوب' : 'غير مطلوب'}
              </button>
            </InfoItem>
            <InfoItem label="الإصدار">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isOutdated ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
              }`}>
                v{tenant.app_version}
              </span>
            </InfoItem>
            <InfoItem label="السعر الشهري">
              {tenant.current_price > 0 ? `${tenant.current_price.toLocaleString()} د.ج` : 'مجاني'}
            </InfoItem>
            <InfoItem label="حد المنتجات">
              {tenant.product_limit >= 999999 ? 'غير محدود' : tenant.product_limit.toLocaleString()}
            </InfoItem>
            <InfoItem label="حد المستخدمين">
              {tenant.user_limit >= 999999 ? 'غير محدود' : tenant.user_limit}
            </InfoItem>
            <InfoItem label="قاعدة البيانات">
              <span className="font-mono text-xs">{tenant.database_name}</span>
            </InfoItem>
            <InfoItem label="تاريخ التسجيل">
              {new Date(tenant.created_at).toLocaleDateString('ar-DZ')}
            </InfoItem>
            {tenant.trial_ends_at && (
              <InfoItem label="انتهاء التجربة">
                <span className={new Date(tenant.trial_ends_at) < new Date() ? 'text-red-600' : 'text-green-600'}>
                  {new Date(tenant.trial_ends_at).toLocaleDateString('ar-DZ')}
                </span>
              </InfoItem>
            )}
          </div>
        </div>

        {/* Plan Change */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">تغيير الخطة</h3>
          <div className="space-y-3">
            {['free', 'starter', 'pro', 'business'].map((plan) => {
              const info = tenant.plans_info?.[plan];
              return (
                <label
                  key={plan}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPlan === plan ? planColors[plan] + ' border-current' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan}
                    checked={selectedPlan === plan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="accent-blue-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{planNames[plan]}</span>
                    {info && (
                      <span className="text-xs text-gray-500 mr-2">
                        ({info.product_limit >= 999999 ? 'غير محدود' : info.product_limit} منتج، {info.user_limit >= 999999 ? '∞' : info.user_limit} مستخدم — {info.price > 0 ? `${info.price.toLocaleString()} د.ج/شهر` : 'مجاني'}
                        {info.extra_user_price > 0 && ` + ${info.extra_user_price.toLocaleString()} د.ج/مستخدم إضافي`})
                      </span>
                    )}
                  </div>
                  {tenant.plan === plan && (
                    <span className="text-xs text-gray-400">(الحالية)</span>
                  )}
                </label>
              );
            })}
          </div>
          <button
            onClick={handlePlanChange}
            disabled={selectedPlan === tenant.plan || updating}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {updating ? 'جاري التحديث...' : 'تحديث الخطة'}
          </button>
        </div>
      </div>

      {/* Active Subscription */}
      {tenant.active_subscription && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">الاشتراك النشط</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoItem label="الخطة">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${planColors[tenant.active_subscription.plan]}`}>
                {planNames[tenant.active_subscription.plan]}
              </span>
            </InfoItem>
            <InfoItem label="الحالة">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                {tenant.active_subscription.status}
              </span>
            </InfoItem>
            <InfoItem label="تاريخ البدء">
              {new Date(tenant.active_subscription.starts_at).toLocaleDateString('ar-DZ')}
            </InfoItem>
            {tenant.active_subscription.ends_at && (
              <InfoItem label="تاريخ الانتهاء">
                {new Date(tenant.active_subscription.ends_at).toLocaleDateString('ar-DZ')}
              </InfoItem>
            )}
          </div>
        </div>
      )}

      {/* Update Logs */}
      {updateLogs.length > 0 && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">سجل التحديثات ({updateLogs.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-right py-2 px-3 font-medium">التاريخ</th>
                  <th className="text-right py-2 px-3 font-medium">من</th>
                  <th className="text-right py-2 px-3 font-medium">إلى</th>
                  <th className="text-right py-2 px-3 font-medium">الحالة</th>
                  <th className="text-right py-2 px-3 font-medium">Migrations</th>
                  <th className="text-right py-2 px-3 font-medium">الخطأ</th>
                </tr>
              </thead>
              <tbody>
                {updateLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-600 text-xs">
                      {new Date(log.created_at).toLocaleDateString('ar-DZ')} {new Date(log.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">v{log.from_version}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">v{log.to_version}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status === 'success' ? 'نجح' : 'فشل'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-xs">
                      {log.migrations_run ? log.migrations_run.length : 0}
                    </td>
                    <td className="py-2 px-3 text-red-600 text-xs max-w-[200px] truncate">
                      {log.error_message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscription History */}
      {tenant.subscriptions && tenant.subscriptions.length > 0 && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">سجل الاشتراكات ({tenant.subscriptions.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-right py-2 px-3 font-medium">#</th>
                  <th className="text-right py-2 px-3 font-medium">الخطة</th>
                  <th className="text-right py-2 px-3 font-medium">الحالة</th>
                  <th className="text-right py-2 px-3 font-medium">البدء</th>
                  <th className="text-right py-2 px-3 font-medium">الانتهاء</th>
                </tr>
              </thead>
              <tbody>
                {tenant.subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500">{sub.id}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${planColors[sub.plan] || 'bg-gray-100 text-gray-700'}`}>
                        {planNames[sub.plan] || sub.plan}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(sub.starts_at).toLocaleDateString('ar-DZ')}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('ar-DZ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tenant Users */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">مستخدمو المستأجر ({tenant.stats.users?.length || 0})</h3>
          <button
            onClick={() => setShowCreateUser(!showCreateUser)}
            className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showCreateUser ? 'إلغاء' : 'إضافة مستخدم'}
          </button>
        </div>

        {/* Create User Form */}
        {showCreateUser && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="الاسم"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="كلمة المرور"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">مدير</option>
                <option value="manager">مسؤول</option>
                <option value="seller">بائع</option>
                <option value="livreur">سائق توصيل</option>
                <option value="cashvan">كاش فان</option>
              </select>
            </div>
            {userLimitWarning && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between gap-3">
                <p className="text-sm text-orange-700">{userLimitWarning}</p>
                <button
                  onClick={() => handleCreateUser(true)}
                  disabled={creatingUser}
                  className="px-4 py-1.5 text-xs font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  إنشاء بالقوة
                </button>
              </div>
            )}
            <button
              onClick={() => handleCreateUser(false)}
              disabled={creatingUser || !newUser.name || !newUser.email || !newUser.password}
              className="px-6 py-2 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {creatingUser ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
            </button>
          </div>
        )}

        {tenant.stats.users && tenant.stats.users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-right py-2 px-3 font-medium">#</th>
                  <th className="text-right py-2 px-3 font-medium">الاسم</th>
                  <th className="text-right py-2 px-3 font-medium">البريد</th>
                  <th className="text-right py-2 px-3 font-medium">الدور</th>
                  <th className="text-right py-2 px-3 font-medium">الحالة</th>
                  <th className="text-right py-2 px-3 font-medium">البريد مؤكد</th>
                  <th className="text-right py-2 px-3 font-medium">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody>
                {tenant.stats.users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500">{user.id}</td>
                    <td className="py-2 px-3 font-medium text-gray-900">{user.name}</td>
                    <td className="py-2 px-3 text-gray-600 font-mono text-xs">{user.email}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {roleNames[user.role] || user.role}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleToggleUserVerification(user.id)}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                          user.email_verified_at
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {user.email_verified_at ? 'مؤكد' : 'غير مؤكد'}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('ar-DZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, iconBg }: { label: string; value: string | number; icon: React.ReactNode; color: string; iconBg: string }) {
  return (
    <div className={`${color} rounded-xl p-4 flex flex-col items-center gap-2`}>
      <div className={`${iconBg} w-10 h-10 rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="text-sm font-medium text-gray-900">{children}</div>
    </div>
  );
}
