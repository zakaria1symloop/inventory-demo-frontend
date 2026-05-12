'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { LocaleProvider, useLocale } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/locales';

function ToasterWithLocale() {
  const { dir } = useLocale();
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          direction: dir,
          fontFamily: 'var(--font-tajawal)',
        },
      }}
    />
  );
}

export default function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider initialLocale={initialLocale}>
        {children}
        <ToasterWithLocale />
      </LocaleProvider>
    </QueryClientProvider>
  );
}
