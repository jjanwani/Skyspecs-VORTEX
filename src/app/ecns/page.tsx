'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { ecns as baseECNs } from '@/lib/data/ecns';
import { EngineeringChangeNotice } from '@/lib/types';
import { getUserECNs } from '@/lib/userDataStore';
import { getECNActionColor, getECNActionLabel, formatDate, cn } from '@/lib/utils';
import { getSubsystemTypeName } from '@/lib/subsystemTree';
import { FileWarning, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import AddECNModal from '@/components/modals/AddECNModal';
import { useAuth } from '@/contexts/AuthContext';

export default function ECNsPage() {
  const { can } = useAuth();
  const [userECNs, setUserECNs] = useState<EngineeringChangeNotice[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { setUserECNs(getUserECNs()); }, []);

  const allECNs = [...baseECNs, ...userECNs];
  const filtered = allECNs.filter(e =>
    !search ||
    e.id.toLowerCase().includes(search.toLowerCase()) ||
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="ECNs" subtitle="Engineering Change Notices and the subsystems/parts they affect" />
      <div className="p-6 space-y-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search ECNs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            {can('add_work_orders') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add ECN
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <FileWarning className="w-8 h-8 mx-auto mb-2 text-gray-700" />
            <p className="text-gray-500 text-sm">No ECNs match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(e => (
              <Link
                key={e.id}
                href={`/ecns/${e.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-gray-500 font-mono">{e.id}</span>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded border', getECNActionColor(e.actionType))}>
                        {getECNActionLabel(e.actionType)}
                      </span>
                      {e.affectedSubsystemTypeIds.map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded border bg-gray-800 border-gray-700 text-gray-400">
                          {getSubsystemTypeName(t)}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{e.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{e.description}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500 flex-shrink-0">
                    <p>{e.createdBy}</p>
                    <p>{formatDate(e.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-600 text-right">{filtered.length} of {allECNs.length} ECNs</p>
      </div>

      {showAddModal && (
        <AddECNModal
          onAdd={newECN => { setUserECNs(prev => [...prev, newECN]); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
