'use server';

import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Room from '@/models/Room';
import Bed from '@/models/Bed';
import ActivityLog from '@/models/ActivityLog';
import { roomSchema } from '@/lib/validators/room';
import { revalidatePath } from 'next/cache';

export async function getRooms() {
  await connectDB();
  const rooms = await Room.find({}).sort({ roomNumber: 1 }).lean();
  return rooms;
}

export async function getRoomsWithBeds() {
  await connectDB();
  const rooms = await Room.find({}).sort({ roomNumber: 1 }).lean();
  const beds = await Bed.find({})
    .populate('currentResident', 'name')
    .lean();

  const bedsByRoom: Record<string, typeof beds> = {};
  for (const bed of beds) {
    const roomId = bed.room.toString();
    if (!bedsByRoom[roomId]) bedsByRoom[roomId] = [];
    bedsByRoom[roomId].push(bed);
  }

  return rooms.map((room) => ({
    room,
    beds: bedsByRoom[room._id.toString()] || [],
  }));
}

export async function createRoom(data: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = roomSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  await connectDB();

  const existing = await Room.findOne({ roomNumber: parsed.data.roomNumber });
  if (existing) {
    return { success: false, error: 'Room number already exists' };
  }

  const room = await Room.create(parsed.data);

  const bedLabels = 'ABCDEFGHIJ'.split('');
  const bedDocs = Array.from({ length: parsed.data.totalBeds }, (_, i) => ({
    room: room._id,
    bedLabel: bedLabels[i],
    status: 'vacant' as const,
  }));
  await Bed.insertMany(bedDocs);

  await ActivityLog.create({
    user: session.user.id,
    action: 'CREATE',
    entityType: 'Room',
    entityId: room._id,
    summary: `Created room ${parsed.data.roomNumber} (${parsed.data.sharingType})`,
    timestamp: new Date(),
  });

  revalidatePath('/rooms');
  return { success: true };
}

export async function updateRoom(roomId: string, data: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = roomSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  await connectDB();

  const duplicate = await Room.findOne({
    roomNumber: parsed.data.roomNumber,
    _id: { $ne: roomId },
  });
  if (duplicate) {
    return { success: false, error: 'Room number already exists' };
  }

  // Strip totalBeds from the update — bed documents are structural and must
  // not diverge from Room.totalBeds. Bed count cannot be changed after creation.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { totalBeds: _ignored, ...updatePayload } = parsed.data;
  await Room.findByIdAndUpdate(roomId, { $set: updatePayload });

  await ActivityLog.create({
    user: session.user.id,
    action: 'UPDATE',
    entityType: 'Room',
    entityId: roomId,
    summary: `Updated room ${parsed.data.roomNumber}`,
    timestamp: new Date(),
  });

  revalidatePath('/rooms');
  return { success: true };
}

export async function toggleRoomActive(roomId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  await connectDB();

  const occupiedBed = await Bed.findOne({ room: roomId, status: 'occupied' });
  if (occupiedBed) {
    return { success: false, error: 'Cannot deactivate a room with occupied beds' };
  }

  const room = await Room.findById(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  room.isActive = !room.isActive;
  await room.save();

  await ActivityLog.create({
    user: session.user.id,
    action: 'UPDATE',
    entityType: 'Room',
    entityId: roomId,
    summary: `${room.isActive ? 'Activated' : 'Deactivated'} room ${room.roomNumber}`,
    timestamp: new Date(),
  });

  revalidatePath('/rooms');
  return { success: true };
}

export async function getRoomLayoutWithBills(roomId: string) {
  await connectDB();

  const [beds, room] = await Promise.all([
    Bed.find({ room: roomId })
      .populate<{ currentResident: { name: string } | null }>('currentResident', 'name')
      .lean(),
    Room.findById(roomId).lean(),
  ]);

  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  // Import ElectricityBill model inline to avoid circular deps
  const ElectricityBill = (await import('@/models/ElectricityBill')).default;
  const electricityBill = await ElectricityBill.findOne({
    room: roomId,
    month: currentMonth,
    status: 'finalized',
  }).lean();

  return {
    roomNumber: room?.roomNumber ?? '',
    sharingType: (room?.sharingType ?? 'double') as 'double' | 'triple',
    beds: beds.map((b) => ({
      _id: b._id.toString(),
      bedLabel: b.bedLabel,
      status: b.status as 'vacant' | 'occupied',
      residentName: b.currentResident?.name ?? undefined,
    })),
    currentElectricityBill: (electricityBill as { totalAmount?: number } | null)?.totalAmount,
  };
}
