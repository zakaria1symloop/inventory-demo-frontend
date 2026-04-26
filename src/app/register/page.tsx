'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptCall, setAcceptCall] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (/\s/.test(formData.company_name)) {
      toast.error('اسم الشركة يجب أن يكون كلمة واحدة بدون مسافات');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }

    if (formData.phone.length < 9) {
      toast.error('رقم الهاتف غير صحيح');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('جاري إنشاء الحساب وتجهيز قاعدة البيانات...');

    try {
      const response = await authApi.register({
        company_name: formData.company_name,
        name: formData.name || formData.company_name,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        register_with: 'phone',
        accept_call: acceptCall,
      });

      const { user, token, tenant_id } = response.data;
      localStorage.setItem('token', token);
      if (tenant_id) localStorage.setItem('tenantId', String(tenant_id));
      setUser(user);

      toast.dismiss(loadingToast);
      toast.success('تم إنشاء الحساب بنجاح! سنتصل بك قريباً');
      router.push('/dashboard');
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0]?.[0];
        toast.error(firstError || 'خطأ في إنشاء الحساب');
      } else {
        toast.error(err.response?.data?.message || 'خطأ في إنشاء الحساب');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex">
      {/* Right side — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px] py-6">
          {/* Logo & heading */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">تراكسيرا</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">إنشاء حساب جديد</h1>
          <p className="mt-2 text-gray-500">ابدأ تجربتك المجانية لمدة 14 يوم — بدون بطاقة ائتمان</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم الشركة</label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\s/g, '');
                    setFormData((prev) => ({ ...prev, company_name: val }));
                  }}
                  className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400"
                  placeholder="مثال: alnajah"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">يجب أن يكون كلمة واحدة بدون مسافات</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم الكامل</label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400"
                  placeholder="اسمك الكامل"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهاتف</label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400"
                  placeholder="0549575512"
                  required
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">سنستخدم هذا الرقم لتفعيل حسابك ومساعدتك</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400"
                    placeholder="6 أحرف على الأقل"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">تأكيد كلمة المرور</label>
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400"
                    placeholder="أعد كتابة كلمة المرور"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-600 rounded"
                  disabled={isLoading}
                />
                <span className="text-xs text-gray-500">إظهار كلمة المرور</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptCall}
                  onChange={(e) => setAcceptCall(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-600 rounded mt-0.5"
                  disabled={isLoading}
                />
                <span className="text-xs text-gray-500 leading-relaxed">أوافق على أن يتم التواصل معي عبر الهاتف لمساعدتي في إعداد الحساب</span>
              </label>
            </div>

            {isLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                <svg className="animate-spin w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div className="text-xs text-blue-700">
                  <div className="font-semibold">جاري إنشاء حسابك...</div>
                  <div className="text-blue-600/80 mt-0.5">قد يستغرق هذا 10-30 ثانية. يرجى عدم إغلاق الصفحة.</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري الإنشاء...
                </span>
              ) : (
                'إنشاء حساب مجاني'
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              بإنشاء حساب أنت توافق على شروط الاستخدام وسياسة الخصوصية
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            لديك حساب؟{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              سجّل الدخول
            </Link>
          </p>
        </div>
      </div>

      {/* Left side — Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-bl from-blue-600 via-blue-700 to-indigo-800">
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-center leading-snug">
            ابدأ مجاناً<br />
            <span className="text-blue-200">واحصل على دعم شخصي</span>
          </h2>
          <p className="mt-4 text-blue-200/80 text-center max-w-sm leading-relaxed">
            سنتصل بك بعد التسجيل لمساعدتك في إعداد حسابك وتدريبك على استخدام النظام.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <span className="px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-white/80 backdrop-blur-sm">دعم بالعربية</span>
            <span className="px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-white/80 backdrop-blur-sm">تجربة 14 يوم</span>
            <span className="px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-white/80 backdrop-blur-sm">بدون بطاقة</span>
          </div>
        </div>
      </div>
    </div>
  );
}
