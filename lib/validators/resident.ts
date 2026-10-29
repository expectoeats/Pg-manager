import { z } from 'zod';

const mobileRegex = /^[6-9]\d{9}$/;

export const residentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().regex(mobileRegex, 'Enter a valid 10-digit Indian mobile number'),
  alternateMobile: z.string().regex(mobileRegex, 'Enter a valid 10-digit Indian mobile number').optional().or(z.literal('')),
  guardianName: z.string().optional(),
  guardianMobile: z.string().regex(mobileRegex, 'Enter a valid 10-digit Indian mobile number').optional().or(z.literal('')),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  room: z.string().min(1, 'Room is required'),
  bed: z.string().min(1, 'Bed is required'),
  currentPlan: z.string().min(1, 'Plan is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  notes: z.string().optional(),
  depositAmount: z.coerce.number().int().min(0),
  depositReceived: z.boolean().default(false),
  depositMethod: z.enum(['cash', 'upi', 'bank']).optional(),
  depositTransactionRef: z.string().optional(),
  recordFirstPayment: z.boolean().default(false),
  firstPaymentAmount: z.coerce.number().int().min(0).optional(),
  firstPaymentMethod: z.enum(['cash', 'upi', 'bank']).optional(),
});

export type ResidentFormData = z.infer<typeof residentSchema>;
