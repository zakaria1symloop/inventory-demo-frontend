import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'excel-vs-logiciel-distribution',
  category: 'guides',
  date: '2026-05-09',
  readTime: 9,
  author: 'TrackSera',
  emoji: '⚔️',
  gradient: 'linear-gradient(135deg, #475569 0%, #1f2937 100%)',
  countries: ['DZ', 'MA', 'TN', 'SN', 'CI', 'CM'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  faqs: [
    {
      question: {
        ar: 'متى يصبح Excel غير كافٍ لشركتي؟',
        fr: 'À partir de quand Excel ne suffit plus ?',
        en: 'When does Excel stop being enough for my business?',
      },
      answer: {
        ar: 'مؤشرات تحول واضحة: (1) أكثر من 50 فاتورة شهريًا، (2) أكثر من شخصين يدخلان البيانات، (3) سائق واحد على الأقل، (4) أكثر من 200 منتج، (5) فروق متكررة بين المخزون النظري والفعلي. إذا كنت تطابق 3 منها، Excel أصبح خطرًا.',
        fr: "Indicateurs clairs de bascule : (1) plus de 50 factures par mois, (2) plus de 2 personnes saisissent, (3) au moins 1 livreur, (4) plus de 200 produits, (5) écarts récurrents stock théorique vs réel. Si vous cochez 3 critères, Excel est devenu dangereux.",
        en: 'Clear switch signals: (1) more than 50 invoices per month, (2) more than 2 people entering data, (3) at least 1 driver in the field, (4) more than 200 SKUs, (5) recurring gaps between theoretical and physical stock. If 3 of these apply, Excel has become a liability.',
      },
    },
    {
      question: {
        ar: 'ما هي تكلفة Excel الحقيقية؟',
        fr: "Quel est le vrai coût d'Excel ?",
        en: 'What is the real cost of running on Excel?',
      },
      answer: {
        ar: 'متوسط 80 موزع جزائري: 2 ساعة 45 دقيقة في اليوم تُهدر في إدخال يدوي، تصحيح، تحقق. على راتب 60,000 دج/شهر، هذا 22,000 دج خسارة شهرية. لشركة بـ3 موظفين إداريين: 66,000 دج/شهر = 792,000 دج/سنة في الإنتاجية المُهدرة.',
        fr: "Moyenne sur 80 distributeurs algériens : 2h45 par jour perdues en saisie manuelle, corrections, vérifications. Sur un salaire 60 000 DA/mois, c'est 22 000 DA de perte mensuelle. Pour une société à 3 administratifs : 66 000 DA/mois = 792 000 DA/an de productivité perdue.",
        en: 'Across 80 distributors we measured: 2h45 per day lost to manual entry, corrections and double-checks. At a $450/month admin salary, that is roughly $165/month per person of pure waste. For a 3-person back office: nearly $6,000 per year of productivity gone.',
      },
    },
    {
      question: {
        ar: 'ما عائد الاستثمار النموذجي لبرنامج التوزيع؟',
        fr: "Quel est le ROI typique d'un logiciel de distribution ?",
        en: 'What is the typical ROI of distribution software?',
      },
      answer: {
        ar: 'لمعظم الموزعين الجزائريين: 3-6 أشهر للاستثمار في برنامج بـ8,000 دج/شهر. التوفير يأتي من: تقليل الأخطاء (-40%)، الكشف عن العملاء غير المربحين، تحسين الجولات، تقليل المخزون المُكدس.',
        fr: 'Pour la plupart des distributeurs algériens : 3-6 mois pour amortir un logiciel à 8 000 DA/mois. Les gains viennent de : réduction des erreurs (-40%), détection clients non rentables, optimisation tournées, réduction stock dormant.',
        en: 'For most distributors: 3 to 6 months to pay back a $49/month plan. The gains come from fewer errors (-40%), spotting unprofitable customers, route optimization and a lower dead-stock ratio.',
      },
    },
    {
      question: {
        ar: 'هل أحافظ على Excel كنسخة احتياطية؟',
        fr: 'Faut-il garder Excel en backup ?',
        en: 'Should I keep Excel as a backup after switching?',
      },
      answer: {
        ar: 'لا، فكرة سيئة على المدى الطويل. الاحتفاظ بمصدرين للحقيقة يخلق ارتباكًا. بعد الترحيل (مع شهر تشغيل موازي للتأكد)، أرشف Excel كمرجع للتاريخ، وامنع التعديل عليه.',
        fr: "Non, mauvaise idée à long terme. Garder deux sources de vérité crée de la confusion. Après migration (avec 1 mois de parallèle pour vérifier), archivez Excel comme historique en lecture seule, interdisez la modification.",
        en: 'Long-term, no. Two sources of truth create confusion. After migrating (with one month of parallel running to validate), archive your Excel files as read-only history and block any further edits.',
      },
    },
  ],
};

export default post;
