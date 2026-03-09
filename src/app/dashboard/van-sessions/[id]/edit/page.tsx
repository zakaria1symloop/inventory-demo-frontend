import EditVanSession from './EditVanSession';

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <EditVanSession />;
}
