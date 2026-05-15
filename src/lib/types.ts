export type DroneStatus =
  | 'wip_redress'
  | 'ready_for_deployment'
  | 'flight_status'
  | 'returning_field'
  | 'field'
  | 'in_maintenance'
  | 'rca';

export type WorkOrderType = 'maintenance' | 'upgrade' | 'issue' | 'rca';
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'on_hold';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';

export type SFSyncStatus = 'synced' | 'pending' | 'error' | 'not_synced';

export interface SFSyncMeta {
  sfId?: string;           // Salesforce record ID (18-char)
  sfSyncStatus?: SFSyncStatus;
  sfLastSynced?: string;   // ISO timestamp of last successful sync
  sfObject?: string;       // e.g. 'WorkOrder', 'Asset', 'Inventory_Item__c'
}

export interface WorkOrder extends SFSyncMeta {
  id: string;
  droneId: string;
  droneName: string;
  title: string;
  description: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assignedTech: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedHours: number;
  actualHours?: number;
  previousOccurrences: number;
  ernReference?: string;
  slackThread?: string;
  googleDriveLink?: string;
  notes?: string;
  parts?: { name: string; qty: number; status: 'available' | 'on_order' | 'missing' }[];
  completionHistory?: { droneId: string; droneName: string; date: string; tech: string }[];
  source?: 'platform' | 'slack' | 'salesforce';
  salesforceProjectId?: string;
  salesforceProjectName?: string;
}

export interface Drone extends SFSyncMeta {
  id: string;
  name: string;
  version: string;
  status: DroneStatus;
  assignedTech?: string;
  location: string;
  ectCompliance: boolean;
  ecnCompliance: boolean;
  faaRegistration: boolean;
  workOrders: string[];
  lastFlightDate?: string;
  totalFlightHours: number;
  notes?: string;
  serialNumber: string;
  buildVersion: string;
  deploymentRegion?: string;
  crashHistory: number;
  rcaCompleted: boolean;
  salesforceAssetId?: string;
}

export type InventoryCategory =
  | 'Corestack'
  | 'Gimbal'
  | 'Fuselage'
  | 'Peripherals'
  | 'GCS'
  | 'RTK'
  | 'Transmitters'
  | 'Misc'
  | '3D Printing';

export type PIPOStatus = 'in_stock' | 'on_order' | 'depleted' | 'low_stock';

export interface InventoryItem extends SFSyncMeta {
  id: string;
  name: string;
  category: InventoryCategory;
  assignedTech?: string;
  qty: number;
  minQty: number;
  complete: number | string;
  inStock: number;
  importedFromPFEP: boolean;
  location: string;
  countedInventory: number;
  discrepancy: number;
  incoming: number;
  usageRate: number;
  notes?: string;
  lastAudit: string;
  lastUpdated: string;
  qtyPerAssembly: number;
  releaseDate?: string;
  ecn?: string;
  newRelease?: boolean;
  pipoStatus: PIPOStatus;
  pipoPlan?: string;
  lastAuditCount: number;
  stockAddedSinceAudit: number;
  usageSinceAudit: number;
  usageRatePerWeek: number;
  currentCount: number;
  repurchaseFlag: boolean;
  repurchaseCount: number;
  purchaseLink?: string;
}

export interface KPIData {
  totalDrones: number;
  dronesDeployed: number;
  dronesInMaintenance: number;
  dronesBuildable: number;
  qualityStops: number;
  openWorkOrders: number;
  completedWorkOrdersThisMonth: number;
  inventoryItemsBelowMin: number;
  inventoryBeingRepurchased: number;
  financialAssetValue: number;
  crashedRecoveredRCA: number;
  dronesInUS: number;
  dronesInCanada: number;
  dronesInUK: number;
  dronesInEU: number;
}
