'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plane, Package, ClipboardList, BookOpen, ChevronRight, ChevronLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/drones', label: 'Drones', icon: Plane },
  { href: '/work-orders', label: 'Work Orders', icon: ClipboardList },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/information-hub', label: 'Info Hub', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
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

  return (
    <aside className={cn(
      'bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen transition-all duration-200 flex-shrink-0 overflow-hidden',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="px-3 py-4 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white tracking-wide truncate">SkySpecs</p>
              <p className="text-xs text-gray-400 truncate">Work Order Hub</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Plane className="w-4 h-4 text-white" />
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
