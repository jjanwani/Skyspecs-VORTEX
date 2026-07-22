import { ecns as baseECNs } from '@/lib/data/ecns';
import { EngineeringChangeNotice } from '@/lib/types';
import { getUserECNs, saveUserECNs, getHiddenEcnIds, saveHiddenEcnIds } from '@/lib/userDataStore';

/** All ECNs (seed + user-created) minus any that have been removed. */
export function getAllECNs(): EngineeringChangeNotice[] {
  const hidden = getHiddenEcnIds();
  return [...baseECNs, ...getUserECNs()].filter(e => !hidden.has(e.id));
}

export function addECN(ecn: EngineeringChangeNotice) {
  saveUserECNs([...getUserECNs(), ecn]);
}

/** Removes an ECN from every view of the app, regardless of whether it was seed or user-created. */
export function removeECN(id: string) {
  const hidden = getHiddenEcnIds();
  hidden.add(id);
  saveHiddenEcnIds(hidden);
}
