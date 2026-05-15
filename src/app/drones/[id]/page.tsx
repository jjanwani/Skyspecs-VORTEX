'use client';

import { use, useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { drones } from '@/lib/data/drones';
import { workOrders } from '@/lib/data/workorders';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getDroneStatusColor, getDroneStatusLabel,
  getWorkOrderStatusColor, getWorkOrderStatusLabel,
  getWorkOrderTypeColor, getWorkOrderTypeLabel,
  getPriorityColor, cn
} from '@/lib/utils';
import {
  Plane, ArrowLeft, Clock, MapPin,
  User, AlertTriangle, ClipboardList, ExternalLink
} from 'lucide-react';
import { Drone, DroneStatus } from '@/lib/types';
import InlineEdit, { InlineToggle } from '@/components/InlineEdit';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_OPTIONS = [
  { value: 'wip_redress', label: 'WIP / Redress' },
  { value: 'ready_for_deployment', label: 'Ready for Deployment' },
  { value: 'flight_status', label: 'Flight Status' },
  { value: 'returning_field', label: 'Returning from Field' },
  { value: 'field', label: 'In Field' },
  { value: 'in_maintenance', label: 'In Maintenance' },
  { value: 'rca', label: 'RCA' },
];

export default function DroneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const staticDrone = drones.find(d => d.id === id);

  const { can } = useAuth();
  const [baseDrone, setBaseDrone] = useState<Drone | null>(staticDrone ?? null);
  const [edits, setEdits] = useState<Partial<Drone>>({});
  const [userWOs, setUserWOs] = useState<typeof workOrders>([]);
  const [ready, setReady] = useState(!!staticDrone);

  useEffect(() => {
    const saved = localStorage.getItem(`drone-edits-${id}`);
    if (saved) setEdits(JSON.parse(saved));
    if (!staticDrone) {
      const storedDrones: Drone[] = JSON.parse(localStorage.getItem('user-drones') || '[]');
      const found = storedDrones.find(d => d.id === id);
      if (found) setBaseDrone(found);
    }
    const storedWOs = JSON.parse(localStorage.getItem('user-workorders') || '[]');
    setUserWOs(storedWOs);
    setReady(true);
  }, [id]);

  if (!ready) return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
  if (!baseDrone) return notFound();

  const drone: Drone = { ...baseDrone, ...edits };

  const update = (field: keyof Drone, value: unknown) => {
    setEdits(prev => {
      const next = { ...prev, [field]: value };
      localStorage.setItem(`drone-edits-${id}`, JSON.stringify(next));
      return next;
    });
  };

  const allWOs = [...workOrders, ...userWOs];
  const droneWOs = allWOs.filter(w => w.droneId === drone.id);
  const openWOs = droneWOs.filter(w => w.status !== 'completed');

  return (
    <div>
      <Header title={drone.name} subtitle={`${drone.version} · ${getDroneStatusLabel(drone.status)}`} />
      <div className="p-6 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/drones" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            All Drones
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-xs text-white font-medium">{drone.name}</span>
          <span className={cn('ml-auto text-xs px-2.5 py-1 rounded-lg border font-medium', getDroneStatusColor(drone.status))}>
            {getDroneStatusLabel(drone.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Drone Info Panel */}
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{drone.name}</h2>
                  <p className="text-xs text-gray-400">{drone.serialNumber}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <InlineEdit
                    value={drone.status}
                    type="select"
                    options={STATUS_OPTIONS}
                    onSave={v => update('status', v as DroneStatus)}
                    displayClassName={cn('text-xs px-2 py-0.5 rounded border font-medium', getDroneStatusColor(drone.status))}
                    disabled={!can('edit_drone_status')}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Build Version</span>
                  <InlineEdit
                    value={drone.buildVersion}
                    onSave={v => update('buildVersion', v)}
                    displayClassName="text-white font-medium text-xs"
                    disabled={!can('edit_drone_technical')}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>
                  <InlineEdit
                    value={drone.location}
                    onSave={v => update('location', v)}
                    displayClassName="text-white text-xs"
                    disabled={!can('edit_drone_technical')}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> Assigned Tech</span>
                  <InlineEdit
                    value={drone.assignedTech ?? ''}
                    onSave={v => update('assignedTech', v)}
                    displayClassName="text-white text-xs"
                    emptyLabel="Unassigned"
                    disabled={!can('edit_drone_technical')}
                  />
                </div>
                {drone.deploymentRegion !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Region</span>
                    <InlineEdit
                      value={drone.deploymentRegion ?? ''}
                      onSave={v => update('deploymentRegion', v)}
                      displayClassName="text-white text-xs"
                      disabled={!can('edit_drone_technical')}
                    />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Flight Hours</span>
                  <InlineEdit
                    value={drone.totalFlightHours}
                    type="number"
                    onSave={v => update('totalFlightHours', Number(v))}
                    displayClassName="text-white text-xs"
                    disabled={!can('edit_drone_technical')}
                  />
                </div>
                {drone.crashHistory > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Crashes</span>
                    <div className="flex items-center gap-2">
                      <InlineEdit
                        value={drone.crashHistory}
                        type="number"
                        onSave={v => update('crashHistory', Number(v))}
                        displayClassName="text-white text-xs"
                        disabled={!can('edit_drone_technical')}
                      />
                      <InlineToggle
                        value={drone.rcaCompleted}
                        onToggle={() => update('rcaCompleted', !drone.rcaCompleted)}
                        trueLabel="RCA done"
                        falseLabel="RCA pending"
                        falseClass="bg-red-500/10 text-red-400 border-red-500/20"
                        disabled={!can('edit_drone_compliance')}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">SF Asset ID</span>
                  <InlineEdit
                    value={drone.salesforceAssetId ?? ''}
                    onSave={v => update('salesforceAssetId', v)}
                    displayClassName="text-white text-xs"
                    emptyLabel="Not linked"
                    disabled={!can('edit_drone_technical')}
                  />
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Compliance Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">ECT-52 (7075)</span>
                  <InlineToggle value={drone.ectCompliance} onToggle={() => update('ectCompliance', !drone.ectCompliance)} trueLabel="Compliant" falseLabel="Not Compliant" disabled={!can('edit_drone_compliance')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">ECN-199 (NDAA)</span>
                  <InlineToggle value={drone.ecnCompliance} onToggle={() => update('ecnCompliance', !drone.ecnCompliance)} trueLabel="Compliant" falseLabel="Not Compliant" disabled={!can('edit_drone_compliance')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">FAA Registration</span>
                  <InlineToggle value={drone.faaRegistration} onToggle={() => update('faaRegistration', !drone.faaRegistration)} trueLabel="Registered" falseLabel="Not Registered" disabled={!can('edit_drone_compliance')} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Notes</h3>
              <InlineEdit
                value={drone.notes ?? ''}
                type="textarea"
                onSave={v => update('notes', v)}
                placeholder="Add notes..."
                displayClassName={cn('text-xs leading-relaxed', drone.notes ? 'text-amber-300' : 'text-gray-600')}
                emptyLabel="Click to add notes"
                disabled={!can('edit_drone_notes')}
              />
            </div>
          </div>

          {/* Work Orders Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-400" />
                Work Orders
                {openWOs.length > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full">
                    {openWOs.length} open
                  </span>
                )}
              </h2>
            </div>

            {droneWOs.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <p className="text-gray-500 text-sm">No work orders for this drone.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {droneWOs.map(wo => (
                  <Link
                    key={wo.id}
                    href={`/drones/${drone.id}/work-orders/${wo.id}`}
                    className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs text-gray-500 font-mono">{wo.id}</span>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded border', getWorkOrderTypeColor(wo.type))}>
                            {getWorkOrderTypeLabel(wo.type)}
                          </span>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded border', getPriorityColor(wo.priority))}>
                            {wo.priority}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{wo.title}</h3>
                      </div>
                      <span className={cn('text-xs px-2 py-1 rounded-lg border whitespace-nowrap', getWorkOrderStatusColor(wo.status))}>
                        {getWorkOrderStatusLabel(wo.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{wo.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {wo.assignedTech && <span className="flex items-center gap-1"><User className="w-3 h-3" />{wo.assignedTech}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{wo.estimatedHours}h est</span>
                      {wo.previousOccurrences > 0 && <span className="text-amber-400">Seen {wo.previousOccurrences}x before</span>}
                      {wo.ernReference && <span className="text-blue-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" />{wo.ernReference}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600">{can('edit_drone_status') ? 'Hover any field to edit · Changes saved locally' : 'View only · Contact admin to edit'}</p>
      </div>
    </div>
  );
}
