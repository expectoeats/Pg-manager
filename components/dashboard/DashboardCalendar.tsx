'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Users,
  DoorOpen,
  Receipt,
  ExternalLink,
  Phone,
  Bed,
  Home,
  ShieldCheck,
  AlertCircle,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardCalendarData } from '@/lib/services/dashboard-calendar';

interface DashboardCalendarProps {
  initialData: DashboardCalendarData;
  initialMonth: string;
}

type TabType = 'all' | 'rentdue' | 'checkin' | 'checkout' | 'payment';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMonthHeader(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getInitials(name: string): string {
  if (!name) return 'PG';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DashboardCalendar({ initialData, initialMonth }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Fast lookups by dateKey YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        checkins: DashboardCalendarData['checkinsData'][0]['residents'];
        rentdues: DashboardCalendarData['rentDueData'][0]['records'];
        payments: DashboardCalendarData['paymentsData'][0]['payments'];
        checkouts: DashboardCalendarData['checkoutsData'][0]['residents'];
        notices: DashboardCalendarData['noticesData'][0]['residents'];
      }
    >();

    const getOrInit = (key: string) => {
      if (!map.has(key)) {
        map.set(key, { checkins: [], rentdues: [], payments: [], checkouts: [], notices: [] });
      }
      return map.get(key)!;
    };

    initialData.checkinsData.forEach((c) => {
      getOrInit(c.date).checkins.push(...c.residents);
    });
    initialData.rentDueData.forEach((r) => {
      getOrInit(r.date).rentdues.push(...r.records);
    });
    initialData.paymentsData.forEach((p) => {
      getOrInit(p.date).payments.push(...p.payments);
    });
    initialData.checkoutsData.forEach((co) => {
      getOrInit(co.date).checkouts.push(...co.residents);
    });
    initialData.noticesData.forEach((n) => {
      getOrInit(n.date).notices.push(...n.residents);
    });

    return map;
  }, [initialData]);

  // Calendar days grid
  const calendarDays = useMemo(() => {
    const [year, monthNum] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [, currentMonthNum] = currentMonth.split('-').map(Number);

  const goToPreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    setCurrentMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const next = new Date(year, month, 1);
    setCurrentMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToToday = () => {
    setCurrentMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  // Selected date data for inspector sheet
  const selectedDayData = selectedDate ? eventsByDate.get(selectedDate) : null;
  const totalEventsOnSelectedDay = selectedDayData
    ? selectedDayData.checkins.length +
      selectedDayData.rentdues.length +
      selectedDayData.payments.length +
      selectedDayData.checkouts.length +
      selectedDayData.notices.length
    : 0;

  return (
    <>
      {/* ── Apple-Style Calendar Hub ── */}
      <div
        className="rounded-3xl p-3 sm:p-4 transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-stretch">
          
          {/* Left: Apple Mini Calendar Widget (4 cols on lg) */}
          <div
            className="lg:col-span-5 xl:col-span-4 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* Header: Month & Prev/Next */}
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#F2F2F7]">
              <div>
                <span className="text-[14px] font-semibold text-[#1C1C1E] tracking-tight">
                  {formatMonthHeader(currentMonth)}
                </span>
                {currentMonth !== initialMonth && (
                  <button
                    onClick={goToToday}
                    className="ml-2 text-[10px] text-[#007AFF] font-medium hover:underline"
                  >
                    Today
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPreviousMonth}
                  aria-label="Previous Month"
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F2F2F7] active:scale-95 text-[#007AFF] transition-all"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  onClick={goToNextMonth}
                  aria-label="Next Month"
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F2F2F7] active:scale-95 text-[#007AFF] transition-all"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center py-1">
              {DAY_LABELS.map((day, i) => (
                <span
                  key={i}
                  className={cn(
                    'text-[10px] font-semibold tracking-wider',
                    i === 0 || i === 6 ? 'text-[#FF3B30]/90' : 'text-[#8E8E93]'
                  )}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-1 my-1">
              {calendarDays.map((date, idx) => {
                const isCurrentMonthDay = date.getMonth() === currentMonthNum - 1;
                const dKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const isToday = dKey === todayKey;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const events = eventsByDate.get(dKey);

                const hasCheckin = (events?.checkins.length || 0) > 0;
                const hasRentDue = (events?.rentdues.length || 0) > 0;
                const hasPayment = (events?.payments.length || 0) > 0;
                const hasCheckout = (events?.checkouts.length || 0) > 0;
                const hasAnyEvent = (hasCheckin || hasRentDue || hasPayment || hasCheckout) && isCurrentMonthDay;

                return (
                  <button
                    key={idx}
                    onClick={() => hasAnyEvent && setSelectedDate(dKey)}
                    className={cn(
                      'group relative flex flex-col items-center justify-center py-1 rounded-xl transition-all',
                      hasAnyEvent ? 'cursor-pointer hover:bg-[#F2F2F7] active:scale-95' : 'cursor-default',
                      selectedDate === dKey && 'bg-[#007AFF]/10'
                    )}
                  >
                    {/* Date Number Badge */}
                    <span
                      className={cn(
                        'w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-medium transition-all',
                        isToday && 'bg-[#007AFF] text-white font-semibold shadow-sm',
                        !isToday && isCurrentMonthDay && !isWeekend && 'text-[#1C1C1E]',
                        !isToday && isCurrentMonthDay && isWeekend && 'text-[#FF3B30]',
                        !isCurrentMonthDay && 'text-[#C7C7CC]'
                      )}
                    >
                      {date.getDate()}
                    </span>

                    {/* Apple Event Indicators: sleek micro-dots */}
                    <div className="h-1 flex items-center justify-center gap-0.5 mt-0.5">
                      {isCurrentMonthDay && hasRentDue && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" title="Rent Due" />
                      )}
                      {isCurrentMonthDay && hasCheckin && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" title="Check-in" />
                      )}
                      {isCurrentMonthDay && hasPayment && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" title="Payment" />
                      )}
                      {isCurrentMonthDay && hasCheckout && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500]" title="Check-out" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Apple Style Legend Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F7] text-[10px] text-[#8E8E93] px-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" /> Check-in
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" /> Rent Due
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" /> Payment
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500]" /> Leaving
              </span>
            </div>
          </div>

          {/* Right: Apple Fitness/Health Style Metric Tiles (8 cols on lg) */}
          <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-2 gap-2.5 sm:gap-3">
            
            {/* 1. Payments Expected / Received */}
            <div
              className="rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md border"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                borderColor: 'rgba(52, 199, 89, 0.25)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#34C759]/15 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#34C759]" strokeWidth={2.2} />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 border-[#34C759]/30 text-[#34C759] bg-[#34C759]/5 font-medium"
                >
                  Today
                </Badge>
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-bold text-[#1C1C1E] tracking-tight">
                  {initialData.todaySummary.paymentsExpected}
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-0.5 font-medium">
                  Payments Expected
                </p>
                <div className="text-[11px] font-semibold text-[#34C759] mt-0.5">
                  ₹{initialData.todaySummary.paymentsAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* 2. Check-ins Today */}
            <div
              className="rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md border"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                borderColor: 'rgba(0, 122, 255, 0.25)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#007AFF]/15 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#007AFF]" strokeWidth={2.2} />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 border-[#007AFF]/30 text-[#007AFF] bg-[#007AFF]/5 font-medium"
                >
                  Arrivals
                </Badge>
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-bold text-[#1C1C1E] tracking-tight">
                  {initialData.todaySummary.checkIns}
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-0.5 font-medium">
                  Check-ins Today
                </p>
                <div className="text-[11px] font-semibold text-[#007AFF] mt-0.5">
                  New Residents
                </div>
              </div>
            </div>

            {/* 3. Check-outs / Notices */}
            <div
              className="rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md border"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                borderColor: 'rgba(255, 149, 0, 0.25)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#FF9500]/15 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4 text-[#FF9500]" strokeWidth={2.2} />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 border-[#FF9500]/30 text-[#FF9500] bg-[#FF9500]/5 font-medium"
                >
                  Departures
                </Badge>
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-bold text-[#1C1C1E] tracking-tight">
                  {initialData.todaySummary.checkOuts}
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-0.5 font-medium">
                  Check-outs Today
                </p>
                <div className="text-[11px] font-semibold text-[#FF9500] mt-0.5">
                  Leaving Scheduled
                </div>
              </div>
            </div>

            {/* 4. Rent Dues Today */}
            <div
              className="rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md border"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                borderColor: 'rgba(255, 59, 48, 0.25)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#FF3B30]/15 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-[#FF3B30]" strokeWidth={2.2} />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 border-[#FF3B30]/30 text-[#FF3B30] bg-[#FF3B30]/5 font-medium"
                >
                  Collections
                </Badge>
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-bold text-[#1C1C1E] tracking-tight">
                  {initialData.todaySummary.rentDues}
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-0.5 font-medium">
                  Rent Due Today
                </p>
                <div className="text-[11px] font-semibold text-[#FF3B30] mt-0.5">
                  ₹{initialData.todaySummary.rentDuesAmount.toLocaleString('en-IN')} Due
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Apple Calendar Inspector Sheet ── */}
      <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg lg:max-w-xl p-0 flex flex-col overflow-hidden bg-[#F2F2F7] border-l border-[#E5E5EA]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif' }}
        >
          {/* Sheet Header */}
          <div className="p-5 bg-white border-b border-[#E5E5EA]">
            <SheetHeader className="text-left space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#007AFF]">
                Daily Schedule & Dues
              </div>
              <SheetTitle className="text-xl sm:text-2xl font-bold text-[#1C1C1E] tracking-tight">
                {selectedDate && formatFullDate(selectedDate)}
              </SheetTitle>
              <p className="text-xs text-[#8E8E93]">
                {totalEventsOnSelectedDay} activities recorded on this date
              </p>
            </SheetHeader>

            {/* Apple Segmented Control Bar */}
            <div className="mt-4 flex items-center bg-[#F2F2F7] p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  activeTab === 'all'
                    ? 'bg-white text-[#1C1C1E] shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                )}
              >
                All ({totalEventsOnSelectedDay})
              </button>
              <button
                onClick={() => setActiveTab('rentdue')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  activeTab === 'rentdue'
                    ? 'bg-white text-[#FF3B30] shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                )}
              >
                Rent ({selectedDayData?.rentdues.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('checkin')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  activeTab === 'checkin'
                    ? 'bg-white text-[#34C759] shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                )}
              >
                Check-ins ({selectedDayData?.checkins.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  activeTab === 'payment'
                    ? 'bg-white text-[#007AFF] shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                )}
              >
                Payments ({selectedDayData?.payments.length || 0})
              </button>
            </div>
          </div>

          {/* Sheet Body (Scrollable List) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            
            {/* ── Section: Rent Dues ── */}
            {(activeTab === 'all' || activeTab === 'rentdue') && selectedDayData?.rentdues && selectedDayData.rentdues.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[12px] font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF3B30]" /> Rent Dues ({selectedDayData.rentdues.length})
                  </span>
                  <span className="text-[11px] font-semibold text-[#FF3B30]">
                    Total: ₹{selectedDayData.rentdues.reduce((s, r) => s + r.balanceDue, 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {selectedDayData.rentdues.map((r) => (
                  <div
                    key={r.recordId}
                    className="relative bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Left Accent Stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF3B30]" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/5 text-[#FF3B30] font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {getInitials(r.residentName)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[15px] text-[#1C1C1E]">
                            {r.residentName}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#8E8E93]">
                            <span className="flex items-center gap-1 bg-[#F2F2F7] px-2 py-0.5 rounded-md font-medium text-[#1C1C1E]">
                              <Home className="w-3 h-3 text-[#007AFF]" />
                              Room {r.roomNumber}
                              {r.bedLabel ? ` • Bed ${r.bedLabel}` : ''}
                            </span>
                            {r.mobile && (
                              <a
                                href={`tel:${r.mobile}`}
                                className="flex items-center gap-1 hover:text-[#007AFF] transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                                {r.mobile}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Balance */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-[16px] font-bold text-[#FF3B30]">
                          ₹{r.balanceDue.toLocaleString('en-IN')}
                        </div>
                        <Badge
                          className={cn(
                            'text-[10px] px-2 py-0.5 mt-0.5 capitalize',
                            r.status === 'paid'
                              ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30'
                              : 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30'
                          )}
                          variant="outline"
                        >
                          {r.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Plan & Month details */}
                    <div className="mt-3 pt-2.5 border-t border-[#F2F2F7] flex items-center justify-between text-xs">
                      <span className="text-[#8E8E93]">
                        {r.planName || 'Monthly Rent'} ({r.month})
                      </span>
                      <Link
                        href={`/residents/${r.residentId}`}
                        prefetch={false}
                        className="inline-flex items-center gap-1 text-[#007AFF] font-medium hover:underline"
                      >
                        Collect / View <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Section: Check-ins ── */}
            {(activeTab === 'all' || activeTab === 'checkin') && selectedDayData?.checkins && selectedDayData.checkins.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[12px] font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#34C759]" /> Check-ins ({selectedDayData.checkins.length})
                  </span>
                  <span className="text-[11px] text-[#8E8E93]">New Onboardings</span>
                </div>

                {selectedDayData.checkins.map((c, i) => (
                  <div
                    key={i}
                    className="relative bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Left Accent Stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#34C759]" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#34C759]/20 to-[#34C759]/5 text-[#34C759] font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {getInitials(c.residentName)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[15px] text-[#1C1C1E]">
                            {c.residentName}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#8E8E93]">
                            <span className="flex items-center gap-1 bg-[#F2F2F7] px-2 py-0.5 rounded-md font-medium text-[#1C1C1E]">
                              <Home className="w-3 h-3 text-[#007AFF]" />
                              Room {c.roomNumber}
                              {c.bedLabel ? ` • Bed ${c.bedLabel}` : ''}
                            </span>
                            {c.mobile && (
                              <a
                                href={`tel:${c.mobile}`}
                                className="flex items-center gap-1 hover:text-[#007AFF] transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                                {c.mobile}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Plan price badge */}
                      <div className="text-right flex-shrink-0">
                        {c.planPrice ? (
                          <div className="text-[14px] font-bold text-[#1C1C1E]">
                            ₹{c.planPrice.toLocaleString('en-IN')}/mo
                          </div>
                        ) : null}
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0.5 mt-0.5 bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30"
                        >
                          Joined
                        </Badge>
                      </div>
                    </div>

                    {/* Financial Status Chips: Deposit + First Rent */}
                    <div className="mt-3 pt-2.5 border-t border-[#F2F2F7] flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2">
                        {/* Deposit chip */}
                        {c.depositAmount ? (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1',
                              c.depositStatus === 'held'
                                ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30'
                                : 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/30'
                            )}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Deposit: ₹{c.depositAmount.toLocaleString('en-IN')} (
                            {c.depositStatus === 'held' ? 'Received' : 'Pending'})
                          </span>
                        ) : null}

                        {/* First rent chip */}
                        {c.rentDueAmount ? (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1',
                              c.rentStatus === 'paid'
                                ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30'
                                : 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30'
                            )}
                          >
                            Rent: ₹{c.rentDueAmount.toLocaleString('en-IN')} (
                            {c.rentStatus || 'pending'})
                          </span>
                        ) : null}
                      </div>

                      <Link
                        href={`/residents/${c.residentId}`}
                        prefetch={false}
                        className="inline-flex items-center gap-1 text-[#007AFF] font-medium hover:underline ml-auto"
                      >
                        Profile <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Section: Payments ── */}
            {(activeTab === 'all' || activeTab === 'payment') && selectedDayData?.payments && selectedDayData.payments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[12px] font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#007AFF]" /> Payments Collected ({selectedDayData.payments.length})
                  </span>
                  <span className="text-[11px] font-semibold text-[#34C759]">
                    +₹{selectedDayData.payments.reduce((s, p) => s + p.amount, 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {selectedDayData.payments.map((p) => (
                  <div
                    key={p.paymentId}
                    className="relative bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#007AFF]" />

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF]/20 to-[#007AFF]/5 text-[#007AFF] font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {getInitials(p.residentName)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[15px] text-[#1C1C1E]">
                            {p.residentName}
                          </h4>
                          <p className="text-xs text-[#8E8E93] mt-0.5">
                            Room {p.roomNumber} • {p.method.toUpperCase()} • {p.type}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[16px] font-bold text-[#34C759]">
                          +₹{p.amount.toLocaleString('en-IN')}
                        </div>
                        {p.receiptNumber && (
                          <div className="text-[10px] text-[#8E8E93] mt-0.5">
                            #{p.receiptNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F2F2F7] flex justify-end">
                      <Link
                        href={`/residents/${p.residentId}`}
                        prefetch={false}
                        className="inline-flex items-center gap-1 text-xs text-[#007AFF] font-medium hover:underline"
                      >
                        Receipt & Details <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Section: Check-outs ── */}
            {(activeTab === 'all' || activeTab === 'checkout') && selectedDayData?.checkouts && selectedDayData.checkouts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[12px] font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF9500]" /> Check-outs ({selectedDayData.checkouts.length})
                  </span>
                </div>

                {selectedDayData.checkouts.map((co) => (
                  <div
                    key={co.residentId}
                    className="relative bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF9500]" />

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9500]/20 to-[#FF9500]/5 text-[#FF9500] font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {getInitials(co.residentName)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[15px] text-[#1C1C1E]">
                            {co.residentName}
                          </h4>
                          <p className="text-xs text-[#8E8E93] mt-0.5">
                            Room {co.roomNumber}
                            {co.bedLabel ? ` • Bed ${co.bedLabel}` : ''}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/30"
                      >
                        {co.status === 'left' ? 'Checked Out' : 'On Notice'}
                      </Badge>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F2F2F7] flex justify-end">
                      <Link
                        href={`/residents/${co.residentId}/checkout`}
                        prefetch={false}
                        className="inline-flex items-center gap-1 text-xs text-[#007AFF] font-medium hover:underline"
                      >
                        Settlement Wizard <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state if no events on tab */}
            {totalEventsOnSelectedDay === 0 && (
              <div className="py-16 text-center text-[#8E8E93]">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#8E8E93]" />
                <p className="text-sm font-medium">No events on this day</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
