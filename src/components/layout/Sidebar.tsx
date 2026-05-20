'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Plane, Package, ClipboardList, BookOpen, ChevronRight, ChevronLeft, Menu, Settings, LogOut } from 'lucide-react';

function DroneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
      <line x1="9" y1="9" x2="5" y2="5" />
      <line x1="15" y1="9" x2="19" y2="5" />
      <line x1="9" y1="15" x2="5" y2="19" />
      <line x1="15" y1="15" x2="19" y2="19" />
      <circle cx="3.5" cy="3.5" r="2" />
      <circle cx="20.5" cy="3.5" r="2" />
      <circle cx="3.5" cy="20.5" r="2" />
      <circle cx="20.5" cy="20.5" r="2" />
    </svg>
  );
}
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/drones', label: 'Drones', icon: Plane },
  { href: '/work-orders', label: 'Work Orders', icon: ClipboardList },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/information-hub', label: 'Info Hub', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed(c => {
      localStorage.setItem('sidebar-collapsed', String(!c));
      return !c;
    });
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authenticated');
    router.push('/login');
  };

  const navItems = [
    ...NAV_ITEMS,
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ];

  return (
    <aside className={cn(
      'bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen transition-all duration-200 flex-shrink-0 overflow-hidden',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="px-3 py-4 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <DroneIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white tracking-wide truncate">VORTEX</p>
              <p className="text-xs text-gray-400 truncate">by SkySpecs</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <DroneIcon className="w-4 h-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={toggle}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={toggle}
          className="mx-auto mt-3 p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn('border-t border-gray-800', collapsed ? 'p-2' : 'p-3')}>
        {!collapsed && user && (
          <div
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg mb-2',
              user.role === 'admin' ? 'cursor-pointer hover:bg-gray-800 transition-colors' : ''
            )}
            onClick={() => user.role === 'admin' && router.push('/admin')}
          >
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <span className={cn('text-xs px-1.5 py-0.5 rounded border font-medium', ROLE_COLORS[user.role])}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        )}
        {collapsed && user && (
          <div
            className={cn(
              'w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mx-auto text-sm font-bold text-white mb-2',
              user.role === 'admin' ? 'cursor-pointer hover:bg-gray-600 transition-colors' : ''
            )}
            title={user.name}
            onClick={() => user.role === 'admin' && router.push('/admin')}
          >
            {user.name.charAt(0)}
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Sign out"
          className={cn(
            'flex items-center gap-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs',
            collapsed ? 'w-full justify-center p-2' : 'w-full px-2 py-1.5'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="text-xs text-gray-500">
            <p className="font-medium text-gray-400 mb-1">Integrations</p>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Slack
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Salesforce
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Google Drive
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
