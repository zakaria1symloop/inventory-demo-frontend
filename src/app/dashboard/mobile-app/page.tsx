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
  TruckIcon,
  ShoppingBagIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/dashboard';
import { useLocale } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/context';

interface AppTemplate {
  id: 'driver' | 'sales' | 'cashvan';
  urlKey: 'driver_apk_url' | 'sales_apk_url' | 'cashvan_apk_url';
  versionKey: 'driver_apk_version' | 'sales_apk_version' | 'cashvan_apk_version';
  // i18n keys — resolved at render time so the page swaps with locale change
  nameKey: TranslationKey;
  descKey: TranslationKey;
  featureKeys: TranslationKey[];
  size: string;
  icon: React.ComponentType<{ className?: string }>;
  colorFrom: string;
  colorTo: string;
}

const appTemplates: AppTemplate[] = [
  {
    id: 'driver',
    urlKey: 'driver_apk_url',
    versionKey: 'driver_apk_version',
    nameKey: 'mobileApp.driverName',
    descKey: 'mobileApp.driverDesc',
    featureKeys: [
      'mobileApp.drvFeat1',
      'mobileApp.drvFeat2',
      'mobileApp.drvFeat3',
      'mobileApp.drvFeat4',
      'mobileApp.drvFeat5',
      'mobileApp.drvFeat6',
    ],
    size: '27 MB',
    icon: TruckIcon,
    colorFrom: 'from-blue-600',
    colorTo: 'to-indigo-700',
  },
  {
    id: 'sales',
    urlKey: 'sales_apk_url',
    versionKey: 'sales_apk_version',
    nameKey: 'mobileApp.sellerName',
    descKey: 'mobileApp.sellerDesc',
    featureKeys: [
      'mobileApp.selFeat1',
      'mobileApp.selFeat2',
      'mobileApp.selFeat3',
      'mobileApp.selFeat4',
      'mobileApp.selFeat5',
      'mobileApp.selFeat6',
    ],
    size: '26 MB',
    icon: ShoppingBagIcon,
    colorFrom: 'from-emerald-600',
    colorTo: 'to-teal-700',
  },
  {
    id: 'cashvan',
    urlKey: 'cashvan_apk_url',
    versionKey: 'cashvan_apk_version',
    nameKey: 'mobileApp.cashvanName',
    descKey: 'mobileApp.cashvanDesc',
    featureKeys: [
      'mobileApp.cvFeat1',
      'mobileApp.cvFeat2',
      'mobileApp.cvFeat3',
      'mobileApp.cvFeat4',
      'mobileApp.cvFeat5',
      'mobileApp.cvFeat6',
    ],
    size: '26 MB',
    icon: TruckIcon,
    colorFrom: 'from-orange-500',
    colorTo: 'to-amber-600',
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
  const { t } = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const appName = t(template.nameKey);

  const handleUpload = async () => {
    if (!file || !version.trim()) {
      toast.error(t('mobileApp.pickFileFirst'));
      return;
    }
    if (!file.name.endsWith('.apk')) {
      toast.error(t('mobileApp.apkOnly'));
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
      toast.success(t('mobileApp.uploadSuccess'));
      onSuccess();
      setTimeout(onClose, 500);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || t('mobileApp.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200/80 dark:border-gray-700 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('mobileApp.uploadModalTitle', { name: appName })}</h3>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{t('mobileApp.uploadModalSubtitle')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('mobileApp.fileField')}</label>
            <input ref={fileRef} type="file" accept=".apk" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50/60 dark:bg-gray-900/30"
            >
              {file ? (
                <div className="text-center">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-[11px] text-gray-500 mt-1 tnum">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <ArrowUpTrayIcon className="w-7 h-7 text-gray-400 mx-auto mb-1" />
                  <p className="text-[13px] text-gray-500">{t('mobileApp.pickFile')}</p>
                </div>
              )}
            </button>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('mobileApp.versionField')}</label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder={t('mobileApp.versionPlaceholder')}
              className="input w-full"
              dir="ltr"
            />
          </div>

          {uploading && (
            <div>
              <div className="flex justify-between text-[12px] text-gray-500 dark:text-gray-400 mb-1 tnum">
                <span>{t('mobileApp.uploadingProgress')}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-700 dark:bg-gray-300 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 inline-flex items-center justify-center px-4 h-[36px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
            >
              {t('mobileApp.cancel')}
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !file || !version.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 h-[36px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowUpTrayIcon className="w-4 h-4" />
              )}
              {uploading ? t('mobileApp.uploading') : t('mobileApp.upload')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileAppPage() {
  const { t } = useLocale();
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
    toast.success(t('mobileApp.linkCopied'));
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppShare = (name: string, downloadUrl: string) => {
    const message = t('mobileApp.waMessage', { name, url: downloadUrl });
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDelete = async (template: AppTemplate) => {
    const appName = t(template.nameKey);
    if (!confirm(t('mobileApp.confirmDelete', { name: appName }))) return;
    setDeletingType(template.id);
    try {
      await dashboardApi.deleteApk(template.id);
      toast.success(t('mobileApp.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['tenant-apps'] });
    } catch {
      toast.error(t('mobileApp.deleteError'));
    } finally {
      setDeletingType(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title={t('mobileApp.pageTitle')} subtitle={t('mobileApp.pageSubtitle')} />

      {appsLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      )}

      {!appsLoading && (
        <>
          <div className="surface-pro p-3 mb-4 flex items-start gap-2">
            <span className="metric-dot metric-dot-orange mt-1.5 shrink-0" aria-hidden />
            <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong className="text-gray-900 dark:text-white">{t('mobileApp.tipLabel')}</strong> {t('mobileApp.tipText')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {appTemplates.map((template, index) => {
              const downloadUrl = appsData?.[template.urlKey];
              const version = appsData?.[template.versionKey];
              const hasApp = !!downloadUrl;
              const appName = t(template.nameKey);

              return (
                <div
                  key={template.id}
                  className="surface-pro overflow-hidden"
                  style={{ animationDelay: `${(index + 1) * 120}ms` }}
                >
                  <div className="relative px-6 py-8 flex flex-col items-center border-b border-gray-100 dark:border-gray-700">
                    <PhoneMockup icon={template.icon} colorFrom={template.colorFrom} colorTo={template.colorTo} />
                    <h2 className="mt-4 text-[16px] font-semibold text-gray-900 dark:text-white text-center">{appName}</h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                      {version && (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-gray-300">
                          <span className="metric-dot metric-dot-blue" aria-hidden />
                          v{version}
                        </span>
                      )}
                      {hasApp && (
                        <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">
                          {template.size}
                        </span>
                      )}
                      {!hasApp && (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                          <span className="metric-dot metric-dot-neutral" aria-hidden />
                          {t('mobileApp.notUploaded')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">{t(template.descKey)}</p>

                    <div className="grid grid-cols-2 gap-1.5">
                      {template.featureKeys.map((key) => (
                        <div key={key} className="flex items-start gap-1.5">
                          <CheckIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-[12px] text-gray-600 dark:text-gray-400">{t(key)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700" />

                    {hasApp ? (
                      <>
                        <div className="flex flex-col items-center gap-2 py-3 px-3 bg-gray-50/60 dark:bg-gray-900/30 rounded-md border border-gray-200/80 dark:border-gray-700">
                          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('mobileApp.qrLabel')}</p>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-md">
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
                            {t('mobileApp.qrHint')}
                          </p>
                        </div>

                        <a
                          href={downloadUrl}
                          download
                          className="inline-flex items-center justify-center gap-2 w-full px-4 h-[40px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          {t('mobileApp.downloadBtn', { size: template.size })}
                        </a>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyLink(downloadUrl, template.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-[34px] text-[12px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                          >
                            {copiedId === template.id
                              ? <><CheckIcon className="w-4 h-4" /> {t('mobileApp.copied')}</>
                              : <><LinkIcon className="w-4 h-4" /> {t('mobileApp.copyLink')}</>}
                          </button>
                          <button
                            onClick={() => handleWhatsAppShare(appName, downloadUrl)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-[34px] text-[12px] font-medium text-white bg-[#25D366] hover:bg-[#20BD5A] rounded-md transition-colors"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                            {t('mobileApp.whatsapp')}
                          </button>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => setUploadTemplate(template)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-[32px] text-[12px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                          >
                            <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                            {t('mobileApp.updateApp')}
                          </button>
                          <button
                            onClick={() => handleDelete(template)}
                            disabled={deletingType === template.id}
                            className="inline-flex items-center justify-center gap-1.5 px-3 h-[32px] text-[12px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                          >
                            {deletingType === template.id ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                            ) : (
                              <TrashIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center mx-auto mb-3">
                          <ArrowUpTrayIcon className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-3">{t('mobileApp.notUploadedYet')}</p>
                        <button
                          onClick={() => setUploadTemplate(template)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 h-[40px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors"
                        >
                          <ArrowUpTrayIcon className="w-4 h-4" />
                          {t('mobileApp.uploadApk')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              {t('mobileApp.compatNote')}
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
