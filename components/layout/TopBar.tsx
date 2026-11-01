'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, Settings, X, Building2 } from 'lucide-react';
import MobileMenuSheet from './MobileMenuSheet';

interface TopBarProps {
  pgName?: string;
  userName?: string;
  userEmail?: string;
}

export default function TopBar({
  pgName = 'PG Manager',
  userName = 'Owner',
  userEmail = '',
}: TopBarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/residents?q=${encodeURIComponent(query.trim())}`);
      setIsMobileSearchOpen(false);
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 h-14 md:h-[60px] border-b transition-all flex items-center px-3.5 sm:px-4 md:px-6 gap-2.5 sm:gap-3"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
      >
        {/* Left: Mobile Menu Trigger + Logo + PG Name */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-[#1C1C1E] hover:bg-[#F2F2F7] active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <Image
              src="/logo.png"
              width={28}
              height={28}
              alt="PG Logo"
              className="rounded-lg object-contain md:hidden flex-shrink-0"
              priority
            />
            <h2 className="font-bold text-[15px] sm:text-[17px] tracking-tight text-[#1C1C1E] truncate">
              {pgName}
            </h2>
          </Link>
        </div>

        {/* Center: Desktop Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex relative flex-1 max-w-md mx-auto"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full bg-[#F2F2F7] border-none pl-9 pr-4 h-9 text-[13px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
            placeholder="Search residents, rooms, rent..."
          />
        </form>

        {/* Right Actions: Mobile Search Toggle + Settings/Profile */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Mobile Search Icon button */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl text-[#1C1C1E] hover:bg-[#F2F2F7] active:scale-95 transition-all"
            aria-label="Toggle Search"
          >
            {isMobileSearchOpen ? (
              <X className="w-4 h-4 stroke-[2.2]" />
            ) : (
              <Search className="w-4 h-4 stroke-[2.2]" />
            )}
          </button>

          {/* Quick Settings Shortcut */}
          <Link
            href="/settings"
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F2F2F7] active:scale-95 transition-all"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 stroke-[2]" />
          </Link>

          {/* Avatar Initial */}
          <Link
            href="/settings"
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#0055CC] text-white flex items-center justify-center text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            {userName.charAt(0).toUpperCase()}
          </Link>
        </div>
      </header>

      {/* Mobile Expandable Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-3.5 py-2 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl bg-[#F2F2F7] border-none pl-9 pr-8 h-10 text-[14px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
              placeholder="Search residents, rooms..."
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      <MobileMenuSheet
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        pgName={pgName}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  );
}
