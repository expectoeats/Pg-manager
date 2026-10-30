'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Bell, Search } from 'lucide-react';

interface TopBarProps {
  pgName?: string;
}

export default function TopBar({ pgName }: TopBarProps) {
  const [query, setQuery] = useState('');

  return (
    <header className="h-[60px] bg-white border-b border-[#E5E5EA] flex items-center px-4 md:px-6 gap-3">
      <div className="flex-1 flex items-center">
        <Image src='/logo.png' width={32} height={32} alt='' className='rounded-lg object-contain md:hidden mr-2' />
        <h2 className="font-semibold text-[17px] tracking-[-0.022em] text-[#1C1C1E]">
          {pgName || 'PG Manager'}
        </h2>
      </div>
      <div className="relative flex-1 max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E8E93]" strokeWidth={2} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full bg-[#F2F2F7] border-none pl-10 pr-4 h-9 text-[15px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all duration-200"
          placeholder="Search residents, rooms..."
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 flex items-center justify-center rounded-xl text-[#8E8E93] hover:bg-[#F2F2F7] transition-all duration-200">
          <Bell className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
