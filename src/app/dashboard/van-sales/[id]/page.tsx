import { redirect } from 'next/navigation';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default async function VanSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/van-sessions/${id}`);
}
