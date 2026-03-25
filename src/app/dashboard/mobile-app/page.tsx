'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { tenantApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import {
  ArrowDownTrayIcon,
  LinkIcon,
  CheckIcon,
  DevicePhoneMobileIcon,
  TruckIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

interface AppInfo {
  id: string;
  nameKey: string;
  descKey: string;
  version: string | null;
  size: string;
  icon: React.ComponentType<{ className?: string }>;
  colorFrom: string;
  colorTo: string;
  solidColor: string;
  solidColorHover: string;
  accentText: string;
  downloadUrl: string;
  featureKeys: string[];
}

interface AppTemplate {
  id: string;
  urlKey: 'driver_apk_url' | 'sales_apk_url' | 'cashvan_apk_url';
  versionKey: 'driver_apk_version' | 'sales_apk_version' | 'cashvan_apk_version';
  nameKey: string;
  descKey: string;
  size: string;
  icon: React.ComponentType<{ className?: string }>;
  colorFrom: string;
  colorTo: string;
  solidColor: string;
  solidColorHover: string;
  accentText: string;
  featureKeys: string[];
}

const appTemplates: AppTemplate[] = [
  {
    id: 'driver',
    urlKey: 'driver_apk_url',
    versionKey: 'driver_apk_version',
    nameKey: 'mobileAppPage.driverAppName',
    descKey: 'mobileAppPage.driverAppDesc',
    size: '15 MB',
    icon: TruckIcon,
    colorFrom: 'from-blue-600',
    colorTo: 'to-indigo-700',
    solidColor: 'bg-blue-600',
    solidColorHover: 'hover:bg-blue-700',
    accentText: 'text-blue-600 dark:text-blue-400',
    featureKeys: [
      'mobileAppPage.driverFeature1',
      'mobileAppPage.driverFeature2',
      'mobileAppPage.driverFeature3',
      'mobileAppPage.driverFeature4',
      'mobileAppPage.driverFeature5',
      'mobileAppPage.driverFeature6',
    ],
  },
  {
    id: 'sales',
    urlKey: 'sales_apk_url',
    versionKey: 'sales_apk_version',
    nameKey: 'mobileAppPage.sellerAppName',
    descKey: 'mobileAppPage.sellerAppDesc',
    size: '18 MB',
    icon: ShoppingBagIcon,
    colorFrom: 'from-emerald-600',
    colorTo: 'to-teal-700',
    solidColor: 'bg-emerald-600',
    solidColorHover: 'hover:bg-emerald-700',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    featureKeys: [
      'mobileAppPage.sellerFeature1',
      'mobileAppPage.sellerFeature2',
      'mobileAppPage.sellerFeature3',
      'mobileAppPage.sellerFeature4',
      'mobileAppPage.sellerFeature5',
      'mobileAppPage.sellerFeature6',
    ],
  },
  {
    id: 'cashvan',
    urlKey: 'cashvan_apk_url',
    versionKey: 'cashvan_apk_version',
    nameKey: 'mobileAppPage.cashvanAppName',
    descKey: 'mobileAppPage.cashvanAppDesc',
    size: '20 MB',
    icon: TruckIcon,
    colorFrom: 'from-orange-500',
    colorTo: 'to-amber-600',
    solidColor: 'bg-orange-500',
    solidColorHover: 'hover:bg-orange-600',
    accentText: 'text-orange-600 dark:text-orange-400',
    featureKeys: [
      'mobileAppPage.cashvanFeature1',
      'mobileAppPage.cashvanFeature2',
      'mobileAppPage.cashvanFeature3',
      'mobileAppPage.cashvanFeature4',
      'mobileAppPage.cashvanFeature5',
      'mobileAppPage.cashvanFeature6',
    ],
  },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PhoneMockup({ icon: Icon, colorFrom, colorTo }: { icon: React.ComponentType<{ className?: string }>; colorFrom: string; colorTo: string }) {
  return (
    <div className="relative mx-auto w-28 h-48 sm:w-32 sm:h-56">
      {/* Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} rounded-3xl blur-xl opacity-40 scale-110`} />
      {/* Phone body */}
      <div className="relative w-full h-full bg-gray-900 rounded-[1.75rem] p-1.5 border border-white/20">
        {/* Screen */}
        <div className={`w-full h-full bg-gradient-to-br ${colorFrom} ${colorTo} rounded-[1.25rem] flex items-center justify-center relative overflow-hidden`}>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
          <Icon className="w-12 h-12 sm:w-14 sm:h-14 text-white relative z-10 drop-shadow-lg" />
        </div>
        {/* Notch */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-gray-900 rounded-b-xl" />
        {/* Home indicator */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  );
}

export default function MobileAppPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['tenant-apps'],
    queryFn: async () => {
      const res = await tenantApi.getApps();
      return res.data;
    },
  });

  // Build apps list dynamically from backend data
  const apps: AppInfo[] = appTemplates
    .filter((tmpl) => appsData?.[tmpl.urlKey])
    .map((tmpl) => ({
      ...tmpl,
      version: appsData[tmpl.versionKey] || null,
      downloadUrl: appsData[tmpl.urlKey],
    }));

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleCopyLink = async (app: AppInfo) => {
    try {
      await navigator.clipboard.writeText(app.downloadUrl);
      setCopiedId(app.id);
      toast.success(t('mobileAppPage.linkCopiedToast'));
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = app.downloadUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(app.id);
      toast.success(t('mobileAppPage.linkCopiedToast'));
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleWhatsAppShare = (app: AppInfo) => {
    const appName = t(app.nameKey as Parameters<typeof t>[0]);
    const messageText = t('mobileAppPage.whatsAppMessage', { appName });
    const message = `${messageText}\n${app.downloadUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="anim-fade-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
            <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
              {t('mobileAppPage.title')}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {t('mobileAppPage.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {appsLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      )}

      {/* No apps available */}
      {!appsLoading && apps.length === 0 && (
        <div className="text-center py-16">
          <DevicePhoneMobileIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('mobileAppPage.noAppsTitle')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('mobileAppPage.noAppsDesc')}
          </p>
        </div>
      )}

      {!appsLoading && apps.length > 0 && (
      <>
      {/* Tip banner */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 flex items-start gap-3 anim-fade-up" style={{ animationDelay: '80ms' }}>
        <span className="text-xl shrink-0 mt-0.5">💡</span>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <strong className="text-gray-900 dark:text-white">{t('mobileAppPage.tipLabel')}</strong> {t('mobileAppPage.tipText')}
        </p>
      </div>

      {/* App Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {apps.map((app, index) => (
          <div
            key={app.id}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden anim-scale-in"
            style={{ animationDelay: `${(index + 1) * 120}ms` }}
          >
            {/* Gradient header (decorative) */}
            <div className={`relative bg-gradient-to-br ${app.colorFrom} ${app.colorTo} px-6 py-10 sm:py-12 overflow-hidden`}>
              {/* Background pattern */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 opacity-[0.06]" style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }} />
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <PhoneMockup icon={app.icon} colorFrom={app.colorFrom} colorTo={app.colorTo} />
                <h2 className="mt-5 text-xl sm:text-2xl font-extrabold text-white text-center">
                  {t(app.nameKey as Parameters<typeof t>[0])}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  {app.version && (
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/20">
                      v{app.version}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20">
                    {app.size}
                  </span>
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {t(app.descKey as Parameters<typeof t>[0])}
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2">
                {app.featureKeys.map((featureKey) => (
                  <div key={featureKey} className="flex items-start gap-2">
                    <CheckIcon className={`w-4 h-4 ${app.accentText} shrink-0 mt-0.5`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t(featureKey as Parameters<typeof t>[0])}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 dark:border-gray-700" />

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3 py-4 px-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200/80 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('mobileAppPage.scanToDownload')}
                </p>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                  <QRCodeSVG
                    value={app.downloadUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                    bgColor={isDark ? '#374151' : '#ffffff'}
                    fgColor={isDark ? '#e5e7eb' : '#111827'}
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center max-w-[200px]">
                  {t('mobileAppPage.scanInstruction')}
                </p>
              </div>

              {/* Download button */}
              <a
                href={app.downloadUrl}
                download
                className={`flex items-center justify-center gap-2 w-full py-3.5 ${app.solidColor} ${app.solidColorHover} text-white font-bold rounded-xl transition-colors text-sm`}
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                {t('mobileAppPage.downloadApp')} ({app.size})
              </a>

              {/* Secondary actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleCopyLink(app)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    copiedId === app.id
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400'
                      : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {copiedId === app.id ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      {t('mobileAppPage.copied')}
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      {t('mobileAppPage.copyLink')}
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleWhatsAppShare(app)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium rounded-xl transition-colors text-sm"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  {t('mobileAppPage.shareWhatsApp')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom help note */}
      <div className="text-center anim-fade-up" style={{ animationDelay: '400ms' }}>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('mobileAppPage.compatibilityNote')}
        </p>
      </div>
      </>
      )}
    </div>
  );
}
