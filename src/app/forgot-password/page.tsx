'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saasApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await saasApi.forgotPassword(email);
      toast.success('تم إرسال رمز التحقق');
      setStep(2);
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في الإرسال');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await saasApi.forgotPassword(email);
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

  // OTP input handlers
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-advance when all 6 digits entered
    if (value && index === 5 && newOtp.every(d => d !== '')) {
      setStep(3);
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
    if (pasteData.length === 6) {
      setStep(3);
    } else {
      otpRefs.current[pasteData.length]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (otp.every(d => d !== '')) {
      setStep(3);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    setIsLoading(true);
    try {
      await saasApi.resetPassword({
        email,
        otp: otp.join(''),
        password,
        password_confirmation: passwordConfirmation,
      });
      toast.success('تم تغيير كلمة المرور بنجاح');
      router.push('/login');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في تغيير كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: score, label: 'ضعيفة', color: 'bg-red-500' };
    if (score <= 3) return { level: score, label: 'متوسطة', color: 'bg-amber-500' };
    return { level: score, label: 'قوية', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength();

  return (
    <div dir="rtl" className="min-h-screen flex">
      {/* Right side — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">تراكسيرا</span>
          </Link>

          {/* Back link */}
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6">
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            العودة لتسجيل الدخول
          </Link>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-0.5 transition-all ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* === STEP 1: Email === */}
          {step === 1 && (
            <>
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">نسيت كلمة المرور؟</h1>
              <p className="mt-2 text-gray-500 leading-relaxed">
                أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق لإعادة تعيين كلمة المرور.
              </p>

              <form onSubmit={handleSendOtp} className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400"
                      placeholder="example@company.com"
                      required
                      autoFocus
                    />
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
                      جاري الإرسال...
                    </span>
                  ) : (
                    'إرسال رمز التحقق'
                  )}
                </button>
              </form>
            </>
          )}

          {/* === STEP 2: OTP Input === */}
          {step === 2 && (
            <>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">أدخل رمز التحقق</h1>
              <p className="mt-2 text-gray-500 leading-relaxed">
                أرسلنا رمز تحقق مكون من 6 أرقام إلى
                <br />
                <span className="font-semibold text-gray-700">{email}</span>
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
                  onClick={handleVerifyOtp}
                  disabled={!otp.every(d => d !== '')}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm mb-4"
                >
                  تحقق من الرمز
                </button>

                {/* Resend */}
                <div className="text-center">
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

                {/* Change email */}
                <button
                  onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); }}
                  className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  تغيير البريد الإلكتروني
                </button>
              </div>
            </>
          )}

          {/* === STEP 3: New Password === */}
          {step === 3 && (
            <>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">كلمة مرور جديدة</h1>
              <p className="mt-2 text-gray-500 leading-relaxed">
                أدخل كلمة المرور الجديدة لحسابك.
              </p>

              <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور الجديدة</label>
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
                      placeholder="6 أحرف على الأقل"
                      required
                      minLength={6}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                  {/* Password strength */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1.5 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i <= strength.level ? strength.color : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        strength.level <= 2 ? 'text-red-500' : strength.level <= 3 ? 'text-amber-500' : 'text-green-500'
                      }`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className={`w-full pr-11 pl-11 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-gray-50/50 placeholder:text-gray-400 ${
                        passwordConfirmation && passwordConfirmation !== password
                          ? 'border-red-300'
                          : passwordConfirmation && passwordConfirmation === password
                          ? 'border-green-300'
                          : 'border-gray-300'
                      }`}
                      placeholder="أعد إدخال كلمة المرور"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
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
                  {passwordConfirmation && passwordConfirmation !== password && (
                    <p className="mt-1.5 text-xs text-red-500">كلمتا المرور غير متطابقتين</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !password || !passwordConfirmation || password !== passwordConfirmation}
                  className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      جاري التغيير...
                    </span>
                  ) : (
                    'تغيير كلمة المرور'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Left side — Hero illustration */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-bl from-amber-500 via-orange-600 to-red-700">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          <div className="absolute top-[15%] right-[20%] w-64 h-64 bg-amber-300/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-[20%] left-[15%] w-80 h-80 bg-orange-300/15 rounded-full blur-3xl animate-float-slower" />

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 900" fill="none" preserveAspectRatio="xMidYMid slice">
            <path d="M 120 250 Q 280 180, 420 320 T 500 500" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="10 6" className="animate-dash-flow-1" />
            <path d="M 100 600 Q 250 520, 380 600 T 520 480" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="8 8" className="animate-dash-flow-2" />

            <circle cx="120" cy="250" r="7" fill="rgba(255,255,255,0.15)" className="animate-pulse-node" />
            <circle cx="120" cy="250" r="3.5" fill="rgba(255,255,255,0.4)" />
            <circle cx="420" cy="320" r="8" fill="rgba(255,255,255,0.12)" className="animate-pulse-node-delay" />
            <circle cx="420" cy="320" r="4" fill="rgba(255,255,255,0.35)" />

            <circle r="4" fill="white" opacity="0.6">
              <animateMotion dur="6s" repeatCount="indefinite" path="M 120 250 Q 280 180, 420 320 T 500 500" />
            </circle>
            <circle r="3" fill="white" opacity="0.5">
              <animateMotion dur="8s" repeatCount="indefinite" path="M 100 600 Q 250 520, 380 600 T 520 480" />
            </circle>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-white text-center leading-snug">
            حسابك في
            <br />
            <span className="text-amber-200">أمان تام</span>
          </h2>

          <p className="mt-4 text-amber-200/80 text-center max-w-sm leading-relaxed">
            بيانات كل شركة معزولة في قاعدة بيانات منفصلة. لا نشارك بياناتك مع أي طرف آخر.
          </p>

          <div className="mt-10 space-y-3 w-full max-w-xs">
            {[
              'قاعدة بيانات منفصلة لكل شركة',
              'تشفير كامل للبيانات',
              'نسخ احتياطي يومي تلقائي',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl backdrop-blur-sm">
                <svg className="w-5 h-5 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-white/80">{item}</span>
              </div>
            ))}
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
          .animate-pulse-node { animation: pulse-node 3s ease-in-out infinite; }
          .animate-pulse-node-delay { animation: pulse-node 3s ease-in-out 1.5s infinite; }
        `}</style>
      </div>
    </div>
  );
}
