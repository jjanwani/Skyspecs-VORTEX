import { Subsystem, SubsystemType } from '@/lib/types';
import { SUBSYSTEM_TYPES } from '@/lib/data/subsystems';

export interface SubsystemNode extends Subsystem {
  children: SubsystemNode[];
}

export function getSubsystemType(typeId: string): SubsystemType | undefined {
  return SUBSYSTEM_TYPES.find(t => t.id === typeId);
}

export function getSubsystemTypeName(typeId: string): string {
  return getSubsystemType(typeId)?.name ?? typeId;
}

/** Builds a parent -> children tree from a flat list of Subsystem instances belonging to one drone. */
export function buildSubsystemTree(nodes: Subsystem[]): SubsystemNode[] {
  const byId = new Map<string, SubsystemNode>(nodes.map(n => [n.id, { ...n, children: [] }]));
  const roots: SubsystemNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** Returns the chain of nodes from the root down to (and including) the given node. */
export function getSubsystemPath(subsystemId: string, allNodes: Subsystem[]): Subsystem[] {
  const byId = new Map(allNodes.map(n => [n.id, n]));
  const path: Subsystem[] = [];
  let current = byId.get(subsystemId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    path.unshift(current);
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}
