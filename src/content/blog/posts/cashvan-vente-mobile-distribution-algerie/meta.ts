import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'cashvan-vente-mobile-distribution-algerie',
  category: 'industry',
  date: '2026-04-01',
  readTime: 8,
  author: 'TrackSera',
  emoji: '🚛',
  gradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
  countries: ['DZ', 'MA', 'TN', 'SN', 'CI'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  faqs: [
    {
      question: {
        ar: 'ما هو cashvan بالضبط؟',
        fr: "Qu'est-ce qu'un cashvan exactement ?",
        en: 'What exactly is a CashVan?',
      },
      answer: {
        ar: 'cashvan (van البيع النقدي) هو نظام بيع متنقل يجمع بين شاحنة محملة بالبضاعة وتطبيق محمول للسائق. السائق يبيع، يفوتر، ويُحصّل في نقطة بيع العميل، كل ذلك في زيارة واحدة. النموذج المهيمن في توزيع المشروبات والغذاء والنظافة في الجزائر.',
        fr: "Un cashvan (camion de vente cash) est un système de vente mobile combinant un camion chargé de marchandise et une app mobile pour le livreur. Le livreur vend, facture et encaisse au point de vente client, le tout en une visite. Le modèle dominant en distribution boissons, alimentaire, hygiène en Algérie.",
        en: 'A CashVan is a mobile sales system that combines a stocked truck with a mobile app for the driver. The driver sells, invoices, and collects payment at the customer site — all in a single visit. It is the dominant model in beverage, food, and hygiene distribution in emerging markets.',
      },
    },
    {
      question: {
        ar: 'ما الفرق بين cashvan والتوزيع التقليدي؟',
        fr: 'Quelle différence entre cashvan et distribution classique ?',
        en: 'How does CashVan differ from classic distribution?',
      },
      answer: {
        ar: 'التقليدي: ممثل تجاري يأخذ الطلب، السائق يُسلم لاحقًا (جولتان منفصلتان). cashvan: السائق يبيع ويُسلم في نفس الزيارة من الشاحنة. النتيجة: ربح الوقت 60-70%، تخفيض التكاليف، علاقة مباشرة مع العميل.',
        fr: "Classique : commercial prend commande, livreur livre plus tard (2 tournées séparées). Cashvan : le livreur vend et livre en une seule visite depuis le camion. Résultat : 60-70% de temps gagné, coûts réduits, relation directe avec le client.",
        en: 'Classic model: a sales rep takes the order, a driver delivers later (two separate routes). CashVan: the driver sells and delivers in one visit from the truck. Result: 60–70% time savings, lower costs, direct customer relationship.',
      },
    },
    {
      question: {
        ar: 'هل يحتاج cashvan إلى رخصة خاصة؟',
        fr: 'Le cashvan nécessite-t-il une licence spéciale ?',
        en: 'Does CashVan require a special license?',
      },
      answer: {
        ar: 'لا، cashvan هو شكل من أشكال التوزيع، وليس نشاطًا منفصلاً. يحتاج فقط: السجل التجاري للشركة، اعتماد المركبة (إذا غذائي → DSV)، شهادة صحية للسائق، فاتورة مطابقة عند البيع.',
        fr: "Non, le cashvan est une forme de distribution, pas une activité séparée. Il faut juste : RC de la société, agrément du véhicule (si alimentaire → DSV), carnet sanitaire du livreur, facture conforme lors de la vente.",
        en: 'No — CashVan is simply a form of distribution, not a separate activity. You just need: a company commercial registration, vehicle approval (food-grade if applicable), a driver health card where required, and a compliant invoice at the point of sale.',
      },
    },
    {
      question: {
        ar: 'ما تكلفة إطلاق نظام cashvan؟',
        fr: "Combien coûte la mise en place d'un cashvan ?",
        en: 'How much does it cost to launch a CashVan?',
      },
      answer: {
        ar: 'الحد الأدنى: مركبة نفعية (800,000 - 1,500,000 دج)، طابعة محمولة (15,000-25,000 دج)، طابلوار/هاتف ذكي (40,000-60,000 دج)، اشتراك التطبيق (2,500-5,000 دج/شهر)، تكوين السائق. مجموع البدء: 900,000 - 1,700,000 دج لمركبة واحدة.',
        fr: "Minimum : véhicule utilitaire (800 000 - 1 500 000 DA), imprimante mobile (15 000-25 000 DA), tablette/smartphone (40 000-60 000 DA), abonnement app (2 500-5 000 DA/mois), formation livreur. Total démarrage : 900 000 - 1 700 000 DA pour 1 véhicule.",
        en: 'Minimum kit: a utility vehicle ($6k–$12k second-hand), a mobile receipt printer ($120–$200), a tablet or smartphone ($300–$500), an app subscription (from $19/month), plus driver training. Total starting cost: roughly $7k–$13k for one fully equipped vehicle.',
      },
    },
  ],
};

export default post;
