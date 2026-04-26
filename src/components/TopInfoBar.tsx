'use client';

export default function TopInfoBar() {
  return (
    <div className="bg-gray-900 text-white text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="mailto:contact@tracksera.com" className="flex items-center gap-1.5 hover:text-blue-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            contact@tracksera.com
          </a>
          <a href="tel:+213549575512" className="flex items-center gap-1.5 hover:text-blue-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span dir="ltr">+213 549 575 512</span>
          </a>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-gray-400">
          <span>الأحد — الخميس: 8:00 - 17:00</span>
        </div>
      </div>
    </div>
  );
}
