'use server';

import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Resident from '@/models/Resident';
import Room from '@/models/Room';
import Bed from '@/models/Bed';
import Plan from '@/models/Plan';
import RentRecord from '@/models/RentRecord';
import PlanHistory from '@/models/PlanHistory';
import ActivityLog from '@/models/ActivityLog';
import Settings from '@/models/Settings';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';

// Ensure models are registered with Mongoose before populate() is used.
// The imports are referenced here to prevent tree-shaking by Turbopack, since
// these models are only needed indirectly via .populate() and never used
// as direct variables in this file.
void Room;
void Bed;
void Plan;

export async function getResidents(filters?: {
  status?: string;
  planId?: string;
  roomId?: string;
}) {
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};
  if (filters?.status && filters.status !== 'all') {
    query.status = filters.status;
  }
  if (filters?.planId) {
    query.currentPlan = filters.planId;
  }
  if (filters?.roomId) {
    query.room = filters.roomId;
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const residents = await Resident.find(query)
    .populate('room', 'roomNumber')
    .populate('bed', 'bedLabel')
    .populate('currentPlan', 'name price')
    .sort({ name: 1 })
    .lean();

  // Fetch pending/partial rent records for current month to compute pending amount per resident
  const pendingRentRecords = await RentRecord.find({
    month: currentMonth,
    status: { $in: ['pending', 'partial'] },
  }).lean();

  const pendingByResident: Record<string, number> = {};
  pendingRentRecords.forEach((r: any) => {
    const pending = (r.amountDue || 0) - (r.amountPaid || 0);
    if (pending > 0) {
      pendingByResident[r.resident.toString()] =
        (pendingByResident[r.resident.toString()] || 0) + pending;
    }
  });

  return residents.map((r: any) => ({
    ...r,
    pendingAmount: pendingByResident[r._id.toString()] || 0,
  }));
}

export async function getResident(id: string) {
  await connectDB();
  const resident = await Resident.findById(id)
    .populate('room', 'roomNumber sharingType')
    .populate('bed', 'bedLabel')
    .populate('currentPlan', 'name price type')
    .lean();

  if (!resident) notFound();
  return resident;
}

export async function getPlanHistory(residentId: string) {
  await connectDB();
  const history = await PlanHistory.find({ resident: residentId })
    .populate('plan', 'name price')
    .sort({ effectiveFrom: -1 })
    .lean();
  return history;
}

export async function givePlanChange(
  residentId: string,
  newPlanId: string,
  effectiveFrom: string
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  await connectDB();

  // Close existing open PlanHistory entry
  await PlanHistory.findOneAndUpdate(
    { resident: residentId, effectiveTo: null },
    { effectiveTo: new Date(effectiveFrom) }
  );

  // Create new PlanHistory entry
  await PlanHistory.create({
    resident: residentId,
    plan: newPlanId,
    effectiveFrom: new Date(effectiveFrom),
    effectiveTo: null,
  });

  // Update resident's currentPlan
  await Resident.findByIdAndUpdate(residentId, { currentPlan: newPlanId });

  await ActivityLog.create({
    user: session.user.id,
    action: 'UPDATE',
    entityType: 'Resident',
    entityId: residentId,
    summary: `Changed plan for resident`,
    timestamp: new Date(),
  });

  revalidatePath('/residents');
  revalidatePath(`/residents/${residentId}`);
  return { success: true };
}

export async function giveNotice(residentId: string, noticeDate: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  await connectDB();

  const settings = await Settings.findOne().lean();
  const noticePeriodDays = settings?.noticePeriodDays ?? 20;

  const noticeDateObj = new Date(noticeDate);
  const expectedLeavingDate = new Date(noticeDateObj);
  expectedLeavingDate.setDate(expectedLeavingDate.getDate() + noticePeriodDays);

  await Resident.findByIdAndUpdate(residentId, {
    status: 'notice',
    noticeDate: noticeDateObj,
    expectedLeavingDate,
  });

  await ActivityLog.create({
    user: session.user.id,
    action: 'UPDATE',
    entityType: 'Resident',
    entityId: residentId,
    summary: `Resident gave notice. Expected leaving: ${expectedLeavingDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    timestamp: new Date(),
  });

  revalidatePath('/residents');
  revalidatePath(`/residents/${residentId}`);
  return { success: true };
}

// Calendar event discriminated union types
export type CalendarEvent = 
  | { type: 'joining'; date: string; data: { label: string } }
  | { type: 'rent_due'; date: string; data: { amount: number; status: string; month: string; planName: string } }
  | { type: 'rent_pending'; date: string; data: { amount: number; month: string } }
  | { type: 'payment'; date: string; data: { amount: number; method: string; type: string; receiptNumber: string } }
  | { type: 'electricity'; date: string; data: { amount: number; status: string; month: string } }
  | { type: 'notice'; date: string; data: { label: string } }
  | { type: 'leaving'; date: string; data: { label: string } }
  | { type: 'plan_change'; date: string; data: { planName: string; price: number; isInitial: boolean } };

export interface PendingRentRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  month: string; // YYYY-MM
  amount: number;
}

export interface ResidentCalendarData {
  events: CalendarEvent[];
  pendingRentRanges: PendingRentRange[];
  totalPendingAmount: number;
  totalPendingElectricity: number;
  nextDueDate: string | null;
  daysStayed: number;
  rentDueDay: number;
}

// Mongoose lean document types
interface RentRecordLean {
  _id: { toString(): string };
  resident: { toString(): string };
  month: string;
  amountDue: number;
  amountPaid: number;
  status: 'pending' | 'partial' | 'paid';
  dueDate: Date;
  planSnapshot: { name: string; price: number };
}

interface PaymentLean {
  _id: { toString(): string };
  resident: { toString(): string };
  paymentDate: Date;
  amount: number;
  type: string;
  method: string;
  receiptNumber: string;
  isReversal?: boolean;
}

interface ElectricityBillLean {
  _id: { toString(): string };
  month: string;
  status: string;
  createdAt?: Date;
  shares: Array<{
    resident: { toString(): string };
    amount: number;
    amountPaid: number;
    status: 'pending' | 'paid';
  }>;
}

export async function getResidentCalendarData(residentId: string): Promise<ResidentCalendarData> {
  await connectDB();

  // Import the models to ensure they're registered
  const Payment = (await import('@/models/Payment')).default;
  const ElectricityBill = (await import('@/models/ElectricityBill')).default;

  // Fetch resident details
  const residentDoc = await Resident.findById(residentId).lean();
  if (!residentDoc) {
    throw new Error('Resident not found');
  }

  // Fetch all rent records for the resident
  const rentRecordsRaw = await RentRecord.find({ resident: residentId })
    .sort({ month: 1 })
    .lean() as unknown as RentRecordLean[];

  // Fetch all non-reversal payments
  const paymentsRaw = await Payment.find({
    resident: residentId,
    $or: [{ isReversal: false }, { isReversal: { $exists: false } }]
  })
    .sort({ paymentDate: 1 })
    .lean() as unknown as PaymentLean[];

  // Fetch finalized electricity bills with shares for this resident
  const electricityBillsRaw = await ElectricityBill.find({
    status: 'finalized',
    'shares.resident': residentId
  })
    .sort({ month: 1 })
    .lean() as unknown as ElectricityBillLean[];

  // Fetch plan history for plan_change events
  const planHistoryRaw = await PlanHistory.find({ resident: residentId })
    .populate('plan', 'name price')
    .sort({ effectiveFrom: 1 })
    .lean();

  // Get settings for rent due day
  const settings = await Settings.findOne().lean();
  const rentDueDay = settings?.rentDueDay ?? 1;

  // Build events array
  const events: CalendarEvent[] = [];

  // 1. Joining event
  const resident = residentDoc as {
    joiningDate: Date;
    noticeDate?: Date;
    expectedLeavingDate?: Date;
    leavingDate?: Date;
  };
  
  if (resident.joiningDate) {
    events.push({
      type: 'joining',
      date: new Date(resident.joiningDate).toISOString(),
      data: { label: 'Joined' }
    });
  }

  // 2. Rent records → rent_due and rent_pending events
  rentRecordsRaw.forEach((r) => {
    events.push({
      type: 'rent_due',
      date: r.dueDate.toISOString(),
      data: {
        amount: r.amountDue,
        status: r.status,
        month: r.month,
        planName: r.planSnapshot.name
      }
    });

    // Add rent_pending event for pending/partial records
    if (r.status === 'pending' || r.status === 'partial') {
      const pendingAmount = r.amountDue - r.amountPaid;
      events.push({
        type: 'rent_pending',
        date: r.dueDate.toISOString(),
        data: {
          amount: pendingAmount,
          month: r.month
        }
      });
    }
  });

  // 3. Payments
  paymentsRaw.forEach((p) => {
    events.push({
      type: 'payment',
      date: p.paymentDate.toISOString(),
      data: {
        amount: p.amount,
        method: p.method,
        type: p.type,
        receiptNumber: p.receiptNumber
      }
    });
  });

  // 4. Electricity shares - use createdAt (finalizedAt), not first of month
  electricityBillsRaw.forEach((bill) => {
    const share = bill.shares.find((s) => s.resident.toString() === residentId);
    if (share) {
      // Use createdAt timestamp as per the plan
      const billDate = bill.createdAt ? bill.createdAt.toISOString() : new Date().toISOString();
      
      events.push({
        type: 'electricity',
        date: billDate,
        data: {
          amount: share.amount,
          status: share.status,
          month: bill.month
        }
      });
    }
  });

  // 5. Notice events
  if (resident.noticeDate) {
    events.push({
      type: 'notice',
      date: new Date(resident.noticeDate).toISOString(),
      data: { label: 'Notice given' }
    });
  }

  if (resident.expectedLeavingDate) {
    events.push({
      type: 'leaving',
      date: new Date(resident.expectedLeavingDate).toISOString(),
      data: { label: 'Expected leaving' }
    });
  }

  // 6. Plan changes with isInitial flag
  const joiningDateKey = resident.joiningDate 
    ? new Date(resident.joiningDate).toISOString().split('T')[0] 
    : null;

  planHistoryRaw.forEach((ph: any) => {
    const effectiveDate = new Date(ph.effectiveFrom);
    const effectiveDateKey = effectiveDate.toISOString().split('T')[0];
    
    // Mark as initial if it matches the joining date (calendar day)
    const isInitial = effectiveDateKey === joiningDateKey;
    
    events.push({
      type: 'plan_change',
      date: effectiveDate.toISOString(),
      data: {
        planName: ph.plan?.name || 'Unknown',
        price: ph.plan?.price || 0,
        isInitial
      }
    });
  });

  // Calculate pending rent ranges
  const pendingRentRanges: PendingRentRange[] = [];
  const now = new Date();

  rentRecordsRaw.forEach((r) => {
    if (r.status === 'pending' || r.status === 'partial') {
      const dueDate = new Date(r.dueDate);
      const pendingAmount = r.amountDue - r.amountPaid;
      
      // Range: from due date to today (or end of month if earlier)
      const [year, month] = r.month.split('-');
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0); // Last day of month
      const endDate = now < endOfMonth ? now : endOfMonth;
      
      pendingRentRanges.push({
        startDate: dueDate.toISOString(),
        endDate: endDate.toISOString(),
        month: r.month,
        amount: pendingAmount
      });
    }
  });

  // Calculate summary stats
  const totalPendingAmount = rentRecordsRaw
    .filter(r => r.status === 'pending' || r.status === 'partial')
    .reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);

  const totalPendingElectricity = electricityBillsRaw.reduce((sum, bill) => {
    const share = bill.shares.find((s) => s.resident.toString() === residentId);
    if (share && share.status === 'pending') {
      return sum + (share.amount - share.amountPaid);
    }
    return sum;
  }, 0);

  const pendingRents = rentRecordsRaw.filter(r => r.status === 'pending' || r.status === 'partial');
  const nextDueDate = pendingRents.length > 0
    ? pendingRents.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0].dueDate.toISOString()
    : null;

  const joiningDate = new Date(resident.joiningDate);
  const endDate = resident.leavingDate ? new Date(resident.leavingDate) : now;
  const daysStayed = Math.floor((endDate.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    events,
    pendingRentRanges,
    totalPendingAmount,
    totalPendingElectricity,
    nextDueDate,
    daysStayed,
    rentDueDay,
  };
}
