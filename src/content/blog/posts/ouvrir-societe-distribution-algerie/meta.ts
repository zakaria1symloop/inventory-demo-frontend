import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'ouvrir-societe-distribution-algerie',
  category: 'guides',
  date: '2026-05-09',
  readTime: 11,
  author: 'TrackSera',
  emoji: '🚀',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
  countries: ['DZ'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  howTo: {
    name: {
      ar: 'كيف تؤسس شركة توزيع في الجزائر في 8 خطوات',
      fr: 'Comment créer une société de distribution en Algérie en 8 étapes',
      en: 'How to start a distribution business in 8 steps',
    },
    steps: [
      {
        name: {
          ar: 'اختر الشكل القانوني',
          fr: 'Choisir la forme juridique',
          en: 'Pick the legal structure',
        },
        text: {
          ar: 'EURL لمؤسس واحد (الأكثر شيوعًا للمبتدئين)، SARL لشريكين أو أكثر، SPA للمشاريع الكبرى. EURL الأبسط: مؤسس واحد، رأس مال 100,000 دج، مسؤولية محدودة.',
          fr: 'EURL pour un fondateur seul (le plus courant pour démarrer), SARL pour 2+ associés, SPA pour gros projets. EURL le plus simple : 1 fondateur, capital 100 000 DA, responsabilité limitée.',
          en: 'Single-member LLC for solo founders (most common), multi-member LLC for 2+ partners, joint-stock for larger projects. The single-member LLC is the simplest: 1 founder, ~$750 capital, limited liability.',
        },
      },
      {
        name: {
          ar: 'احجز اسم الشركة',
          fr: 'Réserver le nom de la société',
          en: 'Reserve the company name',
        },
        text: {
          ar: 'في CNRC (المركز الوطني للسجل التجاري). تكلفة: 490 دج. مدة: 1-2 يوم. اسم فريد، باللغتين العربية والفرنسية.',
          fr: 'Au CNRC (Centre National du Registre du Commerce). Coût : 490 DA. Délai : 1-2 jours. Nom unique, en arabe et français.',
          en: 'At the national trade registry. Fee: ~$4-$20. Turnaround: 1-3 working days. Pick a unique name; bilingual filings are often required.',
        },
      },
      {
        name: {
          ar: 'أعد القانون الأساسي',
          fr: 'Rédiger les statuts',
          en: 'Draft articles of incorporation',
        },
        text: {
          ar: 'وثيقة قانونية تحدد: الاسم، النشاط، رأس المال، المؤسسين، مقر النشاط. اطلب من موثق (notaire) إعدادها. تكلفة: 15,000-25,000 دج.',
          fr: 'Document légal définissant : nom, activité, capital, associés, siège. Faites-les rédiger par un notaire. Coût : 15 000-25 000 DA.',
          en: 'Legal deed defining name, scope of activity, capital, partners and registered office. Have a notary draft them. Cost: ~$120-$200.',
        },
      },
      {
        name: {
          ar: 'أودع رأس المال',
          fr: 'Déposer le capital',
          en: 'Deposit the share capital',
        },
        text: {
          ar: 'افتح حسابًا بنكيًا "in formation" في بنك جزائري (BNA, BEA, BADR, CPA, إلخ). أودع رأس المال (الحد الأدنى 100,000 دج لـEURL). البنك يسلم شهادة إيداع.',
          fr: 'Ouvrez un compte bancaire "en formation" dans une banque algérienne (BNA, BEA, BADR, CPA, etc.). Déposez le capital (min 100 000 DA pour EURL). La banque délivre une attestation de dépôt.',
          en: 'Open an "in formation" bank account with a local corporate bank. Deposit the minimum capital (~$750 for an LLC). The bank issues a capital lock-up attestation.',
        },
      },
      {
        name: {
          ar: 'سجل في CNRC',
          fr: 'Immatriculer au CNRC',
          en: 'File the company registration',
        },
        text: {
          ar: 'مع شهادة الإيداع، القانون الأساسي، وشهادة المقر. تكلفة التسجيل: 16,000-20,000 دج. تستلم RC (السجل التجاري) في 7-15 يومًا.',
          fr: 'Avec attestation de dépôt, statuts, et attestation de siège. Coût immatriculation : 16 000-20 000 DA. Vous recevez le RC (Registre du Commerce) en 7-15 jours.',
          en: 'Submit the capital attestation, articles and proof of office. Filing fee: ~$120-$200. You receive the commercial registry extract in 7-15 days — your company ID document.',
        },
      },
      {
        name: {
          ar: 'احصل على NIF و NIS',
          fr: 'Obtenir NIF et NIS',
          en: 'Get tax and statistical IDs',
        },
        text: {
          ar: 'NIF (الرقم الجبائي) من مفتشية الضرائب، مجاني، فوري. NIS (الرقم الإحصائي) من ONS، مجاني، 1-3 أيام. ضروريان لكل فاتورة.',
          fr: "NIF (Numéro d'Identification Fiscale) à l'inspection des impôts, gratuit, immédiat. NIS (Numéro d'Identification Statistique) à l'ONS, gratuit, 1-3 jours. Indispensables pour facturer.",
          en: 'Tax ID at the local tax office (usually free, often same-day). Statistical ID at the national statistics office (free, 1-3 days). Both are required to issue a legal invoice.',
        },
      },
      {
        name: {
          ar: 'احصل على التراخيص الخاصة',
          fr: 'Obtenir les agréments spécifiques',
          en: 'Obtain sector-specific approvals',
        },
        text: {
          ar: 'حسب القطاع: غذائي → اعتماد DSV (5,000-15,000 دج)، أدوية → اعتماد وزارة الصحة، استيراد → بطاقة استيراد. تستغرق 2-8 أسابيع.',
          fr: "Selon secteur : alimentaire → agrément DSV (5 000-15 000 DA), médicaments → agrément ministère Santé, import → carte d'importateur. Prend 2-8 semaines.",
          en: 'Depends on the sector: food → veterinary/sanitary approval (~$40-$120), pharma → ministry of health approval, import → importer card. Allow 2-8 weeks.',
        },
      },
      {
        name: {
          ar: 'جهز الأدوات التشغيلية',
          fr: 'Mettre en place les outils opérationnels',
          en: 'Stand up the operational stack',
        },
        text: {
          ar: 'برنامج فوترة وإدارة (TrackSera أو ما شابه)، حساب بنكي تشغيلي، تأمين المخزون، عقد الإيجار للمستودع، أول مركبة، توظيف موظف أو سائق. الميزانية: 800,000 دج إلى 5 ملايين حسب الحجم.',
          fr: 'Logiciel de facturation et gestion (TrackSera ou équivalent), compte bancaire opérationnel, assurance stock, bail entrepôt, premier véhicule, recruter 1 employé ou livreur. Budget : 800 000 DA à 5 millions selon échelle.',
          en: 'Invoicing & management software (TrackSera or similar), operational bank account, stock insurance, warehouse lease, first vehicle, hire 1 employee or driver. Budget: $6,000-$35,000 depending on scale.',
        },
      },
    ],
  },
  faqs: [
    {
      question: {
        ar: 'كم تكلف فعليًا فتح شركة توزيع في الجزائر؟',
        fr: "Combien coûte réellement la création d'une société de distribution ?",
        en: 'How much does it really cost to launch a distribution company?',
      },
      answer: {
        ar: 'الإجراءات الإدارية فقط (CNRC، موثق، NIF، NIS): 50,000-80,000 دج. مع رأس المال (100,000 دج EURL)، الإيجار الأول، أول استثمار في المخزون والمعدات والبرنامج: ميزانية البدء الواقعية 800,000 إلى 3 ملايين دج للبداية المتواضعة.',
        fr: 'Démarches administratives seules (CNRC, notaire, NIF, NIS) : 50 000-80 000 DA. Avec le capital (100 000 DA EURL), premier loyer, premier investissement stock/véhicule/logiciel : budget de démarrage réaliste 800 000 à 3 millions DA pour un démarrage modeste.',
        en: 'Pure administrative costs (registry, notary, tax/statistical IDs): roughly $400-$600. Once you add capital, first lease, vehicle, opening inventory and software, a realistic modest launch budget lands between $14,500 and $35,000.',
      },
    },
    {
      question: {
        ar: 'هل أحتاج إلى مستودع منذ البداية؟',
        fr: 'Faut-il un entrepôt dès le départ ?',
        en: 'Do I need a full warehouse from day one?',
      },
      answer: {
        ar: 'يعتمد على القطاع. للتوزيع الصغير في البداية: غرفة 30-50 م² في حيك تكفي. للقطاعات المنظمة (غذائي، دوائي): مستودع 80 م²+ مع اعتماد ضروري. لا تستثمر في 500 م² فارغة في البداية — ابدأ صغيرًا، انمو سريعًا.',
        fr: "Cela dépend du secteur. Pour démarrer petit : un local de 30-50 m² dans votre quartier suffit. Pour secteurs réglementés (alimentaire, pharmacie) : entrepôt 80 m²+ avec agrément requis. N'investissez pas dans 500 m² vides au départ — démarrez petit, grandissez vite.",
        en: 'It depends on the sector. For a small launch, a 30-50 m² unit in your neighborhood is enough. Regulated sectors (food, pharma) require 80 m²+ with a formal approval. Do not lease 500 m² of empty space on day one — start small and scale fast.',
      },
    },
    {
      question: {
        ar: 'كم تستغرق العملية كاملة؟',
        fr: 'Combien de temps prend la création complète ?',
        en: 'How long does the whole setup take?',
      },
      answer: {
        ar: 'متوسط 30-60 يومًا للأساسيات (CNRC، NIF، NIS، الحساب البنكي). إضافة 30-60 يومًا للاعتمادات القطاعية. لذا 2-4 أشهر من فكرة المشروع إلى أول فاتورة فعلية. خطط للتمويل لتغطية فترة عدم النشاط هذه.',
        fr: "Moyenne 30-60 jours pour le socle (CNRC, NIF, NIS, compte bancaire). Ajouter 30-60 jours pour agréments sectoriels. Donc 2-4 mois entre l'idée et la première vraie facture. Prévoyez le financement pour couvrir cette période sans activité.",
        en: 'Plan for 30-60 days for the basics (registration, tax/statistical IDs, bank account). Add another 30-60 days for sector approvals. So 2-4 months between the idea and your first real invoice. Budget for that no-revenue window.',
      },
    },
    {
      question: {
        ar: 'هل يمكنني التوزيع كشخص طبيعي بدون شركة؟',
        fr: 'Puis-je distribuer en personne physique sans société ?',
        en: 'Can I run distribution as a sole proprietor, without a company?',
      },
      answer: {
        ar: 'نعم، عبر سجل تجاري شخصي (auto-entrepreneur). أبسط، أرخص (10,000 دج للتسجيل)، لكن تتحمل المسؤولية بأموالك الشخصية. مناسب للتوزيع الصغير جدًا (&lt; 10 ملايين دج رقم أعمال). فوقها، يجب التحول إلى EURL أو SARL.',
        fr: 'Oui, en personne physique (auto-entrepreneur). Plus simple, moins cher (10 000 DA inscription), mais vous engagez vos biens personnels. OK pour très petite distribution (&lt; 10 millions DA CA). Au-delà, basculez en EURL ou SARL.',
        en: 'Yes, via a sole proprietorship / auto-entrepreneur status. Simpler and cheaper ($80 to register), but your personal assets are on the hook. Fine for very small distribution (&lt; ~$75K annual revenue). Above that, convert to an LLC.',
      },
    },
    {
      question: {
        ar: 'هل يجب وجود محاسب من البداية؟',
        fr: 'Faut-il un comptable dès le départ ?',
        en: 'Do I need an accountant from the start?',
      },
      answer: {
        ar: 'إجباري قانونيًا للشركات (EURL, SARL, SPA): محاسب مُعتمد للتصاريح الضريبية الشهرية (G50)، الميزانية السنوية، البلاغات. التكلفة: 8,000-25,000 دج/شهر حسب الحجم. للأشخاص الطبيعيين: ليس إجباريًا، لكن مُوصى به.',
        fr: 'Obligatoire légalement pour les sociétés (EURL, SARL, SPA) : comptable agréé pour déclarations mensuelles (G50), bilan annuel, attestations. Coût : 8 000-25 000 DA/mois selon taille. Pour personnes physiques : pas obligatoire mais recommandé.',
        en: 'Legally required for incorporated companies: a certified accountant for monthly tax filings, annual balance sheet and statutory certificates. Cost: $60-$190/month depending on size. For sole proprietors it is not mandatory, but strongly recommended.',
      },
    },
  ],
};

export default post;
