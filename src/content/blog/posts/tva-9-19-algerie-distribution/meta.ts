import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'tva-9-19-algerie-distribution',
  category: 'guides',
  date: '2026-05-09',
  readTime: 9,
  author: 'TrackSera',
  emoji: '📊',
  gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
  countries: ['DZ'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  faqs: [
    {
      question: {
        ar: 'ما النسبة الأساسية للـTVA في الجزائر؟',
        fr: 'Quel est le taux de TVA de base en Algérie ?',
        en: 'What is the standard VAT rate in Algeria?',
      },
      answer: {
        ar: 'النسبة الأساسية هي 19%. تطبق على معظم السلع والخدمات. النسبة المخفضة 9% للمنتجات الأساسية والقطاعات ذات الأولوية الاجتماعية.',
        fr: "Le taux de base est 19%. Il s'applique à la majorité des biens et services. Le taux réduit de 9% concerne les produits essentiels et secteurs prioritaires.",
        en: 'The standard rate is 19%, applied to most goods and services. The reduced rate of 9% covers essential products and socially-priority categories (rates vary by country — check local rules).',
      },
    },
    {
      question: {
        ar: 'هل المنتجات الغذائية كلها بـ9%؟',
        fr: 'Tous les produits alimentaires sont-ils à 9% ?',
        en: 'Are all food products at the reduced VAT rate?',
      },
      answer: {
        ar: 'لا. المواد الأساسية (الخبز، الحليب، السكر، الزيت، السميد، الدقيق، الفواكه والخضر الطازجة) بـ9%. المنتجات المُحضرة (المعكرونة، البسكويت، المشروبات الغازية، الشوكولاطة) بـ19%.',
        fr: 'Non. Les produits de base (pain, lait, sucre, huile, semoule, farine, fruits et légumes frais) sont à 9%. Les produits transformés (pâtes, biscuits, sodas, chocolat) sont à 19%.',
        en: 'No. Staple products (bread, milk, sugar, oil, semolina, flour, fresh fruit and vegetables) sit at the reduced rate. Processed goods (pasta, biscuits, soft drinks, chocolate) sit at the standard rate.',
      },
    },
    {
      question: {
        ar: 'كيف أعرف نسبة TVA الصحيحة لمنتج محدد؟',
        fr: "Comment connaître le taux TVA exact d'un produit ?",
        en: 'How do I look up the correct VAT rate for a specific product?',
      },
      answer: {
        ar: 'انظر في قانون المالية الجاري ومدونة الضرائب على رقم الأعمال (المادة 21 لـ9% والمادة 23 لـ19%). إذا كان منتجك ليس في القائمة 9%، فهو افتراضيًا 19%. عند الشك، استشر محاسبًا.',
        fr: "Consultez la loi de finances en vigueur et le code TCA (article 21 pour 9%, article 23 pour 19%). Si votre produit n'est pas dans la liste 9%, il est par défaut à 19%. En cas de doute, consultez un comptable.",
        en: "Check your country's current finance law and turnover tax code. If your product isn't on the reduced-rate list, the standard rate applies by default. When in doubt, talk to an accountant.",
      },
    },
    {
      question: {
        ar: 'هل هناك منتجات معفاة من TVA؟',
        fr: 'Existe-t-il des produits exonérés de TVA ?',
        en: 'Are there products exempt from VAT?',
      },
      answer: {
        ar: 'نعم. الصادرات (نسبة 0%)، خدمات الصحة، التعليم، النقل العمومي، والإيجار السكني معفاة. المنتجات الفلاحية الطازجة المباعة من المنتج مباشرة أيضًا معفاة.',
        fr: "Oui. Les exportations (taux 0%), les services de santé, l'éducation, le transport public, et la location résidentielle sont exonérés. Les produits agricoles frais vendus directement par le producteur aussi.",
        en: 'Yes. Exports (zero-rated), healthcare services, education, public transport, and residential rentals are exempt. Raw farm produce sold directly by the producer is exempt too.',
      },
    },
    {
      question: {
        ar: 'ماذا يحدث إذا طبقت نسبة TVA خاطئة؟',
        fr: "Que se passe-t-il si j'applique le mauvais taux TVA ?",
        en: 'What happens if I apply the wrong VAT rate?',
      },
      answer: {
        ar: 'إذا طبقت 9% بدل 19%، الإدارة الضريبية ستطلب الفرق + غرامة 25% + فوائد التأخير. إذا طبقت 19% بدل 9%، تكون قد ظلمت عميلك (وقد يطلب التعويض). الأفضل: ضبط البرنامج بشكل صحيح من البداية.',
        fr: "Si vous appliquez 9% au lieu de 19%, le fisc réclamera la différence + 25% d'amende + intérêts de retard. Si 19% au lieu de 9%, vous avez lésé votre client (qui peut demander remboursement). Mieux : configurer le logiciel correctement d'emblée.",
        en: "If you under-charge VAT, the tax authority will claim the gap plus a penalty (often 25%) plus late interest. If you over-charge, your customer may demand a refund. The fix: configure your software correctly from day one.",
      },
    },
    {
      question: {
        ar: 'هل يمكن لفاتورة واحدة أن تحتوي على نسبتين؟',
        fr: 'Une même facture peut-elle contenir les deux taux ?',
        en: 'Can a single invoice carry multiple VAT rates?',
      },
      answer: {
        ar: 'نعم تمامًا. توزع البقالة قد تبيع: الحليب (9%) + المعكرونة (19%) + المشروبات الغازية (19%) في نفس الفاتورة. يجب أن يميز البرنامج كل سطر ويحسب TVA منفصلة لكل نسبة.',
        fr: 'Oui parfaitement. Un grossiste alimentaire peut vendre : lait (9%) + pâtes (19%) + sodas (19%) sur la même facture. Le logiciel doit distinguer chaque ligne et calculer la TVA séparément par taux.',
        en: 'Yes, absolutely. A food wholesaler can sell milk (reduced) + pasta (standard) + soft drinks (standard) on the same invoice. Your software must treat each line independently and compute VAT per rate.',
      },
    },
  ],
};

export default post;
