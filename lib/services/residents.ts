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

  const residents = await Resident.find(query)
    .populate('room', 'roomNumber')
    .populate('bed', 'bedLabel')
    .populate('currentPlan', 'name price')
    .sort({ name: 1 })
    .lean();

  // Fetch ALL pending/partial rent records across ALL months to compute accurate pending amount and overdue status
  const pendingRentRecords = await RentRecord.find({
    status: { $in: ['pending', 'partial'] },
  })
    .sort({ dueDate: 1 })
    .lean();

  const rentSummaryByResident: Record<
    string,
    {
      totalPending: number;
      oldestDueDate: string | null;
      oldestMonth: string | null;
      unpaidCount: number;
    }
  > = {};

  pendingRentRecords.forEach((r: any) => {
    const rId = r.resident.toString();
    const balance = Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0));
    if (!rentSummaryByResident[rId]) {
      rentSummaryByResident[rId] = {
        totalPending: 0,
        oldestDueDate: r.dueDate ? new Date(r.dueDate).toISOString() : null,
        oldestMonth: r.month,
        unpaidCount: 0,
      };
    }
    if (balance > 0) {
      rentSummaryByResident[rId].totalPending += balance;
      rentSummaryByResident[rId].unpaidCount += 1;
      // Keep oldestDueDate as the earliest dueDate
      if (
        r.dueDate &&
        (!rentSummaryByResident[rId].oldestDueDate ||
          new Date(r.dueDate) < new Date(rentSummaryByResident[rId].oldestDueDate!))
      ) {
        rentSummaryByResident[rId].oldestDueDate = new Date(r.dueDate).toISOString();
        rentSummaryByResident[rId].oldestMonth = r.month;
      }
    }
  });

  return residents.map((r: any) => {
    const rId = r._id.toString();
    const summary = rentSummaryByResident[rId];
    return {
      ...r,
      pendingAmount: summary?.totalPending || 0,
      oldestDueDate: summary?.oldestDueDate || null,
      oldestMonth: summary?.oldestMonth || null,
      unpaidCount: summary?.unpaidCount || 0,
    };
  });
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

  const resident = await Resident.findById(residentId);
  if (!resident) {
    return { success: false, error: 'Resident not found' };
  }

  const newPlan = await Plan.findById(newPlanId);
  if (!newPlan) {
    return { success: false, error: 'Plan not found' };
  }

  const effectiveDate = new Date(effectiveFrom);

  // Close the current plan history entry
  await PlanHistory.findOneAndUpdate(
    { resident: residentId, effectiveTo: null },
    { effectiveTo: effectiveDate }
  );

  // Create new plan history entry
  await PlanHistory.create({
    resident: residentId,
    plan: newPlanId,
    effectiveFrom: effectiveDate,
    effectiveTo: null,
  });

  // Update resident's current plan
  resident.currentPlan = newPlan._id;
  await resident.save();

  // Activity log
  await ActivityLog.create({
    user: session.user.id,
    action: 'UPDATE',
    entityType: 'Resident',
    entityId: resident._id,
    summary: `Changed plan for ${resident.name} to ${newPlan.name} effective from ${effectiveFrom}`,
    timestamp: new Date(),
  });

  revalidatePath(`/residents/${residentId}`);
  revalidatePath('/residents');

  return { success: true };
}

export async function giveNotice(
  residentId: string,
  noticeDate: string
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  await connectDB();

  const resident = await Resident.findById(residentId);
  if (!resident) {
    return { success: false, error: 'Resident not found' };
  }

  const settings = await Settings.findOne().lean();
  const noticePeriodDays = settings?.noticePeriodDays ?? 20;

  const nDate = new Date(noticeDate);
  const expectedLeaving = new Date(nDate);
  expectedLeaving.setDate(expectedLeaving.getDate() + noticePeriodDays);

  resident.status = 'notice';
  resident.noticeDate = nDate;
  resident.expectedLeavingDate = expectedLeaving;
  await resident.save();

  // Activity log
  await ActivityLog.create({
    user: session.user.id,
    action: 'UPDATE',
    entityType: 'Resident',
    entityId: resident._id,
    summary: `Recorded notice for ${resident.name} on ${noticeDate}, expected leaving: ${expectedLeaving.toISOString().split('T')[0]}`,
    timestamp: new Date(),
  });

  revalidatePath(`/residents/${residentId}`);
  revalidatePath('/residents');

  return { success: true };
}

export interface CalendarEvent {
  type: 'joining' | 'rent_due' | 'rent_pending' | 'payment' | 'plan_change' | 'electricity' | 'notice' | 'leaving';
  date: string;
  data: Record<string, any>;
}

export interface PendingRentRange {
  startDate: string;
  endDate: string;
  amount: number;
}

export interface ResidentCalendarData {
  daysStayed: number;
  totalPendingAmount: number;
  totalPendingElectricity: number;
  nextDueDate: string | null;
  events: CalendarEvent[];
  pendingRentRanges: PendingRentRange[];
}

export async function getResidentCalendarData(residentId: string): Promise<ResidentCalendarData> {
  await connectDB();

  const resident = await Resident.findById(residentId)
    .populate('currentPlan', 'name price')
    .lean();

  if (!resident) {
    return {
      daysStayed: 0,
      totalPendingAmount: 0,
      totalPendingElectricity: 0,
      nextDueDate: null,
      events: [],
      pendingRentRanges: []
    };
  }

  const now = new Date();
  const joiningDate = new Date(resident.joiningDate);
  const endDate = resident.leavingDate ? new Date(resident.leavingDate) : now;
  const daysStayed = Math.max(0, Math.floor((endDate.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24)));

  const events: CalendarEvent[] = [];

  // Joining event
  events.push({
    type: 'joining',
    date: resident.joiningDate.toISOString(),
    data: { residentName: resident.name }
  });

  // Notice event
  if (resident.noticeDate) {
    events.push({
      type: 'notice',
      date: resident.noticeDate.toISOString(),
      data: { expectedLeavingDate: resident.expectedLeavingDate?.toISOString() }
    });
  }

  // Leaving event
  if (resident.leavingDate) {
    events.push({
      type: 'leaving',
      date: resident.leavingDate.toISOString(),
      data: {}
    });
  }

  // Rent records
  const rentRecords = await RentRecord.find({ resident: residentId }).lean();
  let totalPendingAmount = 0;
  let nextDueDate: string | null = null;
  const pendingRentRanges: PendingRentRange[] = [];

  rentRecords.forEach((r: any) => {
    events.push({
      type: 'rent_due',
      date: r.dueDate.toISOString(),
      data: {
        amount: r.amountDue,
        status: r.status,
        month: r.month,
        planName: r.planSnapshot?.name
      }
    });

    if (r.status === 'pending' || r.status === 'partial') {
      const balance = r.amountDue - r.amountPaid;
      totalPendingAmount += balance;

      if (!nextDueDate || new Date(r.dueDate) < new Date(nextDueDate)) {
        nextDueDate = r.dueDate.toISOString();
      }

      events.push({
        type: 'rent_pending',
        date: r.dueDate.toISOString(),
        data: {
          amount: balance,
          month: r.month
        }
      });
    }
  });

  return {
    daysStayed,
    totalPendingAmount,
    totalPendingElectricity: 0,
    nextDueDate,
    events,
    pendingRentRanges
  };
}
