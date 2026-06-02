export type DroneStatus =
  | 'deployed'
  | 'issue_in_field'
  | 'delivered'
  | 'kit_ingestion'
  | 'ready_to_redress'
  | 'drone_redress'
  | 'ready_to_test'
  | 'eol_testing'
  | 'ready_to_pack'
  | 'packup_kits'
  | 'operational'
  | 'ready_to_rca'
  | 'engineering_rca'
  | 'rca_ready_to_redress';

export type WorkOrderType = 'maintenance' | 'upgrade' | 'issue' | 'rca';
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'on_hold';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface PhaseEntry {
  status: DroneStatus;
  enteredAt: string;  // ISO timestamp
  exitedAt?: string;  // ISO timestamp, absent = currently in this phase
}

export interface DroneReturn {
  id: string;
  returnedAt: string;
  reason: 'crash' | 'maintenance' | 'upgrade' | 'issue' | 'rca' | 'other';
  notes?: string;
  leadTimeMinutes: number;
  setupTimeMinutes: number;
  cycleTimeMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: string;
  createdAt: string;
  completedAt?: string;
}

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
  tasks?: Task[];
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
  flightTestStatus?: 'pass' | 'fail' | 'pending';
  flightTestDate?: string;
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

export interface SubsystemField {
  id: string;
  label: string;
  type: 'dropdown' | 'number' | 'text';
  options?: string[];   // only for 'dropdown' type
}

export interface SubsystemType {
  id: string;
  name: string;
  icon: string;         // emoji or short label for display
  fields: SubsystemField[];
}

export interface ConfigFieldChange {
  fieldId: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

export interface ConfigChangeEvent {
  id: string;
  timestamp: string;    // ISO
  changedBy: string;
  reason: string;
  changes: ConfigFieldChange[];
  notes?: string;
}

export interface Subsystem {
  id: string;           // e.g. "GMB1-001"
  typeId: string;       // e.g. "gimbal"
  crossRef?: string;    // e.g. "SS-FS-GMB1-001"
  droneId?: string;     // drone it's currently installed on
  currentConfig: Record<string, string>;  // fieldId → current value
  history: ConfigChangeEvent[];
  notes?: string;
}

// ── Flexible subset / asset grid ─────────────────────────────────────────────

export interface SubsetPart {
  id: string;
  label: string;
  type: 'status' | 'text';
}

export interface SubsetDefinition {
  id: string;
  name: string;
  parts: SubsetPart[];
  statusOptions?: string[];   // per-subset; falls back to DEFAULT_STATUS_OPTIONS
  createdAt: string;
}

export interface SubsetAsset {
  id: string;
  crossRef?: string;
  notes?: string;
}

export interface SubsetCellChange {
  partId: string;
  partLabel: string;
  oldValue: string;
  newValue: string;
}

export interface SubsetHistoryEvent {
  id: string;
  timestamp: string;
  changedBy: string;
  reason?: string;
  subsetId: string;
  subsetName: string;
  changes: SubsetCellChange[];
  notes?: string;
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
