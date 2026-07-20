import { ecns } from '@/lib/data/ecns';
import ECNDetailClient from './ECNDetailClient';

export async function generateStaticParams() {
  return ecns.map(e => ({ id: e.id }));
}

export default async function ECNPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ECNDetailClient id={id} />;
}
