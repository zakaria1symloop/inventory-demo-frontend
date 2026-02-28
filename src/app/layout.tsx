import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'تراكسيرا — برنامج إدارة التوزيع في الجزائر | Logiciel de Distribution',
    template: '%s | تراكسيرا',
  },
  description: 'برنامج إدارة التوزيع الأول في الجزائر. إدارة الطلبات، التوصيل، البيع المتنقل (Cashvan)، تتبع السائقين، إدارة المخزون والمستودعات، الفوترة والتقارير المالية. حل متكامل لشركات التوزيع والجملة.',
  keywords: [
    'برنامج إدارة التوزيع',
    'برنامج توزيع الجزائر',
    'logiciel de distribution algerie',
    'logiciel gestion distribution',
    'إدارة الطلبات والتوصيل',
    'البيع المتنقل',
    'cashvan algerie',
    'برنامج إدارة المبيعات',
    'تتبع السائقين',
    'إدارة المخزون والمستودعات',
    'برنامج فوترة الجزائر',
    'gestion commerciale algerie',
    'logiciel ERP distribution',
    'برنامج الجملة والتجزئة',
    'distribution management software algeria',
  ],
  openGraph: {
    title: 'تراكسيرا — برنامج إدارة التوزيع في الجزائر',
    description: 'حل متكامل لشركات التوزيع: طلبات، توصيل، بيع متنقل، تتبع سائقين، مخزون، فوترة وتقارير مالية.',
    type: 'website',
    locale: 'ar_DZ',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                direction: 'rtl',
                fontFamily: 'Tajawal',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
