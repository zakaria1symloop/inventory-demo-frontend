'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import type { Sector } from '@/lib/sectors';

// Locale-aware body for a sector page. Names/pitch come from the data (fr/ar;
// en falls back to fr); all surrounding UI text is translated fr/ar/en and
// switches live with the language toggle.
export default function SectorContent({ s, others }: { s: Sector; others: Sector[] }) {
  const { locale } = useLocale();
  const dataLoc = locale === 'ar' ? 'ar' : 'fr';
  const name = s.name[dataLoc];
  const pitch = s.pitch[dataLoc];

  const tt = {
    fr: {
      home: 'Accueil',
      sectors: 'Secteurs',
      h1: `Logiciel de gestion ${name}`,
      arSub: `برنامج إدارة ${s.name.ar}`,
      ctaTrial: 'Essai gratuit 14 jours',
      ctaPricing: 'Voir les tarifs',
      featTitle: `Fonctionnalités clés pour ${name}`,
      featIntro: `TrackSera propose des fonctionnalités spécialement adaptées au secteur ${name} en Algérie, sans configuration complexe.`,
      otherTitle: 'Autres secteurs servis',
      proseTitle: `Le logiciel de distribution n°1 pour le secteur ${name} en Algérie`,
      prose: [
        `Que vous soyez distributeur, grossiste ou demi-grossiste en ${name}, TrackSera digitalise toute votre chaîne de distribution : prévente sur le terrain, vente directe (CashVan), gestion des tournées et des livreurs, suivi GPS, recouvrement des créances, stock multi-dépôts et facturation conforme — sur le web et le mobile, même hors-ligne, dans les 58 wilayas.`,
        `Vos délégués commerciaux prennent les commandes chez vos clients ${name} et les transmettent au dépôt ; vos livreurs suivent des tournées optimisées ; et votre back-office voit en temps réel les ventes, les encaissements et les performances. Remplacez le papier et Excel par un véritable logiciel de gestion de la distribution ${name}.`,
      ],
      faqTitle: `Questions fréquentes — ${name}`,
      finalTitle: `Prêt à digitaliser votre activité ${name} ?`,
      finalText: 'Essayez TrackSera gratuitement pendant 14 jours. Aucune carte bancaire requise.',
      finalCta: 'Créer un compte gratuit',
    },
    ar: {
      home: 'الرئيسية',
      sectors: 'القطاعات',
      h1: `برنامج إدارة ${name}`,
      arSub: '',
      ctaTrial: 'تجربة مجانية 14 يوم',
      ctaPricing: 'عرض الأسعار',
      featTitle: `الميزات الرئيسية لقطاع ${name}`,
      featIntro: `يوفّر تراكسيرا ميزات مخصّصة لقطاع ${name} في الجزائر، بدون إعداد معقّد.`,
      otherTitle: 'قطاعات أخرى نخدمها',
      proseTitle: `برنامج التوزيع رقم 1 لقطاع ${name} في الجزائر`,
      prose: [
        `سواء كنت موزّعاً أو تاجر جملة أو نصف جملة في ${name}، يرقمن تراكسيرا كامل سلسلة توزيعك: البيع المسبق في الميدان، البيع المتنقل (كاش فان)، إدارة الجولات والسائقين، التتبع عبر GPS، تحصيل الديون، المخزون متعدد المستودعات والفوترة المطابقة — على الويب والموبايل، حتى بدون إنترنت، في 58 ولاية.`,
        `يأخذ مندوبوك الطلبات عند زبائن ${name} ويرسلونها إلى المستودع؛ ويتبع سائقوك جولات محسّنة؛ ويرى مكتبك الخلفي المبيعات والتحصيلات والأداء لحظياً. استبدل الورق وExcel ببرنامج حقيقي لإدارة توزيع ${name}.`,
      ],
      faqTitle: `أسئلة شائعة — ${name}`,
      finalTitle: `جاهز لرقمنة نشاط ${name}؟`,
      finalText: 'جرّب تراكسيرا مجاناً لمدة 14 يوم. بدون بطاقة بنكية.',
      finalCta: 'إنشاء حساب مجاني',
    },
    en: {
      home: 'Home',
      sectors: 'Sectors',
      h1: `${name} management software`,
      arSub: `برنامج إدارة ${s.name.ar}`,
      ctaTrial: 'Free 14-day trial',
      ctaPricing: 'See pricing',
      featTitle: `Key features for ${name}`,
      featIntro: `TrackSera offers features specifically tailored to the ${name} sector in Algeria, with no complex setup.`,
      otherTitle: 'Other sectors served',
      proseTitle: `The #1 distribution software for the ${name} sector in Algeria`,
      prose: [
        `Whether you are a distributor, wholesaler or reseller in ${name}, TrackSera digitalises your whole distribution chain: field pre-sales, van sales (CashVan), route and driver management, GPS tracking, debt collection, multi-warehouse stock and compliant invoicing — web and mobile, even offline, across all 58 wilayas.`,
        `Your reps take orders at your ${name} clients and send them to the depot; your drivers follow optimised routes; and your back-office sees sales, collections and performance in real time. Replace paper and Excel with a real ${name} distribution management system.`,
      ],
      faqTitle: `Frequently asked questions — ${name}`,
      finalTitle: `Ready to digitalise your ${name} business?`,
      finalText: 'Try TrackSera free for 14 days. No credit card required.',
      finalCta: 'Create a free account',
    },
  }[locale];

  const faqs = {
    fr: [
      { q: `TrackSera convient-il à la distribution ${name} en Algérie ?`, a: `Oui. TrackSera est conçu pour les distributeurs, grossistes et demi-grossistes du secteur ${name}, avec prévente, vente directe (CashVan), tournées, suivi GPS, stock et facturation conforme — dans les 58 wilayas.` },
      { q: `Gère-t-il la vente mobile (CashVan) ?`, a: `Oui. Vos vendeurs ${name} vendent et encaissent directement depuis le camion avec stock embarqué, même hors-ligne.` },
      { q: `Puis-je suivre mes livreurs et mes tournées ?`, a: `Oui. TrackSera planifie les tournées et suit les livreurs en direct par GPS, avec preuve de livraison.` },
      { q: `La facturation est-elle conforme en Algérie ?`, a: `Oui : TVA, timbre fiscal et mentions obligatoires, avec export PDF professionnel.` },
      { q: `Fonctionne-t-il hors connexion ?`, a: `Oui. Les applications fonctionnent hors-ligne et se synchronisent au retour du réseau.` },
      { q: `Combien ça coûte ?`, a: `Une offre gratuite, Starter à 4 500 DZD/mois, et Business sans limite sur devis.` },
    ],
    ar: [
      { q: `هل يناسب تراكسيرا توزيع ${name} في الجزائر؟`, a: `نعم. تراكسيرا مصمّم للموزّعين وتجار الجملة وأنصاف الجملة في قطاع ${name}، مع البيع المسبق والمتنقل (كاش فان) والجولات والتتبع عبر GPS والمخزون والفوترة المطابقة — في 58 ولاية.` },
      { q: `هل يدير البيع المتنقل (كاش فان)؟`, a: `نعم. يبيع بائعو ${name} ويحصّلون مباشرة من الشاحنة بمخزون محمّل، حتى بدون إنترنت.` },
      { q: `هل يمكنني تتبع السائقين والجولات؟`, a: `نعم. يخطّط تراكسيرا الجولات ويتتبع السائقين مباشرة عبر GPS مع إثبات التسليم.` },
      { q: `هل الفوترة مطابقة في الجزائر؟`, a: `نعم: ضريبة وطابع جبائي وبيانات إلزامية، مع تصدير PDF احترافي.` },
      { q: `هل يعمل بدون إنترنت؟`, a: `نعم. تعمل التطبيقات بدون شبكة وتتزامن عند عودتها.` },
      { q: `كم التكلفة؟`, a: `خطة مجانية، Starter بـ 4 500 دج/شهر، وBusiness بلا حدود حسب الطلب.` },
    ],
    en: [
      { q: `Is TrackSera suitable for ${name} distribution in Algeria?`, a: `Yes. TrackSera is built for distributors, wholesalers and resellers in the ${name} sector, with pre-sales, van sales (CashVan), routes, GPS tracking, stock and compliant invoicing — across all 58 wilayas.` },
      { q: `Does it handle mobile sales (CashVan)?`, a: `Yes. Your ${name} sellers sell and collect straight from the van with on-board stock, even offline.` },
      { q: `Can I track my drivers and routes?`, a: `Yes. TrackSera plans routes and tracks drivers live by GPS, with proof of delivery.` },
      { q: `Is invoicing compliant in Algeria?`, a: `Yes: VAT, fiscal stamp and required fields, with professional PDF export.` },
      { q: `Does it work offline?`, a: `Yes. The apps work offline and sync when back online.` },
      { q: `How much does it cost?`, a: `A free plan, Starter at 4,500 DZD/month, and unlimited Business on quote.` },
    ],
  }[locale];

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="text-sm text-violet-200 mb-4">
            <Link href="/" className="hover:text-white">{tt.home}</Link>
            <span className="mx-2">›</span>
            <Link href="/secteurs" className="hover:text-white">{tt.sectors}</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{name}</span>
          </nav>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-6xl">{s.emoji}</div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">{tt.h1}</h1>
              {tt.arSub && (
                <p className="text-2xl text-violet-100 font-medium mt-2" dir="rtl" lang="ar">{tt.arSub}</p>
              )}
            </div>
          </div>
          <p className="text-lg text-violet-100/90 max-w-3xl leading-relaxed mt-6">{pitch}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/register" className="px-6 py-3 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors">{tt.ctaTrial}</Link>
            <Link href="/tarifs" className="px-6 py-3 bg-white/10 backdrop-blur border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">{tt.ctaPricing}</Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{tt.featTitle}</h2>
        <p className="text-gray-600 mb-10 max-w-3xl">{tt.featIntro}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {s.features.map((f) => (
            <div key={f} className="p-6 rounded-2xl border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">{f}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* SEO prose + FAQ */}
      <section className="max-w-4xl mx-auto px-6 pb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-5">{tt.proseTitle}</h2>
        <div className="space-y-4 text-gray-600 leading-relaxed text-[15px]">
          {tt.prose.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <h3 className="text-xl font-extrabold text-gray-900 mt-12 mb-6">{tt.faqTitle}</h3>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-gray-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-gray-900 list-none flex items-center justify-between gap-4">
                {f.q}
                <span className="text-violet-600 group-open:rotate-45 transition-transform text-2xl leading-none shrink-0">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Other sectors */}
      <section className="bg-gray-50 py-16 mt-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">{tt.otherTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {others.map((o) => (
              <Link key={o.slug} href={`/secteurs/${o.slug}`} className="p-4 rounded-xl border border-gray-200 bg-white hover:border-violet-300 hover:shadow-md transition-all text-center">
                <div className="text-3xl mb-1">{o.emoji}</div>
                <div className="font-semibold text-gray-800 text-sm">{o.name[dataLoc]}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">{tt.finalTitle}</h2>
          <p className="text-violet-100 mb-8 text-lg">{tt.finalText}</p>
          <Link href="/register" className="inline-block px-8 py-4 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors">{tt.finalCta}</Link>
        </div>
      </section>
    </main>
  );
}
