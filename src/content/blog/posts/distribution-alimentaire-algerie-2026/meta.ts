import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'distribution-alimentaire-algerie-2026',
  category: 'industry',
  date: '2026-05-09',
  readTime: 10,
  author: 'TrackSera',
  emoji: '🥖',
  gradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
  countries: ['DZ', 'MA', 'TN', 'EG'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  faqs: [
    {
      question: {
        ar: 'كيف يجب إدارة تواريخ الصلاحية في التوزيع الغذائي؟',
        fr: 'Comment gérer les dates de péremption (DLC) en distribution alimentaire ?',
        en: 'How should expiry dates be managed in food distribution?',
      },
      answer: {
        ar: 'الأساس: تتبع DLC لكل دفعة (lot)، تطبيق نظام FEFO (First Expired First Out) — الأقرب صلاحية يخرج أولاً، تنبيه آلي عند الاقتراب من انتهاء الصلاحية (30 يومًا)، فصل المنتجات قرب الانتهاء في مخزون "تخفيضات".',
        fr: 'Essentiels : tracer la DLC par lot, appliquer FEFO (First Expired First Out) — le plus proche péremption sort en premier, alertes automatiques à l\'approche (30 jours), séparation des produits proches en stock "déstockage".',
        en: 'Track expiry per batch, apply FEFO (First Expired, First Out) so the closest-expiry batch ships first, set automatic alerts 30 days before expiry, and move near-expiry SKUs to a separate clearance stock pool.',
      },
    },
    {
      question: {
        ar: 'ما المنتجات الغذائية الأساسية المدعومة من الدولة؟',
        fr: "Quels sont les produits alimentaires subventionnés par l'État ?",
        en: 'Which food products are typically price-regulated?',
      },
      answer: {
        ar: 'القائمة الرئيسية 2026: الخبز، السميد، الدقيق، الحليب المُجفف، الزيت الغذائي، السكر، البقول الجافة. هذه المنتجات لها أسعار مُحددة من الدولة، وهامش الموزع منظم. Beware: تجاوز السعر الرسمي = غرامة.',
        fr: "Liste principale 2026 : pain, semoule, farine, lait en poudre, huile alimentaire, sucre, légumes secs. Ces produits ont des prix réglementés par l'État, la marge distributeur encadrée. Attention : dépasser le prix officiel = amende.",
        en: 'Across North Africa, the typical regulated basket is: bread, semolina, flour, powdered milk, cooking oil, sugar, dried legumes. Retail prices are set by the state and the distributor margin is capped. Exceeding the official price triggers fines.',
      },
    },
    {
      question: {
        ar: 'ما تكلفة السلسلة الباردة في الجزائر؟',
        fr: 'Quel est le coût de la chaîne du froid en Algérie ?',
        en: 'How much does cold-chain capability really cost?',
      },
      answer: {
        ar: 'مركبة باردة (تبريد + تجميد): 600,000-1,200,000 دج إضافية على عربة عادية. الاستهلاك: +30% وقود. الصيانة: 2× عربة عادية. لكن المنتجات الباردة تحقق هامشًا أعلى (+5-8 نقاط) مما يبرر الاستثمار في قطاعات مثل الألبان والمثلجات.',
        fr: "Véhicule froid (frigo + congélation) : 600 000 à 1 200 000 DA en plus d'un véhicule normal. Conso : +30% carburant. Entretien : 2× normal. Mais les produits froids ont une marge supérieure (+5-8 points), ce qui justifie l'investissement pour laitiers/glaces.",
        en: 'A refrigerated truck (chilled + frozen) costs roughly $4,500-$9,000 more than a dry van. Fuel consumption rises ~30%, maintenance is about 2× a regular truck. Cold-chain SKUs carry 5-8 extra margin points, which usually justifies the investment for dairy and frozen segments.',
      },
    },
    {
      question: {
        ar: 'كم تستغرق المنتجات الغذائية في المخزون؟',
        fr: 'Quel est le temps de stockage typique en alimentaire ?',
        en: 'What are typical shelf lives in food distribution?',
      },
      answer: {
        ar: 'يختلف بشدة: المعكرونة الجافة 90-180 يوم، البسكويت 60-120، المعلبات 6-24 شهر، الزبادي 21 يوم، الحليب الطازج 5-7 أيام، الخبز يوم واحد. هذا يحدد سرعة الدوران المطلوبة وحجم المخزون.',
        fr: 'Très variable : pâtes sèches 90-180 jours, biscuits 60-120, conserves 6-24 mois, yaourts 21 jours, lait frais 5-7 jours, pain 1 jour. Cela détermine la rotation cible et le niveau de stock à maintenir.',
        en: 'It varies widely: dry pasta 90-180 days, biscuits 60-120, canned goods 6-24 months, yogurts 21 days, fresh milk 5-7 days, bread just 1 day. This dictates target turnover and how much stock you can safely hold.',
      },
    },
    {
      question: {
        ar: 'هل يمكنني توزيع الغذاء بدون شهادة صحية؟',
        fr: "Puis-je distribuer de l'alimentaire sans certificat sanitaire ?",
        en: 'Can I distribute food without a sanitary certificate?',
      },
      answer: {
        ar: 'لا. كل موزع غذائي يحتاج: شهادة المراقبة الصحية البلدية، تأهيل المستودع من DSV (التفتيش البيطري للأغذية الحيوانية)، شهادة FSV لكل سائق، تجديد سنوي. بدون هذه الوثائق، النشاط غير قانوني.',
        fr: "Non. Tout distributeur alimentaire doit avoir : certificat de salubrité communal, agrément entrepôt DSV (inspection vétérinaire pour produits animaux), carnet sanitaire pour chaque livreur, renouvellement annuel. Sans ces documents, l'activité est illégale.",
        en: 'No. Any food distributor must hold a municipal sanitary certificate, warehouse approval from the veterinary authority (for animal products), a sanitary record for each driver, all renewed annually. Operating without these documents is illegal.',
      },
    },
  ],
};

export default post;
