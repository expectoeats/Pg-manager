'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
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
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardCalendarData } from '@/lib/services/dashboard-calendar';

interface DashboardCalendarProps {
  initialData: DashboardCalendarData;
  initialMonth: string;
}

type ViewMode = 'grid' | 'heatmap' | 'agenda';
type FilterType = 'all' | 'payments' | 'checkins' | 'checkouts' | 'notices' | 'electricity';

const EVENT_COLORS = {
  payment: '#30D158',
  checkin: '#34C759',
  checkout: '#FF9500',
  rentdue: '#FF3B30',
  notice: '#FF9500',
  electricity: '#5856D6',
  deposit: '#007AFF'
};

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthYear(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
}

function getHeatmapColor(score: number): string {
  if (score === 0) return '#F2F2F7';
  if (score <= 20) return '#BFD9FF';
  if (score <= 50) return '#7FBFFF';
  if (score <= 100) return '#007AFF';
  return '#0055CC';
}

export default function DashboardCalendar({ initialData, initialMonth }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [calendarData, setCalendarData] = useState(initialData);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<FilterType[]>(['all']);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Build event maps
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Array<{ type: string; color: string; count: number; data: any }>>();

    // Add payments
    calendarData.paymentsData.forEach(p => {
      if (!map.has(p.date)) map.set(p.date, []);
      map.get(p.date)!.push({
        type: 'payment',
        color: EVENT_COLORS.payment,
        count: p.count,
        data: p
      });
    });

    // Add rent dues
    calendarData.rentDueData.forEach(r => {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push({
        type: 'rentdue',
        color: EVENT_COLORS.rentdue,
        count: r.count,
        data: r
      });
    });

    // Add check-ins
    calendarData.checkinsData.forEach(c => {
      if (!map.has(c.date)) map.set(c.date, []);
      map.get(c.date)!.push({
        type: 'checkin',
        color: EVENT_COLORS.checkin,
        count: c.count,
        data: c
      });
    });

    // Add checkouts
    calendarData.checkoutsData.forEach(c => {
      if (!map.has(c.date)) map.set(c.date, []);
      map.get(c.date)!.push({
        type: 'checkout',
        color: EVENT_COLORS.checkout,
        count: c.count,
        data: c
      });
    });

    // Add notices
    calendarData.noticesData.forEach(n => {
      if (!map.has(n.date)) map.set(n.date, []);
      map.get(n.date)!.push({
        type: 'notice',
        color: EVENT_COLORS.notice,
        count: n.count,
        data: n
      });
    });

    return map;
  }, [calendarData]);

  // Heatmap score map
  const heatmapScores = useMemo(() => {
    const map = new Map<string, number>();
    calendarData.heatmapData.forEach(h => {
      map.set(h.date, h.score);
    });
    return map;
  }, [calendarData]);

  // Filter events
  const filteredEventsByDate = useMemo(() => {
    if (filters.includes('all')) return eventsByDate;

    const filtered = new Map<string, Array<{ type: string; color: string; count: number; data: any }>>();
    
    eventsByDate.forEach((events, date) => {
      const filteredEvents = events.filter(e => {
        if (filters.includes('payments') && e.type === 'payment') return true;
        if (filters.includes('checkins') && e.type === 'checkin') return true;
        if (filters.includes('checkouts') && e.type === 'checkout') return true;
        if (filters.includes('notices') && e.type === 'notice') return true;
        return false;
      });

      if (filteredEvents.length > 0) {
        filtered.set(date, filteredEvents);
      }
    });

    return filtered;
  }, [eventsByDate, filters]);

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const [year, monthNum] = currentMonth.split('-').map(Number);
    const firstDayOfMonth = new Date(year, monthNum - 1, 1);
    
    // Find the Sunday before or on the first day
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Calculate 6 weeks
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  // Agenda view data - next 14 days from today
  const agendaDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days: Array<{ date: Date; dateKey: string; events: any[] }> = [];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateKey = getDateKey(date);
      const events = filteredEventsByDate.get(dateKey) || [];
      
      if (events.length > 0 || i === 0) { // Always show today
        days.push({ date, dateKey, events });
      }
    }
    
    return days;
  }, [filteredEventsByDate]);

  const goToPreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevMonth = new Date(year, month - 2, 1);
    const newMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    
    setCurrentMonth(newMonth);
    // In production, fetch new data here
    // startTransition(async () => {
    //   const newData = await getDashboardCalendarData(newMonth);
    //   setCalendarData(newData);
    // });
  };

  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextMonth = new Date(year, month, 1);
    const newMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    
    setCurrentMonth(newMonth);
    // In production, fetch new data here
  };

  const toggleFilter = (filter: FilterType) => {
    if (filter === 'all') {
      setFilters(['all']);
    } else {
      const newFilters = filters.includes(filter)
        ? filters.filter(f => f !== filter)
        : [...filters.filter(f => f !== 'all'), filter];
      
      setFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  const handleDateClick = (date: Date) => {
    const dateKey = getDateKey(date);
    const events = filteredEventsByDate.get(dateKey);
    
    if (events && events.length > 0) {
      setSelectedDate(dateKey);
    }
  };

  const handleDateHover = (date: Date, event: React.MouseEvent) => {
    const dateKey = getDateKey(date);
    const events = filteredEventsByDate.get(dateKey);
    
    if (events && events.length > 0 && viewMode === 'grid') {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
  const isCurrentMonth = currentMonthNum === today.getMonth() + 1 && currentYear === today.getFullYear();

  // Render tooltip for grid view
  const renderTooltip = () => {
    if (!hoveredDate || !hoveredPosition || viewMode !== 'grid') return null;

    const events = filteredEventsByDate.get(hoveredDate) || [];
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
          {events.map((event, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: event.color }}
              />
              <span className="font-medium text-[#1C1C1E] capitalize">{event.type}</span>
              <span className="text-[#8E8E93]">({event.count})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="space-y-4"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif' }}
    >
      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => toggleFilter('payments')}
          className={cn(
            "p-3 rounded-xl border transition-all duration-200 text-left",
            "hover:scale-[1.02] hover:shadow-md cursor-pointer",
            filters.includes('payments') && !filters.includes('all')
              ? "bg-[#30D158]/10 border-[#30D158]/40"
              : "bg-gradient-to-br from-[#30D158]/10 to-[#30D158]/5 border-[#30D158]/20"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-[#30D158]" strokeWidth={2} />
            <div className="text-[10px] text-[#30D158] font-medium">Payments</div>
          </div>
          <div className="text-xl font-semibold text-[#1C1C1E]">
            {calendarData.todaySummary.paymentsExpected}
          </div>
          <div className="text-[10px] text-[#8E8E93]">
            ₹{calendarData.todaySummary.paymentsAmount.toLocaleString('en-IN')} today
          </div>
        </button>

        <button
          onClick={() => toggleFilter('checkins')}
          className={cn(
            "p-3 rounded-xl border transition-all duration-200 text-left",
            "hover:scale-[1.02] hover:shadow-md cursor-pointer",
            filters.includes('checkins') && !filters.includes('all')
              ? "bg-[#34C759]/10 border-[#34C759]/40"
              : "bg-gradient-to-br from-[#34C759]/10 to-[#34C759]/5 border-[#34C759]/20"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#34C759]" strokeWidth={2} />
            <div className="text-[10px] text-[#34C759] font-medium">Check-ins</div>
          </div>
          <div className="text-xl font-semibold text-[#1C1C1E]">
            {calendarData.todaySummary.checkIns}
          </div>
          <div className="text-[10px] text-[#8E8E93]">Today</div>
        </button>

        <button
          onClick={() => toggleFilter('checkouts')}
          className={cn(
            "p-3 rounded-xl border transition-all duration-200 text-left",
            "hover:scale-[1.02] hover:shadow-md cursor-pointer",
            filters.includes('checkouts') && !filters.includes('all')
              ? "bg-[#FF9500]/10 border-[#FF9500]/40"
              : "bg-gradient-to-br from-[#FF9500]/10 to-[#FF9500]/5 border-[#FF9500]/20"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <DoorOpen className="w-4 h-4 text-[#FF9500]" strokeWidth={2} />
            <div className="text-[10px] text-[#FF9500] font-medium">Check-outs</div>
          </div>
          <div className="text-xl font-semibold text-[#1C1C1E]">
            {calendarData.todaySummary.checkOuts}
          </div>
          <div className="text-[10px] text-[#8E8E93]">Today</div>
        </button>

        <button
          onClick={() => toggleFilter('all')}
          className={cn(
            "p-3 rounded-xl border transition-all duration-200 text-left",
            "hover:scale-[1.02] hover:shadow-md cursor-pointer",
            filters.includes('all')
              ? "bg-[#FF3B30]/10 border-[#FF3B30]/40"
              : "bg-gradient-to-br from-[#FF3B30]/10 to-[#FF3B30]/5 border-[#FF3B30]/20"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-[#FF3B30]" strokeWidth={2} />
            <div className="text-[10px] text-[#FF3B30] font-medium">Rent Dues</div>
          </div>
          <div className="text-xl font-semibold text-[#1C1C1E]">
            {calendarData.todaySummary.rentDues}
          </div>
          <div className="text-[10px] text-[#8E8E93]">
            ₹{calendarData.todaySummary.rentDuesAmount.toLocaleString('en-IN')} today
          </div>
        </button>
      </div>

      {/* Calendar Card */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)]">
        <CardContent className="pt-4 px-3 pb-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={isPending}
              className="h-8 w-8 p-0 hover:bg-[#F2F2F7] transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </Button>
            
            <div className="text-center">
              <h3 className="font-semibold text-[15px] tracking-[-0.022em] text-[#1C1C1E]">
                {formatMonthYear(currentMonth)}
              </h3>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              disabled={isPending}
              className="h-8 w-8 p-0 hover:bg-[#F2F2F7] transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                "h-8 px-4 text-xs rounded-xl transition-all duration-200",
                viewMode === 'grid'
                  ? "bg-[#007AFF] text-white hover:bg-[#007AFF]/90"
                  : "bg-white hover:bg-[#F2F2F7]"
              )}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'heatmap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('heatmap')}
              className={cn(
                "h-8 px-4 text-xs rounded-xl transition-all duration-200",
                viewMode === 'heatmap'
                  ? "bg-[#007AFF] text-white hover:bg-[#007AFF]/90"
                  : "bg-white hover:bg-[#F2F2F7]"
              )}
            >
              Heatmap
            </Button>
            <Button
              variant={viewMode === 'agenda' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('agenda')}
              className={cn(
                "h-8 px-4 text-xs rounded-xl transition-all duration-200",
                viewMode === 'agenda'
                  ? "bg-[#007AFF] text-white hover:bg-[#007AFF]/90"
                  : "bg-white hover:bg-[#F2F2F7]"
              )}
            >
              Agenda
            </Button>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
            {(['all', 'payments', 'checkins', 'checkouts', 'notices'] as FilterType[]).map(filter => (
              <Badge
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={cn(
                  "text-xs px-3 py-1 cursor-pointer transition-all duration-200 capitalize",
                  filters.includes(filter)
                    ? "bg-[#007AFF] text-white hover:bg-[#007AFF]/90"
                    : "bg-[#F2F2F7] text-[#8E8E93] hover:bg-[#E5E5EA]"
                )}
              >
                {filter}
              </Badge>
            ))}
          </div>

          {/* Calendar Views */}
          {viewMode === 'grid' && (
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
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, idx) => {
                  const isCurrentMonthDay = date.getMonth() === (currentMonthNum - 1);
                  const isToday = getDateKey(date) === getDateKey(today);
                  const dateKey = getDateKey(date);
                  const events = filteredEventsByDate.get(dateKey) || [];
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "relative aspect-square p-1.5 rounded-lg transition-all duration-200 ease-out cursor-pointer",
                        !isCurrentMonthDay && "text-[#C7C7CC]",
                        isCurrentMonthDay && events.length > 0 && "hover:bg-[#F9F9FB] hover:scale-[1.03] hover:shadow-md"
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

                      {/* Event dots */}
                      {events.length > 0 && (
                        <div className="flex items-center justify-center gap-0.5 flex-wrap">
                          {events.slice(0, 4).map((event, eventIdx) => (
                            <div
                              key={eventIdx}
                              className="w-2 h-2 rounded-full transition-all duration-200"
                              style={{ backgroundColor: event.color }}
                            />
                          ))}
                          {events.length > 4 && (
                            <span className="text-[9px] text-[#8E8E93] ml-0.5">+{events.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'heatmap' && (
            <div className="space-y-1">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div
                    key={idx}
                    className="text-center text-[10px] font-semibold text-[#8E8E93] uppercase py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days with heatmap colors */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, idx) => {
                  const isCurrentMonthDay = date.getMonth() === (currentMonthNum - 1);
                  const isToday = getDateKey(date) === getDateKey(today);
                  const dateKey = getDateKey(date);
                  const score = heatmapScores.get(dateKey) || 0;
                  const bgColor = isCurrentMonthDay ? getHeatmapColor(score) : '#F2F2F7';

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "relative aspect-square p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
                        isCurrentMonthDay && score > 0 && "hover:scale-[1.05] hover:shadow-md"
                      )}
                      style={{ backgroundColor: bgColor }}
                      onClick={() => handleDateClick(date)}
                      title={`Activity score: ${score}`}
                    >
                      <div className={cn(
                        "text-center text-sm font-semibold",
                        isToday && "bg-white/90 rounded-full w-6 h-6 flex items-center justify-center mx-auto ring-2 ring-[#007AFF]",
                        !isToday && isCurrentMonthDay && score > 50 && "text-white",
                        !isToday && isCurrentMonthDay && score <= 50 && "text-[#1C1C1E]",
                        !isToday && !isCurrentMonthDay && "text-[#C7C7CC]"
                      )}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Heatmap legend */}
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-[#E5E5EA]">
                <span className="text-[10px] text-[#8E8E93]">Less</span>
                {[0, 20, 50, 100, 120].map((score, idx) => (
                  <div
                    key={idx}
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: getHeatmapColor(score) }}
                  />
                ))}
                <span className="text-[10px] text-[#8E8E93]">More</span>
              </div>
            </div>
          )}

          {viewMode === 'agenda' && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {agendaDays.length === 0 ? (
                <div className="text-center py-12 text-[#8E8E93]">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" strokeWidth={2} />
                  <p className="font-medium">No upcoming events</p>
                </div>
              ) : (
                agendaDays.map(({ date, dateKey, events }) => {
                  const isToday = getDateKey(date) === getDateKey(today);
                  
                  return (
                    <div key={dateKey} className="p-3 rounded-xl bg-[#F9F9FB] border border-[#E5E5EA]">
                      <div className="flex items-center gap-2 mb-2">
                        {isToday && (
                          <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
                        )}
                        <h4 className="font-semibold text-sm text-[#1C1C1E]">
                          {date.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </h4>
                        {isToday && (
                          <Badge className="text-[9px] h-4 px-1.5 bg-[#007AFF] text-white">Today</Badge>
                        )}
                      </div>
                      
                      {events.length === 0 ? (
                        <p className="text-xs text-[#8E8E93]">No events</p>
                      ) : (
                        <div className="space-y-2">
                          {events.map((event, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: event.color }}
                              />
                              <span className="font-medium text-[#1C1C1E] capitalize">{event.type}</span>
                              <span className="text-[#8E8E93]">({event.count})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Sheet */}
      <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent 
          side="right" 
          className="w-[90vw] sm:max-w-md overflow-y-auto lg:w-[400px]"
        >
          <SheetHeader>
            <SheetTitle className="text-[19px] font-semibold tracking-[-0.022em]">
              {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {selectedDate && filteredEventsByDate.get(selectedDate)?.map((event, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <h4 className="font-semibold text-[15px] text-[#1C1C1E] capitalize">{event.type}s</h4>
                </div>
                
                {event.type === 'payment' && event.data.payments && (
                  <div className="space-y-2">
                    {event.data.payments.map((p: any, i: number) => (
                      <Link key={i} href={`/residents/${p.residentId}`}>
                        <div className="p-3 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 hover:bg-[#30D158]/20 transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-[#1C1C1E]">{p.residentName}</span>
                            <ExternalLink className="w-4 h-4 text-[#8E8E93]" strokeWidth={2} />
                          </div>
                          <div className="text-xs text-[#8E8E93] mt-1">
                            ₹{p.amount.toLocaleString('en-IN')} • {p.method.toUpperCase()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {event.type === 'rentdue' && event.data.records && (
                  <div className="space-y-2">
                    {event.data.records.map((r: any, i: number) => (
                      <Link key={i} href={`/residents/${r.residentId}`}>
                        <div className="p-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20 transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-[#1C1C1E]">{r.residentName}</span>
                            <ExternalLink className="w-4 h-4 text-[#8E8E93]" strokeWidth={2} />
                          </div>
                          <div className="text-xs text-[#8E8E93] mt-1">
                            ₹{r.amount.toLocaleString('en-IN')} • {r.status}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {event.type === 'checkin' && event.data.residents && (
                  <div className="space-y-2">
                    {event.data.residents.map((r: any, i: number) => (
                      <Link key={i} href={`/residents/${r.residentId}`}>
                        <div className="p-3 rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 hover:bg-[#34C759]/20 transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-[#1C1C1E]">{r.residentName}</span>
                            <ExternalLink className="w-4 h-4 text-[#8E8E93]" strokeWidth={2} />
                          </div>
                          <div className="text-xs text-[#8E8E93] mt-1">Room {r.roomNumber}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {event.type === 'checkout' && event.data.residents && (
                  <div className="space-y-2">
                    {event.data.residents.map((r: any, i: number) => (
                      <Link key={i} href={`/residents/${r.residentId}`}>
                        <div className="p-3 rounded-xl bg-[#FF9500]/10 border border-[#FF9500]/20 hover:bg-[#FF9500]/20 transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-[#1C1C1E]">{r.residentName}</span>
                            <ExternalLink className="w-4 h-4 text-[#8E8E93]" strokeWidth={2} />
                          </div>
                          <div className="text-xs text-[#8E8E93] mt-1">Room {r.roomNumber} • {r.status}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {event.type === 'notice' && event.data.residents && (
                  <div className="space-y-2">
                    {event.data.residents.map((r: any, i: number) => (
                      <Link key={i} href={`/residents/${r.residentId}`}>
                        <div className="p-3 rounded-xl bg-[#FF9500]/10 border border-[#FF9500]/20 hover:bg-[#FF9500]/20 transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-[#1C1C1E]">{r.residentName}</span>
                            <ExternalLink className="w-4 h-4 text-[#8E8E93]" strokeWidth={2} />
                          </div>
                          <div className="text-xs text-[#8E8E93] mt-1">
                            Expected leaving: {new Date(r.expectedLeavingDate).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Tooltip for grid view */}
      {renderTooltip()}
    </div>
  );
}
