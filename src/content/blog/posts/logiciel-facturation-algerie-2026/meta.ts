import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'logiciel-facturation-algerie-2026',
  category: 'guides',
  date: '2026-05-09',
  readTime: 11,
  author: 'TrackSera',
  emoji: '🧾',
  gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  countries: ['DZ'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  faqs: [
    {
      question: {
        ar: 'ما هي المعلومات الإلزامية في الفاتورة الجزائرية؟',
        fr: 'Quelles sont les mentions obligatoires sur une facture algérienne ?',
        en: 'What information must appear on an Algerian invoice?',
      },
      answer: {
        ar: 'يجب أن تحتوي الفاتورة على: NIF، NIS، RC، AI، عنوان الشركة، تاريخ الإصدار، رقم متسلسل، وصف المنتجات/الخدمات، السعر دون TVA، نسبة TVA (9% أو 19%)، المبلغ الإجمالي، وفي حالة الدفع نقدًا الطابع الجبائي 1%.',
        fr: 'La facture doit comporter : NIF, NIS, RC, AI, adresse de la société, date d\'émission, numéro séquentiel, désignation des produits/services, prix HT, taux TVA (9% ou 19%), montant TTC, et en cas de paiement espèces le timbre fiscal de 1%.',
        en: 'An Algerian invoice must include: NIF, NIS, RC, AI, company address, issue date, sequential number, description of goods/services, price excluding VAT, VAT rate (9% or 19%), total inclusive of VAT, and the 1% fiscal stamp on cash payments.',
      },
    },
    {
      question: {
        ar: 'هل يمكنني استخدام Excel لإصدار الفواتير في الجزائر؟',
        fr: 'Puis-je utiliser Excel pour émettre mes factures en Algérie ?',
        en: 'Can I use Excel to issue invoices in Algeria?',
      },
      answer: {
        ar: 'تقنيًا نعم، لكن قانونيًا الترقيم المتسلسل يصبح صعب التحقق منه، ويجب الاحتفاظ بنسخ ورقية مرقمة. كما أن Excel لا يحسب الطابع الجبائي تلقائيًا، ولا يُنشئ السجلات الضريبية المطلوبة. الأفضل استخدام برنامج محاسبة معتمد.',
        fr: 'Techniquement oui, mais légalement la numérotation séquentielle est difficile à prouver, et vous devez conserver des copies papier numérotées. Excel ne calcule pas automatiquement le timbre fiscal, et ne génère pas les registres fiscaux requis. Mieux vaut un logiciel agréé.',
        en: 'Technically yes, but legally the sequential numbering is hard to prove, and you must keep numbered paper copies. Excel won\'t compute the fiscal stamp automatically and won\'t produce the required tax ledgers. A certified accounting tool is far safer.',
      },
    },
    {
      question: {
        ar: 'كم تكلفة برنامج فوترة احترافي في الجزائر؟',
        fr: 'Combien coûte un logiciel de facturation professionnel en Algérie ?',
        en: 'How much does professional invoicing software cost in Algeria?',
      },
      answer: {
        ar: 'الحلول المحلية تتراوح بين 2,500 و 12,000 دج/شهر حسب عدد المستخدمين والوحدات. الحلول الأجنبية (Sage, Odoo) تكلف 3 إلى 5 أضعاف، وغالبًا تتطلب تخصيصًا مكلفًا للتوافق مع الضرائب الجزائرية.',
        fr: 'Les solutions locales coûtent entre 2 500 et 12 000 DA/mois selon les utilisateurs et modules. Les solutions étrangères (Sage, Odoo) coûtent 3 à 5 fois plus, et exigent souvent une personnalisation coûteuse pour la fiscalité algérienne.',
        en: 'Local solutions range from $19 to $99/month depending on users and modules. International tools (Sage, Odoo) cost 3 to 5 times more and often need costly customization to handle Algerian tax rules.',
      },
    },
    {
      question: {
        ar: 'هل يحسب البرنامج الطابع الجبائي تلقائيًا؟',
        fr: 'Le logiciel calcule-t-il automatiquement le timbre fiscal ?',
        en: 'Does the software apply the fiscal stamp automatically?',
      },
      answer: {
        ar: 'برنامج جيد يطبق الطابع الجبائي 1% تلقائيًا فقط على الفواتير المدفوعة نقدًا (الحد الأدنى 5 دج، الحد الأقصى 2,500 دج لكل فاتورة). برامج رديئة تطبقه على كل الفواتير وهذا خطأ قانوني.',
        fr: 'Un bon logiciel applique le timbre fiscal de 1% automatiquement uniquement sur les factures payées en espèces (min 5 DA, max 2 500 DA par facture). Les mauvais logiciels l\'appliquent à toutes les factures, ce qui est une erreur légale.',
        en: 'Good software applies the 1% fiscal stamp automatically, but only on cash-paid invoices (min 5 DZD, max 2,500 DZD per invoice). Poor software applies it to every invoice — which is a legal error.',
      },
    },
    {
      question: {
        ar: 'هل يدعم البرنامج فاتورة الإصدار المسبق (Proforma) وفاتورة المباعة؟',
        fr: 'Le logiciel gère-t-il les proformas et les factures de vente ?',
        en: 'Does the software handle proformas and sales invoices separately?',
      },
      answer: {
        ar: 'نعم، البرامج المتقدمة تميز بين: العرض/Proforma (لا يلزم العميل قانونيًا)، فاتورة البيع، إشعار الإرجاع، وإشعار التسليم. كل واحد له ترقيم منفصل، وهذا مهم للضرائب.',
        fr: 'Oui, les bons logiciels distinguent : devis/proforma (sans engagement légal), facture de vente, avoir, et bon de livraison. Chacun a sa numérotation propre, ce qui est important pour le fisc.',
        en: 'Yes — quality tools separate quotes/proformas (no legal commitment), sales invoices, credit notes, and delivery notes. Each document has its own numbering series, which matters for tax reporting.',
      },
    },
    {
      question: {
        ar: 'هل التحول الرقمي للفواتير إلزامي في الجزائر؟',
        fr: 'La facturation électronique est-elle obligatoire en Algérie ?',
        en: 'Is electronic invoicing mandatory in Algeria?',
      },
      answer: {
        ar: 'إلى حد 2026، الفاتورة الورقية مازالت مقبولة، لكن المديرية العامة للضرائب (DGI) تتجه نحو الفوترة الإلكترونية تدريجيًا. الشركات الكبرى مطالبة بالأرشفة الرقمية. الأفضل اختيار برنامج جاهز للفوترة الإلكترونية.',
        fr: 'À fin 2026, la facture papier reste acceptée, mais la DGI évolue vers la facturation électronique progressivement. Les grandes entreprises doivent déjà archiver numériquement. Mieux vaut choisir un logiciel prêt pour la facturation électronique.',
        en: 'As of late 2026, paper invoices are still accepted, but Algeria\'s tax authority (DGI) is moving toward mandatory e-invoicing in phases. Large companies must already archive digitally. Choose a tool that\'s already e-invoicing ready.',
      },
    },
  ],
};

export default post;
