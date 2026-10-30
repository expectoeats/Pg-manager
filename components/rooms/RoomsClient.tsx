'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomSchema, type RoomFormData } from '@/lib/validators/room';
import { createRoom, updateRoom, toggleRoomActive } from '@/lib/services/rooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, DoorOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import RoomCard from './RoomCard';

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

interface RoomWithBeds {
  room: RoomData;
  beds: BedData[];
}

interface RoomsClientProps {
  roomsWithBeds: RoomWithBeds[];
}

export default function RoomsClient({ roomsWithBeds }: RoomsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [filterVacant, setFilterVacant] = useState(false);
  const [filterSharing, setFilterSharing] = useState<'all' | 'double' | 'triple'>('all');
  const [error, setError] = useState('');
  const [togglingRoomId, setTogglingRoomId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      sharingType: 'double',
      totalBeds: 2,
      isActive: true,
      hasSubMeter: false,
    },
  });

  const sharingType = watch('sharingType');
  const isActive = watch('isActive');
  const hasSubMeter = watch('hasSubMeter');

  function openAddDialog() {
    setSelectedRoom(null);
    reset({
      roomNumber: '',
      sharingType: 'double',
      totalBeds: 2,
      floor: '',
      isActive: true,
      hasSubMeter: false,
    });
    setError('');
    setDialogOpen(true);
  }

  function openEditDialog(room: RoomData) {
    setSelectedRoom(room);
    reset({
      roomNumber: room.roomNumber,
      sharingType: room.sharingType,
      totalBeds: room.totalBeds,
      floor: room.floor || '',
      isActive: room.isActive,
      hasSubMeter: room.hasSubMeter,
    });
    setError('');
    setDialogOpen(true);
  }

  const onSubmit = async (data: RoomFormData) => {
    setError('');
    startTransition(async () => {
      let result;
      if (selectedRoom) {
        result = await updateRoom(selectedRoom._id, data);
      } else {
        result = await createRoom(data);
      }

      if (result.success) {
        setDialogOpen(false);
        router.refresh();
      } else {
        setError(result.error || 'Operation failed');
      }
    });
  };

  const handleToggleActive = (roomId: string) => {
    setTogglingRoomId(roomId);
    startTransition(async () => {
      const result = await toggleRoomActive(roomId);
      setTogglingRoomId(null);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to toggle room status');
      }
    });
  };

  // Filter rooms
  const filtered = roomsWithBeds.filter(({ room, beds }) => {
    if (filterSharing !== 'all' && room.sharingType !== filterSharing) return false;
    if (filterVacant) {
      const hasVacant = beds.some((b) => b.status === 'vacant');
      if (!hasVacant) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1C1C1E]">Rooms &amp; Beds</h1>
          <p className="text-[#8E8E93] mt-1">{roomsWithBeds.length} room{roomsWithBeds.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-5 h-5 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterVacant(false)}
          className={cn(
            'px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border',
            !filterVacant ? 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20' : 'bg-white text-[#8E8E93] border-[#E5E5EA]'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilterVacant(true)}
          className={cn(
            'px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border',
            filterVacant ? 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20' : 'bg-white text-[#8E8E93] border-[#E5E5EA]'
          )}
        >
          Vacant Only
        </button>
        <div className="flex gap-1 ml-2">
          {(['all', 'double', 'triple'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterSharing(type)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize border',
                filterSharing === type ? 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20' : 'bg-white text-[#8E8E93] border-[#E5E5EA]'
              )}
            >
              {type === 'all' ? 'All Types' : `${type} sharing`}
            </button>
          ))}
        </div>
      </div>

      {/* Room grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#F2F2F7] rounded-2xl flex items-center justify-center mb-4">
            <DoorOpen className="w-8 h-8 text-[#8E8E93]" />
          </div>
          <h3 className="text-lg font-medium text-[#1C1C1E] mb-2">No rooms found</h3>
          <p className="text-sm text-[#8E8E93] mb-4">
            {roomsWithBeds.length === 0
              ? 'Add your first room to get started.'
              : 'No rooms match the current filters.'}
          </p>
          {roomsWithBeds.length === 0 && (
            <Button onClick={openAddDialog}>
              <Plus className="w-5 h-5 mr-2" /> Add Room
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ room, beds }) => (
            <RoomCard
              key={room._id}
              room={room}
              beds={beds}
              onEdit={openEditDialog}
              onToggleActive={handleToggleActive}
              toggling={togglingRoomId === room._id}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {error && (
              <div className="bg-[#FF3B30]/10 text-[#FF3B30] px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input
                placeholder="e.g. 101, A1"
                {...register('roomNumber')}
              />
              {errors.roomNumber && (
                <p className="text-[#FF3B30] text-xs">{errors.roomNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Sharing Type</Label>
              <Select
                value={sharingType}
                onValueChange={(v) => {
                  setValue('sharingType', v as 'double' | 'triple');
                  setValue('totalBeds', v === 'double' ? 2 : 3);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="double">Double (2 beds)</SelectItem>
                  <SelectItem value="triple">Triple (3 beds)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRoom ? (
              <div className="p-3 bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-lg text-sm text-[#FF9500]">
                Bed count cannot be changed after creation.
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Total Beds</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  {...register('totalBeds')}
                />
                {errors.totalBeds && (
                  <p className="text-[#FF3B30] text-xs">{errors.totalBeds.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Floor (optional)</Label>
              <Input
                placeholder="e.g. Ground, 1st, 2nd"
                {...register('floor')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Has Sub-Meter</Label>
              <ToggleSwitch checked={hasSubMeter} onChange={(v) => setValue('hasSubMeter', v)} color="blue" />
            </div>

            {selectedRoom && (
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <ToggleSwitch checked={isActive} onChange={(v) => setValue('isActive', v)} color="blue" />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? 'Saving...' : selectedRoom ? 'Update Room' : 'Add Room'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
