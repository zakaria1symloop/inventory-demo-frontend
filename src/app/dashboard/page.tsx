'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { dashboardApi, locationApi, tenantApi, saasPaymentApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';
import toast from 'react-hot-toast';
import {
  ExclamationTriangleIcon,
  MapPinIcon,
  ShieldExclamationIcon,
  WrenchScrewdriverIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const MiniDriverMap = dynamic(() => import('./MiniDriverMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-gray-400 text-sm">...</div>
    </div>
  ),
});

// --- Stat Card Component ---
interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  /**
   * Tailwind border-* class kept for API compatibility with existing callsites.
   * Converted internally to a tiny status dot at the start of the label row —
   * the 4px coloured left bar was loud and "consumer-y".
   */
  borderColor: string;
}

// Map legacy borderColor classes to the dot accent token.
function dotFromBorder(b: string): string {
  if (b.includes('blue')) return 'metric-dot-blue';
  if (b.includes('emerald') || b.includes('green')) return 'metric-dot-green';
  if (b.includes('orange') || b.includes('amber') || b.includes('yellow')) return 'metric-dot-orange';
  if (b.includes('violet') || b.includes('purple')) return 'metric-dot-violet';
  if (b.includes('red') || b.includes('rose') || b.includes('pink')) return 'metric-dot-red';
  return 'metric-dot-neutral';
}

function StatCard({ title, value, subValue, borderColor }: StatCardProps) {
  const dot = dotFromBorder(borderColor);
  return (
    <div className="metric-tile">
      <div className="flex items-center gap-1.5">
        <span className={`metric-dot ${dot}`} aria-hidden />
        <p className="metric-label truncate">{title}</p>
      </div>
      <p className="metric-value truncate">{value}</p>
      {subValue && <p className="metric-sub">{subValue}</p>}
    </div>
  );
}

// --- Skeleton Components ---
function CardSkeleton() {
  return (
    <div className="card !p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
      <div className="h-[300px] bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

// --- Currency Formatter ---
function formatDZD(value: number, locale: 'ar' | 'fr' | 'en' = 'ar') {
  const intlLocale = locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-DZ' : 'en-US';
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(value);
}

// --- Period Tabs ---
const PERIOD_KEYS = ['week', 'month', 'year'] as const;

// --- Plan Banner Component ---
const PLAN_COLORS: Record<string, { bg: string; border: string; text: string; bar: string; badge: string; badgeText: string }> = {
  free:     { bg: 'bg-gray-50 dark:bg-gray-800/50',    border: 'border-gray-200 dark:border-gray-700',  text: 'text-gray-700 dark:text-gray-300',  bar: 'bg-gray-400', badge: 'bg-gray-200 dark:bg-gray-700', badgeText: 'text-gray-600 dark:text-gray-400' },
  starter:  { bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-800',  text: 'text-blue-700 dark:text-blue-300',  bar: 'bg-blue-500', badge: 'bg-blue-100 dark:bg-blue-900/40', badgeText: 'text-blue-700 dark:text-blue-300' },
  pro:      { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300', bar: 'bg-violet-500', badge: 'bg-violet-100 dark:bg-violet-900/40', badgeText: 'text-violet-700 dark:text-violet-300' },
  business: { bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500', badge: 'bg-amber-100 dark:bg-amber-900/40', badgeText: 'text-amber-700 dark:text-amber-300' },
};

interface PlanInfo {
  plan: string;
  plan_name: string;
  product_limit: number;
  product_count: number;
  price: number;
  trial_ends_at: string | null;
  plans: Array<{ id: string; name: string; product_limit: number; price: number }>;
}

function PlanBanner({ plan }: { plan: PlanInfo }) {
  const { t, locale } = useLocale();
  const colors = PLAN_COLORS[plan.plan] || PLAN_COLORS.free;
  const isUnlimited = plan.product_limit <= 0 || plan.product_limit >= 999999;
  const usage = isUnlimited ? 0 : Math.min((plan.product_count / plan.product_limit) * 100, 100);
  const isNearLimit = usage >= 80;
  const isAtLimit = usage >= 100;

  // Trial days remaining
  let trialDays: number | null = null;
  if (plan.trial_ends_at) {
    const diff = new Date(plan.trial_ends_at).getTime() - Date.now();
    trialDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Next plan for upgrade CTA
  const planOrder = ['free', 'starter', 'pro', 'pro_ai', 'business', 'enterprise'];
  const currentIdx = planOrder.indexOf(plan.plan);
  const nextPlan = currentIdx < planOrder.length - 1 ? plan.plans?.find(p => p.id === planOrder[currentIdx + 1]) : null;

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Plan info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${colors.badge} ${colors.badgeText}`}>
              {plan.plan_name}
            </span>
            {trialDays !== null && trialDays > 0 && (
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                {t('dashboard.trialDaysRemaining', { days: trialDays })}
              </span>
            )}
            {trialDays !== null && trialDays === 0 && (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                {t('dashboard.trialExpired')}
              </span>
            )}
            {plan.price > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {plan.price.toLocaleString()} {t('dashboard.priceMonthly')}
              </span>
            )}
          </div>

          {/* Usage bar */}
          {!isUnlimited ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {t('dashboard.productsUsage')} <span className="font-semibold">{plan.product_count}</span> / {plan.product_limit}
                </span>
                <span className={`text-xs font-semibold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-gray-500'}`}>
                  {Math.round(usage)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : colors.bar
                  }`}
                  style={{ width: `${usage}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('dashboard.unlimitedProducts')}
            </span>
          )}
        </div>

        {/* Upgrade CTA */}
        {nextPlan && (
          <div className="shrink-0">
            <Link
              href="/dashboard/upgrade"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isNearLimit
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {t('dashboard.upgradeTo', { plan: nextPlan.name })}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ======================
// Main Dashboard Page
// ======================
export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="spinner w-8 h-8"></div></div>}>
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
  const { t, locale } = useLocale();
  const [chartPeriod, setChartPeriod] = useState<string>('month');
  const [paymentMsg, setPaymentMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle payment redirect result
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      const plan = searchParams.get('plan');
      setPaymentMsg({ type: 'success', text: plan ? t('dashboard.paymentUpgraded', { plan }) : t('dashboard.paymentSuccess') });
      router.replace('/dashboard');
    } else if (payment === 'failed') {
      setPaymentMsg({ type: 'error', text: t('dashboard.paymentFailed') });
      router.replace('/dashboard');
    } else if (payment === 'pending') {
      const paymentId = searchParams.get('payment_id');
      const plan = searchParams.get('plan');
      setPaymentMsg({ type: 'success', text: t('dashboard.paymentPending') });
      router.replace('/dashboard');
      // Poll for payment status
      if (paymentId) {
        const pollStatus = async () => {
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 3000));
            try {
              const res = await saasPaymentApi.getStatus(Number(paymentId));
              if (res.data.status === 'paid') {
                setPaymentMsg({ type: 'success', text: plan ? t('dashboard.paymentUpgraded', { plan }) : t('dashboard.paymentSuccess') });
                return;
              } else if (res.data.status === 'failed') {
                setPaymentMsg({ type: 'error', text: t('dashboard.paymentFailed') });
                return;
              }
            } catch { break; }
          }
          setPaymentMsg({ type: 'success', text: plan ? t('dashboard.paymentUpgradeSent', { plan }) : t('dashboard.paymentSent') });
        };
        pollStatus();
      }
    }
  }, [searchParams, router]);

  // --- Data Queries ---
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getStats();
      return response.data;
    },
  });

  const { data: salesChart } = useQuery({
    queryKey: ['sales-chart', chartPeriod],
    queryFn: async () => {
      const response = await dashboardApi.getSalesChart({ period: chartPeriod });
      return response.data;
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      const response = await dashboardApi.getTopProducts({ limit: 5 });
      return response.data;
    },
  });

  const { data: topClients } = useQuery({
    queryKey: ['top-clients'],
    queryFn: async () => {
      const response = await dashboardApi.getTopClients({ limit: 5 });
      return response.data;
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const response = await dashboardApi.getLowStock();
      return response.data;
    },
  });

  const { data: planData } = useQuery({
    queryKey: ['tenant-plan'],
    queryFn: async () => {
      const response = await tenantApi.getPlan();
      return response.data;
    },
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers-location'],
    queryFn: async () => {
      const response = await locationApi.getAllDrivers();
      return response.data;
    },
    refetchInterval: 30000,
  });

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const { data: healthAlerts, refetch: refetchHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await dashboardApi.getSystemHealth();
      return response.data;
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const { data: appVersions } = useQuery({
    queryKey: ['app-versions'],
    queryFn: async () => {
      const response = await dashboardApi.getAppVersions();
      return response.data;
    },
    enabled: isAdmin,
  });

  const stats = dashboardData?.stats;
  const today = dashboardData?.today;
  const monthly = dashboardData?.monthly;
  const pending = dashboardData?.pending;

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse"></div>
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-48 mt-2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSkeleton />
          <ListSkeleton />
          <ListSkeleton />
        </div>
      </div>
    );
  }

  // --- Helpers ---
  const maxClientAmount = topClients?.length
    ? Math.max(...topClients.map((c: { total_amount: number }) => c.total_amount))
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      {/* Payment Result Message */}
      {paymentMsg && (
        <div className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between ${
          paymentMsg.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {paymentMsg.type === 'success' ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {paymentMsg.text}
          </div>
          <button onClick={() => setPaymentMsg(null)} className="shrink-0 hover:opacity-70">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Plan Banner */}
      {planData && <PlanBanner plan={planData} />}

      {/* System Health Alerts - Admin Only */}
      {isAdmin && healthAlerts && healthAlerts.length > 0 && (
        <div className="surface-pro p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldExclamationIcon className="w-4 h-4 text-orange-500" />
            <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{t('dashboard.systemHealth')}</h2>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
              <span className="metric-dot metric-dot-orange" aria-hidden />
              {healthAlerts.length} {t('dashboard.alert')}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {healthAlerts.map((alert: { type: string; title: string; message: string; count: number; action?: string }, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  alert.type === 'danger'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : alert.type === 'warning'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-medium text-sm ${
                      alert.type === 'danger' ? 'text-red-800 dark:text-red-300'
                      : alert.type === 'warning' ? 'text-orange-800 dark:text-orange-300'
                      : 'text-blue-800 dark:text-blue-300'
                    }`}>
                      {alert.title}
                    </p>
                    <p className={`text-xs mt-1 ${
                      alert.type === 'danger' ? 'text-red-600 dark:text-red-400'
                      : alert.type === 'warning' ? 'text-orange-600 dark:text-orange-400'
                      : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                  <span className={`text-lg font-bold ${
                    alert.type === 'danger' ? 'text-red-600' : alert.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {alert.count}
                  </span>
                </div>
                {alert.action === 'fix_caisses' && (
                  <button
                    onClick={async () => {
                      try {
                        await dashboardApi.fixMissingCaisses();
                        toast.success(t('dashboard.fixedCaisses'));
                        refetchHealth();
                      } catch {
                        toast.error(t('dashboard.errorOccurred'));
                      }
                    }}
                    className="mt-2 flex items-center gap-1 text-xs text-orange-700 dark:text-orange-300 hover:underline"
                  >
                    <WrenchScrewdriverIcon className="w-3 h-3" />
                    {t('dashboard.autoFix')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Clear */}
      {isAdmin && healthAlerts && healthAlerts.length === 0 && (
        <div className="surface-pro px-4 py-2.5 flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300">
            <span className="metric-dot metric-dot-green" aria-hidden />
            {t('dashboard.systemHealthy')}
          </span>
        </div>
      )}

      {/* App Versions - Admin Only */}
      {isAdmin && appVersions && (appVersions.driver_apk_url || appVersions.sales_apk_url || appVersions.cashvan_apk_url) && (
        <div className="surface-pro p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownTrayIcon className="w-4 h-4 text-gray-500" />
            <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{t('dashboard.mobileApps')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {appVersions.sales_apk_url && (
              <a href={appVersions.sales_apk_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{t('dashboard.sellerApp')}</p>
                  <p className="text-xs text-gray-500">{appVersions.sales_apk_version || '-'}</p>
                </div>
                <ArrowDownTrayIcon className="w-4 h-4 text-gray-500" />
              </a>
            )}
            {appVersions.driver_apk_url && (
              <a href={appVersions.driver_apk_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{t('dashboard.driverApp')}</p>
                  <p className="text-xs text-gray-500">{appVersions.driver_apk_version || '-'}</p>
                </div>
                <ArrowDownTrayIcon className="w-4 h-4 text-gray-500" />
              </a>
            )}
            {appVersions.cashvan_apk_url && (
              <a href={appVersions.cashvan_apk_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{t('dashboard.cashvanApp')}</p>
                  <p className="text-xs text-gray-500">{appVersions.cashvan_apk_version || '-'}</p>
                </div>
                <ArrowDownTrayIcon className="w-4 h-4 text-gray-500" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.products')}
          value={stats?.total_products || 0}
          borderColor="border-blue-500"
        />
        <StatCard
          title={t('dashboard.clients')}
          value={stats?.total_clients || 0}
          borderColor="border-green-500"
        />
        <StatCard
          title={t('dashboard.pendingOrders')}
          value={pending?.orders || 0}
          borderColor="border-orange-500"
        />
        <StatCard
          title={t('dashboard.activeDeliveries')}
          value={pending?.deliveries || stats?.active_deliveries || 0}
          borderColor="border-purple-500"
        />
      </div>

      {/* Row 2: Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.todaySales')}
          value={formatDZD(today?.sales || 0, locale)}
          borderColor="border-emerald-500"
        />
        <StatCard
          title={t('dashboard.monthlySales')}
          value={formatDZD(parseFloat(monthly?.sales) || 0, locale)}
          borderColor="border-emerald-500"
        />
        <StatCard
          title={t('dashboard.todayPurchases')}
          value={formatDZD(today?.purchases || 0, locale)}
          borderColor="border-red-500"
        />
        <StatCard
          title={t('dashboard.monthlyPurchases')}
          value={formatDZD(parseFloat(monthly?.purchases) || 0, locale)}
          borderColor="border-red-500"
        />
      </div>

      {/* Row 3: Sales Chart + Mini Driver Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales/Purchases Area Chart */}
        <div className="lg:col-span-2 surface-pro p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
              {t('dashboard.salesAndPurchases')}
            </h2>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              {PERIOD_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => setChartPeriod(key)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    chartPeriod === key
                      ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-medium'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t(`dashboard.${key}` as 'dashboard.week' | 'dashboard.month' | 'dashboard.year')}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart || []} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchasesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm" style={{ direction: locale === 'fr' ? 'ltr' : 'rtl' }}>
                        <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">{label}</p>
                        {payload.map((entry, i) => (
                          <p key={i} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.dataKey === 'sales' ? '#10b981' : '#ef4444' }}></span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {entry.dataKey === 'sales' ? t('dashboard.sales') : t('dashboard.purchases')}:
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                              {formatDZD(Number(entry.value) || 0, locale)}
                            </span>
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#purchasesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
              {t('dashboard.sales')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 bg-red-500 rounded-full inline-block"></span>
              {t('dashboard.purchases')}
            </span>
          </div>
        </div>

        {/* Mini Driver Map */}
        <div className="surface-pro overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-gray-500" />
              {t('dashboard.driverLocations')}
            </h2>
            <Link
              href="/dashboard/drivers-map"
              className="text-[12px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 px-4 pb-2 text-[10px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
              {t('dashboard.online')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              {t('dashboard.delivering')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
              {t('dashboard.offline')}
            </span>
          </div>
          <div className="flex-1 min-h-[260px]">
            <MiniDriverMap drivers={driversData?.drivers || []} />
          </div>
        </div>
      </div>

      {/* Row 4: Top Products + Top Clients + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products Bar Chart */}
        <div className="surface-pro p-4">
          <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {t('dashboard.topProducts')}
          </h2>
          {topProducts && topProducts.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts.map((p: { id: number; name: string; total_sold: number }) => ({
                    ...p,
                    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value) => [`${value ?? 0} ${t('dashboard.unit')}`, t('dashboard.soldQuantity')]}
                    contentStyle={{
                      direction: locale === 'fr' ? 'ltr' : 'rtl',
                      textAlign: locale === 'fr' ? 'left' : 'right',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total_sold" fill="url(#barGradient)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-center py-16 text-sm">{t('dashboard.noData')}</p>
          )}
        </div>

        {/* Top Clients */}
        <div className="surface-pro p-4">
          <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {t('dashboard.topClients')}
          </h2>
          {topClients && topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.map((client: { id: number; name: string; total_amount: number }, index: number) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                    : index === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    : index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {client.name}
                      </span>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0 ms-2">
                        {formatDZD(client.total_amount, locale)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(client.total_amount / maxClientAmount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-center py-16 text-sm">{t('dashboard.noData')}</p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="surface-pro p-4">
          <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
            {t('dashboard.lowStockAlert')}
          </h2>
          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((item: { id: number; name: string; total_stock: number; stock_alert: number }) => {
                const ratio = item.stock_alert > 0 ? item.total_stock / item.stock_alert : 0;
                const isCritical = ratio <= 0.3;
                const barColor = isCritical ? 'bg-red-500' : 'bg-orange-400';
                const bgHighlight = isCritical
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-orange-50 dark:bg-orange-900/20';

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-lg ${bgHighlight}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ms-2">
                        {item.total_stock} / {item.stock_alert}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className={`${barColor} h-1.5 rounded-full transition-all`}
                        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-center py-16 text-sm">
              {t('dashboard.noLowStock')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
