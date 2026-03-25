'use client';

import { ProductRequestsContent } from '../product-requests/_components/ProductRequestsContent';
import { useLocale } from '@/lib/i18n/context';

export default function CashvanProductRequestsPage() {
  const { t } = useLocale();
  return (
    <ProductRequestsContent
      requestType="cashvan"
      title={t('productRequests.cashvanTitle')}
      subtitle={t('productRequests.cashvanSubtitle')}
    />
  );
}
