'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { ComplianceRequirement } from '@/lib/types';
import { getComplianceRequirements, saveComplianceRequirements } from '@/lib/userDataStore';
import { useAuth } from '@/contexts/AuthContext';

export default function ComplianceRequirementsCard() {
  const { can } = useAuth();
  const [items, setItems] = useState<ComplianceRequirement[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => { setItems(getComplianceRequirements()); }, []);

  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    const item: ComplianceRequirement = { id: `comp-${Date.now()}`, name };
    const next = [...items, item];
    setItems(next);
    saveComplianceRequirements(next);
    setNewName('');
  };

  const removeItem = (id: string) => {
    const next = items.filter(i => i.id !== id);
    setItems(next);
    saveComplianceRequirements(next);
  };

  const canManage = can('edit_drone_compliance');

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-green-400" />
        <h2 className="text-sm font-semibold text-white">Compliance Requirements</h2>
        <span className="text-xs text-gray-500">{items.length} active</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">No compliance requirements tracked.</p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-gray-800/50 rounded-lg group">
              <span className="text-xs text-gray-300">{item.name}</span>
              {canManage && (
                <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {canManage && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a compliance requirement..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={addItem}
            disabled={!newName.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
