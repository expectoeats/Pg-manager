'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  ChevronRight,
  Search,
  Building2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavSection {
  title: string;
  items: Array<{
    href: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    badge?: string;
  }>;
}

export const ALL_MENU_SECTIONS: NavSection[] = [
  {
    title: 'Property & Stay',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        description: 'Overview, stats & calendar',
        icon: LayoutDashboard,
        color: '#007AFF',
      },
      {
        href: '/residents',
        label: 'Residents',
        description: 'Active, notice & left members',
        icon: Users,
        color: '#34C759',
      },
      {
        href: '/rooms',
        label: 'Rooms & Beds',
        description: 'Occupancy & room sharing',
        icon: DoorOpen,
        color: '#5856D6',
      },
      {
        href: '/plans',
        label: 'Plans & Food',
        description: 'Room & meal combos',
        icon: ListCheck,
        color: '#AF52DE',
      },
    ],
  },
  {
    title: 'Finance & Billing',
    items: [
      {
        href: '/rent',
        label: 'Rent Collection',
        description: 'Monthly dues & rent generation',
        icon: Receipt,
        color: '#FF9500',
      },
      {
        href: '/payments',
        label: 'Payments Ledger',
        description: 'Transactions & receipts',
        icon: CreditCard,
        color: '#30D158',
      },
      {
        href: '/deposits',
        label: 'Security Deposits',
        description: 'Held, refunds & deductions',
        icon: Wallet,
        color: '#00C7BE',
      },
      {
        href: '/electricity',
        label: 'Electricity Bills',
        description: 'Sub-meters & resident shares',
        icon: Zap,
        color: '#FFCC00',
      },
      {
        href: '/expenses',
        label: 'Expenses Tracker',
        description: 'Groceries, repairs & utility',
        icon: ShoppingCart,
        color: '#FF3B30',
      },
    ],
  },
  {
    title: 'Analytics & Management',
    items: [
      {
        href: '/reports',
        label: 'Financial Reports',
        description: 'Income, profit & occupancy',
        icon: BarChart2,
        color: '#007AFF',
      },
      {
        href: '/activity-log',
        label: 'Activity Log',
        description: 'Audit trail of all actions',
        icon: Clock,
        color: '#636366',
      },
      {
        href: '/settings',
        label: 'PG Settings',
        description: 'Notice days, rent day & rules',
        icon: Settings,
        color: '#8E8E93',
      },
    ],
  },
];

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pgName?: string;
  userName?: string;
  userEmail?: string;
}

export default function MobileMenuSheet({
  open,
  onOpenChange,
  pgName = 'My PG',
  userName = 'Owner',
  userEmail = '',
}: MobileMenuSheetProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = ALL_MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] max-h-[850px] p-0 rounded-t-[32px] flex flex-col overflow-hidden bg-[#F2F2F7] border-t border-[#E5E5EA]"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
      >
        {/* iOS Pull Handle */}
        <div className="pt-3 pb-1 flex justify-center bg-white border-b border-black/[0.04]">
          <div className="w-10 h-1.5 rounded-full bg-[#C7C7CC]" />
        </div>

        {/* Header with PG Info & Search */}
        <div className="px-5 pt-3 pb-4 bg-white border-b border-[#E5E5EA] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                width={36}
                height={36}
                alt="PG Logo"
                className="rounded-xl object-contain flex-shrink-0 shadow-xs"
                priority
              />
              <div>
                <SheetTitle className="text-[17px] font-bold text-[#1C1C1E] tracking-tight">
                  {pgName}
                </SheetTitle>
                <p className="text-[11px] text-[#8E8E93]">Owner Management Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center text-xs font-bold text-[#1C1C1E]">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, rent, bills, reports..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-[#F2F2F7] text-[13px] text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
            />
          </div>
        </div>

        {/* Scrollable Grouped Lists (iOS Inset Grouped Style) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {filteredSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                {section.title}
              </div>

              {/* Inset Grouped Card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E5E5EA] divide-y divide-[#F2F2F7]">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        'flex items-center gap-3.5 px-4 py-3 transition-colors active:bg-[#F2F2F7]',
                        isActive ? 'bg-[#007AFF]/5' : 'hover:bg-[#F9F9FB]'
                      )}
                    >
                      {/* Apple Squircle Icon */}
                      <div
                        className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 text-white shadow-xs"
                        style={{ backgroundColor: item.color }}
                      >
                        <Icon className="w-4 h-4 stroke-[2.2]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              'text-[14px] font-semibold tracking-tight truncate',
                              isActive ? 'text-[#007AFF]' : 'text-[#1C1C1E]'
                            )}
                          >
                            {item.label}
                          </p>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#8E8E93] truncate">
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#C7C7CC] flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Sign Out Action */}
          <div className="pt-2 pb-6 px-1">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-white text-[#FF3B30] font-semibold text-[14px] border border-[#FF3B30]/20 shadow-sm active:scale-[0.99] transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out from PG Manager
            </button>
            <p className="text-center text-[10px] text-[#8E8E93] mt-2">
              Signed in as {userName} ({userEmail || 'Owner'})
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
