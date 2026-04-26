// Distribution sectors for programmatic SEO
export interface Sector {
  slug: string;
  name: { fr: string; ar: string };
  emoji: string;
  pitch: { fr: string; ar: string };
  features: string[];
  keywords: string[];
}

export const SECTORS: Sector[] = [
  {
    slug: 'agroalimentaire',
    name: { fr: 'Agroalimentaire', ar: 'الصناعات الغذائية' },
    emoji: '🍞',
    pitch: {
      fr: 'Pour les distributeurs et grossistes en produits alimentaires : gestion des dates de péremption, traçabilité des lots, ventes mobiles CashVan et tournées de livraison optimisées.',
      ar: 'للموزعين وتجار الجملة في المواد الغذائية: إدارة تواريخ الصلاحية، تتبع الدفعات، البيع المتنقل وجولات التوصيل المحسّنة.',
    },
    features: [
      'Gestion des dates de péremption (FIFO/FEFO)',
      'Traçabilité par lot et numéro de série',
      'Multi-dépôts (sec, frais, congelé)',
      'CashVan pour les vendeurs en route',
      'Tournées de livraison optimisées',
      'Facturation TVA conforme',
    ],
    keywords: [
      'logiciel agroalimentaire algerie',
      'gestion distribution alimentaire',
      'برنامج توزيع المواد الغذائية',
      'برنامج صناعات غذائية الجزائر',
    ],
  },
  {
    slug: 'boissons',
    name: { fr: 'Boissons', ar: 'المشروبات' },
    emoji: '🥤',
    pitch: {
      fr: 'Distribution de boissons fraîches, eaux minérales, sodas et jus : tournées CashVan, gestion des consignes, cautions emballage et facturation rapide.',
      ar: 'توزيع المشروبات الباردة، المياه المعدنية والعصائر: جولات الكاشفان، إدارة الفوارغ والكفالات والفوترة السريعة.',
    },
    features: [
      'CashVan optimisé pour boissons',
      'Gestion des consignes & emballages',
      'Multi-dépôts régionaux',
      'Tournées de livraison',
      'Promos volumes',
      'Reporting par marque',
    ],
    keywords: ['logiciel distribution boissons', 'gestion cashvan boissons', 'برنامج توزيع المشروبات'],
  },
  {
    slug: 'cosmetiques',
    name: { fr: 'Cosmétiques & Parfumerie', ar: 'مستحضرات التجميل والعطور' },
    emoji: '💄',
    pitch: {
      fr: 'Pour les distributeurs de cosmétiques, parfums et produits de soin : catalogue produits riche, gestion des marques, ventes en magasin et livraisons.',
      ar: 'لموزعي مستحضرات التجميل والعطور ومنتجات العناية: كاتالوج غني للمنتجات وإدارة العلامات.',
    },
    features: [
      'Catalogue avec photos',
      'Gestion par marque & gamme',
      'Caisse POS pour boutiques',
      'Stock multi-dépôts',
      'Promotions & lots',
      'Reporting marges',
    ],
    keywords: ['logiciel cosmetiques algerie', 'gestion parfumerie', 'برنامج مستحضرات تجميل'],
  },
  {
    slug: 'pharmacie',
    name: { fr: 'Pharmacie & Parapharmacie', ar: 'الصيدلة والشبه الصيدلية' },
    emoji: '💊',
    pitch: {
      fr: 'Pour les grossistes en médicaments et parapharmacie : gestion stricte des lots, dates de péremption, multi-dépôts et livraisons aux pharmacies.',
      ar: 'لتجار الجملة في الأدوية والمنتجات شبه الصيدلية: إدارة صارمة للدفعات وتواريخ الصلاحية.',
    },
    features: [
      'Lots & dates de péremption',
      'Traçabilité réglementaire',
      'Multi-dépôts sécurisés',
      'Livraisons aux pharmacies',
      'Facturation conforme',
      'Reporting détaillé',
    ],
    keywords: ['logiciel pharmacie algerie', 'gestion grossiste pharmaceutique', 'برنامج توزيع أدوية'],
  },
  {
    slug: 'btp',
    name: { fr: 'BTP & Matériaux de construction', ar: 'البناء ومواد البناء' },
    emoji: '🏗️',
    pitch: {
      fr: 'Pour les distributeurs de ciment, fer, sanitaire, peinture et matériaux : gestion des unités (palette, sac, m³), grosses commandes et livraisons par camion.',
      ar: 'لموزعي الإسمنت، الحديد، الصحي، الدهانات ومواد البناء: إدارة الوحدات والطلبات الكبيرة والتوصيل بالشاحنات.',
    },
    features: [
      'Multiples unités (palette, m³, kg)',
      'Bons de commande gros volumes',
      'Tournées camion',
      'Facturation TVA + timbre',
      'Crédit client géré',
      'Multi-chantiers',
    ],
    keywords: ['logiciel btp algerie', 'gestion materiaux construction', 'برنامج مواد بناء'],
  },
  {
    slug: 'quincaillerie',
    name: { fr: 'Quincaillerie & Outillage', ar: 'الخردوات والعدد' },
    emoji: '🔧',
    pitch: {
      fr: 'Pour les magasins et grossistes en quincaillerie, outillage et fournitures industrielles : catalogue volumineux, codes-barres et gestion fine du stock.',
      ar: 'لمحلات وتجار جملة الخردوات والعدد واللوازم الصناعية: كاتالوج كبير، باركود وإدارة دقيقة للمخزون.',
    },
    features: [
      'Catalogue à fort volume',
      'Code-barres scanné',
      'Multi-fournisseurs',
      'Caisse POS rapide',
      'Stock multi-dépôts',
      'Bons de commande gros',
    ],
    keywords: ['logiciel quincaillerie', 'gestion outillage', 'برنامج خردوات'],
  },
  {
    slug: 'textile',
    name: { fr: 'Textile & Habillement', ar: 'النسيج والملابس' },
    emoji: '👕',
    pitch: {
      fr: 'Pour les grossistes en textile, prêt-à-porter et accessoires : gestion par taille/couleur, collections saisonnières et caisse POS multi-magasins.',
      ar: 'لتجار جملة النسيج والملابس الجاهزة والإكسسوارات: إدارة حسب المقاس/اللون والمجموعات الموسمية.',
    },
    features: [
      'Variantes (taille, couleur, modèle)',
      'Collections saisonnières',
      'Caisse POS multi-magasins',
      'Gestion des soldes',
      'Reporting par marque',
      'Multi-dépôts',
    ],
    keywords: ['logiciel textile algerie', 'gestion habillement', 'برنامج محلات الملابس'],
  },
  {
    slug: 'bureautique',
    name: { fr: 'Fournitures de bureau & Papeterie', ar: 'لوازم المكاتب والقرطاسية' },
    emoji: '📎',
    pitch: {
      fr: 'Pour les distributeurs de fournitures de bureau, papeterie et matériel scolaire : grand catalogue, ventes en gros et livraisons B2B.',
      ar: 'لموزعي لوازم المكاتب والقرطاسية والمواد المدرسية: كاتالوج كبير، البيع بالجملة والتوصيل للمؤسسات.',
    },
    features: [
      'Grand catalogue B2B',
      'Devis & bons de commande',
      'Livraisons aux entreprises',
      'Promotions rentrée scolaire',
      'Multi-dépôts',
      'Crédit client',
    ],
    keywords: ['logiciel papeterie algerie', 'gestion fournitures bureau', 'برنامج قرطاسية'],
  },
  {
    slug: 'entretien',
    name: { fr: 'Produits d\'entretien & Hygiène', ar: 'مواد التنظيف والصحة' },
    emoji: '🧴',
    pitch: {
      fr: 'Pour les distributeurs de produits d\'entretien, hygiène et nettoyage : gestion des conditionnements (litre, bidon, palette) et CashVan pour les revendeurs.',
      ar: 'لموزعي مواد التنظيف والصحة والنظافة: إدارة التعبئة (لتر، عبوة، طبلية) والكاشفان للموزعين.',
    },
    features: [
      'Conditionnements multiples',
      'CashVan tournées',
      'Multi-dépôts',
      'Facturation rapide',
      'Reporting marges',
      'Promos volumes',
    ],
    keywords: ['logiciel produits entretien', 'gestion hygiene', 'برنامج مواد تنظيف'],
  },
  {
    slug: 'electromenager',
    name: { fr: 'Électroménager & Électronique', ar: 'الأجهزة الكهرومنزلية والإلكترونيات' },
    emoji: '📺',
    pitch: {
      fr: 'Pour les distributeurs et magasins d\'électroménager et électronique : numéros de série, garanties, livraisons et installation à domicile.',
      ar: 'لموزعي ومحلات الأجهزة الكهرومنزلية والإلكترونيات: الأرقام التسلسلية، الضمانات والتوصيل والتركيب.',
    },
    features: [
      'Numéros de série & garantie',
      'Bons de livraison signés',
      'Caisse POS magasins',
      'Multi-dépôts régionaux',
      'Service après-vente',
      'Reporting fournisseur',
    ],
    keywords: ['logiciel electromenager algerie', 'gestion electronique', 'برنامج أجهزة كهرومنزلية'],
  },
  {
    slug: 'tabac-papeterie',
    name: { fr: 'Tabac & Confiserie', ar: 'التبغ والحلويات' },
    emoji: '🍬',
    pitch: {
      fr: 'Pour les grossistes et magasins de tabac, confiserie et produits d\'impulsion : caisse rapide, code-barres et tournées de livraison fréquentes.',
      ar: 'لتجار جملة ومحلات التبغ والحلويات ومنتجات الاندفاع: كاشير سريع، باركود وجولات توصيل متكررة.',
    },
    features: [
      'Caisse POS ultra-rapide',
      'Scan code-barres',
      'Multi-magasins',
      'Tournées CashVan',
      'Stock minimum / réapprovisionnement',
      'Reporting hebdo',
    ],
    keywords: ['logiciel tabac', 'gestion confiserie', 'برنامج حلويات'],
  },
  {
    slug: 'grossiste',
    name: { fr: 'Grossiste / Importateur', ar: 'تاجر جملة / مستورد' },
    emoji: '📦',
    pitch: {
      fr: 'Pour tous les grossistes et importateurs : gestion des arrivages, multi-fournisseurs, multi-dépôts régionaux, vente en gros et CashVan.',
      ar: 'لجميع تجار الجملة والمستوردين: إدارة الواردات، تعدد الموردين والمستودعات الإقليمية، البيع بالجملة والكاشفان.',
    },
    features: [
      'Arrivages & importations',
      'Multi-fournisseurs',
      'Multi-dépôts régionaux',
      'Ventes en gros',
      'CashVan tournées',
      'Reporting marges détaillé',
    ],
    keywords: ['logiciel grossiste algerie', 'gestion importateur', 'برنامج تاجر جملة'],
  },
];

export function getSector(slug: string): Sector | undefined {
  return SECTORS.find((s) => s.slug === slug);
}
