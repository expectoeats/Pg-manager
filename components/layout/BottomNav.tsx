'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Receipt, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const bottomNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/residents', label: 'Residents', icon: Users },
  { href: '/rent', label: 'Rent', icon: Receipt },
  { href: '/settings', label: 'More', icon: MoreHorizontal },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex md:hidden">
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors',
              isActive ? 'text-green-600' : 'text-gray-500'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                isActive ? 'text-green-600' : 'text-gray-400'
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
