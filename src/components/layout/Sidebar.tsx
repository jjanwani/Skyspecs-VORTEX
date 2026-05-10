'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plane, Package, ClipboardList, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/drones', label: 'Drones', icon: Plane },
  { href: '/work-orders', label: 'Work Orders', icon: ClipboardList },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/information-hub', label: 'Information Hub', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">SkySpecs</p>
            <p className="text-xs text-gray-400">Work Order Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

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
    </aside>
  );
}
