import { Drone, WorkOrder, InventoryItem, PhaseEntry, DroneReturn, DroneStatus, Subsystem, EngineeringChangeNotice } from '@/lib/types';

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
export function getUserSubsystems(): Subsystem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('user-subsystems') || '[]'); } catch { return []; }
}
export function saveUserSubsystems(items: Subsystem[]) {
  localStorage.setItem('user-subsystems', JSON.stringify(items));
}
export function getUserECNs(): EngineeringChangeNotice[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('user-ecns') || '[]'); } catch { return []; }
}
export function saveUserECNs(items: EngineeringChangeNotice[]) {
  localStorage.setItem('user-ecns', JSON.stringify(items));
}

// ── Phase time tracking ──────────────────────────────────────────────────────

/** Lightweight map of droneId → {status, enteredAt} for fast wait-time checks. */
export function getStatusTimestamps(): Record<string, { status: string; enteredAt: string }> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('drone-status-timestamps') || '{}'); } catch { return {}; }
}

export function getDronePhaseHistory(droneId: string): PhaseEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(`drone-phase-${droneId}`) || '[]'); } catch { return []; }
}

/**
 * Records a phase transition. Returns the completed cycle's PhaseEntry[] when
 * transitioning to 'deployed' and at least one intervening phase was tracked;
 * otherwise returns null.
 */
export function recordPhaseTransition(droneId: string, toStatus: DroneStatus): PhaseEntry[] | null {
  if (typeof window === 'undefined') return null;
  const now = new Date().toISOString();

  // Update lightweight timestamp index (used by Header for wait-time alerts)
  const timestamps = getStatusTimestamps();
  timestamps[droneId] = { status: toStatus, enteredAt: now };
  localStorage.setItem('drone-status-timestamps', JSON.stringify(timestamps));

  // Build updated phase history (close current open entry, append new one)
  const history = getDronePhaseHistory(droneId);
  const closed = history.map((e, i) =>
    i === history.length - 1 && !e.exitedAt ? { ...e, exitedAt: now } : e
  );
  closed.push({ status: toStatus, enteredAt: now });
  localStorage.setItem(`drone-phase-${droneId}`, JSON.stringify(closed));

  // When returning to deployed, extract and return the phases of the just-completed cycle
  if (toStatus === 'deployed' && closed.length > 1) {
    let lastDeployedIdx = -1;
    for (let i = closed.length - 2; i >= 0; i--) { // skip the entry we just pushed
      if (closed[i].status === 'deployed') { lastDeployedIdx = i; break; }
    }
    const cyclePhases = lastDeployedIdx >= 0
      ? closed.slice(lastDeployedIdx + 1, closed.length - 1)
      : closed.slice(0, closed.length - 1);
    if (cyclePhases.length > 0) return cyclePhases;
  }
  return null;
}

// ── Return records ───────────────────────────────────────────────────────────

export function getDroneReturns(droneId: string): DroneReturn[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(`drone-returns-${droneId}`) || '[]'); } catch { return []; }
}

export function saveDroneReturns(droneId: string, returns: DroneReturn[]): void {
  localStorage.setItem(`drone-returns-${droneId}`, JSON.stringify(returns));
}
