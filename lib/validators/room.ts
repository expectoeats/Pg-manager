import { z } from 'zod';

export const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  sharingType: z.enum(['double', 'triple']),
  totalBeds: z.coerce.number().int().min(1).max(10),
  floor: z.string().optional(),
  isActive: z.boolean().default(true),
  hasSubMeter: z.boolean().default(false),
});

export type RoomFormData = z.infer<typeof roomSchema>;
