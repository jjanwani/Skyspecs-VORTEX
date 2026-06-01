'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSYSTEM_TYPES, SEED_GIMBALS } from '@/lib/data/subsystems';
import { Subsystem, SubsystemType, SubsystemField, ConfigChangeEvent, ConfigFieldChange } from '@/lib/types';
import { Search, ChevronDown, ChevronRight, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Value badge helpers ────────────────────────────────────────────────────

function valueBadgeClass(value: string, fieldType: SubsystemField['type']): string {
  if (fieldType === 'number') return '';
  if (!value || value === '—' || value === 'No change') return '';

  if (value === 'Replaced') return 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
  if (value === 'Redressed') return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
  if (value === 'New Hardware') return 'bg-green-500/15 text-green-300 border border-green-500/30';
  if (value === 'PM4310' || value === 'PM4315') return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
  if (value === '1v1 Board' || value === '1v2 Board') return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
  if (value === 'Black Encoder' || value === 'Green Encoder') return 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30';
  if (value === 'Prefab Harness') return 'bg-orange-500/15 text-orange-300 border border-orange-500/30';
  return 'bg-gray-700/50 text-gray-300 border border-gray-600';
}

function ValueCell({ value, field }: { value: string; field: SubsystemField }) {
  if (field.type === 'number') {
    return (
      <span className="text-gray-400 tabular-nums text-right block text-xs">
        {value || '—'}
      </span>
    );
  }
  if (!value || value === '—' || value === 'No change') {
    return <span className="text-gray-600 text-xs">{value || '—'}</span>;
  }
  const cls = valueBadgeClass(value, field.type);
  return (
    <span className={cn('inline-block px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap', cls)}>
      {value}
    </span>
  );
}

// ─── History timeline ────────────────────────────────────────────────────────

function HistoryPanel({ subsystem }: { subsystem: Subsystem }) {
  const sorted = [...subsystem.history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="px-6 py-4 text-sm text-gray-500 italic">No history recorded.</div>
    );
  }

  return (
    <div className="px-6 py-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Change History — {subsystem.id}
      </p>
      <div className="relative">
        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-gray-700" />
        <div className="space-y-5">
          {sorted.map((evt) => {
            const date = new Date(evt.timestamp);
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', hour12: true,
            });
            return (
              <div key={evt.id} className="flex gap-4">
                <div className="w-3.5 h-3.5 rounded-full bg-gray-700 border-2 border-gray-500 mt-0.5 flex-shrink-0 relative z-10" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    <span className="text-xs text-gray-400">{dateStr} at {timeStr}</span>
                    <span className="text-xs text-gray-500">by <span className="text-gray-300 font-medium">{evt.changedBy}</span></span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1.5">{evt.reason}</p>
                  <ul className="space-y-0.5 mb-1">
                    {evt.changes.map((ch, i) => (
                      <li key={i} className="text-xs text-gray-400">
                        <span className="text-gray-300">{ch.fieldLabel}:</span>{' '}
                        <span className="text-gray-500">{ch.oldValue}</span>
                        <span className="text-gray-600 mx-1">→</span>
                        <span className={cn(
                          'font-medium',
                          ch.newValue === 'New Hardware' ? 'text-green-400' :
                          ch.newValue === 'Replaced' ? 'text-blue-400' :
                          ch.newValue === 'Redressed' ? 'text-amber-400' :
                          (ch.newValue === 'PM4310' || ch.newValue === 'PM4315') ? 'text-purple-400' :
                          (ch.newValue === '1v1 Board' || ch.newValue === '1v2 Board') ? 'text-cyan-400' :
                          (ch.newValue === 'Black Encoder' || ch.newValue === 'Green Encoder') ? 'text-indigo-400' :
                          ch.newValue === 'Prefab Harness' ? 'text-orange-400' :
                          'text-white'
                        )}>
                          {ch.newValue}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {evt.notes && (
                    <p className="text-xs text-gray-500 italic mt-1">{evt.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Record Change Modal ─────────────────────────────────────────────────────

interface RecordChangeModalProps {
  subsystem: Subsystem;
  subsystemType: SubsystemType;
  currentUserName: string;
  onClose: () => void;
  onSave: (updated: Subsystem) => void;
}

function RecordChangeModal({ subsystem, subsystemType, currentUserName, onClose, onSave }: RecordChangeModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [checkedFields, setCheckedFields] = useState<Set<string>>(new Set());
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [changedBy, setChangedBy] = useState(currentUserName);
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');

  const toggleField = (fieldId: string) => {
    setCheckedFields(prev => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
        setNewValues(v => { const n = { ...v }; delete n[fieldId]; return n; });
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!reason.trim()) { setError('Reason is required.'); return; }
    if (checkedFields.size === 0) { setError('Select at least one changed field.'); return; }

    const changes: ConfigFieldChange[] = [];
    checkedFields.forEach(fieldId => {
      const field = subsystemType.fields.find(f => f.id === fieldId);
      if (!field) return;
      const oldValue = subsystem.currentConfig[fieldId] ?? '—';
      const newValue = newValues[fieldId] ?? oldValue;
      changes.push({ fieldId, fieldLabel: field.label, oldValue, newValue });
    });

    const newConfig = { ...subsystem.currentConfig };
    changes.forEach(ch => { newConfig[ch.fieldId] = ch.newValue; });

    const evt: ConfigChangeEvent = {
      id: `h-${subsystem.id}-${Date.now()}`,
      timestamp: new Date(date).toISOString(),
      changedBy: changedBy.trim() || 'Unknown',
      reason: reason.trim(),
      changes,
      notes: notes.trim() || undefined,
    };

    const updated: Subsystem = {
      ...subsystem,
      currentConfig: newConfig,
      history: [...subsystem.history, evt],
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-white">Record Configuration Change</h2>
            <p className="text-xs text-gray-400 mt-0.5">{subsystem.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Current config reference */}
          <div className="px-6 py-4 border-b border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Configuration</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {subsystemType.fields.map(field => (
                <div key={field.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">{field.label}</span>
                  <ValueCell value={subsystem.currentConfig[field.id] ?? '—'} field={field} />
                </div>
              ))}
            </div>
          </div>

          {/* What changed */}
          <div className="px-6 py-4 border-b border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What Changed?</p>
            <div className="space-y-2">
              {subsystemType.fields.map(field => {
                const checked = checkedFields.has(field.id);
                return (
                  <div key={field.id} className="flex items-center gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                      <div
                        onClick={() => toggleField(field.id)}
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                          checked ? 'bg-blue-600 border-blue-600' : 'border-gray-600 hover:border-gray-400'
                        )}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span
                        onClick={() => toggleField(field.id)}
                        className="text-xs text-gray-300 group-hover:text-white transition-colors w-28"
                      >
                        {field.label}
                      </span>
                    </label>
                    {checked && (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-gray-600">→</span>
                        {field.type === 'dropdown' ? (
                          <select
                            value={newValues[field.id] ?? subsystem.currentConfig[field.id] ?? ''}
                            onChange={e => setNewValues(v => ({ ...v, [field.id]: e.target.value }))}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            value={newValues[field.id] ?? subsystem.currentConfig[field.id] ?? ''}
                            onChange={e => setNewValues(v => ({ ...v, [field.id]: e.target.value }))}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                            placeholder="Enter value"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata */}
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Reason <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => { setReason(e.target.value); setError(''); }}
                placeholder="e.g. Motor failure — replaced M1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional context or observations"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Changed by</label>
                <input
                  type="text"
                  value={changedBy}
                  onChange={e => setChangedBy(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between gap-3">
          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Record Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const LS_KEY_PREFIX = 'vortex-subsystems-';

export default function SubsystemsPage() {
  const { user } = useAuth();
  const [activeTypeId, setActiveTypeId] = useState(SUBSYSTEM_TYPES[0].id);
  const [subsystemsMap, setSubsystemsMap] = useState<Record<string, Subsystem[]>>({});
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSubsystem, setEditingSubsystem] = useState<Subsystem | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const initial: Record<string, Subsystem[]> = {};
    for (const st of SUBSYSTEM_TYPES) {
      const key = `${LS_KEY_PREFIX}${st.id}`;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          initial[st.id] = JSON.parse(raw) as Subsystem[];
        } else {
          // seed
          if (st.id === 'gimbal') {
            initial[st.id] = SEED_GIMBALS;
            localStorage.setItem(key, JSON.stringify(SEED_GIMBALS));
          } else {
            initial[st.id] = [];
          }
        }
      } catch {
        initial[st.id] = st.id === 'gimbal' ? SEED_GIMBALS : [];
      }
    }
    setSubsystemsMap(initial);
    setLoaded(true);
  }, []);

  const activeType = SUBSYSTEM_TYPES.find(t => t.id === activeTypeId)!;
  const allForType = subsystemsMap[activeTypeId] ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return allForType;
    const q = search.toLowerCase();
    return allForType.filter(s =>
      s.id.toLowerCase().includes(q) ||
      (s.crossRef ?? '').toLowerCase().includes(q) ||
      (s.notes ?? '').toLowerCase().includes(q)
    );
  }, [allForType, search]);

  const saveType = (typeId: string, updated: Subsystem[]) => {
    setSubsystemsMap(prev => {
      const next = { ...prev, [typeId]: updated };
      try {
        localStorage.setItem(`${LS_KEY_PREFIX}${typeId}`, JSON.stringify(updated));
      } catch {}
      return next;
    });
  };

  const handleSaveChange = (updated: Subsystem) => {
    const newList = allForType.map(s => s.id === updated.id ? updated : s);
    saveType(activeTypeId, newList);
    setEditingSubsystem(null);
  };

  const handleRowClick = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (!loaded) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Subsystems" subtitle="Hardware configuration tracking with change history" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Subsystems" subtitle="Hardware configuration tracking with change history" />

      <div className="p-6 flex-1 min-w-0">
        {/* Type tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-800">
          {SUBSYSTEM_TYPES.map(st => {
            const count = (subsystemsMap[st.id] ?? []).length;
            const isActive = st.id === activeTypeId;
            return (
              <button
                key={st.id}
                onClick={() => { setActiveTypeId(st.id); setSearch(''); setExpandedId(null); }}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                )}
              >
                <span>{st.icon}</span>
                <span>{st.name}</span>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800 text-gray-500'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search serial, cross-ref, notes…"
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 flex-shrink-0">
            Showing <span className="text-white font-medium">{filtered.length}</span> of {allForType.length} {activeType.name.toLowerCase()}
          </p>
        </div>

        {/* Config table */}
        <div className="border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="sticky left-0 z-10 bg-gray-900 px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Serial
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Cross Ref
                  </th>
                  {activeType.fields.map(f => (
                    <th key={f.id} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Notes
                  </th>
                  <th className="sticky right-0 z-10 bg-gray-900 px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={activeType.fields.length + 4} className="px-4 py-10 text-center text-sm text-gray-500">
                      No {activeType.name.toLowerCase()} found.
                    </td>
                  </tr>
                )}
                {filtered.map(subsystem => {
                  const isCrashed = subsystem.notes === 'Crashed';
                  const isExpanded = expandedId === subsystem.id;

                  return (
                    <>
                      <tr
                        key={subsystem.id}
                        onClick={() => handleRowClick(subsystem.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isCrashed ? 'border-l-2 border-red-500/60' : '',
                          isExpanded ? 'bg-gray-800/60' : 'hover:bg-gray-800/40'
                        )}
                      >
                        {/* Serial — sticky */}
                        <td className={cn(
                          'sticky left-0 z-10 px-4 py-3 whitespace-nowrap',
                          isExpanded ? 'bg-gray-800/90' : 'bg-gray-900'
                        )}>
                          <div className="flex items-center gap-2">
                            {isExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              : <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                            }
                            <span className="font-medium text-white text-xs">{subsystem.id}</span>
                          </div>
                        </td>

                        {/* Cross Ref */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-xs text-gray-400">{subsystem.crossRef ?? '—'}</span>
                        </td>

                        {/* Field columns */}
                        {activeType.fields.map(field => (
                          <td key={field.id} className="px-3 py-3 whitespace-nowrap">
                            <ValueCell
                              value={subsystem.currentConfig[field.id] ?? '—'}
                              field={field}
                            />
                          </td>
                        ))}

                        {/* Notes */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          {subsystem.notes ? (
                            <span className={cn(
                              'text-xs',
                              isCrashed ? 'text-red-400 font-medium' : 'text-gray-400'
                            )}>
                              {subsystem.notes}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>

                        {/* Actions — sticky right */}
                        <td
                          className={cn(
                            'sticky right-0 z-10 px-4 py-3 text-right whitespace-nowrap',
                            isExpanded ? 'bg-gray-800/90' : 'bg-gray-900'
                          )}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setEditingSubsystem(subsystem)}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>

                      {/* Expanded history panel */}
                      {isExpanded && (
                        <tr key={`${subsystem.id}-history`}>
                          <td
                            colSpan={activeType.fields.length + 4}
                            className="bg-gray-800/30 border-b border-gray-800"
                          >
                            <HistoryPanel subsystem={subsystem} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Change Modal */}
      {editingSubsystem && (
        <RecordChangeModal
          subsystem={editingSubsystem}
          subsystemType={activeType}
          currentUserName={user?.name ?? ''}
          onClose={() => setEditingSubsystem(null)}
          onSave={handleSaveChange}
        />
      )}
    </div>
  );
}
