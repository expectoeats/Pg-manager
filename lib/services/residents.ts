'use server';

import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Resident from '@/models/Resident';
import Plan from '@/models/Plan';
import RentRecord from '@/models/RentRecord';
import PlanHistory from '@/models/PlanHistory';
import ActivityLog from '@/models/ActivityLog';
import Settings from '@/models/Settings';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';

// Ensure the Plan model is registered with Mongoose before populate() is used.
// The import is referenced here to prevent tree-shaking by Turbopack, since
// Plan is only needed indirectly via .populate('currentPlan') and never used
// as a direct variable in this file.
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

export interface ResidentCalendarData {
  rentRecords: Array<{
    _id: string;
    month: string;
    amountDue: number;
    amountPaid: number;
    status: 'pending' | 'partial' | 'paid';
    dueDate: string;
    planSnapshot: { name: string; price: number };
  }>;
  payments: Array<{
    _id: string;
    paymentDate: string;
    amount: number;
    type: string;
    method: string;
    receiptNumber: string;
  }>;
  electricityShares: Array<{
    billId: string;
    month: string;
    amount: number;
    amountPaid: number;
    status: 'pending' | 'paid';
    finalizedAt: string;
  }>;
  rentDueDay: number;
}

export async function getResidentCalendarData(residentId: string): Promise<ResidentCalendarData> {
  await connectDB();

  // Import the models to ensure they're registered
  const Payment = (await import('@/models/Payment')).default;
  const ElectricityBill = (await import('@/models/ElectricityBill')).default;

  // Fetch all rent records for the resident
  const rentRecordsRaw = await RentRecord.find({ resident: residentId })
    .sort({ month: 1 })
    .lean();

  // Fetch all non-reversal payments
  const paymentsRaw = await Payment.find({
    resident: residentId,
    $or: [{ isReversal: false }, { isReversal: { $exists: false } }]
  })
    .sort({ paymentDate: 1 })
    .lean();

  // Fetch finalized electricity bills with shares for this resident
  const electricityBillsRaw = await ElectricityBill.find({
    status: 'finalized',
    'shares.resident': residentId
  })
    .sort({ month: 1 })
    .lean();

  // Get settings for rent due day
  const settings = await Settings.findOne().lean();
  const rentDueDay = settings?.rentDueDay ?? 1;

  // Transform rent records
  const rentRecords = rentRecordsRaw.map((r: any) => ({
    _id: r._id.toString(),
    month: r.month,
    amountDue: r.amountDue,
    amountPaid: r.amountPaid,
    status: r.status,
    dueDate: r.dueDate.toISOString(),
    planSnapshot: r.planSnapshot,
  }));

  // Transform payments
  const payments = paymentsRaw.map((p: any) => ({
    _id: p._id.toString(),
    paymentDate: p.paymentDate.toISOString(),
    amount: p.amount,
    type: p.type,
    method: p.method,
    receiptNumber: p.receiptNumber,
  }));

  // Transform electricity shares
  const electricityShares: Array<{
    billId: string;
    month: string;
    amount: number;
    amountPaid: number;
    status: 'pending' | 'paid';
    finalizedAt: string;
  }> = [];

  electricityBillsRaw.forEach((bill: any) => {
    const share = bill.shares.find((s: any) => s.resident.toString() === residentId);
    if (share) {
      electricityShares.push({
        billId: bill._id.toString(),
        month: bill.month,
        amount: share.amount,
        amountPaid: share.amountPaid,
        status: share.status,
        finalizedAt: bill.createdAt ? bill.createdAt.toISOString() : new Date().toISOString(),
      });
    }
  });

  return {
    rentRecords,
    payments,
    electricityShares,
    rentDueDay,
  };
}
