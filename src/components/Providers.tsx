'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { LocaleProvider, useLocale } from '@/lib/i18n/context';

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

export default function Providers({ children }: { children: React.ReactNode }) {
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
      <LocaleProvider>
        {children}
        <ToasterWithLocale />
      </LocaleProvider>
    </QueryClientProvider>
  );
}
