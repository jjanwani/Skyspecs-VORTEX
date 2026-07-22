'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { drones } from '@/lib/data/drones';
import { workOrders } from '@/lib/data/workorders';
import { SEED_GIMBALS, SEED_ASSET_SUBSYSTEMS } from '@/lib/data/subsystems';
import { getAllECNs } from '@/lib/ecnStore';
import { inventoryItems as baseInventoryItems } from '@/lib/data/inventory';
import Link from 'next/link';
import {
  getDroneStatusColor, getDroneStatusLabel,
  getWorkOrderStatusColor, getWorkOrderStatusLabel,
  getWorkOrderTypeColor, getWorkOrderTypeLabel,
  getPriorityColor, cn
} from '@/lib/utils';
import {
  Plane, ArrowLeft, Clock, MapPin,
  User, AlertTriangle, ClipboardList, ExternalLink,
  CheckCircle2, XCircle, HelpCircle, Package, Plus,
} from 'lucide-react';
import { Drone, DroneStatus, PhaseEntry, DroneReturn, WorkOrder, Subsystem, EngineeringChangeNotice } from '@/lib/types';
import InlineEdit, { InlineToggle } from '@/components/InlineEdit';
import { useAuth } from '@/contexts/AuthContext';
import {
  recordPhaseTransition, getDronePhaseHistory,
  getDroneReturns, saveDroneReturns,
  getUserSubsystems, getUserInventory,
} from '@/lib/userDataStore';
import CycleLogModal from '@/components/modals/CycleLogModal';
import SubsystemTree from '@/components/SubsystemTree';
import AddSubsystemModal from '@/components/modals/AddSubsystemModal';

const STATUS_OPTIONS = [
  { value: 'deployed', label: 'Deployed' },
  { value: 'issue_in_field', label: 'Issue in Field' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'kit_ingestion', label: 'Kit Ingestion' },
  { value: 'ready_to_redress', label: 'Ready to Redress' },
  { value: 'drone_redress', label: 'Drone Redress' },
  { value: 'ready_to_test', label: 'Ready to Test' },
  { value: 'eol_testing', label: 'EOL Testing' },
  { value: 'ready_to_pack', label: 'Ready to Pack' },
  { value: 'packup_kits', label: 'Packup Kits' },
  { value: 'operational', label: 'Operational' },
  { value: 'ready_to_rca', label: 'Ready to RCA' },
  { value: 'engineering_rca', label: 'Engineering RCA' },
  { value: 'rca_ready_to_redress', label: 'RCA → Redress' },
];

export default function DroneDetailClient({ id }: { id: string }) {
  const staticDrone = drones.find(d => d.id === id);
  const { can } = useAuth();
  const [baseDrone, setBaseDrone] = useState<Drone | null>(staticDrone ?? null);
  const [edits, setEdits] = useState<Partial<Drone>>({});
  const [userWOs, setUserWOs] = useState<typeof workOrders>([]);
  const [ready, setReady] = useState(!!staticDrone);
  const [notFound, setNotFound] = useState(false);
  const [pendingCycle, setPendingCycle] = useState<PhaseEntry[] | null>(null);
  const [healthRefresh, setHealthRefresh] = useState(0);
  const [userSubsystems, setUserSubsystems] = useState<Subsystem[]>([]);
  const [userInventory, setUserInventory] = useState<typeof baseInventoryItems>([]);
  const [addSubsystemParentId, setAddSubsystemParentId] = useState<string | null | undefined>(undefined);
  const [ecns, setEcns] = useState<EngineeringChangeNotice[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`drone-edits-${id}`);
    if (saved) setEdits(JSON.parse(saved));
    if (!staticDrone) {
      const storedDrones: Drone[] = JSON.parse(localStorage.getItem('user-drones') || '[]');
      const found = storedDrones.find(d => d.id === id);
      if (found) setBaseDrone(found);
      else setNotFound(true);
    }
    const storedWOs = JSON.parse(localStorage.getItem('user-workorders') || '[]');
    setUserWOs(storedWOs);
    setUserSubsystems(getUserSubsystems());
    setUserInventory(getUserInventory());
    setEcns(getAllECNs());
    setReady(true);
  }, [id]);

  if (!ready) return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
  if (notFound || !baseDrone) return (
    <div className="p-6 text-center py-20">
      <Plane className="w-10 h-10 text-gray-700 mx-auto mb-3" />
      <p className="text-white font-medium mb-1">Drone not found</p>
      <p className="text-gray-500 text-sm mb-4">No drone with ID "{id}" exists.</p>
      <Link href="/drones" className="text-blue-400 hover:text-blue-300 text-sm">← Back to Drones</Link>
    </div>
  );

  const drone: Drone = { ...baseDrone, ...edits };

  const update = (field: keyof Drone, value: unknown) => {
    setEdits(prev => {
      const next = { ...prev, [field]: value };
      localStorage.setItem(`drone-edits-${id}`, JSON.stringify(next));
      return next;
    });
    if (field === 'status') {
      const cyclePhases = recordPhaseTransition(id, value as DroneStatus);
      if (cyclePhases && cyclePhases.length > 0) setPendingCycle(cyclePhases);
    }
    if (field === 'assignedTech') {
      // Propagate to all work orders for this drone unless they've been manually changed
      const allWOs = [...workOrders, ...JSON.parse(localStorage.getItem('user-workorders') || '[]')];
      allWOs.filter((wo: { droneId: string }) => wo.droneId === id).forEach((wo: { id: string }) => {
        const key = `workorder-edits-${wo.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.setItem(key, JSON.stringify({ ...existing, assignedTech: value }));
      });
    }
  };

  const allWOs = [...workOrders, ...userWOs];
  const droneWOs = allWOs.filter(w => w.droneId === drone.id);
  const openWOs = droneWOs.filter(w => w.status !== 'completed');

  const allSubsystems = [...SEED_GIMBALS, ...SEED_ASSET_SUBSYSTEMS, ...userSubsystems];
  const droneSubsystems = allSubsystems.filter(s => s.droneId === drone.id);
  const allInventory = [...baseInventoryItems, ...userInventory];

  const addSubsystemNode = (node: Subsystem) => {
    setUserSubsystems(prev => [...prev, node]);
    setAddSubsystemParentId(undefined);
  };

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
                  <span className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>
                  <InlineEdit
                    value={drone.location}
                    onSave={v => update('location', v)}
                    displayClassName="text-white text-xs"
                    disabled={!can('edit_drone_technical')}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> Assigned</span>
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
                    target="_blank"
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
        {/* Bill of Materials / Subsystem tree */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              Bill of Materials
              {droneSubsystems.length > 0 && (
                <span className="text-xs text-gray-500 font-normal">{droneSubsystems.length} node{droneSubsystems.length !== 1 ? 's' : ''}</span>
              )}
            </h2>
            {can('edit_drone_technical') && droneSubsystems.length > 0 && (
              <button
                onClick={() => setAddSubsystemParentId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 hover:border-gray-500 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add subsystem
              </button>
            )}
          </div>
          <SubsystemTree
            droneId={drone.id}
            nodes={droneSubsystems}
            workOrders={droneWOs}
            ecns={ecns}
            canManage={can('edit_drone_technical')}
            onAddNode={parentId => setAddSubsystemParentId(parentId)}
          />
        </div>

        {/* Drone Health Panel */}
        <DroneHealthPanel
          droneId={id}
          currentStatus={drone.status}
          allWOs={allWOs}
          canManage={can('edit_drone_compliance')}
          refreshSignal={healthRefresh}
          flightTestStatus={drone.flightTestStatus}
          flightTestDate={drone.flightTestDate}
          onUpdateFlightTest={(status, date) => {
            update('flightTestStatus', status);
            if (date) update('flightTestDate', date);
          }}
        />

        {pendingCycle && (
          <CycleLogModal
            droneId={id}
            droneName={drone.name}
            phases={pendingCycle}
            onLog={() => { setHealthRefresh(r => r + 1); setPendingCycle(null); }}
            onDiscard={() => setPendingCycle(null)}
          />
        )}

        {addSubsystemParentId !== undefined && (
          <AddSubsystemModal
            droneId={drone.id}
            existingNodes={droneSubsystems}
            inventoryItems={allInventory}
            initialParentId={addSubsystemParentId}
            onAdd={addSubsystemNode}
            onClose={() => setAddSubsystemParentId(undefined)}
          />
        )}

        <p className="text-xs text-gray-600">{can('edit_drone_status') ? 'Hover any field to edit · Changes saved locally' : 'View only · Contact admin to edit'}</p>
      </div>
    </div>
  );
}

// ── Drone Health Panel ───────────────────────────────────────────────────────

const WAIT_STATUSES = new Set<DroneStatus>([
  'delivered', 'kit_ingestion', 'ready_to_redress', 'ready_to_test',
  'ready_to_pack', 'ready_to_rca', 'rca_ready_to_redress',
]);
const WORK_STATUSES = new Set<DroneStatus>(['drone_redress', 'eol_testing', 'engineering_rca']);
const SETUP_STATUSES = new Set<DroneStatus>(['kit_ingestion']);

function phaseDuration(entry: PhaseEntry): number {
  const end = entry.exitedAt ? new Date(entry.exitedAt).getTime() : Date.now();
  return end - new Date(entry.enteredAt).getTime();
}

function fmtDuration(ms: number): string {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtMinutes(mins: number): string {
  if (mins === 0) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}

const REASON_LABELS: Record<DroneReturn['reason'], string> = {
  crash: 'Crash', maintenance: 'Maintenance', upgrade: 'Upgrade',
  issue: 'Issue', rca: 'RCA', other: 'Other',
};

const RCA_MAINTENANCE_STATUSES = new Set<DroneStatus>([
  'ready_to_rca', 'engineering_rca', 'rca_ready_to_redress',
  'drone_redress', 'kit_ingestion', 'delivered',
]);

function DroneHealthPanel({
  droneId, currentStatus, allWOs, canManage, refreshSignal,
  flightTestStatus, flightTestDate, onUpdateFlightTest,
}: {
  droneId: string;
  currentStatus: DroneStatus;
  allWOs: WorkOrder[];
  canManage: boolean;
  refreshSignal?: number;
  flightTestStatus?: 'pass' | 'fail' | 'pending';
  flightTestDate?: string;
  onUpdateFlightTest: (status: 'pass' | 'fail' | 'pending', date?: string) => void;
}) {
  const [phaseHistory, setPhaseHistory] = useState<PhaseEntry[]>([]);
  const [returns, setReturns] = useState<DroneReturn[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    returnedAt: new Date().toISOString().slice(0, 10),
    reason: 'maintenance' as DroneReturn['reason'],
    leadTimeMinutes: 0, setupTimeMinutes: 0, cycleTimeMinutes: 0, notes: '',
  });
  const [, setTick] = useState(0); // force re-render for live clock

  useEffect(() => {
    setPhaseHistory(getDronePhaseHistory(droneId));
    setReturns(getDroneReturns(droneId));
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [droneId, refreshSignal]);

  // Current phase
  const currentEntry = [...phaseHistory].reverse().find(e => !e.exitedAt);
  const currentPhaseDuration = currentEntry ? phaseDuration(currentEntry) : null;

  // Metrics from phase history
  const completedPhases = phaseHistory.filter(e => e.exitedAt);
  const leadTimes = completedPhases.filter(e => WAIT_STATUSES.has(e.status)).map(phaseDuration);
  const setupTimes = completedPhases.filter(e => SETUP_STATUSES.has(e.status)).map(phaseDuration);
  const cycleTimes = completedPhases.filter(e => WORK_STATUSES.has(e.status)).map(phaseDuration);

  const avgLeadMs = avg(leadTimes);
  const avgSetupMs = avg(setupTimes);
  const avgCycleMs = avg(cycleTimes);

  // MTTR from return records (manually logged, in minutes)
  const mttrMinutes = returns.length > 0
    ? avg(returns.map(r => r.leadTimeMinutes + r.setupTimeMinutes + r.cycleTimeMinutes))
    : null;

  const hasMaintenanceActivity = returns.some(r => r.reason === 'rca' || r.reason === 'maintenance' || r.reason === 'crash' || r.reason === 'issue')
    || RCA_MAINTENANCE_STATUSES.has(currentStatus);

  const lastReturn = [...returns].sort((a, b) => new Date(b.returnedAt).getTime() - new Date(a.returnedAt).getTime())[0];
  const previousTickets = allWOs.filter(wo => wo.droneId === droneId && wo.status === 'completed');

  const saveReturn = () => {
    const entry: DroneReturn = {
      id: `ret-${Date.now()}`,
      returnedAt: form.returnedAt,
      reason: form.reason,
      notes: form.notes.trim() || undefined,
      leadTimeMinutes: form.leadTimeMinutes,
      setupTimeMinutes: form.setupTimeMinutes,
      cycleTimeMinutes: form.cycleTimeMinutes,
    };
    const next = [...returns, entry];
    setReturns(next);
    saveDroneReturns(droneId, next);
    setShowForm(false);
    setForm({ returnedAt: new Date().toISOString().slice(0, 10), reason: 'maintenance', leadTimeMinutes: 0, setupTimeMinutes: 0, cycleTimeMinutes: 0, notes: '' });
  };

  const statCls = 'bg-gray-800 border border-gray-700 rounded-xl p-4 text-center';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          Drone Health & Metrics
        </h3>
        {currentPhaseDuration !== null && (
          <div className="text-xs text-gray-400">
            In <span className={cn('px-1.5 py-0.5 rounded border', 'bg-gray-700 text-gray-300 border-gray-600')}>{currentStatus.replace(/_/g, ' ')}</span>{' '}
            for <span className="text-white font-medium">{fmtDuration(currentPhaseDuration)}</span>
          </div>
        )}
      </div>

      {/* Averages grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={statCls}>
          <p className="text-lg font-bold text-amber-400">{leadTimes.length ? fmtDuration(avgLeadMs) : '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Lead Time</p>
          <p className="text-xs text-gray-700 mt-0.5">avg shelf wait</p>
        </div>
        <div className={statCls}>
          <p className="text-lg font-bold text-sky-400">{setupTimes.length ? fmtDuration(avgSetupMs) : '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Setup Time</p>
          <p className="text-xs text-gray-700 mt-0.5">parts & docs</p>
        </div>
        <div className={statCls}>
          <p className="text-lg font-bold text-orange-400">{cycleTimes.length ? fmtDuration(avgCycleMs) : '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Cycle Time</p>
          <p className="text-xs text-gray-700 mt-0.5">active work</p>
        </div>
        <div className={statCls}>
          <p className="text-lg font-bold text-purple-400">
            {mttrMinutes !== null ? fmtMinutes(Math.round(mttrMinutes)) : (leadTimes.length + cycleTimes.length > 0 ? fmtDuration(avgLeadMs + avgSetupMs + avgCycleMs) : '—')}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">MTTR</p>
          <p className="text-xs text-gray-700 mt-0.5">mean time to redress</p>
        </div>
      </div>

      {/* Flight Test Status */}
      {(hasMaintenanceActivity || returns.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-800/60 border border-gray-700 rounded-xl">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {flightTestStatus === 'pass' && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />}
            {flightTestStatus === 'fail' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            {(flightTestStatus === 'pending' || !flightTestStatus) && <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
            <div>
              <p className="text-xs font-medium text-white">Post-Maintenance Flight Test</p>
              {flightTestDate && <p className="text-xs text-gray-500">{new Date(flightTestDate).toLocaleDateString()}</p>}
              {!flightTestDate && <p className="text-xs text-gray-600">Update from Slack test result</p>}
            </div>
            <span className={cn('ml-2 text-xs px-2 py-0.5 rounded border font-medium',
              flightTestStatus === 'pass' ? 'bg-green-500/15 text-green-400 border-green-500/25' :
              flightTestStatus === 'fail' ? 'bg-red-500/15 text-red-400 border-red-500/25' :
              'bg-amber-500/15 text-amber-400 border-amber-500/25'
            )}>
              {flightTestStatus === 'pass' ? 'Passed' : flightTestStatus === 'fail' ? 'Failed' : 'Pending'}
            </span>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {(['pass', 'fail', 'pending'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => onUpdateFlightTest(s, flightTestStatus !== s ? new Date().toISOString().slice(0, 10) : flightTestDate)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                    flightTestStatus === s
                      ? s === 'pass' ? 'bg-green-500/20 border-green-500/40 text-green-400'
                        : s === 'fail' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'border-gray-700 text-gray-500 hover:text-white hover:border-gray-500'
                  )}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MTTF + last return */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">MTTF:</span>
          <span className="text-gray-400 italic">— (pending Salesforce sync)</span>
        </div>
        {lastReturn && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Last return:</span>
            <span className="text-white">{REASON_LABELS[lastReturn.reason]}</span>
            {lastReturn.notes && <span className="text-gray-400">· {lastReturn.notes}</span>}
            <span className="text-gray-600">· {new Date(lastReturn.returnedAt).toLocaleDateString()}</span>
          </div>
        )}
        {previousTickets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Completed tickets:</span>
            <span className="text-white">{previousTickets.length}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-gray-800 pt-4">
        {canManage && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-xs bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors"
          >
            + Log Return
          </button>
        )}
        {returns.length > 0 && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="px-3 py-1.5 text-xs border border-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            {showAll ? 'Hide' : `View all ${returns.length} return${returns.length > 1 ? 's' : ''}`} ↕
          </button>
        )}
        {phaseHistory.length === 0 && (
          <p className="text-xs text-gray-600 italic self-center">Phase tracking starts when drone status is changed from this platform.</p>
        )}
      </div>

      {/* Log Return form */}
      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-white">Log Return Event</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Return Date</label>
              <input type="date" value={form.returnedAt} onChange={e => setForm(f => ({ ...f, returnedAt: e.target.value }))}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Reason</label>
              <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value as DroneReturn['reason'] }))}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-blue-500">
                <option value="maintenance">Maintenance</option>
                <option value="crash">Crash</option>
                <option value="issue">Issue</option>
                <option value="upgrade">Upgrade</option>
                <option value="rca">RCA</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([['leadTimeMinutes', 'Lead time (min)'], ['setupTimeMinutes', 'Setup time (min)'], ['cycleTimeMinutes', 'Cycle time (min)']] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input type="number" min={0} step={1} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <input type="text" placeholder="e.g. Motor failure, ESC issue..." value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveReturn} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium transition-colors">Save</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-gray-600 rounded text-xs text-gray-400 hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Returns history table */}
      {showAll && returns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="text-left py-2 pr-4 font-medium">Date</th>
                <th className="text-left py-2 pr-4 font-medium">Reason</th>
                <th className="text-right py-2 pr-4 font-medium">Lead (min)</th>
                <th className="text-right py-2 pr-4 font-medium">Setup (min)</th>
                <th className="text-right py-2 pr-4 font-medium">Cycle (min)</th>
                <th className="text-right py-2 pr-4 font-medium">Total</th>
                <th className="text-left py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[...returns]
                .sort((a, b) => new Date(b.returnedAt).getTime() - new Date(a.returnedAt).getTime())
                .map(r => (
                  <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 pr-4 text-gray-300">{new Date(r.returnedAt).toLocaleDateString()}</td>
                    <td className="py-2 pr-4"><span className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 border border-gray-600">{REASON_LABELS[r.reason]}</span></td>
                    <td className="py-2 pr-4 text-right text-amber-400">{fmtMinutes(r.leadTimeMinutes)}</td>
                    <td className="py-2 pr-4 text-right text-sky-400">{fmtMinutes(r.setupTimeMinutes)}</td>
                    <td className="py-2 pr-4 text-right text-orange-400">{fmtMinutes(r.cycleTimeMinutes)}</td>
                    <td className="py-2 pr-4 text-right text-purple-400 font-medium">{fmtMinutes(r.leadTimeMinutes + r.setupTimeMinutes + r.cycleTimeMinutes)}</td>
                    <td className="py-2 text-gray-500 truncate max-w-[120px]">{r.notes ?? '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
