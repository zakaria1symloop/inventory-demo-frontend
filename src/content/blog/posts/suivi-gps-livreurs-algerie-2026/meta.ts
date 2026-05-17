import type { BlogPost } from '../../_types';
import ar from './ar';
import fr from './fr';
import en from './en';

const post: BlogPost = {
  slug: 'suivi-gps-livreurs-algerie-2026',
  category: 'industry',
  date: '2026-04-06',
  readTime: 8,
  author: 'TrackSera',
  emoji: '📍',
  gradient: 'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)',
  countries: ['DZ', 'MA', 'TN', 'SN', 'CI'],
  title: { ar: ar.title, fr: fr.title, en: en.title },
  excerpt: { ar: ar.excerpt, fr: fr.excerpt, en: en.excerpt },
  content: { ar: ar.content, fr: fr.content, en: en.content },
  tags: { ar: ar.tags, fr: fr.tags, en: en.tags },
  faqs: [
    {
      question: {
        ar: 'هل تتبع GPS قانوني في الجزائر؟',
        fr: 'Le suivi GPS est-il légal en Algérie ?',
        en: 'Is GPS tracking of company vehicles legal?',
      },
      answer: {
        ar: 'نعم، تتبع المركبات المهنية قانوني، شريطة إعلام السائقين خطيًا (في عقد العمل أو إضافة)، استخدام البيانات للأغراض المهنية فقط، احترام GDPR (احتفظ ببيانات GPS لمدة محدودة، 90 يومًا عمومًا).',
        fr: "Oui, le suivi des véhicules professionnels est légal, à condition d'informer les livreurs par écrit (contrat de travail ou avenant), d'utiliser les données à des fins professionnelles uniquement, de respecter le RGPD (conservation limitée, 90 jours en général).",
        en: 'Yes — tracking company vehicles is legal in most jurisdictions, provided you inform drivers in writing (in their employment contract or an addendum), use the data strictly for business purposes, and respect data-protection rules (typically 90-day retention).',
      },
    },
    {
      question: {
        ar: 'كم تكلف منظومة تتبع GPS؟',
        fr: 'Combien coûte un système de suivi GPS ?',
        en: 'How much does a GPS tracking system cost?',
      },
      answer: {
        ar: 'حلول 2026: تطبيق على الهاتف (مع برنامج التوزيع): 0-2,500 دج/شهر/مركبة. أجهزة تتبع GPS مدمجة: 8,000-25,000 دج تركيب + 1,500-3,500 دج/شهر. اختر التطبيق على الهاتف للموزعين الصغار والمتوسطين، الأجهزة المدمجة للأساطيل الكبيرة.',
        fr: "Solutions 2026 : app smartphone (avec logiciel de distribution) : 0-2 500 DA/mois/véhicule. Boîtiers GPS embarqués : 8 000-25 000 DA installation + 1 500-3 500 DA/mois. Préférez l'app smartphone pour petits/moyens distributeurs, les boîtiers pour grosses flottes.",
        en: '2026 options: smartphone app bundled with distribution software: $0–$20/month/vehicle. Hard-wired GPS units: $60–$200 install + $12–$28/month. Pick the smartphone app for small and mid-size fleets, and dedicated units for very large fleets.',
      },
    },
    {
      question: {
        ar: 'كيف أتعامل مع رفض السائق لتتبع GPS؟',
        fr: 'Comment gérer un livreur qui refuse le GPS ?',
        en: 'What if a driver refuses to be GPS-tracked?',
      },
      answer: {
        ar: 'إذا كان GPS منصوصًا في عقد العمل، الرفض غير مبرر قانونيًا. إذا أُضيف لاحقًا، يجب توقيع إضافة. السائق الأمين لا يخاف GPS — إنه يحميه (إثبات الحضور، ضد الاتهامات الباطلة). الرفض الإصراري إشارة لإعادة النظر في الثقة.',
        fr: "Si le GPS est dans le contrat, le refus n'est pas justifié légalement. Si ajouté ensuite, un avenant signé est requis. Un livreur honnête ne craint pas le GPS — il le protège (preuve de présence, contre fausses accusations). Un refus persistant est un signal pour reconsidérer la confiance.",
        en: 'If GPS is in the original contract, refusing has no legal grounds. If you are adding it later, a signed addendum is required. An honest driver does not fear GPS — it protects them (proof of attendance, defense against false accusations). Persistent refusal is a signal to reconsider trust.',
      },
    },
  ],
};

export default post;
