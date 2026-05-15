export type UserRole = 'admin' | 'production_manager' | 'technician' | 'engineer' | 'procurement' | 'read_only';

export type Permission =
  | 'edit_drone_status'
  | 'edit_drone_technical'    // build version, serial, flight hours, region
  | 'edit_drone_compliance'   // ECT, ECN, FAA toggles
  | 'edit_drone_notes'
  | 'add_drones'
  | 'edit_wo_status'
  | 'edit_wo_priority'
  | 'edit_wo_assigned_tech'
  | 'edit_wo_hours'
  | 'edit_wo_notes'
  | 'edit_wo_parts'
  | 'add_work_orders'
  | 'edit_inventory_counts'   // currentCount, incoming
  | 'edit_inventory_status'   // pipoStatus, repurchaseFlag
  | 'edit_inventory_min'      // minQty
  | 'edit_purchase_links'
  | 'edit_inventory_notes'
  | 'add_inventory'
  | 'manage_users';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'edit_drone_status', 'edit_drone_technical', 'edit_drone_compliance', 'edit_drone_notes', 'add_drones',
    'edit_wo_status', 'edit_wo_priority', 'edit_wo_assigned_tech', 'edit_wo_hours', 'edit_wo_notes', 'edit_wo_parts', 'add_work_orders',
    'edit_inventory_counts', 'edit_inventory_status', 'edit_inventory_min', 'edit_purchase_links', 'edit_inventory_notes', 'add_inventory',
    'manage_users',
  ],
  production_manager: [
    'edit_drone_status', 'edit_drone_technical', 'edit_drone_compliance', 'edit_drone_notes', 'add_drones',
    'edit_wo_status', 'edit_wo_priority', 'edit_wo_assigned_tech', 'edit_wo_hours', 'edit_wo_notes', 'edit_wo_parts', 'add_work_orders',
    'edit_inventory_counts', 'edit_inventory_status', 'edit_inventory_min', 'add_inventory', 'edit_inventory_notes',
  ],
  technician: [
    'edit_drone_status', 'edit_drone_notes',
    'edit_wo_status', 'edit_wo_notes', 'edit_wo_parts', 'add_work_orders',
    'edit_inventory_counts',
  ],
  engineer: [
    'edit_drone_technical', 'edit_drone_compliance', 'edit_drone_notes',
    'edit_wo_notes', 'edit_wo_parts', 'add_work_orders',
    'edit_inventory_notes',
  ],
  procurement: [
    'edit_inventory_counts', 'edit_inventory_status', 'edit_inventory_min', 'edit_purchase_links', 'edit_inventory_notes', 'add_inventory',
  ],
  read_only: [],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  production_manager: 'Production Manager',
  technician: 'Technician',
  engineer: 'Engineer',
  procurement: 'Procurement',
  read_only: 'Read Only',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  production_manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  technician: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  engineer: 'bg-green-500/20 text-green-400 border-green-500/30',
  procurement: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  read_only: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};
