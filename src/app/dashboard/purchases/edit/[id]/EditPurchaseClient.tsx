'use client';

import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/i18n/context';
import PurchaseForm from '../../_components/PurchaseForm';

export default function EditPurchaseClient() {
  const params = useParams();
  const { t } = useLocale();
  const purchaseId = params?.id ? parseInt(params.id as string) : null;

  if (!purchaseId) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-[14px]">
        {t('purchases.invalidInvoiceId')}
      </div>
    );
  }

  return <PurchaseForm purchaseId={purchaseId} />;
}
