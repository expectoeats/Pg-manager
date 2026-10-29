import { z } from 'zod';

export const planSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  type: z.enum(['room', 'room_food', 'food_only']),
  sharingType: z.enum(['double', 'triple', 'none']).default('none'),
  includesBreakfast: z.boolean().default(false),
  includesLunch: z.boolean().default(false),
  includesDinner: z.boolean().default(false),
  price: z.coerce.number().int().min(0, 'Price must be a non-negative integer'),
  isActive: z.boolean().default(true),
});

export type PlanFormData = z.infer<typeof planSchema>;
