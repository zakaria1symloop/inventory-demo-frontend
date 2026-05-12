'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import SetupScreen from './SetupScreen';
import { useLocale } from '@/lib/i18n/context';

export default function RegisterPage() {
  const { t, locale, dir, setLocale } = useLocale();

  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptCall, setAcceptCall] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSetupScreen, setShowSetupScreen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (/\s/.test(formData.company_name)) {
      toast.error(t('auth.errCompanySpaces'));
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      toast.error(t('auth.errPasswordMismatch'));
      return;
    }
    if (formData.phone.length < 9) {
      toast.error(t('auth.errPhoneInvalid'));
      return;
    }

    setIsSubmitting(true);
    const showSetupTimer = setTimeout(() => setShowSetupScreen(true), 1500);

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

      const { token, tenant_id } = response.data;
      clearTimeout(showSetupTimer);
      setShowSetupScreen(true);

      localStorage.setItem('token', token);
      if (tenant_id) localStorage.setItem('tenantId', String(tenant_id));

      window.location.href = '/dashboard';
    } catch (error: unknown) {
      clearTimeout(showSetupTimer);
      const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0]?.[0];
        toast.error(firstError || t('auth.errCreateAccount'));
      } else {
        toast.error(err.response?.data?.message || t('auth.errCreateAccount'));
      }
      setIsSubmitting(false);
      setShowSetupScreen(false);
    }
  };

  if (showSetupScreen) {
    return <SetupScreen />;
  }

  const trustItems = [
    t('auth.trust1'),
    t('auth.trust2'),
    t('auth.trust3'),
    t('auth.trust4'),
  ];

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>{t('auth.backHome')}</span>
        </Link>

        <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`px-3 py-1 text-[12px] font-semibold rounded-full transition ${locale === 'en' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale('fr')}
            className={`px-3 py-1 text-[12px] font-semibold rounded-full transition ${locale === 'fr' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setLocale('ar')}
            className={`px-3 py-1 text-[12px] font-semibold rounded-full transition ${locale === 'ar' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            AR
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-start sm:items-center justify-center px-6 pb-12">
        <div className="w-full max-w-[460px]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="inline-block transition-opacity hover:opacity-80">
              <Image src="/t-logo.png" alt="TrackSera" width={52} height={52} priority />
            </Link>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-[26px] sm:text-[28px] font-bold text-gray-900 tracking-tight">{t('auth.registerTitle')}</h1>
            <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">{t('auth.registerSubtitle')}</p>
          </div>

          {/* Why explainer */}
          <div className="mb-5 px-4 py-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <p className="text-[13px] text-blue-900/80 leading-relaxed">{t('auth.registerWhy')}</p>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('auth.companyLabel')}</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={(e) => {
                  const val = e.target.value.replace(/\s/g, '');
                  setFormData((prev) => ({ ...prev, company_name: val }));
                }}
                placeholder={t('auth.companyPlaceholder')}
                required
                disabled={isSubmitting}
                autoFocus
                dir="ltr"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
              />
              <p className="mt-1.5 text-[12px] text-gray-400">{t('auth.companyHint')}</p>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('auth.fullNameLabel')}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('auth.fullNamePlaceholder')}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
              />
              <p className="mt-1.5 text-[12px] text-gray-400">{t('auth.fullNameHint')}</p>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('auth.phoneLabel')}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0549575512"
                required
                disabled={isSubmitting}
                dir="ltr"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
              />
              <p className="mt-1.5 text-[12px] text-gray-400">{t('auth.phoneHint')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('auth.passwordRegLabel')}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.passwordRegPlaceholder')}
                  required
                  minLength={6}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('auth.passwordConfirmLabel')}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder={t('auth.passwordConfirmPlaceholder')}
                  required
                  minLength={6}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-3.5 h-3.5 accent-gray-900 rounded"
                />
                <span className="text-[12px] text-gray-500">{t('auth.showPassword')}</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptCall}
                  onChange={(e) => setAcceptCall(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-3.5 h-3.5 accent-gray-900 rounded mt-[3px]"
                />
                <span className="text-[12px] text-gray-500 leading-relaxed">{t('auth.acceptCallLabel')}</span>
              </label>
            </div>

            {isSubmitting && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                <svg className="animate-spin w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div className="text-[12px] text-blue-700 leading-relaxed">
                  <div className="font-semibold">{t('auth.creatingAccount')}</div>
                  <div className="text-blue-600/80 mt-0.5">{t('auth.creatingHint')}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gray-900 hover:bg-black text-white text-[14px] font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.creating')}
                </span>
              ) : t('auth.createFreeAccount')}
            </button>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">{t('auth.termsAgree')}</p>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-[13px] text-gray-500">
            {t('auth.haveAccount')}{' '}
            <Link href="/login" className="font-semibold text-gray-900 hover:underline">
              {t('auth.signInLink')}
            </Link>
          </p>

          {/* Trust signals */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {trustItems.map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[12px] text-gray-500">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {label}
              </span>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-gray-400 pb-6">
        © {new Date().getFullYear()} TrackSera · tracksera.com
      </footer>
    </div>
  );
}
