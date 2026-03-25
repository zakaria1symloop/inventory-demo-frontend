'use client';

import Link from 'next/link';
import Image from 'next/image';

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
    rights: 'جميع الحقوق محفوظة',
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
    rights: 'Tous droits réservés',
    moduleList: ['Gestion des Commandes', 'Livraison & Suivi GPS', 'Cashvan', 'Ventes & Facturation', 'Stock & Entrepôts', 'Rapports'],
  },
};

interface Props {
  lang: 'ar' | 'fr';
}

export default function SiteFooter({ lang }: Props) {
  const f = footer[lang];

  return (
    <footer className="border-t border-gray-100 bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/t.png" alt="TrackSera" width={32} height={32} className="object-contain" />
              <h3 className="text-lg font-bold text-gray-900">{f.brand}</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">{f.brandDesc}</p>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-bold text-gray-900">{f.quickLinks}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-blue-600">{f.home}</Link></li>
              <li><Link href="/#modules" className="hover:text-blue-600">{f.modules}</Link></li>
              <li><Link href="/#pricing" className="hover:text-blue-600">{f.pricing}</Link></li>
              <li><Link href="/#contact" className="hover:text-blue-600">{f.contact}</Link></li>
              <li><Link href="/blog" className="hover:text-blue-600">{f.blog}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-bold text-gray-900">{f.modulesTitle}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {f.moduleList.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} TrackSera. {f.rights}.
        </div>
      </div>
    </footer>
  );
}
