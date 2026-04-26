export type FaqCategory =
  | 'general'
  | 'pricing'
  | 'features'
  | 'technical'
  | 'security'
  | 'support';

export const faqCategories: Record<FaqCategory, { ar: string; fr: string }> = {
  general: { ar: 'عام', fr: 'Général' },
  pricing: { ar: 'الأسعار', fr: 'Tarifs' },
  features: { ar: 'الميزات', fr: 'Fonctionnalités' },
  technical: { ar: 'تقني', fr: 'Technique' },
  security: { ar: 'الأمان', fr: 'Sécurité' },
  support: { ar: 'الدعم', fr: 'Support' },
};

export interface FaqItem {
  category: FaqCategory;
  q: { ar: string; fr: string };
  a: { ar: string; fr: string };
}

export const faqData: FaqItem[] = [
  // ── General ──
  {
    category: 'general',
    q: {
      ar: 'ما هو TrackSera بالضبط؟',
      fr: "Qu'est-ce que TrackSera exactement ?",
    },
    a: {
      ar: 'TrackSera هو برنامج سحابي جزائري متكامل لإدارة المنتجات، الكاشير (POS) والتوزيع. يجمع في منصة واحدة: كاتالوج المنتجات، المخزون والمستودعات، نقاط البيع، الطلبات والتوصيل، البيع المتنقل (Cashvan)، تتبع السائقين بGPS، الفوترة والتقارير.',
      fr: "TrackSera est un logiciel SaaS algérien complet pour la gestion des produits, la caisse (POS) et la distribution. Il réunit dans une seule plateforme : catalogue produits, stock et entrepôts, points de vente, commandes et livraison, vente mobile (Cashvan), suivi GPS des livreurs, facturation et rapports.",
    },
  },
  {
    category: 'general',
    q: {
      ar: 'هل TrackSera مناسب لنشاطي؟',
      fr: 'TrackSera est-il adapté à mon activité ?',
    },
    a: {
      ar: 'TrackSera مصمم خصيصاً لـ: شركات التوزيع والجملة، المحلات الغذائية، شركات البيع المتنقل، موزعي مواد البناء والتنظيف، المخابز، محلات الأدوات المكتبية، وأي نشاط يحتاج إدارة المنتجات والمخزون والمبيعات. إذا لم تكن متأكداً، تواصل معنا ونساعدك.',
      fr: "TrackSera est conçu pour : les distributeurs et grossistes, l'agroalimentaire, les entreprises de vente mobile, les distributeurs de matériaux de construction et produits d'entretien, les boulangeries, les papeteries, et toute activité qui a besoin de gérer ses produits, son stock et ses ventes. En cas de doute, contactez-nous.",
    },
  },
  {
    category: 'general',
    q: {
      ar: 'هل أحتاج تثبيت أي شيء على جهازي؟',
      fr: 'Dois-je installer quelque chose sur mon ordinateur ?',
    },
    a: {
      ar: 'لا. TrackSera سحابي 100%. تحتاج فقط متصفح (Chrome، Edge، Firefox) واتصال بالإنترنت. لا توجد برامج تُثبَّت، لا تحديثات يدوية، ولا صيانة. للسائقين والبائعين المتنقلين، لدينا تطبيقات موبايل على Android.',
      fr: "Non. TrackSera est 100% cloud. Vous avez seulement besoin d'un navigateur (Chrome, Edge, Firefox) et d'une connexion Internet. Aucun logiciel à installer, aucune mise à jour manuelle, aucune maintenance. Pour les livreurs et vendeurs mobiles, nous avons des applications Android.",
    },
  },
  {
    category: 'general',
    q: {
      ar: 'هل تدعمون اللغة العربية؟',
      fr: 'Supportez-vous la langue arabe ?',
    },
    a: {
      ar: 'نعم، الواجهة كاملة بالعربية (RTL) والفرنسية. يمكن لكل مستخدم اختيار لغته المفضلة. الفواتير، التقارير وتطبيقات الموبايل كلها ثنائية اللغة.',
      fr: "Oui, l'interface est entièrement disponible en arabe (RTL) et en français. Chaque utilisateur peut choisir sa langue préférée. Les factures, rapports et applications mobiles sont tous bilingues.",
    },
  },
  {
    category: 'general',
    q: {
      ar: 'منذ متى وأنتم موجودون في السوق الجزائري؟',
      fr: 'Depuis combien de temps êtes-vous présents sur le marché algérien ?',
    },
    a: {
      ar: 'TrackSera مطوّر في الجزائر من طرف فريق جزائري يفهم احتياجات السوق المحلي. نخدم أكثر من 50 شركة جزائرية في أكثر من 15 ولاية، من الجزائر العاصمة إلى وهران، قسنطينة، عنابة، سطيف، بسكرة والمزيد.',
      fr: 'TrackSera est développé en Algérie par une équipe algérienne qui comprend les besoins du marché local. Nous servons plus de 50 entreprises algériennes dans plus de 15 wilayas, d\'Alger à Oran, Constantine, Annaba, Sétif, Biskra et plus.',
    },
  },

  // ── Pricing ──
  {
    category: 'pricing',
    q: {
      ar: 'كم سعر TrackSera؟',
      fr: 'Quel est le prix de TrackSera ?',
    },
    a: {
      ar: 'لدينا 4 خطط: مجاني (تجربة 14 يوم)، Starter بـ 2,900 د.ج/شهر، Pro بـ 6,900 د.ج/شهر (الأكثر شيوعاً)، وBusiness بـ 12,900 د.ج/شهر. كل الأسعار خارج الضرائب. للتفاصيل الكاملة، زُر صفحة <a href="/tarifs" class="text-blue-600 hover:underline">الأسعار</a>.',
      fr: 'Nous avons 4 formules : Gratuit (essai 14 jours), Starter à 2 900 DA/mois, Pro à 6 900 DA/mois (le plus choisi), et Business à 12 900 DA/mois. Tous les prix sont hors taxes. Pour les détails complets, visitez la page <a href="/tarifs" class="text-blue-600 hover:underline">Tarifs</a>.',
    },
  },
  {
    category: 'pricing',
    q: {
      ar: 'هل هناك تجربة مجانية؟',
      fr: 'Y a-t-il un essai gratuit ?',
    },
    a: {
      ar: 'نعم، تجربة مجانية كاملة لمدة 14 يوم، بدون بطاقة ائتمان. لديك الوصول إلى كل الميزات خلال فترة التجربة.',
      fr: "Oui, un essai gratuit complet de 14 jours, sans carte bancaire. Vous avez accès à toutes les fonctionnalités pendant la période d'essai.",
    },
  },
  {
    category: 'pricing',
    q: {
      ar: 'كيف يمكنني الدفع؟',
      fr: 'Comment puis-je payer ?',
    },
    a: {
      ar: 'نقبل التحويل البنكي، CCP، وCIB Edahabia. الفواتير تُرسل كل شهر، وبإمكانك الدفع سنوياً لتحصل على خصم 15%.',
      fr: 'Nous acceptons le virement bancaire, CCP, et CIB Edahabia. Les factures sont envoyées mensuellement. Un paiement annuel vous donne droit à 15% de remise.',
    },
  },
  {
    category: 'pricing',
    q: {
      ar: 'هل الأسعار تشمل TVA والطابع؟',
      fr: 'Les prix incluent-ils la TVA et le timbre ?',
    },
    a: {
      ar: 'لا، الأسعار المعروضة خارج الضرائب (HT). تُضاف TVA 19% ورسم الطابع عند إصدار الفاتورة حسب القانون الجزائري.',
      fr: 'Non, les prix affichés sont hors taxes (HT). La TVA 19% et le droit de timbre sont ajoutés à la facture selon la législation algérienne.',
    },
  },
  {
    category: 'pricing',
    q: {
      ar: 'هل يمكنني تغيير خطتي لاحقاً؟',
      fr: 'Puis-je changer de formule plus tard ?',
    },
    a: {
      ar: 'بالتأكيد. يمكنك الترقية أو التخفيض في أي وقت من لوحة التحكم. التعديل يسري من الشهر التالي.',
      fr: 'Bien sûr. Vous pouvez passer à une formule supérieure ou inférieure à tout moment depuis votre tableau de bord. Le changement prend effet le mois suivant.',
    },
  },
  {
    category: 'pricing',
    q: {
      ar: 'هل هناك رسوم إعداد أو تثبيت؟',
      fr: "Y a-t-il des frais d'installation ou de mise en route ?",
    },
    a: {
      ar: 'لا. لا توجد أي رسوم مخفية. السعر المعلن هو السعر الفعلي. التفعيل فوري ومجاني. التدريب الأولي متضمن في كل الخطط.',
      fr: "Non. Il n'y a aucun frais caché. Le prix affiché est le prix réel. L'activation est immédiate et gratuite. La formation initiale est incluse dans toutes les formules.",
    },
  },

  // ── Features ──
  {
    category: 'features',
    q: {
      ar: 'هل يدعم TrackSera مستودعات متعددة؟',
      fr: 'TrackSera supporte-t-il plusieurs entrepôts ?',
    },
    a: {
      ar: 'نعم، من خطة Pro. يمكنك إدارة مستودعات غير محدودة، القيام بتحويلات بين المستودعات، وتتبع المخزون في كل موقع بشكل منفصل.',
      fr: "Oui, à partir de la formule Pro. Vous pouvez gérer un nombre illimité d'entrepôts, effectuer des transferts entre entrepôts et suivre le stock de chaque emplacement séparément.",
    },
  },
  {
    category: 'features',
    q: {
      ar: 'هل يحتوي على نظام كاشير (POS)؟',
      fr: 'Y a-t-il un système de caisse (POS) ?',
    },
    a: {
      ar: 'نعم، TrackSera يحتوي على نظام كاشير احترافي متاح من خطة Pro. يعمل على الحاسوب أو التابلت، يدعم الطابعات الحرارية، قارئ الباركود، وإدارة صناديق متعددة مع تسويات يومية.',
      fr: 'Oui, TrackSera comprend un système de caisse professionnel disponible à partir de la formule Pro. Il fonctionne sur PC ou tablette, supporte les imprimantes thermiques, les lecteurs de code-barres, et la gestion de plusieurs caisses avec clôtures journalières.',
    },
  },
  {
    category: 'features',
    q: {
      ar: 'هل هناك تتبع GPS للسائقين؟',
      fr: 'Y a-t-il un suivi GPS des livreurs ?',
    },
    a: {
      ar: 'نعم، من خطة Pro. تتبع السائقين مباشرة على الخريطة، تاريخ الجولات، المسافات المقطوعة، وتلقي إشعارات عند تسليم كل طلب.',
      fr: "Oui, à partir de la formule Pro. Suivi des livreurs en temps réel sur une carte, historique des tournées, distances parcourues, et notifications à chaque livraison effectuée.",
    },
  },
  {
    category: 'features',
    q: {
      ar: 'ما هو البيع المتنقل (Cashvan)؟',
      fr: "Qu'est-ce que la vente mobile (Cashvan) ?",
    },
    a: {
      ar: 'البيع المتنقل هو نظام يسمح لفرقك الميدانية بالبيع مباشرة من السيارة. البائع يحمّل المنتجات في الصباح، يبيع مباشرة للعملاء خلال اليوم، ويسجل كل عملية في التطبيق. في آخر اليوم، يُسوَّى المخزون والتحصيل تلقائياً. متاح من خطة Business.',
      fr: "La vente mobile est un système qui permet à vos équipes terrain de vendre directement depuis leur véhicule. Le vendeur charge les produits le matin, vend aux clients pendant la journée, et enregistre chaque transaction dans l'app. En fin de journée, le stock et les encaissements sont réconciliés automatiquement. Disponible à partir de la formule Business.",
    },
  },
  {
    category: 'features',
    q: {
      ar: 'هل الفواتير مطابقة للقانون الجزائري؟',
      fr: 'Les factures sont-elles conformes à la législation algérienne ?',
    },
    a: {
      ar: 'نعم. فواتير TrackSera تحتوي على كل المعلومات الإلزامية: الرقم التسلسلي، NIF، NIS، RC، TVA 19%، رسم الطابع، المبلغ بالأحرف، وكل المعلومات المطلوبة من طرف المديرية العامة للضرائب.',
      fr: 'Oui. Les factures TrackSera contiennent toutes les mentions obligatoires : numéro séquentiel, NIF, NIS, RC, TVA 19%, droit de timbre, montant en lettres, et toutes les informations exigées par la Direction Générale des Impôts.',
    },
  },
  {
    category: 'features',
    q: {
      ar: 'هل يمكنني استيراد منتجاتي من ملف Excel؟',
      fr: 'Puis-je importer mes produits depuis un fichier Excel ?',
    },
    a: {
      ar: 'نعم. لدينا أداة استيراد Excel/CSV للمنتجات، العملاء، والموردين. نوفر قوالب جاهزة لتسهيل عملية الاستيراد. الفريق يساعدك مجاناً في الاستيراد الأولي.',
      fr: "Oui. Nous avons un outil d'import Excel/CSV pour les produits, clients et fournisseurs. Nous fournissons des modèles prêts à l'emploi pour faciliter l'import. L'équipe vous aide gratuitement pour l'import initial.",
    },
  },
  {
    category: 'features',
    q: {
      ar: 'هل يوجد تطبيق موبايل؟',
      fr: 'Y a-t-il une application mobile ?',
    },
    a: {
      ar: 'نعم، لدينا 3 تطبيقات Android: تطبيق للسائق (تتبع الجولات وتسليم الطلبات)، تطبيق للبائع المتنقل (Cashvan)، وتطبيق للمدير (لوحة تحكم وتقارير سريعة). كلها متزامنة فوراً مع النظام السحابي.',
      fr: "Oui, nous avons 3 applications Android : une app pour le livreur (suivi des tournées et livraisons), une app pour le vendeur mobile (Cashvan), et une app pour le gérant (tableau de bord et rapports rapides). Toutes sont synchronisées instantanément avec le système cloud.",
    },
  },
  {
    category: 'features',
    q: {
      ar: 'هل يمكن إدارة الديون والتحصيلات؟',
      fr: 'Peut-on gérer les dettes et les encaissements ?',
    },
    a: {
      ar: 'نعم. TrackSera يتتبع كل ديون العملاء، يسجل التحصيلات (نقداً، شيك، CCP، Edahabia)، يُرسل تنبيهات للفواتير المتأخرة، ويولد كشوفات حساب تفصيلية لكل عميل.',
      fr: 'Oui. TrackSera suit toutes les créances clients, enregistre les encaissements (espèces, chèque, CCP, Edahabia), envoie des alertes pour les factures en retard, et génère des relevés de compte détaillés pour chaque client.',
    },
  },

  // ── Technical ──
  {
    category: 'technical',
    q: {
      ar: 'ما هي متطلبات النظام؟',
      fr: 'Quelles sont les configurations requises ?',
    },
    a: {
      ar: 'تحتاج فقط حاسوب أو تابلت بمتصفح حديث (Chrome، Edge، Firefox، Safari) واتصال بالإنترنت. للتطبيقات الموبايل: Android 8.0 أو أحدث.',
      fr: "Vous avez seulement besoin d'un ordinateur ou d'une tablette avec un navigateur récent (Chrome, Edge, Firefox, Safari) et une connexion Internet. Pour les applications mobiles : Android 8.0 ou plus récent.",
    },
  },
  {
    category: 'technical',
    q: {
      ar: 'هل يعمل بدون إنترنت؟',
      fr: 'Fonctionne-t-il sans Internet ?',
    },
    a: {
      ar: 'واجهة الويب تحتاج إنترنت (عادي، 3G/4G، أو WiFi). أما تطبيقات الموبايل للسائق والبائع المتنقل، فتعمل في وضع عدم الاتصال وتتزامن تلقائياً عند استعادة الاتصال.',
      fr: "L'interface web nécessite Internet (ADSL, 3G/4G ou WiFi). Les applications mobiles pour livreurs et vendeurs mobiles fonctionnent en mode hors ligne et se synchronisent automatiquement dès que la connexion revient.",
    },
  },
  {
    category: 'technical',
    q: {
      ar: 'هل يمكنني استخدام طابعة حرارية أو قارئ باركود؟',
      fr: 'Puis-je utiliser une imprimante thermique ou un lecteur de code-barres ?',
    },
    a: {
      ar: 'نعم. TrackSera يدعم الطابعات الحرارية الشائعة (Epson، Xprinter، إلخ) لطباعة إيصالات الكاشير، وقارئات الباركود USB أو البلوتوث لإضافة المنتجات بسرعة.',
      fr: 'Oui. TrackSera supporte les imprimantes thermiques courantes (Epson, Xprinter, etc.) pour imprimer les tickets de caisse, et les lecteurs de code-barres USB ou Bluetooth pour ajouter les produits rapidement.',
    },
  },
  {
    category: 'technical',
    q: {
      ar: 'هل يمكنني تصدير بياناتي؟',
      fr: 'Puis-je exporter mes données ?',
    },
    a: {
      ar: 'نعم. كل بياناتك (منتجات، عملاء، فواتير، حركات المخزون، التقارير) قابلة للتصدير إلى Excel في أي وقت. بياناتك ملكك.',
      fr: 'Oui. Toutes vos données (produits, clients, factures, mouvements de stock, rapports) sont exportables en Excel à tout moment. Vos données vous appartiennent.',
    },
  },
  {
    category: 'technical',
    q: {
      ar: 'كم مستخدم يمكنني إضافة؟',
      fr: "Combien d'utilisateurs puis-je ajouter ?",
    },
    a: {
      ar: 'يختلف حسب الخطة: Free و Starter = مستخدم واحد، Pro = 5 مستخدمين (+1,500 د.ج لكل مستخدم إضافي)، Business = 10 مستخدمين (+1,000 د.ج لكل مستخدم إضافي). كل مستخدم يحصل على دور مخصص (مدير، بائع، سائق، إلخ).',
      fr: 'Cela dépend de la formule : Free et Starter = 1 utilisateur, Pro = 5 utilisateurs (+1 500 DA par utilisateur supplémentaire), Business = 10 utilisateurs (+1 000 DA par utilisateur supplémentaire). Chaque utilisateur a un rôle personnalisé (admin, vendeur, livreur, etc.).',
    },
  },

  // ── Security ──
  {
    category: 'security',
    q: {
      ar: 'هل بياناتي آمنة؟',
      fr: 'Mes données sont-elles en sécurité ?',
    },
    a: {
      ar: 'نعم. نستخدم تشفير SSL/TLS لكل الاتصالات، قاعدة بيانات محمية، نسخ احتياطية يومية تلقائية على خوادم متعددة، ونسخة احتياطية أسبوعية خارج الموقع. بياناتك ملكك ومحمية.',
      fr: 'Oui. Nous utilisons un chiffrement SSL/TLS pour toutes les communications, une base de données protégée, des sauvegardes quotidiennes automatiques sur plusieurs serveurs, et une sauvegarde hebdomadaire hors-site. Vos données vous appartiennent et sont protégées.',
    },
  },
  {
    category: 'security',
    q: {
      ar: 'من يستطيع الوصول إلى بياناتي؟',
      fr: 'Qui peut accéder à mes données ?',
    },
    a: {
      ar: 'أنت فقط والمستخدمون الذين تمنحهم الصلاحية. كل حساب معزول بشكل كامل عن الحسابات الأخرى. فريقنا التقني لا يصل إلى بياناتك إلا بطلب صريح منك لغرض الدعم الفني.',
      fr: "Vous seul, et les utilisateurs à qui vous accordez les droits. Chaque compte est totalement isolé des autres. Notre équipe technique n'accède à vos données que sur votre demande explicite dans le cadre du support.",
    },
  },
  {
    category: 'security',
    q: {
      ar: 'ماذا يحدث إذا توقفت عن الاشتراك؟',
      fr: "Que se passe-t-il si j'arrête mon abonnement ?",
    },
    a: {
      ar: 'بياناتك تبقى محفوظة لمدة 30 يوم بعد انتهاء الاشتراك، يمكنك تصديرها كاملة خلال هذه الفترة. بعد ذلك، تُحذف نهائياً احتراماً لخصوصيتك.',
      fr: "Vos données restent conservées pendant 30 jours après la fin de l'abonnement, et vous pouvez les exporter intégralement pendant cette période. Au-delà, elles sont définitivement supprimées par respect de votre vie privée.",
    },
  },
  {
    category: 'security',
    q: {
      ar: 'هل تدعمون المصادقة الثنائية (2FA)؟',
      fr: 'Supportez-vous l\'authentification à deux facteurs (2FA) ?',
    },
    a: {
      ar: 'نعم. يمكن لكل مستخدم تفعيل المصادقة الثنائية عبر تطبيقات مثل Google Authenticator لحماية إضافية للحساب.',
      fr: "Oui. Chaque utilisateur peut activer l'authentification à deux facteurs via des applications comme Google Authenticator pour une protection supplémentaire du compte.",
    },
  },

  // ── Support ──
  {
    category: 'support',
    q: {
      ar: 'كيف أحصل على الدعم الفني؟',
      fr: "Comment obtenir du support technique ?",
    },
    a: {
      ar: 'الدعم متاح عبر البريد الإلكتروني، الهاتف، والواتساب. أوقات الاستجابة: Starter خلال 24 ساعة، Pro خلال 4 ساعات، Business خلال ساعة واحدة (أولوية). كل الدعم بالعربية والفرنسية.',
      fr: "Le support est disponible par email, téléphone et WhatsApp. Délais de réponse : Starter sous 24h, Pro sous 4h, Business sous 1h (prioritaire). Tout le support est en arabe et en français.",
    },
  },
  {
    category: 'support',
    q: {
      ar: 'هل يوجد تدريب عند البداية؟',
      fr: 'Y a-t-il une formation au démarrage ?',
    },
    a: {
      ar: 'نعم. كل الخطط تشمل جلسة تدريب عن بعد مجانية لتعريفك بالنظام. لخطة Business، نقدم تدريباً مخصصاً أطول ومعمقاً لفريقك كاملاً.',
      fr: "Oui. Toutes les formules incluent une session de formation à distance gratuite pour vous présenter le système. Pour la formule Business, nous offrons une formation dédiée plus longue et approfondie pour toute votre équipe.",
    },
  },
  {
    category: 'support',
    q: {
      ar: 'هل لديكم وثائق أو فيديوهات تعليمية؟',
      fr: 'Avez-vous une documentation ou des vidéos tutorielles ?',
    },
    a: {
      ar: 'نعم. لدينا مركز مساعدة كامل مع مقالات تفصيلية، فيديوهات قصيرة لكل وحدة، ودليل مستخدم PDF بالعربية والفرنسية. متاحة من داخل التطبيق.',
      fr: "Oui. Nous avons un centre d'aide complet avec des articles détaillés, des vidéos courtes pour chaque module, et un guide utilisateur PDF en arabe et en français. Accessibles directement depuis l'application.",
    },
  },
  {
    category: 'support',
    q: {
      ar: 'هل يمكنني طلب ميزة جديدة؟',
      fr: 'Puis-je demander une nouvelle fonctionnalité ?',
    },
    a: {
      ar: 'بالتأكيد. نستمع دائماً لعملائنا ونُضيف الميزات الأكثر طلباً في كل تحديث. أرسل لنا طلبك عبر البريد أو الواتساب، وسنقيّم إمكانية إضافتها في خارطة الطريق.',
      fr: "Absolument. Nous écoutons toujours nos clients et ajoutons les fonctionnalités les plus demandées à chaque mise à jour. Envoyez-nous votre demande par email ou WhatsApp, et nous évaluerons son intégration dans la roadmap.",
    },
  },
];
