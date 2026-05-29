'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/locales';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { SECTORS } from '@/lib/sectors';

/* ─────────────────────────── translations ─────────────────────────── */

type Dict = {
  badge: string;
  h1a: string;
  h1b: string;
  sub: string;
  ctaTrial: string;
  ctaPricing: string;
  ctaDemo: string;
  metric1: string;
  metric2: string;
  metric3: string;
  cardTitle: string;
  cardDelta: string;
  ebChallenge: string;
  challengesTitle: string;
  challenges: { icon: string; t: string; d: string }[];
  ebFeatures: string;
  featuresTitle: string;
  featuresSub: string;
  features: { icon: string; t: string; d: string }[];
  ebSteps: string;
  stepsTitle: string;
  steps: { t: string; d: string }[];
  ebAudience: string;
  audiencesTitle: string;
  audiencesSub: string;
  audiences: string[];
  sectorsCta: string;
  allSectors: string;
  wilayaTitle: string;
  wilayaText: string;
  wilayaCta: string;
  ebFaq: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
  proseTitle: string;
  prose: string[];
  relatedTitle: string;
  finalTitle: string;
  finalText: string;
  finalCta: string;
};

const T: Record<Locale, Dict> = {
  fr: {
    badge: 'LOGICIEL DE DISTRIBUTION',
    h1a: 'Le logiciel de gestion de la',
    h1b: 'distribution en Algérie',
    sub: 'TrackSera pilote toute votre distribution : prévente, vente directe (CashVan), tournées, suivi GPS des livreurs, recouvrement, stock multi-dépôts et facturation conforme — web et mobile, même hors-ligne.',
    ctaTrial: 'Essai gratuit — 14 jours',
    ctaPricing: 'Voir les tarifs',
    ctaDemo: 'Demander une démo',
    metric1: '58 wilayas',
    metric2: 'Hors-ligne',
    metric3: 'AR / FR',
    cardTitle: 'Ventes du jour',
    cardDelta: '+24%',
    ebChallenge: 'LE DÉFI',
    challengesTitle: 'Le défi de la distribution en Algérie',
    challenges: [
      { icon: '🚚', t: 'Tournées désorganisées', d: 'Itinéraires non optimisés, livreurs injoignables, bons sur papier perdus.' },
      { icon: '💸', t: 'Recouvrement hors de contrôle', d: 'Impossible de savoir qui doit combien ni ce que chaque vendeur a encaissé.' },
      { icon: '📦', t: 'Stock invisible', d: 'Ruptures, surstocks et écarts entre le dépôt et le stock des camions.' },
      { icon: '🧾', t: 'Facturation non conforme', d: 'Factures manuelles, TVA et mentions obligatoires mal gérées.' },
    ],
    ebFeatures: 'FONCTIONNALITÉS',
    featuresTitle: 'Un seul logiciel pour toute votre distribution',
    featuresSub: 'De la prise de commande sur le terrain jusqu’au recouvrement et aux rapports.',
    features: [
      { icon: '🛒', t: 'Prévente', d: 'Vos délégués prennent les commandes chez le client sur mobile.' },
      { icon: '🚐', t: 'Vente directe / CashVan', d: 'Vente et encaissement depuis le camion avec stock embarqué.' },
      { icon: '🗺️', t: 'Gestion des tournées', d: 'Itinéraires des livreurs et représentants par zone et par jour.' },
      { icon: '📍', t: 'Suivi GPS des livreurs', d: 'Localisez vos camions en direct et revoyez chaque tournée.' },
      { icon: '💰', t: 'Recouvrement & caisse', d: 'Créances clients, encaissements terrain et caisse par vendeur.' },
      { icon: '🏬', t: 'Stock multi-dépôts', d: 'Entrepôts et stock embarqué, transferts, alertes et inventaires.' },
      { icon: '🧾', t: 'Facturation conforme', d: 'Factures PDF avec TVA, timbre et mentions obligatoires.' },
      { icon: '📶', t: 'Mode hors-ligne', d: 'Les apps fonctionnent sans réseau et se synchronisent ensuite.' },
      { icon: '📊', t: 'Rapports temps réel', d: 'Ventes par délégué, produit, client et zone, export Excel.' },
    ],
    ebSteps: 'COMMENT ÇA MARCHE',
    stepsTitle: 'De la commande au recouvrement',
    steps: [
      { t: 'Prévente', d: 'Le délégué visite le client et saisit la commande sur mobile.' },
      { t: 'Tournée', d: 'La commande est préparée et affectée à une tournée optimisée.' },
      { t: 'Livraison', d: 'Le livreur ou le CashVan livre, encaisse et imprime le ticket.' },
      { t: 'Reporting', d: 'Encaissements, créances et performances remontent au back-office.' },
    ],
    ebAudience: 'POUR QUI ?',
    audiencesTitle: 'Pour quels distributeurs ?',
    audiencesSub: 'TrackSera s’adapte à tous les métiers de la distribution et du gros.',
    audiences: [
      'Distributeurs et demi-grossistes',
      'Grossistes FMCG',
      'Agroalimentaire et boissons',
      'Pharmacie et parapharmacie',
      'Cosmétiques et droguerie',
      'Matériaux et quincaillerie',
    ],
    sectorsCta: 'Logiciel',
    allSectors: 'Tous les secteurs',
    wilayaTitle: 'Disponible dans les 58 wilayas',
    wilayaText: 'D’Alger à Tamanrasset, TrackSera est 100% en ligne et accessible partout en Algérie.',
    wilayaCta: 'Distribution par wilaya',
    ebFaq: 'FAQ',
    faqTitle: 'Questions fréquentes',
    faqs: [
      { q: 'Qu’est-ce qu’un logiciel de gestion de la distribution ?', a: 'Une plateforme qui pilote la prise de commande (prévente), la vente directe (CashVan), les tournées, le stock, le recouvrement et la facturation — TrackSera réunit tout, web et mobile.' },
      { q: 'Fonctionne-t-il sans Internet ?', a: 'Oui, les apps vendeur, livreur et CashVan fonctionnent hors-ligne et se synchronisent au retour du réseau.' },
      { q: 'Gère-t-il prévente ET vente directe ?', a: 'Oui : prévente (commande livrée ensuite) et vente directe / CashVan (vente et encaissement immédiats).' },
      { q: 'Adapté aux grossistes en Algérie ?', a: 'Oui, pour distributeurs, grossistes et demi-grossistes dans les 58 wilayas.' },
      { q: 'La facturation est-elle conforme ?', a: 'Oui : TVA, timbre fiscal et mentions obligatoires, export PDF professionnel.' },
      { q: 'Combien ça coûte ?', a: 'Une offre gratuite pour démarrer, Starter à 4 500 DZD/mois, et Business sans limite sur devis.' },
    ],
    proseTitle: 'TrackSera, le logiciel de distribution pensé pour l’Algérie',
    prose: [
      'TrackSera est un logiciel de gestion de la distribution pour distributeurs, grossistes et demi-grossistes en Algérie : prévente, vente directe (CashVan), gestion des livreurs et des tournées, recouvrement et facturation — dans une seule plateforme web et mobile.',
      'Avec CashVan, vos vendeurs vendent depuis le camion et encaissent sur place ; en prévente, vos délégués prennent la commande et l’envoient au dépôt. Le suivi GPS et les rapports temps réel vous donnent une visibilité totale.',
      'Le tout fonctionne en ligne comme hors-ligne, dans les 58 wilayas — la réponse moderne pour remplacer le papier et Excel par un vrai système de distribution.',
    ],
    relatedTitle: 'Recherches fréquentes',
    finalTitle: 'Prêt à digitaliser votre distribution ?',
    finalText: 'Démarrez gratuitement et reprenez le contrôle de vos tournées, de votre stock et de votre recouvrement.',
    finalCta: 'Essai gratuit — 14 jours',
  },
  ar: {
    badge: 'برنامج التوزيع',
    h1a: 'برنامج إدارة',
    h1b: 'التوزيع في الجزائر',
    sub: 'تراكسيرا يدير توزيعك بالكامل: البيع المسبق، البيع المتنقل (كاش فان)، الجولات، تتبع السائقين عبر GPS، تحصيل الديون، المخزون متعدد المستودعات والفوترة المطابقة — ويب وموبايل، حتى بدون إنترنت.',
    ctaTrial: 'ابدأ مجاناً — 14 يوم',
    ctaPricing: 'الأسعار',
    ctaDemo: 'اطلب عرضاً',
    metric1: '58 ولاية',
    metric2: 'بدون إنترنت',
    metric3: 'عربي / فرنسي',
    cardTitle: 'مبيعات اليوم',
    cardDelta: '+24%',
    ebChallenge: 'التحدّي',
    challengesTitle: 'تحديات التوزيع في الجزائر',
    challenges: [
      { icon: '🚚', t: 'جولات غير منظمة', d: 'مسارات غير محسّنة، سائقون يصعب الوصول إليهم، وأوراق تضيع.' },
      { icon: '💸', t: 'تحصيل خارج السيطرة', d: 'يصعب معرفة من عليه دين وكم حصّل كل بائع في الميدان.' },
      { icon: '📦', t: 'مخزون غير واضح', d: 'نقص وفائض وفروقات بين المستودع ومخزون الشاحنات.' },
      { icon: '🧾', t: 'فوترة غير مطابقة', d: 'فواتير يدوية وضريبة وبيانات إلزامية غير مضبوطة.' },
    ],
    ebFeatures: 'الميزات',
    featuresTitle: 'برنامج واحد لكل عمليات التوزيع',
    featuresSub: 'من أخذ الطلب في الميدان إلى التحصيل والتقارير.',
    features: [
      { icon: '🛒', t: 'البيع المسبق', d: 'مندوبوك يأخذون الطلبات عند الزبون عبر الموبايل.' },
      { icon: '🚐', t: 'البيع المتنقل (كاش فان)', d: 'بيع وتحصيل مباشر من الشاحنة بمخزون محمّل.' },
      { icon: '🗺️', t: 'إدارة الجولات', d: 'مسارات السائقين والمندوبين حسب المنطقة واليوم.' },
      { icon: '📍', t: 'تتبع السائقين GPS', d: 'حدّد مواقع شاحناتك مباشرة وراجع كل جولة.' },
      { icon: '💰', t: 'التحصيل والصندوق', d: 'ديون العملاء، التحصيل الميداني وصندوق لكل بائع.' },
      { icon: '🏬', t: 'مخزون متعدد المستودعات', d: 'مستودعات ومخزون محمّل، تحويلات، تنبيهات وجرد.' },
      { icon: '🧾', t: 'فوترة مطابقة', d: 'فواتير PDF مع الضريبة والطابع والبيانات الإلزامية.' },
      { icon: '📶', t: 'وضع بدون إنترنت', d: 'التطبيقات تعمل بدون شبكة وتتزامن لاحقاً.' },
      { icon: '📊', t: 'تقارير لحظية', d: 'مبيعات حسب المندوب والمنتج والعميل والمنطقة، تصدير Excel.' },
    ],
    ebSteps: 'كيف يعمل',
    stepsTitle: 'من الطلب إلى التحصيل',
    steps: [
      { t: 'البيع المسبق', d: 'المندوب يزور الزبون ويسجّل الطلب على الموبايل.' },
      { t: 'الجولة', d: 'يُجهَّز الطلب ويُسنَد إلى جولة محسّنة.' },
      { t: 'التوصيل', d: 'السائق أو الكاش فان يوصّل، يحصّل ويطبع الوصل.' },
      { t: 'التقارير', d: 'التحصيلات والديون والأداء تصل تلقائياً للإدارة.' },
    ],
    ebAudience: 'لمن؟',
    audiencesTitle: 'لأي موزّعين؟',
    audiencesSub: 'تراكسيرا يناسب كل مهن التوزيع والجملة.',
    audiences: [
      'الموزّعون وأنصاف الجملة',
      'تجار الجملة (FMCG)',
      'المواد الغذائية والمشروبات',
      'الأدوية وشبه الصيدلانية',
      'التجميل والدروغري',
      'مواد البناء والخردوات',
    ],
    sectorsCta: 'برنامج',
    allSectors: 'كل القطاعات',
    wilayaTitle: 'متوفّر في 58 ولاية',
    wilayaText: 'من الجزائر العاصمة إلى تمنراست، تراكسيرا 100% عبر الإنترنت ومتاح في كل الجزائر.',
    wilayaCta: 'التوزيع حسب الولاية',
    ebFaq: 'الأسئلة الشائعة',
    faqTitle: 'أسئلة شائعة',
    faqs: [
      { q: 'ما هو برنامج إدارة التوزيع؟', a: 'منصّة تدير البيع المسبق، البيع المتنقل (كاش فان)، الجولات، المخزون، التحصيل والفوترة — تراكسيرا يجمعها كلها، ويب وموبايل.' },
      { q: 'هل يعمل بدون إنترنت؟', a: 'نعم، تطبيقات البائع والسائق والكاش فان تعمل بدون شبكة وتتزامن عند عودتها.' },
      { q: 'هل يدير البيع المسبق والمتنقل معاً؟', a: 'نعم: بيع مسبق (طلب يُوصَّل لاحقاً) وبيع مباشر/كاش فان (بيع وتحصيل فوري).' },
      { q: 'هل يناسب تجار الجملة في الجزائر؟', a: 'نعم، للموزّعين وتجار الجملة وأنصاف الجملة في 58 ولاية.' },
      { q: 'هل الفوترة مطابقة؟', a: 'نعم: ضريبة، طابع جبائي وبيانات إلزامية، مع تصدير PDF احترافي.' },
      { q: 'كم التكلفة؟', a: 'خطة مجانية للبداية، Starter بـ 4 500 دج/شهر، وBusiness بلا حدود حسب الطلب.' },
    ],
    proseTitle: 'تراكسيرا، برنامج التوزيع المصمَّم للجزائر',
    prose: [
      'تراكسيرا برنامج لإدارة التوزيع للموزّعين وتجار الجملة وأنصاف الجملة في الجزائر: البيع المسبق، البيع المتنقل (كاش فان)، إدارة السائقين والجولات، التحصيل والفوترة — في منصّة واحدة ويب وموبايل.',
      'مع كاش فان يبيع بائعوك من الشاحنة ويحصّلون في المكان؛ وفي البيع المسبق يأخذ المندوبون الطلب ويرسلونه للمستودع. التتبع عبر GPS والتقارير اللحظية تمنحك رؤية كاملة.',
      'كل ذلك يعمل بإنترنت وبدونه، في 58 ولاية — الحل العصري لاستبدال الورق وExcel بنظام توزيع حقيقي.',
    ],
    relatedTitle: 'عمليات بحث شائعة',
    finalTitle: 'جاهز لرقمنة توزيعك؟',
    finalText: 'ابدأ مجاناً واستعد التحكم في جولاتك ومخزونك وتحصيلك.',
    finalCta: 'ابدأ مجاناً — 14 يوم',
  },
  en: {
    badge: 'DISTRIBUTION SOFTWARE',
    h1a: 'Distribution management',
    h1b: 'software for Algeria',
    sub: 'TrackSera runs your whole distribution: pre-sales, van sales (CashVan), routes, GPS driver tracking, debt collection, multi-warehouse stock and compliant invoicing — web and mobile, even offline.',
    ctaTrial: 'Free trial — 14 days',
    ctaPricing: 'See pricing',
    ctaDemo: 'Request a demo',
    metric1: '58 wilayas',
    metric2: 'Offline',
    metric3: 'AR / FR',
    cardTitle: 'Today’s sales',
    cardDelta: '+24%',
    ebChallenge: 'THE CHALLENGE',
    challengesTitle: 'The distribution challenge in Algeria',
    challenges: [
      { icon: '🚚', t: 'Messy routes', d: 'Unoptimised routes, unreachable drivers, lost paper notes.' },
      { icon: '💸', t: 'Collection out of control', d: 'No clear view of who owes what or what each rep collected.' },
      { icon: '📦', t: 'Invisible stock', d: 'Stockouts, overstock and gaps between depot and van stock.' },
      { icon: '🧾', t: 'Non-compliant invoicing', d: 'Manual invoices, mishandled VAT and required fields.' },
    ],
    ebFeatures: 'FEATURES',
    featuresTitle: 'One software for your whole distribution',
    featuresSub: 'From field order-taking to collection and reporting.',
    features: [
      { icon: '🛒', t: 'Pre-sales', d: 'Reps take orders at the client on mobile.' },
      { icon: '🚐', t: 'Van sales / CashVan', d: 'Sell and collect from the van with on-board stock.' },
      { icon: '🗺️', t: 'Route management', d: 'Driver and rep routes by zone and by day.' },
      { icon: '📍', t: 'GPS driver tracking', d: 'Locate vans live and review every route.' },
      { icon: '💰', t: 'Collection & cash', d: 'Client debts, field collections and per-seller cash.' },
      { icon: '🏬', t: 'Multi-warehouse stock', d: 'Depots and van stock, transfers, alerts and stocktakes.' },
      { icon: '🧾', t: 'Compliant invoicing', d: 'PDF invoices with VAT, stamp and required fields.' },
      { icon: '📶', t: 'Offline mode', d: 'Apps work with no network and sync afterwards.' },
      { icon: '📊', t: 'Real-time reports', d: 'Sales by rep, product, client and zone, Excel export.' },
    ],
    ebSteps: 'HOW IT WORKS',
    stepsTitle: 'From order to collection',
    steps: [
      { t: 'Pre-sale', d: 'The rep visits the client and enters the order on mobile.' },
      { t: 'Route', d: 'The order is prepared and assigned to an optimised route.' },
      { t: 'Delivery', d: 'The driver or CashVan delivers, collects and prints the receipt.' },
      { t: 'Reporting', d: 'Collections, debts and performance flow back to the back-office.' },
    ],
    ebAudience: 'WHO FOR',
    audiencesTitle: 'For which distributors?',
    audiencesSub: 'TrackSera fits every distribution and wholesale trade.',
    audiences: [
      'Distributors and resellers',
      'FMCG wholesalers',
      'Food & beverage',
      'Pharma & parapharmacy',
      'Cosmetics & drugstore',
      'Building materials & hardware',
    ],
    sectorsCta: 'Software',
    allSectors: 'All sectors',
    wilayaTitle: 'Available in all 58 wilayas',
    wilayaText: 'From Algiers to Tamanrasset, TrackSera is 100% online and available everywhere in Algeria.',
    wilayaCta: 'Distribution by wilaya',
    ebFaq: 'FAQ',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What is distribution management software?', a: 'A platform that runs pre-sales, van sales (CashVan), routes, stock, collection and invoicing — TrackSera brings it all together, web and mobile.' },
      { q: 'Does it work without Internet?', a: 'Yes, the seller, driver and CashVan apps work offline and sync when back online.' },
      { q: 'Does it handle pre-sales AND van sales?', a: 'Yes: pre-sales (delivered later) and direct/van sales (instant sale and collection).' },
      { q: 'Is it suited to wholesalers in Algeria?', a: 'Yes, for distributors, wholesalers and resellers across all 58 wilayas.' },
      { q: 'Is invoicing compliant?', a: 'Yes: VAT, fiscal stamp and required fields, with professional PDF export.' },
      { q: 'How much does it cost?', a: 'A free plan to start, Starter at 4,500 DZD/month, and unlimited Business on quote.' },
    ],
    proseTitle: 'TrackSera, distribution software built for Algeria',
    prose: [
      'TrackSera is distribution management software for distributors, wholesalers and resellers in Algeria: pre-sales, van sales (CashVan), driver and route management, collection and invoicing — in one web and mobile platform.',
      'With CashVan your sellers sell from the van and collect on the spot; in pre-sales your reps take the order and send it to the depot. GPS tracking and real-time reports give you full visibility.',
      'It all works online and offline, across all 58 wilayas — the modern way to replace paper and Excel with a real distribution system.',
    ],
    relatedTitle: 'Frequent searches',
    finalTitle: 'Ready to digitalise your distribution?',
    finalText: 'Start free and take back control of your routes, stock and collection.',
    finalCta: 'Free trial — 14 days',
  },
};

const RELATED = [
  'logiciel de distribution',
  'logiciel de gestion de la distribution',
  'logiciel de distribution avec CashVan',
  'logiciel de prévente',
  'gestion des tournées',
  'logiciel grossiste',
  'برنامج إدارة التوزيع',
  'برنامج البيع المتنقل (كاش فان)',
];

const ROUTE = 'M 36 232 C 150 232 150 120 264 120 C 372 120 372 232 480 232 C 588 232 600 120 724 128';

const ANIM_CSS = `
.dst-rise{opacity:0;transform:translateY(20px);animation:dstRise .7s cubic-bezier(.16,1,.3,1) forwards}
@keyframes dstRise{to{opacity:1;transform:none}}
.dst-draw{stroke-dasharray:1100;stroke-dashoffset:1100;animation:dstDraw 2.4s ease-out .3s forwards}
@keyframes dstDraw{to{stroke-dashoffset:0}}
.dst-bar{transform-origin:bottom;transform:scaleY(0);animation:dstBar .7s cubic-bezier(.16,1,.3,1) forwards}
@keyframes dstBar{to{transform:scaleY(1)}}
.dst-card{opacity:0;animation:dstRise .7s cubic-bezier(.16,1,.3,1) 1s forwards}
.dst-trend{stroke-dasharray:230;stroke-dashoffset:230;animation:dstDraw 1.2s ease-out 1.3s forwards}
.dst-ping{transform-origin:center;animation:dstPing 2.2s ease-out infinite}
@keyframes dstPing{0%{transform:scale(.6);opacity:.45}80%,100%{transform:scale(2.6);opacity:0}}
.dst-pin{transform-origin:center bottom;animation:dstBob 2.4s ease-in-out infinite}
@keyframes dstBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.dst-tile{transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s,border-color .25s}
.dst-tile:hover{transform:translateY(-3px)}
@media (prefers-reduced-motion: reduce){
  .dst-rise,.dst-card{opacity:1!important;transform:none!important;animation:none!important}
  .dst-draw,.dst-trend{stroke-dashoffset:0!important;animation:none!important}
  .dst-bar{transform:none!important;animation:none!important}
  .dst-truck,.dst-ping,.dst-pin{animation:none!important}
}
`;

/* ─────────────────────────── animated route art (light) ─────────────────────────── */

function HeroArt({ cardTitle, cardDelta }: { cardTitle: string; cardDelta: string }) {
  return (
    <div className="dst-art relative w-full">
      <svg viewBox="0 0 760 300" className="w-full h-auto" role="img" aria-label="Carte de distribution en temps réel">
        <defs>
          <linearGradient id="dstRoad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2563eb" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
          <filter id="dstSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1e3a8a" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* dotted backdrop */}
        <g opacity="0.6">
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 19 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={20 + c * 40} cy={26 + r * 38} r="1.3" fill="#dbeafe" />
            )),
          )}
        </g>

        {/* base road */}
        <path d={ROUTE} fill="none" stroke="#e0e7ff" strokeWidth="16" strokeLinecap="round" />
        <path d={ROUTE} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="1 13" strokeLinecap="round" />
        {/* animated progress trace */}
        <path className="dst-draw" d={ROUTE} fill="none" stroke="url(#dstRoad)" strokeWidth="5" strokeLinecap="round" />

        {/* depot */}
        <g transform="translate(18 206)">
          <rect x="0" y="8" width="36" height="28" rx="3" fill="#0f172a" />
          <path d="M0 14 L18 0 L36 14 Z" fill="#334155" />
          <rect x="13" y="20" width="10" height="16" rx="1" fill="#3b82f6" />
        </g>

        {/* client nodes */}
        {[[264, 120], [480, 232]].map(([cx, cy], i) => (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <circle className="dst-ping" cx="0" cy="0" r="7" fill="#3b82f6" opacity="0.25" style={{ animationDelay: `${i * 0.9}s` }} />
            <circle cx="0" cy="0" r="4.5" fill="#3b82f6" />
            <circle cx="0" cy="0" r="1.8" fill="#fff" />
          </g>
        ))}

        {/* destination pin */}
        <g transform="translate(724 128)" filter="url(#dstSoft)">
          <path className="dst-pin" d="M0 -26 C 12 -26 16 -16 16 -10 C 16 0 0 8 0 8 C 0 8 -16 0 -16 -10 C -16 -16 -12 -26 0 -26 Z" fill="#ef4444" />
          <circle cx="0" cy="-12" r="5" fill="#fff" />
        </g>

        {/* truck */}
        <g className="dst-truck" filter="url(#dstSoft)">
          <g transform="translate(-20 -13)">
            <rect x="-2" y="0" width="26" height="20" rx="2.5" fill="#fff" stroke="#1e3a8a" strokeWidth="1.5" />
            <path d="M24 6 L33 6 L39 13 L39 20 L24 20 Z" fill="#2563eb" />
            <rect x="27" y="9" width="7" height="6" rx="1" fill="#bfdbfe" />
            <circle cx="6" cy="22" r="4" fill="#0f172a" />
            <circle cx="31" cy="22" r="4" fill="#0f172a" />
            <circle cx="6" cy="22" r="1.6" fill="#94a3b8" />
            <circle cx="31" cy="22" r="1.6" fill="#94a3b8" />
          </g>
          <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" keyTimes="0;1" keyPoints="0;1" calcMode="linear">
            <mpath href="#__dstRouteRef" />
          </animateMotion>
        </g>
        <path id="__dstRouteRef" d={ROUTE} fill="none" stroke="none" />
      </svg>

      {/* analytics card */}
      <div className="dst-card absolute -bottom-4 ltr:right-1 rtl:left-1 w-[190px] rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_18px_50px_-18px_rgba(0,0,0,0.25)] p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-500">{cardTitle}</span>
          <span className="text-[11px] font-bold text-emerald-600">{cardDelta}</span>
        </div>
        <div className="flex items-end gap-1.5 h-14">
          {[40, 62, 48, 78, 95, 70].map((h, i) => (
            <div key={i} className="dst-bar flex-1 rounded-t bg-blue-500" style={{ height: `${h}%`, animationDelay: `${0.6 + i * 0.12}s` }} />
          ))}
        </div>
        <svg viewBox="0 0 160 30" className="mt-1 w-full h-5">
          <polyline className="dst-trend" points="0,26 32,20 64,22 96,10 128,12 160,3" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────── shared bits ─────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">{children}</p>;
}

const btnPrimary =
  'inline-flex items-center justify-center px-7 py-3.5 text-[14px] font-medium text-white bg-gray-900 rounded-full transition-all hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:-translate-y-[1px]';

/* ─────────────────────────── page ─────────────────────────── */

export default function DistributionLanding() {
  const { locale, setLocale } = useLocale();
  const t = T[locale];
  const isRtl = locale === 'ar';
  const cycleLang = () => {
    const order: Locale[] = ['fr', 'ar', 'en'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900">
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
      <SiteNav lang={locale} onLangToggle={cycleLang} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0 1px, transparent 1px 18px), repeating-linear-gradient(-45deg, #000 0 1px, transparent 1px 18px)' }}
        />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          <div>
            <nav className="text-[13px] text-gray-400 mb-5">
              <Link href="/" className="hover:text-gray-600">{isRtl ? 'الرئيسية' : locale === 'en' ? 'Home' : 'Accueil'}</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-600">{isRtl ? 'برنامج التوزيع' : locale === 'en' ? 'Distribution software' : 'Logiciel de distribution'}</span>
            </nav>
            <Eyebrow>{t.badge}</Eyebrow>
            <h1 className="dst-rise text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.08] tracking-[-0.025em] text-gray-900">
              {t.h1a} <span className="text-blue-600">{t.h1b}</span>
            </h1>
            <p className="dst-rise mt-6 text-[16px] sm:text-[18px] leading-[1.7] text-gray-500 max-w-[560px]" style={{ animationDelay: '0.1s' }}>{t.sub}</p>
            <div className="dst-rise mt-8 flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.2s' }}>
              <Link href="/register" className={btnPrimary}>{t.ctaTrial}</Link>
              <Link href="/tarifs" className="inline-flex items-center justify-center px-7 py-3.5 text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors gap-1.5">
                {t.ctaPricing} <span>→</span>
              </Link>
            </div>
            <div className="dst-rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-gray-400" style={{ animationDelay: '0.3s' }}>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{t.metric1}</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{t.metric2}</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{t.metric3}</span>
            </div>
          </div>
          <div className="dst-rise" style={{ animationDelay: '0.15s' }}>
            <div className="relative rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-[0_24px_80px_-28px_rgba(0,0,0,0.22)] p-5">
              <HeroArt cardTitle={t.cardTitle} cardDelta={t.cardDelta} />
            </div>
          </div>
        </div>
      </section>

      {/* Stat band */}
      <section className="border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12 flex flex-wrap items-center justify-center gap-x-14 gap-y-6 text-center">
          {[
            { v: '58', l: isRtl ? 'ولاية' : locale === 'en' ? 'Wilayas' : 'Wilayas' },
            { v: '3', l: isRtl ? 'تطبيقات موبايل' : locale === 'en' ? 'Mobile apps' : 'Applications mobiles' },
            { v: '100%', l: isRtl ? 'بدون إنترنت' : locale === 'en' ? 'Offline' : 'Hors-ligne' },
            { v: '24/7', l: isRtl ? 'سحابي' : 'Cloud' },
          ].map((s) => (
            <div key={s.l} className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold tracking-tight text-gray-900">{s.v}</span>
              <span className="text-[13px] text-gray-400">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Challenges */}
      <section className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <Eyebrow>{t.ebChallenge}</Eyebrow>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">{t.challengesTitle}</h2>
          </div>
          <div className="grid gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 sm:grid-cols-2 lg:grid-cols-4">
            {t.challenges.map((c) => (
              <div key={c.t} className="bg-white p-6">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl mb-4">{c.icon}</div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{c.t}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <Eyebrow>{t.ebFeatures}</Eyebrow>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">{t.featuresTitle}</h2>
            <p className="mt-4 text-[16px] text-gray-500 max-w-[620px] mx-auto">{t.featuresSub}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.map((f) => (
              <div key={f.t} className="dst-tile p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-[0_14px_44px_-20px_rgba(0,0,0,0.18)]">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl mb-4">{f.icon}</div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{f.t}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <Eyebrow>{t.ebSteps}</Eyebrow>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">{t.stepsTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-6 relative">
            <div className="hidden md:block absolute top-10 right-[12.5%] left-[12.5%] h-px bg-gray-200" />
            {t.steps.map((s, i) => (
              <div key={s.t} className="relative text-center">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <span className="text-[22px] font-bold text-blue-600">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-2">{s.t}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed max-w-[220px] mx-auto">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audiences + sectors */}
      <section className="py-20 sm:py-28 border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <Eyebrow>{t.ebAudience}</Eyebrow>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">{t.audiencesTitle}</h2>
            <p className="mt-4 text-[16px] text-gray-500 max-w-[620px] mx-auto">{t.audiencesSub}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8 max-w-[900px] mx-auto">
            {t.audiences.map((a) => (
              <div key={a} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-[14px] font-medium text-gray-700">{a}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {SECTORS.slice(0, 8).map((s) => (
              <Link key={s.slug} href={`/secteurs/${s.slug}`} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-[13px] text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors">
                {t.sectorsCta} {isRtl ? s.name.ar : s.name.fr}
              </Link>
            ))}
            <Link href="/secteurs" className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 transition-colors">{t.allSectors} →</Link>
          </div>
        </div>
      </section>

      {/* Wilaya band */}
      <section className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white p-10 sm:p-14">
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 16px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 16px)' }} />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-[620px]">
                <h2 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] mb-3">{t.wilayaTitle}</h2>
                <p className="text-[15px] text-gray-300 leading-relaxed">{t.wilayaText}</p>
              </div>
              <Link href="/distribution" className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-3 rounded-full text-[14px] font-medium hover:bg-gray-100 transition-colors self-start lg:self-auto whitespace-nowrap">
                {t.wilayaCta} <span className="rtl:rotate-180">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[820px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <Eyebrow>{t.ebFaq}</Eyebrow>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">{t.faqTitle}</h2>
          </div>
          <div className="divide-y divide-gray-100 border-y border-gray-100">
            {t.faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="cursor-pointer text-[15px] font-medium text-gray-900 list-none flex items-center justify-between gap-4 group-hover:text-blue-600 transition-colors">
                  {f.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-2xl leading-none shrink-0">+</span>
                </summary>
                <p className="mt-3 text-[14px] text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Prose + related */}
      <section className="py-20 sm:py-24 border-b border-gray-100">
        <div className="max-w-[820px] mx-auto px-5 sm:px-8">
          <h2 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] text-gray-900 mb-5">{t.proseTitle}</h2>
          <div className="space-y-4 text-[15px] text-gray-500 leading-[1.8]">
            {t.prose.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide mt-10 mb-4">{t.relatedTitle}</h3>
          <div className="flex flex-wrap gap-2">
            {RELATED.map((q) => (
              <span key={q} className="inline-block px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[13px] text-gray-500">{q}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="py-20 sm:py-28 text-center">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.025em] text-gray-900 mb-4">{t.finalTitle}</h2>
          <p className="text-[16px] text-gray-500 max-w-[560px] mx-auto mb-9">{t.finalText}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/register" className={btnPrimary}>{t.finalCta}</Link>
            <a href="tel:+213549575512" className="inline-flex items-center justify-center px-7 py-3.5 text-[14px] font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-300 transition-colors" dir="ltr">+213 549 57 55 12</a>
          </div>
        </div>
      </section>

      <SiteFooter lang={locale} />
    </div>
  );
}
