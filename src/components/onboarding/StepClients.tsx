'use client';

import { useState } from 'react';
import { clientsApi } from '@/lib/api';

interface StepClientsProps {
  lang: 'ar' | 'fr';
  hasClients: boolean;
  onRefresh: () => void;
}

const t = {
  ar: {
    title: 'أضف عملاءك',
    desc: 'أضف عملاءك لبدء تسجيل الطلبات والمبيعات وتتبع الديون.',
    already: 'لديك عملاء بالفعل! يمكنك المتابعة.',
    tip_title: 'نصيحة',
    tip_desc: 'يمكنك إضافة فئات عملاء مختلفة (جملة، تجزئة...) مع أسعار مخصصة لكل فئة.',
    open_clients: 'فتح صفحة العملاء',
    refresh: 'أضفت عملاء؟ تحقق',
    checking: 'جاري التحقق...',
    found: 'تم العثور على عملاء!',
    not_found: 'لم يتم العثور على عملاء بعد',
  },
  fr: {
    title: 'Ajoutez vos clients',
    desc: 'Ajoutez vos clients pour enregistrer les commandes, ventes et suivre les dettes.',
    already: 'Vous avez déjà des clients ! Vous pouvez continuer.',
    tip_title: 'Conseil',
    tip_desc: 'Vous pouvez créer des catégories clients (gros, détail...) avec des prix personnalisés.',
    open_clients: 'Ouvrir la page clients',
    refresh: 'Clients ajoutés ? Vérifier',
    checking: 'Vérification...',
    found: 'Clients trouvés !',
    not_found: 'Aucun client trouvé',
  },
};

export default function StepClients({ lang, hasClients, onRefresh }: StepClientsProps) {
  const i = t[lang];
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'found' | 'not_found' | null>(null);

  const handleRefresh = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await clientsApi.getAll({ per_page: 1 });
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

  if (hasClients) {
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
      <div className="mx-auto w-20 h-20 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{i.title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">{i.desc}</p>

      {/* Tip box */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-start mb-8 max-w-md mx-auto">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <div>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">{i.tip_title}</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">{i.tip_desc}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3 max-w-md mx-auto">
        <button
          onClick={() => window.open('/dashboard/clients', '_blank')}
          className="btn btn-primary w-full"
        >
          <svg className="w-5 h-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          {i.open_clients}
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
