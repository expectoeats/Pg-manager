'use server';

import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import ActivityLog from '@/models/ActivityLog';
import { settingsSchema } from '@/lib/validators/settings';

export async function getSettings() {
  await connectDB();
  const settings = await Settings.findOne().lean();
  if (!settings) return null;
  
  // Convert MongoDB ObjectId to string for client component compatibility
  return {
    ...settings,
    _id: settings._id.toString(),
  };
}

export async function updateSettings(formData: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = settingsSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  await connectDB();
  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: parsed.data },
    { upsert: true, new: true }
  );

  await ActivityLog.create({
    user: session.user.id,
    action: 'UPDATE',
    entityType: 'Settings',
    entityId: settings._id,
    summary: 'Updated PG settings',
    timestamp: new Date(),
  });

  return { success: true };
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const bcrypt = await import('bcryptjs');
  const User = (await import('@/models/User')).default;

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return { success: false, error: 'User not found' };

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) return { success: false, error: 'Current password is incorrect' };

  user.passwordHash = await bcrypt.hash(data.newPassword, 12);
  await user.save();

  return { success: true };
}
