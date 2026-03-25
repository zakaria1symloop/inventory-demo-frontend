'use client';

import { useParams } from 'next/navigation';
import { useLocale } from '@/lib/i18n/context';
import PurchaseForm from '../../_components/PurchaseForm';

export default function EditPurchaseClient() {
  const params = useParams();
  const { t } = useLocale();
  const purchaseId = params?.id ? parseInt(params.id as string) : null;

  if (!purchaseId) {
    return <div className="p-6">{t('purchases.invalidInvoiceId')}</div>;
  }

  return <PurchaseForm purchaseId={purchaseId} />;
}
