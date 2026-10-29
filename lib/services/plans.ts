'use server';

import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Plan from '@/models/Plan';
import ActivityLog from '@/models/ActivityLog';
import { planSchema } from '@/lib/validators/plan';
import { revalidatePath } from 'next/cache';

export async function getPlans() {
  await connectDB();
  const plans = await Plan.find({}).sort({ price: 1 }).lean();
  return plans;
}

export async function createPlan(data: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = planSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  await connectDB();
  const plan = await Plan.create(parsed.data);

  await ActivityLog.create({
    user: session.user.id,
    action: 'CREATE',
    entityType: 'Plan',
    entityId: plan._id,
    summary: `Created plan "${parsed.data.name}" at ₹${parsed.data.price}`,
    timestamp: new Date(),
  });

  revalidatePath('/plans');
  return { success: true };
}

export async function updatePlan(planId: string, data: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = planSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  await connectDB();
  await Plan.findByIdAndUpdate(planId, { $set: parsed.data });

  await ActivityLog.create({
    user: session.user.id,
    action: 'UPDATE',
    entityType: 'Plan',
    entityId: planId,
    summary: `Updated plan "${parsed.data.name}"`,
    timestamp: new Date(),
  });

  revalidatePath('/plans');
  return { success: true };
}

export async function togglePlanActive(planId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  await connectDB();
  const plan = await Plan.findById(planId);
  if (!plan) {
    return { success: false, error: 'Plan not found' };
  }

  plan.isActive = !plan.isActive;
  await plan.save();

  await ActivityLog.create({
    user: session.user.id,
    action: 'UPDATE',
    entityType: 'Plan',
    entityId: planId,
    summary: `${plan.isActive ? 'Activated' : 'Deactivated'} plan "${plan.name}"`,
    timestamp: new Date(),
  });

  revalidatePath('/plans');
  return { success: true };
}
