import Header from '@/components/layout/Header';
import { drones } from '@/lib/data/drones';
import { workOrders } from '@/lib/data/workorders';
import { inventoryItems } from '@/lib/data/inventory';
import {
  Plane, AlertTriangle, ClipboardList, Package, TrendingUp,
  CheckCircle2, Globe2, Wrench, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { getDroneStatusColor, getDroneStatusLabel, getWorkOrderStatusColor, getWorkOrderStatusLabel, getWorkOrderTypeColor, getWorkOrderTypeLabel, cn } from '@/lib/utils';

function KPICard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const totalDrones = drones.length;
  const dronesInField = drones.filter(d => d.status === 'field').length;
  const dronesReady = drones.filter(d => d.status === 'ready_for_deployment').length;
  const dronesReturning = drones.filter(d => d.status === 'returning_field').length;

  const dronesUS = drones.filter(d => d.deploymentRegion === 'US').length;
  const dronesUK = drones.filter(d => d.deploymentRegion === 'UK').length;
  const dronesEU = drones.filter(d => d.deploymentRegion === 'EU').length;
  const dronesCanada = drones.filter(d => d.deploymentRegion === 'Canada').length;

  const openWOs = workOrders.filter(w => w.status === 'open').length;
  const inProgressWOs = workOrders.filter(w => w.status === 'in_progress').length;
  const criticalWOs = workOrders.filter(w => w.priority === 'critical').length;
  const rcaWOs = workOrders.filter(w => w.type === 'rca').length;

  const itemsBelowMin = inventoryItems.filter(i => i.currentCount < i.minQty).length;
  const repurchaseItems = inventoryItems.filter(i => i.repurchaseFlag).length;
  const onOrderItems = inventoryItems.filter(i => i.pipoStatus === 'on_order').length;

  const crashedDrones = drones.filter(d => d.crashHistory > 0).length;
  const rcaCompleted = drones.filter(d => d.rcaCompleted).length;
  const rcaPct = crashedDrones > 0 ? Math.round((rcaCompleted / crashedDrones) * 100) : 100;

  const recentWOs = [...workOrders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const statusGroups = [
    { label: 'In Field', count: dronesInField, bg: 'bg-emerald-500/10 border-emerald-500/20', color: 'text-emerald-400' },
    { label: 'WIP / Redress', count: drones.filter(d => d.status === 'wip_redress').length, bg: 'bg-amber-500/10 border-amber-500/20', color: 'text-amber-400' },
    { label: 'Returning Field', count: dronesReturning, bg: 'bg-purple-500/10 border-purple-500/20', color: 'text-purple-400' },
    { label: 'Flight Status', count: drones.filter(d => d.status === 'flight_status').length, bg: 'bg-blue-500/10 border-blue-500/20', color: 'text-blue-400' },
    { label: 'RCA', count: drones.filter(d => d.status === 'rca').length, bg: 'bg-red-500/10 border-red-500/20', color: 'text-red-400' },
    { label: 'Ready for Deploy', count: dronesReady, bg: 'bg-green-500/10 border-green-500/20', color: 'text-green-400' },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Production & Fleet Overview" />
      <div className="p-6 space-y-6">

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Fleet" value={totalDrones} subtitle={`${dronesInField} deployed`} icon={Plane} color="bg-blue-500/20 text-blue-400" />
          <KPICard title="Open Work Orders" value={openWOs + inProgressWOs} subtitle={`${criticalWOs} critical`} icon={ClipboardList} color="bg-amber-500/20 text-amber-400" />
          <KPICard title="Inventory Alerts" value={itemsBelowMin} subtitle={`${repurchaseItems} flagged for reorder`} icon={Package} color="bg-red-500/20 text-red-400" />
          <KPICard title="RCA Completion" value={`${rcaPct}%`} subtitle={`${rcaCompleted} of ${crashedDrones} recovered`} icon={ShieldAlert} color="bg-purple-500/20 text-purple-400" />
        </div>

        {/* Drone Status + Region + WO Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Drone Status</h2>
              <Link href="/drones" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            <div className="space-y-2">
              {statusGroups.map(g => (
                <div key={g.label} className={`flex items-center justify-between p-2.5 rounded-lg border ${g.bg}`}>
                  <span className="text-xs text-gray-300">{g.label}</span>
                  <span className={`text-sm font-bold ${g.color}`}>{g.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Deployment by Region</h2>
            </div>
            <div className="space-y-3">
              {[
                { region: 'United States', count: dronesUS, goal: 15 },
                { region: 'United Kingdom', count: dronesUK, goal: 8 },
                { region: 'European Union', count: dronesEU, goal: 5 },
                { region: 'Canada', count: dronesCanada, goal: 5 },
              ].map(({ region, count, goal }) => (
                <div key={region}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{region}</span>
                    <span className="text-white font-medium">{count} / {goal}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((count / goal) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-xs">
              <span className="text-gray-400">Total Deployed</span>
              <span className="text-white font-bold">{dronesInField} drones active</span>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Work Order Summary</h2>
              </div>
              <Link href="/work-orders" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Open', value: openWOs, color: 'text-blue-400' },
                { label: 'In Progress', value: inProgressWOs, color: 'text-amber-400' },
                { label: 'Critical', value: criticalWOs, color: 'text-red-400' },
                { label: 'RCA', value: rcaWOs, color: 'text-purple-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-800 space-y-1.5">
              {[
                { label: 'Maintenance', count: workOrders.filter(w => w.type === 'maintenance').length },
                { label: 'Upgrade', count: workOrders.filter(w => w.type === 'upgrade').length },
                { label: 'RCA', count: workOrders.filter(w => w.type === 'rca').length },
              ].map(({ label, count }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Alerts + Recent WOs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Inventory Alerts</h2>
              </div>
              <Link href="/inventory" className="text-xs text-blue-400 hover:text-blue-300">View inventory →</Link>
            </div>
            <div className="space-y-2">
              {inventoryItems
                .filter(i => i.currentCount < i.minQty || i.repurchaseFlag)
                .slice(0, 6)
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-white">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${item.currentCount === 0 ? 'text-red-400' : item.currentCount < item.minQty ? 'text-amber-400' : 'text-blue-400'}`}>
                        {item.currentCount} / {item.minQty} min
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.pipoStatus === 'on_order' ? 'On order' : item.repurchaseFlag ? 'Reorder flagged' : 'Low stock'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-gray-800">
              <div className="text-center">
                <p className="text-lg font-bold text-red-400">{inventoryItems.filter(i => i.currentCount < i.minQty).length}</p>
                <p className="text-xs text-gray-500">Below Min</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">{onOrderItems}</p>
                <p className="text-xs text-gray-500">On Order</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{repurchaseItems}</p>
                <p className="text-xs text-gray-500">Reorder Flag</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <h2 className="text-sm font-semibold text-white">Recent Work Orders</h2>
              </div>
              <Link href="/work-orders" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            <div className="space-y-1">
              {recentWOs.map(wo => (
                <Link
                  key={wo.id}
                  href={`/drones/${wo.droneId}/work-orders/${wo.id}`}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-gray-400">{wo.id}</span>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded border', getWorkOrderTypeColor(wo.type))}>
                        {getWorkOrderTypeLabel(wo.type)}
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium truncate group-hover:text-blue-400 transition-colors">{wo.title}</p>
                    <p className="text-xs text-gray-500">{wo.droneName} · {wo.assignedTech}</p>
                  </div>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded border whitespace-nowrap self-start', getWorkOrderStatusColor(wo.status))}>
                    {getWorkOrderStatusLabel(wo.status)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Fleet Compliance */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white">Fleet Compliance Status</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'ECT-52 Compliant', count: drones.filter(d => d.ectCompliance).length, total: totalDrones, color: 'bg-green-500' },
              { label: 'ECN-199 (NDAA)', count: drones.filter(d => d.ecnCompliance).length, total: totalDrones, color: 'bg-blue-500' },
              { label: 'FAA Registered', count: drones.filter(d => d.faaRegistration).length, total: totalDrones, color: 'bg-purple-500' },
              { label: 'RCA Completed', count: rcaCompleted, total: Math.max(crashedDrones, 1), color: 'bg-amber-500' },
            ].map(({ label, count, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-medium">{count} / {total}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${(count / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
