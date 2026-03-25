'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
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
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      toast.error(err.response?.data?.message || err.message || 'خطأ في تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex">
      {/* Right side — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Logo & heading */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <Image src="/t.png" alt="TrackSera" width={40} height={40} className="object-contain transition-transform group-hover:scale-105" />
            <span className="text-lg font-bold text-gray-900">TrackSera</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">مرحباً بعودتك</h1>
          <p className="mt-2 text-gray-500">سجّل الدخول للوصول إلى لوحة التحكم</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف أو البريد الإلكتروني</label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400"
                  placeholder="0549575512 أو example@company.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">كلمة المرور</label>
                <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-11 pl-11 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

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
                  جاري الدخول...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Left side — Hero illustration */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-bl from-blue-600 via-blue-700 to-indigo-800">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          {/* Floating orbs */}
          <div className="absolute top-[15%] right-[20%] w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-[20%] left-[15%] w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl animate-float-slower" />
          <div className="absolute top-[50%] left-[50%] w-48 h-48 bg-sky-300/10 rounded-full blur-3xl animate-float-medium" />

          {/* Animated route lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 900" fill="none" preserveAspectRatio="xMidYMid slice">
            {/* Route 1 */}
            <path d="M 80 200 Q 200 150, 350 280 T 520 400" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="10 6" className="animate-dash-flow-1" />
            {/* Route 2 */}
            <path d="M 150 600 Q 300 500, 400 550 T 500 700" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="8 8" className="animate-dash-flow-2" />
            {/* Route 3 */}
            <path d="M 50 450 Q 180 380, 280 450 T 550 350" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="12 6" className="animate-dash-flow-3" />

            {/* Hub nodes */}
            <circle cx="80" cy="200" r="8" fill="rgba(255,255,255,0.15)" className="animate-pulse-node" />
            <circle cx="80" cy="200" r="4" fill="rgba(255,255,255,0.4)" />
            <circle cx="350" cy="280" r="6" fill="rgba(255,255,255,0.12)" className="animate-pulse-node-delay" />
            <circle cx="350" cy="280" r="3" fill="rgba(255,255,255,0.35)" />
            <circle cx="520" cy="400" r="8" fill="rgba(255,255,255,0.15)" className="animate-pulse-node" />
            <circle cx="520" cy="400" r="4" fill="rgba(255,255,255,0.4)" />
            <circle cx="150" cy="600" r="7" fill="rgba(255,255,255,0.12)" className="animate-pulse-node-delay" />
            <circle cx="150" cy="600" r="3.5" fill="rgba(255,255,255,0.35)" />
            <circle cx="500" cy="700" r="6" fill="rgba(255,255,255,0.15)" className="animate-pulse-node" />
            <circle cx="500" cy="700" r="3" fill="rgba(255,255,255,0.4)" />

            {/* Moving dots on routes */}
            <circle r="4" fill="white" opacity="0.6">
              <animateMotion dur="6s" repeatCount="indefinite" path="M 80 200 Q 200 150, 350 280 T 520 400" />
            </circle>
            <circle r="3.5" fill="white" opacity="0.5">
              <animateMotion dur="8s" repeatCount="indefinite" path="M 150 600 Q 300 500, 400 550 T 500 700" />
            </circle>
            <circle r="3" fill="white" opacity="0.4">
              <animateMotion dur="7s" repeatCount="indefinite" path="M 50 450 Q 180 380, 280 450 T 550 350" />
            </circle>
          </svg>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Warehouse icon */}
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-white text-center leading-snug">
            أدر عمليات التوزيع
            <br />
            <span className="text-blue-200">بكل سهولة</span>
          </h2>

          <p className="mt-4 text-blue-200/80 text-center max-w-sm leading-relaxed">
            طلبات، توصيل، مخزون، فوترة — كل شيء في منصة واحدة مصممة لشركات التوزيع الجزائرية.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['تتبع GPS', 'فوترة PDF', 'بيع متنقل', 'تقارير'].map((f) => (
              <span key={f} className="px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-white/80 backdrop-blur-sm">
                {f}
              </span>
            ))}
          </div>

          {/* Trust badge */}
          <div className="mt-12 flex items-center gap-3 px-5 py-3 bg-white/[0.07] border border-white/10 rounded-xl backdrop-blur-sm">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {['#3b82f6', '#10b981', '#f59e0b'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-700 flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c }}>
                  {['ر', 'م', 'ع'][i]}
                </div>
              ))}
            </div>
            <div className="text-xs text-white/70">
              <span className="font-bold text-white">+50</span> شركة توزيع تستخدم رفيق
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-30px) translateX(15px); }
          }
          @keyframes float-slower {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(20px) translateX(-20px); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          @keyframes dash-flow {
            to { stroke-dashoffset: -40; }
          }
          @keyframes pulse-node {
            0%, 100% { r: 8; opacity: 0.15; }
            50% { r: 14; opacity: 0.05; }
          }
          .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
          .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
          .animate-dash-flow-1 { animation: dash-flow 2s linear infinite; }
          .animate-dash-flow-2 { animation: dash-flow 2.5s linear infinite; }
          .animate-dash-flow-3 { animation: dash-flow 3s linear infinite; }
          .animate-pulse-node { animation: pulse-node 3s ease-in-out infinite; }
          .animate-pulse-node-delay { animation: pulse-node 3s ease-in-out 1.5s infinite; }
        `}</style>
      </div>
    </div>
  );
}
