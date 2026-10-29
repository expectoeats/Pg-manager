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
  active: 'text-green-600 border-green-200 bg-green-50',
  notice: 'text-yellow-600 border-yellow-200 bg-yellow-50',
  left: 'text-gray-500 border-gray-200 bg-gray-50',
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
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
            {residents.length}
          </Badge>
        </div>
        <Button
          onClick={() => router.push('/residents/new')}
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Resident
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Select
          value={initialFilters.status || 'all'}
          onValueChange={(v) => updateFilter('status', v)}
        >
          <SelectTrigger className="w-36 rounded-lg bg-white">
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
          <SelectTrigger className="w-44 rounded-lg bg-white">
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
          <SelectTrigger className="w-36 rounded-lg bg-white">
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
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No residents found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {Object.values(initialFilters).some(Boolean)
              ? 'No residents match the current filters.'
              : 'Add your first resident to get started.'}
          </p>
          {!Object.values(initialFilters).some(Boolean) && (
            <Button
              onClick={() => router.push('/residents/new')}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Resident
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Mobile</TableHead>
                  <TableHead className="font-semibold text-gray-700">Room / Bed</TableHead>
                  <TableHead className="font-semibold text-gray-700">Plan</TableHead>
                  <TableHead className="font-semibold text-gray-700">Joining</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((r) => (
                  <TableRow key={r._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">{r.mobile}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {r.room && r.bed ? (
                        <span>{r.room.roomNumber} / {r.bed.bedLabel}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {r.currentPlan?.name || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(r.joiningDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs capitalize', STATUS_BADGE[r.status])}>
                        {r.status === 'notice' ? 'On Notice' : r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/residents/${r._id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs rounded-lg">
                          <Eye className="w-3 h-3 mr-1" /> View
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.mobile}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-xs capitalize', STATUS_BADGE[r.status])}>
                      {r.status === 'notice' ? 'On Notice' : r.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Room/Bed</span>
                      <p className="text-gray-800 font-medium">
                        {r.room && r.bed ? `${r.room.roomNumber} / ${r.bed.bedLabel}` : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Plan</span>
                      <p className="text-gray-800 font-medium text-xs">{r.currentPlan?.name || '—'}</p>
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
