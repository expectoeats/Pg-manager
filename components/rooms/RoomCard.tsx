'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BedData {
  _id: string;
  bedLabel: string;
  status: 'vacant' | 'occupied';
  currentResident?: { name: string } | null;
}

interface RoomData {
  _id: string;
  roomNumber: string;
  sharingType: 'double' | 'triple';
  totalBeds: number;
  floor?: string;
  isActive: boolean;
  hasSubMeter: boolean;
}

interface RoomCardProps {
  room: RoomData;
  beds: BedData[];
  onEdit: (room: RoomData) => void;
  onToggleActive: (roomId: string) => void;
  toggling: boolean;
}

export default function RoomCard({ room, beds, onEdit, onToggleActive, toggling }: RoomCardProps) {
  const occupiedCount = beds.filter((b) => b.status === 'occupied').length;

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col gap-3',
        !room.isActive && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold text-gray-900">Room {room.roomNumber}</span>
            {!room.isActive && (
              <Badge variant="outline" className="text-gray-400 border-gray-300 text-xs">
                Inactive
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                'text-xs capitalize',
                room.sharingType === 'double'
                  ? 'text-blue-600 border-blue-200 bg-blue-50'
                  : 'text-purple-600 border-purple-200 bg-purple-50'
              )}
            >
              {room.sharingType} sharing
            </Badge>
            {room.floor && (
              <span className="text-xs text-gray-500">Floor {room.floor}</span>
            )}
            {room.hasSubMeter && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50">
                Sub-meter
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Bed icons */}
      <div className="flex gap-2 flex-wrap">
        {beds.map((bed) => (
          <div key={bed._id} className="flex flex-col items-center gap-1">
            <div
              title={bed.status === 'occupied' ? bed.currentResident?.name || 'Occupied' : `Bed ${bed.bedLabel} - Vacant`}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-default',
                bed.status === 'vacant' ? 'bg-green-500' : 'bg-red-500'
              )}
            >
              {bed.bedLabel}
            </div>
            {bed.status === 'occupied' && bed.currentResident && (
              <span className="text-xs text-gray-500 max-w-[48px] truncate text-center">
                {bed.currentResident.name.split(' ')[0]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-500">
          {occupiedCount}/{beds.length} occupied
        </span>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs rounded-lg"
            onClick={() => onEdit(room)}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 px-2 text-xs rounded-lg',
              room.isActive
                ? 'text-red-600 border-red-200 hover:bg-red-50'
                : 'text-green-600 border-green-200 hover:bg-green-50'
            )}
            onClick={() => onToggleActive(room._id)}
            disabled={toggling}
          >
            <Power className="w-3 h-3 mr-1" />
            {room.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
