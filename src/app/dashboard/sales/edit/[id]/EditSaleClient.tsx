'use client';

import { useParams } from 'next/navigation';
import SaleForm from '../../_components/SaleForm';
import { useLocale } from '@/lib/i18n/context';

export default function EditSaleClient() {
  const params = useParams();
  const { t } = useLocale();
  const saleId = params?.id ? parseInt(params.id as string) : null;

  if (!saleId) {
    return <div className="p-6">{t('saleDetail.invalidInvoiceId')}</div>;
  }

  return <SaleForm saleId={saleId} />;
}
