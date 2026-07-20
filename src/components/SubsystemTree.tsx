'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Plus, Package, Wrench } from 'lucide-react';
import { Subsystem, WorkOrder, EngineeringChangeNotice } from '@/lib/types';
import { buildSubsystemTree, getSubsystemTypeName, getSubsystemTypeIcon, SubsystemNode } from '@/lib/subsystemTree';
import { cn, getWorkOrderStatusColor, getWorkOrderStatusLabel } from '@/lib/utils';

interface Props {
  droneId: string;
  nodes: Subsystem[];
  workOrders: WorkOrder[];
  ecns: EngineeringChangeNotice[];
  canManage: boolean;
  onAddNode: (parentId: string | null) => void;
}

export default function SubsystemTree({ droneId, nodes, workOrders, ecns, canManage, onAddNode }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(nodes.map(n => n.id)));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tree = buildSubsystemTree(nodes);
  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  if (nodes.length === 0) {
    return (
      <div className="text-center py-10">
        <Package className="w-8 h-8 mx-auto mb-2 text-gray-700" />
        <p className="text-gray-500 text-sm mb-3">No subsystems recorded for this drone yet.</p>
        {canManage && (
          <button
            onClick={() => onAddNode(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add top-level subsystem
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {canManage && (
        <button
          onClick={() => onAddNode(null)}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mb-2"
        >
          <Plus className="w-3.5 h-3.5" /> Add top-level subsystem
        </button>
      )}
      {tree.map(node => (
        <TreeRow
          key={node.id}
          node={node}
          depth={0}
          droneId={droneId}
          expanded={expanded}
          toggle={toggle}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          workOrders={workOrders}
          ecns={ecns}
          canManage={canManage}
          onAddNode={onAddNode}
        />
      ))}
    </div>
  );
}

function TreeRow({
  node, depth, droneId, expanded, toggle, selectedId, setSelectedId, workOrders, ecns, canManage, onAddNode,
}: {
  node: SubsystemNode;
  depth: number;
  droneId: string;
  expanded: Set<string>;
  toggle: (id: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  workOrders: WorkOrder[];
  ecns: EngineeringChangeNotice[];
  canManage: boolean;
  onAddNode: (parentId: string | null) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const isPart = node.kind === 'part';
  const linkedWOs = workOrders.filter(w => w.subsystemId === node.id);
  const applicableECNs = ecns.filter(e => e.affectedSubsystemTypeIds.includes(node.typeId));

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer group',
          isSelected && 'bg-gray-800/70'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => setSelectedId(isSelected ? null : node.id)}
      >
        {hasChildren ? (
          <button onClick={e => { e.stopPropagation(); toggle(node.id); }} className="text-gray-500 hover:text-white flex-shrink-0">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span className="flex-shrink-0">{isPart ? <Wrench className="w-3.5 h-3.5 text-gray-500" /> : getSubsystemTypeIcon(node.typeId)}</span>
        <span className="text-sm text-white font-medium truncate">{getSubsystemTypeName(node.typeId)}</span>
        <span className="text-xs text-gray-500 font-mono truncate">{node.id}</span>
        {node.quantity !== undefined && (
          <span className="text-xs px-1.5 py-0.5 rounded border bg-gray-700 border-gray-600 text-gray-300 flex-shrink-0">×{node.quantity}</span>
        )}
        {linkedWOs.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-400 flex-shrink-0">{linkedWOs.length} WO</span>
        )}
        {applicableECNs.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded border bg-amber-500/10 border-amber-500/20 text-amber-400 flex-shrink-0">{applicableECNs.length} ECN</span>
        )}
        {canManage && (
          <button
            onClick={e => { e.stopPropagation(); onAddNode(node.id); }}
            className="ml-auto opacity-0 group-hover:opacity-100 text-gray-600 hover:text-blue-400 transition-all flex-shrink-0"
            title="Add child"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isSelected && (
        <div className="ml-8 mb-2 p-3 bg-gray-800/40 rounded-lg space-y-2" style={{ marginLeft: `${depth * 20 + 28}px` }}>
          {node.crossRef && <p className="text-xs text-gray-500">Cross ref: <span className="text-gray-300">{node.crossRef}</span></p>}
          {node.serialNumber && <p className="text-xs text-gray-500">Serial: <span className="text-gray-300">{node.serialNumber}</span></p>}
          {node.notes && <p className="text-xs text-gray-400 italic">{node.notes}</p>}
          {Object.keys(node.currentConfig).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(node.currentConfig).filter(([, v]) => v).map(([k, v]) => (
                <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-gray-700/60 border border-gray-600/40 text-gray-300">{k}: {v}</span>
              ))}
            </div>
          )}
          {applicableECNs.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Applicable ECNs</p>
              <div className="space-y-1">
                {applicableECNs.map(e => (
                  <Link key={e.id} href="/ecns" className="block text-xs text-amber-400 hover:text-amber-300">{e.id} — {e.title}</Link>
                ))}
              </div>
            </div>
          )}
          {linkedWOs.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Linked work orders</p>
              <div className="space-y-1">
                {linkedWOs.map(w => (
                  <Link key={w.id} href={`/drones/${droneId}/work-orders/${w.id}`} className="flex items-center gap-2 text-xs">
                    <span className="text-blue-400 hover:text-blue-300">{w.id} — {w.title}</span>
                    <span className={cn('px-1.5 py-0.5 rounded border', getWorkOrderStatusColor(w.status))}>{getWorkOrderStatusLabel(w.status)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {node.history.length > 0 && (
            <p className="text-xs text-gray-600">{node.history.length} change{node.history.length !== 1 ? 's' : ''} recorded</p>
          )}
        </div>
      )}

      {hasChildren && isExpanded && node.children.map(child => (
        <TreeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          droneId={droneId}
          expanded={expanded}
          toggle={toggle}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          workOrders={workOrders}
          ecns={ecns}
          canManage={canManage}
          onAddNode={onAddNode}
        />
      ))}
    </div>
  );
}
