'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Search, X, Plane, ClipboardList, Package, Settings, LogOut, AlertTriangle, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import { drones as baseDrones } from '@/lib/data/drones';
import { workOrders as baseWorkOrders } from '@/lib/data/workorders';
import { inventoryItems as baseInventory } from '@/lib/data/inventory';
import { cn, getDroneStatusLabel, getWorkOrderStatusLabel, getPIPOStatusLabel, getPIPOStatusColor, getWorkOrderStatusColor } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStatusTimestamps } from '@/lib/userDataStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface SearchResult {
  type: 'drone' | 'workorder' | 'inventory';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

interface Notification {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  subtitle: string;
  href: string;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

export default function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();
  const { user, logout, can } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [allDrones, setAllDrones] = useState(baseDrones);
  const [allWorkOrders, setAllWorkOrders] = useState(baseWorkOrders);
  const [allInventory, setAllInventory] = useState(baseInventory);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(searchRef, () => { setSearchOpen(false); setSearchQuery(''); });

  useEffect(() => {
    try {
      const ud = localStorage.getItem('user-drones');
      if (ud) setAllDrones([...baseDrones, ...JSON.parse(ud)]);
      const uw = localStorage.getItem('user-workorders');
      if (uw) setAllWorkOrders([...baseWorkOrders, ...JSON.parse(uw)]);
      const ui = localStorage.getItem('user-inventory');
      if (ui) setAllInventory([...baseInventory, ...JSON.parse(ui)]);
    } catch {}
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const runSearch = useCallback((q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase();
    const results: SearchResult[] = [];

    allDrones.forEach(d => {
      if (d.name.toLowerCase().includes(lower) || d.id.toLowerCase().includes(lower) ||
          d.assignedTech?.toLowerCase().includes(lower) || d.location?.toLowerCase().includes(lower)) {
        results.push({
          type: 'drone', id: d.id,
          title: d.name,
          subtitle: `${getDroneStatusLabel(d.status)} · ${d.location ?? 'No location'}`,
          href: `/drones/${d.id}`,
          badge: getDroneStatusLabel(d.status),
        });
      }
    });

    allWorkOrders.forEach(wo => {
      if (wo.title.toLowerCase().includes(lower) || wo.droneName.toLowerCase().includes(lower) ||
          wo.assignedTech.toLowerCase().includes(lower) || wo.ernReference?.toLowerCase().includes(lower)) {
        results.push({
          type: 'workorder', id: wo.id,
          title: wo.title,
          subtitle: `${wo.droneName} · ${wo.assignedTech}`,
          href: `/drones/${wo.droneId}/work-orders/${wo.id}`,
          badge: getWorkOrderStatusLabel(wo.status),
          badgeColor: getWorkOrderStatusColor(wo.status),
        });
      }
    });

    allInventory.forEach(item => {
      if (item.name.toLowerCase().includes(lower) || item.category.toLowerCase().includes(lower) ||
          item.location?.toLowerCase().includes(lower)) {
        results.push({
          type: 'inventory', id: item.id,
          title: item.name,
          subtitle: `${item.category} · ${item.location ?? 'No location'}`,
          href: '/inventory',
          badge: getPIPOStatusLabel(item.pipoStatus),
          badgeColor: getPIPOStatusColor(item.pipoStatus),
        });
      }
    });

    setSearchResults(results.slice(0, 12));
  }, [allDrones, allWorkOrders, allInventory]);

  useEffect(() => { runSearch(searchQuery); }, [searchQuery, runSearch]);

  // Generate notifications from live data
  const notifications: Notification[] = [];
  allInventory.forEach(item => {
    if (item.currentCount < item.minQty) {
      notifications.push({
        id: `inv-low-${item.id}`,
        type: item.currentCount === 0 ? 'critical' : 'warning',
        title: `Low stock: ${item.name}`,
        subtitle: `${item.currentCount} remaining (minimum ${item.minQty})`,
        href: '/inventory',
      });
    }
  });
  allWorkOrders.forEach(wo => {
    if (wo.priority === 'critical' && wo.status !== 'completed') {
      notifications.push({
        id: `wo-crit-${wo.id}`,
        type: 'critical',
        title: `Critical work order: ${wo.title}`,
        subtitle: `${wo.droneName} · ${getWorkOrderStatusLabel(wo.status)}`,
        href: `/drones/${wo.droneId}/work-orders/${wo.id}`,
      });
    }
  });
  // Wait-time alerts: drones sitting in "ready" statuses too long
  const WAIT_THRESHOLDS_MS: Partial<Record<string, number>> = {
    ready_to_redress: 2 * 86400000,
    ready_to_test: 1 * 86400000,
    ready_to_pack: 1 * 86400000,
    ready_to_rca: 3 * 86400000,
    rca_ready_to_redress: 2 * 86400000,
    delivered: 3 * 86400000,
    kit_ingestion: 2 * 86400000,
  };

  if (typeof window !== 'undefined') {
    const timestamps = getStatusTimestamps();
    const now = Date.now();
    allDrones.forEach(d => {
      const ts = timestamps[d.id];
      const status = ts?.status ?? d.status;
      const threshold = WAIT_THRESHOLDS_MS[status];
      if (threshold && ts?.enteredAt) {
        const elapsed = now - new Date(ts.enteredAt).getTime();
        if (elapsed > threshold) {
          const days = Math.floor(elapsed / 86400000);
          const hours = Math.floor((elapsed % 86400000) / 3600000);
          notifications.push({
            id: `wait-${d.id}`,
            type: 'warning',
            title: `Wait time alert: ${d.name}`,
            subtitle: `${getDroneStatusLabel(status as never)} for ${days > 0 ? `${days}d ` : ''}${hours}h`,
            href: `/drones/${d.id}`,
          });
        }
      }
      if (d.status === 'ready_to_rca' || d.status === 'engineering_rca') {
        notifications.push({
          id: `drone-rca-${d.id}`,
          type: 'critical',
          title: `RCA in progress: ${d.name}`,
          subtitle: d.notes ?? 'Root cause analysis pending',
          href: `/drones/${d.id}`,
        });
      }
    });
  }

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authenticated');
    router.push('/login');
  };

  const typeIcon = (type: SearchResult['type']) => {
    if (type === 'drone') return <Plane className="w-3.5 h-3.5 text-blue-400" />;
    if (type === 'workorder') return <ClipboardList className="w-3.5 h-3.5 text-amber-400" />;
    return <Package className="w-3.5 h-3.5 text-green-400" />;
  };

  return (
    <>
      <header className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-base font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1">
          {/* SF connection indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mr-1" title="Salesforce connected · bi-directional sync active">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">SF Live</span>
          </div>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-gray-500">Search</span>
            <kbd className="hidden sm:inline text-gray-600 text-xs">⌘K</kbd>
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Notifications</span>
                  <span className="text-xs text-gray-500">{notifications.length} alerts</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No alerts right now</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
                    {notifications.map(n => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors"
                      >
                        <AlertTriangle className={cn('w-4 h-4 mt-0.5 flex-shrink-0', n.type === 'critical' ? 'text-red-400' : 'text-amber-400')} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white leading-snug">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{n.subtitle}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
              className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {user?.name.charAt(0) ?? '?'}
              </div>
              {user && (
                <span className="hidden sm:inline text-xs text-gray-300">{user.name.split(' ')[0]}</span>
              )}
            </button>

            {profileOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <span className={cn('inline-block mt-1 text-xs px-2 py-0.5 rounded border font-medium', ROLE_COLORS[user.role])}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  {can('manage_users') && (
                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div ref={searchRef} className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search drones, work orders, inventory…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="p-1 text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {searchQuery && (
              <div className="max-h-96 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-gray-500">No results for "{searchQuery}"</div>
                ) : (
                  <div className="p-2 space-y-0.5">
                    {searchResults.map(r => (
                      <Link
                        key={`${r.type}-${r.id}`}
                        href={r.href}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors group"
                      >
                        <div className="w-7 h-7 bg-gray-800 group-hover:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          {typeIcon(r.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{r.title}</p>
                          <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>
                        </div>
                        {r.badge && (
                          <span className={cn('text-xs px-2 py-0.5 rounded border flex-shrink-0', r.badgeColor ?? 'bg-gray-700 border-gray-600 text-gray-300')}>
                            {r.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!searchQuery && (
              <div className="px-4 py-6 text-center text-xs text-gray-600">
                Type to search across drones, work orders, and inventory
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
