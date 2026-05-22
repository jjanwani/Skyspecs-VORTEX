'use client';

import { useState } from 'react';
import { PhaseEntry, DroneReturn, DroneStatus } from '@/lib/types';
import { saveDroneReturns, getDroneReturns } from '@/lib/userDataStore';
import { X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Phase categorisation (mirrors DroneHealthPanel) ──────────────────────────

const WAIT_STATUSES = new Set<DroneStatus>([
  'delivered', 'ready_to_redress', 'ready_to_test',
  'ready_to_pack', 'ready_to_rca', 'rca_ready_to_redress',
]);
const SETUP_STATUSES = new Set<DroneStatus>(['kit_ingestion']);
const WORK_STATUSES = new Set<DroneStatus>(['drone_redress', 'eol_testing', 'packup_kits', 'engineering_rca']);

const STATUS_LABELS: Record<DroneStatus, string> = {
  deployed: 'Deployed',
  issue_in_field: 'Issue in Field',
  delivered: 'Delivered',
  kit_ingestion: 'Kit Ingestion',
  ready_to_redress: 'Ready to Redress',
  drone_redress: 'Drone Redress',
  ready_to_test: 'Ready to Test',
  eol_testing: 'EOL Testing',
  ready_to_pack: 'Ready to Pack',
  packup_kits: 'Packup Kits',
  operational: 'Operational',
  ready_to_rca: 'Ready to RCA',
  engineering_rca: 'Engineering RCA',
  rca_ready_to_redress: 'RCA → Redress',
};

function phaseDurationMs(e: PhaseEntry): number {
  const end = e.exitedAt ? new Date(e.exitedAt).getTime() : Date.now();
  return end - new Date(e.enteredAt).getTime();
}

function fmtMs(ms: number): string {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function msToMins(ms: number): number {
  return Math.round(ms / 60000);
}

function phaseCategory(status: DroneStatus): { label: string; color: string } {
  if (WAIT_STATUSES.has(status)) return { label: 'Lead Time', color: 'text-amber-400' };
  if (SETUP_STATUSES.has(status)) return { label: 'Setup Time', color: 'text-sky-400' };
  if (WORK_STATUSES.has(status)) return { label: 'Cycle Time', color: 'text-orange-400' };
  return { label: 'Transit', color: 'text-gray-500' };
}

function autoReason(phases: PhaseEntry[]): DroneReturn['reason'] {
  const statuses = new Set(phases.map(p => p.status));
  if (statuses.has('engineering_rca') || statuses.has('ready_to_rca') || statuses.has('rca_ready_to_redress')) return 'rca';
  if (statuses.has('issue_in_field')) return 'issue';
  return 'maintenance';
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface CycleLogModalProps {
  droneId: string;
  droneName: string;
  phases: PhaseEntry[];
  onLog: (entry: DroneReturn) => void;
  onDiscard: () => void;
}

export default function CycleLogModal({ droneId, droneName, phases, onLog, onDiscard }: CycleLogModalProps) {
  const leadMs  = phases.filter(e => WAIT_STATUSES.has(e.status)).reduce((s, e) => s + phaseDurationMs(e), 0);
  const setupMs = phases.filter(e => SETUP_STATUSES.has(e.status)).reduce((s, e) => s + phaseDurationMs(e), 0);
  const cycleMs = phases.filter(e => WORK_STATUSES.has(e.status)).reduce((s, e) => s + phaseDurationMs(e), 0);

  const [reason, setReason] = useState<DroneReturn['reason']>(autoReason(phases));
  const [notes,  setNotes]  = useState('');
  const [leadMins,  setLeadMins]  = useState(msToMins(leadMs));
  const [setupMins, setSetupMins] = useState(msToMins(setupMs));
  const [cycleMins, setCycleMins] = useState(msToMins(cycleMs));

  const handleLog = () => {
    const entry: DroneReturn = {
      id: `ret-${Date.now()}`,
      returnedAt: new Date().toISOString().slice(0, 10),
      reason,
      notes: notes.trim() || undefined,
      leadTimeMinutes:  leadMins,
      setupTimeMinutes: setupMins,
      cycleTimeMinutes: cycleMins,
    };
    saveDroneReturns(droneId, [...getDroneReturns(droneId), entry]);
    onLog(entry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h2 className="text-base font-bold text-white">Cycle Complete — {droneName}</h2>
            </div>
            <p className="text-sm text-gray-400">This drone returned to Deployed. Log the tracked times or discard.</p>
          </div>
          <button onClick={onDiscard} className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Phase breakdown */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Phase Breakdown</p>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="text-left px-3 py-2 font-medium text-gray-500">Phase</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500">Category</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((phase, i) => {
                    const dur = phaseDurationMs(phase);
                    const cat = phaseCategory(phase.status);
                    return (
                      <tr key={i} className="border-b border-gray-800/50 last:border-0">
                        <td className="px-3 py-2 text-gray-300">{STATUS_LABELS[phase.status] ?? phase.status}</td>
                        <td className="px-3 py-2">
                          <span className={cn('font-medium', cat.color)}>{cat.label}</span>
                        </td>
                        <td className="px-3 py-2 text-right text-white font-mono">{fmtMs(dur)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Time summary with editable overrides */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Time Summary</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'lead',  label: 'Lead Time',  auto: leadMs,  val: leadMins,  set: setLeadMins,  color: 'text-amber-400',  hint: 'shelf wait' },
                { key: 'setup', label: 'Setup Time', auto: setupMs, val: setupMins, set: setSetupMins, color: 'text-sky-400',   hint: 'parts & docs' },
                { key: 'cycle', label: 'Cycle Time', auto: cycleMs, val: cycleMins, set: setCycleMins, color: 'text-orange-400', hint: 'active work' },
              ] as const).map(({ key, label, auto, val, set, color, hint }) => (
                <div key={key} className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                  <p className={cn('text-base font-bold', color)}>{auto > 0 ? fmtMs(auto) : '—'}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xs text-gray-700 mb-2">{hint}</p>
                  <label className="text-xs text-gray-600 block mb-1">Minutes (editable)</label>
                  <input
                    type="number" min={0} step={1} value={val}
                    onChange={e => set(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Return metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Return Reason</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as DroneReturn['reason'])}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="maintenance">Maintenance</option>
                <option value="crash">Crash</option>
                <option value="issue">Issue</option>
                <option value="upgrade">Upgrade</option>
                <option value="rca">RCA</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <input
                type="text"
                placeholder="e.g. Motor failure, ESC issue..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleLog}
              className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              Log Return
            </button>
            <button
              onClick={onDiscard}
              className="flex-1 py-2.5 border border-gray-700 rounded-xl text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
