'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import SiteFooter from '@/components/SiteFooter';
import { isPaddleConfigured, openPaddleCheckout, type PaddlePriceKey } from '@/lib/paddle';

/* ───────── data ───────── */

const UI = {
  ar: {
    badge: 'الأسعار',
    title: 'أسعار بسيطة وشفافة',
    subtitle: 'ابدأ مجاناً لمدة 14 يوم. بدون بطاقة ائتمان. ألغِ في أي وقت.',
    currency: '/ شهر',
    free: 'مجاناً',
    custom: 'حسب الطلب',
    popular: 'الأكثر شيوعاً',
    ctaFree: 'ابدأ التجربة المجانية',
    ctaPaid: 'اشترك الآن',
    ctaContact: 'اتصل بنا',
    allIncludeTitle: 'ما هو مُضمَّن في كل خطة',
    allIncludeSub: 'بغضّ النظر عن الخطة التي تختارها، كل عملائنا يستفيدون من:',
    compareTitle: 'مقارنة تفصيلية بين الخطط',
    compareSub: 'كل ما تحتاج معرفته لاختيار الخطة المناسبة',
    enterpriseTitle: 'تحتاج كل قوة TrackSera؟',
    enterpriseSub:
      'خطة الأعمال تمنحك منتجات ومستخدمين بلا حدود، البيع المتنقل، المستودعات المتعددة، التطبيقات الكاملة والتكاملات المخصصة — تواصل معنا للحصول على عرض مفصّل.',
    faqTitle: 'أسئلة شائعة حول الأسعار',
    backHome: 'العودة للرئيسية',
  },
  fr: {
    badge: 'TARIFS',
    title: 'Des tarifs simples et transparents',
    subtitle: "Commencez gratuitement pendant 14 jours. Sans carte bancaire. Annulez à tout moment.",
    currency: '/ mois',
    free: 'Gratuit',
    custom: 'Sur devis',
    popular: 'Le plus choisi',
    ctaFree: "Démarrer l'essai gratuit",
    ctaPaid: "S'abonner",
    ctaContact: 'Nous contacter',
    allIncludeTitle: 'Inclus dans toutes les formules',
    allIncludeSub: "Peu importe la formule choisie, tous nos clients bénéficient de :",
    compareTitle: 'Comparaison détaillée des formules',
    compareSub: 'Tout ce qu\'il faut savoir pour choisir la bonne formule',
    enterpriseTitle: "Besoin de toute la puissance de TrackSera ?",
    enterpriseSub:
      "La formule Business vous offre produits et utilisateurs illimités, vente mobile, multi-entrepôts, applications complètes et intégrations sur mesure — contactez-nous pour une offre adaptée.",
    faqTitle: 'Questions fréquentes sur les tarifs',
    backHome: "Retour à l'accueil",
  },
  en: {
    badge: 'PRICING',
    title: 'Simple, transparent pricing',
    subtitle: 'Start free for 14 days. No credit card. Cancel anytime.',
    currency: '/mo',
    free: 'Free',
    custom: 'Custom',
    popular: 'Most popular',
    ctaFree: 'Start free trial',
    ctaPaid: 'Subscribe',
    ctaContact: 'Contact us',
    allIncludeTitle: "What's included in every plan",
    allIncludeSub: 'Whichever plan you choose, all our customers benefit from:',
    compareTitle: 'Detailed plan comparison',
    compareSub: 'Everything you need to know to pick the right plan',
    enterpriseTitle: 'Need the full power of TrackSera?',
    enterpriseSub:
      'The Business plan gives you unlimited products and users, mobile sales, multi-warehouse, full apps and custom integrations — get in touch for a tailored quote.',
    faqTitle: 'Frequently asked questions about pricing',
    backHome: 'Back to home',
  },
};

// Plans: Free, Starter (4 500 DZD/mo), Business (contact us — unlimited).
// priceText is the numeric price as a display string (DZD); null = Free.
// contact:true renders "Sur devis" and a contact CTA.
const plansData = {
  ar: [
    {
      id: 'free',
      name: 'مجاني',
      subtitle: 'للتجربة',
      priceText: null as string | null,
      contact: false,
      popular: false,
      description: 'جرّب كل الميزات الأساسية لمدة 14 يوم.',
      features: [
        'حتى 25 منتج',
        'مستخدم واحد',
        'إدارة الطلبات والتوصيل',
        'فوترة احترافية (PDF)',
        'تقارير أساسية',
        'دعم عبر البريد',
      ],
    },
    {
      id: 'starter',
      name: 'المبتدئ',
      subtitle: 'للمحلات والموزعين الصغار',
      priceText: '4 500',
      contact: false,
      popular: true,
      description: 'كل ما تحتاجه لإدارة نشاطك اليومي.',
      features: [
        'حتى 500 منتج',
        'حتى 3 مستخدمين',
        'إدارة الطلبات والمبيعات',
        'إدارة العملاء والموردين',
        'إدارة الصندوق (POS)',
        'التوصيل وتتبع GPS',
        'تقارير المبيعات والديون',
        'دعم بالبريد والهاتف',
      ],
    },
    {
      id: 'business',
      name: 'الأعمال',
      subtitle: 'بلا حدود',
      priceText: null,
      contact: true,
      popular: false,
      description: 'كامل قوة TrackSera بدون أي حدود.',
      features: [
        'منتجات غير محدودة',
        'مستخدمون غير محدودون',
        'كل ميزات المبتدئ',
        'البيع المتنقل (Cashvan)',
        'مستودعات متعددة',
        'تطبيقات موبايل كاملة',
        'تكاملات مخصصة',
        'أولوية الدعم وتدريب مخصص',
      ],
    },
  ],
  fr: [
    {
      id: 'free',
      name: 'Gratuit',
      subtitle: 'Pour essayer',
      priceText: null as string | null,
      contact: false,
      popular: false,
      description: 'Essayez toutes les fonctions de base pendant 14 jours.',
      features: [
        "Jusqu'à 25 produits",
        '1 utilisateur',
        'Commandes & livraison',
        'Facturation PDF professionnelle',
        'Rapports de base',
        'Support par email',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'Commerces & petits distributeurs',
      priceText: '4 500',
      contact: false,
      popular: true,
      description: 'Tout ce qu’il faut pour gérer votre activité au quotidien.',
      features: [
        "Jusqu'à 500 produits",
        "Jusqu'à 3 utilisateurs",
        'Commandes & ventes',
        'Clients & fournisseurs',
        'Caisse (POS)',
        'Livraison & suivi GPS',
        'Rapports ventes & dettes',
        'Support email & téléphone',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      subtitle: 'Sans limite',
      priceText: null,
      contact: true,
      popular: false,
      description: 'Toute la puissance de TrackSera, sans aucune limite.',
      features: [
        'Produits illimités',
        'Utilisateurs illimités',
        'Toutes les fonctions Starter',
        'Vente mobile (Cashvan)',
        'Multi-entrepôts',
        'Applications mobiles complètes',
        'Intégrations sur mesure',
        'Support prioritaire & formation dédiée',
      ],
    },
  ],
  en: [
    {
      id: 'free',
      name: 'Free',
      subtitle: 'To try it out',
      priceText: null as string | null,
      contact: false,
      popular: false,
      description: 'Try all the core features for 14 days.',
      features: [
        'Up to 25 products',
        '1 user',
        'Orders & delivery',
        'Professional PDF invoicing',
        'Basic reports',
        'Email support',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'Shops & small distributors',
      priceText: '4 500',
      contact: false,
      popular: true,
      description: 'Everything you need to run your daily business.',
      features: [
        'Up to 500 products',
        'Up to 3 users',
        'Orders & sales',
        'Customers & suppliers',
        'Cash register (POS)',
        'Delivery & GPS tracking',
        'Sales & debt reports',
        'Email & phone support',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      subtitle: 'No limits',
      priceText: null,
      contact: true,
      popular: false,
      description: 'The full power of TrackSera with no limits.',
      features: [
        'Unlimited products',
        'Unlimited users',
        'All Starter features',
        'Mobile sales (CashVan)',
        'Multi-warehouse',
        'Full mobile apps',
        'Custom integrations',
        'Priority support & dedicated training',
      ],
    },
  ],
};

const allPlansInclude = {
  ar: [
    'استضافة سحابية آمنة 24/7',
    'نسخ احتياطية يومية تلقائية',
    'تحديثات مجانية مدى الحياة',
    'واجهة بالعربية والفرنسية',
    'تصدير البيانات في أي وقت',
    'SSL وتشفير البيانات',
    'بدون رسوم إعداد أو تثبيت',
  ],
  fr: [
    'Hébergement cloud sécurisé 24/7',
    'Sauvegardes quotidiennes automatiques',
    'Mises à jour gratuites à vie',
    'Interface en arabe et en français',
    'Export des données à tout moment',
    'SSL & chiffrement des données',
    'Aucun frais d\'installation',
  ],
  en: [
    'Secure 24/7 cloud hosting',
    'Automatic daily backups',
    'Free lifetime updates',
    'Arabic and French interface',
    'Export your data anytime',
    'SSL & data encryption',
    'No setup or installation fees',
  ],
};

const compareRows = {
  ar: [
    { label: 'عدد المنتجات', values: ['25', '500', 'غير محدود'] },
    { label: 'عدد المستخدمين', values: ['1', '3', 'غير محدود'] },
    { label: 'إدارة الطلبات والتوصيل', values: ['✓', '✓', '✓'] },
    { label: 'فوترة PDF', values: ['✓', '✓', '✓'] },
    { label: 'إدارة العملاء والموردين', values: ['✓', '✓', '✓'] },
    { label: 'إدارة الصندوق (POS)', values: ['—', '✓', '✓'] },
    { label: 'تتبع GPS للسائقين', values: ['—', '✓', '✓'] },
    { label: 'مستودعات متعددة', values: ['—', '—', '✓'] },
    { label: 'البيع المتنقل (Cashvan)', values: ['—', '—', '✓'] },
    { label: 'تطبيقات موبايل كاملة', values: ['—', '—', '✓'] },
    { label: 'تكاملات مخصصة', values: ['—', '—', '✓'] },
    { label: 'أولوية الدعم', values: ['—', '—', '✓'] },
  ],
  fr: [
    { label: 'Nombre de produits', values: ['25', '500', 'Illimité'] },
    { label: "Nombre d'utilisateurs", values: ['1', '3', 'Illimité'] },
    { label: 'Commandes & livraison', values: ['✓', '✓', '✓'] },
    { label: 'Facturation PDF', values: ['✓', '✓', '✓'] },
    { label: 'Clients & fournisseurs', values: ['✓', '✓', '✓'] },
    { label: 'Caisse (POS)', values: ['—', '✓', '✓'] },
    { label: 'Suivi GPS des livreurs', values: ['—', '✓', '✓'] },
    { label: 'Multi-entrepôts', values: ['—', '—', '✓'] },
    { label: 'Vente mobile (Cashvan)', values: ['—', '—', '✓'] },
    { label: 'Applications mobiles complètes', values: ['—', '—', '✓'] },
    { label: 'Intégrations sur mesure', values: ['—', '—', '✓'] },
    { label: 'Support prioritaire', values: ['—', '—', '✓'] },
  ],
  en: [
    { label: 'Number of products', values: ['25', '500', 'Unlimited'] },
    { label: 'Number of users', values: ['1', '3', 'Unlimited'] },
    { label: 'Orders & delivery', values: ['✓', '✓', '✓'] },
    { label: 'PDF invoicing', values: ['✓', '✓', '✓'] },
    { label: 'Customers & suppliers', values: ['✓', '✓', '✓'] },
    { label: 'Cash register (POS)', values: ['—', '✓', '✓'] },
    { label: 'Driver GPS tracking', values: ['—', '✓', '✓'] },
    { label: 'Multi-warehouse', values: ['—', '—', '✓'] },
    { label: 'Mobile sales (CashVan)', values: ['—', '—', '✓'] },
    { label: 'Full mobile apps', values: ['—', '—', '✓'] },
    { label: 'Custom integrations', values: ['—', '—', '✓'] },
    { label: 'Priority support', values: ['—', '—', '✓'] },
  ],
};

const faqData = {
  ar: [
    {
      q: 'هل يمكنني تجربة TrackSera قبل الاشتراك؟',
      a: 'نعم، تجربة مجانية كاملة لمدة 14 يوم بدون بطاقة ائتمان. لديك الوصول الكامل لكل الميزات خلال فترة التجربة.',
    },
    {
      q: 'كيف يمكنني الدفع؟',
      a: 'الدفع بالبطاقة البنكية، CCP أو بريدي موب (BaridiMob). تتم الفوترة شهرياً أو سنوياً، ويمكنك تغيير وسيلة الدفع في أي وقت.',
    },
    {
      q: 'هل الأسعار تشمل الضرائب؟',
      a: 'الأسعار معروضة بالدينار الجزائري (DZD) شاملةً كل الرسوم. بدون أي رسوم خفية أو رسوم إعداد.',
    },
    {
      q: 'هل يمكنني تغيير خطتي لاحقاً؟',
      a: 'بكل تأكيد. يمكنك الترقية أو التخفيض في أي وقت من لوحة التحكم. التعديل يسري من الشهر التالي.',
    },
    {
      q: 'ماذا يحدث عند انتهاء التجربة المجانية؟',
      a: 'إذا لم تختر خطة مدفوعة، يبقى حسابك بصلاحيات محدودة (فقط الاطلاع). بياناتك تبقى محفوظة لمدة 30 يوم إضافية.',
    },
    {
      q: 'هل يوجد خصم للاشتراك السنوي؟',
      a: 'نعم، الاشتراك السنوي يمنحك خصم 15% على السعر الشهري. تواصل معنا للتفاصيل.',
    },
    {
      q: 'هل بياناتي آمنة؟',
      a: 'نعم. نستخدم تشفير SSL، نسخ احتياطية يومية على خوادم متعددة، ونسخة احتياطية أسبوعية خارج الموقع. بياناتك ملكك وتستطيع تصديرها في أي وقت.',
    },
    {
      q: 'هل يوجد دعم فني بالعربية؟',
      a: 'نعم، فريق الدعم الفني كامل بالعربية والفرنسية، عبر البريد، الهاتف، والواتساب.',
    },
  ],
  fr: [
    {
      q: 'Puis-je essayer TrackSera avant de payer ?',
      a: "Oui, un essai gratuit complet de 14 jours sans carte bancaire. Vous avez accès à toutes les fonctionnalités pendant la période d'essai.",
    },
    {
      q: 'Comment puis-je payer ?',
      a: "Paiement par carte bancaire, CCP ou BaridiMob. La facturation est mensuelle ou annuelle, et vous pouvez changer de moyen de paiement à tout moment.",
    },
    {
      q: 'Les prix incluent-ils les taxes ?',
      a: "Les prix sont affichés en dinar algérien (DZD), toutes taxes comprises. Aucun frais caché ni frais d'installation.",
    },
    {
      q: 'Puis-je changer de formule plus tard ?',
      a: "Bien sûr. Vous pouvez passer à une formule supérieure ou inférieure à tout moment depuis votre tableau de bord. Le changement prend effet le mois suivant.",
    },
    {
      q: "Que se passe-t-il à la fin de l'essai gratuit ?",
      a: "Si vous ne choisissez pas de formule payante, votre compte passe en lecture seule. Vos données restent conservées pendant 30 jours supplémentaires.",
    },
    {
      q: 'Y a-t-il une remise pour un abonnement annuel ?',
      a: 'Oui, un abonnement annuel vous donne droit à 15% de remise sur le tarif mensuel. Contactez-nous pour les détails.',
    },
    {
      q: 'Mes données sont-elles en sécurité ?',
      a: "Oui. Nous utilisons un chiffrement SSL, des sauvegardes quotidiennes sur plusieurs serveurs et une sauvegarde hebdomadaire hors-site. Vos données vous appartiennent et peuvent être exportées à tout moment.",
    },
    {
      q: 'Y a-t-il un support en arabe ?',
      a: "Oui, notre équipe de support répond intégralement en arabe et en français par email, téléphone et WhatsApp.",
    },
  ],
  en: [
    {
      q: 'Can I try TrackSera before subscribing?',
      a: 'Yes, a full 14-day free trial with no credit card required. You get complete access to every feature during the trial period.',
    },
    {
      q: 'How can I pay?',
      a: 'Pay by bank card, CCP or BaridiMob. Billing is monthly or yearly, and you can change your payment method at any time.',
    },
    {
      q: 'Do prices include taxes?',
      a: 'Prices are shown in Algerian dinar (DZD), all taxes included. No hidden fees and no setup fees.',
    },
    {
      q: 'Can I change my plan later?',
      a: 'Absolutely. You can upgrade or downgrade at any time from your dashboard. The change takes effect the following month.',
    },
    {
      q: 'What happens when the free trial ends?',
      a: 'If you do not pick a paid plan, your account switches to read-only access. Your data is kept for an additional 30 days.',
    },
    {
      q: 'Is there a discount for annual billing?',
      a: 'Yes, an annual subscription gives you a 15% discount off the monthly rate. Contact us for the details.',
    },
    {
      q: 'Is my data safe?',
      a: 'Yes. We use SSL encryption, daily backups across multiple servers, and a weekly off-site backup. Your data belongs to you and can be exported at any time.',
    },
    {
      q: 'Is support available in Arabic?',
      a: 'Yes, our support team replies fully in Arabic and French via email, phone, and WhatsApp.',
    },
  ],
};

/* ───────── component ───────── */

export default function TarifsClient() {
  const { locale } = useLocale();
  const ui = UI[locale];
  const plans = plansData[locale];
  const includes = allPlansInclude[locale];
  const rows = compareRows[locale];
  const faqs = faqData[locale];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[60px]">
            <Link href="/" className="flex items-center gap-2">
              <img src="/t.png" alt="TrackSera" className="w-7 h-7" />
              <span className="text-[15px] font-bold text-gray-900 tracking-[-0.01em]">TrackSera</span>
            </Link>
            <div className="hidden md:flex items-center gap-7 text-[13px] text-gray-600">
              <Link href="/#modules" className="hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الوحدات' : locale === 'en' ? 'Modules' : 'Modules'}
              </Link>
              <Link href="/logiciel-de-distribution" className="hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'برنامج التوزيع' : locale === 'en' ? 'Distribution software' : 'Logiciel de distribution'}
              </Link>
              <Link href="/tarifs" className="text-gray-900 font-medium">
                {locale === 'ar' ? 'الأسعار' : locale === 'en' ? 'Pricing' : 'Tarifs'}
              </Link>
              <Link href="/blog" className="hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'المدونة' : locale === 'en' ? 'Blog' : 'Blog'}
              </Link>
              <Link href="/#contact" className="hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'تواصل' : locale === 'en' ? 'Contact' : 'Contact'}
              </Link>
            </div>
            <Link
              href="/register"
              className="text-[13px] font-medium px-3.5 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              {locale === 'ar' ? 'ابدأ مجاناً' : locale === 'en' ? 'Free trial' : 'Essai gratuit'}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-gray-100">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #000 0 1px, transparent 1px 18px), repeating-linear-gradient(-45deg, #000 0 1px, transparent 1px 18px)',
          }}
        />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-28 text-center">
          <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">{ui.badge}</p>
          <h1 className="text-[34px] sm:text-[48px] font-bold tracking-[-0.025em] text-gray-900 max-w-[720px] mx-auto leading-[1.1]">
            {ui.title}
          </h1>
          <p className="mt-5 text-[17px] text-gray-500 max-w-[580px] mx-auto leading-relaxed">{ui.subtitle}</p>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col p-7 ${plan.popular ? 'bg-gray-900 text-white relative' : 'bg-white'}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                )}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className={`text-[16px] font-semibold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <p className="text-[12px] text-gray-400 mt-0.5">{plan.subtitle}</p>
                  </div>
                  {plan.popular && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/10 text-white rounded-full border border-white/20">
                      {ui.popular}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 mb-4">
                  {plan.contact ? (
                    <span
                      className={`text-[28px] font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900'}`}
                    >
                      {ui.custom}
                    </span>
                  ) : plan.priceText ? (
                    <>
                      <span
                        className={`text-[34px] font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900'}`}
                        dir="ltr"
                      >
                        {plan.priceText}
                        <span className="text-[15px] font-semibold"> DZD</span>
                      </span>
                      <span className="text-[12px] text-gray-400">{ui.currency}</span>
                    </>
                  ) : (
                    <span
                      className={`text-[34px] font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900'}`}
                    >
                      {ui.free}
                    </span>
                  )}
                </div>

                <p className={`text-[12px] leading-relaxed mb-5 ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                  {plan.description}
                </p>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px]">
                      <svg
                        className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-blue-400' : 'text-blue-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.popular ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'free' ? (
                  <Link
                    href="/register"
                    className={`block w-full py-2.5 text-center text-[13px] font-medium rounded-lg transition-colors ${
                      plan.popular
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {ui.ctaFree}
                  </Link>
                ) : plan.contact ? (
                  <Link
                    href="/#contact"
                    className={`block w-full py-2.5 text-center text-[13px] font-medium rounded-lg transition-colors ${
                      plan.popular
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {ui.ctaContact}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const key = plan.id as PaddlePriceKey;
                      if (!isPaddleConfigured(key)) {
                        // Paddle not yet wired (sandbox keys missing): fall back
                        // to register flow so the page stays functional.
                        window.location.href = `/register?plan=${plan.id}`;
                        return;
                      }
                      try {
                        await openPaddleCheckout(key);
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : 'Checkout error';
                        toast.error(msg);
                      }
                    }}
                    className={`block w-full py-2.5 text-center text-[13px] font-medium rounded-lg transition-colors ${
                      plan.popular
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {ui.ctaPaid}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's included in every plan ── */}
      <section className="py-16 sm:py-20 border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] text-gray-900">
              {ui.allIncludeTitle}
            </h2>
            <p className="mt-3 text-[15px] text-gray-500 max-w-[560px] mx-auto">{ui.allIncludeSub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {includes.map((item) => (
              <div key={item} className="bg-white p-5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[13px] text-gray-700 leading-snug pt-1">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] text-gray-900">{ui.compareTitle}</h2>
            <p className="mt-3 text-[15px] text-gray-500">{ui.compareSub}</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={`p-4 font-medium text-gray-500 ${locale === 'ar' ? 'text-right' : 'text-left'}`}></th>
                  {plans.map((p) => (
                    <th key={p.id} className="p-4 font-semibold text-gray-900 text-center min-w-[120px]">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className={`p-4 text-gray-600 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{row.label}</td>
                    {row.values.map((v, j) => (
                      <td key={j} className="p-4 text-center text-gray-700">
                        {v === '✓' ? (
                          <span className="inline-flex w-5 h-5 rounded-full bg-blue-50 text-blue-600 items-center justify-center">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : v === '—' ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <span className="font-medium text-gray-800">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Enterprise / Business CTA ── */}
      <section className="py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="relative rounded-2xl bg-gray-900 text-white p-10 sm:p-14 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 16px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 16px)',
              }}
            />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-[620px]">
                <h2 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] mb-3">{ui.enterpriseTitle}</h2>
                <p className="text-[15px] text-gray-300 leading-relaxed">{ui.enterpriseSub}</p>
              </div>
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-3 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors self-start lg:self-auto whitespace-nowrap"
              >
                {ui.ctaContact}
                <svg
                  className="w-4 h-4 rtl:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-[820px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] text-gray-900">{ui.faqTitle}</h2>
          </div>
          <div className="divide-y divide-gray-100 border-y border-gray-100">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className={`w-full flex items-center justify-between py-5 ${locale === 'ar' ? 'text-right' : 'text-left'} group`}
                  >
                    <span className="text-[15px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors pr-4">
                      {f.q}
                    </span>
                    <svg
                      className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {open && <div className="pb-5 text-[14px] text-gray-600 leading-relaxed">{f.a}</div>}
                </div>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {ui.backHome}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter lang={locale} />
    </div>
  );
}
