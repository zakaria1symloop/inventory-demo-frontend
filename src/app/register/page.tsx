'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { saasApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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

    setIsLoading(true);
    try {
      await register(formData);
      toast.success('تم إنشاء الحساب بنجاح');
      setStep('verify');
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error: unknown) {
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

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasteData[i] || '';
    }
    setOtp(newOtp);
    if (pasteData.length < 6) {
      otpRefs.current[pasteData.length]?.focus();
    }
  };

  const handleVerifyEmail = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;

    setIsLoading(true);
    try {
      await saasApi.verifyEmail({ email: formData.email, otp: code });
      toast.success('تم تأكيد البريد الإلكتروني بنجاح');
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'رمز التحقق غير صحيح');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await saasApi.sendVerificationOtp(formData.email);
      toast.success('تم إعادة إرسال رمز التحقق');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch {
      toast.error('خطأ في إعادة الإرسال');
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

          {step === 'form' ? (
            <>
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
                      placeholder="مثال: النجاح"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">يجب أن يكون كلمة واحدة بدون مسافات — سيُستخدم في بريد الموظفين</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسمك الكامل</label>
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
                      placeholder="الاسم الكامل"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">البريد الإلكتروني</label>
                  <div className="relative">
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400"
                      placeholder="example@company.com"
                      required
                    />
                  </div>
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
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded"
                  />
                  <span className="text-xs text-gray-500">إظهار كلمة المرور</span>
                </label>

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
                      جاري إنشاء الحساب...
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
            </>
          ) : (
            /* === Email Verification OTP Step === */
            <>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">تأكيد البريد الإلكتروني</h1>
              <p className="mt-2 text-gray-500 leading-relaxed">
                أرسلنا رمز تحقق مكون من 6 أرقام إلى
                <br />
                <span className="font-semibold text-gray-700">{formData.email}</span>
              </p>

              <div className="mt-8">
                {/* OTP inputs */}
                <div className="flex gap-3 justify-center mb-6" dir="ltr" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        digit ? 'border-blue-300 bg-blue-50/50' : 'border-gray-300 bg-gray-50/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Verify button */}
                <button
                  onClick={handleVerifyEmail}
                  disabled={isLoading || !otp.every(d => d !== '')}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm mb-4"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      جاري التحقق...
                    </span>
                  ) : (
                    'تأكيد البريد الإلكتروني'
                  )}
                </button>

                {/* Resend */}
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500">
                    لم تستلم الرمز؟{' '}
                    {countdown > 0 ? (
                      <span className="font-semibold text-gray-700">
                        أعد الإرسال بعد {countdown} ثانية
                      </span>
                    ) : (
                      <button
                        onClick={handleResend}
                        disabled={isLoading}
                        className="font-bold text-blue-600 hover:text-blue-700 underline"
                      >
                        إعادة الإرسال
                      </button>
                    )}
                  </p>
                </div>

              </div>
            </>
          )}
        </div>
      </div>

      {/* Left side — Hero illustration */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-bl from-emerald-600 via-teal-700 to-blue-800">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          <div className="absolute top-[20%] left-[25%] w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-[15%] right-[20%] w-80 h-80 bg-teal-300/15 rounded-full blur-3xl animate-float-slower" />

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 900" fill="none" preserveAspectRatio="xMidYMid slice">
            <path d="M 100 300 Q 250 200, 400 350 T 550 250" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="10 6" className="animate-dash-flow-1" />
            <path d="M 80 550 Q 220 480, 350 580 T 520 650" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="8 8" className="animate-dash-flow-2" />
            <path d="M 200 150 Q 300 100, 450 200 T 500 450" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="12 6" className="animate-dash-flow-3" />

            <circle cx="100" cy="300" r="7" fill="rgba(255,255,255,0.15)" className="animate-pulse-node" />
            <circle cx="100" cy="300" r="3.5" fill="rgba(255,255,255,0.4)" />
            <circle cx="400" cy="350" r="9" fill="rgba(255,255,255,0.12)" className="animate-pulse-node-delay" />
            <circle cx="400" cy="350" r="4.5" fill="rgba(255,255,255,0.35)" />
            <circle cx="350" cy="580" r="6" fill="rgba(255,255,255,0.15)" className="animate-pulse-node" />
            <circle cx="350" cy="580" r="3" fill="rgba(255,255,255,0.4)" />

            <circle r="4" fill="white" opacity="0.6">
              <animateMotion dur="7s" repeatCount="indefinite" path="M 100 300 Q 250 200, 400 350 T 550 250" />
            </circle>
            <circle r="3" fill="white" opacity="0.5">
              <animateMotion dur="9s" repeatCount="indefinite" path="M 80 550 Q 220 480, 350 580 T 520 650" />
            </circle>
            <circle r="3.5" fill="white" opacity="0.4">
              <animateMotion dur="8s" repeatCount="indefinite" path="M 200 150 Q 300 100, 450 200 T 500 450" />
            </circle>
          </svg>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-white text-center leading-snug">
            ابدأ بإدارة توزيعك
            <br />
            <span className="text-emerald-200">في دقائق</span>
          </h2>

          <p className="mt-4 text-teal-200/80 text-center max-w-sm leading-relaxed">
            سجّل الآن واحصل على قاعدة بيانات خاصة بشركتك مع كل الأدوات التي تحتاجها.
          </p>

          <div className="mt-10 space-y-4 w-full max-w-xs">
            {[
              { step: '1', text: 'أنشئ حسابك في 30 ثانية' },
              { step: '2', text: 'أضف منتجاتك وعملاءك' },
              { step: '3', text: 'ابدأ بإدارة الطلبات والتوصيل' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3 px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {item.step}
                </div>
                <span className="text-sm text-white/80">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-400/15 border border-emerald-300/20 rounded-full backdrop-blur-sm">
            <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-emerald-200">14 يوم تجربة مجانية — بدون التزام</span>
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
          @keyframes dash-flow {
            to { stroke-dashoffset: -40; }
          }
          @keyframes pulse-node {
            0%, 100% { r: 8; opacity: 0.15; }
            50% { r: 14; opacity: 0.05; }
          }
          .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
          .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }
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
