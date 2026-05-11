'use client';

import { useState, useEffect, use } from 'react';
import Header from '@/components/layout/Header';
import { drones } from '@/lib/data/drones';
import { workOrders } from '@/lib/data/workorders';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getDroneStatusColor, getDroneStatusLabel,
  getWorkOrderStatusColor, getWorkOrderStatusLabel,
  getWorkOrderTypeColor, getWorkOrderTypeLabel,
  getPriorityColor, formatDate, cn
} from '@/lib/utils';
import {
  ArrowLeft, Clock, User, ExternalLink, CheckCircle2,
  History, Package, MessageSquare, FileText, ChevronRight, AlertCircle
} from 'lucide-react';
import { Drone, WorkOrder, WorkOrderStatus, WorkOrderPriority } from '@/lib/types';
import InlineEdit, { InlineToggle } from '@/components/InlineEdit';

const STATUS_FLOW: WorkOrderStatus[] = ['open', 'in_progress', 'on_hold', 'completed'];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const PART_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'on_order', label: 'On Order' },
  { value: 'missing', label: 'Missing' },
];

type PartStatus = 'available' | 'on_order' | 'missing';

export default function WorkOrderPage({ params }: { params: Promise<{ id: string; woId: string }> }) {
  const { id, woId } = use(params);
  const staticWo = workOrders.find(w => w.id === woId);
  const staticDrone = drones.find(d => d.id === id);

  const [baseWo, setBaseWo] = useState<WorkOrder | null>(staticWo ?? null);
  const [drone, setDrone] = useState<Drone | null>(staticDrone ?? null);
  const [edits, setEdits] = useState<Partial<WorkOrder>>({});
  const [partStatusEdits, setPartStatusEdits] = useState<Record<number, PartStatus>>({});
  const [ready, setReady] = useState(!!(staticWo && staticDrone));

  useEffect(() => {
    const saved = localStorage.getItem(`workorder-edits-${woId}`);
    if (saved) setEdits(JSON.parse(saved));
    const savedParts = localStorage.getItem(`workorder-parts-${woId}`);
    if (savedParts) setPartStatusEdits(JSON.parse(savedParts));
    if (!staticWo) {
      const userWOs: WorkOrder[] = JSON.parse(localStorage.getItem('user-workorders') || '[]');
      const found = userWOs.find(w => w.id === woId);
      if (found) setBaseWo(found);
    }
    if (!staticDrone) {
      const userDrones: Drone[] = JSON.parse(localStorage.getItem('user-drones') || '[]');
      const found = userDrones.find(d => d.id === id);
      if (found) setDrone(found);
    }
    setReady(true);
  }, [woId, id]);

  if (!ready) return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
  if (!baseWo || !drone) return notFound();

  const wo: WorkOrder = { ...baseWo, ...edits };

  const update = (field: keyof WorkOrder, value: unknown) => {
    setEdits(prev => {
      const next = { ...prev, [field]: value };
      localStorage.setItem(`workorder-edits-${woId}`, JSON.stringify(next));
      return next;
    });
  };

  const updatePartStatus = (index: number, status: PartStatus) => {
    setPartStatusEdits(prev => {
      const next = { ...prev, [index]: status };
      localStorage.setItem(`workorder-parts-${woId}`, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div>
      <Header title={wo.title} subtitle={`${wo.id} · ${drone.name}`} />
      <div className="p-6 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/drones" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Drones
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/drones/${drone.id}`} className="hover:text-white transition-colors">{drone.name}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-300">{wo.id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">

            {/* Title + Badges */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 font-mono">{wo.id}</span>
                <span className={cn('text-xs px-2 py-1 rounded-lg border font-medium', getWorkOrderTypeColor(wo.type))}>
                  {getWorkOrderTypeLabel(wo.type)}
                </span>
                <InlineEdit
                  value={wo.priority}
                  type="select"
                  options={PRIORITY_OPTIONS}
                  onSave={v => update('priority', v as WorkOrderPriority)}
                  displayClassName={cn('text-xs px-2 py-1 rounded-lg border font-medium', getPriorityColor(wo.priority))}
                />
                {wo.ernReference && (
                  <InlineEdit
                    value={wo.ernReference}
                    onSave={v => update('ernReference', v)}
                    displayClassName="text-xs px-2 py-1 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-400"
                  />
                )}
              </div>
              <h2 className="text-lg font-bold text-white mb-3">{wo.title}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{wo.description}</p>

              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs font-medium text-amber-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Notes
                </p>
                <InlineEdit
                  value={wo.notes ?? ''}
                  type="textarea"
                  onSave={v => update('notes', v)}
                  placeholder="Add notes..."
                  displayClassName={cn('text-xs leading-relaxed', wo.notes ? 'text-amber-300' : 'text-gray-600')}
                  emptyLabel="Click to add notes"
                />
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Update Status</h3>
              <div className="flex gap-2 flex-wrap">
                {STATUS_FLOW.map(s => (
                  <button
                    key={s}
                    onClick={() => update('status', s)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-xs font-medium border transition-all',
                      wo.status === s
                        ? getWorkOrderStatusColor(s).replace('/20', '/30').replace('/30', '/50')
                        : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                    )}
                  >
                    {getWorkOrderStatusLabel(s)}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-500">Current: </span>
                <span className={cn('text-xs px-2 py-0.5 rounded border', getWorkOrderStatusColor(wo.status))}>
                  {getWorkOrderStatusLabel(wo.status)}
                </span>
              </div>
            </div>

            {/* Parts Required */}
            {wo.parts && wo.parts.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  Parts Required
                </h3>
                <div className="space-y-2">
                  {wo.parts.map((part, i) => {
                    const partStatus = partStatusEdits[i] ?? part.status;
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                        <div>
                          <p className="text-xs font-medium text-white">{part.name}</p>
                          <p className="text-xs text-gray-500">Qty: {part.qty}</p>
                        </div>
                        <InlineEdit
                          value={partStatus}
                          type="select"
                          options={PART_STATUS_OPTIONS}
                          onSave={v => updatePartStatus(i, v as PartStatus)}
                          displayClassName={cn('text-xs px-2 py-0.5 rounded border',
                            partStatus === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              partStatus === 'on_order' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Previous Occurrences */}
            {wo.completionHistory && wo.completionHistory.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" />
                  Completion History
                  <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs px-2 py-0.5 rounded-full">
                    {wo.previousOccurrences}x performed
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mb-3">This work order type has been completed on other drones:</p>
                <div className="space-y-2">
                  {wo.completionHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <Link href={`/drones/${h.droneId}`} className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                          {h.droneName}
                        </Link>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <span>{h.tech}</span>
                        <span className="mx-1">·</span>
                        <span>{formatDate(h.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wo.previousOccurrences > 0 && (!wo.completionHistory || wo.completionHistory.length === 0) && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-xs text-purple-400">
                  This type of work order has been performed {wo.previousOccurrences} times previously across the fleet.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Details */}
          <div className="space-y-4">

            {/* Drone Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Drone</h3>
              <Link href={`/drones/${drone.id}`} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors group">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">FS</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors">{drone.name}</p>
                  <p className="text-xs text-gray-500">{drone.version}</p>
                </div>
                <span className={cn('text-xs px-1.5 py-0.5 rounded border', getDroneStatusColor(drone.status))}>
                  {getDroneStatusLabel(drone.status)}
                </span>
              </Link>
            </div>

            {/* Work Order Details */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Details</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> Assigned</span>
                  <InlineEdit
                    value={wo.assignedTech ?? ''}
                    onSave={v => update('assignedTech', v)}
                    displayClassName="text-white"
                    emptyLabel="Unassigned"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Hours</span>
                  <div className="flex items-center gap-1">
                    <InlineEdit
                      value={wo.estimatedHours}
                      type="number"
                      onSave={v => update('estimatedHours', Number(v))}
                      displayClassName="text-white"
                    />
                    <span className="text-gray-500">h</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Actual Hours</span>
                  <div className="flex items-center gap-1">
                    <InlineEdit
                      value={wo.actualHours ?? 0}
                      type="number"
                      onSave={v => update('actualHours', Number(v))}
                      displayClassName="text-white"
                      emptyLabel="—"
                    />
                    <span className="text-gray-500">h</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-white">{formatDate(wo.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span className="text-white">{formatDate(wo.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* External Links */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Resources</h3>
              <div className="space-y-2">
                {wo.googleDriveLink && (
                  <a
                    href={wo.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-xs text-white"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Drone Build Info (Drive)</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-gray-500" />
                  </a>
                )}
                {wo.slackThread && (
                  <a
                    href={wo.slackThread}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-xs text-white"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Slack Thread</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-gray-500" />
                  </a>
                )}
                <Link
                  href="/information-hub"
                  className="flex items-center gap-2 p-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-xs text-white"
                >
                  <FileText className="w-3.5 h-3.5 text-green-400" />
                  <span>Information Hub</span>
                  <ChevronRight className="w-3 h-3 ml-auto text-gray-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600">Hover any field to edit · Changes saved locally</p>
      </div>
    </div>
  );
}
