'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantApi, saasPaymentApi } from '@/lib/api';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard';

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
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-3">
        <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        العودة للوحة التحكم
      </Link>

      <PageHeader
        title="ترقية الخطة"
        subtitle="اختر الخطة المناسبة لحجم أعمالك. جميع الخطط تشمل تجربة مجانية 14 يوم."
      />

      {/* Error */}
      {error && (
        <div className="mb-4 surface-pro p-3 text-[13px] text-gray-700 dark:text-gray-300 inline-flex items-center gap-1.5">
          <span className="metric-dot metric-dot-red" aria-hidden />
          {error}
        </div>
      )}

      {/* Plans Grid — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayPlans.map((planId) => {
          const idx = planOrder.indexOf(planId);
          const isCurrent = planId === currentPlan;
          const isLower = idx <= currentIdx;
          const isUpgradeable = idx > currentIdx;
          const info = planDetails[planId];
          const price = planData?.plans?.find((p: { id: string }) => p.id === planId)?.price ?? 0;
          const isEnterprise = planId === 'enterprise';
          const isPopular = planId === 'pro';

          return (
            <div
              key={planId}
              className={`relative rounded-md border p-5 flex flex-col transition-colors ${
                isCurrent
                  ? 'border-gray-900 dark:border-gray-300 bg-gray-50/60 dark:bg-gray-700/30'
                  : isLower
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-60'
                  : 'border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {/* Current badge */}
              {isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full whitespace-nowrap">
                  <span className="metric-dot metric-dot-blue" aria-hidden />
                  الخطة الحالية
                </div>
              )}

              {/* Popular badge */}
              {isPopular && !isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full whitespace-nowrap">
                  <span className="metric-dot metric-dot-orange" aria-hidden />
                  الأكثر طلباً
                </div>
              )}

              {/* Plan name */}
              <div className="mb-3">
                <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white">{info.name}</h3>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">{info.subtitle}</p>
              </div>

              {/* Price */}
              <div className="mb-4">
                {isEnterprise ? (
                  <span className="text-[24px] font-semibold text-gray-900 dark:text-white">حسب الطلب</span>
                ) : (
                  <>
                    <span className="text-[24px] font-semibold text-gray-900 dark:text-white tnum">
                      {price === 0 ? 'مجاناً' : price.toLocaleString()}
                    </span>
                    {price > 0 && (
                      <span className="text-[12px] text-gray-500 dark:text-gray-400 mr-1">د.ج / شهرياً</span>
                    )}
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-4">
                {info.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px]">
                    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>

              {/* Action */}
              {isCurrent ? (
                <div className="w-full inline-flex items-center justify-center px-4 h-[38px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md">
                  خطتك الحالية
                </div>
              ) : isEnterprise ? (
                <Link
                  href="/#contact"
                  className="w-full inline-flex items-center justify-center px-4 h-[38px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors"
                >
                  تواصل معنا
                </Link>
              ) : isUpgradeable ? (
                <button
                  onClick={() => handleUpgrade(planId)}
                  disabled={upgrading !== null}
                  className="w-full inline-flex items-center justify-center px-4 h-[38px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgrading === planId ? (
                    <span className="inline-flex items-center justify-center gap-2">
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
                <div className="w-full inline-flex items-center justify-center px-4 h-[38px] text-[13px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md cursor-not-allowed">
                  غير متاح
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment info */}
      <div className="mt-6 surface-pro p-4">
        <div className="flex items-start gap-2">
          <span className="metric-dot metric-dot-blue mt-1.5 shrink-0" aria-hidden />
          <div>
            <p className="text-[13px] font-medium text-gray-900 dark:text-white">دفع آمن عبر SlickPay</p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
              ستتم إعادة توجيهك إلى بوابة الدفع الآمنة لإتمام عملية الدفع. بعد الدفع الناجح، سيتم ترقية خطتك تلقائياً.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
