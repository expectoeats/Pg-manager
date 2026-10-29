import { z } from 'zod';

export const settingsSchema = z.object({
  pgName: z.string().min(1, 'PG name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  depositAmount: z.coerce.number().int().min(0),
  noticePeriodDays: z.coerce.number().int().min(1),
  rentDueDay: z.coerce.number().int().min(1).max(28),
  defaultRatePerUnit: z.coerce.number().min(0),
  billingMode: z.enum(['calendar', 'joining_cycle']),
  prorateFirstMonth: z.boolean(),
  receiptFooter: z.string().optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
