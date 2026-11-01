'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  Receipt,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MobileMenuSheet from './MobileMenuSheet';

interface BottomNavProps {
  pgName?: string;
  userName?: string;
  userEmail?: string;
}

export default function BottomNav({
  pgName = 'My PG',
  userName = 'Owner',
  userEmail = '',
}: BottomNavProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainTabs = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/residents', label: 'Residents', icon: Users },
    { href: '/rooms', label: 'Rooms', icon: DoorOpen },
    { href: '/rent', label: 'Rent', icon: Receipt },
  ];

  // Check if current route is a "More" route (not one of the primary 4)
  const isMoreActive =
    !mainTabs.some(
      (t) =>
        pathname === t.href ||
        (t.href !== '/dashboard' && pathname.startsWith(t.href))
    );

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around h-16 px-1 border-t transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(25px) saturate(180%)',
          WebkitBackdropFilter: 'blur(25px) saturate(180%)',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          boxShadow: '0 -1px 4px rgba(0, 0, 0, 0.02)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
      >
        {/* Main 4 Navigation Tabs */}
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all duration-150 active:scale-90',
                isActive ? 'text-[#007AFF]' : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              )}
            >
              <div className="relative">
                <Icon
                  className="w-5 h-5 transition-transform"
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#007AFF]" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight',
                  isActive ? 'font-semibold' : 'font-medium'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* 5th Tab: "More" Menu Trigger (Opens Apple Sheet) */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all duration-150 active:scale-90 cursor-pointer',
            isMoreActive || isMenuOpen
              ? 'text-[#007AFF]'
              : 'text-[#8E8E93] hover:text-[#1C1C1E]'
          )}
          aria-label="Open More Menus"
        >
          <div className="relative">
            <MoreHorizontal
              className="w-5 h-5 transition-transform"
              strokeWidth={isMoreActive || isMenuOpen ? 2.4 : 1.8}
            />
            {(isMoreActive || isMenuOpen) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#007AFF]" />
            )}
          </div>
          <span
            className={cn(
              'text-[10px] tracking-tight',
              isMoreActive || isMenuOpen ? 'font-semibold' : 'font-medium'
            )}
          >
            More
          </span>
        </button>
      </nav>

      {/* Apple iOS Menu Sheet with All Pages */}
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
