'use client';

interface StepDoneProps {
  lang: 'ar' | 'fr';
}

const t = {
  ar: {
    title: 'تم الإعداد بنجاح!',
    subtitle: 'نظامك جاهز للاستخدام. يمكنك الآن البدء في إدارة عمليات التوزيع.',
    tips_title: 'خطواتك القادمة:',
    tips: [
      'أضف المزيد من المنتجات والعملاء',
      'أنشئ أول طلبية وجرّب دورة التوصيل',
      'حمّل تطبيق البائع والسائق من صفحة التطبيقات',
      'خصّص إعدادات الشركة والفواتير',
    ],
  },
  fr: {
    title: 'Configuration terminée !',
    subtitle: 'Votre système est prêt. Vous pouvez maintenant gérer vos opérations de distribution.',
    tips_title: 'Prochaines étapes :',
    tips: [
      'Ajoutez plus de produits et clients',
      'Créez votre première commande et testez le cycle de livraison',
      "Téléchargez les apps vendeur et livreur depuis la page applications",
      'Personnalisez les paramètres et factures',
    ],
  },
};

export default function StepDone({ lang }: StepDoneProps) {
  const i = t[lang];

  return (
    <div className="text-center">
      {/* Celebration icon */}
      <div className="mx-auto w-24 h-24 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-6 relative">
        <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
        {/* Decorative sparkles */}
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 opacity-80" />
        <div className="absolute -bottom-1 -left-2 w-3 h-3 rounded-full bg-blue-400 opacity-80" />
        <div className="absolute top-0 -left-3 w-2 h-2 rounded-full bg-violet-400 opacity-80" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{i.title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">{i.subtitle}</p>

      {/* Next steps */}
      <div className="text-start max-w-md mx-auto p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">{i.tips_title}</h3>
        <ul className="space-y-2.5">
          {i.tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">
                {idx + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
