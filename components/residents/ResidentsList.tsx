'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Eye,
  Clock,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateNextRentDue } from '@/lib/utils/rentCalculations';

interface ResidentData {
  _id: string;
  name: string;
  mobile: string;
  joiningDate: string;
  billingMode?: 'calendar' | 'joining_cycle';
  status: 'active' | 'notice' | 'left';
  room?: { roomNumber: string } | null;
  bed?: { bedLabel: string } | null;
  currentPlan?: { name: string; price: number } | null;
  pendingAmount?: number;
  oldestDueDate?: string | null;
  oldestMonth?: string | null;
  unpaidCount?: number;
}

interface PlanData {
  _id: string;
  name: string;
}

interface RoomData {
  _id: string;
  roomNumber: string;
}

interface ResidentsListProps {
  residents: ResidentData[];
  plans: PlanData[];
  rooms: RoomData[];
  initialFilters: { status?: string; planId?: string; roomId?: string };
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-[#34C759]/10 text-[#34C759] border-transparent',
  notice: 'bg-[#FF9500]/10 text-[#FF9500] border-transparent',
  left: 'bg-[#8E8E93]/10 text-[#8E8E93] border-transparent',
};

export default function ResidentsList({
  residents,
  plans,
  rooms,
  initialFilters,
}: ResidentsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/residents?${params.toString()}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="font-semibold text-xl sm:text-[22px] tracking-tight text-[#1C1C1E]">
            Residents
          </h1>
          <Badge
            variant="outline"
            className="rounded-full bg-[#007AFF]/10 text-[#007AFF] border-transparent text-xs"
          >
            {residents.length}
          </Badge>
        </div>
        <Button
          onClick={() => router.push('/residents/new')}
          className="h-9 sm:h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" strokeWidth={2} />
          Add Resident
        </Button>
      </div>

      {/* Filters - responsive 3 cols on mobile, flex on desktop */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-4 sm:mb-6 sm:flex sm:flex-wrap">
        <Select
          value={initialFilters.status || 'all'}
          onValueChange={(v) => updateFilter('status', v)}
        >
          <SelectTrigger className="w-full sm:w-36 h-9 sm:h-11 rounded-xl border-[#E5E5EA] text-xs sm:text-sm px-2.5 sm:px-3">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="notice">On Notice</SelectItem>
            <SelectItem value="left">Left</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={initialFilters.planId || 'all'}
          onValueChange={(v) => updateFilter('planId', v)}
        >
          <SelectTrigger className="w-full sm:w-44 h-9 sm:h-11 rounded-xl border-[#E5E5EA] text-xs sm:text-sm px-2.5 sm:px-3">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {plans.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={initialFilters.roomId || 'all'}
          onValueChange={(v) => updateFilter('roomId', v)}
        >
          <SelectTrigger className="w-full sm:w-36 h-9 sm:h-11 rounded-xl border-[#E5E5EA] text-xs sm:text-sm px-2.5 sm:px-3">
            <SelectValue placeholder="Room" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            {rooms.map((r) => (
              <SelectItem key={r._id} value={r._id}>
                Room {r.roomNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {residents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#F2F2F7] rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-[#8E8E93]" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium text-[#1C1C1E] mb-2">No residents found</h3>
          <p className="text-sm text-[#8E8E93] mb-4">
            {Object.values(initialFilters).some(Boolean)
              ? 'No residents match the current filters.'
              : 'Add your first resident to get started.'}
          </p>
          {!Object.values(initialFilters).some(Boolean) && (
            <Button onClick={() => router.push('/residents/new')} className="h-11">
              <Plus className="w-5 h-5 mr-2" strokeWidth={2} /> Add Resident
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">
                    Name
                  </TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">
                    Mobile
                  </TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">
                    Room / Bed
                  </TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">
                    Plan
                  </TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">
                    Rent Status & Cycle
                  </TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide text-right">
                    Pending Dues
                  </TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((r) => {
                  const hasDue = (r.pendingAmount || 0) > 0;
                  const paymentInfo =
                    r.status === 'active' || r.status === 'notice'
                      ? calculateNextRentDue(
                          r.joiningDate,
                          r.billingMode || 'joining_cycle',
                          r.currentPlan?.price || 7000,
                          r.pendingAmount || 0,
                          r.oldestDueDate
                        )
                      : null;

                  return (
                    <TableRow key={r._id} className="hover:bg-[#F9F9FB]">
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] font-semibold text-sm flex-shrink-0">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-[#1C1C1E]">{r.name}</span>
                        </div>
                      </TableCell>

                      {/* Mobile */}
                      <TableCell className="text-[#1C1C1E] text-sm">{r.mobile}</TableCell>

                      {/* Room / Bed */}
                      <TableCell className="text-sm text-[#1C1C1E]">
                        {r.room && r.bed ? (
                          <span className="font-medium">
                            {r.room.roomNumber} / {r.bed.bedLabel}
                          </span>
                        ) : (
                          <span className="text-[#8E8E93]">—</span>
                        )}
                      </TableCell>

                      {/* Plan */}
                      <TableCell className="text-sm text-[#1C1C1E]">
                        {r.currentPlan?.name || <span className="text-[#8E8E93]">—</span>}
                      </TableCell>

                      {/* Next Payment / Overdue status */}
                      <TableCell>
                        {paymentInfo ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                                paymentInfo.isOverdue && 'animate-pulse'
                              )}
                              style={{
                                backgroundColor: paymentInfo.bgColor,
                                color: paymentInfo.textColor,
                                borderColor: paymentInfo.isOverdue
                                  ? 'rgba(255, 59, 48, 0.3)'
                                  : 'rgba(52, 199, 89, 0.3)',
                              }}
                            >
                              {paymentInfo.isOverdue ? (
                                <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
                              ) : paymentInfo.daysLeft <= 5 ? (
                                <Clock className="w-4 h-4" strokeWidth={2.5} />
                              ) : (
                                <Calendar className="w-4 h-4" strokeWidth={2} />
                              )}
                              <span>{paymentInfo.label}</span>
                            </div>

                            {paymentInfo.isOverdue ? (
                              <span className="text-xs font-bold text-[#FF3B30]">
                                (₹{(r.pendingAmount || paymentInfo.amount).toLocaleString('en-IN')})
                              </span>
                            ) : (
                              <span className="text-xs text-[#8E8E93]">
                                ₹{paymentInfo.amount.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#8E8E93] text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Pending Dues Highlight */}
                      <TableCell className="text-right">
                        {hasDue ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30 shadow-2xs">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            ₹{r.pendingAmount!.toLocaleString('en-IN')} Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-full text-xs capitalize',
                              STATUS_BADGE[r.status]
                            )}
                          >
                            {r.status === 'notice' ? 'On Notice' : r.status}
                          </Badge>
                          {hasDue && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse"
                              title="Rent Due"
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Link href={`/residents/${r._id}`} prefetch={false}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs rounded-lg hover:bg-[#F2F2F7]"
                          >
                            <Eye className="w-4 h-4 mr-1" strokeWidth={2} /> View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {residents.map((r) => {
              const hasDue = (r.pendingAmount || 0) > 0;
              const paymentInfo =
                r.status === 'active' || r.status === 'notice'
                  ? calculateNextRentDue(
                      r.joiningDate,
                      r.billingMode || 'joining_cycle',
                      r.currentPlan?.price || 7000,
                      r.pendingAmount || 0,
                      r.oldestDueDate
                    )
                  : null;

              return (
                <Link key={r._id} href={`/residents/${r._id}`} prefetch={false}>
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5EA] p-4 active:scale-[0.99] transition-all">
                    {/* Header: Name, Mobile, Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] font-bold text-sm">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[15px] text-[#1C1C1E]">{r.name}</p>
                          <p className="text-xs text-[#8E8E93]">{r.mobile}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-full text-xs capitalize',
                          STATUS_BADGE[r.status]
                        )}
                      >
                        {r.status === 'notice' ? 'On Notice' : r.status}
                      </Badge>
                    </div>

                    {/* Rent Status Banner on Mobile */}
                    {paymentInfo && (
                      <div
                        className={cn(
                          'mb-3 p-3 rounded-xl flex items-center justify-between transition-all border',
                          paymentInfo.isOverdue
                            ? 'bg-[#FF3B30]/10 border-[#FF3B30]/30 animate-pulse'
                            : 'bg-[#34C759]/10 border-[#34C759]/20'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {paymentInfo.isOverdue ? (
                            <AlertCircle className="w-5 h-5 text-[#FF3B30] flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-[#34C759] flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'text-xs font-bold truncate',
                                paymentInfo.isOverdue ? 'text-[#FF3B30]' : 'text-[#34C759]'
                              )}
                            >
                              {paymentInfo.isOverdue
                                ? `Rent Due: ₹${(r.pendingAmount || paymentInfo.amount).toLocaleString('en-IN')}`
                                : `Rent Clear: Next in ${paymentInfo.daysLeft} days`}
                            </p>
                            <p
                              className={cn(
                                'text-[11px] font-medium truncate',
                                paymentInfo.isOverdue ? 'text-[#FF3B30]/85' : 'text-[#34C759]/85'
                              )}
                            >
                              {paymentInfo.isOverdue
                                ? `Month cycle: ${paymentInfo.label}`
                                : `Due on ${paymentInfo.nextDueDate.toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}`}
                            </p>
                          </div>
                        </div>

                        <Badge
                          className={cn(
                            'text-[10px] px-2 py-0.5 flex-shrink-0 font-semibold',
                            paymentInfo.isOverdue
                              ? 'bg-[#FF3B30] text-white border-transparent'
                              : 'bg-[#34C759] text-white border-transparent'
                          )}
                        >
                          {paymentInfo.isOverdue ? 'Overdue' : 'Clear'}
                        </Badge>
                      </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-[#F2F2F7]">
                      <div>
                        <span className="text-[#8E8E93] text-xs">Room / Bed</span>
                        <p className="text-[#1C1C1E] font-medium text-xs mt-0.5">
                          {r.room && r.bed
                            ? `Room ${r.room.roomNumber} • Bed ${r.bed.bedLabel}`
                            : '—'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[#8E8E93] text-xs">Plan</span>
                        <p className="text-[#1C1C1E] font-medium text-xs mt-0.5 truncate">
                          {r.currentPlan?.name || '—'}
                        </p>
                      </div>

                      <div className="col-span-2 pt-1 flex items-center justify-between">
                        <div>
                          <span className="text-[#8E8E93] text-xs">Pending Dues: </span>
                          <span
                            className={cn(
                              'font-bold text-xs',
                              hasDue ? 'text-[#FF3B30]' : 'text-[#34C759]'
                            )}
                          >
                            {hasDue
                              ? `₹${r.pendingAmount!.toLocaleString('en-IN')} (Unpaid)`
                              : '₹0 (Clear)'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#007AFF] flex items-center gap-1">
                          Profile <Eye className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
