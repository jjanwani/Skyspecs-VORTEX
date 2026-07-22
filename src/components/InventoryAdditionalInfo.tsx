'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InventoryItem, Subsystem, Drone } from '@/lib/types';
import { getSubsystemPath, getSubsystemTypeName } from '@/lib/subsystemTree';
import { cn } from '@/lib/utils';
import InlineEdit from '@/components/InlineEdit';
import { Cpu, ShoppingCart, ExternalLink, Wrench } from 'lucide-react';

type Tab = 'engineering' | 'procurement';

interface Props {
  item: InventoryItem;
  allSubsystems: Subsystem[];
  drones: Drone[];
  canEditProcurement: boolean;
  onUpdateField: (field: 'quotedLeadTimeDays' | 'actualLeadTimeDays', value: number) => void;
}

export default function InventoryAdditionalInfo({ item, allSubsystems, drones, canEditProcurement, onUpdateField }: Props) {
  const [tab, setTab] = useState<Tab>('engineering');

  const linkedSubsystems = allSubsystems.filter(s => s.inventoryItemId === item.id);

  const variance = item.quotedLeadTimeDays !== undefined && item.actualLeadTimeDays !== undefined
    ? item.actualLeadTimeDays - item.quotedLeadTimeDays
    : undefined;

  return (
    <div className="col-span-2 md:col-span-4 border-t border-gray-800 pt-3 mt-1" onClick={e => e.stopPropagation()}>
      <p className="text-gray-500 mb-2 font-medium">Additional Info</p>
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setTab('engineering')}
          className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
            tab === 'engineering' ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'border-gray-700 text-gray-400 hover:text-white'
          )}
        >
          <Cpu className="w-3 h-3" /> Engineering
        </button>
        <button
          onClick={() => setTab('procurement')}
          className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
            tab === 'procurement' ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'border-gray-700 text-gray-400 hover:text-white'
          )}
        >
          <ShoppingCart className="w-3 h-3" /> Procurement
        </button>
      </div>

      {tab === 'engineering' && (
        linkedSubsystems.length === 0 ? (
          <p className="text-gray-600">Not currently linked to any subsystem.</p>
        ) : (
          <div className="space-y-1.5">
            {linkedSubsystems.map(s => {
              const drone = drones.find(d => d.id === s.droneId);
              const path = getSubsystemPath(s.id, allSubsystems.filter(n => n.droneId === s.droneId));
              return (
                <Link
                  key={s.id}
                  href={s.droneId ? `/drones/${s.droneId}` : '#'}
                  className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Wrench className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-white">{drone?.name ?? s.droneId ?? 'Unknown drone'}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-400 truncate">{path.map(p => getSubsystemTypeName(p.typeId)).join(' > ')}</span>
                </Link>
              );
            })}
          </div>
        )
      )}

      {tab === 'procurement' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-500 mb-1">Quoted Lead Time (days)</p>
            <InlineEdit
              value={item.quotedLeadTimeDays ?? ''}
              type="number"
              onSave={v => onUpdateField('quotedLeadTimeDays', Number(v))}
              displayClassName="text-white"
              emptyLabel="—"
              disabled={!canEditProcurement}
            />
          </div>
          <div>
            <p className="text-gray-500 mb-1">Actual Lead Time (days)</p>
            <InlineEdit
              value={item.actualLeadTimeDays ?? ''}
              type="number"
              onSave={v => onUpdateField('actualLeadTimeDays', Number(v))}
              displayClassName="text-white"
              emptyLabel="—"
              disabled={!canEditProcurement}
            />
          </div>
          <div>
            <p className="text-gray-500 mb-1">Lead Time Variance</p>
            <p className={cn('font-medium',
              variance === undefined ? 'text-gray-600' : variance > 0 ? 'text-red-400' : variance < 0 ? 'text-green-400' : 'text-gray-400'
            )}>
              {variance === undefined ? '—' : variance > 0 ? `+${variance}d late` : variance < 0 ? `${Math.abs(variance)}d early` : 'On time'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Purchase Orders</p>
            <Link
              href={`/purchase-orders?item=${item.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="w-3 h-3" /> View Purchase Orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
