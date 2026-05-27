'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { drones as baseDrones } from '@/lib/data/drones';
import { workOrders } from '@/lib/data/workorders';
import { Drone, DroneStatus, PhaseEntry } from '@/lib/types';
import { getDroneStatusColor, getDroneStatusLabel, getSFSyncColor, getSFSyncDot, getSFSyncLabel, cn } from '@/lib/utils';
import Link from 'next/link';
import { Plane, Search, CheckCircle2, XCircle, Clock, MapPin, User, ClipboardList, Plus, LayoutGrid, Kanban } from 'lucide-react';
import AddDroneModal from '@/components/modals/AddDroneModal';
import CycleLogModal from '@/components/modals/CycleLogModal';
import { getUserDrones, saveUserDrones, recordPhaseTransition, getStatusTimestamps } from '@/lib/userDataStore';
import { useAuth } from '@/contexts/AuthContext';

// ── Board column definitions ────────────────────────────────────────────────

const MAIN_FLOW: BoardColDef[] = [
  { status: 'deployed',           label: 'Deployed',         accent: 'emerald' },
  { status: 'issue_in_field',     label: 'Issue in Field',   accent: 'amber'   },
  { status: 'delivered',          label: 'Delivered',        accent: 'blue'    },
  { status: 'kit_ingestion',      label: 'Kit Ingestion',    accent: 'sky'     },
  { status: 'ready_to_redress',   label: 'Ready to Redress', accent: 'violet'  },
  { status: 'drone_redress',      label: 'Drone Redress',    accent: 'orange'  },
  { status: 'ready_to_test',      label: 'Ready to Test',    accent: 'cyan'    },
  { status: 'eol_testing',        label: 'EOL Testing',      accent: 'blue'    },
  { status: 'ready_to_pack',      label: 'Ready to Pack',    accent: 'teal'    },
  { status: 'packup_kits',        label: 'Packup Kits',      accent: 'teal'    },
  { status: 'operational',        label: 'Operational',      accent: 'green'   },
];

const RCA_FLOW: BoardColDef[] = [
  { status: 'ready_to_rca',         label: 'Ready to RCA',    accent: 'red'   },
  { status: 'engineering_rca',      label: 'Engineering RCA', accent: 'red'   },
  { status: 'rca_ready_to_redress', label: 'RCA → Redress',   accent: 'amber' },
];

type Accent = 'emerald' | 'amber' | 'blue' | 'sky' | 'violet' | 'orange' | 'cyan' | 'teal' | 'green' | 'red';

interface BoardColDef {
  status: DroneStatus;
  label: string;
  accent: Accent;
}

const ACCENT_HEADER: Record<Accent, string> = {
  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  amber:   'bg-amber-500/10  border-amber-500/30  text-amber-400',
  blue:    'bg-blue-500/10   border-blue-500/30   text-blue-400',
  sky:     'bg-sky-500/10    border-sky-500/30    text-sky-400',
  violet:  'bg-violet-500/10 border-violet-500/30 text-violet-400',
  orange:  'bg-orange-500/10 border-orange-500/30 text-orange-400',
  cyan:    'bg-cyan-500/10   border-cyan-500/30   text-cyan-400',
  teal:    'bg-teal-500/10   border-teal-500/30   text-teal-400',
  green:   'bg-green-500/10  border-green-500/30  text-green-400',
  red:     'bg-red-500/10    border-red-500/30    text-red-400',
};

const ACCENT_DROP: Record<Accent, string> = {
  emerald: 'border-emerald-500/60 bg-emerald-500/5',
  amber:   'border-amber-500/60   bg-amber-500/5',
  blue:    'border-blue-500/60    bg-blue-500/5',
  sky:     'border-sky-500/60     bg-sky-500/5',
  violet:  'border-violet-500/60  bg-violet-500/5',
  orange:  'border-orange-500/60  bg-orange-500/5',
  cyan:    'border-cyan-500/60    bg-cyan-500/5',
  teal:    'border-teal-500/60    bg-teal-500/5',
  green:   'border-green-500/60   bg-green-500/5',
  red:     'border-red-500/60     bg-red-500/5',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function ComplianceDot({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
    : <XCircle className="w-3.5 h-3.5 text-gray-600" />;
}

const ALL_STATUSES: DroneStatus[] = [
  ...MAIN_FLOW.map(c => c.status),
  ...RCA_FLOW.map(c => c.status),
];

// ── Main page ────────────────────────────────────────────────────────────────

export default function DronesPage() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DroneStatus | 'all'>('all');
  const [userDrones, setUserDrones] = useState<Drone[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'board'>('grid');
  const [statusOverrides, setStatusOverrides] = useState<Record<string, DroneStatus>>({});
  const [dragOverCol, setDragOverCol] = useState<DroneStatus | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [timestamps, setTimestamps] = useState<Record<string, { status: string; enteredAt: string }>>({});
  const [pendingCycle, setPendingCycle] = useState<{ droneId: string; droneName: string; phases: PhaseEntry[] } | null>(null);

  useEffect(() => {
    setUserDrones(getUserDrones());
    setTimestamps(getStatusTimestamps());
    try {
      const saved = localStorage.getItem('drone-status-overrides');
      if (saved) setStatusOverrides(JSON.parse(saved));
    } catch {}
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const allDrones: Drone[] = [...baseDrones, ...userDrones].map(d => ({
    ...d,
    status: (statusOverrides[d.id] as DroneStatus) ?? d.status,
  }));

  const updateDroneStatus = (droneId: string, newStatus: DroneStatus) => {
    const next = { ...statusOverrides, [droneId]: newStatus };
    setStatusOverrides(next);
    localStorage.setItem('drone-status-overrides', JSON.stringify(next));

    const cyclePhases = recordPhaseTransition(droneId, newStatus);
    setTimestamps(getStatusTimestamps());

    if (cyclePhases && cyclePhases.length > 0) {
      const drone = allDrones.find(d => d.id === droneId);
      setPendingCycle({ droneId, droneName: drone?.name ?? droneId, phases: cyclePhases });
    }

    // If it's a user drone, persist the status in the user-drones store too
    const ud = userDrones.find(d => d.id === droneId);
    if (ud) {
      const updated = userDrones.map(d => d.id === droneId ? { ...d, status: newStatus } : d);
      setUserDrones(updated);
      saveUserDrones(updated);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: DroneStatus) => {
    e.preventDefault();
    const droneId = e.dataTransfer.getData('droneId');
    if (droneId) updateDroneStatus(droneId, targetStatus);
    setDragOverCol(null);
  };

  const getOpenWOs = (droneId: string) =>
    workOrders.filter(w => w.droneId === droneId && w.status !== 'completed').length;

  const userDroneIds = new Set(userDrones.map(d => d.id));

  const filtered = allDrones.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.assignedTech?.toLowerCase().includes(search.toLowerCase())) ||
      (d.deploymentRegion?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <Header title="Drones" subtitle="Fleet status and asset management" />
      <div className="p-6 space-y-5">

        {/* Top bar: search + status filter + view toggle + add */}
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search drones, tech, region..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {viewMode === 'grid' && (
            <div className="flex gap-2 flex-wrap flex-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  statusFilter === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                )}
              >All ({allDrones.length})</button>
              {ALL_STATUSES.map(s => {
                const count = allDrones.filter(d => d.status === s).length;
                if (!count) return null;
                return (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      statusFilter === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                    )}
                  >{getDroneStatusLabel(s)} ({count})</button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* View toggle */}
            <div className="flex border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid view"
                className={cn('px-3 py-2 text-xs flex items-center gap-1.5 transition-colors',
                  viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid
              </button>
              <button
                onClick={() => setViewMode('board')}
                title="Board view"
                className={cn('px-3 py-2 text-xs flex items-center gap-1.5 transition-colors border-l border-gray-700',
                  viewMode === 'board' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                <Kanban className="w-3.5 h-3.5" /> Board
              </button>
            </div>

            {can('add_drones') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add Drone
              </button>
            )}
          </div>
        </div>

        {/* ── Grid View ── */}
        {viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(drone => {
                const openWOs = getOpenWOs(drone.id);
                const isUserCreated = userDroneIds.has(drone.id);
                return (
                  <Link key={drone.id} href={`/drones/${drone.id}`}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/50 hover:bg-gray-900/80 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center">
                          <Plane className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{drone.name}</p>
                            {isUserCreated && <span className="text-xs px-1.5 py-0.5 rounded border bg-violet-500/10 border-violet-500/20 text-violet-400">Manual</span>}
                          </div>
                          <p className="text-xs text-gray-500">{drone.version}</p>
                        </div>
                      </div>
                      <span className={cn('text-xs px-2 py-1 rounded-lg border font-medium', getDroneStatusColor(drone.status))}>
                        {getDroneStatusLabel(drone.status)}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {drone.assignedTech && <div className="flex items-center gap-2 text-xs text-gray-400"><User className="w-3.5 h-3.5" /><span>{drone.assignedTech}</span></div>}
                      <div className="flex items-center gap-2 text-xs text-gray-400"><MapPin className="w-3.5 h-3.5" /><span>{drone.location}</span></div>
                      {drone.totalFlightHours > 0 && <div className="flex items-center gap-2 text-xs text-gray-400"><Clock className="w-3.5 h-3.5" /><span>{drone.totalFlightHours} flight hrs</span></div>}
                      {openWOs > 0 && <div className="flex items-center gap-2 text-xs text-amber-400"><ClipboardList className="w-3.5 h-3.5" /><span>{openWOs} open work order{openWOs > 1 ? 's' : ''}</span></div>}
                    </div>
                    {drone.notes && <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">{drone.notes}</p>}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500"><ComplianceDot ok={drone.ectCompliance} /><span>ECT</span></div>
                        <div className="flex items-center gap-1 text-xs text-gray-500"><ComplianceDot ok={drone.ecnCompliance} /><span>NDAA</span></div>
                        <div className="flex items-center gap-1 text-xs text-gray-500"><ComplianceDot ok={drone.faaRegistration} /><span>FAA</span></div>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border', getSFSyncColor(drone.sfSyncStatus))}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', getSFSyncDot(drone.sfSyncStatus))} />
                        {getSFSyncLabel(drone.sfSyncStatus)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No drones match your filters.</p>
              </div>
            )}
          </>
        )}

        {/* ── Board View ── */}
        {viewMode === 'board' && (
          <div className="-mx-6 px-6 overflow-x-auto" style={{ height: 'calc(100vh - 240px)' }}>
            <div className="flex gap-2 h-full pb-4" style={{ minWidth: 'max-content' }}>

              {/* Production flow columns */}
              <div className="flex flex-col justify-center pr-1 flex-shrink-0">
                <span className="text-xs text-gray-600 font-medium uppercase tracking-wider select-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Production</span>
              </div>
              {MAIN_FLOW.map(col => (
                <BoardColumn
                  key={col.status}
                  col={col}
                  drones={allDrones.filter(d => d.status === col.status)}
                  isOver={dragOverCol === col.status}
                  getOpenWOs={getOpenWOs}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(col.status); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={e => handleDrop(e, col.status)}
                  timestamps={timestamps}
                  now={now}
                />
              ))}

              {/* RCA track divider */}
              <div className="flex flex-col items-center mx-2 flex-shrink-0 self-stretch gap-1">
                <div className="flex-1 w-px bg-red-500/20" />
                <span className="text-xs text-red-400/50 font-medium uppercase tracking-wider select-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>RCA</span>
                <div className="flex-1 w-px bg-red-500/20" />
              </div>

              {/* RCA columns */}
              {RCA_FLOW.map(col => (
                <BoardColumn
                  key={col.status}
                  col={col}
                  drones={allDrones.filter(d => d.status === col.status)}
                  isOver={dragOverCol === col.status}
                  getOpenWOs={getOpenWOs}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(col.status); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={e => handleDrop(e, col.status)}
                  timestamps={timestamps}
                  now={now}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddDroneModal
          onAdd={newDrone => {
            setUserDrones(prev => [...prev, newDrone]);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {pendingCycle && (
        <CycleLogModal
          droneId={pendingCycle.droneId}
          droneName={pendingCycle.droneName}
          phases={pendingCycle.phases}
          onLog={() => setPendingCycle(null)}
          onDiscard={() => setPendingCycle(null)}
        />
      )}
    </div>
  );
}

// ── Board column ─────────────────────────────────────────────────────────────

interface BoardColumnProps {
  col: BoardColDef;
  drones: Drone[];
  isOver: boolean;
  getOpenWOs: (id: string) => number;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  timestamps: Record<string, { status: string; enteredAt: string }>;
  now: number;
}

function BoardColumn({ col, drones, isOver, getOpenWOs, onDragOver, onDragLeave, onDrop, timestamps, now }: BoardColumnProps) {
  return (
    <div className="flex flex-col w-44 flex-shrink-0 h-full">
      {/* Header */}
      <div className={cn('px-3 py-2 rounded-t-xl border border-b-0 flex items-center justify-between flex-shrink-0', ACCENT_HEADER[col.accent])}>
        <span className="text-xs font-semibold truncate">{col.label}</span>
        <span className="text-xs font-bold ml-1 flex-shrink-0 opacity-80">{drones.length}</span>
      </div>

      {/* Scrollable drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'flex-1 overflow-y-auto rounded-b-xl border border-t-0 p-2 space-y-2 transition-all',
          isOver
            ? cn('border-2', ACCENT_DROP[col.accent])
            : 'border-gray-800 bg-gray-900/60'
        )}
      >
        {drones.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-gray-700 text-center">Drop here</p>
          </div>
        )}
        {drones.map(drone => (
          <BoardCard
            key={drone.id}
            drone={drone}
            openWOs={getOpenWOs(drone.id)}
            enteredAt={timestamps[drone.id]?.enteredAt}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

// ── Board drone card ─────────────────────────────────────────────────────────

function fmtElapsed(ms: number): string {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function BoardCard({ drone, openWOs, enteredAt, now }: {
  drone: Drone;
  openWOs: number;
  enteredAt?: string;
  now: number;
}) {
  const elapsed = enteredAt ? now - new Date(enteredAt).getTime() : null;

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('droneId', drone.id)}
      className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-colors group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <Link
          href={`/drones/${drone.id}`}
          onClick={e => e.stopPropagation()}
          className="text-xs font-bold text-white hover:text-blue-400 transition-colors"
        >
          {drone.name}
        </Link>
        <span className="text-xs text-gray-600">{drone.version}</span>
      </div>

      {drone.assignedTech && (
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
          <User className="w-3 h-3" />{drone.assignedTech}
        </p>
      )}

      {elapsed !== null && (
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
          <Clock className="w-3 h-3" />
          <span className="tabular-nums">{fmtElapsed(elapsed)}</span>
        </p>
      )}

      {openWOs > 0 && (
        <p className="text-xs text-amber-400/80 flex items-center gap-1">
          <ClipboardList className="w-3 h-3" />{openWOs} WO{openWOs > 1 ? 's' : ''}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', drone.ectCompliance ? 'bg-green-400' : 'bg-gray-700')} title="ECT" />
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', drone.ecnCompliance ? 'bg-green-400' : 'bg-gray-700')} title="NDAA" />
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', drone.faaRegistration ? 'bg-green-400' : 'bg-gray-700')} title="FAA" />
        <span className="text-xs text-gray-600 ml-auto">{drone.totalFlightHours > 0 ? `${drone.totalFlightHours}h` : '—'}</span>
      </div>
    </div>
  );
}
