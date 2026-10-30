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
        'bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] p-4 border border-[#E5E5EA] flex flex-col gap-3',
        !room.isActive && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold text-[#1C1C1E]">Room {room.roomNumber}</span>
            {!room.isActive && (
              <Badge variant="outline" className="bg-[#8E8E93]/10 text-[#8E8E93] border-transparent text-xs">
                Inactive
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                'text-xs capitalize border-transparent',
                room.sharingType === 'double'
                  ? 'bg-[#007AFF]/10 text-[#007AFF]'
                  : 'bg-[#5856D6]/10 text-[#5856D6]'
              )}
            >
              {room.sharingType} sharing
            </Badge>
            {room.floor && (
              <span className="text-xs text-[#8E8E93]">Floor {room.floor}</span>
            )}
            {room.hasSubMeter && (
              <Badge variant="outline" className="text-xs bg-[#FF9500]/10 text-[#FF9500] border-transparent">
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
                bed.status === 'vacant' ? 'bg-[#34C759]' : 'bg-[#FF3B30]'
              )}
            >
              {bed.bedLabel}
            </div>
            {bed.status === 'occupied' && bed.currentResident && (
              <span className="text-xs text-[#8E8E93] max-w-[48px] truncate text-center">
                {bed.currentResident.name.split(' ')[0]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#E5E5EA]">
        <span className="text-xs text-[#8E8E93]">
          {occupiedCount}/{beds.length} occupied
        </span>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onEdit(room)}
          >
            <Pencil className="w-5 h-5 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onToggleActive(room._id)}
            disabled={toggling}
          >
            <Power className="w-5 h-5 mr-1" />
            {room.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
