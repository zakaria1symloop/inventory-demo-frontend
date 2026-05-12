'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useLocale } from '@/lib/i18n/context';
import { contactApi } from '@/lib/admin-api';
import { blogPosts, categoryLabels } from '@/lib/blog-data';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const HeroMap = dynamic(() => import('./HeroMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white to-white" />,
});

/* ───────────────── data ───────────────── */

const modulesData = {
  ar: [
    { title: 'إدارة الطلبات', desc: 'استقبال الطلبات، تأكيدها وتعيينها للتوصيل مع تتبع كل مرحلة.' },
    { title: 'التوصيل وتتبع GPS', desc: 'جولات توصيل ذكية مع تتبع السائقين مباشرة على الخريطة.' },
    { title: 'البيع المتنقل', desc: 'بيع مباشر من السيارة مع تحميل المخزون والتحصيل الفوري.' },
    { title: 'المبيعات والفوترة', desc: 'فواتير PDF احترافية مع تتبع المدفوعات والديون.' },
    { title: 'إدارة المشتريات', desc: 'أوامر شراء وتتبع الموردين والمدفوعات والمرتجعات.' },
    { title: 'المخزون والمستودعات', desc: 'مستودعات متعددة مع تحويلات وتنبيهات نقص وجرد.' },
    { title: 'إدارة العملاء', desc: 'قاعدة بيانات العملاء مع تصنيفات وأسعار مخصصة.' },
    { title: 'إدارة الصندوق', desc: 'صندوق لكل مستخدم مع تحصيلات وتسويات يومية.' },
    { title: 'التقارير والتحليلات', desc: 'تقارير المبيعات والمخزون والمالية مع تصدير Excel.' },
    { title: 'تطبيقات الموبايل', desc: 'تطبيقات للبائع والسائق والبيع المتنقل مع مزامنة فورية.' },
    { title: 'إدارة المستخدمين', desc: 'أدوار متعددة: مدير، بائع، سائق، كاشفان مع صلاحيات.' },
    { title: 'الإعدادات والتخصيص', desc: 'تخصيص الفواتير والعملة والضرائب وإعدادات الشركة.' },
  ],
  fr: [
    { title: 'Gestion des commandes', desc: 'Réception, confirmation et assignation des commandes avec suivi.' },
    { title: 'Livraison & GPS', desc: 'Tournées de livraison intelligentes avec suivi GPS en temps réel.' },
    { title: 'Vente mobile (Cashvan)', desc: 'Vente directe depuis le véhicule avec chargement et encaissement.' },
    { title: 'Ventes & Facturation', desc: 'Factures PDF professionnelles avec suivi des paiements et dettes.' },
    { title: 'Achats', desc: 'Bons de commande, suivi fournisseurs, paiements et retours.' },
    { title: 'Stock & Entrepôts', desc: 'Multi-entrepôts avec transferts, alertes de rupture et inventaire.' },
    { title: 'Gestion clients', desc: 'Base clients avec catégories et prix personnalisés par segment.' },
    { title: 'Caisse', desc: 'Caisse par utilisateur avec encaissements et rapprochements.' },
    { title: 'Rapports & Analyses', desc: 'Rapports ventes, stock et finances avec export Excel.' },
    { title: 'Applications mobiles', desc: 'Apps vendeur, livreur et cashvan avec synchronisation instantanée.' },
    { title: 'Gestion des utilisateurs', desc: 'Rôles multiples : admin, vendeur, livreur, cashvan avec permissions.' },
    { title: 'Paramètres', desc: 'Personnalisation factures, devise, taxes et infos entreprise.' },
  ],
  en: [
    { title: 'Order management', desc: 'Receive, confirm, and assign customer orders with full status tracking.' },
    { title: 'Delivery & GPS', desc: 'Smart delivery routes with live driver tracking on the map.' },
    { title: 'Mobile sales (CashVan)', desc: 'Sell directly from the van with on-board stock and on-the-spot recording.' },
    { title: 'Sales & invoicing', desc: 'Professional PDF invoices with sales records and receivables tracking.' },
    { title: 'Purchasing', desc: 'Purchase orders, supplier tracking, supplier balances, and returns.' },
    { title: 'Stock & warehouses', desc: 'Multi-warehouse with transfers, low-stock alerts, and stocktakes.' },
    { title: 'Customer management', desc: 'Customer database with segments and per-segment custom pricing.' },
    { title: 'Cash drawer', desc: 'Per-user cash drawer with daily collections and reconciliation.' },
    { title: 'Reports & analytics', desc: 'Sales, stock, and finance reports with Excel export.' },
    { title: 'Mobile apps', desc: 'Apps for salespeople, drivers, and CashVan with instant sync.' },
    { title: 'User management', desc: 'Multiple roles: admin, salesperson, driver, CashVan, with permissions.' },
    { title: 'Settings', desc: 'Customize invoices, currency, taxes, and company details.' },
  ],
};

// Keep old modules array for icon mapping
const modules = [
  { title: 'إدارة الطلبات', subtitle: 'Gestion des Commandes', desc: '', features: [], color: '#3b82f6', bg: '#eff6ff' },
  { title: 'التوصيل وتتبع GPS', subtitle: 'Livraison & Suivi GPS', desc: '', features: [], color: '#10b981', bg: '#ecfdf5' },
  { title: 'البيع المتنقل', subtitle: 'Cashvan', desc: '', features: [], color: '#f59e0b', bg: '#fffbeb' },
  { title: 'المبيعات والفوترة', subtitle: 'Ventes & Facturation', desc: '', features: [], color: '#8b5cf6', bg: '#f5f3ff' },
  { title: 'إدارة المشتريات', subtitle: 'Achats', desc: '', features: [], color: '#ec4899', bg: '#fdf2f8' },
  { title: 'المخزون والمستودعات', subtitle: 'Stock & Entrepôts', desc: '', features: [], color: '#06b6d4', bg: '#ecfeff' },
  { title: 'إدارة العملاء', subtitle: 'Gestion Clients', desc: '', features: [], color: '#6366f1', bg: '#eef2ff' },
  { title: 'إدارة الصندوق', subtitle: 'Caisse', desc: '', features: [], color: '#14b8a6', bg: '#f0fdfa' },
  { title: 'التقارير والتحليلات', subtitle: 'Rapports', desc: '', features: [], color: '#f97316', bg: '#fff7ed' },
  { title: 'تطبيقات الموبايل', subtitle: 'Applications Mobiles', desc: '', features: [], color: '#e11d48', bg: '#fff1f2' },
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

const plansData = {
  ar: [
    { id: 'free', name: 'مجاني', subtitle: 'للتجربة', price: 0, popular: false, features: ['حتى 25 منتج', 'مستخدم واحد', 'إدارة الطلبات والتوصيل', 'فوترة وتقارير أساسية', 'تجربة 14 يوم كاملة'] },
    { id: 'starter', name: 'المبتدئ', subtitle: 'للشركات الصغيرة', price: 19, popular: false, features: ['حتى 100 منتج', 'مستخدم واحد', 'إدارة الطلبات والمبيعات', 'إدارة العملاء والموردين', 'تقارير المبيعات والديون'] },
    { id: 'pro', name: 'المحترف', subtitle: 'للشركات المتوسطة', price: 49, popular: true, features: ['حتى 500 منتج', 'حتى 5 مستخدمين', 'مستخدمون إضافيون متاحون', 'التوصيل وتتبع GPS', 'إدارة الصندوق', 'مستودعات متعددة'] },
    { id: 'business', name: 'الأعمال', subtitle: 'للشركات الكبيرة', price: 99, popular: false, features: ['حتى 2,000 منتج', 'حتى 10 مستخدمين', 'مستخدمون إضافيون متاحون', 'البيع المتنقل (Cashvan)', 'تطبيقات الموبايل', 'دعم فني أولوي'] },
  ],
  fr: [
    { id: 'free', name: 'Gratuit', subtitle: 'Pour essayer', price: 0, popular: false, features: ["Jusqu'à 25 produits", '1 utilisateur', 'Commandes & livraison', 'Facturation & rapports de base', 'Essai 14 jours complet'] },
    { id: 'starter', name: 'Starter', subtitle: 'Petites entreprises', price: 19, popular: false, features: ["Jusqu'à 100 produits", '1 utilisateur', 'Commandes & ventes', 'Clients & fournisseurs', 'Rapports ventes & dettes'] },
    { id: 'pro', name: 'Pro', subtitle: 'Entreprises moyennes', price: 49, popular: true, features: ["Jusqu'à 500 produits", "Jusqu'à 5 utilisateurs", 'Utilisateurs supplémentaires disponibles', 'Livraison & suivi GPS', 'Caisse', 'Multi-entrepôts'] },
    { id: 'business', name: 'Business', subtitle: 'Grandes entreprises', price: 99, popular: false, features: ["Jusqu'à 2 000 produits", "Jusqu'à 10 utilisateurs", 'Utilisateurs supplémentaires disponibles', 'Vente mobile (Cashvan)', 'Applications mobiles', 'Support prioritaire'] },
  ],
  en: [
    { id: 'free', name: 'Free', subtitle: 'To try it out', price: 0, popular: false, features: ['Up to 25 products', '1 user', 'Orders & delivery', 'Basic invoicing & reports', 'Full 14-day trial'] },
    { id: 'starter', name: 'Starter', subtitle: 'Small businesses', price: 19, popular: false, features: ['Up to 100 products', '1 user', 'Orders & sales', 'Customers & suppliers', 'Sales & receivables reports'] },
    { id: 'pro', name: 'Pro', subtitle: 'Mid-sized businesses', price: 49, popular: true, features: ['Up to 500 products', 'Up to 5 users', 'Add-on users available', 'Delivery & GPS tracking', 'Cash drawer', 'Multi-warehouse'] },
    { id: 'business', name: 'Business', subtitle: 'Larger businesses', price: 99, popular: false, features: ['Up to 2,000 products', 'Up to 10 users', 'Add-on users available', 'Mobile sales (CashVan)', 'Mobile apps', 'Priority support'] },
  ],
};

const audienceData = {
  ar: [
    { title: 'شركات التوزيع والجملة', desc: 'موزعون يوزعون المنتجات على نقاط البيع والتجزئة في كل المدن' },
    { title: 'شركات المواد الغذائية', desc: 'توزيع سريع مع إدارة تواريخ الصلاحية والمرتجعات والدفعات' },
    { title: 'شركات البيع المتنقل', desc: 'فرق بيع ميدانية بسيارات محملة بالمنتجات تبيع مباشرة للعملاء' },
    { title: 'موزعو مواد البناء والتنظيف', desc: 'إدارة منتجات ثقيلة ومتنوعة مع مستودعات متعددة وتوصيل' },
  ],
  fr: [
    { title: 'Distribution & gros', desc: 'Distributeurs livrant les produits aux points de vente et détaillants' },
    { title: 'Agroalimentaire', desc: 'Distribution rapide avec gestion des dates de péremption et retours' },
    { title: 'Vente mobile', desc: 'Équipes de vente terrain avec véhicules chargés vendant directement aux clients' },
    { title: 'Matériaux & entretien', desc: 'Gestion de produits lourds et variés avec multi-entrepôts et livraison' },
  ],
  en: [
    { title: 'Distribution & wholesale', desc: 'Distributors supplying products to retail points and stores across regions.' },
    { title: 'Food & beverage', desc: 'Fast distribution with expiry-date tracking, returns, and batch management.' },
    { title: 'Mobile sales', desc: 'Field sales teams selling directly to customers from stocked vehicles.' },
    { title: 'Building materials & cleaning', desc: 'Handle bulky, varied SKUs with multi-warehouse stock and delivery routes.' },
  ],
};

const statsData = {
  ar: [
    { value: '50+', label: 'شركة جزائرية' },
    { value: '15+', label: 'ولاية' },
    { value: '3', label: 'تطبيقات موبايل' },
    { value: '10+', label: 'وحدة متكاملة' },
    { value: '24/7', label: 'نظام سحابي' },
  ],
  fr: [
    { value: '50+', label: 'entreprises algériennes' },
    { value: '15+', label: 'wilayas couvertes' },
    { value: '3', label: 'apps mobiles' },
    { value: '10+', label: 'modules intégrés' },
    { value: '24/7', label: 'cloud' },
  ],
  en: [
    { value: '50+', label: 'businesses' },
    { value: '15+', label: 'regions covered' },
    { value: '3', label: 'mobile apps' },
    { value: '10+', label: 'integrated modules' },
    { value: '24/7', label: 'cloud' },
  ],
};

// Keep old arrays for backward compat
const plans = plansData.ar;
const stats = statsData.ar;

/* ───────────────── component ───────────────── */

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { locale, setLocale } = useLocale();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth().then(() => setChecked(true));
  }, [checkAuth]);

  useEffect(() => {
    if (checked && !isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [checked, isAuthenticated, isLoading, router]);


  if (isAuthenticated) return null;

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900">

      {/* ── Top Info Bar ── */}
      <div className="bg-gray-900 text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="mailto:contact@tracksera.com" className="flex items-center gap-1.5 hover:text-blue-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              contact@tracksera.com
            </a>
            <a href="tel:+213549575512" className="flex items-center gap-1.5 hover:text-blue-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <span dir="ltr">+213 549 575 512</span>
            </a>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-gray-400">
            <span>{locale === 'ar' ? 'الأحد — الخميس: 8:00 - 17:00' : locale === 'en' ? 'Sun — Thu: 8:00 - 17:00' : 'Dim — Jeu: 8h00 - 17h00'}</span>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[60px]">
            <Link href="/" className="flex items-center gap-2">
              <img src="/t.png" alt="TrackSera" className="w-7 h-7" />
              <span className="text-[15px] font-bold text-gray-900 tracking-[-0.01em]">TrackSera</span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              {[
                { label: locale === 'ar' ? 'كيف يعمل' : locale === 'en' ? 'How it works' : 'Comment ça marche', href: '/#how-it-works' },
                { label: locale === 'ar' ? 'الوحدات' : locale === 'en' ? 'Modules' : 'Modules', href: '/#modules' },
                { label: locale === 'ar' ? 'الأسعار' : locale === 'en' ? 'Pricing' : 'Tarifs', href: '/#pricing' },
                { label: locale === 'ar' ? 'المدونة' : locale === 'en' ? 'Blog' : 'Blog', href: '/blog' },
                { label: locale === 'ar' ? 'تواصل معنا' : locale === 'en' ? 'Contact' : 'Contact', href: '/#contact' },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
                <button onClick={() => setLocale('ar')} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${locale === 'ar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>عربي</button>
                <button onClick={() => setLocale('fr')} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${locale === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>FR</button>
                <button onClick={() => setLocale('en')} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${locale === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>EN</button>
              </div>
              <Link href="/login" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الدخول' : locale === 'en' ? 'Sign in' : 'Connexion'}
              </Link>
              <Link href="/register" className="px-4 py-2 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-colors">
                {locale === 'ar' ? 'ابدأ مجاناً' : locale === 'en' ? 'Get started' : 'Commencer'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero (mono rebrand preview — phase 1) ── */}
      <section className="relative pt-20 sm:pt-28 pb-24 overflow-hidden bg-white">
        {/* Subtle backdrop: noise grain + hairline grid */}
        <div aria-hidden className="absolute inset-0 bg-noise-grain opacity-[0.025]" />
        <div aria-hidden className="absolute inset-0 bg-hairline-grid opacity-100" />

        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="max-w-[760px] mx-auto text-center">
            {/* Status pill — uppercase, pulsing dot */}
            <div className="mono-fade-up-1 mb-10 flex justify-center">
              <span className="mono-status-pill">
                <span className="dot" />
                {locale === 'ar'
                  ? 'مباشر · أكثر من 50 شركة'
                  : locale === 'en'
                  ? 'Live · 50+ active businesses'
                  : 'En ligne · plus de 50 entreprises'}
              </span>
            </div>

            {/* Headline with rotating word — mono accent on rotation */}
            <h1
              className="mono-fade-up-2 mono-display text-[36px] sm:text-[52px] lg:text-[64px] text-neutral-950"
            >
              {locale === 'ar' ? 'أوقف ' : locale === 'en' ? 'Stop ' : 'Stop '}
              <span className="hero-rotating-wrapper">
                <span className="hero-rotating-words">
                  {(locale === 'ar'
                    ? ['فوضى الطلبات', 'ضياع المخزون', 'تأخر التوصيل', 'خسارة الأرباح']
                    : locale === 'en'
                    ? ['order chaos', 'stock leakage', 'late deliveries', 'lost margin']
                    : ['le chaos des commandes', 'la perte de stock', 'les retards de livraison', 'la perte de profits']
                  ).map((word, i) => (
                    <span
                      key={word}
                      className="hero-rotating-word"
                      style={{ animationDelay: `${i * 2.5}s`, color: 'rgb(10,10,10)' }}
                    >
                      {word}
                    </span>
                  ))}
                </span>
              </span>
            </h1>

            <p className="mono-fade-up-3 mt-7 text-[15.5px] sm:text-[17px] leading-[1.65] text-neutral-500 max-w-[560px] mx-auto">
              {locale === 'ar'
                ? 'منصة واحدة لإدارة الطلبات، التوصيل، المخزون، والفوترة. من أول فاتورة إلى آلاف العمليات.'
                : locale === 'en'
                ? 'TrackSera is business management software for retailers, wholesalers, and distributors. One platform for inventory, sales recording, customer orders, and deliveries — from your first invoice to thousands of operations.'
                : "Une seule plateforme pour les commandes, livraisons, stock et facturation. De votre première facture à des milliers d'opérations."
              }
            </p>

            {locale === 'en' && (
              <p className="mono-fade-up-3 mt-4 text-[12px] leading-[1.6] text-neutral-400 max-w-[520px] mx-auto">
                TrackSera is a software subscription. We do not process or hold payments on behalf of our customers.
              </p>
            )}

            {/* CTA row — solid black + hairline ghost */}
            <div className="mono-fade-up-4 mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="mono-btn-primary group w-full sm:w-auto">
                {locale === 'ar' ? 'ابدأ مجاناً — 14 يوم' : locale === 'en' ? 'Start free — 14 days' : 'Essai gratuit — 14 jours'}
                <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
              <a href="#modules" className="mono-btn-ghost group w-full sm:w-auto">
                {locale === 'ar' ? 'اكتشف الوحدات' : locale === 'en' ? 'Explore modules' : 'Découvrir les modules'}
                <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </a>
            </div>

            {/* Social proof — monochrome tiles with hairline borders */}
            <div className="mono-fade-up-5 mt-12 flex items-center justify-center gap-3">
              <div className="flex -space-x-1.5 rtl:space-x-reverse">
                {['R','M','A','B','N'].map((initial, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-semibold text-neutral-700 ring-1 ring-neutral-200"
                    style={{ zIndex: 5 - i }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="text-[12.5px] text-neutral-400">
                <span className="font-medium text-neutral-700">50+</span> {locale === 'ar' ? 'شركة تستخدم المنصة' : locale === 'en' ? 'active businesses' : 'entreprises actives'}
              </div>
            </div>
          </div>

          {/* Product screenshot — hairline frame, no shadow blur */}
          <div className="mono-fade-up-5 mt-20 sm:mt-24">
            <div className="rounded-2xl overflow-hidden ring-1 ring-neutral-200 bg-white">
              <video autoPlay muted loop playsInline className="w-full block" poster="/t.png">
                <source src="/TracksEra-Stock-Demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/* Social proof strip - animated */}
          <div className="mt-16 sm:mt-20 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
            {(locale === 'ar' ? statsData.ar : locale === 'en' ? statsData.en : statsData.fr).map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold tracking-tight text-gray-900">{s.value}</span>
                <span className="text-[13px] text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">
              {locale === 'ar' ? 'كيف يعمل' : locale === 'en' ? 'HOW IT WORKS' : 'COMMENT ÇA MARCHE'}
            </p>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">
              {locale === 'ar' ? 'من التسجيل إلى أول عملية بيع في 5 دقائق' : locale === 'en' ? 'From signup to your first sale in 5 minutes' : "De l'inscription à la première vente en 5 minutes"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 right-[12.5%] left-[12.5%] h-px bg-gray-200" />

            {(locale === 'ar' ? [
              { step: '01', title: 'سجّل حسابك', desc: 'أنشئ حساب مجاني في أقل من دقيقة. بدون بطاقة بنكية.' },
              { step: '02', title: 'أضف منتجاتك وعملاءك', desc: 'استورد بياناتك من Excel أو أضفها يدوياً بسرعة.' },
              { step: '03', title: 'ابدأ البيع والتوصيل', desc: 'أنشئ فواتير، عيّن التوصيلات، وتابع سائقيك مباشرة.' },
              { step: '04', title: 'تابع تقاريرك', desc: 'اطلع على الأرباح، الديون، والمخزون لحظة بلحظة.' },
            ] : locale === 'en' ? [
              { step: '01', title: 'Create your account', desc: 'Free signup in under a minute. No credit card required.' },
              { step: '02', title: 'Add products & customers', desc: 'Import from Excel or add products and customers manually.' },
              { step: '03', title: 'Record sales & deliveries', desc: 'Create invoices, assign deliveries, and track drivers live.' },
              { step: '04', title: 'Monitor your reports', desc: 'See profits, receivables, and stock in real time.' },
            ] : [
              { step: '01', title: 'Créez votre compte', desc: "Inscription gratuite en moins d'une minute. Sans carte bancaire." },
              { step: '02', title: 'Ajoutez vos données', desc: 'Importez depuis Excel ou ajoutez produits et clients manuellement.' },
              { step: '03', title: 'Vendez et livrez', desc: 'Créez des factures, assignez les livraisons, suivez vos chauffeurs.' },
              { step: '04', title: 'Suivez vos rapports', desc: 'Consultez profits, dettes et stock en temps réel.' },
            ]).map((item, i) => (
              <div key={item.step} className="relative text-center">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <span className="text-[22px] font-bold text-blue-600">{item.step}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed max-w-[220px] mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trusted by ── */}
      <section className="py-14 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 text-center">
          <p className="text-[13px] text-gray-400 mb-8">
            {locale === 'ar' ? 'تستخدمه شركات التوزيع لإدارة عملياتها اليومية' : locale === 'en' ? 'Used by distribution businesses to run their daily operations' : 'Utilisé par les entreprises de distribution pour gérer leurs opérations quotidiennes'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {(locale === 'ar'
              ? ['المواد الغذائية', 'مواد التنظيف', 'المشروبات', 'مواد البناء', 'مستحضرات التجميل', 'القرطاسية']
              : locale === 'en'
              ? ['Food & beverage', 'Cleaning supplies', 'Beverages', 'Building materials', 'Cosmetics', 'Stationery']
              : ['Agroalimentaire', 'Produits d\'entretien', 'Boissons', 'Matériaux de construction', 'Cosmétiques', 'Papeterie']
            ).map((sector) => (
              <span key={sector} className="text-[14px] font-medium text-gray-300">{sector}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ── */}
      <section className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 text-center">
          <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">
            {locale === 'ar' ? 'قريباً' : locale === 'en' ? 'COMING SOON' : 'BIENTÔT'}
          </p>
          <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">
            {locale === 'ar' ? 'تكاملات مع الأنظمة الخارجية' : locale === 'en' ? 'Third-party integrations' : 'Intégrations tierces'}
          </h2>
          <p className="mt-4 text-[16px] text-gray-500 max-w-md mx-auto">
            {locale === 'ar'
              ? 'ربط مع أنظمة المحاسبة، الدفع الإلكتروني، وخدمات التوصيل.'
              : locale === 'en'
              ? 'Connect with accounting systems and delivery services.'
              : 'Connexion avec les systèmes comptables, paiement électronique et services de livraison.'}
          </p>
          <div className="mt-8">
            <Link href="/register" className="inline-flex px-6 py-3 text-[13px] font-medium text-gray-900 bg-white rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
              {locale === 'ar' ? 'أعلمني عند الإطلاق →' : locale === 'en' ? 'Notify me at launch →' : 'Me notifier au lancement →'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── About us ── */}
      <section id="about" className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">
                {locale === 'ar' ? 'من نحن' : locale === 'en' ? 'ABOUT' : 'À PROPOS'}
              </p>
              <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900 leading-[1.2]">
                {locale === 'ar' ? 'نبني مستقبل إدارة التوزيع' : locale === 'en' ? 'Business management software for retailers, wholesalers, and distributors' : "Nous construisons l'avenir de la gestion de distribution"}
              </h2>
              <p className="mt-5 text-[15px] text-gray-500 leading-[1.7]">
                {locale === 'ar'
                  ? 'تراكسيرا منصة متكاملة مصممة لتلبية احتياجات شركات التوزيع والجملة. نفهم تحديات هذا القطاع — من إدارة السائقين والتوصيلات إلى الفوترة وتتبع المخزون بدقة.'
                  : locale === 'en'
                  ? 'TrackSera is a complete platform built for distribution and wholesale businesses. We understand the operational challenges — from driver and delivery management to invoicing and accurate stock tracking.'
                  : "TrackSera est une plateforme complète conçue pour les entreprises de distribution et de gros. Nous comprenons les défis du secteur — de la gestion des chauffeurs et livraisons à la facturation et au suivi de stock."}
              </p>
              <p className="mt-4 text-[15px] text-gray-500 leading-[1.7]">
                {locale === 'ar'
                  ? 'فريقنا من المهندسين والمطورين يعمل يومياً على تحسين المنصة بناءً على ملاحظات عملائنا — لأن نجاحكم هو نجاحنا.'
                  : locale === 'en'
                  ? 'Our team of engineers and developers ships improvements every day based on customer feedback — because your success is ours.'
                  : "Notre équipe d'ingénieurs et développeurs améliore la plateforme chaque jour selon les retours de nos clients — car votre succès est le nôtre."}
              </p>
              {locale === 'en' && (
                <p className="mt-4 text-[13px] text-gray-400 leading-[1.6]">
                  Note: TrackSera is a software subscription. We do not process or hold payments on behalf of our customers.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(locale === 'ar' ? [
                { value: '100%', label: 'سحابي' },
                { value: '10+', label: 'وحدة متكاملة' },
                { value: '50+', label: 'شركة تستخدم المنصة' },
                { value: '24/7', label: 'دعم فني متواصل' },
              ] : locale === 'en' ? [
                { value: '100%', label: 'Cloud' },
                { value: '10+', label: 'Integrated modules' },
                { value: '50+', label: 'Active businesses' },
                { value: '24/7', label: 'Technical support' },
              ] : [
                { value: '100%', label: 'Cloud' },
                { value: '10+', label: 'Modules intégrés' },
                { value: '50+', label: 'Entreprises actives' },
                { value: '24/7', label: 'Support technique' },
              ]).map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-xl p-6 border border-gray-100 text-center">
                  <div className="text-[28px] font-bold text-gray-900">{stat.value}</div>
                  <div className="mt-1 text-[12px] text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Who is it for ── */}
      <section id="audience" className="py-20 sm:py-28 bg-gray-50 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">{locale === 'ar' ? 'القطاعات' : locale === 'en' ? 'SECTORS' : 'SECTEURS'}</p>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">{locale === 'ar' ? 'مصمم لقطاع التوزيع' : locale === 'en' ? 'Built for retail, wholesale, and distribution' : 'Conçu pour la distribution'}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(locale === 'ar' ? audienceData.ar : locale === 'en' ? audienceData.en : audienceData.fr).map((item, i) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-200/80 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center mb-4">{targetAudience[i]?.icon}</div>
                <h3 className="text-[14px] font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">{locale === 'ar' ? 'الوحدات' : locale === 'en' ? 'MODULES' : 'MODULES'}</p>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">{locale === 'ar' ? 'كل ما تحتاجه في منصة واحدة' : locale === 'en' ? 'Everything you need in one platform' : 'Tout ce dont vous avez besoin'}</h2>
            <p className="mt-4 text-[16px] text-gray-500 max-w-lg mx-auto">{locale === 'ar' ? '12 وحدة تغطي دورة العمل بالكامل' : locale === 'en' ? '12 modules covering the full operational cycle' : '12 modules couvrant tout le cycle de travail'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {(locale === 'ar' ? modulesData.ar : locale === 'en' ? modulesData.en : modulesData.fr).map((mod, i) => (
              <div key={mod.title} className="bg-white p-6 hover:bg-gray-50/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center mb-4 text-[14px] font-bold">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900 mb-2">{mod.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* removed redundant workflow + why us — covered by how-it-works and about sections */}

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">{locale === 'ar' ? 'الأسعار' : locale === 'en' ? 'PRICING' : 'TARIFS'}</p>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">{locale === 'ar' ? 'أسعار بسيطة وشفافة' : locale === 'en' ? 'Simple, transparent pricing' : 'Des tarifs simples et transparents'}</h2>
            <p className="mt-4 text-[16px] text-gray-500">{locale === 'ar' ? 'ابدأ مجاناً. بدون بطاقة ائتمان.' : locale === 'en' ? 'Start free. No credit card required.' : 'Commencez gratuitement. Sans carte bancaire.'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {(locale === 'ar' ? plansData.ar : locale === 'en' ? plansData.en : plansData.fr).map((plan) => (
              <div key={plan.id} className={`flex flex-col p-6 ${plan.popular ? 'bg-gray-900 text-white' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-[15px] font-semibold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                    <p className={`text-[12px] ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>{plan.subtitle}</p>
                  </div>
                  {plan.popular && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/10 text-white rounded-full border border-white/20">
                      {locale === 'ar' ? 'شائع' : locale === 'en' ? 'Popular' : 'Populaire'}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                  <span
                    className={`text-[32px] font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900'}`}
                    dir="ltr"
                  >
                    {plan.price === 0 ? (locale === 'ar' ? 'مجاناً' : locale === 'en' ? 'Free' : 'Gratuit') : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className={`text-[13px] ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>
                      {locale === 'ar' ? '/شهر' : locale === 'en' ? '/month' : '/mois'}
                    </span>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px]">
                      <svg className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-gray-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.popular ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block w-full py-2.5 text-center text-[13px] font-medium rounded-lg transition-colors ${
                    plan.popular
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.price === 0
                    ? (locale === 'ar' ? 'ابدأ مجاناً' : locale === 'en' ? 'Get started' : 'Commencer')
                    : (locale === 'ar' ? 'اشترك الآن' : locale === 'en' ? 'Subscribe' : "S'abonner")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog preview ── */}
      <section id="blog-preview" className="py-20 sm:py-28 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">
                {locale === 'ar' ? 'المدونة' : locale === 'en' ? 'BLOG' : 'BLOG'}
              </p>
              <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900 max-w-[520px] leading-tight">
                {locale === 'ar'
                  ? 'رؤى عملية لإدارة أفضل لعملك'
                  : locale === 'en'
                  ? 'Practical insights to run your business better'
                  : 'Des insights concrets pour mieux piloter votre activité'}
              </h2>
            </div>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-900 hover:text-blue-600 transition-colors self-start sm:self-auto"
            >
              {locale === 'ar' ? 'كل المقالات' : locale === 'en' ? 'All articles' : 'Tous les articles'}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
            {[...blogPosts]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map((post) => {
                // Blog content is only AR/FR — fall back to FR for EN locale
                const blogLocale = locale === 'ar' ? 'ar' : 'fr';
                const dateStr = new Date(post.date).toLocaleDateString(
                  locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                );
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block"
                  >
                    {/* Texture card header */}
                    <div
                      className="relative h-40 rounded-xl overflow-hidden mb-5"
                      style={{ background: post.gradient }}
                    >
                      <div
                        className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(45deg, rgba(255,255,255,0.7) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 14px)',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25" />
                      <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-semibold uppercase tracking-wider text-white">
                        {categoryLabels[post.category][blogLocale]}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3 text-[11px] font-medium text-gray-400">
                      <span>{dateStr}</span>
                      <span className="text-gray-300">•</span>
                      <span>
                        {post.readTime} {locale === 'ar' ? 'دقيقة قراءة' : locale === 'en' ? 'min read' : 'min de lecture'}
                      </span>
                    </div>
                    <h3 className="text-[18px] sm:text-[20px] font-bold text-gray-900 leading-snug tracking-[-0.01em] group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title[blogLocale]}
                    </h3>
                    <p className="mt-3 text-[14px] text-gray-500 leading-relaxed line-clamp-2">
                      {post.excerpt[blogLocale]}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {locale === 'ar' ? 'اقرأ المقال' : locale === 'en' ? 'Read article' : "Lire l'article"}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-[600px] mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">
            {locale === 'ar' ? 'جاهز للبدء؟' : locale === 'en' ? 'Ready to get started?' : 'Prêt à commencer ?'}
          </h2>
          <p className="mt-4 text-[16px] text-gray-500">
            {locale === 'ar' ? '14 يوم تجربة مجانية. بدون بطاقة ائتمان.' : locale === 'en' ? '14-day free trial. No credit card required.' : '14 jours d\'essai gratuit. Sans carte bancaire.'}
          </p>
          <div className="mt-8">
            <Link href="/register" className="inline-flex px-8 py-3.5 text-[14px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-colors">
              {locale === 'ar' ? 'ابدأ مجاناً' : locale === 'en' ? 'Start free' : 'Commencer gratuitement'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <ContactSection />

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/t.png" alt="TrackSera" className="w-6 h-6" />
              <span className="text-[14px] font-semibold text-gray-900">TrackSera</span>
            </div>
            <div className="flex items-center gap-6 text-[13px] text-gray-400">
              <a href="#modules" className="hover:text-gray-600 transition-colors">{locale === 'ar' ? 'الوحدات' : locale === 'en' ? 'Modules' : 'Modules'}</a>
              <a href="#pricing" className="hover:text-gray-600 transition-colors">{locale === 'ar' ? 'الأسعار' : locale === 'en' ? 'Pricing' : 'Tarifs'}</a>
              <Link href="/blog" className="hover:text-gray-600 transition-colors">{locale === 'ar' ? 'المدونة' : locale === 'en' ? 'Blog' : 'Blog'}</Link>
              <a href="#about" className="hover:text-gray-600 transition-colors">{locale === 'ar' ? 'من نحن' : locale === 'en' ? 'About' : 'À propos'}</a>
              <a href="#contact" className="hover:text-gray-600 transition-colors">{locale === 'ar' ? 'تواصل' : locale === 'en' ? 'Contact' : 'Contact'}</a>
            </div>
            <div className="text-[12px] text-gray-300 text-center">
              <p>&copy; {new Date().getFullYear()} TrackSera</p>
              <p className="mt-1">Built by <a href="https://www.symloop.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500 font-medium transition-colors">Symloop</a></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ContactSection() {
  const { locale } = useLocale();
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
    <section id="contact" className="py-20 sm:py-28 border-b border-gray-100">
      <div className="max-w-[600px] mx-auto px-5 sm:px-8">
        <div className="text-center mb-10">
          <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">CONTACT</p>
          <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-gray-900">
            {locale === 'ar' ? 'تواصل معنا' : locale === 'en' ? 'Contact us' : 'Contactez-nous'}
          </h2>
          <p className="mt-3 text-[15px] text-gray-500">
            {locale === 'ar' ? 'أرسل لنا رسالة وسنرد عليك في أقرب وقت' : locale === 'en' ? 'Send us a message and we will get back to you shortly.' : 'Envoyez-nous un message et nous vous répondrons rapidement'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[13px]">
              {locale === 'ar' ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' : locale === 'en' ? 'Message sent successfully! We will contact you soon.' : 'Message envoyé avec succès ! Nous vous contacterons bientôt.'}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{locale === 'ar' ? 'الاسم' : locale === 'en' ? 'Name' : 'Nom'} *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-[13px]"
                placeholder={locale === 'ar' ? 'اسمك الكامل' : locale === 'en' ? 'Your full name' : 'Votre nom complet'} required />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{locale === 'ar' ? 'البريد الإلكتروني' : locale === 'en' ? 'Email' : 'Email'} *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-[13px]"
                placeholder="email@example.com" required />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{locale === 'ar' ? 'رقم الهاتف' : locale === 'en' ? 'Phone' : 'Téléphone'}</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-[13px]"
                placeholder="+213 555 00 00 00" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{locale === 'ar' ? 'الشركة' : locale === 'en' ? 'Company' : 'Entreprise'}</label>
              <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-[13px]"
                placeholder={locale === 'ar' ? 'اسم الشركة' : locale === 'en' ? 'Company name' : "Nom de l'entreprise"} />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{locale === 'ar' ? 'الرسالة' : locale === 'en' ? 'Message' : 'Message'} *</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-[13px] resize-none"
              placeholder={locale === 'ar' ? 'اكتب رسالتك هنا...' : locale === 'en' ? 'Write your message here...' : 'Votre message...'} required />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50">
            {submitting
              ? (locale === 'ar' ? 'جاري الإرسال...' : locale === 'en' ? 'Sending...' : 'Envoi en cours...')
              : (locale === 'ar' ? 'إرسال الرسالة' : locale === 'en' ? 'Send message' : 'Envoyer le message')}
          </button>
        </form>
      </div>
    </section>
  );
}
