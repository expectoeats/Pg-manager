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
import { Users, Plus, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResidentData {
  _id: string;
  name: string;
  mobile: string;
  joiningDate: string;
  status: 'active' | 'notice' | 'left';
  room?: { roomNumber: string } | null;
  bed?: { bedLabel: string } | null;
  currentPlan?: { name: string; price: number } | null;
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-[22px] tracking-[-0.022em] text-[#1C1C1E]">Residents</h1>
          <Badge variant="outline" className="rounded-full bg-[#007AFF]/10 text-[#007AFF] border-transparent">
            {residents.length}
          </Badge>
        </div>
        <Button onClick={() => router.push('/residents/new')} className="h-11">
          <Plus className="w-5 h-5 mr-2" strokeWidth={2} />
          Add Resident
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Select
          value={initialFilters.status || 'all'}
          onValueChange={(v) => updateFilter('status', v)}
        >
          <SelectTrigger className="w-36 h-11 rounded-xl border-[#E5E5EA]">
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
          <SelectTrigger className="w-44 h-11 rounded-xl border-[#E5E5EA]">
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
          <SelectTrigger className="w-36 h-11 rounded-xl border-[#E5E5EA]">
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
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Name</TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Mobile</TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Room / Bed</TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Plan</TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Joining</TableHead>
                  <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-right text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((r) => (
                  <TableRow key={r._id} className="hover:bg-[#F9F9FB]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] font-semibold text-sm flex-shrink-0">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-[#1C1C1E]">{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#1C1C1E] text-sm">{r.mobile}</TableCell>
                    <TableCell className="text-sm text-[#1C1C1E]">
                      {r.room && r.bed ? (
                        <span>{r.room.roomNumber} / {r.bed.bedLabel}</span>
                      ) : (
                        <span className="text-[#8E8E93]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[#1C1C1E]">
                      {r.currentPlan?.name || <span className="text-[#8E8E93]">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-[#1C1C1E]">
                      {new Date(r.joiningDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('rounded-full text-xs capitalize', STATUS_BADGE[r.status])}>
                        {r.status === 'notice' ? 'On Notice' : r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/residents/${r._id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs rounded-lg hover:bg-[#F2F2F7]">
                          <Eye className="w-5 h-5 mr-1" strokeWidth={2} /> View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {residents.map((r) => (
              <Link key={r._id} href={`/residents/${r._id}`}>
                <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-[#E5E5EA] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] font-semibold">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1C1E]">{r.name}</p>
                        <p className="text-xs text-[#8E8E93]">{r.mobile}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('rounded-full text-xs capitalize', STATUS_BADGE[r.status])}>
                      {r.status === 'notice' ? 'On Notice' : r.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#8E8E93] text-xs">Room/Bed</span>
                      <p className="text-[#1C1C1E] font-medium">
                        {r.room && r.bed ? `${r.room.roomNumber} / ${r.bed.bedLabel}` : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#8E8E93] text-xs">Plan</span>
                      <p className="text-[#1C1C1E] font-medium text-xs">{r.currentPlan?.name || '—'}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
