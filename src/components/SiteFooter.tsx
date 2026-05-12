'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SECTORS } from '@/lib/sectors';
import { WILAYAS } from '@/lib/wilayas';

const footer = {
  ar: {
    brand: 'تراكسيرا',
    brandDesc: 'برنامج إدارة التوزيع المتكامل في الجزائر. طلبات، توصيل، بيع متنقل، مخزون وتقارير مالية.',
    quickLinks: 'روابط سريعة',
    home: 'الرئيسية',
    modules: 'الوحدات',
    pricing: 'الأسعار',
    contact: 'تواصل معنا',
    blog: 'المدونة',
    modulesTitle: 'الوحدات',
    sectorsTitle: 'القطاعات',
    citiesTitle: 'المدن الرئيسية',
    allWilayas: 'جميع 58 ولاية',
    allSectors: 'جميع القطاعات',
    rights: 'جميع الحقوق محفوظة',
    legalTitle: 'القانوني',
    terms: 'شروط الاستخدام',
    privacy: 'سياسة الخصوصية',
    refund: 'سياسة الاسترداد',
    moduleList: ['إدارة الطلبات', 'التوصيل وتتبع GPS', 'البيع المتنقل - Cashvan', 'المبيعات والفوترة', 'المخزون والمستودعات', 'التقارير والتحليلات'],
  },
  fr: {
    brand: 'TrackSera',
    brandDesc: 'Logiciel de gestion de distribution en Algérie. Commandes, livraison, vente mobile, stock et rapports.',
    quickLinks: 'Liens rapides',
    home: 'Accueil',
    modules: 'Modules',
    pricing: 'Tarifs',
    contact: 'Contact',
    blog: 'Blog',
    modulesTitle: 'Modules',
    sectorsTitle: 'Secteurs',
    citiesTitle: 'Principales wilayas',
    allWilayas: 'Toutes les 58 wilayas',
    allSectors: 'Tous les secteurs',
    rights: 'Tous droits réservés',
    legalTitle: 'Légal',
    terms: "Conditions d'utilisation",
    privacy: 'Politique de confidentialité',
    refund: 'Politique de remboursement',
    moduleList: ['Gestion des Commandes', 'Livraison & Suivi GPS', 'Cashvan', 'Ventes & Facturation', 'Stock & Entrepôts', 'Rapports'],
  },
  en: {
    brand: 'TrackSera',
    brandDesc: 'Business management software for retailers, wholesalers, and distributors. Inventory, sales, deliveries, mobile sales, and reporting.',
    quickLinks: 'Quick links',
    home: 'Home',
    modules: 'Modules',
    pricing: 'Pricing',
    contact: 'Contact',
    blog: 'Blog',
    modulesTitle: 'Modules',
    sectorsTitle: 'Sectors',
    citiesTitle: 'Cities',
    allWilayas: 'All 58 wilayas',
    allSectors: 'All sectors',
    rights: 'All rights reserved',
    legalTitle: 'Legal',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    refund: 'Refund Policy',
    moduleList: ['Orders', 'Delivery & GPS', 'CashVan', 'Sales & Invoicing', 'Inventory & Warehouses', 'Reports'],
  },
};

// Top 12 wilayas by population for footer
const TOP_WILAYAS_SLUGS = ['alger', 'oran', 'constantine', 'setif', 'annaba', 'blida', 'tizi-ouzou', 'batna', 'bejaia', 'tlemcen', 'biskra', 'ghardaia'];

interface Props {
  lang: 'ar' | 'fr' | 'en';
}

export default function SiteFooter({ lang }: Props) {
  const f = footer[lang];
  const topWilayas = TOP_WILAYAS_SLUGS.map((slug) => WILAYAS.find((w) => w.slug === slug)).filter(Boolean);
  const topSectors = SECTORS.slice(0, 8);
  const isAr = lang === 'ar';

  return (
    <footer className="border-t border-gray-100 bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/t.png" alt="TrackSera" width={32} height={32} className="object-contain" />
              <h3 className="text-lg font-bold text-gray-900">{f.brand}</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">{f.brandDesc}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-gray-900 uppercase tracking-wide">{f.quickLinks}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-blue-600">{f.home}</Link></li>
              <li><Link href="/#modules" className="hover:text-blue-600">{f.modules}</Link></li>
              <li><Link href="/tarifs" className="hover:text-blue-600">{f.pricing}</Link></li>
              <li><Link href="/blog" className="hover:text-blue-600">{f.blog}</Link></li>
              <li><Link href="/faq" className="hover:text-blue-600">FAQ</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600">{f.terms}</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600">{f.privacy}</Link></li>
              <li><Link href="/refund" className="hover:text-blue-600">{f.refund}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-gray-900 uppercase tracking-wide">{f.sectorsTitle}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {topSectors.map((s) => (
                <li key={s.slug}>
                  <Link href={`/secteurs/${s.slug}`} className="hover:text-blue-600">
                    {s.emoji} {isAr ? s.name.ar : s.name.fr}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/secteurs" className="hover:text-blue-600 font-semibold text-blue-600">
                  → {f.allSectors}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-bold text-gray-900 uppercase tracking-wide">{f.citiesTitle}</h3>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-gray-500">
              {topWilayas.map((w) => w && (
                <li key={w.slug}>
                  <Link href={`/distribution/${w.slug}`} className="hover:text-blue-600">
                    {isAr ? w.name.ar : w.name.fr}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/distribution" className="inline-block mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">
              → {f.allWilayas}
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-400 space-y-1">
          <p>&copy; {new Date().getFullYear()} TrackSera. {f.rights}.</p>
          <p>Built by <a href="https://www.symloop.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">Symloop</a></p>
        </div>
      </div>
    </footer>
  );
}
