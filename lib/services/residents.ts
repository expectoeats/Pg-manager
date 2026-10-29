'use server';

import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Resident from '@/models/Resident';
import PlanHistory from '@/models/PlanHistory';
import ActivityLog from '@/models/ActivityLog';
import Settings from '@/models/Settings';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';

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

  return residents;
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
