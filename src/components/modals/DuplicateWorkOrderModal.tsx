'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, X, Check } from 'lucide-react';
import { WorkOrder, Drone } from '@/lib/types';
import { drones as staticDrones } from '@/lib/data/drones';
import { getUserWorkOrders, saveUserWorkOrders } from '@/lib/userDataStore';
import { getDroneStatusLabel } from '@/lib/utils';

interface Props {
  sourceWO: WorkOrder;
  onDuplicate: (created: WorkOrder[]) => void;
  onClose: () => void;
}

export default function DuplicateWorkOrderModal({ sourceWO, onDuplicate, onClose }: Props) {
  const [allDrones, setAllDrones] = useState<Drone[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigned, setAssigned] = useState('');

  useEffect(() => {
    const userDrones: Drone[] = JSON.parse(localStorage.getItem('user-drones') || '[]');
    setAllDrones([...staticDrones, ...userDrones]);
  }, []);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const toggleDrone = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === allDrones.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allDrones.map(d => d.id)));
    }
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    const now = new Date().toISOString();
    const existingUserWOs = getUserWorkOrders();

    const created: WorkOrder[] = Array.from(selected).map((droneId, i) => {
      const drone = allDrones.find(d => d.id === droneId)!;
      return {
        ...sourceWO,
        id: `WO-U-${(Date.now() + i).toString().slice(-6)}`,
        droneId: drone.id,
        droneName: drone.name,
        assignedTech: assigned.trim() || sourceWO.assignedTech,
        status: 'open' as const,
        createdAt: now,
        updatedAt: now,
        completedAt: undefined,
        actualHours: undefined,
        sfId: undefined,
        sfSyncStatus: 'pending' as const,
        source: 'platform' as const,
        previousOccurrences: 0,
        completionHistory: [],
        tasks: [],
      };
    });

    saveUserWorkOrders([...existingUserWOs, ...created]);
    onDuplicate(created);
  };

  const allSelected = allDrones.length > 0 && selected.size === allDrones.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Copy className="w-4 h-4 text-blue-400" /> Duplicate Work Order
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{sourceWO.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Override "Assigned" (optional)</label>
            <input
              type="text"
              placeholder={sourceWO.assignedTech || 'Keep from source'}
              value={assigned}
              onChange={e => setAssigned(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Select drones to assign this work order</label>
              <button
                onClick={toggleAll}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {allDrones.map(drone => (
                <button
                  key={drone.id}
                  onClick={() => toggleDrone(drone.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    selected.has(drone.id)
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    selected.has(drone.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                  }`}>
                    {selected.has(drone.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{drone.name}</p>
                    <p className="text-xs text-gray-500">{getDroneStatusLabel(drone.status)}</p>
                  </div>
                  {drone.id === sourceWO.droneId && (
                    <span className="text-xs text-gray-600 flex-shrink-0">source</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-xs text-white font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {selected.size === 0 ? 'Select drones' : `Duplicate to ${selected.size} drone${selected.size > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
