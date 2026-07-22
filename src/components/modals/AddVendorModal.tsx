'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Vendor } from '@/lib/types';
import { getUserVendors, saveUserVendors } from '@/lib/userDataStore';

interface Props {
  onAdd: (vendor: Vendor) => void;
  onClose: () => void;
}

export default function AddVendorModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [redFlag, setRedFlag] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newVendor: Vendor = {
      id: `VEN-U-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      location: location.trim() || undefined,
      redFlag,
      notes: notes.trim() || undefined,
    };

    const existing = getUserVendors();
    saveUserVendors([...existing, newVendor]);
    onAdd(newVendor);
  };

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" /> Add Vendor
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Vendor Name <span className="text-red-400">*</span></label>
            <input type="text" required placeholder="Vendor name" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Location</label>
            <input type="text" placeholder="City, State" value={location} onChange={e => setLocation(e.target.value)} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={redFlag} onChange={e => setRedFlag(e.target.checked)} className="w-3.5 h-3.5" />
            Red flag this vendor
          </label>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." className={`${inputCls} resize-none`} rows={3} />
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-800">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-xs text-white font-medium hover:bg-blue-500">
              Add Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
