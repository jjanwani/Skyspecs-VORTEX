'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { workOrders as baseWorkOrders } from '@/lib/data/workorders';
import { drones as baseDrones } from '@/lib/data/drones';
import { SEED_GIMBALS, SEED_ASSET_SUBSYSTEMS } from '@/lib/data/subsystems';
import { ecns as baseECNs } from '@/lib/data/ecns';
import { WorkOrder, WorkOrderStatus, WorkOrderType, WorkOrderPriority, Subsystem, EngineeringChangeNotice } from '@/lib/types';
import {
  getWorkOrderStatusColor, getWorkOrderStatusLabel,
  getWorkOrderTypeColor, getWorkOrderTypeLabel,
  getPriorityColor, getSFSyncColor, getSFSyncDot, formatDate, cn
} from '@/lib/utils';
import Link from 'next/link';
import { Search, ClipboardList, Clock, User, ExternalLink, Filter, Plus, Copy } from 'lucide-react';
import AddWorkOrderModal from '@/components/modals/AddWorkOrderModal';
import DuplicateWorkOrderModal from '@/components/modals/DuplicateWorkOrderModal';
import { getUserWorkOrders, getUserDrones, getUserSubsystems, getUserECNs } from '@/lib/userDataStore';
import { useAuth } from '@/contexts/AuthContext';

export default function WorkOrdersPage() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<WorkOrderType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriority | 'all'>('all');
  const [userWorkOrders, setUserWorkOrders] = useState<WorkOrder[]>([]);
  const [userDrones, setUserDrones] = useState<{ id: string; name: string }[]>([]);
  const [userSubsystems, setUserSubsystems] = useState<Subsystem[]>([]);
  const [userECNs, setUserECNs] = useState<EngineeringChangeNotice[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<WorkOrder | null>(null);

  useEffect(() => {
    setUserWorkOrders(getUserWorkOrders());
    setUserDrones(getUserDrones());
    setUserSubsystems(getUserSubsystems());
    setUserECNs(getUserECNs());
  }, []);

  const allSubsystems = useMemo(() => [...SEED_GIMBALS, ...SEED_ASSET_SUBSYSTEMS, ...userSubsystems], [userSubsystems]);
  const allECNs = useMemo(() => [...baseECNs, ...userECNs], [userECNs]);

  const allDrones = useMemo(() => [...baseDrones, ...userDrones].map(d => ({ id: d.id, name: d.name })), [userDrones]);

  const allWorkOrders = [...baseWorkOrders, ...userWorkOrders];

  const filtered = allWorkOrders.filter(wo => {
    const matchSearch = !search || wo.title.toLowerCase().includes(search.toLowerCase()) ||
      wo.droneName.toLowerCase().includes(search.toLowerCase()) ||
      (wo.assignedTech ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (wo.ernReference?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || wo.status === statusFilter;
    const matchType = typeFilter === 'all' || wo.type === typeFilter;
    const matchPriority = priorityFilter === 'all' || wo.priority === priorityFilter;
    return matchSearch && matchStatus && matchType && matchPriority;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div>
      <Header title="Work Orders" subtitle="All drone work orders across the fleet" />
      <div className="p-6 space-y-5">

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Open', count: allWorkOrders.filter(w => w.status === 'open').length, color: 'text-blue-400' },
            { label: 'In Progress', count: allWorkOrders.filter(w => w.status === 'in_progress').length, color: 'text-amber-400' },
            { label: 'Critical', count: allWorkOrders.filter(w => w.priority === 'critical').length, color: 'text-red-400' },
            { label: 'Total', count: allWorkOrders.length, color: 'text-white' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Filters</span>
            </div>
            {can('add_work_orders') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Work Order
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by title, drone, tech, ERN..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as WorkOrderStatus | 'all')}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as WorkOrderType | 'all')}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="maintenance">Maintenance</option>
              <option value="upgrade">Upgrade</option>
              <option value="issue">Issue Fix</option>
              <option value="rca">RCA</option>
            </select>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as WorkOrderPriority | 'all')}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {(statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || search) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setPriorityFilter('all'); }}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Work Orders Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-0 px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-medium uppercase tracking-wide">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">Title / Drone</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-1">Assigned</div>
            <div className="col-span-1">Hours</div>
            <div className="col-span-1">SF</div>
          </div>
          {sortedFiltered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No work orders match your filters.</p>
            </div>
          ) : (
            sortedFiltered.map(wo => (
              <div key={wo.id} className="grid grid-cols-12 gap-0 px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors group items-center relative">
              <Link
                href={`/drones/${wo.droneId}/work-orders/${wo.id}`}
                className="absolute inset-0"
                aria-label={wo.title}
                target="_blank"
              />
                <div className="col-span-1 flex flex-col gap-1">
                  <span className="text-xs font-mono text-gray-500">{wo.id}</span>
                  {wo.source === 'slack' && (
                    <span className="text-xs px-1.5 py-0.5 rounded border bg-purple-500/10 border-purple-500/20 text-purple-400 w-fit">Slack</span>
                  )}
                  {wo.source === 'salesforce' && (
                    <span className="text-xs px-1.5 py-0.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-400 w-fit">SF</span>
                  )}
                  {wo.source === 'platform' && (
                    <span className="text-xs px-1.5 py-0.5 rounded border bg-gray-700 border-gray-600 text-gray-400 w-fit">Manual</span>
                  )}
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="text-xs font-medium text-white truncate group-hover:text-blue-400 transition-colors">{wo.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-500">{wo.droneName}</span>
                    {wo.ernReference && (
                      <span className="text-xs text-blue-400 flex items-center gap-0.5">
                        <ExternalLink className="w-2.5 h-2.5" />
                        {wo.ernReference}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded border', getWorkOrderTypeColor(wo.type))}>
                    {getWorkOrderTypeLabel(wo.type)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded border', getWorkOrderStatusColor(wo.status))}>
                    {getWorkOrderStatusLabel(wo.status)}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={cn('text-xs px-1.5 py-0.5 rounded border', getPriorityColor(wo.priority))}>
                    {wo.priority}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {wo.assignedTech || '—'}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {wo.estimatedHours}h
                  </span>
                </div>
                <div className="col-span-1 flex items-center gap-1.5 relative z-10">
                  <span className={cn('inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border', getSFSyncColor(wo.sfSyncStatus))}>
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', getSFSyncDot(wo.sfSyncStatus))} />
                  </span>
                  {can('add_work_orders') && (
                    <button
                      onClick={e => { e.preventDefault(); setDuplicateSource(wo); }}
                      title="Duplicate to drones"
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-blue-400 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-gray-600 text-right">{sortedFiltered.length} of {allWorkOrders.length} work orders</p>
      </div>

      {showAddModal && (
        <AddWorkOrderModal
          existingWorkOrders={allWorkOrders}
          drones={allDrones}
          subsystems={allSubsystems}
          ecns={allECNs}
          onAdd={newWO => {
            setUserWorkOrders(prev => [...prev, newWO]);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {duplicateSource && (
        <DuplicateWorkOrderModal
          sourceWO={duplicateSource}
          onDuplicate={created => {
            setUserWorkOrders(prev => [...prev, ...created]);
            setDuplicateSource(null);
          }}
          onClose={() => setDuplicateSource(null)}
        />
      )}
    </div>
  );
}
