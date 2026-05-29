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
  challengesTitle: string;
  challenges: { icon: string; t: string; d: string }[];
  featuresTitle: string;
  featuresSub: string;
  features: { icon: string; t: string; d: string }[];
  stepsTitle: string;
  steps: { t: string; d: string }[];
  audiencesTitle: string;
  audiencesSub: string;
  audiences: string[];
  sectorsCta: string;
  allSectors: string;
  wilayaTitle: string;
  wilayaText: string;
  wilayaCta: string;
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
    badge: 'Logiciel de distribution',
    h1a: 'Le logiciel de gestion de la',
    h1b: 'distribution en Algérie',
    sub: 'TrackSera pilote toute votre distribution : prévente, vente directe (CashVan), tournées, suivi GPS des livreurs, recouvrement, stock multi-dépôts et facturation conforme — web + mobile, même hors-ligne.',
    ctaTrial: 'Essai gratuit',
    ctaPricing: 'Voir les tarifs',
    ctaDemo: 'Demander une démo',
    metric1: '58 wilayas',
    metric2: 'Hors-ligne',
    metric3: 'AR / FR',
    cardTitle: 'Ventes du jour',
    cardDelta: '+24%',
    challengesTitle: 'Le défi de la distribution en Algérie',
    challenges: [
      { icon: '🚚', t: 'Tournées désorganisées', d: 'Itinéraires non optimisés, livreurs injoignables, bons sur papier perdus.' },
      { icon: '💸', t: 'Recouvrement hors de contrôle', d: 'Impossible de savoir qui doit combien ni ce que chaque vendeur a encaissé.' },
      { icon: '📦', t: 'Stock invisible', d: 'Ruptures, surstocks et écarts entre le dépôt et le stock des camions.' },
      { icon: '🧾', t: 'Facturation non conforme', d: 'Factures manuelles, TVA et mentions obligatoires mal gérées.' },
    ],
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
    stepsTitle: 'Comment ça marche',
    steps: [
      { t: 'Prévente', d: 'Le délégué visite le client et saisit la commande sur mobile.' },
      { t: 'Tournée', d: 'La commande est préparée et affectée à une tournée optimisée.' },
      { t: 'Livraison', d: 'Le livreur ou le CashVan livre, encaisse et imprime le ticket.' },
      { t: 'Reporting', d: 'Encaissements, créances et performances remontent au back-office.' },
    ],
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
    allSectors: 'Tous les secteurs →',
    wilayaTitle: 'Disponible dans les 58 wilayas',
    wilayaText: 'D’Alger à Tamanrasset, TrackSera est 100% en ligne et accessible partout en Algérie.',
    wilayaCta: 'Distribution par wilaya →',
    faqTitle: 'Questions fréquentes',
    faqs: [
      { q: 'Qu’est-ce qu’un logiciel de gestion de la distribution ?', a: 'Une plateforme qui pilote la prise de commande (prévente), la vente directe (CashVan), les tournées, le stock, le recouvrement et la facturation — TrackSera réunit tout, web + mobile.' },
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
    finalCta: 'Essai gratuit',
  },
  ar: {
    badge: 'برنامج التوزيع',
    h1a: 'برنامج إدارة',
    h1b: 'التوزيع في الجزائر',
    sub: 'تراكسيرا يدير توزيعك بالكامل: البيع المسبق، البيع المتنقل (كاش فان)، الجولات، تتبع السائقين عبر GPS، تحصيل الديون، المخزون متعدد المستودعات والفوترة المطابقة — ويب وموبايل، حتى بدون إنترنت.',
    ctaTrial: 'ابدأ مجاناً',
    ctaPricing: 'الأسعار',
    ctaDemo: 'اطلب عرضاً',
    metric1: '58 ولاية',
    metric2: 'بدون إنترنت',
    metric3: 'عربي / فرنسي',
    cardTitle: 'مبيعات اليوم',
    cardDelta: '+24%',
    challengesTitle: 'تحديات التوزيع في الجزائر',
    challenges: [
      { icon: '🚚', t: 'جولات غير منظمة', d: 'مسارات غير محسّنة، سائقون يصعب الوصول إليهم، وأوراق تضيع.' },
      { icon: '💸', t: 'تحصيل خارج السيطرة', d: 'يصعب معرفة من عليه دين وكم حصّل كل بائع في الميدان.' },
      { icon: '📦', t: 'مخزون غير واضح', d: 'نقص وفائض وفروقات بين المستودع ومخزون الشاحنات.' },
      { icon: '🧾', t: 'فوترة غير مطابقة', d: 'فواتير يدوية وضريبة وبيانات إلزامية غير مضبوطة.' },
    ],
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
    stepsTitle: 'كيف يعمل',
    steps: [
      { t: 'البيع المسبق', d: 'المندوب يزور الزبون ويسجّل الطلب على الموبايل.' },
      { t: 'الجولة', d: 'يُجهَّز الطلب ويُسنَد إلى جولة محسّنة.' },
      { t: 'التوصيل', d: 'السائق أو الكاش فان يوصّل، يحصّل ويطبع الوصل.' },
      { t: 'التقارير', d: 'التحصيلات والديون والأداء تصل تلقائياً للإدارة.' },
    ],
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
    allSectors: 'كل القطاعات →',
    wilayaTitle: 'متوفّر في 58 ولاية',
    wilayaText: 'من الجزائر العاصمة إلى تمنراست، تراكسيرا 100% عبر الإنترنت ومتاح في كل الجزائر.',
    wilayaCta: 'التوزيع حسب الولاية →',
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
    finalCta: 'ابدأ مجاناً',
  },
  en: {
    badge: 'Distribution software',
    h1a: 'Distribution management',
    h1b: 'software for Algeria',
    sub: 'TrackSera runs your whole distribution: pre-sales, van sales (CashVan), routes, GPS driver tracking, debt collection, multi-warehouse stock and compliant invoicing — web + mobile, even offline.',
    ctaTrial: 'Free trial',
    ctaPricing: 'Pricing',
    ctaDemo: 'Request a demo',
    metric1: '58 wilayas',
    metric2: 'Offline',
    metric3: 'AR / FR',
    cardTitle: 'Today’s sales',
    cardDelta: '+24%',
    challengesTitle: 'The distribution challenge in Algeria',
    challenges: [
      { icon: '🚚', t: 'Messy routes', d: 'Unoptimised routes, unreachable drivers, lost paper notes.' },
      { icon: '💸', t: 'Collection out of control', d: 'No clear view of who owes what or what each rep collected.' },
      { icon: '📦', t: 'Invisible stock', d: 'Stockouts, overstock and gaps between depot and van stock.' },
      { icon: '🧾', t: 'Non-compliant invoicing', d: 'Manual invoices, mishandled VAT and required fields.' },
    ],
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
    stepsTitle: 'How it works',
    steps: [
      { t: 'Pre-sale', d: 'The rep visits the client and enters the order on mobile.' },
      { t: 'Route', d: 'The order is prepared and assigned to an optimised route.' },
      { t: 'Delivery', d: 'The driver or CashVan delivers, collects and prints the receipt.' },
      { t: 'Reporting', d: 'Collections, debts and performance flow back to the back-office.' },
    ],
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
    allSectors: 'All sectors →',
    wilayaTitle: 'Available in all 58 wilayas',
    wilayaText: 'From Algiers to Tamanrasset, TrackSera is 100% online and available everywhere in Algeria.',
    wilayaCta: 'Distribution by wilaya →',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What is distribution management software?', a: 'A platform that runs pre-sales, van sales (CashVan), routes, stock, collection and invoicing — TrackSera brings it all together, web + mobile.' },
      { q: 'Does it work without Internet?', a: 'Yes, the seller, driver and CashVan apps work offline and sync when back online.' },
      { q: 'Does it handle pre-sales AND van sales?', a: 'Yes: pre-sales (delivered later) and direct/van sales (instant sale and collection).' },
      { q: 'Is it suited to wholesalers in Algeria?', a: 'Yes, for distributors, wholesalers and resellers across all 58 wilayas.' },
      { q: 'Is invoicing compliant?', a: 'Yes: VAT, fiscal stamp and required fields, with professional PDF export.' },
      { q: 'How much does it cost?', a: 'A free plan to start, Starter at 4,500 DZD/month, and unlimited Business on quote.' },
    ],
    proseTitle: 'TrackSera, distribution software built for Algeria',
    prose: [
      'TrackSera is distribution management software for distributors, wholesalers and resellers in Algeria: pre-sales, van sales (CashVan), driver and route management, collection and invoicing — in one web + mobile platform.',
      'With CashVan your sellers sell from the van and collect on the spot; in pre-sales your reps take the order and send it to the depot. GPS tracking and real-time reports give you full visibility.',
      'It all works online and offline, across all 58 wilayas — the modern way to replace paper and Excel with a real distribution system.',
    ],
    relatedTitle: 'Frequent searches',
    finalTitle: 'Ready to digitalise your distribution?',
    finalText: 'Start free and take back control of your routes, stock and collection.',
    finalCta: 'Free trial',
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

/* ─────────────────────────── animated hero art ─────────────────────────── */

// Route the truck drives along (SMIL animateMotion follows this exact path).
const ROUTE = 'M 36 232 C 150 232 150 120 264 120 C 372 120 372 232 480 232 C 588 232 600 120 724 128';

function HeroArt({ cardTitle, cardDelta }: { cardTitle: string; cardDelta: string }) {
  return (
    <div className="dst-art relative w-full">
      <svg viewBox="0 0 760 300" className="w-full h-auto" role="img" aria-label="Carte de distribution en temps réel">
        <defs>
          <linearGradient id="dstRoad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="0.5" stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <filter id="dstGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="dstHalo" cx="50%" cy="45%" r="55%">
            <stop offset="0" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="380" cy="140" rx="350" ry="150" fill="url(#dstHalo)" />

        {/* city skyline */}
        <g opacity="0.7">
          {[[0, 40], [36, 24], [64, 56], [100, 32], [132, 50], [168, 22], [200, 60], [240, 36], [276, 52], [316, 28], [350, 46], [388, 60], [428, 32], [462, 50], [500, 24], [536, 56], [574, 38], [612, 52], [650, 30], [688, 48], [724, 40]].map(([x, h], i) => (
            <rect key={i} x={x} y={300 - h} width="28" height={h} fill="#111a33" />
          ))}
        </g>

        {/* faint dot grid */}
        <g opacity="0.12">
          {Array.from({ length: 5 }).map((_, r) =>
            Array.from({ length: 19 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={20 + c * 40} cy={24 + r * 34} r="1.3" fill="#fff" />
            )),
          )}
        </g>

        {/* base road */}
        <path d={ROUTE} fill="none" stroke="#1e293b" strokeWidth="16" strokeLinecap="round" />
        <path d={ROUTE} fill="none" stroke="#475569" strokeWidth="2.5" strokeDasharray="1 13" strokeLinecap="round" />
        {/* glowing progress trace */}
        <path className="dst-draw" d={ROUTE} fill="none" stroke="url(#dstRoad)" strokeWidth="5" strokeLinecap="round" filter="url(#dstGlow)" />

        {/* depot (start) */}
        <g transform="translate(18 206)">
          <rect x="0" y="8" width="36" height="28" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <path d="M0 14 L18 0 L36 14 Z" fill="#334155" />
          <rect x="13" y="20" width="10" height="16" rx="1" fill="#22d3ee" opacity="0.9" />
        </g>

        {/* client nodes (neon pulse) */}
        {[
          [264, 120],
          [480, 232],
        ].map(([cx, cy], i) => (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <circle className="dst-ping" cx="0" cy="0" r="8" fill="#22d3ee" opacity="0.3" style={{ animationDelay: `${i * 0.8}s` }} />
            <circle cx="0" cy="0" r="4.5" fill="#22d3ee" filter="url(#dstGlow)" />
          </g>
        ))}

        {/* destination pin (end) */}
        <g transform="translate(724 128)">
          <path className="dst-pin" d="M0 -26 C 12 -26 16 -16 16 -10 C 16 0 0 8 0 8 C 0 8 -16 0 -16 -10 C -16 -16 -12 -26 0 -26 Z" fill="#f43f5e" filter="url(#dstGlow)" />
          <circle cx="0" cy="-12" r="5" fill="#fff" />
        </g>

        {/* truck — drives along ROUTE via SMIL animateMotion */}
        <g className="dst-truck" filter="url(#dstGlow)">
          <g transform="translate(-20 -13)">
            <rect x="-2" y="0" width="26" height="20" rx="2.5" fill="#f8fafc" stroke="#6366f1" strokeWidth="1.5" />
            <path d="M24 6 L33 6 L39 13 L39 20 L24 20 Z" fill="#6366f1" />
            <rect x="27" y="9" width="7" height="6" rx="1" fill="#a5f3fc" />
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

      {/* dark glass analytics card */}
      <div className="dst-card absolute -bottom-4 ltr:right-1 rtl:left-1 w-[200px] rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 p-3.5 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-200">{cardTitle}</span>
          <span className="text-[11px] font-bold text-emerald-300">{cardDelta}</span>
        </div>
        <div className="flex items-end gap-1.5 h-14">
          {[40, 62, 48, 78, 95, 70].map((h, i) => (
            <div
              key={i}
              className="dst-bar flex-1 rounded-t bg-gradient-to-t from-cyan-400 to-indigo-400"
              style={{ height: `${h}%`, animationDelay: `${0.6 + i * 0.12}s` }}
            />
          ))}
        </div>
        <svg viewBox="0 0 160 30" className="mt-1 w-full h-5">
          <polyline className="dst-trend" points="0,26 32,20 64,22 96,10 128,12 160,3" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

const ANIM_CSS = `
.dst-rise{opacity:0;transform:translateY(22px);animation:dstRise .7s cubic-bezier(.16,1,.3,1) forwards}
@keyframes dstRise{to{opacity:1;transform:none}}
.dst-draw{stroke-dasharray:1100;stroke-dashoffset:1100;animation:dstDraw 2.4s ease-out .2s forwards}
@keyframes dstDraw{to{stroke-dashoffset:0}}
.dst-bar{transform-origin:bottom;transform:scaleY(0);animation:dstBar .7s cubic-bezier(.16,1,.3,1) forwards}
@keyframes dstBar{to{transform:scaleY(1)}}
.dst-card{opacity:0;animation:dstRise .7s cubic-bezier(.16,1,.3,1) 1s forwards}
.dst-trend{stroke-dasharray:230;stroke-dashoffset:230;animation:dstDraw 1.2s ease-out 1.3s forwards}
.dst-ping{transform-origin:center;animation:dstPing 2s ease-out infinite}
@keyframes dstPing{0%{transform:scale(.6);opacity:.55}80%,100%{transform:scale(2.6);opacity:0}}
.dst-pin{transform-origin:center bottom;animation:dstBob 2.4s ease-in-out infinite}
@keyframes dstBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.dst-aurora{position:absolute;border-radius:9999px;filter:blur(80px);opacity:.55;pointer-events:none}
.dst-aurora.a1{animation:dstDrift1 17s ease-in-out infinite}
.dst-aurora.a2{animation:dstDrift2 21s ease-in-out infinite}
@keyframes dstDrift1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
@keyframes dstDrift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,28px)}}
.dst-grad{background:linear-gradient(100deg,#38bdf8,#818cf8,#c084fc);-webkit-background-clip:text;background-clip:text;color:transparent}
.dst-tile{transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s,border-color .25s}
.dst-tile:hover{transform:translateY(-4px)}
.dst-glow{box-shadow:0 14px 44px -12px rgba(99,102,241,.7)}
@media (prefers-reduced-motion: reduce){
  .dst-rise,.dst-card{opacity:1!important;transform:none!important;animation:none!important}
  .dst-draw,.dst-trend{stroke-dashoffset:0!important;animation:none!important}
  .dst-bar{transform:none!important;animation:none!important}
  .dst-truck,.dst-ping,.dst-pin,.dst-aurora{animation:none!important}
}
`;

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

      {/* Hero — dark luminous control room */}
      <section className="relative overflow-hidden bg-[#0b1020] text-white">
        <div className="dst-aurora a1" style={{ width: 440, height: 440, top: -140, left: -90, background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
        <div className="dst-aurora a2" style={{ width: 480, height: 480, bottom: -180, right: -110, background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-20 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="dst-rise inline-flex items-center gap-2 text-[12px] font-semibold tracking-wider uppercase bg-white/10 ring-1 ring-white/15 rounded-full px-3 py-1 mb-5 text-cyan-200" style={{ animationDelay: '0.05s' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />{t.badge}
            </p>
            <h1 className="text-4xl md:text-[3.3rem] font-extrabold leading-[1.06] tracking-tight">
              <span className="dst-rise block" style={{ animationDelay: '0.12s' }}>{t.h1a}</span>
              <span className="dst-rise block dst-grad" style={{ animationDelay: '0.22s' }}>{t.h1b}</span>
            </h1>
            <p className="dst-rise mt-6 text-base md:text-lg text-slate-300 max-w-xl leading-relaxed" style={{ animationDelay: '0.34s' }}>{t.sub}</p>
            <div className="dst-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '0.46s' }}>
              <Link href="/register" className="dst-glow px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-white font-bold hover:brightness-110 transition">{t.ctaTrial}</Link>
              <Link href="/tarifs" className="px-6 py-3 rounded-xl bg-white/10 ring-1 ring-white/20 text-white font-semibold hover:bg-white/15 transition">{t.ctaPricing}</Link>
              <a href="#contact" className="px-6 py-3 rounded-xl text-slate-300 font-semibold hover:text-white transition">{t.ctaDemo} →</a>
            </div>
            <div className="dst-rise mt-9 flex flex-wrap gap-2.5" style={{ animationDelay: '0.58s' }}>
              {[t.metric1, t.metric2, t.metric3].map((m) => (
                <span key={m} className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-3.5 py-1.5 text-[13px] text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400" />{m}
                </span>
              ))}
            </div>
          </div>
          <div className="dst-rise" style={{ animationDelay: '0.3s' }}>
            <div className="relative rounded-3xl bg-white/5 ring-1 ring-white/10 p-4 backdrop-blur-sm">
              <HeroArt cardTitle={t.cardTitle} cardDelta={t.cardDelta} />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      </section>

      {/* Stat band */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: '58', l: isRtl ? 'ولاية' : locale === 'en' ? 'Wilayas' : 'Wilayas' },
            { v: '3', l: isRtl ? 'تطبيقات موبايل' : locale === 'en' ? 'Mobile apps' : 'Applications mobiles' },
            { v: '100%', l: isRtl ? 'بدون إنترنت' : locale === 'en' ? 'Offline' : 'Hors-ligne' },
            { v: '24/7', l: isRtl ? 'سحابي' : locale === 'en' ? 'Cloud' : 'Cloud' },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl md:text-4xl font-extrabold dst-grad">{s.v}</div>
              <div className="text-[13px] text-gray-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Challenges */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-10">{t.challengesTitle}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.challenges.map((c) => (
            <div key={c.t} className="dst-tile p-6 rounded-2xl border border-gray-200 bg-white hover:border-rose-200 hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 ring-1 ring-rose-200/60 flex items-center justify-center text-2xl mb-4">{c.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1.5">{c.t}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">{t.featuresTitle}</h2>
          <p className="text-gray-600 max-w-3xl mb-10">{t.featuresSub}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.map((f) => (
              <div key={f.t} className="dst-tile group p-6 rounded-2xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-2xl mb-4 shadow-lg shadow-indigo-500/25">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1.5">{f.t}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-10">{t.stepsTitle}</h2>
        <div className="grid gap-6 md:grid-cols-4">
          {t.steps.map((s, i) => (
            <div key={s.t} className="p-6 rounded-2xl border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-4">{i + 1}</div>
              <h3 className="font-bold text-gray-900 mb-1.5">{s.t}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audiences + sectors */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">{t.audiencesTitle}</h2>
          <p className="text-gray-600 max-w-3xl mb-8">{t.audiencesSub}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {t.audiences.map((a) => (
              <div key={a} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm font-medium text-gray-800">{a}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SECTORS.slice(0, 8).map((s) => (
              <Link key={s.slug} href={`/secteurs/${s.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors">
                <span>{s.emoji}</span> {t.sectorsCta} {isRtl ? s.name.ar : s.name.fr}
              </Link>
            ))}
            <Link href="/secteurs" className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">{t.allSectors}</Link>
          </div>
        </div>
      </section>

      {/* Wilaya band */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-10 md:p-12">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">{t.wilayaTitle}</h2>
          <p className="text-blue-100 max-w-2xl mb-6">{t.wilayaText}</p>
          <Link href="/distribution" className="inline-block px-6 py-3 rounded-lg bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors">{t.wilayaCta}</Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8">{t.faqTitle}</h2>
          <div className="space-y-4">
            {t.faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-gray-200 bg-white p-5">
                <summary className="cursor-pointer font-bold text-gray-900 list-none flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-blue-600 group-open:rotate-45 transition-transform text-2xl leading-none shrink-0">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Prose + related */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-5">{t.proseTitle}</h2>
        <div className="space-y-4 text-gray-600 leading-relaxed text-[15px]">
          {t.prose.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mt-10 mb-4">{t.relatedTitle}</h3>
        <div className="flex flex-wrap gap-2">
          {RELATED.map((q) => (
            <span key={q} className="inline-block px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-[13px] text-gray-600">{q}</span>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-4">{t.finalTitle}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">{t.finalText}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/register" className="px-8 py-3.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">{t.finalCta}</Link>
          <a href="tel:+213549575512" className="px-8 py-3.5 rounded-lg border border-gray-300 text-gray-800 font-semibold hover:border-blue-400 hover:text-blue-700 transition-colors" dir="ltr">+213 549 57 55 12</a>
        </div>
      </section>

      <SiteFooter lang={locale} />
    </div>
  );
}
