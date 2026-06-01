'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import {
  Search, X, Plus, ChevronDown, ChevronRight, Settings, Check,
  Clock, Trash2, GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  SubsetDefinition, SubsetAsset, SubsetPart,
  SubsetHistoryEvent, SubsetCellChange,
} from '@/lib/types';
import {
  SEED_SUBSET_DEFS, SEED_SUBSET_ASSETS,
  SEED_SUBSET_CELLS, SEED_SUBSET_HISTORY,
  DEFAULT_STATUS_OPTIONS,
} from '@/lib/data/subsystems';

// ── localStorage keys ─────────────────────────────────────────────────────────

const LS = {
  subsets:       'vortex-v2-subsets',
  assets:        'vortex-v2-assets',
  statusOptions: 'vortex-v2-status-options',
  cells:         (id: string) => `vortex-v2-cells-${id}`,
  history:       (id: string) => `vortex-v2-history-${id}`,
  visible:       (id: string) => `vortex-v2-visible-${id}`,
};

function lsGet<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Status badge coloring ─────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  'No change':      'text-gray-500',
  'Redress':        'text-xs px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300',
  'Replaced':       'text-xs px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300',
  'New Hardware':   'text-xs px-1.5 py-0.5 rounded bg-green-500/15 border border-green-500/30 text-green-300',
  'PM4310':         'text-xs px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300',
  'PM4315':         'text-xs px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300',
  '1v1 Board':      'text-xs px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300',
  '1v2 Board':      'text-xs px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300',
  'Black Encoder':  'text-xs px-1.5 py-0.5 rounded bg-gray-600/40 border border-gray-500/30 text-gray-300',
  'Green Encoder':  'text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300',
  'Prefab Harness': 'text-xs px-1.5 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-300',
};

function statusClass(value: string) {
  return STATUS_COLORS[value] ?? 'text-xs px-1.5 py-0.5 rounded bg-gray-700/50 border border-gray-600/30 text-gray-300';
}

function CellBadge({ value, type }: { value: string; type: SubsetPart['type'] }) {
  if (!value || value === '—') return <span className="text-gray-600 text-xs">—</span>;
  if (type === 'text') return <span className="text-gray-300 text-xs tabular-nums">{value}</span>;
  if (value === 'No change') return <span className="text-gray-500 text-xs">No change</span>;
  return <span className={cn('text-xs font-medium whitespace-nowrap', statusClass(value))}>{value}</span>;
}

// ── Cell edit modal ───────────────────────────────────────────────────────────

function CellEditModal({
  assetId, part, currentValue, statusOptions, currentUser,
  onSave, onClose,
}: {
  assetId: string;
  part: SubsetPart;
  currentValue: string;
  statusOptions: string[];
  currentUser: string;
  onSave: (newValue: string, reason: string, changedBy: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentValue || '');
  const [reason, setReason] = useState('');
  const [changedBy, setChangedBy] = useState(currentUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-80 flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ background: '#0e1828', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div>
            <p className="text-xs font-semibold text-white">{part.label}</p>
            <p className="text-xs text-gray-500">{assetId}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Status</label>
            {part.type === 'status' ? (
              <select
                autoFocus
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">—</option>
                {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                autoFocus
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            )}
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Reason <span className="text-gray-600">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Full redress, Motor failure…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSave(value, reason, changedBy)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Changed by</label>
            <input
              type="text"
              value={changedBy}
              onChange={e => setChangedBy(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-1.5 text-xs border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(value, reason, changedBy)}
            className="flex-1 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assets checklist dropdown ─────────────────────────────────────────────────

function AssetsDropdown({
  assets, visible, onToggle, onToggleAll, onClose,
}: {
  assets: SubsetAsset[];
  visible: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');
  const allVisible = visible.size === 0 || visible.size === assets.length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = filter ? assets.filter(a => a.id.toLowerCase().includes(filter.toLowerCase()) || (a.crossRef ?? '').toLowerCase().includes(filter.toLowerCase())) : assets;
  const visibleCount = visible.size === 0 ? assets.length : visible.size;

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-64 z-30 rounded-xl border border-gray-700 shadow-2xl overflow-hidden" style={{ background: '#0e1828' }}>
      <div className="px-3 py-2 border-b border-gray-800">
        <input
          autoFocus
          type="text"
          placeholder="Filter assets…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none"
        />
      </div>
      <div className="px-3 py-1.5 border-b border-gray-800">
        <button
          onClick={onToggleAll}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white w-full transition-colors"
        >
          <div className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center', allVisible ? 'bg-blue-600 border-blue-600' : 'border-gray-600')}>
            {allVisible && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          {allVisible ? `All visible (${assets.length})` : `${visibleCount} of ${assets.length} visible`}
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {filtered.map(asset => {
          const isVisible = visible.size === 0 || visible.has(asset.id);
          return (
            <button
              key={asset.id}
              onClick={() => onToggle(asset.id)}
              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-800/60 transition-colors text-left"
            >
              <div className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0', isVisible ? 'bg-blue-600 border-blue-600' : 'border-gray-600')}>
                {isVisible && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="text-xs text-gray-300 font-medium">{asset.id}</span>
              {asset.crossRef && <span className="text-xs text-gray-600 truncate">{asset.crossRef}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Add subset modal ──────────────────────────────────────────────────────────

function AddSubsetModal({ onAdd, onClose }: { onAdd: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-72 rounded-xl shadow-2xl overflow-hidden" style={{ background: '#0e1828', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">New Subset</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Gimbal Redress, Motor Cycles…"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && onAdd(name.trim())}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-600">Parts can be added after creation.</p>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-1.5 text-xs border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button
            onClick={() => name.trim() && onAdd(name.trim())}
            disabled={!name.trim()}
            className={cn('flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors', name.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed')}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status options modal (admin) ──────────────────────────────────────────────

function StatusOptionsModal({
  options, onSave, onClose,
}: {
  options: string[];
  onSave: (options: string[]) => void;
  onClose: () => void;
}) {
  const defaults = new Set(['No change', 'Redress', 'Replaced']);
  const [list, setList] = useState([...options]);
  const [newOpt, setNewOpt] = useState('');

  const addOption = () => {
    const trimmed = newOpt.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList(l => [...l, trimmed]);
      setNewOpt('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 rounded-xl shadow-2xl overflow-hidden" style={{ background: '#0e1828', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">Status Options</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-3 max-h-80 overflow-y-auto space-y-1">
          {list.map(opt => (
            <div key={opt} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-800/40 group">
              <span className="text-xs text-gray-300">{opt}</span>
              {defaults.has(opt) ? (
                <span className="text-xs text-gray-600">default</span>
              ) : (
                <button
                  onClick={() => setList(l => l.filter(o => o !== opt))}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-800 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add option…"
              value={newOpt}
              onChange={e => setNewOpt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addOption()}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={addOption}
              disabled={!newOpt.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs disabled:opacity-40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => onSave(list)}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Save Options
          </button>
        </div>
      </div>
    </div>
  );
}

// ── History panel ─────────────────────────────────────────────────────────────

function HistoryPanel({ events }: { events: SubsetHistoryEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (sorted.length === 0) return <p className="text-xs text-gray-600 py-4 text-center">No changes recorded yet.</p>;
  return (
    <div className="relative pl-5 space-y-3 py-3">
      <div className="absolute left-2 top-4 bottom-4 w-px bg-gray-700" />
      {sorted.map(evt => (
        <div key={evt.id} className="relative">
          <div className="absolute -left-[13px] top-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-gray-900" />
          <div className="bg-gray-800/40 rounded-lg px-3 py-2">
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-xs font-medium text-white">{evt.reason ?? 'Change recorded'}</p>
              <span className="text-xs text-gray-600 flex-shrink-0">{evt.subsetName}</span>
            </div>
            <p className="text-xs text-gray-500 mb-1.5">
              {new Date(evt.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {evt.changedBy}
            </p>
            <div className="space-y-0.5">
              {evt.changes.map((ch, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-500 w-20 flex-shrink-0 truncate">{ch.partLabel}</span>
                  <span className="text-gray-600">{ch.oldValue || '—'}</span>
                  <ChevronRight className="w-3 h-3 text-gray-700 flex-shrink-0" />
                  <span className="font-medium text-gray-300">{ch.newValue}</span>
                </div>
              ))}
            </div>
            {evt.notes && <p className="text-xs text-gray-600 mt-1 italic">{evt.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SubsystemsPage() {
  const { user, can } = useAuth();
  const isAdmin = can('manage_users'); // admins can manage users → use as admin check

  // Core data
  const [subsets, setSubsets] = useState<SubsetDefinition[]>([]);
  const [assets, setAssets] = useState<SubsetAsset[]>([]);
  // cells[subsetId][assetId][partId] = value
  const [cells, setCells] = useState<Record<string, Record<string, Record<string, string>>>>({});
  // history[assetId] = events[]
  const [assetHistory, setAssetHistory] = useState<Record<string, SubsetHistoryEvent[]>>({});
  // visible[subsetId] = Set of visible asset IDs (empty Set = all visible)
  const [visible, setVisible] = useState<Record<string, Set<string>>>({});
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // UI state
  const [activeSubsetId, setActiveSubsetId] = useState('');
  const [search, setSearch] = useState('');
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [showAssetsDropdown, setShowAssetsDropdown] = useState(false);
  const [editingCell, setEditingCell] = useState<{ assetId: string; partId: string } | null>(null);
  const [showAddSubset, setShowAddSubset] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [addingPart, setAddingPart] = useState(false);
  const [newPartLabel, setNewPartLabel] = useState('');

  // Load everything on mount
  useEffect(() => {
    const storedSubsets = lsGet<SubsetDefinition[] | null>(LS.subsets, null);
    const loadedSubsets = storedSubsets ?? SEED_SUBSET_DEFS;
    if (!storedSubsets) lsSet(LS.subsets, SEED_SUBSET_DEFS);

    const storedAssets = lsGet<SubsetAsset[] | null>(LS.assets, null);
    const loadedAssets = storedAssets ?? SEED_SUBSET_ASSETS;
    if (!storedAssets) lsSet(LS.assets, SEED_SUBSET_ASSETS);

    const loadedStatusOptions = lsGet<string[] | null>(LS.statusOptions, null) ?? DEFAULT_STATUS_OPTIONS;
    if (!lsGet<null>(LS.statusOptions, null)) lsSet(LS.statusOptions, DEFAULT_STATUS_OPTIONS);

    // Load cells per subset
    const loadedCells: Record<string, Record<string, Record<string, string>>> = {};
    for (const subset of loadedSubsets) {
      const stored = lsGet<Record<string, Record<string, string>> | null>(LS.cells(subset.id), null);
      loadedCells[subset.id] = stored ?? SEED_SUBSET_CELLS[subset.id] ?? {};
      if (!stored && SEED_SUBSET_CELLS[subset.id]) lsSet(LS.cells(subset.id), SEED_SUBSET_CELLS[subset.id]);
    }

    // Load history per asset
    const loadedHistory: Record<string, SubsetHistoryEvent[]> = {};
    for (const asset of loadedAssets) {
      const stored = lsGet<SubsetHistoryEvent[] | null>(LS.history(asset.id), null);
      loadedHistory[asset.id] = stored ?? SEED_SUBSET_HISTORY[asset.id] ?? [];
      if (!stored && SEED_SUBSET_HISTORY[asset.id]) lsSet(LS.history(asset.id), SEED_SUBSET_HISTORY[asset.id]);
    }

    // Load visible per subset (empty = all visible)
    const loadedVisible: Record<string, Set<string>> = {};
    for (const subset of loadedSubsets) {
      const arr = lsGet<string[]>(LS.visible(subset.id), []);
      loadedVisible[subset.id] = new Set(arr);
    }

    setSubsets(loadedSubsets);
    setAssets(loadedAssets);
    setCells(loadedCells);
    setAssetHistory(loadedHistory);
    setVisible(loadedVisible);
    setStatusOptions(loadedStatusOptions);
    setActiveSubsetId(loadedSubsets[0]?.id ?? '');
    setLoaded(true);
  }, []);

  const activeSubset = subsets.find(s => s.id === activeSubsetId);
  const currentVisible = visible[activeSubsetId] ?? new Set<string>();

  const displayedAssets = useMemo(() => {
    let result = assets;
    if (currentVisible.size > 0) result = result.filter(a => currentVisible.has(a.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.id.toLowerCase().includes(q) ||
        (a.crossRef ?? '').toLowerCase().includes(q) ||
        (a.notes ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [assets, currentVisible, search]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveCell = useCallback((assetId: string, partId: string, newValue: string, reason: string, changedBy: string) => {
    if (!activeSubset) return;
    const oldValue = cells[activeSubsetId]?.[assetId]?.[partId] ?? '';
    if (oldValue === newValue) { setEditingCell(null); return; }

    const part = activeSubset.parts.find(p => p.id === partId);
    if (!part) return;

    // Update cells
    setCells(prev => {
      const next = {
        ...prev,
        [activeSubsetId]: {
          ...(prev[activeSubsetId] ?? {}),
          [assetId]: {
            ...(prev[activeSubsetId]?.[assetId] ?? {}),
            [partId]: newValue,
          },
        },
      };
      lsSet(LS.cells(activeSubsetId), next[activeSubsetId]);
      return next;
    });

    // Record history
    const change: SubsetCellChange = { partId, partLabel: part.label, oldValue: oldValue || '—', newValue };
    const event: SubsetHistoryEvent = {
      id: `chg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      changedBy: changedBy || 'Unknown',
      reason: reason.trim() || undefined,
      subsetId: activeSubsetId,
      subsetName: activeSubset.name,
      changes: [change],
    };
    setAssetHistory(prev => {
      const next = { ...prev, [assetId]: [...(prev[assetId] ?? []), event] };
      lsSet(LS.history(assetId), next[assetId]);
      return next;
    });

    setEditingCell(null);
  }, [activeSubset, activeSubsetId, cells]);

  const addSubset = useCallback((name: string) => {
    const id = `subset-${Date.now()}`;
    const def: SubsetDefinition = { id, name, parts: [], createdAt: new Date().toISOString() };
    setSubsets(prev => { const next = [...prev, def]; lsSet(LS.subsets, next); return next; });
    setVisible(prev => ({ ...prev, [id]: new Set() }));
    setActiveSubsetId(id);
    setShowAddSubset(false);
  }, []);

  const removeSubset = useCallback((id: string) => {
    setSubsets(prev => { const next = prev.filter(s => s.id !== id); lsSet(LS.subsets, next); return next; });
    if (activeSubsetId === id) setActiveSubsetId(s => subsets.find(x => x.id !== id)?.id ?? '');
  }, [activeSubsetId, subsets]);

  const addPart = useCallback(() => {
    const label = newPartLabel.trim();
    if (!label || !activeSubset) return;
    const part: SubsetPart = { id: `part-${Date.now()}`, label, type: 'status' };
    setSubsets(prev => {
      const next = prev.map(s => s.id === activeSubsetId ? { ...s, parts: [...s.parts, part] } : s);
      lsSet(LS.subsets, next);
      return next;
    });
    setNewPartLabel('');
    setAddingPart(false);
  }, [newPartLabel, activeSubset, activeSubsetId]);

  const removePart = useCallback((partId: string) => {
    setSubsets(prev => {
      const next = prev.map(s => s.id === activeSubsetId ? { ...s, parts: s.parts.filter(p => p.id !== partId) } : s);
      lsSet(LS.subsets, next);
      return next;
    });
  }, [activeSubsetId]);

  const toggleAssetVisible = useCallback((assetId: string) => {
    setVisible(prev => {
      const current = new Set(prev[activeSubsetId] ?? []);
      // If currently "all visible" (empty set), initialize to all minus this one
      if (current.size === 0) {
        const allExcept = new Set(assets.map(a => a.id).filter(id => id !== assetId));
        lsSet(LS.visible(activeSubsetId), [...allExcept]);
        return { ...prev, [activeSubsetId]: allExcept };
      }
      if (current.has(assetId)) current.delete(assetId);
      else current.add(assetId);
      // If all are selected, reset to empty (= all)
      if (current.size === assets.length) {
        lsSet(LS.visible(activeSubsetId), []);
        return { ...prev, [activeSubsetId]: new Set() };
      }
      lsSet(LS.visible(activeSubsetId), [...current]);
      return { ...prev, [activeSubsetId]: current };
    });
  }, [activeSubsetId, assets]);

  const toggleAllVisible = useCallback(() => {
    setVisible(prev => {
      const current = prev[activeSubsetId] ?? new Set<string>();
      const next = current.size === 0 ? new Set(assets.map(a => a.id)) : new Set<string>();
      lsSet(LS.visible(activeSubsetId), [...next]);
      return { ...prev, [activeSubsetId]: next };
    });
  }, [activeSubsetId, assets]);

  const saveStatusOptions = useCallback((opts: string[]) => {
    setStatusOptions(opts);
    lsSet(LS.statusOptions, opts);
    setShowStatusOptions(false);
  }, []);

  if (!loaded) {
    return (
      <div>
        <Header title="Subsystems" subtitle="Hardware configuration tracking with change history" />
        <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  const editingPart = editingCell ? activeSubset?.parts.find(p => p.id === editingCell.partId) : null;
  const visibleCount = currentVisible.size === 0 ? assets.length : currentVisible.size;

  return (
    <div>
      <Header title="Subsystems" subtitle="Hardware configuration tracking with change history" />
      <div className="flex flex-col min-h-0">

        {/* ── Subset tabs ── */}
        <div className="flex items-center gap-0 border-b border-gray-800 px-6 pt-4 overflow-x-auto">
          {subsets.map(subset => (
            <div
              key={subset.id}
              className={cn('flex items-center gap-1.5 group flex-shrink-0',
                activeSubsetId === subset.id
                  ? 'border-b-2 border-blue-500 -mb-px'
                  : 'border-b-2 border-transparent'
              )}
            >
              <button
                onClick={() => { setActiveSubsetId(subset.id); setSearch(''); setExpandedAssetId(null); }}
                className={cn('px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                  activeSubsetId === subset.id ? 'text-blue-400' : 'text-gray-400 hover:text-white'
                )}
              >
                {subset.name}
              </button>
              <button
                onClick={() => removeSubset(subset.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-600 hover:text-red-400 transition-all mr-2"
                title="Remove subset"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowAddSubset(true)}
            className="flex items-center gap-1 px-3 py-2.5 text-xs text-gray-500 hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add subset
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowStatusOptions(true)}
              className="ml-auto flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-white transition-colors flex-shrink-0"
              title="Manage status options"
            >
              <Settings className="w-3.5 h-3.5" /> Status options
            </button>
          )}
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-800 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search assets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          {/* Assets checklist */}
          <div className="relative">
            <button
              onClick={() => setShowAssetsDropdown(v => !v)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                showAssetsDropdown ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' : 'border-gray-700 text-gray-400 hover:text-white'
              )}
            >
              Assets <span className="text-gray-500">({visibleCount}/{assets.length})</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showAssetsDropdown && (
              <AssetsDropdown
                assets={assets}
                visible={currentVisible}
                onToggle={toggleAssetVisible}
                onToggleAll={toggleAllVisible}
                onClose={() => setShowAssetsDropdown(false)}
              />
            )}
          </div>

          {/* Add part */}
          {activeSubset && (
            addingPart ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Part name…"
                  value={newPartLabel}
                  onChange={e => setNewPartLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addPart(); if (e.key === 'Escape') { setAddingPart(false); setNewPartLabel(''); } }}
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-36"
                />
                <button onClick={addPart} className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs transition-colors">Add</button>
                <button onClick={() => { setAddingPart(false); setNewPartLabel(''); }} className="text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button
                onClick={() => setAddingPart(true)}
                className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-700 hover:border-gray-500 rounded-lg text-xs text-gray-500 hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> Add part
              </button>
            )
          )}

          <p className="ml-auto text-xs text-gray-600">{displayedAssets.length} assets · {activeSubset?.parts.length ?? 0} parts</p>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto flex-1">
          <table className="min-w-max w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/60">
                <th className="sticky left-0 z-10 bg-gray-900 px-4 py-3 text-left font-semibold text-gray-400 whitespace-nowrap">Asset</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-400 whitespace-nowrap">Cross Ref</th>
                {activeSubset?.parts.map(part => (
                  <th key={part.id} className="px-3 py-3 text-left font-semibold text-gray-400 whitespace-nowrap group/th">
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-3 h-3 text-gray-700 opacity-0 group-hover/th:opacity-100" />
                      {part.label}
                      {isAdmin && (
                        <button
                          onClick={() => removePart(part.id)}
                          className="opacity-0 group-hover/th:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-0.5"
                          title="Remove column"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-left font-semibold text-gray-400 whitespace-nowrap">Notes</th>
                <th className="sticky right-0 z-10 bg-gray-900 px-3 py-3 text-left font-semibold text-gray-400 whitespace-nowrap">History</th>
              </tr>
            </thead>
            <tbody>
              {displayedAssets.length === 0 ? (
                <tr>
                  <td colSpan={(activeSubset?.parts.length ?? 0) + 4} className="text-center py-16 text-gray-500">
                    {assets.length === 0 ? 'No assets yet.' : 'No assets match your filter.'}
                  </td>
                </tr>
              ) : displayedAssets.flatMap(asset => {
                const isExpanded = expandedAssetId === asset.id;
                const history = assetHistory[asset.id] ?? [];
                const assetCells = cells[activeSubsetId]?.[asset.id] ?? {};

                return [
                  <tr
                    key={asset.id}
                    className={cn('border-b border-gray-800/60 transition-colors',
                      isExpanded ? 'bg-gray-800/20' : 'hover:bg-gray-800/10'
                    )}
                  >
                    {/* Serial — sticky */}
                    <td className={cn('sticky left-0 z-10 px-4 py-2.5 whitespace-nowrap', isExpanded ? 'bg-gray-800/80' : 'bg-gray-900')}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">{asset.id}</span>
                        {asset.notes?.toLowerCase().includes('crash') && (
                          <span className="text-xs px-1 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25">!</span>
                        )}
                      </div>
                    </td>

                    {/* Cross Ref */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-500">{asset.crossRef ?? '—'}</td>

                    {/* Cell columns */}
                    {activeSubset?.parts.map(part => (
                      <td key={part.id} className="px-3 py-2.5 whitespace-nowrap">
                        <button
                          onClick={() => setEditingCell({ assetId: asset.id, partId: part.id })}
                          className="hover:bg-gray-700/40 rounded px-1 py-0.5 transition-colors cursor-pointer"
                          title="Click to edit"
                        >
                          <CellBadge value={assetCells[part.id] ?? ''} type={part.type} />
                        </button>
                      </td>
                    ))}

                    {/* Notes */}
                    <td className="px-3 py-2.5 max-w-[160px]">
                      <span className={cn('text-xs', asset.notes?.toLowerCase().includes('crash') ? 'text-red-400' : 'text-gray-500')}>
                        {asset.notes ?? '—'}
                      </span>
                    </td>

                    {/* History toggle — sticky right */}
                    <td className={cn('sticky right-0 z-10 px-3 py-2.5 whitespace-nowrap', isExpanded ? 'bg-gray-800/80' : 'bg-gray-900')}>
                      <button
                        onClick={() => setExpandedAssetId(isExpanded ? null : asset.id)}
                        className={cn('flex items-center gap-1 px-2 py-1 rounded border text-xs transition-colors',
                          isExpanded
                            ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                            : 'border-gray-700 text-gray-500 hover:text-white hover:border-gray-600'
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        {history.length > 0 && <span>{history.length}</span>}
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>,

                  isExpanded && (
                    <tr key={`${asset.id}-hist`} className="border-b border-gray-800">
                      <td colSpan={(activeSubset?.parts.length ?? 0) + 4} className="bg-gray-800/10 px-8 py-1">
                        <p className="text-xs font-semibold text-gray-500 pt-2 mb-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Change History · {asset.id}
                          {asset.crossRef && <span className="text-gray-700">· {asset.crossRef}</span>}
                        </p>
                        <div className="max-w-xl">
                          <HistoryPanel events={history} />
                        </div>
                      </td>
                    </tr>
                  ),
                ].filter(Boolean);
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      {editingCell && editingPart && (
        <CellEditModal
          assetId={editingCell.assetId}
          part={editingPart}
          currentValue={cells[activeSubsetId]?.[editingCell.assetId]?.[editingCell.partId] ?? ''}
          statusOptions={statusOptions}
          currentUser={user?.name ?? ''}
          onSave={(val, reason, by) => saveCell(editingCell.assetId, editingCell.partId, val, reason, by)}
          onClose={() => setEditingCell(null)}
        />
      )}
      {showAddSubset && <AddSubsetModal onAdd={addSubset} onClose={() => setShowAddSubset(false)} />}
      {showStatusOptions && (
        <StatusOptionsModal options={statusOptions} onSave={saveStatusOptions} onClose={() => setShowStatusOptions(false)} />
      )}
    </div>
  );
}
