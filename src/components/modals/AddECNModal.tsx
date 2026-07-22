'use client';

import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { EngineeringChangeNotice, ECNActionType } from '@/lib/types';
import { addECN } from '@/lib/ecnStore';
import { SUBSYSTEM_TYPES } from '@/lib/data/subsystems';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onAdd: (ecn: EngineeringChangeNotice) => void;
  onClose: () => void;
}

export default function AddECNModal({ onAdd, onClose }: Props) {
  const { user } = useAuth();
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<ECNActionType>('replace');
  const [affectedTypes, setAffectedTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState<{ name: string; qty: number }[]>([]);
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState(1);

  const toggleType = (typeId: string) => {
    setAffectedTypes(prev => prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]);
  };

  const addPart = () => {
    if (!partName.trim()) return;
    setParts(prev => [...prev, { name: partName.trim(), qty: partQty }]);
    setPartName('');
    setPartQty(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || affectedTypes.length === 0) return;

    const newECN: EngineeringChangeNotice = {
      id: id.trim() || `ECN-U-${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      description: description.trim(),
      actionType,
      affectedSubsystemTypeIds: affectedTypes,
      partsAffected: parts.length > 0 ? parts.map(p => ({ ...p, status: 'available' as const })) : undefined,
      createdBy: user?.name ?? 'Unknown',
      createdAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    addECN(newECN);
    onAdd(newECN);
  };

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500';
  const selectCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" /> New ECN
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">ECN ID <span className="text-gray-600 font-normal">(optional)</span></label>
              <input type="text" placeholder="ECN-XXXX" value={id} onChange={e => setId(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Action</label>
              <select value={actionType} onChange={e => setActionType(e.target.value as ECNActionType)} className={selectCls}>
                <option value="add">Add</option>
                <option value="remove">Remove</option>
                <option value="replace">Replace</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Title <span className="text-red-400">*</span></label>
            <input type="text" required placeholder="ECN title" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs to change and why..." className={`${inputCls} resize-none`} rows={3} />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Affected Subsystem Types <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {SUBSYSTEM_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleType(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${affectedTypes.includes(t.id) ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'border-gray-700 text-gray-400 hover:text-white'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Parts Affected <span className="text-gray-600 font-normal">(optional)</span></label>
            {parts.length > 0 && (
              <div className="space-y-1 mb-2">
                {parts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                    <span>{p.name} × {p.qty}</span>
                    <button type="button" onClick={() => setParts(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" placeholder="Part name" value={partName} onChange={e => setPartName(e.target.value)} className={`${inputCls} flex-1`} />
              <input type="number" min={1} value={partQty} onChange={e => setPartQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
              <button type="button" onClick={addPart} className="px-3 py-2 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-xs text-white transition-colors">Add</button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." className={`${inputCls} resize-none`} rows={2} />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || affectedTypes.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 disabled:opacity-40 rounded-lg text-xs text-white font-medium hover:bg-blue-500 transition-colors"
            >
              Create ECN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
