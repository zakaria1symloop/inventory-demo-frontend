'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantApi, saasPaymentApi } from '@/lib/api';
import Link from 'next/link';

const planOrder = ['free', 'starter', 'pro', 'pro_ai', 'business', 'enterprise'];

const planDetails: Record<string, { name: string; subtitle: string; features: string[] }> = {
  free: {
    name: 'مجاني',
    subtitle: 'للتجربة',
    features: [
      'حتى 25 منتج',
      'مستخدم واحد',
      'تجربة 14 يوم كاملة',
    ],
  },
  pro: {
    name: 'المحترف',
    subtitle: 'لكل الشركات',
    features: [
      'حتى 2,000 منتج',
      'حتى 10 مستخدمين',
      '+ 1,000 د.ج لكل مستخدم إضافي',
      'كل الوحدات والميزات',
      'التوصيل وتتبع GPS',
      'البيع المتنقل (Cashvan)',
      'تطبيقات الموبايل',
      'دعم فني أولوي',
    ],
  },
  pro_ai: {
    name: 'المحترف + ذكاء اصطناعي',
    subtitle: 'للشركات المتقدمة',
    features: [
      'كل مميزات المحترف',
      'حتى 5,000 منتج',
      'حتى 20 مستخدم',
      'تحليلات ذكية بالذكاء الاصطناعي',
      'توقعات المبيعات والطلبات',
      'تقارير وتوصيات تلقائية',
      'دعم فني VIP',
    ],
  },
  enterprise: {
    name: 'المؤسسات',
    subtitle: 'للشركات الكبرى',
    features: [
      'منتجات ومستخدمين بلا حدود',
      'كل مميزات المحترف + ذكاء اصطناعي',
      'خوادم مخصصة',
      'تكاملات مخصصة (API)',
      'مدير حساب مخصص',
      'تدريب فريقك',
      'اتفاقية مستوى خدمة (SLA)',
    ],
  },
};

const planColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  free:       { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', text: 'text-gray-700' },
  starter:    { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', text: 'text-gray-700' },
  pro:        { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700' },
  pro_ai:     { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', text: 'text-violet-700' },
  business:   { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700' },
  enterprise: { bg: 'bg-gray-900', border: 'border-gray-700', badge: 'bg-gray-700 text-gray-200', text: 'text-gray-200' },
};

// Only show these plans in the upgrade grid
const displayPlans = ['pro', 'pro_ai', 'enterprise'];

export default function UpgradePage() {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: planData, isLoading } = useQuery({
    queryKey: ['tenant-plan'],
    queryFn: async () => {
      const res = await tenantApi.getPlan();
      return res.data;
    },
  });

  const currentPlan = planData?.plan || 'free';
  const currentIdx = planOrder.indexOf(currentPlan);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    setError(null);
    try {
      const res = await saasPaymentApi.upgrade(plan);
      const { checkout_url } = res.data;
      if (checkout_url) {
        window.location.href = checkout_url;
      } else {
        setError('لم يتم إنشاء رابط الدفع. حاول مرة أخرى.');
        setUpgrading(null);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'حدث خطأ أثناء إنشاء جلسة الدفع.');
      setUpgrading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          العودة للوحة التحكم
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">ترقية الخطة</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          اختر الخطة المناسبة لحجم أعمالك. جميع الخطط تشمل تجربة مجانية 14 يوم.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Plans Grid — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {displayPlans.map((planId) => {
          const idx = planOrder.indexOf(planId);
          const isCurrent = planId === currentPlan;
          const isLower = idx <= currentIdx;
          const isUpgradeable = idx > currentIdx;
          const info = planDetails[planId];
          const colors = planColors[planId];
          const price = planData?.plans?.find((p: { id: string }) => p.id === planId)?.price ?? 0;
          const isEnterprise = planId === 'enterprise';
          const isPopular = planId === 'pro';

          return (
            <div
              key={planId}
              className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all ${
                isCurrent
                  ? `${colors.border} ${colors.bg} ring-2 ring-offset-2 ${colors.border.replace('border-', 'ring-')}`
                  : isEnterprise
                  ? 'border-gray-800 bg-gray-900 text-white'
                  : isLower
                  ? 'border-gray-100 bg-gray-50/50 opacity-60'
                  : `border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg`
              }`}
            >
              {/* Current badge */}
              {isCurrent && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 ${colors.badge} text-xs font-bold rounded-full whitespace-nowrap`}>
                  الخطة الحالية
                </div>
              )}

              {/* Popular badge */}
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full whitespace-nowrap">
                  الأكثر طلباً
                </div>
              )}

              {/* Plan name */}
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${isEnterprise && !isCurrent ? 'text-white' : 'text-gray-900'}`}>{info.name}</h3>
                <p className={`text-sm ${isEnterprise && !isCurrent ? 'text-gray-400' : 'text-gray-500'}`}>{info.subtitle}</p>
              </div>

              {/* Price */}
              <div className="mb-5">
                {isEnterprise ? (
                  <span className={`text-3xl font-extrabold ${isCurrent ? 'text-gray-900' : 'text-white'}`}>حسب الطلب</span>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-gray-900">
                      {price === 0 ? 'مجاناً' : price.toLocaleString()}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-gray-500 mr-1">د.ج / شهرياً</span>
                    )}
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {info.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg className={`w-4 h-4 shrink-0 mt-0.5 ${isEnterprise && !isCurrent ? 'text-emerald-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={isEnterprise && !isCurrent ? 'text-gray-300' : 'text-gray-700'}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Action */}
              {isCurrent ? (
                <div className={`w-full py-3 text-center text-sm font-bold rounded-xl ${colors.badge}`}>
                  خطتك الحالية
                </div>
              ) : isEnterprise ? (
                <Link
                  href="/#contact"
                  className="w-full py-3 text-center text-sm font-bold rounded-xl bg-white text-gray-900 hover:bg-gray-100 transition-colors block"
                >
                  تواصل معنا
                </Link>
              ) : isUpgradeable ? (
                <button
                  onClick={() => handleUpgrade(planId)}
                  disabled={upgrading !== null}
                  className="w-full py-3 text-center text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgrading === planId ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      جاري التحويل للدفع...
                    </span>
                  ) : (
                    `ترقية إلى ${info.name}`
                  )}
                </button>
              ) : (
                <div className="w-full py-3 text-center text-sm font-medium rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed">
                  غير متاح
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment info */}
      <div className="mt-8 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">دفع آمن عبر SlickPay</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ستتم إعادة توجيهك إلى بوابة الدفع الآمنة لإتمام عملية الدفع. بعد الدفع الناجح، سيتم ترقية خطتك تلقائياً.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
