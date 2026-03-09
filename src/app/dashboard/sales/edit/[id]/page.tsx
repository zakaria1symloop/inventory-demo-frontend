import EditSaleClient from './EditSaleClient';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function EditSalePage() {
  return <EditSaleClient />;
}
