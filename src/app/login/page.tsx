'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(identifier, password);
      toast.success('تم تسجيل الدخول بنجاح');
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'خطأ في تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex bg-white">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 right-6 z-20 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors group"
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
          className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span>العودة</span>
      </Link>

      {/* Right side — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="inline-block transition-opacity hover:opacity-80">
              <Image src="/t-logo.png" alt="TrackSera" width={56} height={56} priority />
            </Link>
          </div>

          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">
              مرحباً بعودتك
            </h1>
            <p className="mt-2 text-[14px] text-gray-500">
              سجّل الدخول للوصول إلى حسابك
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                رقم الهاتف أو البريد الإلكتروني
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="0549575512"
                required
                autoFocus
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-gray-700">
                  كلمة المرور
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium text-gray-500 hover:text-gray-900 transition"
                >
                  نسيت كلمة المرور؟
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
                  className="w-full px-3.5 py-2.5 pl-10 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
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
              className="w-full mt-2 py-2.5 bg-gray-900 hover:bg-black text-white text-[14px] font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري الدخول...
                </span>
              ) : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-8 text-center text-[13px] text-gray-500">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="font-semibold text-gray-900 hover:underline">
              أنشئ حساباً
            </Link>
          </p>
        </div>
      </div>

      {/* Left side — Info panel */}
      <div className="hidden lg:flex flex-1 relative bg-gray-950 text-white overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Soft glow */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Top — Brand */}
          <div className="flex items-center gap-3">
            <Image src="/t-logo.png" alt="TrackSera" width={36} height={36} />
            <span className="text-[15px] font-semibold tracking-tight">تراكسيرا</span>
          </div>

          {/* Middle — Headline */}
          <div className="max-w-md">
            <h2 className="text-[34px] font-bold leading-[1.2] tracking-tight">
              منصة متكاملة لإدارة
              <br />
              <span className="text-white/60">عمليات التوزيع</span>
            </h2>
            <p className="mt-5 text-[15px] text-white/60 leading-relaxed">
              طلبات، توصيل، مخزون، فوترة — كل شيء في مكان واحد، مصمم لشركات التوزيع الجزائرية.
            </p>

            {/* Features list */}
            <ul className="mt-10 space-y-4">
              {[
                { title: 'تتبع التوصيل', desc: 'جولات السائقين والدفع عند التسليم' },
                { title: 'إدارة المخزون', desc: 'مستودعات متعددة بتحديث فوري' },
                { title: 'فوترة احترافية', desc: 'فواتير PDF متوافقة مع الضريبة الجزائرية' },
              ].map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <span className="mt-[6px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-white/80" />
                  <div>
                    <div className="text-[14px] font-medium text-white">{f.title}</div>
                    <div className="text-[13px] text-white/50 mt-0.5">{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom — Testimonial / footer */}
          <div className="flex items-center justify-between pt-8 border-t border-white/10">
            <div className="text-[12px] text-white/40">
              © {new Date().getFullYear()} TrackSera
            </div>
            <div className="text-[12px] text-white/40">
              tracksera.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
