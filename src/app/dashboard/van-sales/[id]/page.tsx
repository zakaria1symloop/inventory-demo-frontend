import VanSaleDetailClient from './VanSaleDetailClient';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function VanSaleDetailPage() {
  return <VanSaleDetailClient />;
}
