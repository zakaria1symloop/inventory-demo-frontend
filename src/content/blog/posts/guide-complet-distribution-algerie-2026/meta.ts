import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'guide-complet-distribution-algerie-2026',
  category: 'guides',
  date: '2026-05-09',
  readTime: 22,
  author: 'TrackSera',
  emoji: '📚',
  gradient: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
  countries: ['DZ'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  pillar: true,
  faqs: [
    {
      question: {
        ar: 'ما حجم سوق التوزيع في الجزائر؟',
        fr: 'Quelle est la taille du marché de la distribution en Algérie ?',
        en: 'How big is the Algerian distribution market?',
      },
      answer: {
        ar: 'سوق التوزيع الجزائري يُقدر بأكثر من 8 تريليون دج سنويًا (2025)، مع نمو 4-6% سنويًا. القطاع الغذائي يمثل 35%، الأجهزة الكهربائية 12%، الأدوية 9%، البقية متفرقة على القطاعات الأخرى.',
        fr: "Le marché distribution algérien est estimé à plus de 8 billions DA par an (2025), avec une croissance 4-6% par an. L'alimentaire représente 35%, l'électroménager 12%, la pharmacie 9%, le reste dispersé sur d'autres secteurs.",
        en: 'The Algerian distribution market is estimated at over $60 billion per year (2025), growing 4-6% annually. Food represents 35%, home appliances 12%, pharma 9%, with the rest spread across other sectors.',
      },
    },
    {
      question: {
        ar: 'كم موزع نشط في الجزائر؟',
        fr: "Combien de distributeurs actifs en Algérie ?",
        en: 'How many active distributors operate in Algeria?',
      },
      answer: {
        ar: 'حوالي 28,000-35,000 شركة توزيع مُسجلة في CNRC، منها 80% PME (شركات صغيرة ومتوسطة) بأقل من 50 موظف. 60% منها مركز في 6 ولايات: الجزائر، البليدة، وهران، قسنطينة، سطيف، عنابة.',
        fr: 'Environ 28 000-35 000 sociétés de distribution enregistrées au CNRC, dont 80% sont des PME (&lt; 50 employés). 60% concentrées dans 6 wilayas : Alger, Blida, Oran, Constantine, Sétif, Annaba.',
        en: 'Roughly 28,000-35,000 distribution companies are registered with the national trade registry. About 80% are SMEs with fewer than 50 employees, and 60% are concentrated in 6 regions: Algiers, Blida, Oran, Constantine, Setif and Annaba.',
      },
    },
    {
      question: {
        ar: 'ما الفرق بين الموزع والوكيل والوسيط؟',
        fr: "Quelle différence entre distributeur, agent et intermédiaire ?",
        en: 'What is the difference between a distributor, an agent and a broker?',
      },
      answer: {
        ar: 'الموزع: يشتري ويبيع باسمه (يأخذ ملكية البضاعة، يتحمل المخزون والمخاطر). الوكيل: يبيع باسم العلامة التجارية ويتقاضى عمولة (لا يأخذ الملكية). الوسيط: يربط البائع بالمشتري ويأخذ نسبة على الصفقة (لا مخزون، لا تسليم).',
        fr: "Distributeur : achète et revend en son nom (prend la propriété, supporte stock et risque). Agent : vend au nom de la marque contre commission (ne prend pas la propriété). Intermédiaire : connecte vendeur et acheteur contre pourcentage (pas de stock, pas de livraison).",
        en: 'Distributor: buys and resells in their own name, takes ownership of the goods and carries the stock risk. Agent: sells under the brand owner\'s name in exchange for commission, never takes ownership. Broker: connects buyer and seller for a fee, holds no stock and handles no delivery.',
      },
    },
    {
      question: {
        ar: 'هل يحتاج الموزع إلى تأمين؟',
        fr: "Un distributeur a-t-il besoin d'une assurance ?",
        en: 'Does a distributor need insurance?',
      },
      answer: {
        ar: 'إجباري: تأمين المركبات (أساسي + شامل)، تأمين المسؤولية المدنية المهنية. مُوصى به: تأمين المخزون (ضد الحريق والسرقة)، تأمين النقل، تأمين خسائر التشغيل. التكلفة الإجمالية: 80,000-300,000 دج/سنة حسب الحجم.',
        fr: "Obligatoire : assurance véhicules (basique + tous risques), responsabilité civile professionnelle. Recommandé : assurance stock (incendie + vol), transport, pertes d'exploitation. Coût total : 80 000-300 000 DA/an selon échelle.",
        en: 'Mandatory: vehicle insurance (basic + comprehensive) and professional third-party liability. Recommended: stock insurance (fire + theft), in-transit cover, business interruption. Typical total cost: $600-$2,300 per year depending on scale.',
      },
    },
    {
      question: {
        ar: 'متى يجب توظيف أول موظف؟',
        fr: 'Quand recruter le premier employé ?',
        en: 'When should I hire my first employee?',
      },
      answer: {
        ar: 'عندما تتجاوز 60-80 ساعة عمل أسبوعيًا بنفسك ولا يمكنك التوسع. الترتيب النموذجي للتوظيفات: (1) سائق، (2) محاسب جزئي، (3) إداري للفواتير، (4) مسؤول مخزون، (5) ممثل تجاري. لا توظف مديرًا قبل 5 موظفين.',
        fr: 'Quand vous dépassez 60-80h/semaine vous-même sans pouvoir grandir. Ordre typique : (1) livreur, (2) comptable temps partiel, (3) administratif factures, (4) magasinier, (5) commercial. Ne recrutez pas de manager avant 5 employés.',
        en: 'When you cross 60-80 hours per week yourself and can no longer grow. Typical hiring order: (1) driver, (2) part-time accountant, (3) invoicing admin, (4) warehouse keeper, (5) sales rep. Do not hire a manager before you have at least 5 employees.',
      },
    },
    {
      question: {
        ar: 'كم تستغرق الشركة لتصبح مربحة؟',
        fr: "Combien de temps pour qu'une société devienne rentable ?",
        en: 'How long until a distribution company becomes profitable?',
      },
      answer: {
        ar: 'متوسط في التوزيع الجزائري: 12-24 شهرًا للوصول إلى نقطة التعادل (المصاريف = الإيرادات)، 24-36 شهرًا للربحية الفعلية (هامش صافي إيجابي مستدام). الشركات المُستوية على 4 أرجل (منتج جيد، مكان جيد، إدارة جيدة، أدوات جيدة) تصل أسرع.',
        fr: "Moyenne en distribution algérienne : 12-24 mois pour atteindre le seuil de rentabilité (charges = recettes), 24-36 mois pour rentabilité réelle (marge nette positive durable). Les sociétés sur 4 piliers (bon produit, bon emplacement, bonne gestion, bons outils) y arrivent plus vite.",
        en: 'In Algerian distribution the average is 12-24 months to break even (costs = revenue) and 24-36 months for sustained net profitability. Companies built on the 4 pillars — right product, right location, right management, right tools — reach it noticeably faster.',
      },
    },
    {
      question: {
        ar: 'ما أكبر التحديات للموزعين الجزائريين؟',
        fr: 'Quels sont les plus gros défis des distributeurs algériens ?',
        en: 'What are the biggest challenges for distributors in Algeria?',
      },
      answer: {
        ar: '(1) الاضطرابات في سلسلة التوريد (تأخر الاستيراد، نقص العملات الأجنبية). (2) إدارة السيولة (المتأخرات، الموردون يطلبون نقدًا). (3) جذب الموظفين الجيدين (السائقين خاصة). (4) التحول الرقمي (Excel وحده لم يعد كافيًا). (5) المنافسة من اللاعبين الجدد والمنصات الإلكترونية.',
        fr: "(1) Perturbations chaîne d'approvisionnement (retards import, manque devises). (2) Gestion trésorerie (impayés, fournisseurs exigent cash). (3) Attirer du bon personnel (livreurs surtout). (4) Digitalisation (Excel seul ne suffit plus). (5) Concurrence nouveaux entrants et plateformes en ligne.",
        en: '(1) Supply-chain disruption (import delays, FX shortages). (2) Cash-flow management (overdue receivables, suppliers demanding cash). (3) Attracting good people (drivers in particular). (4) Digitization pressure (Excel alone no longer cuts it). (5) Competition from new entrants and online platforms.',
      },
    },
    {
      question: {
        ar: 'ما أبرز الفرص في 2026؟',
        fr: 'Quelles sont les meilleures opportunités en 2026 ?',
        en: 'What are the best opportunities in 2026?',
      },
      answer: {
        ar: '(1) السلاسل الباردة (الطلب على الطازج المُجمد ينمو بسرعة). (2) المناطق غير المُغطاة (الجنوب، الهضاب العليا). (3) المنتجات المتخصصة (بيولوجية، حلال مُعتمد). (4) الخدمات اللوجستية للتجارة الإلكترونية (Yassir، Numerylo). (5) الموزعون "B2B2C" يخدمون مباشرة المتاجر الصغيرة.',
        fr: "(1) Chaînes du froid (demande frais/surgelé en croissance rapide). (2) Zones sous-couvertes (Sud, Hauts-Plateaux). (3) Produits spécialisés (bio, halal certifié). (4) Logistique e-commerce (Yassir, Numerylo). (5) Distributeurs \"B2B2C\" servant directement les petits commerces.",
        en: '(1) Cold chain (fast-growing fresh/frozen demand). (2) Underserved regions (south, high plateaus). (3) Specialty products (organic, certified halal). (4) Logistics for e-commerce platforms. (5) B2B2C operators serving small retailers directly, cutting out classic wholesale layers.',
      },
    },
  ],
};

export default post;
