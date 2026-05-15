import { drones } from '@/lib/data/drones';
import DroneDetailClient from './DroneDetailClient';

export async function generateStaticParams() {
  return drones.map(d => ({ id: d.id }));
}

export default async function DronePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DroneDetailClient id={id} />;
}
