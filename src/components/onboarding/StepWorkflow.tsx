'use client';

interface StepWorkflowProps {
  lang: 'ar' | 'fr';
}

const t = {
  ar: {
    title: 'كيف يعمل النظام؟',
    subtitle: 'نظام تراكسيرا يتبع 4 خطوات بسيطة لإدارة عمليات التوزيع',
    steps: [
      {
        num: '1',
        title: 'إنشاء الطلب',
        desc: 'البائع يسجل طلبات العملاء من التطبيق أو من لوحة التحكم',
        color: '#3b82f6',
        bg: '#eff6ff',
      },
      {
        num: '2',
        title: 'تحضير وإرسال',
        desc: 'المدير يراجع الطلبات ويعيّنها للسائقين في جولات توصيل',
        color: '#f59e0b',
        bg: '#fffbeb',
      },
      {
        num: '3',
        title: 'توصيل وتحصيل',
        desc: 'السائق يوصل الطلبات ويحصّل المبالغ مع تتبع GPS مباشر',
        color: '#10b981',
        bg: '#ecfdf5',
      },
      {
        num: '4',
        title: 'تقارير فورية',
        desc: 'لوحة تحكم شاملة بكل العمليات: مبيعات، مخزون، ديون وأرباح',
        color: '#8b5cf6',
        bg: '#f5f3ff',
      },
    ],
  },
  fr: {
    title: 'Comment ça marche ?',
    subtitle: 'TrackSera suit 4 étapes simples pour gérer vos opérations de distribution',
    steps: [
      {
        num: '1',
        title: 'Créer la commande',
        desc: "Le vendeur enregistre les commandes clients depuis l'app ou le tableau de bord",
        color: '#3b82f6',
        bg: '#eff6ff',
      },
      {
        num: '2',
        title: 'Préparer et envoyer',
        desc: 'Le manager valide les commandes et les assigne aux livreurs en tournées',
        color: '#f59e0b',
        bg: '#fffbeb',
      },
      {
        num: '3',
        title: 'Livrer et encaisser',
        desc: 'Le livreur livre les commandes et encaisse les paiements avec suivi GPS',
        color: '#10b981',
        bg: '#ecfdf5',
      },
      {
        num: '4',
        title: 'Rapports en temps réel',
        desc: 'Tableau de bord complet : ventes, stock, dettes et bénéfices',
        color: '#8b5cf6',
        bg: '#f5f3ff',
      },
    ],
  },
};

export default function StepWorkflow({ lang }: StepWorkflowProps) {
  const i = t[lang];

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="mx-auto w-20 h-20 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{i.title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">{i.subtitle}</p>

      {/* Workflow steps */}
      <div className="max-w-md mx-auto space-y-4">
        {i.steps.map((step, idx) => (
          <div key={step.num} className="relative">
            {/* Connector line */}
            {idx < i.steps.length - 1 && (
              <div className="absolute top-14 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" style={{ [lang === 'ar' ? 'right' : 'left']: '1.75rem' }} />
            )}
            <div className="relative flex items-start gap-4">
              {/* Number circle */}
              <div
                className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ background: step.bg, color: step.color }}
              >
                {step.num}
              </div>
              {/* Content */}
              <div className="text-start pt-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
