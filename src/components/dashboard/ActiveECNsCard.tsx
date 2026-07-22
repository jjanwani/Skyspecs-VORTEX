'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileWarning, Plus, Trash2 } from 'lucide-react';
import { EngineeringChangeNotice } from '@/lib/types';
import { getAllECNs, removeECN } from '@/lib/ecnStore';
import { getECNActionColor, getECNActionLabel, cn } from '@/lib/utils';
import AddECNModal from '@/components/modals/AddECNModal';
import { useAuth } from '@/contexts/AuthContext';

export default function ActiveECNsCard() {
  const { can } = useAuth();
  const [items, setItems] = useState<EngineeringChangeNotice[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { setItems(getAllECNs()); }, []);

  const remove = (id: string) => {
    removeECN(id);
    setItems(prev => prev.filter(e => e.id !== id));
  };

  const canManage = can('add_work_orders');

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileWarning className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Active ECNs</h2>
          <span className="text-xs text-gray-500">{items.length}</span>
        </div>
        <Link href="/ecns" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">No ECNs currently active.</p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {items.map(e => (
            <div key={e.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-800/50 rounded-lg group">
              <Link href={`/ecns/${e.id}`} className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs text-gray-500 font-mono flex-shrink-0">{e.id}</span>
                <span className="text-xs text-white truncate">{e.title}</span>
                <span className={cn('text-xs px-1.5 py-0.5 rounded border flex-shrink-0', getECNActionColor(e.actionType))}>
                  {getECNActionLabel(e.actionType)}
                </span>
              </Link>
              {canManage && (
                <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {canManage && (
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add ECN
        </button>
      )}
      {showAddModal && (
        <AddECNModal
          onAdd={newECN => { setItems(prev => [...prev, newECN]); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
