'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { ecns as baseECNs } from '@/lib/data/ecns';
import { drones as baseDrones } from '@/lib/data/drones';
import { workOrders as baseWorkOrders } from '@/lib/data/workorders';
import { SEED_GIMBALS, SEED_ASSET_SUBSYSTEMS } from '@/lib/data/subsystems';
import { EngineeringChangeNotice, WorkOrder, Drone, Subsystem } from '@/lib/types';
import { getUserECNs, getUserDrones, getUserWorkOrders, saveUserWorkOrders, getUserSubsystems } from '@/lib/userDataStore';
import { getECNActionColor, getECNActionLabel, getWorkOrderStatusColor, getWorkOrderStatusLabel, formatDate, cn } from '@/lib/utils';
import { getSubsystemTypeName } from '@/lib/subsystemTree';
import { ArrowLeft, FileWarning, Package, Plane, Zap, CheckCircle2, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ECNDetailClient({ id }: { id: string }) {
  const { can } = useAuth();
  const [ready, setReady] = useState(false);
  const [ecn, setEcn] = useState<EngineeringChangeNotice | null>(null);
  const [allDrones, setAllDrones] = useState<Drone[]>(baseDrones);
  const [allSubsystems, setAllSubsystems] = useState<Subsystem[]>([...SEED_GIMBALS, ...SEED_ASSET_SUBSYSTEMS]);
  const [allWorkOrders, setAllWorkOrders] = useState<WorkOrder[]>(baseWorkOrders);
  const [generated, setGenerated] = useState<WorkOrder[]>([]);

  useEffect(() => {
    const userECNs = getUserECNs();
    const found = [...baseECNs, ...userECNs].find(e => e.id === id) ?? null;
    setEcn(found);
    setAllDrones([...baseDrones, ...getUserDrones()]);
    setAllSubsystems([...SEED_GIMBALS, ...SEED_ASSET_SUBSYSTEMS, ...getUserSubsystems()]);
    setAllWorkOrders([...baseWorkOrders, ...getUserWorkOrders()]);
    setReady(true);
  }, [id]);

  const affected = useMemo(() => {
    if (!ecn) return [];
    const byDrone = new Map<string, Subsystem[]>();
    for (const s of allSubsystems) {
      if (!s.droneId || !ecn.affectedSubsystemTypeIds.includes(s.typeId)) continue;
      const list = byDrone.get(s.droneId) ?? [];
      list.push(s);
      byDrone.set(s.droneId, list);
    }
    return Array.from(byDrone.entries()).map(([droneId, subsystems]) => ({
      drone: allDrones.find(d => d.id === droneId),
      droneId,
      subsystems,
    })).filter(a => a.drone);
  }, [ecn, allSubsystems, allDrones]);

  if (!ready) return <div className="p-6 text-gray-500 text-sm">Loading...</div>;

  if (!ecn) return (
    <div className="p-6 text-center py-20">
      <FileWarning className="w-10 h-10 text-gray-700 mx-auto mb-3" />
      <p className="text-white font-medium mb-1">ECN not found</p>
      <p className="text-gray-500 text-sm mb-4">No ECN with ID "{id}" exists.</p>
      <Link href="/ecns" className="text-blue-400 hover:text-blue-300 text-sm">← Back to ECNs</Link>
    </div>
  );

  const linkedWorkOrders = allWorkOrders.filter(w => w.ecnId === ecn.id);

  const generateWorkOrders = () => {
    const now = new Date().toISOString();
    const newWOs: WorkOrder[] = [];
    affected.forEach(({ drone, droneId, subsystems }) => {
      if (!drone) return;
      const alreadyExists = allWorkOrders.some(w => w.ecnId === ecn.id && w.droneId === droneId);
      if (alreadyExists) return;
      newWOs.push({
        id: `WO-U-${Date.now().toString().slice(-6)}-${droneId}`,
        droneId,
        droneName: drone.name,
        title: `${ecn.id}: ${ecn.title}`,
        description: ecn.description,
        type: 'upgrade',
        status: 'open',
        priority: 'medium',
        assignedTech: '',
        createdAt: now,
        updatedAt: now,
        estimatedHours: 1,
        previousOccurrences: 0,
        ecnId: ecn.id,
        subsystemId: subsystems[0]?.id,
        parts: ecn.partsAffected,
        source: 'platform',
        sfSyncStatus: 'pending',
        sfObject: 'WorkOrder',
      });
    });
    if (newWOs.length === 0) return;
    const existingUserWOs = getUserWorkOrders();
    saveUserWorkOrders([...existingUserWOs, ...newWOs]);
    setAllWorkOrders(prev => [...prev, ...newWOs]);
    setGenerated(newWOs);
  };

  const pendingCount = affected.filter(a => !allWorkOrders.some(w => w.ecnId === ecn.id && w.droneId === a.droneId)).length;

  return (
    <div>
      <Header title={ecn.id} subtitle={ecn.title} />
      <div className="p-6 space-y-6">
        <Link href="/ecns" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> All ECNs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 font-mono">{ecn.id}</span>
                <span className={cn('text-xs px-2 py-1 rounded-lg border font-medium', getECNActionColor(ecn.actionType))}>
                  {getECNActionLabel(ecn.actionType)}
                </span>
                {ecn.affectedSubsystemTypeIds.map(t => (
                  <span key={t} className="text-xs px-2 py-1 rounded-lg border bg-gray-800 border-gray-700 text-gray-400">
                    {getSubsystemTypeName(t)}
                  </span>
                ))}
              </div>
              <h2 className="text-lg font-bold text-white mb-2">{ecn.title}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{ecn.description}</p>
              {ecn.notes && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-300 leading-relaxed">{ecn.notes}</p>
                </div>
              )}
            </div>

            {ecn.partsAffected && ecn.partsAffected.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" /> Parts Affected
                </h3>
                <div className="space-y-1">
                  {ecn.partsAffected.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0 text-sm">
                      <span className="text-white">{p.name}</span>
                      <span className="text-gray-500">× {p.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plane className="w-4 h-4 text-blue-400" /> Affected Drones
                  <span className="text-xs text-gray-500 font-normal">{affected.length}</span>
                </h3>
                {can('add_work_orders') && affected.length > 0 && (
                  <button
                    onClick={generateWorkOrders}
                    disabled={pendingCount === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-white transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {pendingCount === 0 ? 'Work orders generated' : `Generate ${pendingCount} Work Order${pendingCount !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>

              {generated.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Generated {generated.length} work order{generated.length !== 1 ? 's' : ''}
                </div>
              )}

              {affected.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-6">No drones currently have a matching subsystem recorded.</p>
              ) : (
                <div className="space-y-2">
                  {affected.map(({ drone, droneId, subsystems }) => {
                    const existingWO = allWorkOrders.find(w => w.ecnId === ecn.id && w.droneId === droneId);
                    return (
                      <div key={droneId} className="flex items-center justify-between gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <div className="min-w-0">
                          <Link href={`/drones/${droneId}`} className="text-sm text-white hover:text-blue-400 transition-colors font-medium">{drone?.name}</Link>
                          <p className="text-xs text-gray-500 truncate">{subsystems.map(s => getSubsystemTypeName(s.typeId)).join(', ')}</p>
                        </div>
                        {existingWO ? (
                          <Link href={`/drones/${droneId}/work-orders/${existingWO.id}`} className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={cn('text-xs px-2 py-0.5 rounded border', getWorkOrderStatusColor(existingWO.status))}>
                              {getWorkOrderStatusLabel(existingWO.status)}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-600 flex-shrink-0">No work order yet</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Details</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created by</span>
                  <span className="text-white">{ecn.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-white">{formatDate(ecn.createdAt)}</span>
                </div>
                {ecn.externalStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="text-white">{ecn.externalStatus}</span>
                  </div>
                )}
              </div>
            </div>

            {linkedWorkOrders.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-400" /> Linked Work Orders
                </h3>
                <div className="space-y-2">
                  {linkedWorkOrders.map(w => (
                    <Link key={w.id} href={`/drones/${w.droneId}/work-orders/${w.id}`} className="block p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-white truncate">{w.droneName}</span>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded border flex-shrink-0', getWorkOrderStatusColor(w.status))}>
                          {getWorkOrderStatusLabel(w.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
