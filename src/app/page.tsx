'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { contactApi } from '@/lib/admin-api';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const HeroMap = dynamic(() => import('./HeroMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white to-white" />,
});

/* ───────────────── data ───────────────── */

const modules = [
  {
    title: 'إدارة الطلبات',
    subtitle: 'Gestion des Commandes',
    desc: 'استقبال الطلبات، تأكيدها وتعيينها للتوصيل تلقائياً مع تتبع كل مرحلة.',
    features: ['استقبال وتأكيد الطلبات', 'تتبع حالة الطلب لحظياً', 'ربط بالعملاء والبائعين', 'إبلاغ وحل المشاكل'],
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    title: 'التوصيل وتتبع GPS',
    subtitle: 'Livraison & Suivi GPS',
    desc: 'جولات توصيل ذكية مع تتبع السائقين مباشرة على الخريطة.',
    features: ['إنشاء جولات التوصيل', 'تتبع GPS مباشر', 'تسليم كلي أو جزئي', 'تحصيل عند التسليم'],
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    title: 'البيع المتنقل',
    subtitle: 'Cashvan',
    desc: 'بيع مباشر من السيارة. تحميل المخزون، البيع، والتحصيل مع مزامنة فورية.',
    features: ['تحميل المخزون للسيارة', 'بيع وطباعة فاتورة', 'مرتجعات وائتمان', 'تقارير الجلسة'],
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    title: 'المبيعات والفوترة',
    subtitle: 'Ventes & Facturation',
    desc: 'فواتير احترافية، تتبع المدفوعات والديون، وبون التوصيل.',
    features: ['فواتير PDF احترافية', 'بون التوصيل', 'تتبع المدفوعات', 'إدارة المرتجعات'],
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    title: 'إدارة المشتريات',
    subtitle: 'Achats',
    desc: 'أوامر شراء، تتبع الموردين، والمدفوعات والمرتجعات.',
    features: ['أوامر شراء', 'تحويل لفاتورة', 'تتبع ديون الموردين', 'مرتجعات المشتريات'],
    color: '#ec4899',
    bg: '#fdf2f8',
  },
  {
    title: 'المخزون والمستودعات',
    subtitle: 'Stock & Entrepôts',
    desc: 'مستودعات متعددة، تحويلات، تنبيهات نقص، وجرد شامل.',
    features: ['مستودعات متعددة', 'تحويلات بين المستودعات', 'تنبيهات النقص', 'تتبع كل حركة'],
    color: '#06b6d4',
    bg: '#ecfeff',
  },
  {
    title: 'إدارة العملاء',
    subtitle: 'Gestion Clients',
    desc: 'قاعدة بيانات العملاء مع تصنيفات وأسعار مخصصة لكل فئة.',
    features: ['تصنيفات جملة/تجزئة', 'أسعار لكل فئة', 'تتبع الديون', 'سجل الطلبات'],
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    title: 'إدارة الصندوق',
    subtitle: 'Caisse',
    desc: 'صندوق لكل مستخدم مع تحصيلات، تحويلات، وتسويات يومية.',
    features: ['صندوق لكل مستخدم', 'تحويلات بين الصناديق', 'تسويات يومية', 'تقرير التحصيلات'],
    color: '#14b8a6',
    bg: '#f0fdfa',
  },
  {
    title: 'التقارير والتحليلات',
    subtitle: 'Rapports',
    desc: 'تقارير المبيعات، التوصيل، المخزون، والمالية مع رسوم بيانية.',
    features: ['تقارير حسب المنتج/العميل', 'تقارير التوصيل', 'تقارير الديون', 'تصدير Excel و PDF'],
    color: '#f97316',
    bg: '#fff7ed',
  },
  {
    title: 'تطبيقات الموبايل',
    subtitle: 'Applications Mobiles',
    desc: 'تطبيقات للبائع والسائق والبيع المتنقل مع مزامنة فورية.',
    features: ['تطبيق البائع', 'تطبيق التوصيل', 'تطبيق Cashvan', 'مزامنة فورية'],
    color: '#e11d48',
    bg: '#fff1f2',
  },
];

/* SVG icon paths per module — each one is distinct */
const moduleIcons: Record<string, React.ReactNode> = {
  'إدارة الطلبات': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
  ),
  'التوصيل وتتبع GPS': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="10" r="1" fill="currentColor"/></svg>
  ),
  'البيع المتنقل': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><rect x="2" y="7" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M17 9h2.5a2 2 0 011.8 1.13l1.2 2.6V15a2 2 0 01-2 2h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11v-1m0 4v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
  ),
  'المبيعات والفوترة': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/><line x1="8" y1="15" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/><circle cx="15" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M15 15.8v2.4m-1-1.8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  ),
  'إدارة المشتريات': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M3 6h2l1.68 8.39A2 2 0 008.62 16h8.76a2 2 0 001.94-1.61L21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="17" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M13 9v4m-2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  'المخزون والمستودعات': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M4 8l8-4 8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 8v8l8 4 8-4V8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M4 8l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.4"/><line x1="12" y1="12" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/></svg>
  ),
  'إدارة العملاء': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="17" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/><path d="M17 14h2a3 3 0 013 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/></svg>
  ),
  'إدارة الصندوق': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="10" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/><line x1="18" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
  ),
  'التقارير والتحليلات': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><rect x="3" y="14" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="9" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M3 7l6-3 5 2 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
  ),
  'تطبيقات الموبايل': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/><line x1="5" y1="18" x2="19" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/><circle cx="12" cy="20" r="0.5" fill="currentColor"/><path d="M10 10l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
  ),
};

const targetAudience = [
  {
    title: 'شركات التوزيع والجملة',
    desc: 'موزعون يوزعون المنتجات على نقاط البيع والتجزئة في كل المدن',
    color: '#3b82f6',
    bg: '#eff6ff',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><path d="M3 21h18M4 21V8l8-5 8 5v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="9" y="13" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M9 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/></svg>
    ),
  },
  {
    title: 'شركات المواد الغذائية',
    desc: 'توزيع سريع مع إدارة تواريخ الصلاحية والمرتجعات والدفعات',
    color: '#10b981',
    bg: '#ecfdf5',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><path d="M12 2C6.48 2 2 6 2 6v4c0 1.1.9 2 2 2h1c0 4.97 4.03 9 7 10 2.97-1 7-5.03 7-10h1c1.1 0 2-.9 2-2V6s-4.48-4-10-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8.5 10l2.5 2.5L16 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    title: 'شركات البيع المتنقل',
    desc: 'فرق بيع ميدانية بسيارات محملة بالمنتجات تبيع مباشرة للعملاء',
    color: '#f59e0b',
    bg: '#fffbeb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><rect x="1" y="8" width="15" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 10h3l3 4v3h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 4l2 4M9 4l1 4M13 5l-1 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/></svg>
    ),
  },
  {
    title: 'موزعو مواد البناء والتنظيف',
    desc: 'إدارة منتجات ثقيلة ومتنوعة مع مستودعات متعددة وتوصيل',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/><line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/></svg>
    ),
  },
];

const plans = [
  {
    id: 'free',
    name: 'مجاني',
    subtitle: 'للتجربة',
    price: 0,
    product_limit: 25,
    popular: false,
    features: [
      'حتى 25 منتج',
      'مستخدم واحد',
      'إدارة الطلبات والتوصيل',
      'فوترة وتقارير أساسية',
      'تجربة 14 يوم كاملة',
    ],
  },
  {
    id: 'starter',
    name: 'المبتدئ',
    subtitle: 'للشركات الصغيرة',
    price: 2900,
    product_limit: 100,
    popular: false,
    features: [
      'حتى 100 منتج',
      'مستخدم واحد',
      'إدارة الطلبات والمبيعات',
      'إدارة العملاء والموردين',
      'تقارير المبيعات والديون',
    ],
  },
  {
    id: 'pro',
    name: 'المحترف',
    subtitle: 'للشركات المتوسطة',
    price: 6900,
    product_limit: 500,
    popular: true,
    features: [
      'حتى 500 منتج',
      'حتى 5 مستخدمين',
      '+ 1,500 د.ج لكل مستخدم إضافي',
      'التوصيل وتتبع GPS',
      'إدارة الصندوق (Caisse)',
      'مستودعات متعددة',
    ],
  },
  {
    id: 'business',
    name: 'الأعمال',
    subtitle: 'للشركات الكبيرة',
    price: 12900,
    product_limit: 2000,
    popular: false,
    features: [
      'حتى 2,000 منتج',
      'حتى 10 مستخدمين',
      '+ 1,000 د.ج لكل مستخدم إضافي',
      'البيع المتنقل (Cashvan)',
      'تطبيقات الموبايل',
      'دعم فني أولوي',
    ],
  },
];

const stats = [
  { value: '10+', label: 'وحدة متكاملة' },
  { value: '3', label: 'تطبيقات موبايل' },
  { value: '5', label: 'أدوار مستخدمين' },
  { value: '24/7', label: 'نظام سحابي' },
];

/* ───────────────── component ───────────────── */

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth().then(() => setChecked(true));
  }, [checkAuth]);

  useEffect(() => {
    if (checked && !isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [checked, isAuthenticated, isLoading, router]);

  if (!checked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div dir="rtl" className="min-h-screen bg-white text-gray-900">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">تراكسيرا</span>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#modules" className="hover:text-blue-600 transition-colors">الوحدات</a>
              <a href="#audience" className="hover:text-blue-600 transition-colors">لمن هذا البرنامج؟</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">الأسعار</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors">تواصل معنا</a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                ابدأ مجاناً
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[100svh] sm:min-h-[92vh] flex items-end sm:items-center justify-center">
        <HeroMap />

        {/* Content layer — on mobile: pushed to bottom with compact padding */}
        <div className="relative w-full max-w-3xl mx-auto px-3 sm:px-6 pb-4 pt-0 sm:py-12" style={{ zIndex: 500 }}>
          {/* Glass card — compact on mobile, full on desktop */}
          <div className="anim-glass-card rounded-2xl sm:rounded-3xl bg-white/70 sm:bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_8px_40px_rgba(0,0,0,0.1)] p-5 sm:p-10 lg:p-12">
            {/* Pill badge */}
            <div className="flex justify-center mb-3 sm:mb-6">
              <div className="anim-fade-up delay-200 inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-blue-500/10 backdrop-blur-sm text-blue-700 rounded-full text-xs sm:text-sm font-semibold border border-blue-200/50">
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-blue-500"></span>
                </span>
                برنامج إدارة التوزيع الأول في الجزائر
              </div>
            </div>

            {/* Heading */}
            <h1 className="anim-fade-up delay-300 text-center text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.2] sm:leading-[1.15] tracking-tight text-gray-900">
              أدر عمليات التوزيع
              <br />
              <span className="bg-gradient-to-l from-blue-600 to-blue-500 bg-clip-text text-transparent">من الطلب إلى التسليم</span>
            </h1>

            {/* Description — hidden on very small screens */}
            <p className="anim-fade-up delay-400 mt-3 sm:mt-5 text-center text-sm sm:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto hidden xs:block">
              حل متكامل لشركات التوزيع في الجزائر — طلبات، توصيل، بيع متنقل، مخزون، فوترة، وتقارير في منصة واحدة.
            </p>
            <p className="anim-fade-up delay-400 mt-2 text-center text-sm text-gray-600 leading-relaxed xs:hidden">
              طلبات، توصيل، مخزون، فوترة وتقارير في منصة واحدة.
            </p>

            {/* CTA buttons */}
            <div className="anim-fade-up delay-500 mt-4 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Link
                href="/register"
                className="group w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2">
                  جرّب مجاناً لمدة 14 يوم
                  <svg className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              </Link>
              <a
                href="#modules"
                className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 text-sm font-medium text-gray-700 bg-white/80 hover:bg-white rounded-xl transition-all border border-gray-200/80 hover:-translate-y-0.5"
              >
                اكتشف الوحدات
              </a>
            </div>

            {/* Divider + Stats — hidden on mobile to keep card compact */}
            <div className="hidden sm:block">
              <div className="anim-fade-in delay-700 mt-8 border-t border-gray-200/60"></div>

              {/* Stats row */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={`anim-counter text-center ${
                      i === 0 ? 'delay-800' : i === 1 ? 'delay-1000' : i === 2 ? 'delay-1200' : 'delay-1400'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-l from-blue-600 to-blue-500 bg-clip-text text-transparent">
                      {s.value}
                    </div>
                    <div className="mt-0.5 text-xs sm:text-sm text-gray-500 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who is it for ── */}
      <section id="audience" className="py-20 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full text-xs font-semibold tracking-wide text-blue-700 bg-blue-100">
              القطاعات المستهدفة
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">لمن هذا البرنامج؟</h2>
            <p className="mt-3 text-lg text-gray-500 max-w-xl mx-auto">مصمم خصيصاً لشركات التوزيع والجملة في الجزائر</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {targetAudience.map((item) => (
              <div
                key={item.title}
                className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent transition-all duration-300 hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1"
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 right-6 left-6 h-[3px] rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: item.color }}
                />
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: item.bg, color: item.color }}
                >
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full text-xs font-semibold tracking-wide text-blue-700 bg-blue-100">
              كل ما تحتاجه في منصة واحدة
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">وحدات متكاملة لإدارة التوزيع</h2>
            <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">10 وحدات تغطي دورة العمل بالكامل — من استقبال الطلب حتى التسليم والتحصيل</p>
          </div>

          {/* Top row — 3 main modules as large cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {modules.slice(0, 3).map((mod) => (
              <div
                key={mod.title}
                className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent transition-all duration-300 hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 overflow-hidden"
              >
                {/* Colored corner accent */}
                <div className="absolute top-0 left-0 w-24 h-24 rounded-full opacity-[0.07] -translate-x-8 -translate-y-8 transition-transform duration-500 group-hover:scale-150" style={{ background: mod.color }} />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: mod.bg, color: mod.color }}
                    >
                      {moduleIcons[mod.title]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{mod.title}</h3>
                      <span className="text-[11px] text-gray-400 font-medium">{mod.subtitle}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{mod.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.features.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: mod.bg, color: mod.color }}
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Remaining modules — compact 2-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {modules.slice(3).map((mod) => (
              <div
                key={mod.title}
                className="group flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-100 hover:border-transparent transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.05] hover:-translate-y-0.5"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: mod.bg, color: mod.color }}
                >
                  {moduleIcons[mod.title]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{mod.title}</h3>
                    <span className="text-[10px] text-gray-400 font-medium">{mod.subtitle}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{mod.desc}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {mod.features.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{ background: mod.bg, color: mod.color }}
                      >
                        <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">كيف يعمل النظام؟</h2>
            <p className="mt-3 text-lg text-gray-400">دورة عمل كاملة من استقبال الطلب حتى التسليم والتحصيل</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'استقبال الطلب', desc: 'البائع يأخذ الطلب من العميل عبر التطبيق أو النظام', color: 'bg-blue-500' },
              { step: '2', title: 'تأكيد وتجهيز', desc: 'المدير يؤكد الطلب ويعيّنه لجولة توصيل أو Cashvan', color: 'bg-green-500' },
              { step: '3', title: 'التوصيل', desc: 'السائق يستلم الطلبات ويبدأ التوصيل مع تتبع GPS', color: 'bg-orange-500' },
              { step: '4', title: 'التحصيل والتقارير', desc: 'تحصيل المبالغ وتسوية الصندوق وتقارير يومية', color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">لماذا تراكسيرا؟</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'جاهز للاستخدام فوراً',
                desc: 'سجّل حسابك واستلم قاعدة بياناتك الخاصة في ثوانٍ. بدون تثبيت، بدون إعداد معقد، بدون انتظار.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
              },
              {
                title: 'بيانات معزولة وآمنة',
                desc: 'كل شركة تحصل على قاعدة بيانات منفصلة تماماً. بياناتك لا يمكن أن تختلط مع بيانات أي شركة أخرى.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
              {
                title: 'أسعار شفافة بالدينار',
                desc: 'لا مفاجآت. أسعار واضحة بالدينار الجزائري. ابدأ مجاناً وترقّى حسب نمو أعمالك.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="text-center px-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">أسعار واضحة بالدينار الجزائري</h2>
            <p className="mt-3 text-lg text-gray-600">ابدأ مجاناً. لا تحتاج بطاقة ائتمان.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.popular
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/25 ring-2 ring-blue-600 lg:scale-105'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full whitespace-nowrap">
                    الأكثر طلباً
                  </div>
                )}
                <div>
                  <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-sm ${plan.popular ? 'text-blue-200' : 'text-gray-500'}`}>{plan.subtitle}</p>
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price === 0 ? 'مجاناً' : plan.price.toLocaleString()}
                  </span>
                  {plan.price > 0 && (
                    <span className={`text-sm ${plan.popular ? 'text-blue-200' : 'text-gray-500'}`}>
                      د.ج / شهرياً
                    </span>
                  )}
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg className={`w-5 h-5 shrink-0 mt-0.5 ${plan.popular ? 'text-blue-200' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.popular ? 'text-blue-50' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 block w-full py-3 text-center text-sm font-bold rounded-xl transition-colors ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.price === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">جاهز لتنظيم عمليات التوزيع؟</h2>
          <p className="mt-4 text-lg text-gray-600">
            سجّل الآن واحصل على 14 يوم تجربة مجانية. بدون بطاقة ائتمان.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-10 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-600/25"
            >
              ابدأ مجاناً الآن
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <ContactSection />

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-white text-lg font-bold">تراكسيرا</span>
              </div>
              <p className="text-sm leading-relaxed">
                برنامج إدارة التوزيع المتكامل في الجزائر. إدارة الطلبات، التوصيل، البيع المتنقل، المخزون والفوترة.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#modules" className="hover:text-white transition-colors">الوحدات</a></li>
                <li><a href="#audience" className="hover:text-white transition-colors">لمن هذا البرنامج؟</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">الأسعار</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">تواصل معنا</a></li>
                <li><Link href="/register" className="hover:text-white transition-colors">إنشاء حساب</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">تسجيل الدخول</Link></li>
              </ul>
            </div>

            {/* Keywords for SEO */}
            <div>
              <h4 className="text-white font-bold mb-4">الوحدات</h4>
              <ul className="space-y-2 text-sm">
                <li>إدارة الطلبات</li>
                <li>التوصيل وتتبع GPS</li>
                <li>البيع المتنقل - Cashvan</li>
                <li>المبيعات والفوترة</li>
                <li>المخزون والمستودعات</li>
                <li>التقارير والتحليلات</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">جميع الحقوق محفوظة &copy; {new Date().getFullYear()} تراكسيرا</p>
            <p className="text-xs text-gray-600">
              برنامج إدارة التوزيع | Logiciel de gestion de la distribution en Algérie
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await contactApi.send(form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'خطأ في إرسال الرسالة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full text-xs font-semibold tracking-wide text-blue-700 bg-blue-100">
            نحن هنا لمساعدتك
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">تواصل معنا</h2>
          <p className="mt-3 text-lg text-gray-500">أرسل لنا رسالة وسنتواصل معك في أقرب وقت</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="اسمك الكامل"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الهاتف</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="0555 00 00 00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الشركة</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="شركة المثال"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الرسالة *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              placeholder="اكتب رسالتك هنا..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
          </button>
        </form>
      </div>
    </section>
  );
}
