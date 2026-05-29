'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { inviteAcceptApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';

function AcceptInviteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale, dir, setLocale } = useLocale();

  const token = params.get('token');
  const tenantParam = params.get('tenant');
  const tenantId = tenantParam ? Number(tenantParam) : null;

  const linkValid = !!token && !!tenantId && !Number.isNaN(tenantId);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkValid || !token || !tenantId) {
      setError(t('acceptInvite.invalidLink'));
      return;
    }
    if (password !== confirm) {
      setError(t('common.errorUpdate'));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await inviteAcceptApi.accept({
        token,
        tenant_id: tenantId,
        password,
        password_confirmation: confirm,
      });
      toast.success(t('acceptInvite.successMessage'));
      router.push('/login');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e.response?.data?.message || t('acceptInvite.invalidLink');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="rtl:rotate-180"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>{t('acceptInvite.backToLogin')}</span>
        </Link>

        <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`px-3 py-1 text-[12px] font-semibold rounded-full transition ${
              locale === 'en' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale('fr')}
            className={`px-3 py-1 text-[12px] font-semibold rounded-full transition ${
              locale === 'fr' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setLocale('ar')}
            className={`px-3 py-1 text-[12px] font-semibold rounded-full transition ${
              locale === 'ar' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            AR
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-[400px]">
          <div className="flex justify-center mb-7">
            <Link href="/" className="inline-block transition-opacity hover:opacity-80">
              <Image src="/t-logo.png" alt="TrackSera" width={52} height={52} priority />
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">
              {t('acceptInvite.title')}
            </h1>
            <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">
              {t('acceptInvite.subtitle')}
            </p>
          </div>

          {!linkValid ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 text-center">
              <p className="text-[14px] text-red-600">{t('acceptInvite.invalidLink')}</p>
              <Link
                href="/login"
                className="mt-4 inline-block text-[13px] font-medium text-gray-900 hover:underline"
              >
                {t('acceptInvite.backToLogin')}
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-5"
            >
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('acceptInvite.passwordLabel')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('acceptInvite.confirmLabel')}
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
                />
              </div>

              {error && (
                <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-[14px] font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? t('acceptInvite.activating') : t('acceptInvite.button')}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="text-center text-[11px] text-gray-400 pb-6">
        © {new Date().getFullYear()} TrackSera · tracksera.com
      </footer>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}
