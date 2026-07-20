'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, ChevronRight, ClipboardList, Sparkles } from 'lucide-react';
import { WorkOrder, WorkOrderType, WorkOrderStatus, WorkOrderPriority, Subsystem, EngineeringChangeNotice } from '@/lib/types';
import { getUserWorkOrders, saveUserWorkOrders } from '@/lib/userDataStore';
import { getWorkOrderTypeLabel } from '@/lib/utils';
import { getSubsystemTypeName } from '@/lib/subsystemTree';

interface Props {
  existingWorkOrders: WorkOrder[];
  drones: { id: string; name: string }[];
  subsystems: Subsystem[];
  ecns: EngineeringChangeNotice[];
  onAdd: (wo: WorkOrder) => void;
  onClose: () => void;
}

type Step = 'pick' | 'form';

function blankForm() {
  return {
    title: '', droneId: '', droneName: '', type: 'maintenance' as WorkOrderType,
    priority: 'medium' as WorkOrderPriority, status: 'open' as WorkOrderStatus,
    assigned: '', estimatedHours: 1, description: '', ernReference: '', notes: '',
    subsystemId: '', ecnId: '',
    parts: [] as WorkOrder['parts'],
  };
}

function templateToForm(wo: WorkOrder) {
  return {
    title: wo.title,
    droneId: '',
    droneName: '',
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

export default function AddWorkOrderModal({ existingWorkOrders, drones, subsystems, ecns, onAdd, onClose }: Props) {
  const [step, setStep] = useState<Step>('pick');
  const [form, setForm] = useState(blankForm());
  const [templateLabel, setTemplateLabel] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (step === 'form') setStep('pick');
      else onClose();
    }
  }, [onClose, step]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const pickTemplate = (wo: WorkOrder) => {
    setForm(templateToForm(wo));
    setTemplateLabel(wo.title);
    setStep('form');
  };

  const pickBlank = () => {
    setForm(blankForm());
    setTemplateLabel(null);
    setStep('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const now = new Date().toISOString();
    const id = `WO-U-${Date.now().toString().slice(-6)}`;

    const newWO: WorkOrder = {
      id,
      droneId: form.droneId || 'unassigned',
      droneName: form.droneName || 'Unassigned',
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
      subsystemId: form.subsystemId || undefined,
      ecnId: form.ecnId || undefined,
      notes: form.notes.trim() || undefined,
      parts: form.parts && form.parts.length > 0 ? form.parts : undefined,
      source: 'platform',
      sfSyncStatus: 'pending',
      sfObject: 'WorkOrder',
    };

    const existing = getUserWorkOrders();
    saveUserWorkOrders([...existing, newWO]);
    onAdd(newWO);
  };

  const set = <K extends keyof ReturnType<typeof blankForm>>(key: K, val: ReturnType<typeof blankForm>[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // Deduplicate templates by title for the picker
  const seen = new Set<string>();
  const uniqueTemplates = existingWorkOrders.filter(wo => {
    const key = wo.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const filteredTemplates = uniqueTemplates.filter(wo =>
    !search || wo.title.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500';
  const selectCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            {step === 'pick' ? 'Add Work Order' : templateLabel ? 'New Work Order (from template)' : 'New Work Order'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Pick template */}
        {step === 'pick' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-5 pb-3 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-3">Start from an existing work order or create a new one.</p>
              <button
                onClick={pickBlank}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/10 border border-blue-500/30 hover:border-blue-500/60 rounded-xl text-left transition-colors group"
              >
                <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Create new template</p>
                  <p className="text-xs text-gray-500">Fill in all fields manually</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </button>
            </div>

            <div className="px-5 pb-3 flex-shrink-0">
              <p className="text-xs text-gray-500 font-medium mb-2">Or use a previous work order as a template</p>
              <input
                type="text"
                placeholder="Search work orders..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-1">
              {filteredTemplates.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-6">No matching work orders</p>
              ) : (
                filteredTemplates.map(wo => (
                  <button
                    key={wo.id}
                    onClick={() => pickTemplate(wo)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-left transition-colors group"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{wo.title}</p>
                      <p className="text-xs text-gray-500">{getWorkOrderTypeLabel(wo.type)} · {wo.estimatedHours}h est.</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
            {templateLabel && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <ClipboardList className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <p className="text-xs text-blue-300 truncate">Template: {templateLabel}</p>
                <button type="button" onClick={() => { setForm(blankForm()); setTemplateLabel(null); }} className="ml-auto text-gray-600 hover:text-gray-400 flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Title <span className="text-red-400">*</span></label>
              <input type="text" required placeholder="Work order title" value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Assign to Drone <span className="text-gray-600 font-normal">(optional)</span></label>
              <select
                value={form.droneId}
                onChange={e => {
                  const d = drones.find(x => x.id === e.target.value);
                  setForm(prev => ({ ...prev, droneId: e.target.value, droneName: d?.name ?? '' }));
                }}
                className={selectCls}
              >
                <option value="">— Unassigned —</option>
                {drones.map(d => <option key={d.id} value={d.id}>{d.name} ({d.id})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Subsystem <span className="text-gray-600 font-normal">(optional)</span></label>
              <select
                value={form.subsystemId}
                onChange={e => set('subsystemId', e.target.value)}
                disabled={!form.droneId}
                className={`${selectCls} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="">{form.droneId ? '— None —' : 'Select a drone first'}</option>
                {subsystems.filter(s => s.droneId === form.droneId).map(s => (
                  <option key={s.id} value={s.id}>{getSubsystemTypeName(s.typeId)} ({s.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">ECN <span className="text-gray-600 font-normal">(optional)</span></label>
              <select
                value={form.ecnId}
                onChange={e => {
                  const ecnId = e.target.value;
                  const ecn = ecns.find(x => x.id === ecnId);
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
                {ecns.map(e => <option key={e.id} value={e.id}>{e.id} — {e.title}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value as WorkOrderType)} className={selectCls}>
                  <option value="maintenance">Maintenance</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="issue">Issue Fix</option>
                  <option value="rca">RCA</option>
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
              <label className="block text-xs text-gray-400 mb-1">ERN Reference</label>
              <input type="text" placeholder="ERN-XXXX" value={form.ernReference} onChange={e => set('ernReference', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." className={`${inputCls} resize-none`} rows={3} />
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-800">
              <button type="button" onClick={() => setStep('pick')} className="px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
                ← Back
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-xs text-white font-medium hover:bg-blue-500 transition-colors">
                Add Work Order
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
