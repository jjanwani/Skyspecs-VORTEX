'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { InventoryItem, InventoryCategory, PIPOStatus } from '@/lib/types';
import { getUserInventory, saveUserInventory } from '@/lib/userDataStore';

interface Props {
  onAdd: (item: InventoryItem) => void;
  onClose: () => void;
}

export default function AddInventoryModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('Misc');
  const [location, setLocation] = useState('');
  const [assignedTech, setAssignedTech] = useState('');
  const [currentCount, setCurrentCount] = useState(0);
  const [minQty, setMinQty] = useState(5);
  const [incoming, setIncoming] = useState(0);
  const [pipoStatus, setPipoStatus] = useState<PIPOStatus>('in_stock');
  const [usageRatePerWeek, setUsageRatePerWeek] = useState(0);
  const [notes, setNotes] = useState('');
  const [purchaseLink, setPurchaseLink] = useState('');

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const today = new Date().toISOString();
    const id = `INV-U-${Date.now().toString().slice(-6)}`;

    const newItem: InventoryItem = {
      id,
      name: name.trim(),
      category,
      location: location.trim() || 'Unknown',
      assignedTech: assignedTech.trim() || undefined,
      qty: currentCount,
      minQty,
      complete: currentCount,
      inStock: currentCount,
      countedInventory: currentCount,
      discrepancy: 0,
      incoming,
      usageRate: usageRatePerWeek,
      usageRatePerWeek,
      currentCount,
      qtyPerAssembly: 1,
      importedFromPFEP: false,
      lastAudit: today,
      lastUpdated: today,
      lastAuditCount: currentCount,
      stockAddedSinceAudit: 0,
      usageSinceAudit: 0,
      pipoStatus,
      repurchaseFlag: false,
      repurchaseCount: 0,
      notes: notes.trim() || undefined,
      purchaseLink: purchaseLink.trim() || undefined,
      sfSyncStatus: 'pending',
      sfObject: 'Inventory_Item__c',
    };

    const existing = getUserInventory();
    saveUserInventory([...existing, newItem]);
    onAdd(newItem);
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
            <Plus className="w-4 h-4 text-blue-400" /> Add Inventory Item
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              placeholder="Part or component name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as InventoryCategory)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Corestack">Corestack</option>
              <option value="Gimbal">Gimbal</option>
              <option value="Fuselage">Fuselage</option>
              <option value="Peripherals">Peripherals</option>
              <option value="GCS">GCS</option>
              <option value="RTK">RTK</option>
              <option value="Transmitters">Transmitters</option>
              <option value="Misc">Misc</option>
              <option value="3D Printing">3D Printing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Location</label>
            <input
              type="text"
              placeholder="Shelf / bin location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Assigned</label>
            <input
              type="text"
              placeholder="Name or team"
              value={assignedTech}
              onChange={e => setAssignedTech(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Current Count</label>
              <input
                type="number"
                min={0}
                value={currentCount}
                onChange={e => setCurrentCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Min Quantity</label>
              <input
                type="number"
                min={0}
                value={minQty}
                onChange={e => setMinQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Incoming</label>
              <input
                type="number"
                min={0}
                value={incoming}
                onChange={e => setIncoming(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Usage Rate / week</label>
              <input
                type="number"
                min={0}
                value={usageRatePerWeek}
                onChange={e => setUsageRatePerWeek(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">PIPO Status</label>
            <select
              value={pipoStatus}
              onChange={e => setPipoStatus(e.target.value as PIPOStatus)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="on_order">On Order</option>
              <option value="depleted">Depleted</option>
            </select>
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

          <div>
            <label className="block text-xs text-gray-400 mb-1">Purchase Link</label>
            <input
              type="url"
              placeholder="https://..."
              value={purchaseLink}
              onChange={e => setPurchaseLink(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
