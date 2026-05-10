'use client';

import { Bell, Search, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  );
}
