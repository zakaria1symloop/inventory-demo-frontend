import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'gerer-retours-distribution-algerie',
  category: 'guides',
  date: '2026-05-09',
  readTime: 8,
  author: 'TrackSera',
  emoji: '↩️',
  gradient: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
  countries: ['DZ', 'MA', 'TN', 'SN', 'CI', 'CM'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  faqs: [
    {
      question: {
        ar: 'كيف يجب توثيق إرجاع العميل قانونيًا؟',
        fr: 'Comment documenter légalement un retour client ?',
        en: 'How should a customer return be documented legally?',
      },
      answer: {
        ar: 'بإصدار إشعار دائن (Avoir) مرقم بشكل متسلسل، يشير إلى رقم الفاتورة الأصلية، يُفصل المنتجات والكميات والمبلغ HT و TVA. لا يكفي ملاحظة على الفاتورة الأصلية.',
        fr: "En émettant un avoir (note de crédit) numéroté séquentiellement, faisant référence au numéro de facture d'origine, détaillant produits, quantités, montant HT et TVA. Une simple annotation sur la facture ne suffit pas.",
        en: 'Issue a sequentially-numbered credit note that references the original invoice, with line-level detail for products, quantities, net amount, and VAT. A handwritten note on the original invoice is not enough.',
      },
    },
    {
      question: {
        ar: 'هل يجب إرجاع المنتج إلى المخزون آليًا؟',
        fr: 'Le produit retourné doit-il revenir automatiquement en stock ?',
        en: 'Should returned products go back to stock automatically?',
      },
      answer: {
        ar: 'يعتمد على حالته: (1) صالح للبيع → نعم، يعود إلى المخزون الرئيسي، (2) تالف لكن قابل للإصلاح → مخزون "إصلاح"، (3) منتهي الصلاحية أو محطم → مخزون "تلف" مع شطب من الجرد. كل حالة لها معالجتها المحاسبية.',
        fr: "Cela dépend de l'état : (1) revendable → oui, retour stock principal, (2) abîmé mais réparable → stock \"réparation\", (3) périmé ou cassé → stock \"casse\" avec sortie d'inventaire. Chaque cas a son traitement comptable.",
        en: 'It depends on condition: (1) resellable → yes, back to main stock; (2) damaged but repairable → "repair" stock; (3) expired or broken → "write-off" stock with inventory removal. Each case has a different accounting treatment.',
      },
    },
    {
      question: {
        ar: 'ماذا أفعل إذا رفض المورد إرجاع منتجًا تالفًا؟',
        fr: 'Que faire si le fournisseur refuse un retour de produit défectueux ?',
        en: 'What if the supplier refuses to take back a defective product?',
      },
      answer: {
        ar: 'المنتجات التالفة عند الاستلام يجب التحفظ عليها فورًا (في 48 ساعة عادةً)، بصور وشهود وإشعار خطي. إذا رفض المورد رغم ذلك، يجب توثيق ذلك وحجز الدفع. القانون التجاري الجزائري يحمي المشتري في هذه الحالة.',
        fr: "Les défauts à réception doivent être consignés immédiatement (48h en général), avec photos, témoins, et notification écrite. Si le fournisseur refuse malgré tout, documentez et bloquez le paiement. Le code de commerce algérien protège l'acheteur dans ce cas.",
        en: "Defects on receipt must be documented immediately (typically within 48h) with photos, witnesses, and a written notice. If the supplier still refuses, document everything and block payment. Commercial law generally protects the buyer in this case.",
      },
    },
    {
      question: {
        ar: 'كيف أتعامل مع TVA على الإشعار الدائن؟',
        fr: 'Comment gérer la TVA sur un avoir ?',
        en: 'How do I handle VAT on a credit note?',
      },
      answer: {
        ar: 'إشعار دائن "ينقص" من TVA المُحصلة. مثلاً بعت 10,000 دج HT + 1,900 دج TVA، وأصدرت إشعار دائن بـ2,000 دج HT + 380 دج TVA: في إعلان G50 الشهري، تُعلن 8,000 دج HT و 1,520 دج TVA على هذه العملية.',
        fr: 'Un avoir "déduit" la TVA collectée. Ex. vous avez vendu 10 000 DA HT + 1 900 DA TVA, et émis un avoir de 2 000 DA HT + 380 DA TVA : dans la déclaration G50 mensuelle, vous déclarez 8 000 DA HT et 1 520 DA TVA sur cette opération.',
        en: 'A credit note "subtracts" from collected VAT. Example: you sold 10,000 net + 1,900 VAT, then issued a 2,000 net + 380 VAT credit note. In the monthly VAT return, you declare 8,000 net and 1,520 VAT for that operation.',
      },
    },
    {
      question: {
        ar: 'ما النسبة العادية للمرتجعات في التوزيع؟',
        fr: 'Quel est le taux normal de retours en distribution ?',
        en: 'What is a normal return rate in distribution?',
      },
      answer: {
        ar: 'يختلف بالقطاع: الغذاء 1-3%، التجميل/النظافة 0.5-2%، الإلكترونيات 3-7%. إذا تجاوزت 5% بشكل ثابت، يوجد مشكلة في الجودة، التسليم، أو إدارة المخزون. عليك التحقيق.',
        fr: "Variable par secteur : alimentaire 1-3%, hygiène/cosmétique 0,5-2%, électronique 3-7%. Si vous dépassez 5% de façon constante, il y a un problème de qualité, livraison, ou gestion stock. Enquêtez.",
        en: 'It varies by sector: food 1-3%, hygiene/cosmetics 0.5-2%, electronics 3-7%. If you consistently exceed 5%, there is a quality, delivery, or stock-management problem. Investigate.',
      },
    },
  ],
};

export default post;
