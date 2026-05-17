import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'calculer-marge-distributeur-algerie',
  category: 'guides',
  date: '2026-05-09',
  readTime: 8,
  author: 'TrackSera',
  emoji: '💰',
  gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
  countries: ['DZ', 'MA', 'TN', 'SN', 'CI', 'CM'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  howTo: {
    name: {
      ar: 'كيف تحسب هامش منتجاتك في 5 دقائق',
      fr: 'Comment calculer la marge de vos produits en 5 minutes',
      en: 'How to calculate product margin in 5 minutes',
    },
    steps: [
      {
        name: {
          ar: 'احسب التكلفة الكاملة',
          fr: 'Calculez le coût total',
          en: 'Calculate the full landed cost',
        },
        text: {
          ar: 'سعر الشراء + الجمارك + النقل + التخزين + التأمين. لا تنس التكاليف غير المباشرة (راتب الموزع، الوقود، استهلاك المركبات).',
          fr: "Prix d'achat + douanes + transport + stockage + assurance. N'oubliez pas les coûts indirects (salaire livreur, carburant, usure véhicules).",
          en: "Purchase price + duties + transport + storage + insurance. Don't forget indirect costs (driver wages, fuel, vehicle wear).",
        },
      },
      {
        name: {
          ar: 'حدد سعر البيع HT',
          fr: 'Fixez le prix de vente HT',
          en: 'Set the net selling price',
        },
        text: {
          ar: 'سعر بيعك دون TVA. ابحث في السوق: ما الذي يدفعه عملاؤك مقابل المنتج المُنافس؟ سعرك يجب أن يكون قريبًا، وليس أعلى بكثير.',
          fr: 'Votre prix de vente sans TVA. Étudiez le marché : que paient vos clients pour le produit concurrent ? Votre prix doit être proche, pas beaucoup plus élevé.',
          en: 'Your selling price excluding VAT. Survey the market: what are customers paying for the competing product? Your price should be close — not much higher.',
        },
      },
      {
        name: {
          ar: 'احسب الهامش الإجمالي',
          fr: 'Calculez la marge brute',
          en: 'Compute the gross margin',
        },
        text: {
          ar: 'الهامش الإجمالي = (سعر البيع HT - التكلفة الكاملة) ÷ سعر البيع HT × 100. مثلاً: (1200-900) ÷ 1200 = 25% هامش.',
          fr: 'Marge brute = (Prix vente HT - Coût total) ÷ Prix vente HT × 100. Exemple : (1200-900) ÷ 1200 = 25% de marge.',
          en: 'Gross margin = (Net selling price − Full cost) ÷ Net selling price × 100. Example: (1200−900) ÷ 1200 = 25% margin.',
        },
      },
      {
        name: {
          ar: 'احسب نقطة التعادل',
          fr: 'Calculez le seuil de rentabilité',
          en: 'Calculate the break-even point',
        },
        text: {
          ar: 'كم يجب أن تبيع شهريًا لتغطية المصاريف الثابتة (الإيجار، الرواتب، الطاقة)؟ المصاريف الثابتة الشهرية ÷ متوسط الهامش بالدج لكل وحدة = العدد المطلوب.',
          fr: 'Combien faut-il vendre par mois pour couvrir les charges fixes (loyer, salaires, énergie) ? Charges fixes mensuelles ÷ marge moyenne en DA par unité = quantité nécessaire.',
          en: 'How much do you need to sell per month to cover fixed costs (rent, payroll, utilities)? Monthly fixed costs ÷ average margin per unit = required units.',
        },
      },
      {
        name: {
          ar: 'راقب وعدل أسبوعيًا',
          fr: 'Suivez et ajustez chaque semaine',
          en: 'Track and adjust weekly',
        },
        text: {
          ar: 'الهامش لا يبقى ثابتًا — أسعار الموردين تتغير، تكاليف الوقود ترتفع. راجع كل أسبوع. ضبط 1% في السعر = آلاف الدنانير شهريًا.',
          fr: "La marge ne reste pas figée — prix fournisseurs changent, carburant augmente. Révisez chaque semaine. 1% d'ajustement de prix = milliers de DA par mois.",
          en: "Margin doesn't sit still — supplier prices move, fuel goes up. Review weekly. A 1% price adjustment can mean thousands per month.",
        },
      },
    ],
  },
  faqs: [
    {
      question: {
        ar: 'ما الفرق بين الهامش والمردود؟',
        fr: 'Quelle différence entre marge et marque (markup) ?',
        en: 'What is the difference between margin and markup?',
      },
      answer: {
        ar: 'الهامش = الربح ÷ سعر البيع. المردود = الربح ÷ التكلفة. مثلاً منتج بتكلفة 100 وبيع 150: الهامش = 50/150 = 33%، المردود = 50/100 = 50%. الناس يخلطون باستمرار، فيتخذون قرارات خاطئة.',
        fr: 'Marge = Profit ÷ Prix vente. Marque = Profit ÷ Coût. Ex. produit coût 100, vendu 150 : marge = 50/150 = 33%, marque = 50/100 = 50%. Les gens confondent en permanence, et prennent de mauvaises décisions.',
        en: 'Margin = Profit ÷ Selling price. Markup = Profit ÷ Cost. Example: cost 100, sold 150 → margin = 50/150 = 33%, markup = 50/100 = 50%. Most people confuse them and make bad pricing calls.',
      },
    },
    {
      question: {
        ar: 'ما هو متوسط هامش الموزع في الجزائر؟',
        fr: "Quelle est la marge moyenne d'un distributeur en Algérie ?",
        en: 'What is a typical distributor margin?',
      },
      answer: {
        ar: 'يختلف حسب القطاع: الغذاء العام 8-15%، المشروبات 12-22%، التجميل والتنظيف 18-30%، الإلكترونيات 5-12%. الموزعون الجدد غالبًا يستهدفون 20% ويصلون إلى 12% بسبب التكاليف غير المرئية.',
        fr: 'Variable par secteur : alimentaire général 8-15%, boissons 12-22%, cosmétique/hygiène 18-30%, électronique 5-12%. Les nouveaux distributeurs visent souvent 20% et atterrissent à 12% à cause des coûts invisibles.',
        en: 'It varies by sector: general grocery 8-15%, beverages 12-22%, hygiene/cosmetics 18-30%, electronics 5-12%. New distributors often target 20% and land at 12% because of invisible indirect costs.',
      },
    },
    {
      question: {
        ar: 'كيف أحسب التكاليف غير المباشرة؟',
        fr: 'Comment calculer les coûts indirects ?',
        en: 'How do I calculate indirect costs?',
      },
      answer: {
        ar: 'اجمع كل المصاريف الثابتة الشهرية (الإيجار، الرواتب، الوقود، الكهرباء، الإنترنت، الصيانة)، اقسمها على عدد الوحدات المباعة شهريًا. هذا يعطيك "تكلفة غير مباشرة لكل وحدة" يجب إضافتها إلى التكلفة المباشرة.',
        fr: 'Additionnez toutes les charges fixes mensuelles (loyer, salaires, carburant, électricité, internet, entretien), divisez par le nombre d\'unités vendues par mois. Cela donne le "coût indirect par unité" à ajouter au coût direct.',
        en: 'Add up all monthly fixed costs (rent, payroll, fuel, electricity, internet, maintenance) and divide by the number of units sold per month. That gives you an "indirect cost per unit" to add on top of the direct product cost.',
      },
    },
    {
      question: {
        ar: 'هل يمكن أن يكون الهامش سالبًا؟',
        fr: 'La marge peut-elle être négative ?',
        en: 'Can margin be negative?',
      },
      answer: {
        ar: 'نعم، إذا بعت بأقل من التكلفة. شائع جدًا في 3 حالات: (1) الترقيات لمكافحة المنافسة، (2) المنتجات قرب انتهاء الصلاحية، (3) عدم احتساب التكاليف غير المباشرة. الأخير هو الأكثر خطورة لأنه غير مرئي.',
        fr: 'Oui, si vous vendez en-dessous du coût. Très courant dans 3 cas : (1) promotions face à concurrence, (2) produits proches DLC, (3) oubli des coûts indirects. Le dernier est le plus dangereux car invisible.',
        en: "Yes, if you sell below cost. Very common in 3 cases: (1) promotions to fight competition, (2) products close to expiry, (3) forgetting indirect costs. The third is the most dangerous because it's invisible.",
      },
    },
    {
      question: {
        ar: 'هل برنامج التوزيع يحسب الهامش تلقائيًا؟',
        fr: 'Un logiciel de distribution calcule-t-il la marge automatiquement ?',
        en: 'Does distribution software calculate margin automatically?',
      },
      answer: {
        ar: 'نعم، البرامج الجيدة تحسب: هامش لكل منتج، هامش لكل عميل، هامش لكل سائق، هامش لكل ولاية. هذا يكشف الزبائن غير المربحين والمنتجات الميتة. <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 أرقام للمراقبة كل صباح</a> يفصل في هذا الموضوع.',
        fr: 'Oui, les bons logiciels calculent : marge par produit, par client, par livreur, par wilaya. Cela révèle les clients non rentables et les produits morts. <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 chiffres à surveiller chaque matin</a> détaille ce sujet.',
        en: 'Yes, good software computes margin per product, per customer, per driver, per region. This is what surfaces unprofitable customers and dead SKUs. <a href="/blog/tableau-de-bord-distributeur-5-chiffres">5 numbers to watch every morning</a> goes deeper.',
      },
    },
  ],
};

export default post;
