'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';

const nav = {
  ar: { modules: 'الوحدات', audience: 'لمن هذا البرنامج؟', pricing: 'الأسعار', contact: 'تواصل معنا', blog: 'المدونة', login: 'تسجيل الدخول', cta: 'ابدأ مجاناً' },
  fr: { modules: 'Modules', audience: 'Pour qui ?', pricing: 'Tarifs', contact: 'Contact', blog: 'Blog', login: 'Connexion', cta: 'Essai gratuit' },
};

const topBar = {
  ar: { address: 'الجزائر العاصمة، البيار', addressShort: 'الجزائر، البيار' },
  fr: { address: 'Alger, El Biar', addressShort: 'Alger, El Biar' },
};

interface Props {
  lang: 'ar' | 'fr';
  onLangToggle: () => void;
}

export default function SiteNav({ lang, onLangToggle }: Props) {
  const [open, setOpen] = useState(false);
  const isRtl = lang === 'ar';
  const n = nav[lang];
  const tb = topBar[lang];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gray-900 text-gray-300 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-9">
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="tel:+213549575512" className="flex items-center gap-1.5 hover:text-white transition-colors" dir="ltr">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <span>+213 549 57 55 12</span>
            </a>
            <a href="mailto:contact@tracksera.com" className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>contact@tracksera.com</span>
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="hidden sm:inline">{tb.address}</span>
            <span className="sm:hidden">{tb.addressShort}</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/t.png" alt="TrackSera" width={36} height={36} className="object-contain" />
              <span className="text-lg font-bold text-gray-900">{isRtl ? 'تراكسيرا' : 'TrackSera'}</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/#modules" className="hover:text-blue-600 transition-colors">{n.modules}</Link>
              <Link href="/#audience" className="hover:text-blue-600 transition-colors">{n.audience}</Link>
              <Link href="/tarifs" className="hover:text-blue-600 transition-colors">{n.pricing}</Link>
              <Link href="/#contact" className="hover:text-blue-600 transition-colors">{n.contact}</Link>
              <Link href="/blog" className="hover:text-blue-600 transition-colors">{n.blog}</Link>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher lang={lang} onToggle={onLangToggle} />
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">{n.login}</Link>
              <Link href="/register" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">{n.cta}</Link>
            </div>

            {/* Mobile: CTA + Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <Link href="/register" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">{n.cta}</Link>
              <button onClick={() => setOpen(!open)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Toggle menu">
                {open ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-1">
              <Link href="/#modules" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">{n.modules}</Link>
              <Link href="/#audience" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">{n.audience}</Link>
              <Link href="/tarifs" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">{n.pricing}</Link>
              <Link href="/#contact" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">{n.contact}</Link>
              <Link href="/blog" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">{n.blog}</Link>
              <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between px-4">
                <LanguageSwitcher lang={lang} onToggle={onLangToggle} />
                <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">{n.login}</Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
