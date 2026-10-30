'use client';

import { useState } from 'react';
import { Bell, Search } from 'lucide-react';

interface TopBarProps {
  pgName?: string;
}

export default function TopBar({ pgName }: TopBarProps) {
  const [query, setQuery] = useState('');

  return (
    <header className="h-[52px] bg-white border-b border-[#E5E5EA] flex items-center px-4 md:px-6 gap-3">
      <div className="flex-1">
        <h2 className="font-semibold text-[#1C1C1E] text-sm lg:text-base">
          {pgName || 'PG Manager'}
        </h2>
      </div>
      <div className="relative flex-1 max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full bg-[#F2F2F7] border-none pl-9 pr-4 h-9 text-sm text-[#1C1C1E] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
          placeholder="Search residents, rooms..."
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
