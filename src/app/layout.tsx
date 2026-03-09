import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  display: 'swap',
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'TrackSera — Rafik',
  description: 'Distribution Management System',
  robots: { index: false, follow: false },
  icons: {
    icon: '/t.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className={`${tajawal.className} antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { direction: 'rtl', fontFamily: 'var(--font-tajawal)' },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
