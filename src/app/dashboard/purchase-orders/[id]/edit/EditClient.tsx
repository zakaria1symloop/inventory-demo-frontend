'use client';

import { useParams } from 'next/navigation';
import PurchaseOrderForm from '../../_components/PurchaseOrderForm';
import { useLocale } from '@/lib/i18n/context';

export default function EditClient() {
  const params = useParams();
  const { t } = useLocale();
  const id = params?.id ? parseInt(params.id as string) : null;

  if (!id || isNaN(id)) {
    return <div className="p-6">{t('purchases.invalidInvoiceId') || 'Invalid order ID'}</div>;
  }

  return <PurchaseOrderForm purchaseOrderId={id} />;
}
