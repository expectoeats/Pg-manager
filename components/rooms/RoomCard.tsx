'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Power, BedDouble } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  const [hoveredBed, setHoveredBed] = useState<string | null>(null);

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-3 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200',
        !room.isActive && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[17px] tracking-[-0.022em] text-[#1C1C1E]">Room {room.roomNumber}</span>
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
      <div className="flex gap-3 flex-wrap">
        {beds.map((bed) => (
          <div 
            key={bed._id} 
            className="relative flex flex-col items-center gap-1"
            onMouseEnter={() => setHoveredBed(bed._id)}
            onMouseLeave={() => setHoveredBed(null)}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold cursor-default transition-all duration-200',
                bed.status === 'vacant' 
                  ? 'bg-[#34C759]/10 text-[#34C759] border-2 border-[#34C759]/20' 
                  : 'bg-[#FF3B30]/10 text-[#FF3B30] border-2 border-[#FF3B30]/20'
              )}
            >
              <BedDouble className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-medium text-[#8E8E93]">
              {bed.bedLabel}
            </span>
            {bed.status === 'occupied' && bed.currentResident && hoveredBed === bed._id && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1C1C1E] text-white text-[13px] px-2 py-1 z-10 pointer-events-none">
                {bed.currentResident.name}
              </div>
            )}
            {bed.status === 'occupied' && bed.currentResident && (
              <span className="text-xs text-[#8E8E93] max-w-[60px] truncate text-center">
                {bed.currentResident.name.split(' ')[0]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
        <span className="text-xs text-[#8E8E93]">
          {occupiedCount}/{beds.length} occupied
        </span>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs rounded-lg"
            onClick={() => onEdit(room)}
          >
            <Pencil className="w-5 h-5 mr-1" strokeWidth={2} />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs rounded-lg"
            onClick={() => onToggleActive(room._id)}
            disabled={toggling}
          >
            <Power className="w-5 h-5 mr-1" strokeWidth={2} />
            {room.isActive ? 'Off' : 'On'}
          </Button>
        </div>
      </div>
    </div>
  );
}
