import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'tableau-de-bord-distributeur-5-chiffres',
  category: 'guides',
  date: '2026-04-04',
  readTime: 7,
  author: 'TrackSera',
  emoji: '📊',
  gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6b21a8 100%)',
  countries: ['DZ', 'MA', 'TN', 'SN', 'CI'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  faqs: [
    {
      question: {
        ar: 'ما هي أهم مؤشرات الأداء (KPI) لموزع جزائري؟',
        fr: 'Quels sont les KPI les plus importants pour un distributeur ?',
        en: 'What are the most important KPIs for a distributor?',
      },
      answer: {
        ar: 'الـ5 الأساسية: (1) رقم الأعمال اليومي مقارنة بمتوسط 7 أيام، (2) الهامش الإجمالي بالنسبة، (3) الديون المتأخرة (أكثر من 30 يومًا)، (4) المخزون الراكد (لا يتحرك منذ 60+ يومًا)، (5) نسبة المرتجعات. هذه الـ5 يجب مراقبتها يوميًا.',
        fr: 'Les 5 essentiels : (1) CA jour vs moyenne 7 jours, (2) marge brute en %, (3) créances en retard (>30 jours), (4) stock dormant (>60 jours sans mouvement), (5) taux de retour. Ces 5 KPI doivent être suivis quotidiennement.',
        en: 'The 5 essentials: (1) daily revenue vs 7-day average, (2) gross margin %, (3) overdue receivables (>30 days), (4) dormant stock (>60 days without movement), (5) return rate. These 5 KPIs should be tracked daily.',
      },
    },
    {
      question: {
        ar: 'كم مرة في اليوم يجب مراجعة لوحة القيادة؟',
        fr: 'Combien de fois par jour faut-il consulter le dashboard ?',
        en: 'How often per day should you check the dashboard?',
      },
      answer: {
        ar: '3 مرات في اليوم على الأكثر: (1) الصباح (نتائج الأمس + خطة اليوم)، (2) منتصف اليوم (تقدم الجولات)، (3) المساء (إغلاق الصندوق). أكثر من ذلك يصبح هاجسًا غير مُنتج.',
        fr: '3 fois par jour maximum : (1) matin (résultats hier + plan du jour), (2) midi (avancée des tournées), (3) soir (clôture caisse). Plus que ça devient une obsession improductive.',
        en: '3 times a day max: (1) morning (yesterday\'s results + today\'s plan), (2) midday (route progress), (3) evening (cash close). More than that becomes an unproductive obsession.',
      },
    },
    {
      question: {
        ar: 'هل يجب على كل الفريق رؤية لوحة القيادة؟',
        fr: 'Tout le personnel doit-il voir le dashboard ?',
        en: 'Should the whole team see the dashboard?',
      },
      answer: {
        ar: 'لا. لوحة المدير: كاملة (الهامش، الديون، الكاش، المخزون). لوحة المسير اليومي: العمليات (الجولات، التسليمات). لوحة السائق: جولته فقط. تجنب عرض الأرقام المالية الحساسة لكل الفريق.',
        fr: 'Non. Dashboard dirigeant : complet (marge, créances, cash, stock). Dashboard opérationnel : tournées, livraisons. Dashboard livreur : sa tournée uniquement. Évitez d\'exposer les chiffres financiers sensibles à toute l\'équipe.',
        en: 'No. Owner dashboard: full (margin, receivables, cash, stock). Operations dashboard: routes, deliveries. Driver dashboard: only their route. Don\'t expose sensitive financial numbers to the whole team.',
      },
    },
  ],
};

export default post;
