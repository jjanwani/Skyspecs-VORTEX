import Header from '@/components/layout/Header';
import { drones } from '@/lib/data/drones';
import { workOrders } from '@/lib/data/workorders';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getDroneStatusColor, getDroneStatusLabel,
  getWorkOrderStatusColor, getWorkOrderStatusLabel,
  getWorkOrderTypeColor, getWorkOrderTypeLabel,
  getPriorityColor, formatDate, cn
} from '@/lib/utils';
import {
  Plane, ArrowLeft, CheckCircle2, XCircle, Clock, MapPin,
  User, AlertTriangle, ClipboardList, ExternalLink
} from 'lucide-react';

function ComplianceBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium',
      ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'
    )}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </div>
  );
}

export default async function DroneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const drone = drones.find(d => d.id === id);
  if (!drone) notFound();

  const droneWOs = workOrders.filter(w => w.droneId === drone.id);
  const openWOs = droneWOs.filter(w => w.status !== 'completed');
  const completedWOs = droneWOs.filter(w => w.status === 'completed');

  return (
    <div>
      <Header title={drone.name} subtitle={`${drone.version} · ${getDroneStatusLabel(drone.status)}`} />
      <div className="p-6 space-y-6">

        {/* Back + Status */}
        <div className="flex items-center gap-3">
          <Link href="/drones" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            All Drones
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-xs text-white font-medium">{drone.name}</span>
          <span className={cn('ml-auto text-xs px-2.5 py-1 rounded-lg border font-medium', getDroneStatusColor(drone.status))}>
            {getDroneStatusLabel(drone.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Drone Info Panel */}
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{drone.name}</h2>
                  <p className="text-xs text-gray-400">{drone.serialNumber}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Build Version</span>
                  <span className="text-white font-medium">{drone.buildVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="text-white flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {drone.location}
                  </span>
                </div>
                {drone.assignedTech && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned Tech</span>
                    <span className="text-white flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {drone.assignedTech}
                    </span>
                  </div>
                )}
                {drone.deploymentRegion && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Region</span>
                    <span className="text-white">{drone.deploymentRegion}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Flight Hours</span>
                  <span className="text-white flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {drone.totalFlightHours} hrs
                  </span>
                </div>
                {drone.crashHistory > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Crashes</span>
                    <span className={cn('flex items-center gap-1', drone.rcaCompleted ? 'text-green-400' : 'text-red-400')}>
                      <AlertTriangle className="w-3 h-3" />
                      {drone.crashHistory} · RCA {drone.rcaCompleted ? 'complete' : 'pending'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Compliance Status</h3>
              <div className="space-y-2">
                <ComplianceBadge label="ECT-52 (7075)" ok={drone.ectCompliance} />
                <ComplianceBadge label="ECN-199 (NDAA)" ok={drone.ecnCompliance} />
                <ComplianceBadge label="FAA Registration" ok={drone.faaRegistration} />
              </div>
            </div>

            {/* Notes */}
            {drone.notes && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-xs text-amber-400 font-medium mb-1">Notes</p>
                <p className="text-xs text-amber-300">{drone.notes}</p>
              </div>
            )}
          </div>

          {/* Work Orders Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-400" />
                Work Orders
                {openWOs.length > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full">
                    {openWOs.length} open
                  </span>
                )}
              </h2>
            </div>

            {droneWOs.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <p className="text-gray-500 text-sm">No work orders for this drone.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {droneWOs.map(wo => (
                  <Link
                    key={wo.id}
                    href={`/drones/${drone.id}/work-orders/${wo.id}`}
                    className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs text-gray-500 font-mono">{wo.id}</span>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded border', getWorkOrderTypeColor(wo.type))}>
                            {getWorkOrderTypeLabel(wo.type)}
                          </span>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded border', getPriorityColor(wo.priority))}>
                            {wo.priority}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{wo.title}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={cn('text-xs px-2 py-1 rounded-lg border whitespace-nowrap', getWorkOrderStatusColor(wo.status))}>
                          {getWorkOrderStatusLabel(wo.status)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{wo.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {wo.assignedTech && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {wo.assignedTech}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{wo.estimatedHours}h est
                      </span>
                      {wo.previousOccurrences > 0 && (
                        <span className="text-amber-400">
                          Seen {wo.previousOccurrences}x before
                        </span>
                      )}
                      {wo.ernReference && (
                        <span className="text-blue-400 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {wo.ernReference}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
