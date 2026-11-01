# Calendar Enhancement Implementation Plan

## Overview
This plan enhances the resident calendar UI to be more compact and interactive, and adds a new dashboard calendar showing PG-wide events. Both calendars share Apple-style design language with glassmorphism, smooth animations (CSS only, no framer-motion), and interactive features.

## Context
- **Workspace**: c:\Users\Adarsh\Desktop\agency\demo-demand\PG
- **Framework**: Next.js 16.4.3 (App Router) + TypeScript + Mongoose
- **No framer-motion**: Use CSS transitions only (transition-all duration-200)
- **Model imports**: Must use `void Model;` pattern to prevent Turbopack tree-shaking
- **Build command**: `npm run build`
- **Dev server**: `npm run dev` (port 3001)

## Part 1: Enhance ResidentCalendar Component

### Files to modify
- `components/residents/ResidentCalendar.tsx`

### Changes

#### 1. Reduce calendar size (30-40% smaller)
**Location**: Calendar grid and date cells
- Change date cell padding: `p-3` → `p-1.5`
- Reduce date number text: current → `text-sm font-semibold`
- Reduce header `mb-6` → `mb-4`
- Reduce calendar grid `gap-2` → `gap-1`
- Reduce card content `pt-6` → `pt-4`

#### 2. Replace badges with event dots
**Location**: Inside date cell map, replace current event rendering
- Remove large badges and replace with max 3 colored dots per cell
- Dots: `w-2 h-2 rounded-full` with `backgroundColor: EVENT_COLORS[event.type]`
- Position at bottom of cell: `<div className="flex items-center justify-center gap-0.5 flex-wrap">`
- Show overflow: `{events.length > 3 && <span className="text-[9px] text-[#8E8E93] ml-0.5">+{events.length - 3}</span>}`

#### 3. Enhance hover tooltip (already exists)
**Location**: `renderTooltip()` function
- Keep existing logic but ensure `transition-all duration-200` on tooltip div
- Tooltip already positioned correctly with fixed positioning

#### 4. Add click interaction with Sheet
**Location**: Add new state and Sheet component at end
```typescript
const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [selectedDateEvents, setSelectedDateEvents] = useState<ClientCalendarEvent[]>([]);
```
- Import Sheet components: `import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';`
- Add onClick to date cells: `onClick={() => { if (events.length > 0) { setSelectedDate(dateKey); setSelectedDateEvents(events); } }}`
- Render Sheet at component end (after tooltip):
```tsx
<Sheet open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
  <SheetContent side="right" className="w-full sm:max-w-md">
    <SheetHeader>
      <SheetTitle>Events on {selectedDate && formatDateIST(selectedDate)}</SheetTitle>
    </SheetHeader>
    <div className="mt-4 space-y-3">
      {selectedDateEvents.map((event, idx) => (
        // Render full event details with icon, type, data, link to resident if applicable
      ))}
    </div>
  </SheetContent>
</Sheet>
```

#### 5. Add cell hover animation
**Location**: Date cell div className
- Add: `hover:scale-[1.03] hover:shadow-md transition-all duration-200`
- Ensure applied to the main date cell div

#### 6. Enhance today highlight
**Location**: Date cell div for `isToday` case
- Add: `ring-2 ring-[#007AFF] ring-offset-1 animate-pulse`

#### 7. Apply glassmorphism to calendar container
**Location**: Outer Card wrapper around calendar
- Replace current Card className with: `bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)] rounded-2xl`

#### 8. Refactor summary panel
**Location**: Summary Card (right column in grid)
- Convert single column layout to horizontal row of 4 compact cards
- Each stat card: 
```tsx
<div className="p-3 rounded-xl bg-gradient-to-br from-[#007AFF]/10 to-[#007AFF]/5">
  <div className="text-xs text-[#8E8E93]">Days Stayed</div>
  <div className="text-xl font-semibold text-[#1C1C1E]">{daysStayed}</div>
</div>
```
- Apply appropriate gradient colors per stat (blue, red, purple, orange)

#### 9. Add mobile swipe navigation
**Location**: Calendar grid div
- Add state: `const [touchStart, setTouchStart] = useState(0); const [touchEnd, setTouchEnd] = useState(0);`
- Add handlers:
```typescript
onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
onTouchEnd={(e) => {
  setTouchEnd(e.changedTouches[0].clientX);
  const distance = touchStart - e.changedTouches[0].clientX;
  if (Math.abs(distance) > 50) {
    distance > 0 ? goToNextMonth() : goToPreviousMonth();
  }
}}
```

#### 10. Add week view toggle (mobile only)
**Location**: Above calendar grid, below header
- Add state: `const [viewMode, setViewMode] = useState<'month' | 'week'>('month');`
- Add toggle buttons:
```tsx
<div className="flex gap-2 mb-3 lg:hidden">
  <Button variant={viewMode === 'month' ? 'default' : 'outline'} onClick={() => setViewMode('month')}>Month</Button>
  <Button variant={viewMode === 'week' ? 'default' : 'outline'} onClick={() => setViewMode('week')}>Week</Button>
</div>
```
- Filter calendarDays: `const displayDays = viewMode === 'week' ? calendarDays.slice(0, 7) : calendarDays;`

#### 11. Update color scheme
**Location**: EVENT_COLORS constant
```typescript
const EVENT_COLORS = {
  joining: '#34C759',
  rent_pending: '#FF3B30',
  rent_due: '#FF9500',
  payment: '#30D158',
  notice: '#FF9500',
  leaving: '#FF9500',
  plan_change: '#007AFF',
  electricity: '#5856D6',
};
```

### Verification
- Run `npm run build` → should compile successfully
- Run `npm run dev` → navigate to any resident profile → Timeline tab
- Verify calendar is smaller, uses dots, hover shows tooltip, click opens sheet
- Test mobile: swipe to change month, toggle week view

---

## Part 2: Create DashboardCalendar Component

### Files to create
- `lib/services/dashboard-calendar.ts`
- `components/dashboard/DashboardCalendar.tsx`

### Files to modify
- `app/(dashboard)/dashboard/page.tsx`

### 1. Create dashboard-calendar.ts server action

**File**: `lib/services/dashboard-calendar.ts`

```typescript
'use server';

import connectDB from '@/lib/db';
import Resident from '@/models/Resident';
import Room from '@/models/Room';
import Bed from '@/models/Bed';
import RentRecord from '@/models/RentRecord';
import Payment from '@/models/Payment';
import ElectricityBill from '@/models/ElectricityBill';
import Deposit from '@/models/Deposit';
import PlanHistory from '@/models/PlanHistory';
import Settings from '@/models/Settings';

// Prevent tree-shaking
void Room;
void Bed;
void RentRecord;
void Payment;
void ElectricityBill;
void Deposit;
void PlanHistory;
void Settings;

export interface PaymentDayData {
  date: string; // YYYY-MM-DD
  count: number;
  amount: number;
}

export interface RentDueDayData {
  date: string;
  count: number;
  amount: number;
  residents: { name: string; amount: number; id: string }[];
}

export interface CheckoutDayData {
  date: string;
  count: number;
  residents: { name: string; room: string; id: string }[];
}

export interface CheckinDayData {
  date: string;
  count: number;
  residents: { name: string; room: string; id: string }[];
}

export interface NoticeDayData {
  date: string;
  count: number;
  residents: { name: string; id: string }[];
}

export interface DepositRefundDayData {
  date: string;
  count: number;
  amount: number;
}

export interface TodaySummary {
  paymentsExpected: number;
  paymentsAmount: number;
  checkouts: number;
  checkins: number;
  pendingRentCount: number;
  pendingRentAmount: number;
}

export interface HeatmapDayData {
  date: string;
  score: number;
}

export interface DashboardCalendarData {
  paymentsData: PaymentDayData[];
  rentDueData: RentDueDayData[];
  checkoutsData: CheckoutDayData[];
  checkinsData: CheckinDayData[];
  noticesData: NoticeDayData[];
  depositRefundsData: DepositRefundDayData[];
  todaySummary: TodaySummary;
  heatmapData: HeatmapDayData[];
}

export async function getDashboardCalendarData(month: string): Promise<DashboardCalendarData> {
  await connectDB();
  
  // Parse month (YYYY-MM)
  const [year, monthNum] = month.split('-').map(Number);
  const startOfMonth = new Date(year, monthNum - 1, 1);
  const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);
  
  // 1. Payments data
  const payments = await Payment.find({
    paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    isReversal: { $ne: true },
  }).lean();
  
  const paymentsMap: Record<string, { count: number; amount: number }> = {};
  payments.forEach((p: any) => {
    const dateKey = new Date(p.paymentDate).toISOString().split('T')[0];
    if (!paymentsMap[dateKey]) paymentsMap[dateKey] = { count: 0, amount: 0 };
    paymentsMap[dateKey].count++;
    paymentsMap[dateKey].amount += p.amount;
  });
  
  const paymentsData: PaymentDayData[] = Object.entries(paymentsMap).map(([date, data]) => ({
    date,
    count: data.count,
    amount: data.amount,
  }));
  
  // 2. Rent due data
  const rentRecords = await RentRecord.find({
    dueDate: { $gte: startOfMonth, $lte: endOfMonth },
  })
    .populate('resident', 'name')
    .lean();
  
  const rentDueMap: Record<string, { count: number; amount: number; residents: any[] }> = {};
  rentRecords.forEach((r: any) => {
    const dateKey = new Date(r.dueDate).toISOString().split('T')[0];
    if (!rentDueMap[dateKey]) rentDueMap[dateKey] = { count: 0, amount: 0, residents: [] };
    rentDueMap[dateKey].count++;
    rentDueMap[dateKey].amount += r.amountDue;
    rentDueMap[dateKey].residents.push({
      name: r.resident?.name || 'Unknown',
      amount: r.amountDue,
      id: r.resident?._id?.toString() || '',
    });
  });
  
  const rentDueData: RentDueDayData[] = Object.entries(rentDueMap).map(([date, data]) => ({
    date,
    count: data.count,
    amount: data.amount,
    residents: data.residents,
  }));
  
  // 3. Checkouts data
  const checkouts = await Resident.find({
    $or: [
      { expectedLeavingDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { leavingDate: { $gte: startOfMonth, $lte: endOfMonth } },
    ],
  })
    .populate('room', 'roomNumber')
    .lean();
  
  const checkoutsMap: Record<string, { count: number; residents: any[] }> = {};
  checkouts.forEach((r: any) => {
    const dateKey = (r.leavingDate || r.expectedLeavingDate)
      ? new Date(r.leavingDate || r.expectedLeavingDate).toISOString().split('T')[0]
      : null;
    if (!dateKey) return;
    if (!checkoutsMap[dateKey]) checkoutsMap[dateKey] = { count: 0, residents: [] };
    checkoutsMap[dateKey].count++;
    checkoutsMap[dateKey].residents.push({
      name: r.name,
      room: r.room?.roomNumber || 'N/A',
      id: r._id.toString(),
    });
  });
  
  const checkoutsData: CheckoutDayData[] = Object.entries(checkoutsMap).map(([date, data]) => ({
    date,
    count: data.count,
    residents: data.residents,
  }));
  
  // 4. Checkins data
  const checkins = await Resident.find({
    joiningDate: { $gte: startOfMonth, $lte: endOfMonth },
  })
    .populate('room', 'roomNumber')
    .lean();
  
  const checkinsMap: Record<string, { count: number; residents: any[] }> = {};
  checkins.forEach((r: any) => {
    const dateKey = new Date(r.joiningDate).toISOString().split('T')[0];
    if (!checkinsMap[dateKey]) checkinsMap[dateKey] = { count: 0, residents: [] };
    checkinsMap[dateKey].count++;
    checkinsMap[dateKey].residents.push({
      name: r.name,
      room: r.room?.roomNumber || 'N/A',
      id: r._id.toString(),
    });
  });
  
  const checkinsData: CheckinDayData[] = Object.entries(checkinsMap).map(([date, data]) => ({
    date,
    count: data.count,
    residents: data.residents,
  }));
  
  // 5. Notices data
  const notices = await Resident.find({
    noticeDate: { $gte: startOfMonth, $lte: endOfMonth },
  }).lean();
  
  const noticesMap: Record<string, { count: number; residents: any[] }> = {};
  notices.forEach((r: any) => {
    const dateKey = new Date(r.noticeDate).toISOString().split('T')[0];
    if (!noticesMap[dateKey]) noticesMap[dateKey] = { count: 0, residents: [] };
    noticesMap[dateKey].count++;
    noticesMap[dateKey].residents.push({
      name: r.name,
      id: r._id.toString(),
    });
  });
  
  const noticesData: NoticeDayData[] = Object.entries(noticesMap).map(([date, data]) => ({
    date,
    count: data.count,
    residents: data.residents,
  }));
  
  // 6. Deposit refunds data
  const depositRefunds = await Deposit.find({
    refundDate: { $gte: startOfMonth, $lte: endOfMonth },
  }).lean();
  
  const depositRefundsMap: Record<string, { count: number; amount: number }> = {};
  depositRefunds.forEach((d: any) => {
    const dateKey = new Date(d.refundDate).toISOString().split('T')[0];
    if (!depositRefundsMap[dateKey]) depositRefundsMap[dateKey] = { count: 0, amount: 0 };
    depositRefundsMap[dateKey].count++;
    depositRefundsMap[dateKey].amount += d.refundAmount || 0;
  });
  
  const depositRefundsData: DepositRefundDayData[] = Object.entries(depositRefundsMap).map(([date, data]) => ({
    date,
    count: data.count,
    amount: data.amount,
  }));
  
  // 7. Today summary
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  
  const todayPayments = paymentsMap[todayKey] || { count: 0, amount: 0 };
  const todayRentDue = rentDueMap[todayKey] || { count: 0, amount: 0, residents: [] };
  const todayCheckouts = checkoutsMap[todayKey] || { count: 0, residents: [] };
  const todayCheckins = checkinsMap[todayKey] || { count: 0, residents: [] };
  
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const pendingRentRecords = await RentRecord.find({
    month: currentMonth,
    status: { $in: ['pending', 'partial'] },
  }).lean();
  
  const pendingRentCount = pendingRentRecords.length;
  const pendingRentAmount = pendingRentRecords.reduce((sum: number, r: any) => sum + (r.amountDue - r.amountPaid), 0);
  
  const todaySummary: TodaySummary = {
    paymentsExpected: todayRentDue.count,
    paymentsAmount: todayPayments.amount,
    checkouts: todayCheckouts.count,
    checkins: todayCheckins.count,
    pendingRentCount,
    pendingRentAmount,
  };
  
  // 8. Heatmap data
  const heatmapMap: Record<string, number> = {};
  
  paymentsData.forEach(p => {
    heatmapMap[p.date] = (heatmapMap[p.date] || 0) + p.count * 10;
  });
  rentDueData.forEach(r => {
    heatmapMap[r.date] = (heatmapMap[r.date] || 0) + r.count * 8;
  });
  checkoutsData.forEach(c => {
    heatmapMap[c.date] = (heatmapMap[c.date] || 0) + c.count * 15;
  });
  checkinsData.forEach(c => {
    heatmapMap[c.date] = (heatmapMap[c.date] || 0) + c.count * 15;
  });
  
  const heatmapData: HeatmapDayData[] = Object.entries(heatmapMap).map(([date, score]) => ({
    date,
    score,
  }));
  
  return {
    paymentsData,
    rentDueData,
    checkoutsData,
    checkinsData,
    noticesData,
    depositRefundsData,
    todaySummary,
    heatmapData,
  };
}
```

**Verify**: File created, imports follow pattern from dashboard.ts

### 2. Create DashboardCalendar.tsx component

**File**: `components/dashboard/DashboardCalendar.tsx`

This is a complex component. Key structure:

```typescript
'use client';

import { useState, useMemo, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  DoorOpen, 
  Receipt, 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { DashboardCalendarData } from '@/lib/services/dashboard-calendar';
import { getDashboardCalendarData } from '@/lib/services/dashboard-calendar';

interface DashboardCalendarProps {
  initialData: DashboardCalendarData;
  initialMonth: string;
}

type ViewMode = 'grid' | 'heatmap' | 'agenda';
type FilterType = 'all' | 'payments' | 'checkins' | 'checkouts' | 'notices' | 'electricity';

export default function DashboardCalendar({ initialData, initialMonth }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [calendarData, setCalendarData] = useState(initialData);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(['all']);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Calendar days calculation (same as ResidentCalendar)
  const calendarDays = useMemo(() => {
    // ... 7-column grid calculation
  }, [currentMonth]);
  
  // Event aggregation by date
  const eventsByDate = useMemo(() => {
    // Aggregate all events from calendarData into a map by date
  }, [calendarData, activeFilters]);
  
  // Heatmap colors
  const getHeatmapColor = (score: number) => {
    if (score === 0) return '#F2F2F7';
    if (score <= 20) return '#BFD9FF';
    if (score <= 50) return '#7FBFFF';
    if (score <= 100) return '#007AFF';
    return '#0055CC';
  };
  
  // Month navigation
  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    
    startTransition(async () => {
      const newData = await getDashboardCalendarData(newMonth);
      setCalendarData(newData);
      setCurrentMonth(newMonth);
    });
  };
  
  // Filter toggle
  const toggleFilter = (filter: FilterType) => {
    if (filter === 'all') {
      setActiveFilters(['all']);
    } else {
      const newFilters = activeFilters.includes(filter)
        ? activeFilters.filter(f => f !== filter)
        : [...activeFilters.filter(f => f !== 'all'), filter];
      setActiveFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)] rounded-2xl">
      <CardContent className="pt-4">
        {/* Header with month nav */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[19px] tracking-[-0.022em] text-[#1C1C1E]">
            Calendar Overview
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => changeMonth('prev')} disabled={isPending}>
              <ChevronLeft />
            </Button>
            <span className="text-sm font-medium">{/* Format currentMonth */}</span>
            <Button variant="ghost" size="sm" onClick={() => changeMonth('next')} disabled={isPending}>
              <ChevronRight />
            </Button>
          </div>
        </div>
        
        {/* Today stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* 4 stat chips */}
        </div>
        
        {/* View mode toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button 
            variant={viewMode === 'heatmap' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('heatmap')}
          >
            Heatmap
          </Button>
          <Button 
            variant={viewMode === 'agenda' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('agenda')}
          >
            Agenda
          </Button>
        </div>
        
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Filter badges */}
        </div>
        
        {/* Grid view */}
        {viewMode === 'grid' && (
          <div>
            {/* Same calendar grid as ResidentCalendar */}
          </div>
        )}
        
        {/* Heatmap view */}
        {viewMode === 'heatmap' && (
          <div>
            {/* Calendar grid with colored cells, no dots */}
          </div>
        )}
        
        {/* Agenda view */}
        {viewMode === 'agenda' && (
          <div className="space-y-3">
            {/* Next 14 days as list */}
          </div>
        )}
      </CardContent>
      
      {/* Event details sheet */}
      <Sheet open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {/* Event details */}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
```

**Verify**: Component created with all views implemented

### 3. Modify dashboard page

**File**: `app/(dashboard)/dashboard/page.tsx`

Changes:
1. Add import at top:
```typescript
import dynamic from 'next/dynamic';
import { getDashboardCalendarData } from '@/lib/services/dashboard-calendar';

const DashboardCalendar = dynamic(
  () => import('@/components/dashboard/DashboardCalendar'),
  { ssr: false }
);
```

2. In the Promise.all section, add:
```typescript
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const [stats, recentPayments, pendingDues, incomeExpenseData, planDistribution, occupancy, calendarData] = await Promise.all([
  getDashboardStats(),
  getRecentPayments(5),
  getPendingDues(5),
  getIncomeExpenseData(),
  getPlanDistribution(),
  getOccupancyTrend(),
  getDashboardCalendarData(currentMonth), // ADD THIS
]);
```

3. Add component between header and stat cards:
```tsx
{/* Header */}
<div>...</div>

{/* Dashboard Calendar */}
<DashboardCalendar initialData={calendarData} initialMonth={currentMonth} />

{/* Stat Cards */}
<div className="grid">...</div>
```

**Verify**: Dashboard page compiles, calendar renders on /dashboard

---

## Verification Steps

### Build verification
```bash
cd c:\Users\Adarsh\Desktop\agency\demo-demand\PG
npm run build
```
Expected: No TypeScript errors, successful compilation

### Manual testing

1. **ResidentCalendar enhancements**
   - Start dev server: `npm run dev`
   - Navigate to any resident profile → Timeline tab
   - Verify: Calendar is visibly more compact
   - Verify: Events show as dots (max 3) instead of badges
   - Hover a date with events → tooltip appears
   - Click a date with events → Sheet opens on right with full details
   - Today's date has pulsing blue ring
   - Calendar has glassmorphism (frosted glass effect)
   - Summary shows as 4 horizontal compact cards
   - On mobile (< 768px): swipe left/right changes month
   - On mobile: week/month toggle appears and works

2. **DashboardCalendar**
   - Navigate to /dashboard
   - Verify: Calendar appears between header and stat cards
   - Verify: Today's stats bar shows counts and amounts
   - Click Grid/Heatmap/Agenda buttons → view changes
   - In Grid: colored dots on dates with events
   - In Heatmap: cells colored by activity score
   - In Agenda: list of next 14 days with events
   - Click a date → Sheet opens with event details
   - Click filter chip → events filter correctly
   - Click prev/next month → calendar updates
   - On mobile: responsive layout works

---

## Notes
- No new packages installed (use only existing dependencies)
- All animations CSS-only (no framer-motion)
- Model imports use `void Model;` pattern to prevent MissingSchemaError
- Both calendars share Apple design language and interaction patterns
- All dates in IST, all money in integer rupees
- Component is client-side with server action data fetching
