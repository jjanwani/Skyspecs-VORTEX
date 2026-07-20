'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Subsystem, InventoryItem } from '@/lib/types';
import { getUserSubsystems, saveUserSubsystems } from '@/lib/userDataStore';
import { SUBSYSTEM_TYPES } from '@/lib/data/subsystems';
import { getSubsystemTypeName } from '@/lib/subsystemTree';

interface Props {
  droneId: string;
  existingNodes: Subsystem[];
  inventoryItems: InventoryItem[];
  initialParentId?: string | null;
  onAdd: (node: Subsystem) => void;
  onClose: () => void;
}

export default function AddSubsystemModal({ droneId, existingNodes, inventoryItems, initialParentId, onAdd, onClose }: Props) {
  const [parentId, setParentId] = useState(initialParentId ?? '');
  const [typeId, setTypeId] = useState(SUBSYSTEM_TYPES[0]?.id ?? '');
  const [kind, setKind] = useState<'subsystem' | 'part'>('subsystem');
  const [crossRef, setCrossRef] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [serialNumber, setSerialNumber] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeId) return;

    const newNode: Subsystem = {
      id: `SYS-U-${Date.now().toString().slice(-8)}`,
      typeId,
      droneId,
      parentId: parentId || undefined,
      kind,
      crossRef: crossRef.trim() || undefined,
      quantity: kind === 'part' ? quantity : undefined,
      serialNumber: kind === 'part' ? (serialNumber.trim() || undefined) : undefined,
      inventoryItemId: kind === 'part' ? (inventoryItemId || undefined) : undefined,
      currentConfig: {},
      history: [],
      notes: notes.trim() || undefined,
    };

    const existing = getUserSubsystems();
    saveUserSubsystems([...existing, newNode]);
    onAdd(newNode);
  };

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500';
  const selectCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" /> Add Subsystem / Part
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Parent</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)} className={selectCls}>
              <option value="">— Top-level (directly under drone) —</option>
              {existingNodes.map(n => (
                <option key={n.id} value={n.id}>{getSubsystemTypeName(n.typeId)} ({n.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select value={typeId} onChange={e => setTypeId(e.target.value)} className={selectCls}>
              {SUBSYSTEM_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Kind</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setKind('subsystem')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${kind === 'subsystem' ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'border-gray-700 text-gray-400 hover:text-white'}`}
              >
                Subsystem
              </button>
              <button
                type="button"
                onClick={() => setKind('part')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${kind === 'part' ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'border-gray-700 text-gray-400 hover:text-white'}`}
              >
                Part (leaf)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Cross Ref <span className="text-gray-600 font-normal">(optional)</span></label>
            <input type="text" placeholder="e.g. SS-FS-GMB1-001" value={crossRef} onChange={e => setCrossRef(e.target.value)} className={inputCls} />
          </div>

          {kind === 'part' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                  <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Serial Number</label>
                  <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Link Inventory Item <span className="text-gray-600 font-normal">(optional)</span></label>
                <select value={inventoryItemId} onChange={e => setInventoryItemId(e.target.value)} className={selectCls}>
                  <option value="">— None —</option>
                  {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes <span className="text-gray-600 font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Description or one-off part label..." className={`${inputCls} resize-none`} rows={2} />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-xs text-white font-medium hover:bg-blue-500 transition-colors">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
