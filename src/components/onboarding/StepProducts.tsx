'use client';

import { useState } from 'react';
import { productsApi } from '@/lib/api';

interface StepProductsProps {
  lang: 'ar' | 'fr';
  hasProducts: boolean;
  onRefresh: () => void;
}

const t = {
  ar: {
    title: 'أضف منتجاتك',
    desc: 'المنتجات هي أساس نظام التوزيع. أضف منتجاتك لتبدأ في إدارة المخزون والمبيعات.',
    already: 'لديك منتجات بالفعل! يمكنك المتابعة.',
    option1_title: 'إضافة يدوية',
    option1_desc: 'أضف المنتجات واحدا تلو الآخر من صفحة المنتجات',
    option2_title: 'استيراد من Excel',
    option2_desc: 'استورد قائمة كاملة من ملف Excel دفعة واحدة',
    open_products: 'فتح صفحة المنتجات',
    refresh: 'أضفت منتجات؟ تحقق',
    checking: 'جاري التحقق...',
    found: 'تم العثور على منتجات!',
    not_found: 'لم يتم العثور على منتجات بعد',
  },
  fr: {
    title: 'Ajoutez vos produits',
    desc: "Les produits sont la base du système. Ajoutez-les pour gérer le stock et les ventes.",
    already: 'Vous avez déjà des produits ! Vous pouvez continuer.',
    option1_title: 'Ajout manuel',
    option1_desc: 'Ajoutez les produits un par un depuis la page produits',
    option2_title: 'Import Excel',
    option2_desc: 'Importez une liste complète depuis un fichier Excel',
    open_products: 'Ouvrir la page produits',
    refresh: 'Produits ajoutés ? Vérifier',
    checking: 'Vérification...',
    found: 'Produits trouvés !',
    not_found: 'Aucun produit trouvé',
  },
};

export default function StepProducts({ lang, hasProducts, onRefresh }: StepProductsProps) {
  const i = t[lang];
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'found' | 'not_found' | null>(null);

  const handleRefresh = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await productsApi.getAll({ per_page: 1 });
      const total = res.data?.total ?? res.data?.data?.length ?? 0;
      if (total > 0) {
        setCheckResult('found');
        onRefresh();
      } else {
        setCheckResult('not_found');
      }
    } catch {
      setCheckResult('not_found');
    } finally {
      setChecking(false);
    }
  };

  if (hasProducts) {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{i.already}</h2>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{i.title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">{i.desc}</p>

      {/* Two options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
        <div className="p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-start">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{i.option1_title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{i.option1_desc}</p>
        </div>
        <div className="p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-start">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{i.option2_title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{i.option2_desc}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3 max-w-md mx-auto">
        <button
          onClick={() => window.open('/dashboard/products', '_blank')}
          className="btn btn-primary w-full"
        >
          <svg className="w-5 h-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          {i.open_products}
        </button>
        <button
          onClick={handleRefresh}
          disabled={checking}
          className="btn w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {checking ? (
            <>
              <div className="spinner w-4 h-4 me-2"></div>
              {i.checking}
            </>
          ) : (
            <>
              <svg className="w-5 h-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {i.refresh}
            </>
          )}
        </button>
        {checkResult && (
          <p className={`text-sm font-medium ${checkResult === 'found' ? 'text-green-600' : 'text-amber-600'}`}>
            {checkResult === 'found' ? i.found : i.not_found}
          </p>
        )}
      </div>
    </div>
  );
}
