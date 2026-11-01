'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Receipt,
  CreditCard,
  ClipboardList,
  Zap,
  Bell,
  Calendar as CalendarIcon,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResidentCalendarData, CalendarEvent } from '@/lib/services/residents';

interface ResidentData {
  _id: string;
  name: string;
  joiningDate: string;
  status: 'active' | 'notice' | 'left';
  noticeDate?: string | null;
  expectedLeavingDate?: string | null;
  leavingDate?: string | null;
  currentPlan?: { name: string; price: number } | null;
}

interface PlanHistoryData {
  _id: string;
  plan: { name: string; price: number } | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

interface ResidentCalendarProps {
  resident: ResidentData;
  calendarData: ResidentCalendarData;
  planHistory: PlanHistoryData[];
}

interface ClientCalendarEvent {
  type: CalendarEvent['type'];
  date: Date;
  data: CalendarEvent['data'];
}

const EVENT_COLORS = {
  joining: '#34C759',
  rent_pending: '#FF3B30',
  rent_due: '#FF9500',
  payment: '#30D158',
  notice: '#FF9500',
  leaving: '#FF3B30',
  plan_change: '#007AFF',
  electricity: '#5856D6',
};

function getRentDueColor(event: ClientCalendarEvent): string {
  if (event.type === 'rent_due' && 'status' in event.data) {
    const status = event.data.status;
    if (status === 'paid') return '#34C759';
    if (status === 'partial') return '#FF9500';
    if (status === 'pending') return '#FF3B30';
  }
  return EVENT_COLORS[event.type];
}

const EVENT_ICONS = {
  joining: Star,
  rent_pending: Receipt,
  rent_due: Receipt,
  payment: CreditCard,
  notice: Bell,
  leaving: Bell,
  plan_change: ClipboardList,
  electricity: Zap,
};

function formatDateIST(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function ResidentCalendar({ resident, calendarData, planHistory }: ResidentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Build event map
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ClientCalendarEvent[]>();
    calendarData.events.forEach((serverEvent) => {
      if (serverEvent.type === 'plan_change' && serverEvent.data.isInitial) return;
      const clientEvent: ClientCalendarEvent = {
        type: serverEvent.type,
        date: new Date(serverEvent.date),
        data: serverEvent.data,
      };
      const key = getDateKey(new Date(serverEvent.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(clientEvent);
    });
    return map;
  }, [calendarData.events]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    const cur = new Date(start);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const isDatePending = (date: Date) => {
    const t = date.getTime();
    return calendarData.pendingRentRanges.some((r) => {
      const s = new Date(r.startDate).getTime();
      const e = new Date(r.endDate).getTime();
      return t >= s && t <= e;
    });
  };

  const today = new Date();
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();

  const goToPreviousMonth = () =>
    setCurrentMonth((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; });
  const goToNextMonth = () =>
    setCurrentMonth((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; });
  const goToToday = () => setCurrentMonth(new Date());

  const handleTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const dist = touchStart - touchEnd;
    if (dist > 50) goToNextMonth();
    if (dist < -50) goToPreviousMonth();
  };

  // Summary stats
  const summaryStats = useMemo(() => ({
    daysStayed: calendarData.daysStayed,
    totalPendingRent: calendarData.totalPendingAmount,
    totalPendingElectricity: calendarData.totalPendingElectricity,
    nextDueDate: calendarData.nextDueDate,
  }), [calendarData]);

  if (calendarData.events.length === 0) {
    return (
      <div
        className="rounded-3xl p-8 flex flex-col items-center text-center bg-white border border-[#E5E5EA] shadow-sm"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif' }}
      >
        <div className="w-12 h-12 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center mb-3">
          <CalendarIcon className="w-6 h-6 text-[#007AFF]" strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-[#1C1C1E] mb-1">No timeline events yet</h3>
        <p className="text-sm text-[#8E8E93]">Events will appear as rent is generated and payments are recorded.</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-4"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif' }}
    >
      {/* ── Apple-style Summary Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-2xl p-3.5 border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all">
          <div className="text-[10px] font-semibold text-[#007AFF] uppercase tracking-wider mb-0.5">Stayed</div>
          <div className="text-2xl font-bold text-[#1C1C1E]">{summaryStats.daysStayed} <span className="text-xs font-normal text-[#8E8E93]">days</span></div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all">
          <div className="text-[10px] font-semibold text-[#FF3B30] uppercase tracking-wider mb-0.5">Pending Rent</div>
          <div className="text-2xl font-bold text-[#FF3B30]">
            {summaryStats.totalPendingRent > 0 ? `₹${summaryStats.totalPendingRent.toLocaleString('en-IN')}` : '₹0'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all">
          <div className="text-[10px] font-semibold text-[#5856D6] uppercase tracking-wider mb-0.5">Electricity</div>
          <div className="text-2xl font-bold text-[#5856D6]">
            {summaryStats.totalPendingElectricity > 0 ? `₹${summaryStats.totalPendingElectricity.toLocaleString('en-IN')}` : '₹0'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all">
          <div className="text-[10px] font-semibold text-[#FF9500] uppercase tracking-wider mb-0.5">Next Due</div>
          <div className="text-sm font-bold text-[#FF9500] mt-1 truncate">
            {summaryStats.nextDueDate ? formatDateIST(summaryStats.nextDueDate) : 'None'}
          </div>
        </div>
      </div>

      {/* ── Apple-style mini calendar card ── */}
      <div
        className="rounded-3xl p-4 transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Calendar header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F2F2F7]">
          <div>
            <span className="text-[14px] font-semibold text-[#1C1C1E] tracking-tight">
              {formatMonthYear(currentMonth)}
            </span>
            {!isCurrentMonth && (
              <button onClick={goToToday} className="ml-2 text-[10px] text-[#007AFF] font-medium hover:underline">
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

        {/* Day labels */}
        <div className="grid grid-cols-7 text-center py-1">
          {DAY_LABELS.map((d, i) => (
            <span
              key={i}
              className={cn(
                'text-[10px] font-semibold tracking-wider',
                i === 0 || i === 6 ? 'text-[#FF3B30]/90' : 'text-[#8E8E93]'
              )}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Day cells */}
        <div
          className="grid grid-cols-7 gap-y-1 my-1"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {calendarDays.map((date, idx) => {
            const isCurrentMonthDay = date.getMonth() === currentMonth.getMonth();
            const isToday = isSameDay(date, today);
            const dateKey = getDateKey(date);
            const events = eventsByDate.get(dateKey) || [];
            const isPending = isDatePending(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const hasEvents = events.length > 0 && isCurrentMonthDay;
            const isJoining = events.some((e) => e.type === 'joining');

            return (
              <button
                key={idx}
                onClick={() => hasEvents && setSelectedDate(dateKey)}
                className={cn(
                  'relative flex flex-col items-center justify-center py-1 rounded-xl transition-all',
                  hasEvents ? 'cursor-pointer hover:bg-[#F2F2F7] active:scale-95' : 'cursor-default',
                  isPending && isCurrentMonthDay && !isToday && 'bg-[#FF3B30]/5',
                  isJoining && 'ring-1 ring-[#34C759]/40 ring-inset'
                )}
              >
                {/* Date circle */}
                <span
                  className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-medium transition-colors',
                    isToday && 'bg-[#007AFF] text-white font-semibold shadow-sm',
                    !isToday && isCurrentMonthDay && !isWeekend && 'text-[#1C1C1E]',
                    !isToday && isCurrentMonthDay && isWeekend && 'text-[#FF3B30]',
                    !isCurrentMonthDay && 'text-[#C7C7CC]'
                  )}
                >
                  {date.getDate()}
                </span>

                {/* Event micro-dots */}
                <div className="h-1 flex items-center justify-center gap-0.5 mt-0.5">
                  {hasEvents &&
                    events.slice(0, 3).map((ev, ei) => {
                      const color = getRentDueColor(ev);
                      return <span key={ei} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />;
                    })}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend strip */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#F2F2F7] text-[10px] text-[#8E8E93] px-1 flex-wrap gap-2">
          {[
            { label: 'Joining', color: '#34C759' },
            { label: 'Rent Due', color: '#FF9500' },
            { label: 'Paid', color: '#30D158' },
            { label: 'Pending', color: '#FF3B30' },
            { label: 'Electricity', color: '#5856D6' },
            { label: 'Plan Change', color: '#007AFF' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Event Detail Sheet ── */}
      <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent
          className="w-[94vw] sm:max-w-md overflow-y-auto p-0 flex flex-col bg-[#F2F2F7]/95 backdrop-blur-2xl border-l border-[#E5E5EA]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif' }}
        >
          <div className="p-5 bg-white border-b border-[#E5E5EA]">
            <SheetHeader className="text-left space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#007AFF]">
                Resident Activity
              </div>
              <SheetTitle className="text-xl font-bold text-[#1C1C1E] tracking-tight">
                {selectedDate &&
                  new Date(selectedDate).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
              </SheetTitle>
              <p className="text-xs text-[#8E8E93]">
                {selectedDate && (eventsByDate.get(selectedDate)?.length || 0)} event(s) recorded
              </p>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedDate &&
              eventsByDate.get(selectedDate)?.map((event, idx) => {
                const Icon = EVENT_ICONS[event.type];
                const eventColor = getRentDueColor(event);

                return (
                  <div
                    key={idx}
                    className="relative bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Left Accent Stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: eventColor }} />

                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${eventColor}18` }}
                      >
                        <Icon className="w-4.5 h-4.5" style={{ color: eventColor }} strokeWidth={2.2} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {event.type === 'joining' && (
                          <>
                            <h4 className="font-semibold text-[15px] text-[#1C1C1E]">Joined PG</h4>
                            <p className="text-xs text-[#8E8E93] mt-0.5">Checked in to room and bed</p>
                          </>
                        )}

                        {event.type === 'rent_due' && 'amount' in event.data && (
                          <>
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-[15px] text-[#1C1C1E]">Rent Due</h4>
                              <span className="text-[16px] font-bold" style={{ color: eventColor }}>
                                ₹{event.data.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                            {'planName' in event.data && (
                              <p className="text-xs text-[#8E8E93] mt-0.5">{event.data.planName}</p>
                            )}
                            {'status' in event.data && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0.5 mt-1.5 capitalize"
                                style={{
                                  backgroundColor: `${eventColor}15`,
                                  color: eventColor,
                                  borderColor: `${eventColor}30`,
                                }}
                              >
                                {event.data.status}
                              </Badge>
                            )}
                          </>
                        )}

                        {event.type === 'rent_pending' && 'amount' in event.data && (
                          <>
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-[15px] text-[#FF3B30]">Rent Pending</h4>
                              <span className="text-[16px] font-bold text-[#FF3B30]">
                                ₹{event.data.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-xs text-[#8E8E93] mt-0.5">Unpaid overdue rent</p>
                          </>
                        )}

                        {event.type === 'payment' && 'amount' in event.data && (
                          <>
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-[15px] text-[#1C1C1E]">Payment Recorded</h4>
                              <span className="text-[16px] font-bold text-[#34C759]">
                                +₹{event.data.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                            {'method' in event.data && 'type' in event.data && (
                              <p className="text-xs text-[#8E8E93] capitalize mt-0.5">
                                {event.data.method.toUpperCase()} • {event.data.type}
                              </p>
                            )}
                          </>
                        )}

                        {event.type === 'plan_change' && 'planName' in event.data && (
                          <>
                            <h4 className="font-semibold text-[15px] text-[#1C1C1E]">Plan Changed</h4>
                            <p className="text-xs text-[#8E8E93] mt-0.5">{event.data.planName}</p>
                            {'price' in event.data && (
                              <p className="text-xs font-semibold text-[#1C1C1E] mt-1">
                                ₹{event.data.price.toLocaleString('en-IN')}/month
                              </p>
                            )}
                          </>
                        )}

                        {event.type === 'electricity' && 'amount' in event.data && (
                          <>
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-[15px] text-[#1C1C1E]">Electricity Share</h4>
                              <span className="text-[16px] font-bold text-[#5856D6]">
                                ₹{event.data.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-xs text-[#8E8E93] mt-0.5">Monthly submeter consumption</p>
                          </>
                        )}

                        {event.type === 'notice' && (
                          <>
                            <h4 className="font-semibold text-[15px] text-[#FF9500]">Notice Submitted</h4>
                            <p className="text-xs text-[#8E8E93] mt-0.5">Notice period started</p>
                          </>
                        )}

                        {event.type === 'leaving' && (
                          <>
                            <h4 className="font-semibold text-[15px] text-[#FF3B30]">Scheduled Leaving</h4>
                            <p className="text-xs text-[#8E8E93] mt-0.5">Check-out and settlement date</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
