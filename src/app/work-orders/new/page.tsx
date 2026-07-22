'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  ChevronRight, ChevronLeft, ClipboardList, Sparkles, Search, Check,
  CheckCircle2, ArrowLeft,
} from 'lucide-react';
import { WorkOrder, WorkOrderType, WorkOrderStatus, WorkOrderPriority, Drone, Subsystem, EngineeringChangeNotice } from '@/lib/types';
import { workOrders as baseWorkOrders } from '@/lib/data/workorders';
import { drones as baseDrones } from '@/lib/data/drones';
import { SEED_GIMBALS, SEED_ASSET_SUBSYSTEMS } from '@/lib/data/subsystems';
import { getUserWorkOrders, saveUserWorkOrders, getUserDrones, getUserSubsystems } from '@/lib/userDataStore';
import { getAllECNs } from '@/lib/ecnStore';
import { getWorkOrderTypeLabel, getWorkOrderTypeColor, cn } from '@/lib/utils';
import { getSubsystemTypeName } from '@/lib/subsystemTree';

type Step = 'pick' | 'form' | 'success';
const TYPES: WorkOrderType[] = ['maintenance', 'upgrade', 'issue', 'rca'];

function blankForm(type: WorkOrderType) {
  return {
    title: '', type, priority: 'medium' as WorkOrderPriority, status: 'open' as WorkOrderStatus,
    assigned: '', estimatedHours: 1, description: '', ernReference: '', notes: '',
    subsystemId: '', ecnId: '',
    parts: [] as WorkOrder['parts'],
  };
}

function templateToForm(wo: WorkOrder) {
  return {
    title: wo.title,
    type: wo.type,
    priority: wo.priority,
    status: 'open' as WorkOrderStatus,
    assigned: wo.assignedTech ?? '',
    estimatedHours: wo.estimatedHours,
    description: wo.description,
    ernReference: wo.ernReference ?? '',
    notes: wo.notes ?? '',
    subsystemId: '',
    ecnId: wo.ecnId ?? '',
    parts: wo.parts ? wo.parts.map(p => ({ ...p })) : [],
  };
}

export default function NewWorkOrderPage() {
  const [step, setStep] = useState<Step>('pick');
  const [selectedType, setSelectedType] = useState<WorkOrderType>('maintenance');
  const [templateLabel, setTemplateLabel] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [form, setForm] = useState(blankForm('maintenance'));

  const [userWorkOrders, setUserWorkOrders] = useState<WorkOrder[]>([]);
  const [allDrones, setAllDrones] = useState<Drone[]>(baseDrones);
  const [allSubsystems, setAllSubsystems] = useState<Subsystem[]>([...SEED_GIMBALS, ...SEED_ASSET_SUBSYSTEMS]);
  const [allECNs, setAllECNs] = useState<EngineeringChangeNotice[]>([]);

  const [droneSearch, setDroneSearch] = useState('');
  const [selectedDrones, setSelectedDrones] = useState<Set<string>>(new Set());

  const [createdWOs, setCreatedWOs] = useState<WorkOrder[]>([]);

  useEffect(() => {
    setUserWorkOrders(getUserWorkOrders());
    setAllDrones([...baseDrones, ...getUserDrones()]);
    setAllSubsystems([...SEED_GIMBALS, ...SEED_ASSET_SUBSYSTEMS, ...getUserSubsystems()]);
    setAllECNs(getAllECNs());
  }, []);

  const allWorkOrders = useMemo(() => [...baseWorkOrders, ...userWorkOrders], [userWorkOrders]);

  const templatesForType = useMemo(() => {
    const seen = new Set<string>();
    return allWorkOrders.filter(wo => {
      if (wo.type !== selectedType) return false;
      const key = wo.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).filter(wo => !templateSearch || wo.title.toLowerCase().includes(templateSearch.toLowerCase()));
  }, [allWorkOrders, selectedType, templateSearch]);

  const filteredDrones = useMemo(() => {
    if (!droneSearch) return allDrones;
    const q = droneSearch.toLowerCase();
    return allDrones.filter(d => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.location.toLowerCase().includes(q));
  }, [allDrones, droneSearch]);

  const toggleDrone = (id: string) => {
    setSelectedDrones(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const assignAllFiltered = () => {
    setSelectedDrones(prev => {
      const next = new Set(prev);
      filteredDrones.forEach(d => next.add(d.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedDrones(new Set());

  const pickBlank = (type: WorkOrderType) => {
    setForm(blankForm(type));
    setTemplateLabel(null);
    setStep('form');
  };

  const pickTemplate = (wo: WorkOrder) => {
    setForm(templateToForm(wo));
    setTemplateLabel(wo.title);
    setStep('form');
  };

  const set = <K extends keyof ReturnType<typeof blankForm>>(key: K, val: ReturnType<typeof blankForm>[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const singleSelectedDroneId = selectedDrones.size === 1 ? [...selectedDrones][0] : null;
  const droneSubsystems = singleSelectedDroneId ? allSubsystems.filter(s => s.droneId === singleSelectedDroneId) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const now = new Date().toISOString();
    const targets = selectedDrones.size > 0
      ? [...selectedDrones].map(id => allDrones.find(d => d.id === id)!).filter(Boolean)
      : [null];

    const newWOs: WorkOrder[] = targets.map((drone, i) => ({
      id: `WO-U-${(Date.now() + i).toString().slice(-6)}`,
      droneId: drone?.id ?? 'unassigned',
      droneName: drone?.name ?? 'Unassigned',
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      priority: form.priority,
      status: form.status,
      assignedTech: form.assigned.trim(),
      createdAt: now,
      updatedAt: now,
      estimatedHours: form.estimatedHours || 0,
      previousOccurrences: 0,
      completionHistory: [],
      ernReference: form.ernReference.trim() || undefined,
      subsystemId: targets.length === 1 ? (form.subsystemId || undefined) : undefined,
      ecnId: form.ecnId || undefined,
      notes: form.notes.trim() || undefined,
      parts: form.parts && form.parts.length > 0 ? form.parts : undefined,
      source: 'platform',
      sfSyncStatus: 'pending',
      sfObject: 'WorkOrder',
    }));

    const existing = getUserWorkOrders();
    saveUserWorkOrders([...existing, ...newWOs]);
    setCreatedWOs(newWOs);
    setStep('success');
  };

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500';
  const selectCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500';

  return (
    <div>
      <Header title="New Work Order" subtitle="Create and assign a work order across the fleet" />
      <div className="p-6 max-w-3xl mx-auto space-y-5">

        {step === 'pick' && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-gray-400 mb-2">Work order type</p>
              <div className="flex flex-wrap gap-2">
                {TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={cn('px-4 py-2 rounded-lg text-xs font-medium border transition-colors',
                      selectedType === t ? getWorkOrderTypeColor(t).replace('/20', '/30') : 'border-gray-700 text-gray-400 hover:text-white'
                    )}
                  >
                    {getWorkOrderTypeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => pickBlank(selectedType)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/10 border border-blue-500/30 hover:border-blue-500/60 rounded-xl text-left transition-colors group"
            >
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Create new {getWorkOrderTypeLabel(selectedType).toLowerCase()} work order</p>
                <p className="text-xs text-gray-500">Fill in all fields manually</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
            </button>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Or use a previous {getWorkOrderTypeLabel(selectedType).toLowerCase()} work order as a template</p>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search work orders..."
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {templatesForType.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-6">No matching {getWorkOrderTypeLabel(selectedType).toLowerCase()} work orders</p>
                ) : (
                  templatesForType.map(wo => (
                    <button
                      key={wo.id}
                      onClick={() => pickTemplate(wo)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg text-left transition-colors group"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{wo.title}</p>
                        <p className="text-xs text-gray-500">{wo.estimatedHours}h est.</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button type="button" onClick={() => setStep('pick')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>

            {templateLabel && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <ClipboardList className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <p className="text-xs text-blue-300 truncate">Template: {templateLabel}</p>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title <span className="text-red-400">*</span></label>
                <input type="text" required placeholder="Work order title" value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Type</label>
                  <select value={form.type} onChange={e => set('type', e.target.value as WorkOrderType)} className={selectCls}>
                    {TYPES.map(t => <option key={t} value={t}>{getWorkOrderTypeLabel(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => set('priority', e.target.value as WorkOrderPriority)} className={selectCls}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value as WorkOrderStatus)} className={selectCls}>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Est. Hours</label>
                  <input type="number" min={0} value={form.estimatedHours} onChange={e => set('estimatedHours', Number(e.target.value))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Assigned</label>
                <input type="text" placeholder="Name or team" value={form.assigned} onChange={e => set('assigned', e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the work required..." className={`${inputCls} resize-none`} rows={3} />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">ECN <span className="text-gray-600 font-normal">(optional)</span></label>
                <select
                  value={form.ecnId}
                  onChange={e => {
                    const ecnId = e.target.value;
                    const ecn = allECNs.find(x => x.id === ecnId);
                    setForm(prev => ({
                      ...prev,
                      ecnId,
                      ernReference: ecn ? ecn.id : prev.ernReference,
                      description: ecn && !prev.description ? ecn.description : prev.description,
                      parts: ecn?.partsAffected && (prev.parts ?? []).length === 0 ? ecn.partsAffected.map(p => ({ ...p })) : prev.parts,
                    }));
                  }}
                  className={selectCls}
                >
                  <option value="">— None —</option>
                  {allECNs.map(e => <option key={e.id} value={e.id}>{e.id} — {e.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Subsystem <span className="text-gray-600 font-normal">(optional{singleSelectedDroneId ? '' : ' — select exactly one drone below'})</span>
                </label>
                <select
                  value={form.subsystemId}
                  onChange={e => set('subsystemId', e.target.value)}
                  disabled={!singleSelectedDroneId}
                  className={`${selectCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <option value="">— None —</option>
                  {droneSubsystems.map(s => (
                    <option key={s.id} value={s.id}>{getSubsystemTypeName(s.typeId)} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">ERN Reference</label>
                <input type="text" placeholder="ERN-XXXX" value={form.ernReference} onChange={e => set('ernReference', e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." className={`${inputCls} resize-none`} rows={3} />
              </div>
            </div>

            {/* Drone assignment checklist */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Assign to drones <span className="text-gray-600 font-normal">(optional — leave empty for unassigned)</span></label>
                <span className="text-xs text-blue-400">{selectedDrones.size} selected</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search drones, e.g. FS..."
                  value={droneSearch}
                  onChange={e => setDroneSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={assignAllFiltered}
                  disabled={filteredDrones.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 disabled:opacity-40 rounded-lg text-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Assign to all {droneSearch ? `(${filteredDrones.length} filtered)` : `(${filteredDrones.length})`}
                </button>
                {selectedDrones.size > 0 && (
                  <button type="button" onClick={clearSelection} className="px-3 py-1.5 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-xs transition-colors">
                    Clear selection
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {filteredDrones.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-4">No drones match your search</p>
                ) : (
                  filteredDrones.map(drone => (
                    <button
                      key={drone.id}
                      type="button"
                      onClick={() => toggleDrone(drone.id)}
                      className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors',
                        selectedDrones.has(drone.id) ? 'border-blue-500/50 bg-blue-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      )}
                    >
                      <div className={cn('w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                        selectedDrones.has(drone.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                      )}>
                        {selectedDrones.has(drone.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{drone.name}</p>
                        <p className="text-xs text-gray-500">{drone.location}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <button type="submit" className="w-full px-4 py-2.5 bg-blue-600 rounded-lg text-sm text-white font-medium hover:bg-blue-500 transition-colors">
              {selectedDrones.size === 0 ? 'Create Work Order (Unassigned)' : `Create Work Order for ${selectedDrones.size} drone${selectedDrones.size > 1 ? 's' : ''}`}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Created {createdWOs.length} work order{createdWOs.length !== 1 ? 's' : ''}
            </div>
            <div className="space-y-2">
              {createdWOs.map(wo => (
                <div key={wo.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500 font-mono">{wo.id}</p>
                    <p className="text-sm text-white font-medium">{wo.title}</p>
                    <p className="text-xs text-gray-500">{wo.droneName}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('pick'); setSelectedDrones(new Set()); setDroneSearch(''); setCreatedWOs([]); }}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
              >
                Create Another
              </button>
              <Link
                href={`/work-orders?q=${encodeURIComponent(createdWOs[0]?.title ?? '')}`}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> View in Work Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
