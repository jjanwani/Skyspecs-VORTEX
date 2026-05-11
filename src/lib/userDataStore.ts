import { Drone, WorkOrder, InventoryItem } from '@/lib/types';

export function getUserDrones(): Drone[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('user-drones') || '[]'); } catch { return []; }
}
export function saveUserDrones(drones: Drone[]) {
  localStorage.setItem('user-drones', JSON.stringify(drones));
}
export function getUserWorkOrders(): WorkOrder[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('user-workorders') || '[]'); } catch { return []; }
}
export function saveUserWorkOrders(wos: WorkOrder[]) {
  localStorage.setItem('user-workorders', JSON.stringify(wos));
}
export function getUserInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('user-inventory') || '[]'); } catch { return []; }
}
export function saveUserInventory(items: InventoryItem[]) {
  localStorage.setItem('user-inventory', JSON.stringify(items));
}
