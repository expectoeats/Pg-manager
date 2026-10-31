'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Star, Receipt, CreditCard, ClipboardList, Zap, Bell, Calendar as CalendarIcon, ExternalLink, Grid3x3, LayoutGrid } from 'lucide-react';
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

// Transform server CalendarEvent (with ISO date strings) to client CalendarEvent (with Date objects)
interface ClientCalendarEvent {
  type: CalendarEvent['type'];
  date: Date;
  data: CalendarEvent['data'];
}

const EVENT_COLORS = {
  joining: '#34C759',
  rent_pending: '#FF3B30',
  rent_due: '#FF9500', // Will be overridden based on status
  payment: '#30D158',
  notice: '#FF9500',
  leaving: '#FF9500',
  plan_change: '#007AFF',
  electricity: '#5856D6',
};

// Get dynamic color for rent_due based on status
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

// Utility functions
function formatDateIST(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short'
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ResidentCalendar({
  resident,
  calendarData,
  planHistory,
}: ResidentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Build event map from server-provided events
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ClientCalendarEvent[]>();

    const addEvent = (dateStr: string, event: ClientCalendarEvent) => {
      const date = new Date(dateStr);
      const key = getDateKey(date);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    };

    // Convert server events (ISO strings) to client events (Date objects)
    // Filter out initial plan changes on the client side
    calendarData.events.forEach(serverEvent => {
      // Skip initial plan changes (marked by server)
      if (serverEvent.type === 'plan_change' && serverEvent.data.isInitial) {
        return;
      }

      const clientEvent: ClientCalendarEvent = {
        type: serverEvent.type,
        date: new Date(serverEvent.date),
        data: serverEvent.data
      };

      addEvent(serverEvent.date, clientEvent);
    });

    return map;
  }, [calendarData.events]);

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Find the Sunday before or on the first day
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Calculate 6 weeks to show
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  // Filter for week view
  const displayDays = useMemo(() => {
    if (viewMode === 'week') {
      // Find the current week (7 days starting from most recent Sunday)
      const today = new Date();
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay());
      
      const weekDays: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(currentWeekStart.getDate() + i);
        weekDays.push(day);
      }
      return weekDays;
    }
    return calendarDays;
  }, [calendarDays, viewMode]);

  // Use server-provided summary stats
  const summaryStats = useMemo(() => ({
    daysStayed: calendarData.daysStayed,
    totalPendingRent: calendarData.totalPendingAmount,
    totalPendingElectricity: calendarData.totalPendingElectricity,
    nextDueDate: calendarData.nextDueDate,
  }), [calendarData]);

  // Check if date falls within any pending rent range
  const isDatePending = (date: Date): boolean => {
    const dateTime = date.getTime();
    return calendarData.pendingRentRanges.some(range => {
      const startTime = new Date(range.startDate).getTime();
      const endTime = new Date(range.endDate).getTime();
      return dateTime >= startTime && dateTime <= endTime;
    });
  };

  const today = new Date();
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && 
                          currentMonth.getFullYear() === today.getFullYear();

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDateHover = (date: Date, event: React.MouseEvent) => {
    const dateKey = getDateKey(date);
    const events = eventsByDate.get(dateKey);
    
    if (events && events.length > 0) {
      setHoveredDate(dateKey);
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
  };

  const handleDateLeave = () => {
    setHoveredDate(null);
    setHoveredPosition(null);
  };

  const handleDateClick = (date: Date) => {
    const dateKey = getDateKey(date);
    const events = eventsByDate.get(dateKey);
    
    if (events && events.length > 0) {
      setSelectedDate(dateKey);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      goToNextMonth();
    }
    if (isRightSwipe) {
      goToPreviousMonth();
    }
  };

  // Render event tooltip
  const renderTooltip = () => {
    if (!hoveredDate || !hoveredPosition) return null;

    const events = eventsByDate.get(hoveredDate) || [];
    if (events.length === 0) return null;

    return (
      <div
        className="fixed z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] p-3 min-w-[180px] max-w-[280px] pointer-events-none transition-all duration-200"
        style={{
          left: `${hoveredPosition.x}px`,
          top: `${hoveredPosition.y - 10}px`,
          transform: 'translate(-50%, -100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif'
        }}
      >
        <div className="space-y-2">
          {events.slice(0, 5).map((event, idx) => {
            const Icon = EVENT_ICONS[event.type];
            const eventColor = getRentDueColor(event);
            return (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <Icon 
                  className="w-4 h-4 flex-shrink-0 mt-0.5" 
                  style={{ color: eventColor }}
                  strokeWidth={2}
                />
                <div className="flex-1">
                  {event.type === 'joining' && (
                    <span className="font-medium text-[#1C1C1E]">Joined PG</span>
                  )}
                  {event.type === 'rent_due' && 'amount' in event.data && (
                    <div>
                      <span className="font-medium text-[#1C1C1E]">Rent Due: </span>
                      <span className="text-[#8E8E93]">₹{event.data.amount.toLocaleString('en-IN')}</span>
                      {'planName' in event.data && (
                        <div className="text-[10px] text-[#8E8E93]">{event.data.planName}</div>
                      )}
                      {'status' in event.data && (
                        <Badge 
                          className="text-[9px] h-4 px-1 mt-0.5" 
                          style={{ 
                            backgroundColor: eventColor + '20', 
                            color: eventColor,
                            border: `1px solid ${eventColor}40`
                          }}
                        >
                          {event.data.status}
                        </Badge>
                      )}
                    </div>
                  )}
                  {event.type === 'rent_pending' && 'amount' in event.data && (
                    <div>
                      <span className="font-medium text-[#FF3B30]">Pending: </span>
                      <span className="text-[#FF3B30]">₹{event.data.amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {event.type === 'payment' && 'amount' in event.data && (
                    <div>
                      <span className="font-medium text-[#1C1C1E]">Payment: </span>
                      <span className="text-[#8E8E93]">₹{event.data.amount.toLocaleString('en-IN')}</span>
                      {'method' in event.data && 'type' in event.data && (
                        <div className="text-[10px] text-[#8E8E93] capitalize">{event.data.method} • {event.data.type}</div>
                      )}
                    </div>
                  )}
                  {event.type === 'plan_change' && 'planName' in event.data && (
                    <div>
                      <span className="font-medium text-[#1C1C1E]">Plan Changed</span>
                      <div className="text-[10px] text-[#8E8E93]">{event.data.planName}</div>
                    </div>
                  )}
                  {event.type === 'electricity' && 'amount' in event.data && (
                    <div>
                      <span className="font-medium text-[#1C1C1E]">Electricity: </span>
                      <span className="text-[#8E8E93]">₹{event.data.amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {event.type === 'notice' && (
                    <span className="font-medium text-[#FF9500]">Notice Given</span>
                  )}
                  {event.type === 'leaving' && (
                    <span className="font-medium text-[#FF9500]">Expected Leaving</span>
                  )}
                </div>
              </div>
            );
          })}
          {events.length > 5 && (
            <div className="text-[10px] text-[#8E8E93] text-center pt-1 border-t border-[#E5E5EA]">
              +{events.length - 5} more
            </div>
          )}
        </div>
      </div>
    );
  };

  // Empty state
  if (calendarData.events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center mb-3">
            <CalendarIcon className="w-6 h-6 text-[#007AFF]" strokeWidth={2} />
          </div>
          <h3 className="text-base font-medium text-[#1C1C1E] mb-1">No timeline events yet</h3>
          <p className="text-sm text-[#8E8E93]">Events will appear as rent is generated and payments are recorded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      className="space-y-4"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif' }}
    >
      {/* Compact Summary Stats - Horizontal Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Days Stayed */}
        <div className="p-3 bg-gradient-to-br from-[#007AFF]/10 to-[#007AFF]/5 rounded-xl border border-[#007AFF]/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
          <div className="text-[10px] text-[#007AFF] font-medium mb-0.5">Days Stayed</div>
          <div className="text-2xl font-semibold text-[#1C1C1E]">{summaryStats.daysStayed}</div>
        </div>

        {/* Pending Rent */}
        <div className="p-3 bg-gradient-to-br from-[#FF3B30]/10 to-[#FF3B30]/5 rounded-xl border border-[#FF3B30]/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
          <div className="text-[10px] text-[#FF3B30] font-medium mb-0.5">Pending Rent</div>
          <div className="text-2xl font-semibold text-[#FF3B30]">
            {summaryStats.totalPendingRent > 0 ? `₹${summaryStats.totalPendingRent.toLocaleString('en-IN')}` : '—'}
          </div>
        </div>

        {/* Pending Electricity */}
        <div className="p-3 bg-gradient-to-br from-[#5856D6]/10 to-[#5856D6]/5 rounded-xl border border-[#5856D6]/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
          <div className="text-[10px] text-[#5856D6] font-medium mb-0.5">Electricity</div>
          <div className="text-2xl font-semibold text-[#5856D6]">
            {summaryStats.totalPendingElectricity > 0 ? `₹${summaryStats.totalPendingElectricity.toLocaleString('en-IN')}` : '—'}
          </div>
        </div>

        {/* Next Due */}
        <div className="p-3 bg-gradient-to-br from-[#FF9500]/10 to-[#FF9500]/5 rounded-xl border border-[#FF9500]/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
          <div className="text-[10px] text-[#FF9500] font-medium mb-0.5">Next Due</div>
          <div className="text-sm font-semibold text-[#FF9500]">
            {summaryStats.nextDueDate ? formatDateIST(summaryStats.nextDueDate) : 'None'}
          </div>
        </div>
      </div>

      {/* Calendar Card with Glassmorphism */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)]">
        <CardContent className="pt-4 px-3 pb-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0 hover:bg-[#F2F2F7] transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </Button>
            
            <div className="text-center">
              <h3 className="font-semibold text-[15px] tracking-[-0.022em] text-[#1C1C1E]">
                {formatMonthYear(currentMonth)}
              </h3>
              {!isCurrentMonth && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={goToToday}
                  className="h-auto p-0 text-[10px] text-[#007AFF]"
                >
                  Go to today
                </Button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0 hover:bg-[#F2F2F7] transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </Button>
          </div>

          {/* Mobile Week/Month Toggle */}
          <div className="flex items-center justify-center gap-2 mb-3 lg:hidden">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
              className={cn(
                "h-7 px-3 text-xs transition-all duration-200",
                viewMode === 'month' 
                  ? "bg-[#007AFF] text-white hover:bg-[#007AFF]/90" 
                  : "bg-white hover:bg-[#F2F2F7]"
              )}
            >
              <LayoutGrid className="w-3 h-3 mr-1" />
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
              className={cn(
                "h-7 px-3 text-xs transition-all duration-200",
                viewMode === 'week' 
                  ? "bg-[#007AFF] text-white hover:bg-[#007AFF]/90" 
                  : "bg-white hover:bg-[#F2F2F7]"
              )}
            >
              <Grid3x3 className="w-3 h-3 mr-1" />
              Week
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "text-center text-[10px] font-semibold text-[#8E8E93] uppercase py-1",
                    (idx === 0 || idx === 6) && "text-[#C7C7CC]"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div 
              className="grid grid-cols-7 gap-1"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {displayDays.map((date, idx) => {
                const isCurrentMonthDay = date.getMonth() === currentMonth.getMonth();
                const isToday = isSameDay(date, today);
                const dateKey = getDateKey(date);
                const events = eventsByDate.get(dateKey) || [];
                const isPending = isDatePending(date);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isJoining = events.some(e => e.type === 'joining');

                return (
                  <div
                    key={idx}
                    className={cn(
                      "relative aspect-square p-1.5 rounded-lg transition-all duration-200 ease-out cursor-pointer",
                      !isCurrentMonthDay && "text-[#C7C7CC]",
                      isCurrentMonthDay && events.length > 0 && "hover:bg-[#F9F9FB] hover:scale-[1.03] hover:shadow-md",
                      isPending && isCurrentMonthDay && "bg-gradient-to-br from-[#FF3B30]/5 to-[#FF9500]/10",
                      isJoining && "ring-2 ring-[#34C759]/30"
                    )}
                    onMouseEnter={(e) => handleDateHover(date, e)}
                    onMouseLeave={handleDateLeave}
                    onClick={() => handleDateClick(date)}
                  >
                    {/* Date number */}
                    <div className={cn(
                      "text-center text-sm font-semibold mb-1",
                      isToday && "bg-[#007AFF] text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto ring-2 ring-[#007AFF] ring-offset-1 animate-pulse",
                      !isToday && isCurrentMonthDay && "text-[#1C1C1E]",
                      !isToday && !isCurrentMonthDay && "text-[#C7C7CC]",
                      isWeekend && !isToday && "text-[#8E8E93]"
                    )}>
                      {date.getDate()}
                    </div>

                    {/* Event dots (max 3 + overflow) */}
                    {events.length > 0 && (
                      <div className="flex items-center justify-center gap-0.5 flex-wrap">
                        {events.slice(0, 3).map((event, eventIdx) => {
                          const eventColor = getRentDueColor(event);
                          return (
                            <div
                              key={eventIdx}
                              className="w-2 h-2 rounded-full transition-all duration-200"
                              style={{ backgroundColor: eventColor }}
                            />
                          );
                        })}
                        {events.length > 3 && (
                          <span className="text-[9px] text-[#8E8E93] ml-0.5">+{events.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-[#1C1C1E]">Legend</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
              className="text-xs h-7 lg:hidden"
            >
              {showLegend ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          {/* Always visible on lg+, toggle on mobile */}
          <div className={cn(
            "grid grid-cols-2 md:grid-cols-4 gap-3",
            "lg:grid", // Always show on large screens
            showLegend ? "grid" : "hidden" // Toggle on small screens
          )}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 flex-shrink-0" style={{ color: '#34C759' }} strokeWidth={2} />
              <span className="text-xs text-[#1C1C1E]">Joining</span>
            </div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 flex-shrink-0" style={{ color: '#FF9500' }} strokeWidth={2} />
              <span className="text-xs text-[#1C1C1E]">Rent Due</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 flex-shrink-0" style={{ color: '#30D158' }} strokeWidth={2} />
              <span className="text-xs text-[#1C1C1E]">Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 flex-shrink-0" style={{ color: '#007AFF' }} strokeWidth={2} />
              <span className="text-xs text-[#1C1C1E]">Plan Change</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 flex-shrink-0" style={{ color: '#5856D6' }} strokeWidth={2} />
              <span className="text-xs text-[#1C1C1E]">Electricity</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 flex-shrink-0" style={{ color: '#FF9500' }} strokeWidth={2} />
              <span className="text-xs text-[#1C1C1E]">Notice/Leaving</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Details Sheet */}
      <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent className="w-[90vw] sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[19px] font-semibold tracking-[-0.022em]">
              {selectedDate && new Date(selectedDate).toLocaleDateString('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-3">
            {selectedDate && eventsByDate.get(selectedDate)?.map((event, idx) => {
              const Icon = EVENT_ICONS[event.type];
              const eventColor = getRentDueColor(event);
              
              return (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: `${eventColor}08`,
                    borderColor: `${eventColor}30`
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${eventColor}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: eventColor }} strokeWidth={2} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {event.type === 'joining' && (
                        <>
                          <h4 className="font-semibold text-[15px] text-[#1C1C1E] mb-1">Joined PG</h4>
                          <p className="text-sm text-[#8E8E93]">Resident joined the property</p>
                        </>
                      )}
                      
                      {event.type === 'rent_due' && 'amount' in event.data && (
                        <>
                          <h4 className="font-semibold text-[15px] text-[#1C1C1E] mb-1">Rent Due</h4>
                          <div className="space-y-1">
                            <p className="text-lg font-semibold" style={{ color: eventColor }}>
                              ₹{event.data.amount.toLocaleString('en-IN')}
                            </p>
                            {'planName' in event.data && (
                              <p className="text-sm text-[#8E8E93]">{event.data.planName}</p>
                            )}
                            {'status' in event.data && (
                              <Badge 
                                className="text-xs h-5 px-2 capitalize" 
                                style={{ 
                                  backgroundColor: eventColor + '20', 
                                  color: eventColor,
                                  border: `1px solid ${eventColor}40`
                                }}
                              >
                                {event.data.status}
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                      
                      {event.type === 'rent_pending' && 'amount' in event.data && (
                        <>
                          <h4 className="font-semibold text-[15px] text-[#FF3B30] mb-1">Rent Pending</h4>
                          <p className="text-lg font-semibold text-[#FF3B30]">
                            ₹{event.data.amount.toLocaleString('en-IN')}
                          </p>
                        </>
                      )}
                      
                      {event.type === 'payment' && 'amount' in event.data && (
                        <>
                          <h4 className="font-semibold text-[15px] text-[#1C1C1E] mb-1">Payment Received</h4>
                          <div className="space-y-1">
                            <p className="text-lg font-semibold text-[#34C759]">
                              ₹{event.data.amount.toLocaleString('en-IN')}
                            </p>
                            {'method' in event.data && 'type' in event.data && (
                              <p className="text-sm text-[#8E8E93] capitalize">
                                {event.data.method} • {event.data.type}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                      
                      {event.type === 'plan_change' && 'planName' in event.data && (
                        <>
                          <h4 className="font-semibold text-[15px] text-[#1C1C1E] mb-1">Plan Changed</h4>
                          <p className="text-sm text-[#8E8E93]">{event.data.planName}</p>
                          {'price' in event.data && (
                            <p className="text-sm font-medium text-[#1C1C1E] mt-1">
                              ₹{event.data.price.toLocaleString('en-IN')}/month
                            </p>
                          )}
                        </>
                      )}
                      
                      {event.type === 'electricity' && 'amount' in event.data && (
                        <>
                          <h4 className="font-semibold text-[15px] text-[#1C1C1E] mb-1">Electricity Bill</h4>
                          <p className="text-lg font-semibold" style={{ color: eventColor }}>
                            ₹{event.data.amount.toLocaleString('en-IN')}
                          </p>
                        </>
                      )}
                      
                      {event.type === 'notice' && (
                        <>
                          <h4 className="font-semibold text-[15px] text-[#FF9500] mb-1">Notice Given</h4>
                          <p className="text-sm text-[#8E8E93]">Resident submitted leave notice</p>
                        </>
                      )}
                      
                      {event.type === 'leaving' && (
                        <>
                          <h4 className="font-semibold text-[15px] text-[#FF9500] mb-1">Expected Leaving</h4>
                          <p className="text-sm text-[#8E8E93]">Scheduled check-out date</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Link to full profile */}
            <Link 
              href={`/residents/${resident._id}`}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 transition-all duration-200 text-sm font-medium"
            >
              View Full Profile
              <ExternalLink className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Tooltip */}
      {renderTooltip()}
    </div>
  );
}
