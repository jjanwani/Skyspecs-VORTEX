'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { WorkOrder, WorkOrderType, WorkOrderStatus, WorkOrderPriority } from '@/lib/types';
import { getUserWorkOrders, saveUserWorkOrders } from '@/lib/userDataStore';

interface Props {
  onAdd: (wo: WorkOrder) => void;
  onClose: () => void;
}

export default function AddWorkOrderModal({ onAdd, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [droneName, setDroneName] = useState('');
  const [type, setType] = useState<WorkOrderType>('maintenance');
  const [priority, setPriority] = useState<WorkOrderPriority>('medium');
  const [status, setStatus] = useState<WorkOrderStatus>('open');
  const [assignedTech, setAssignedTech] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [description, setDescription] = useState('');
  const [ernReference, setErnReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = new Date().toISOString();
    const id = `WO-U-${Date.now().toString().slice(-6)}`;

    const newWO: WorkOrder = {
      id,
      droneId: droneName.trim() || 'unknown',
      droneName: droneName.trim() || 'Unknown',
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      status,
      assignedTech: assignedTech.trim(),
      createdAt: now,
      updatedAt: now,
      estimatedHours: estimatedHours || 0,
      previousOccurrences: 0,
      completionHistory: [],
      ernReference: ernReference.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const existing = getUserWorkOrders();
    saveUserWorkOrders([...existing, newWO]);
    onAdd(newWO);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" /> Add Work Order
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              placeholder="Work order title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Drone Name / ID</label>
            <input
              type="text"
              placeholder="FS-008"
              value={droneName}
              onChange={e => setDroneName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as WorkOrderType)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="maintenance">Maintenance</option>
              <option value="upgrade">Upgrade</option>
              <option value="issue">Issue Fix</option>
              <option value="rca">RCA</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as WorkOrderPriority)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as WorkOrderStatus)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Assigned Tech</label>
            <input
              type="text"
              placeholder="Tech name"
              value={assignedTech}
              onChange={e => setAssignedTech(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Estimated Hours</label>
            <input
              type="number"
              min={0}
              value={estimatedHours}
              onChange={e => setEstimatedHours(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the work required..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">ERN Reference</label>
            <input
              type="text"
              placeholder="ERN-XXXX"
              value={ernReference}
              onChange={e => setErnReference(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-xs text-white font-medium hover:bg-blue-500"
            >
              Add Work Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
