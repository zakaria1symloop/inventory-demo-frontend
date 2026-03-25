'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { dashboardApi } from '@/lib/api';
import {
  ArrowDownTrayIcon,
  LinkIcon,
  CheckIcon,
  DevicePhoneMobileIcon,
  TruckIcon,
  ShoppingBagIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AppTemplate {
  id: string;
  urlKey: 'driver_apk_url' | 'sales_apk_url' | 'cashvan_apk_url';
  versionKey: 'driver_apk_version' | 'sales_apk_version' | 'cashvan_apk_version';
  name: string;
  description: string;
  size: string;
  icon: React.ComponentType<{ className?: string }>;
  colorFrom: string;
  colorTo: string;
  accentBg: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  features: string[];
}

const appTemplates: AppTemplate[] = [
  {
    id: 'driver',
    urlKey: 'driver_apk_url',
    versionKey: 'driver_apk_version',
    name: 'تطبيق السائق',
    description: 'تطبيق التوصيل وتتبع الطلبات والمدفوعات للسائقين — يعمل بدون إنترنت',
    size: '27 MB',
    icon: TruckIcon,
    colorFrom: 'from-blue-600',
    colorTo: 'to-indigo-700',
    accentBg: 'bg-blue-50 dark:bg-blue-900/20',
    accentText: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    features: [
      'استلام وتوصيل الطلبات',
      'تتبع الموقع المباشر',
      'تحصيل المدفوعات',
      'إدارة المرتجعات',
      'يعمل بدون إنترنت',
      'إشعارات فورية',
    ],
  },
  {
    id: 'sales',
    urlKey: 'sales_apk_url',
    versionKey: 'sales_apk_version',
    name: 'تطبيق البائع',
    description: 'تطبيق البيع المتنقل وإدارة الجولات والعملاء — البيع من أي مكان',
    size: '26 MB',
    icon: ShoppingBagIcon,
    colorFrom: 'from-emerald-600',
    colorTo: 'to-teal-700',
    accentBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    features: [
      'إنشاء الطلبات الميدانية',
      'إدارة الجولات والعملاء',
      'البيع من المستودع المتنقل',
      'أسعار العملاء المخصصة',
      'كتالوج المنتجات',
      'تقارير المبيعات اليومية',
    ],
  },
  {
    id: 'cashvan',
    urlKey: 'cashvan_apk_url',
    versionKey: 'cashvan_apk_version',
    name: 'تطبيق CashVan',
    description: 'تطبيق البيع والتوصيل المباشر من الشاحنة — بيع فوري مع تحصيل نقدي في الميدان',
    size: '26 MB',
    icon: TruckIcon,
    colorFrom: 'from-orange-500',
    colorTo: 'to-amber-600',
    accentBg: 'bg-orange-50 dark:bg-orange-900/20',
    accentText: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    features: [
      'البيع المباشر من الشاحنة',
      'تحصيل نقدي فوري',
      'إدارة مخزون الشاحنة',
      'جولات العملاء اليومية',
      'طباعة الفواتير بلوتوث',
      'يعمل بدون إنترنت',
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
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} rounded-3xl blur-xl opacity-40 scale-110`} />
      <div className="relative w-full h-full bg-gray-900 rounded-[1.75rem] p-1.5 shadow-2xl border border-white/20">
        <div className={`w-full h-full bg-gradient-to-br ${colorFrom} ${colorTo} rounded-[1.25rem] flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
          <Icon className="w-12 h-12 sm:w-14 sm:h-14 text-white relative z-10 drop-shadow-lg" />
        </div>
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-gray-900 rounded-b-xl" />
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  );
}

function UploadModal({ template, onClose, onSuccess }: {
  template: AppTemplate;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file || !version.trim()) {
      toast.error('يرجى اختيار الملف وإدخال رقم الإصدار');
      return;
    }
    if (!file.name.endsWith('.apk')) {
      toast.error('يرجى اختيار ملف APK فقط');
      return;
    }

    setUploading(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 1, 90));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', template.id);
      formData.append('version', version.trim());

      await dashboardApi.uploadApk(formData);
      clearInterval(progressInterval);
      setProgress(100);
      toast.success('تم رفع التطبيق بنجاح');
      onSuccess();
      setTimeout(onClose, 500);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء الرفع');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className={`relative bg-gradient-to-br ${template.colorFrom} ${template.colorTo} rounded-t-2xl px-6 py-5`}>
          <button onClick={onClose} className="absolute top-4 left-4 text-white/70 hover:text-white transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowUpTrayIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">رفع {template.name}</h3>
              <p className="text-sm text-white/70">اختر ملف APK وأدخل رقم الإصدار</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملف APK</label>
            <input ref={fileRef} type="file" accept=".apk" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-900/50"
            >
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <ArrowUpTrayIcon className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-500">اضغط لاختيار ملف APK</p>
                </div>
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم الإصدار</label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="مثال: 1.0.0"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
            />
          </div>

          {uploading && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>جاري الرفع...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-l ${template.colorFrom} ${template.colorTo} rounded-full transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !file || !version.trim()}
              className={`flex-1 py-2.5 bg-gradient-to-l ${template.colorFrom} ${template.colorTo} text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowUpTrayIcon className="w-4 h-4" />
              )}
              {uploading ? 'جاري الرفع...' : 'رفع'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileAppPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [uploadTemplate, setUploadTemplate] = useState<AppTemplate | null>(null);
  const [deletingType, setDeletingType] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['tenant-apps'],
    queryFn: async () => {
      const res = await dashboardApi.getAppVersions();
      return res.data;
    },
  });

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleCopyLink = async (downloadUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = downloadUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    toast.success('تم نسخ الرابط');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppShare = (name: string, downloadUrl: string) => {
    const message = `📲 حمّل ${name} من هنا:\n${downloadUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDelete = async (template: AppTemplate) => {
    if (!confirm(`هل أنت متأكد من حذف ${template.name}؟`)) return;
    setDeletingType(template.id);
    try {
      await dashboardApi.deleteApk(template.id);
      toast.success('تم حذف التطبيق بنجاح');
      queryClient.invalidateQueries({ queryKey: ['tenant-apps'] });
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setDeletingType(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <DevicePhoneMobileIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تطبيقات الموبايل</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">ارفع وأدر تطبيقات الموبايل — شاركها مع فريقك بالرابط أو رمز QR</p>
          </div>
        </div>
      </div>

      {appsLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      )}

      {!appsLoading && (
        <>
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">💡</span>
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              <strong>نصيحة:</strong> ارفع ملفات APK هنا ثم شاركها مع السائقين والبائعين عبر رابط التحميل أو رمز QR.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {appTemplates.map((template, index) => {
              const downloadUrl = appsData?.[template.urlKey];
              const version = appsData?.[template.versionKey];
              const hasApp = !!downloadUrl;

              return (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                  style={{ animationDelay: `${(index + 1) * 120}ms` }}
                >
                  {/* Gradient header */}
                  <div className={`relative bg-gradient-to-br ${template.colorFrom} ${template.colorTo} px-6 py-10 sm:py-12 overflow-hidden`}>
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 opacity-[0.06]" style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }} />
                      <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <PhoneMockup icon={template.icon} colorFrom={template.colorFrom} colorTo={template.colorTo} />
                      <h2 className="mt-5 text-xl sm:text-2xl font-extrabold text-white text-center">{template.name}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        {version && (
                          <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/20">
                            v{version}
                          </span>
                        )}
                        {hasApp && (
                          <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20">
                            {template.size}
                          </span>
                        )}
                        {!hasApp && (
                          <span className="px-2.5 py-0.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs font-medium rounded-full border border-white/10">
                            لم يُرفع بعد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5 sm:p-6 space-y-5">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{template.description}</p>

                    <div className="grid grid-cols-2 gap-2">
                      {template.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2">
                          <CheckIcon className={`w-4 h-4 ${template.accentText} shrink-0 mt-0.5`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700" />

                    {hasApp ? (
                      <>
                        {/* QR Code */}
                        <div className="flex flex-col items-center gap-3 py-4 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">امسح الرمز للتحميل</p>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <QRCodeSVG
                              value={downloadUrl}
                              size={160}
                              level="H"
                              includeMargin={false}
                              bgColor={isDark ? '#1f2937' : '#ffffff'}
                              fgColor={isDark ? '#e5e7eb' : '#111827'}
                            />
                          </div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center max-w-[200px]">
                            وجّه كاميرا الهاتف نحو الرمز لبدء التحميل مباشرة
                          </p>
                        </div>

                        {/* Download button */}
                        <a
                          href={downloadUrl}
                          download
                          className={`flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-l ${template.colorFrom} ${template.colorTo} hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-lg text-sm`}
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                          تحميل التطبيق ({template.size})
                        </a>

                        {/* Copy / WhatsApp */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleCopyLink(downloadUrl, template.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                              copiedId === template.id
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {copiedId === template.id ? <><CheckIcon className="w-4 h-4" /> تم النسخ!</> : <><LinkIcon className="w-4 h-4" /> نسخ الرابط</>}
                          </button>
                          <button
                            onClick={() => handleWhatsAppShare(template.name, downloadUrl)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium rounded-xl transition-colors text-sm"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                            واتساب
                          </button>
                        </div>

                        {/* Admin: re-upload / delete */}
                        <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => setUploadTemplate(template)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <ArrowUpTrayIcon className="w-4 h-4" />
                            تحديث التطبيق
                          </button>
                          <button
                            onClick={() => handleDelete(template)}
                            disabled={deletingType === template.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          >
                            {deletingType === template.id ? (
                              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">لم يتم رفع ملف APK بعد</p>
                        <button
                          onClick={() => setUploadTemplate(template)}
                          className={`w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-l ${template.colorFrom} ${template.colorTo} hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-lg text-sm`}
                        >
                          <ArrowUpTrayIcon className="w-5 h-5" />
                          رفع ملف APK
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              التطبيقات متوافقة مع أجهزة Android 8.0 والأحدث — يتطلب السماح بالتثبيت من مصادر خارجية
            </p>
          </div>
        </>
      )}

      {uploadTemplate && (
        <UploadModal
          template={uploadTemplate}
          onClose={() => setUploadTemplate(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tenant-apps'] })}
        />
      )}
    </div>
  );
}
