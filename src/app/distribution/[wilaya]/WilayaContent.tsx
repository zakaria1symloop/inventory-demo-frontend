'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import type { Wilaya } from '@/lib/wilayas';

export default function WilayaContent({ w, related }: { w: Wilaya; related: Wilaya[] }) {
  const { locale } = useLocale();
  const dataLoc = locale === 'ar' ? 'ar' : 'fr';
  const name = w.name[dataLoc];
  const region = w.region[dataLoc];

  const tt = {
    fr: {
      home: 'Accueil', distribution: 'Distribution',
      h1a: 'Logiciel de gestion & distribution à', code: w.code,
      arSub: `برنامج إدارة وتوزيع في ${w.name.ar}`,
      intro: `TrackSera aide les distributeurs, grossistes, supérettes et magasins de la wilaya de ${name} (${region}) à digitaliser leurs opérations : caisse POS, stock multi-dépôts, livraisons avec suivi GPS, vente mobile CashVan et facturation conforme à la législation algérienne.`,
      ctaTrial: 'Essai gratuit 14 jours', ctaPricing: 'Voir les tarifs',
      whyTitle: `Pourquoi les entreprises de ${name} choisissent TrackSera`,
      whyIntro: 'Une plateforme conçue pour les réalités du marché algérien : facturation conforme, support bilingue arabe/français, paiement en dinars (CCP, BaridiMob, virement) et applications mobiles fonctionnant hors ligne.',
      features: [
        { t: 'Caisse POS rapide', d: `Encaissement instantané pour vos magasins à ${name}, ticket 80 mm et imprimante Bluetooth.` },
        { t: 'Stock multi-dépôts', d: `Gérez plusieurs dépôts à ${name} et dans toute la région ${region} avec inventaire en temps réel.` },
        { t: 'Livraisons GPS', d: `Suivi en direct des livreurs sur la carte. Tournées optimisées dans ${name} et alentours.` },
        { t: 'CashVan (vente mobile)', d: 'Le commercial vend depuis sa camionnette, hors ligne. Synchronisation automatique au retour.' },
        { t: 'Facturation conforme', d: 'TVA, timbre fiscal, RC, NIF, NIS, AI, RIB, mentions obligatoires — tout en un clic.' },
        { t: 'Tableau de bord temps réel', d: 'Ventes, marges, stocks et créances par magasin et par commercial — visibles 24/7.' },
      ],
      sectorsTitle: `Secteurs servis à ${name}`,
      sectorsIntro: 'Distributeurs en gros · Grossistes alimentaires · Supérettes & magasins · Pharmacies · Cosmétiques · Matériaux de construction · Boissons · Textile · Quincaillerie',
      chips: ['Alimentation', 'Boissons', 'Cosmétiques', 'Pharmacie', 'BTP', 'Quincaillerie', 'Textile', 'Bureautique'],
      relatedTitle: `Autres wilayas de la région ${region}`,
      finalTitle: `Prêt à digitaliser votre distribution à ${name} ?`,
      finalText: 'Essayez TrackSera gratuitement pendant 14 jours. Aucune carte bancaire requise.',
      finalCta: 'Créer un compte gratuit', blogCta: 'Lire notre blog',
    },
    ar: {
      home: 'الرئيسية', distribution: 'التوزيع',
      h1a: 'برنامج إدارة وتوزيع في', code: w.code,
      arSub: '',
      intro: `يساعد تراكسيرا الموزّعين وتجار الجملة والمحلات في ولاية ${name} (${region}) على رقمنة عملياتهم: نقطة بيع (POS)، مخزون متعدد المستودعات، التوصيل مع تتبع GPS، البيع المتنقل (كاش فان) والفوترة المطابقة للتشريع الجزائري.`,
      ctaTrial: 'تجربة مجانية 14 يوم', ctaPricing: 'عرض الأسعار',
      whyTitle: `لماذا تختار شركات ${name} تراكسيرا`,
      whyIntro: 'منصّة مصمّمة لواقع السوق الجزائري: فوترة مطابقة، دعم بالعربية والفرنسية، الدفع بالدينار (CCP، بريدي موب، تحويل) وتطبيقات موبايل تعمل بدون إنترنت.',
      features: [
        { t: 'نقطة بيع سريعة (POS)', d: `تحصيل فوري لمحلاتك في ${name}، وصل 80 مم وطابعة بلوتوث.` },
        { t: 'مخزون متعدد المستودعات', d: `أدر عدة مستودعات في ${name} وكامل منطقة ${region} مع جرد لحظي.` },
        { t: 'توصيل بتتبع GPS', d: `تتبع مباشر للسائقين على الخريطة. جولات محسّنة في ${name} وما حولها.` },
        { t: 'كاش فان (بيع متنقل)', d: 'يبيع المندوب من شاحنته بدون إنترنت، مع مزامنة تلقائية عند العودة.' },
        { t: 'فوترة مطابقة', d: 'TVA، طابع جبائي، RC، NIF، NIS، AI، RIB والبيانات الإلزامية — بنقرة واحدة.' },
        { t: 'لوحة تحكم لحظية', d: 'المبيعات والهوامش والمخزون والديون لكل محل ومندوب — متاحة 24/7.' },
      ],
      sectorsTitle: `القطاعات المخدومة في ${name}`,
      sectorsIntro: 'تجار الجملة · جملة المواد الغذائية · المحلات والسوبيرات · الصيدليات · التجميل · مواد البناء · المشروبات · النسيج · الخردوات',
      chips: ['أغذية', 'مشروبات', 'تجميل', 'صيدلة', 'بناء', 'خردوات', 'نسيج', 'قرطاسية'],
      relatedTitle: `ولايات أخرى في منطقة ${region}`,
      finalTitle: `جاهز لرقمنة توزيعك في ${name}؟`,
      finalText: 'جرّب تراكسيرا مجاناً لمدة 14 يوم. بدون بطاقة بنكية.',
      finalCta: 'إنشاء حساب مجاني', blogCta: 'اقرأ مدونتنا',
    },
    en: {
      home: 'Home', distribution: 'Distribution',
      h1a: 'Management & distribution software in', code: w.code,
      arSub: `برنامج إدارة وتوزيع في ${w.name.ar}`,
      intro: `TrackSera helps distributors, wholesalers and shops in the ${name} (${region}) wilaya digitalise their operations: POS cash register, multi-warehouse stock, deliveries with GPS tracking, CashVan mobile sales and Algeria-compliant invoicing.`,
      ctaTrial: 'Free 14-day trial', ctaPricing: 'See pricing',
      whyTitle: `Why ${name} businesses choose TrackSera`,
      whyIntro: 'A platform built for the Algerian market: compliant invoicing, Arabic/French support, payment in dinars (CCP, BaridiMob, transfer) and mobile apps that work offline.',
      features: [
        { t: 'Fast POS cash register', d: `Instant checkout for your shops in ${name}, 80mm ticket and Bluetooth printer.` },
        { t: 'Multi-warehouse stock', d: `Manage several depots in ${name} and across the ${region} region with real-time inventory.` },
        { t: 'GPS deliveries', d: `Live driver tracking on the map. Optimised routes in ${name} and around.` },
        { t: 'CashVan (mobile sales)', d: 'The rep sells from the van, offline. Automatic sync when back online.' },
        { t: 'Compliant invoicing', d: 'VAT, fiscal stamp, RC, NIF, NIS, AI, RIB, required fields — all in one click.' },
        { t: 'Real-time dashboard', d: 'Sales, margins, stock and receivables per shop and per rep — visible 24/7.' },
      ],
      sectorsTitle: `Sectors served in ${name}`,
      sectorsIntro: 'Wholesale distributors · Food wholesalers · Mini-markets & shops · Pharmacies · Cosmetics · Building materials · Beverages · Textile · Hardware',
      chips: ['Food', 'Beverages', 'Cosmetics', 'Pharmacy', 'Construction', 'Hardware', 'Textile', 'Office'],
      relatedTitle: `Other wilayas in the ${region} region`,
      finalTitle: `Ready to digitalise your distribution in ${name}?`,
      finalText: 'Try TrackSera free for 14 days. No credit card required.',
      finalCta: 'Create a free account', blogCta: 'Read our blog',
    },
  }[locale];

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <nav className="flex items-center gap-2 text-sm text-blue-200 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">{tt.home}</Link>
            <span>›</span>
            <Link href="/distribution" className="hover:text-white">{tt.distribution}</Link>
            <span>›</span>
            <span className="text-white">{name}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            {tt.h1a} <span className="text-blue-200">{name}</span> ({tt.code})
          </h1>
          {tt.arSub && (
            <p className="text-2xl text-blue-100 font-medium mb-2" dir="rtl" lang="ar">{tt.arSub}</p>
          )}
          <p className="text-lg text-blue-100/90 max-w-3xl leading-relaxed mt-6">{w.pitch[dataLoc]}</p>
          <p className="text-base text-blue-100/80 mt-4 max-w-3xl">{tt.intro}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/register" className="px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors">{tt.ctaTrial}</Link>
            <Link href="/tarifs" className="px-6 py-3 bg-white/10 backdrop-blur border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">{tt.ctaPricing}</Link>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{tt.whyTitle}</h2>
        <p className="text-gray-600 mb-10 max-w-3xl">{tt.whyIntro}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tt.features.map((f) => (
            <div key={f.t} className="p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{f.t}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{tt.sectorsTitle}</h2>
          <p className="text-gray-600 mb-8 max-w-3xl">{tt.sectorsIntro}</p>
          <div className="flex flex-wrap gap-2">
            {tt.chips.map((s) => (
              <span key={s} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700">
                {s} {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">{tt.relatedTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/distribution/${r.slug}`} className="p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center">
                <div className="text-xs text-gray-400">{r.code}</div>
                <div className="font-semibold text-gray-800 text-sm">{r.name[dataLoc]}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">{tt.finalTitle}</h2>
          <p className="text-blue-100 mb-8 text-lg">{tt.finalText}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors">{tt.finalCta}</Link>
            <Link href="/blog" className="px-8 py-4 bg-white/10 backdrop-blur border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">{tt.blogCta}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
