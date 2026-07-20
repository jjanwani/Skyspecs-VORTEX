import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DroneStatus, WorkOrderStatus, WorkOrderType, WorkOrderPriority, PIPOStatus, SFSyncStatus, ECNActionType } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDroneStatusLabel(status: DroneStatus): string {
  const labels: Record<DroneStatus, string> = {
    deployed: 'Deployed',
    issue_in_field: 'Issue in Field',
    delivered: 'Delivered',
    kit_ingestion: 'Kit Ingestion',
    ready_to_redress: 'Ready to Redress',
    drone_redress: 'Drone Redress',
    ready_to_test: 'Ready to Test',
    eol_testing: 'EOL Testing',
    ready_to_pack: 'Ready to Pack',
    packup_kits: 'Packup Kits',
    operational: 'Operational',
    ready_to_rca: 'Ready to RCA',
    engineering_rca: 'Engineering RCA',
    rca_ready_to_redress: 'RCA → Redress',
  };
  return labels[status];
}

export function getDroneStatusColor(status: DroneStatus): string {
  const colors: Record<DroneStatus, string> = {
    deployed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    issue_in_field: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    delivered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    kit_ingestion: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    ready_to_redress: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    drone_redress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    ready_to_test: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    eol_testing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ready_to_pack: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    packup_kits: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    operational: 'bg-green-500/20 text-green-400 border-green-500/30',
    ready_to_rca: 'bg-red-500/20 text-red-400 border-red-500/30',
    engineering_rca: 'bg-red-500/20 text-red-400 border-red-500/30',
    rca_ready_to_redress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
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

export function getECNActionLabel(action: ECNActionType): string {
  const labels: Record<ECNActionType, string> = {
    add: 'Add',
    remove: 'Remove',
    replace: 'Replace',
  };
  return labels[action];
}

export function getECNActionColor(action: ECNActionType): string {
  const colors: Record<ECNActionType, string> = {
    add: 'bg-green-500/20 text-green-400 border-green-500/30',
    remove: 'bg-red-500/20 text-red-400 border-red-500/30',
    replace: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  return colors[action];
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getSFSyncLabel(status: SFSyncStatus | undefined): string {
  const labels: Record<SFSyncStatus, string> = {
    synced: 'SF Synced',
    pending: 'Sync Pending',
    error: 'Sync Error',
    not_synced: 'Not in SF',
  };
  return labels[status ?? 'synced'];
}

export function getSFSyncColor(status: SFSyncStatus | undefined): string {
  const colors: Record<SFSyncStatus, string> = {
    synced: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/10 text-red-400 border-red-500/30',
    not_synced: 'bg-gray-500/10 text-gray-500 border-gray-600/30',
  };
  return colors[status ?? 'synced'];
}

export function getSFSyncDot(status: SFSyncStatus | undefined): string {
  const dots: Record<SFSyncStatus, string> = {
    synced: 'bg-emerald-400',
    pending: 'bg-amber-400 animate-pulse',
    error: 'bg-red-400',
    not_synced: 'bg-gray-600',
  };
  return dots[status ?? 'synced'];
}
