'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { saasApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, checkAuth, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // If already verified, redirect to dashboard
  useEffect(() => {
    if (user?.email_verified_at) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!user?.email || countdown > 0) return;
    setIsLoading(true);
    try {
      await saasApi.sendVerificationOtp(user.email);
      toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      setCountdown(60);
      setSent(true);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      toast.error('خطأ في إرسال رمز التحقق');
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

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6 || !user?.email) return;

    setIsLoading(true);
    try {
      await saasApi.verifyEmail({ email: user.email, otp: code });
      toast.success('تم تأكيد البريد الإلكتروني بنجاح');
      await checkAuth();
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'رمز التحقق غير صحيح');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">تأكيد البريد الإلكتروني</h1>
          <p className="mt-2 text-gray-500 text-sm">
            {sent ? (
              <>أرسلنا رمز تحقق إلى <span className="font-semibold text-gray-700">{user.email}</span></>
            ) : (
              <>يرجى تأكيد بريدك الإلكتروني <span className="font-semibold text-gray-700">{user.email}</span> للمتابعة</>
            )}
          </p>
        </div>

        {!sent ? (
          <button
            onClick={handleSendOtp}
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
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
        ) : (
          <>
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

            <button
              onClick={handleVerify}
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

            <div className="text-center">
              <p className="text-sm text-gray-500">
                لم تستلم الرمز؟{' '}
                {countdown > 0 ? (
                  <span className="font-semibold text-gray-700">
                    أعد الإرسال بعد {countdown} ثانية
                  </span>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="font-bold text-blue-600 hover:text-blue-700 underline"
                  >
                    إعادة الإرسال
                  </button>
                )}
              </p>
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    </div>
  );
}
