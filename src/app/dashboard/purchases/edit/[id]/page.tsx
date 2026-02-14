import EditPurchaseClient from './EditPurchaseClient';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function EditPurchasePage() {
  return <EditPurchaseClient />;
}
