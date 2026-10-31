'use server';

import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Room from '@/models/Room';
import Bed from '@/models/Bed';
import Resident from '@/models/Resident';
import Plan from '@/models/Plan';
import PlanHistory from '@/models/PlanHistory';
import Deposit from '@/models/Deposit';
import RentRecord from '@/models/RentRecord';
import ActivityLog from '@/models/ActivityLog';
import Settings from '@/models/Settings';
import { residentSchema } from '@/lib/validators/resident';
import { revalidatePath } from 'next/cache';

export async function getVacantBedsByRoom(roomId: string) {
  await connectDB();
  const beds = await Bed.find({ room: roomId, status: 'vacant' }).lean();
  // Return plain objects for client components
  return beds.map(b => ({
    _id: b._id.toString(),
    bedLabel: b.bedLabel,
    status: b.status,
  }));
}

export async function getRoomVacantBedCounts() {
  await connectDB();
  const rooms = await Room.find({ isActive: true }).lean();
  
  const roomsWithCounts = await Promise.all(
    rooms.map(async (room) => {
      const vacantCount = await Bed.countDocuments({ 
        room: room._id, 
        status: 'vacant' 
      });
      
      return {
        roomId: room._id.toString(),
        vacantBeds: vacantCount,
        totalBeds: room.totalBeds,
      };
    })
  );
  
  return roomsWithCounts;
}

export async function checkInResident(data: unknown) {
  const authSession = await auth();
  if (!authSession?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = residentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const {
    name,
    mobile,
    alternateMobile,
    guardianName,
    guardianMobile,
    idProofType,
    idProofNumber,
    room: roomId,
    bed: bedId,
    currentPlan: planId,
    joiningDate,
    notes,
    depositAmount,
    depositReceived,
    depositMethod,
    depositTransactionRef,
    recordFirstPayment,
    firstPaymentAmount,
    firstPaymentMethod,
    billingMode: selectedBillingMode,
  } = parsed.data;

  await connectDB();

  const mongoSession = await mongoose.startSession();

  try {
    let residentId: string = '';

    await mongoSession.withTransaction(async () => {
      // Verify bed is still vacant
      const bed = await Bed.findById(bedId).session(mongoSession);
      if (!bed || bed.status !== 'vacant') {
        throw new Error('Bed is already occupied');
      }

      // Verify bed belongs to the chosen room
      if (bed.room.toString() !== roomId) {
        throw new Error('Bed does not belong to the selected room');
      }

      // Fetch plan
      const plan = await Plan.findById(planId).session(mongoSession);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Fetch settings for billing mode
      const settings = await Settings.findOne().session(mongoSession).lean();
      const prorateFirstMonth = settings?.prorateFirstMonth ?? true;
      const billingMode = selectedBillingMode || settings?.billingMode || 'joining_cycle';

      // Create resident
      const [resident] = await Resident.create(
        [
          {
            name,
            mobile,
            alternateMobile: alternateMobile || undefined,
            guardianName,
            guardianMobile: guardianMobile || undefined,
            idProofType,
            idProofNumber,
            room: roomId,
            bed: bedId,
            currentPlan: planId,
            joiningDate: new Date(joiningDate),
            billingMode: billingMode,
            status: 'active',
            notes,
          },
        ],
        { session: mongoSession }
      );

      residentId = resident._id.toString();

      // Mark bed occupied
      await Bed.findByIdAndUpdate(
        bedId,
        { status: 'occupied', currentResident: resident._id },
        { session: mongoSession }
      );

      // Create PlanHistory entry
      await PlanHistory.create(
        [
          {
            resident: resident._id,
            plan: planId,
            effectiveFrom: new Date(joiningDate),
            effectiveTo: null,
          },
        ],
        { session: mongoSession }
      );

      // Create Deposit
      await Deposit.create(
        [
          {
            resident: resident._id,
            amount: depositAmount,
            status: depositReceived ? 'held' : 'pending',
            receivedDate: depositReceived ? new Date() : undefined,
          },
        ],
        { session: mongoSession }
      );

      // Calculate first month rent
      const joiningDateObj = new Date(joiningDate);
      const year = joiningDateObj.getUTCFullYear();
      const month = joiningDateObj.getUTCMonth() + 1; // 1-indexed
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;

      let amountDue = plan.price;

      if (billingMode === 'calendar' && prorateFirstMonth) {
        const joiningDay = joiningDateObj.getUTCDate();
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const daysRemaining = daysInMonth - joiningDay + 1;
        amountDue = Math.round((plan.price * daysRemaining) / daysInMonth);
      }

      // Due date calculation depends on billing mode:
      // - calendar mode: use rentDueDay of next month
      // - joining_cycle mode: use the joining day of the current (first) month
      //   (the due date repeats on the joining day each month)
      const rentDueDay = settings?.rentDueDay ?? 1;
      let dueDate: Date;
      if (billingMode === 'joining_cycle') {
        const joiningDay = joiningDateObj.getUTCDate();
        // Due on the joining day of the same month as the first rent record
        dueDate = new Date(Date.UTC(year, month - 1, joiningDay));
      } else {
        // calendar mode: 1st (or rentDueDay) of the next month
        dueDate = new Date(Date.UTC(year, month, rentDueDay));
      }

      const [rentRecord] = await RentRecord.create(
        [
          {
            resident: resident._id,
            month: monthStr,
            planSnapshot: { name: plan.name, price: plan.price },
            amountDue,
            amountPaid: 0,
            status: 'pending',
            dueDate,
          },
        ],
        { session: mongoSession }
      );

      // TODO Phase 4: create Payment for deposit if depositReceived
      // TODO Phase 4: create Payment for first rent if recordFirstPayment

      // Activity log
      await ActivityLog.create(
        [
          {
            user: authSession.user.id,
            action: 'CREATE',
            entityType: 'Resident',
            entityId: resident._id,
            summary: `Checked in ${name} to room ${roomId}, bed ${bed.bedLabel}`,
            timestamp: new Date(),
          },
        ],
        { session: mongoSession }
      );
    });

    await mongoSession.endSession();

    revalidatePath('/residents');
    revalidatePath('/rooms');

    return { success: true, residentId };
  } catch (err) {
    await mongoSession.endSession();
    const message = err instanceof Error ? err.message : 'Check-in failed';
    return { success: false, error: message };
  }
}
