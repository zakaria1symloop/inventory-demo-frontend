'use client';

import { ProductRequestsContent } from '../product-requests/_components/ProductRequestsContent';
import { useLocale } from '@/lib/i18n/context';

export default function SellerProductRequestsPage() {
  const { t } = useLocale();
  return (
    <ProductRequestsContent
      requestType="cashvan"
      title={t('productRequests.sellerTitle')}
      subtitle={t('productRequests.sellerSubtitle')}
    />
  );
}
