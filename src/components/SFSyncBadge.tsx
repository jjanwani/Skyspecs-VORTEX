'use client';

import { cn, getSFSyncColor, getSFSyncDot, getSFSyncLabel } from '@/lib/utils';
import { SFSyncStatus } from '@/lib/types';

interface Props {
  status?: SFSyncStatus;
  sfId?: string;
  sfLastSynced?: string;
  showId?: boolean;
}

export default function SFSyncBadge({ status, sfId, sfLastSynced, showId = false }: Props) {
  const resolved = status ?? 'synced';
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border font-medium', getSFSyncColor(resolved))}>
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', getSFSyncDot(resolved))} />
        {getSFSyncLabel(resolved)}
      </span>
      {showId && sfId && (
        <span className="text-xs text-gray-600 font-mono">{sfId}</span>
      )}
      {sfLastSynced && resolved === 'synced' && (
        <span className="text-xs text-gray-600">
          Last synced {new Date(sfLastSynced).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
