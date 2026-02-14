import VanSessionDetail from './VanSessionDetail';

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <VanSessionDetail />;
}
