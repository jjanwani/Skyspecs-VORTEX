import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DroneStatus, WorkOrderStatus, WorkOrderType, WorkOrderPriority, PIPOStatus } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDroneStatusLabel(status: DroneStatus): string {
  const labels: Record<DroneStatus, string> = {
    wip_redress: 'WIP / Redress',
    ready_for_deployment: 'Ready for Deployment',
    flight_status: 'Flight Status',
    returning_field: 'Returning from Field',
    field: 'In Field',
    in_maintenance: 'In Maintenance',
    rca: 'RCA',
  };
  return labels[status];
}

export function getDroneStatusColor(status: DroneStatus): string {
  const colors: Record<DroneStatus, string> = {
    wip_redress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ready_for_deployment: 'bg-green-500/20 text-green-400 border-green-500/30',
    flight_status: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    returning_field: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    field: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    in_maintenance: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    rca: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[status];
}

export function getWorkOrderStatusLabel(status: WorkOrderStatus): string {
  const labels: Record<WorkOrderStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold',
  };
  return labels[status];
}

export function getWorkOrderStatusColor(status: WorkOrderStatus): string {
  const colors: Record<WorkOrderStatus, string> = {
    open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    on_hold: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[status];
}

export function getWorkOrderTypeLabel(type: WorkOrderType): string {
  const labels: Record<WorkOrderType, string> = {
    maintenance: 'Maintenance',
    upgrade: 'Upgrade',
    issue: 'Issue Fix',
    rca: 'RCA',
  };
  return labels[type];
}

export function getWorkOrderTypeColor(type: WorkOrderType): string {
  const colors: Record<WorkOrderType, string> = {
    maintenance: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    upgrade: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    issue: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    rca: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[type];
}

export function getPriorityColor(priority: WorkOrderPriority): string {
  const colors: Record<WorkOrderPriority, string> = {
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[priority];
}

export function getPIPOStatusLabel(status: PIPOStatus): string {
  const labels: Record<PIPOStatus, string> = {
    in_stock: 'In Stock',
    on_order: 'On Order',
    depleted: 'Depleted',
    low_stock: 'Low Stock',
  };
  return labels[status];
}

export function getPIPOStatusColor(status: PIPOStatus): string {
  const colors: Record<PIPOStatus, string> = {
    in_stock: 'bg-green-500/20 text-green-400 border-green-500/30',
    on_order: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    depleted: 'bg-red-500/20 text-red-400 border-red-500/30',
    low_stock: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  return colors[status];
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
