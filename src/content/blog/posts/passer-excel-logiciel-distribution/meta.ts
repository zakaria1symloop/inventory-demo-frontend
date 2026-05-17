import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'passer-excel-logiciel-distribution',
  category: 'guides',
  date: '2026-05-09',
  readTime: 10,
  author: 'TrackSera',
  emoji: '🚀',
  gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
  countries: ['DZ', 'MA', 'TN', 'SN', 'CI', 'CM'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  howTo: {
    name: {
      ar: 'كيف تنتقل من Excel إلى برنامج إدارة التوزيع',
      fr: "Comment migrer d'Excel vers un logiciel de gestion de distribution",
      en: 'How to migrate from Excel to distribution management software',
    },
    steps: [
      {
        name: {
          ar: 'تنظيف بيانات Excel',
          fr: 'Nettoyer vos données Excel',
          en: 'Clean your Excel data',
        },
        text: {
          ar: 'افتح ملفات العملاء والمنتجات. أزل التكرارات، صحح الأخطاء الإملائية، وحد البيانات (مثلًا "بليدة" بدلاً من "Blida" و "Blidah").',
          fr: 'Ouvrez vos fichiers clients et produits. Supprimez les doublons, corrigez les fautes, et uniformisez les données (ex. "Blida" partout, pas "Blidah" ou "بليدة" mélangés).',
          en: 'Open your customer and product files. Remove duplicates, fix typos, and standardize entries (one spelling everywhere, not 3 mixed variants).',
        },
      },
      {
        name: {
          ar: 'إعداد قوالب الاستيراد',
          fr: "Préparer les modèles d'import",
          en: 'Prepare the import templates',
        },
        text: {
          ar: 'حمّل قوالب CSV من البرنامج الجديد. انسخ بياناتك إليها بالحقول الصحيحة: الاسم، الهاتف، NIF، الولاية، التصنيف.',
          fr: 'Téléchargez les modèles CSV du nouveau logiciel. Recopiez vos données dans les bons champs : nom, téléphone, NIF, wilaya, catégorie.',
          en: 'Download CSV templates from the new software. Map your Excel columns to the right fields: name, phone, tax ID, region, category.',
        },
      },
      {
        name: {
          ar: 'استيراد العملاء والموردين',
          fr: 'Importer clients et fournisseurs',
          en: 'Import customers and suppliers',
        },
        text: {
          ar: 'ابدأ باستيراد العملاء والموردين أولاً (هذه أسرع وأقل خطورة). تحقق من 10 سجلات عشوائية بعد الاستيراد للتأكد من سلامة البيانات.',
          fr: "Commencez par importer clients et fournisseurs (le plus rapide, le moins risqué). Vérifiez 10 fiches au hasard pour confirmer que rien n'est cassé.",
          en: 'Import customers and suppliers first — fastest and lowest risk. Spot-check 10 random records after import to confirm nothing broke.',
        },
      },
      {
        name: {
          ar: 'استيراد المنتجات والمخزون',
          fr: 'Importer produits et stocks',
          en: 'Import products and inventory',
        },
        text: {
          ar: 'استورد المنتجات مع أسعار التكلفة وأسعار البيع. ثم أضف المخزون الحالي لكل مستودع. هذه الخطوة الأهم — اطلب من شخصين التحقق من الأرقام.',
          fr: 'Importez les produits avec coûts et prix de vente. Puis ajoutez le stock actuel par entrepôt. Étape cruciale — faites contrôler les chiffres par 2 personnes.',
          en: 'Import products with cost and selling prices, then add current stock by warehouse. This is the critical step — have two people validate the figures.',
        },
      },
      {
        name: {
          ar: 'ضبط الإعدادات الضريبية',
          fr: 'Configurer les paramètres fiscaux',
          en: 'Configure tax and invoice settings',
        },
        text: {
          ar: 'أدخل NIF، NIS، RC، AI لشركتك. اضبط نسب TVA الافتراضية، رقم الفاتورة الأول، تصميم الفاتورة (شعار، عنوان).',
          fr: 'Entrez NIF, NIS, RC, AI de votre société. Configurez les taux TVA par défaut, le numéro de facture de départ, le design facture (logo, adresse).',
          en: 'Enter your company tax registration numbers. Set default VAT rates, starting invoice number, and invoice design (logo, address, legal mentions).',
        },
      },
      {
        name: {
          ar: 'تدريب الفريق',
          fr: "Former l'équipe",
          en: 'Train the team',
        },
        text: {
          ar: 'دربب 2 أو 3 أشخاص بشكل معمق (يومان). دعهم يدربون الباقي. لا تحاول تدريب الجميع دفعة واحدة — يفشل دائمًا.',
          fr: "Formez 2 ou 3 personnes en profondeur (2 jours). Laissez-les former le reste. N'essayez pas de former tout le monde d'un coup — ça rate toujours.",
          en: "Train 2 or 3 people deeply (2 days). Let them train the rest. Don't try to train everyone at once — it always backfires.",
        },
      },
      {
        name: {
          ar: 'التشغيل الموازي شهر واحد',
          fr: 'Tourner en parallèle pendant 1 mois',
          en: 'Run in parallel for 1 month',
        },
        text: {
          ar: 'استخدم Excel والبرنامج الجديد بالتوازي لمدة شهر. قارن الأرقام في نهاية كل أسبوع. بعد شهر، توقف عن استخدام Excel نهائيًا.',
          fr: "Utilisez Excel et le nouveau logiciel en parallèle pendant 1 mois. Comparez les chiffres chaque fin de semaine. Au bout d'un mois, arrêtez Excel définitivement.",
          en: 'Run Excel and the new software side-by-side for 30 days. Reconcile totals every Friday. After one month, retire Excel for good.',
        },
      },
    ],
  },
  faqs: [
    {
      question: {
        ar: 'كم من الوقت يستغرق ترحيل البيانات من Excel؟',
        fr: "Combien de temps prend la migration depuis Excel ?",
        en: 'How long does an Excel migration usually take?',
      },
      answer: {
        ar: 'بالنسبة لشركة متوسطة الحجم (1,000 عميل، 2,000 منتج)، التنظيف والاستيراد والتحقق يأخذان 2-3 أيام عمل. التدريب أسبوع. التشغيل بالتوازي شهر. مجموع: حوالي 6 أسابيع للانتقال الكامل.',
        fr: "Pour une société moyenne (1 000 clients, 2 000 produits), nettoyage + import + vérification prennent 2-3 jours. La formation 1 semaine. Le parallèle 1 mois. Total : environ 6 semaines pour la transition complète.",
        en: 'For a mid-sized business (1,000 customers, 2,000 products), cleanup + import + validation takes 2-3 working days. Training takes a week. Parallel running takes a month. Total: around 6 weeks for a full transition.',
      },
    },
    {
      question: {
        ar: 'هل أفقد بيانات تاريخية مهمة؟',
        fr: "Vais-je perdre l'historique de mes ventes ?",
        en: 'Will I lose my historical sales data?',
      },
      answer: {
        ar: 'لا، إذا تم الترحيل بشكل صحيح. الفواتير القديمة يمكن استيرادها كأرشيف (للقراءة فقط) أو الاحتفاظ بـExcel كمرجع. الجديد يبدأ بالبرنامج، والقديم متاح عند الحاجة.',
        fr: "Non, si la migration est bien faite. Les anciennes factures peuvent être importées comme archives (lecture seule) ou Excel conservé en référence. Le nouveau démarre dans le logiciel, l'ancien reste accessible.",
        en: 'No, if the migration is done right. Old invoices can be imported as read-only archives, or you can keep Excel as a reference. New data starts in the software; the old data stays accessible when needed.',
      },
    },
    {
      question: {
        ar: 'هل يمكن تجنب التشغيل الموازي وبدء البرنامج الجديد مباشرة؟',
        fr: 'Peut-on éviter le parallèle et basculer directement ?',
        en: 'Can I skip the parallel month and switch directly?',
      },
      answer: {
        ar: 'نظريًا نعم، لكن في الواقع 90% من الشركات التي تجاوزت هذه الخطوة عانت من اكتشاف أخطاء بعد فوات الأوان. الشهر الإضافي يكلفك ساعتين/يوم لكنه يحميك من كارثة.',
        fr: 'Théoriquement oui, mais 90% des entreprises qui sautent cette étape découvrent des erreurs trop tard. Ce mois supplémentaire coûte 2h/jour mais évite la catastrophe.',
        en: "Theoretically yes, but 90% of companies that skip parallel running discover errors too late. The extra month costs you 2 hours per day, but it's the insurance against a disaster.",
      },
    },
    {
      question: {
        ar: 'ماذا أفعل إذا قاوم الفريق التغيير؟',
        fr: "Que faire si l'équipe résiste au changement ?",
        en: 'What if the team resists the change?',
      },
      answer: {
        ar: 'المقاومة طبيعية. الحل: ابدأ بشخص متحمس (وليس الأكبر سنًا). دعه يثبت الفائدة (وقت موفر، أخطاء أقل). الباقون سيتبعون. لا تجبر، أقنع بالنتائج.',
        fr: "La résistance est normale. Solution : commencez par une personne enthousiaste (pas le plus ancien). Laissez-la prouver le gain (temps gagné, erreurs en moins). Les autres suivront. Ne forcez pas, convainquez par les résultats.",
        en: "Resistance is normal. The fix: start with one enthusiastic person (not the most senior). Let them prove the win — hours saved, fewer errors. The rest will follow. Don't force it; convince with results.",
      },
    },
    {
      question: {
        ar: 'هل يمكنني الاحتفاظ بـExcel جانبيًا للأمور الخاصة؟',
        fr: 'Puis-je garder Excel pour des trucs spécifiques ?',
        en: 'Can I still keep Excel for ad-hoc work?',
      },
      answer: {
        ar: 'نعم، Excel يبقى مفيدًا للتحليلات السريعة، السيناريوهات (محاكاة "ماذا لو")، وإعداد العروض. لكن لا يجب أن يبقى مصدر الحقيقة للعمليات اليومية (فواتير، مخزون، عملاء).',
        fr: 'Oui, Excel reste utile pour analyses rapides, simulations "et si", et préparation de propositions. Mais il ne doit plus être la source de vérité pour les opérations quotidiennes (factures, stocks, clients).',
        en: 'Yes — Excel is still great for quick analyses, "what-if" simulations, and drafting proposals. But it should no longer be the source of truth for daily operations (invoices, stock, customers).',
      },
    },
  ],
};

export default post;
