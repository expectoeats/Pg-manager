'use client';

import { Bell } from 'lucide-react';

interface TopBarProps {
  pgName?: string;
}

export default function TopBar({ pgName }: TopBarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
      <div className="flex-1">
        <h2 className="font-semibold text-gray-900 text-sm lg:text-base">
          {pgName || 'PG Manager'}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </header>
  );
}
