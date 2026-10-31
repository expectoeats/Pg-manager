'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Star, Receipt, CreditCard, ClipboardList, Zap, Bell, Calendar as CalendarIcon } from 'lucide-react';
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
  rent_due: '#FF9500',
  payment: '#30D158',
  notice: '#FF9500',
  leaving: '#FF3B30',
  plan_change: '#007AFF',
  electricity: '#AF52DE',
};

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

  // Render event tooltip
  const renderTooltip = () => {
    if (!hoveredDate || !hoveredPosition) return null;

    const events = eventsByDate.get(hoveredDate) || [];
    if (events.length === 0) return null;

    return (
      <div
        className="fixed z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] p-3 min-w-[180px] max-w-[280px] pointer-events-none"
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
            return (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <Icon 
                  className="w-4 h-4 flex-shrink-0 mt-0.5" 
                  style={{ color: EVENT_COLORS[event.type] }}
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
                    <span className="font-medium text-[#FF3B30]">Expected Leaving</span>
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
      {/* Calendar and Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Card */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0 hover:bg-[#F2F2F7]"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2} />
              </Button>
              
              <div className="text-center">
                <h3 className="font-semibold text-[17px] tracking-[-0.022em] text-[#1C1C1E]">
                  {formatMonthYear(currentMonth)}
                </h3>
                {!isCurrentMonth && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={goToToday}
                    className="h-auto p-0 text-xs text-[#007AFF]"
                  >
                    Go to today
                  </Button>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0 hover:bg-[#F2F2F7]"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2} />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "text-center text-xs font-semibold text-[#8E8E93] uppercase py-2",
                      (idx === 0 || idx === 6) && "text-[#C7C7CC]"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, idx) => {
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
                        "relative aspect-square p-1 rounded-lg transition-all duration-200 ease-out cursor-pointer",
                        !isCurrentMonthDay && "text-[#C7C7CC]",
                        isCurrentMonthDay && "hover:bg-[#F9F9FB] hover:scale-105 hover:shadow-sm",
                        isPending && isCurrentMonthDay && "bg-gradient-to-br from-[#FF3B30]/5 to-[#FF9500]/10",
                        isJoining && "ring-2 ring-[#34C759]/30"
                      )}
                      onMouseEnter={(e) => handleDateHover(date, e)}
                      onMouseLeave={handleDateLeave}
                    >
                      {/* Date number */}
                      <div className={cn(
                        "text-center text-sm font-medium mb-1",
                        isToday && "bg-[#007AFF] text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto",
                        !isToday && isCurrentMonthDay && "text-[#1C1C1E]",
                        !isToday && !isCurrentMonthDay && "text-[#C7C7CC]",
                        isWeekend && !isToday && "text-[#8E8E93]"
                      )}>
                        {date.getDate()}
                      </div>

                      {/* Event dots */}
                      {events.length > 0 && (
                        <div className="flex items-center justify-center gap-0.5 flex-wrap">
                          {events.slice(0, 3).map((event, eventIdx) => (
                            <div
                              key={eventIdx}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: EVENT_COLORS[event.type] }}
                            />
                          ))}
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

        {/* Summary Panel */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-[17px] tracking-[-0.022em] text-[#1C1C1E] mb-4">Summary</h3>
            
            <div className="space-y-4">
              {/* Days stayed */}
              <div className="p-3 bg-[#F2F2F7] rounded-xl">
                <div className="text-xs text-[#8E8E93] mb-1">Total Days</div>
                <div className="text-2xl font-semibold text-[#1C1C1E]">{summaryStats.daysStayed}</div>
                <div className="text-xs text-[#8E8E93] mt-1">
                  Since {formatDateIST(resident.joiningDate)}
                </div>
              </div>

              {/* Pending rent */}
              {summaryStats.totalPendingRent > 0 && (
                <div className="p-3 bg-[#FF3B30]/10 rounded-xl border border-[#FF3B30]/20">
                  <div className="text-xs text-[#FF3B30] mb-1">Pending Rent</div>
                  <div className="text-xl font-semibold text-[#FF3B30]">
                    ₹{summaryStats.totalPendingRent.toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              {/* Pending electricity */}
              {summaryStats.totalPendingElectricity > 0 && (
                <div className="p-3 bg-[#AF52DE]/10 rounded-xl border border-[#AF52DE]/20">
                  <div className="text-xs text-[#AF52DE] mb-1">Pending Electricity</div>
                  <div className="text-xl font-semibold text-[#AF52DE]">
                    ₹{summaryStats.totalPendingElectricity.toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              {/* Next due date */}
              {summaryStats.nextDueDate && (
                <div className="p-3 bg-[#FF9500]/10 rounded-xl border border-[#FF9500]/20">
                  <div className="text-xs text-[#FF9500] mb-1">Next Rent Due</div>
                  <div className="text-sm font-medium text-[#FF9500]">
                    {formatDateIST(summaryStats.nextDueDate)}
                  </div>
                </div>
              )}

              {/* Current plan */}
              {resident.currentPlan && (
                <div className="p-3 bg-[#007AFF]/10 rounded-xl border border-[#007AFF]/20">
                  <div className="text-xs text-[#007AFF] mb-1">Current Plan</div>
                  <div className="text-sm font-medium text-[#1C1C1E]">
                    {resident.currentPlan.name}
                  </div>
                  <div className="text-xs text-[#8E8E93] mt-1">
                    ₹{resident.currentPlan.price.toLocaleString('en-IN')}/month
                  </div>
                </div>
              )}

              {/* All clear message */}
              {summaryStats.totalPendingRent === 0 && summaryStats.totalPendingElectricity === 0 && (
                <div className="p-3 bg-[#34C759]/10 rounded-xl border border-[#34C759]/20">
                  <div className="text-sm font-medium text-[#34C759] text-center">
                    ✓ All dues cleared
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
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
            {Object.entries(EVENT_COLORS).map(([type, color]) => {
              const Icon = EVENT_ICONS[type as keyof typeof EVENT_ICONS];
              const label = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <div key={type} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} strokeWidth={2} />
                  <span className="text-xs text-[#1C1C1E] capitalize">{label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tooltip */}
      {renderTooltip()}
    </div>
  );
}
