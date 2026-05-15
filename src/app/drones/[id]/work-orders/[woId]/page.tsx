import { drones } from '@/lib/data/drones';
import { workOrders } from '@/lib/data/workorders';
import WODetailClient from './WODetailClient';

export async function generateStaticParams() {
  return workOrders.map(wo => ({ id: wo.droneId, woId: wo.id }));
}

export default async function WorkOrderPage({ params }: { params: Promise<{ id: string; woId: string }> }) {
  const { id, woId } = await params;
  return <WODetailClient id={id} woId={woId} />;
}
