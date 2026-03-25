'use client';

interface StepWelcomeProps {
  lang: 'ar' | 'fr';
  companyData: { company_name: string; company_phone: string; company_address: string };
  onUpdate: (data: { company_name: string; company_phone: string; company_address: string }) => void;
}

const t = {
  ar: {
    title: 'مرحبا بك في تراكسيرا!',
    subtitle: 'دعنا نساعدك في إعداد نظامك في بضع خطوات بسيطة',
    company_name: 'اسم الشركة',
    company_name_placeholder: 'مثال: شركة النور للتوزيع',
    company_phone: 'رقم الهاتف',
    company_phone_placeholder: '0555 00 00 00',
    company_address: 'العنوان',
    company_address_placeholder: 'مثال: الجزائر، باب الزوار',
    required: 'مطلوب',
  },
  fr: {
    title: 'Bienvenue sur TrackSera !',
    subtitle: 'Configurons votre système en quelques étapes simples',
    company_name: "Nom de l'entreprise",
    company_name_placeholder: 'Ex: Distribution El Nour',
    company_phone: 'Téléphone',
    company_phone_placeholder: '0555 00 00 00',
    company_address: 'Adresse',
    company_address_placeholder: 'Ex: Alger, Bab Ezzouar',
    required: 'Requis',
  },
};

export default function StepWelcome({ lang, companyData, onUpdate }: StepWelcomeProps) {
  const i = t[lang];

  return (
    <div className="text-center">
      {/* Logo / Icon */}
      <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{i.title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{i.subtitle}</p>

      {/* Company info form */}
      <div className="text-start space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {i.company_name} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder={i.company_name_placeholder}
            value={companyData.company_name}
            onChange={(e) => onUpdate({ ...companyData, company_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {i.company_phone}
          </label>
          <input
            type="tel"
            className="input"
            placeholder={i.company_phone_placeholder}
            value={companyData.company_phone}
            onChange={(e) => onUpdate({ ...companyData, company_phone: e.target.value })}
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {i.company_address}
          </label>
          <input
            type="text"
            className="input"
            placeholder={i.company_address_placeholder}
            value={companyData.company_address}
            onChange={(e) => onUpdate({ ...companyData, company_address: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
