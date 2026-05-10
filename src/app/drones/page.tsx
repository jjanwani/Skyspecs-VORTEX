'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { drones } from '@/lib/data/drones';
import { workOrders } from '@/lib/data/workorders';
import { DroneStatus } from '@/lib/types';
import { getDroneStatusColor, getDroneStatusLabel, cn } from '@/lib/utils';
import Link from 'next/link';
import { Plane, Search, CheckCircle2, XCircle, Clock, MapPin, User, ClipboardList } from 'lucide-react';

const ALL_STATUSES: DroneStatus[] = ['field', 'wip_redress', 'returning_field', 'flight_status', 'rca', 'ready_for_deployment', 'in_maintenance'];

function ComplianceDot({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
    : <XCircle className="w-3.5 h-3.5 text-gray-600" />;
}

export default function DronesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DroneStatus | 'all'>('all');

  const filtered = drones.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.assignedTech?.toLowerCase().includes(search.toLowerCase())) ||
      (d.deploymentRegion?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getOpenWOs = (droneId: string) =>
    workOrders.filter(w => w.droneId === droneId && w.status !== 'completed').length;

  return (
    <div>
      <Header title="Drones" subtitle="Fleet status and asset management" />
      <div className="p-6 space-y-5">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search drones, tech, region..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                statusFilter === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
              )}
            >All ({drones.length})</button>
            {ALL_STATUSES.map(s => {
              const count = drones.filter(d => d.status === s).length;
              if (!count) return null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    statusFilter === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                  )}
                >
                  {getDroneStatusLabel(s)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Drone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(drone => {
            const openWOs = getOpenWOs(drone.id);
            return (
              <Link
                key={drone.id}
                href={`/drones/${drone.id}`}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/50 hover:bg-gray-900/80 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Plane className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{drone.name}</p>
                      <p className="text-xs text-gray-500">{drone.version}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-1 rounded-lg border font-medium', getDroneStatusColor(drone.status))}>
                    {getDroneStatusLabel(drone.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {drone.assignedTech && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span>{drone.assignedTech}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{drone.location}</span>
                  </div>
                  {drone.totalFlightHours > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{drone.totalFlightHours} flight hrs</span>
                    </div>
                  )}
                  {openWOs > 0 && (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>{openWOs} open work order{openWOs > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {drone.notes && (
                  <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">{drone.notes}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ComplianceDot ok={drone.ectCompliance} />
                      <span>ECT</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ComplianceDot ok={drone.ecnCompliance} />
                      <span>NDAA</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ComplianceDot ok={drone.faaRegistration} />
                      <span>FAA</span>
                    </div>
                  </div>
                  {drone.crashHistory > 0 && (
                    <span className={cn('text-xs px-2 py-0.5 rounded border',
                      drone.rcaCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    )}>
                      {drone.crashHistory} crash · {drone.rcaCompleted ? 'RCA done' : 'RCA pending'}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No drones match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
