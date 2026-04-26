'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApksApi } from '@/lib/admin-api';
import toast from 'react-hot-toast';

interface ApksData {
  driver_apk_url: string | null;
  driver_apk_version: string | null;
  sales_apk_url: string | null;
  sales_apk_version: string | null;
  cashvan_apk_url: string | null;
  cashvan_apk_version: string | null;
}

const APK_TYPES = [
  {
    type: 'driver',
    urlKey: 'driver_apk_url' as const,
    versionKey: 'driver_apk_version' as const,
    name: 'تطبيق السائق',
    subtitle: 'Driver App',
    description: 'تطبيق التوصيل وتتبع الطلبات والمدفوعات للسائقين',
    colorFrom: 'from-blue-600',
    colorTo: 'to-indigo-700',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    type: 'sales',
    urlKey: 'sales_apk_url' as const,
    versionKey: 'sales_apk_version' as const,
    name: 'تطبيق البائع',
    subtitle: 'Sales App',
    description: 'تطبيق البيع المتنقل وإدارة الجولات والعملاء',
    colorFrom: 'from-emerald-600',
    colorTo: 'to-teal-700',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    type: 'cashvan',
    urlKey: 'cashvan_apk_url' as const,
    versionKey: 'cashvan_apk_version' as const,
    name: 'تطبيق CashVan',
    subtitle: 'CashVan App',
    description: 'تطبيق البيع والتوصيل المباشر من الشاحنة',
    colorFrom: 'from-orange-500',
    colorTo: 'to-amber-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
];

export default function ApksPage() {
  const queryClient = useQueryClient();
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ type: string; file: File } | null>(null);
  const [versionInput, setVersionInput] = useState('');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: apks, isLoading } = useQuery<ApksData>({
    queryKey: ['admin-apks'],
    queryFn: async () => {
      const res = await adminApksApi.getAll();
      return res.data;
    },
  });

  const handleFileSelect = (type: string, file: File) => {
    setPendingFile({ type, file });
    setVersionInput('');
  };

  const handleUpload = async () => {
    if (!pendingFile || !versionInput.trim()) return;

    setUploadingType(pendingFile.type);
    setPendingFile(null);
    try {
      await adminApksApi.upload(pendingFile.file, pendingFile.type, versionInput.trim());
      queryClient.invalidateQueries({ queryKey: ['admin-apks'] });
      toast.success('تم رفع الملف بنجاح');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل رفع الملف');
    } finally {
      setUploadingType(null);
      setVersionInput('');
    }
  };

  const handleDelete = async (type: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    setDeletingType(type);
    try {
      await adminApksApi.delete(type);
      queryClient.invalidateQueries({ queryKey: ['admin-apks'] });
      toast.success('تم حذف الملف بنجاح');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل حذف الملف');
    } finally {
      setDeletingType(null);
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
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة تطبيقات الموبايل</h1>
        <p className="text-sm text-gray-500 mt-1">
          ارفع ملفات APK لتطبيقات الموبايل. سيتم تخزينها على Google Cloud Storage وإتاحتها للمستأجرين.
        </p>
      </div>

      {/* APK Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {APK_TYPES.map((apk) => {
          const currentUrl = apks?.[apk.urlKey] ?? null;
          const currentVersion = apks?.[apk.versionKey] ?? null;
          const isUploading = uploadingType === apk.type;
          const isDeleting = deletingType === apk.type;
          const isPending = pendingFile?.type === apk.type;
          const filename = currentUrl ? decodeURIComponent(currentUrl.split('/').pop() || '') : null;

          return (
            <div key={apk.type} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Card header */}
              <div className={`bg-gradient-to-br ${apk.colorFrom} ${apk.colorTo} px-5 py-6 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-[0.06]" style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }} />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
                    {apk.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{apk.name}</h3>
                    <p className="text-sm text-white/70">{apk.subtitle}</p>
                  </div>
                </div>
                {/* Version badge */}
                {currentVersion && (
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/20">
                      v{currentVersion}
                    </span>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">{apk.description}</p>

                {/* Status */}
                {isUploading ? (
                  <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
                    <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-700">جاري الرفع...</span>
                  </div>
                ) : isDeleting ? (
                  <div className="flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3">
                    <svg className="animate-spin w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm font-medium text-red-700">جاري الحذف...</span>
                  </div>
                ) : isPending ? (
                  <div className="bg-amber-50 rounded-xl px-4 py-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <span className="text-sm font-medium text-amber-700">ملف جاهز للرفع</span>
                    </div>
                    <p className="text-xs text-amber-600 truncate" dir="ltr">
                      {pendingFile.file.name}
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-amber-700 mb-1">رقم الإصدار *</label>
                      <input
                        type="text"
                        value={versionInput}
                        onChange={(e) => setVersionInput(e.target.value)}
                        placeholder="مثال: 1.0.0"
                        dir="ltr"
                        className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpload(); }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpload}
                        disabled={!versionInput.trim()}
                        className="flex-1 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        تأكيد الرفع
                      </button>
                      <button
                        onClick={() => { setPendingFile(null); setVersionInput(''); }}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : currentUrl ? (
                  <div className="bg-green-50 rounded-xl px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-700">ملف مرفوع</span>
                      </div>
                      {currentVersion && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          v{currentVersion}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-green-600 truncate" dir="ltr" title={filename || ''}>
                      {filename}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">لم يتم رفع ملف بعد</span>
                  </div>
                )}

                {/* Actions */}
                {!isPending && (
                  <div className="flex gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                      currentUrl
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : `bg-gradient-to-l ${apk.colorFrom} ${apk.colorTo} text-white hover:opacity-90`
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      {currentUrl ? 'استبدال الملف' : 'رفع ملف APK'}
                      <input
                        ref={(el) => { fileInputRefs.current[apk.type] = el; }}
                        type="file"
                        accept=".apk"
                        className="hidden"
                        disabled={isUploading || isDeleting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(apk.type, file);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {currentUrl && (
                      <button
                        onClick={() => handleDelete(apk.type)}
                        disabled={isUploading || isDeleting}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-700">معلومات</p>
            <p className="text-xs text-gray-500 mt-1">
              يتم تخزين الملفات على Google Cloud Storage. بعد الرفع، ستظهر روابط التحميل تلقائياً في صفحة تطبيقات الموبايل لدى المستأجرين.
              أدخل رقم الإصدار عند رفع كل ملف لتتبع الإصدارات وتفادي التعارض.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
