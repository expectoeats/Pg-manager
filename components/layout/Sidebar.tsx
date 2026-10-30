'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  ListCheck,
  Receipt,
  CreditCard,
  Wallet,
  Zap,
  ShoppingCart,
  BarChart2,
  Settings,
  Clock,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/residents', label: 'Residents', icon: Users },
  { href: '/rooms', label: 'Rooms', icon: DoorOpen },
  { href: '/plans', label: 'Plans', icon: ListCheck },
  { href: '/rent', label: 'Rent', icon: Receipt },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/deposits', label: 'Deposits', icon: Wallet },
  { href: '/electricity', label: 'Electricity', icon: Zap },
  { href: '/expenses', label: 'Expenses', icon: ShoppingCart },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/activity-log', label: 'Activity Log', icon: Clock },
];

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  // Section groups (display only — link hrefs unchanged)
  const managementItems = navItems.slice(0, 4);
  const financeItems = navItems.slice(4, 9);
  const systemItems = navItems.slice(9);

  const renderLink = (item: (typeof navItems)[number]) => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-[#007AFF] text-white'
            : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4',
            isActive ? 'text-white' : 'text-[#8E8E93]'
          )}
        />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-[#E5E5EA] flex flex-col">
      <div className="px-6 py-5 border-b border-[#E5E5EA]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center">
            <DoorOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[#1C1C1E]">PG Manager</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93]">
          Management
        </p>
        {managementItems.map(renderLink)}
        <p className="px-3 mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93]">
          Finance
        </p>
        {financeItems.map(renderLink)}
        <p className="px-3 mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93]">
          System
        </p>
        {systemItems.map(renderLink)}
      </nav>

      <div className="p-4 border-t border-[#E5E5EA]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#F2F2F7] text-[#1C1C1E] rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold">
              {userName?.charAt(0).toUpperCase() || 'O'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1C1C1E] truncate">
              {userName || 'Owner'}
            </p>
            <p className="text-xs text-[#8E8E93] truncate">{userEmail || ''}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-[#1C1C1E] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
