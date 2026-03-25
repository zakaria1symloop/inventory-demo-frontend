'use client';

import { ProductRequestsContent } from '../product-requests/_components/ProductRequestsContent';
import { useLocale } from '@/lib/i18n/context';

export default function LivreurProductRequestsPage() {
  const { t } = useLocale();
  return (
    <ProductRequestsContent
      requestType="livreur"
      title={t('productRequests.livreurTitle')}
      subtitle={t('productRequests.livreurSubtitle')}
    />
  );
}
