import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'logiciel-gestion-distribution-algerie-2026',
  category: 'guides',
  date: '2026-04-08',
  readTime: 9,
  author: 'TrackSera',
  emoji: '🎯',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
  countries: ['DZ'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  faqs: [
    {
      question: {
        ar: 'كم يكلف برنامج إدارة التوزيع في الجزائر؟',
        fr: 'Combien coûte un logiciel de gestion de distribution en Algérie ?',
        en: 'How much does distribution management software cost?',
      },
      answer: {
        ar: 'الحلول المحلية تتراوح عمومًا بين 3,000 و 15,000 دج/شهر حسب عدد المستخدمين والوحدات. الحلول الأجنبية (Sage, Odoo) تكلف 3 إلى 5 أضعاف. TrackSera تبدأ من 3,000 دج/شهر للصيغة Solo.',
        fr: "Les solutions locales coûtent entre 3 000 et 15 000 DA/mois selon utilisateurs et modules. Les solutions étrangères (Sage, Odoo) sont 3 à 5 fois plus chères. TrackSera commence à 3 000 DA/mois pour la formule Solo.",
        en: 'Regional solutions typically range from $19 to $99 per month depending on users and modules. Foreign enterprise suites (Sage, Odoo, SAP) are 3 to 5 times more expensive. TrackSera starts at $19/month on the Solo plan.',
      },
    },
    {
      question: {
        ar: 'كم من الوقت يستغرق تثبيت برنامج إدارة التوزيع؟',
        fr: "Combien de temps prend l'installation d'un logiciel de gestion ?",
        en: 'How long does it take to roll out distribution software?',
      },
      answer: {
        ar: 'البرامج السحابية الحديثة تثبت في أقل من 30 دقيقة. ترحيل البيانات (العملاء، المنتجات، المخزون) يأخذ 1-3 أيام. التدريب أسبوع. التشغيل الموازي شهر. مجموع: 4-6 أسابيع للانتقال الكامل والآمن.',
        fr: "Les logiciels en ligne modernes s'installent en moins de 30 minutes. La migration des données (clients, produits, stock) prend 1-3 jours. La formation 1 semaine. Le parallèle 1 mois. Total : 4-6 semaines pour une transition complète et sûre.",
        en: 'Modern cloud software is live in under 30 minutes. Data migration (customers, products, stock) takes 1–3 days. Training takes a week. A parallel run takes a month. Total: 4–6 weeks for a safe, complete transition.',
      },
    },
    {
      question: {
        ar: 'هل يجب أن يدعم البرنامج الفوترة الإلكترونية؟',
        fr: 'Le logiciel doit-il supporter la facturation électronique ?',
        en: 'Should the software support e-invoicing?',
      },
      answer: {
        ar: 'نعم، إجباري في 2026 — الإدارة الضريبية تتحرك تدريجيًا نحو الفوترة الإلكترونية. حتى لو لم تكن إجبارية لشركتك اليوم، اختر برنامجًا جاهزًا لذلك لتجنب التغيير المُكلف لاحقًا.',
        fr: "Oui, indispensable en 2026 — la DGI évolue progressivement vers la facturation électronique. Même si ce n'est pas obligatoire pour votre société aujourd'hui, choisissez un logiciel prêt pour éviter un changement coûteux plus tard.",
        en: 'Yes — essential in 2026. Most tax authorities are moving toward mandatory e-invoicing. Even if it is not required for your business today, pick software that is already ready to avoid an expensive switch later.',
      },
    },
    {
      question: {
        ar: 'هل يمكنني الترقية لاحقًا إذا توسعت شركتي؟',
        fr: 'Puis-je évoluer plus tard si mon activité grandit ?',
        en: 'Can I scale up later as my business grows?',
      },
      answer: {
        ar: 'البرامج السحابية الجيدة تسمح بالترقية الفورية بإضافة مستخدمين، مستودعات، أو وحدات. لا توقف عن النشاط. ابحث عن: عدم وجود حد على عدد المنتجات/العملاء، إمكانية إضافة وحدات (cashvan، GPS، إلخ) بمرونة، API مفتوحة للاتصال بأنظمة أخرى.',
        fr: "Les bons logiciels en ligne permettent une montée en charge instantanée en ajoutant utilisateurs, entrepôts, ou modules. Pas d'arrêt d'activité. Cherchez : pas de limite sur produits/clients, modules (cashvan, GPS, etc.) ajoutables avec flexibilité, possibilité d'intégrations.",
        en: 'Good cloud software lets you scale instantly by adding users, warehouses, or modules. No downtime. Look for: no caps on products or customers, modules (CashVan, GPS, etc.) you can add flexibly, and an open API for integrations.',
      },
    },
  ],
};

export default post;
