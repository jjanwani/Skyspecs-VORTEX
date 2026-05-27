'use client';

import { useState, useEffect } from 'react';
import { drones as baseDrones } from '@/lib/data/drones';
import { getStatusTimestamps } from '@/lib/userDataStore';
import { getDroneStatusLabel } from '@/lib/utils';
import { Clock } from 'lucide-react';
import Link from 'next/link';

const SHELF_THRESHOLDS_MS: Record<string, number> = {
  delivered: 2 * 86400000,
  ready_to_redress: 2 * 86400000,
  ready_to_test: 1 * 86400000,
  ready_to_pack: 1 * 86400000,
  ready_to_rca: 3 * 86400000,
  rca_ready_to_redress: 2 * 86400000,
  kit_ingestion: 2 * 86400000,
};

function fmtElapsed(ms: number): string {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h`;
}

export default function LeadTimeAlerts() {
  const [alerts, setAlerts] = useState<{ id: string; name: string; status: string; elapsed: number }[]>([]);

  useEffect(() => {
    const timestamps = getStatusTimestamps();
    const userDrones = JSON.parse(localStorage.getItem('user-drones') || '[]');
    const allDrones = [...baseDrones, ...userDrones];
    const now = Date.now();
    const result: typeof alerts = [];

    allDrones.forEach(d => {
      const ts = timestamps[d.id];
      const status = ts?.status ?? d.status;
      const threshold = SHELF_THRESHOLDS_MS[status];
      if (threshold && ts?.enteredAt) {
        const elapsed = now - new Date(ts.enteredAt).getTime();
        if (elapsed > threshold) {
          result.push({ id: d.id, name: d.name, status, elapsed });
        }
      }
    });

    result.sort((a, b) => b.elapsed - a.elapsed);
    setAlerts(result);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Lead Time Alerts</h2>
        </div>
        <Link href="/drones?view=board" className="text-xs text-blue-400 hover:text-blue-300">View board →</Link>
      </div>
      {alerts.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-gray-500">No drones over wait threshold</p>
          <p className="text-xs text-gray-700 mt-1">Thresholds start tracking when status is changed from this platform</p>
        </div>
      ) : (
        <div className="space-y-0">
          {alerts.slice(0, 6).map(alert => (
            <Link
              key={alert.id}
              href={`/drones/${alert.id}`}
              className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 rounded px-1 -mx-1 transition-colors"
            >
              <div>
                <p className="text-xs font-medium text-white">{alert.name}</p>
                <p className="text-xs text-gray-500">{getDroneStatusLabel(alert.status as never)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-amber-400">{fmtElapsed(alert.elapsed)}</p>
                <p className="text-xs text-gray-600">waiting</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-amber-400">{alerts.length}</p>
          <p className="text-xs text-gray-500">Over Threshold</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-400">{Object.keys(SHELF_THRESHOLDS_MS).length}</p>
          <p className="text-xs text-gray-500">Phases Tracked</p>
        </div>
      </div>
    </div>
  );
}
