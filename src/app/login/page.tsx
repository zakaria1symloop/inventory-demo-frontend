'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth';
import { useLocale } from '@/lib/i18n/context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { t, locale, dir, setLocale } = useLocale();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(identifier, password);
      toast.success(t('auth.loginSuccess'));
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Language toggle */}
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

      {/* Form card */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="flex justify-center mb-7">
            <Link href="/" className="inline-block transition-opacity hover:opacity-80">
              <Image src="/t-logo.png" alt="TrackSera" width={52} height={52} priority />
            </Link>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">{t('auth.loginTitle')}</h1>
            <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">{t('auth.loginSubtitle')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('auth.identifierLabel')}</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="0549575512"
                required
                autoFocus
                autoComplete="username"
                dir="ltr"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
              />
              <p className="mt-1.5 text-[12px] text-gray-400">{t('auth.identifierHint')}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-gray-700">{t('auth.passwordLabel')}</label>
                <Link href="/forgot-password" className="text-[12px] font-medium text-gray-500 hover:text-gray-900 transition">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 ltr:pr-10 rtl:pl-10 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a19.68 19.68 0 01-3.17 4.19M6.61 6.61A19.77 19.77 0 001 12s4 8 11 8a10.94 10.94 0 004.88-1.14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-[14px] font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.signingIn')}
                </span>
              ) : t('auth.signIn')}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-[13px] text-gray-500">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="font-semibold text-gray-900 hover:underline">
              {t('auth.createAccountLink')}
            </Link>
          </p>
        </div>
      </main>

      <footer className="text-center text-[11px] text-gray-400 pb-6">
        © {new Date().getFullYear()} TrackSera · tracksera.com
      </footer>
    </div>
  );
}
