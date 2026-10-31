'use server';

import connectDB from '@/lib/db';
import Resident from '@/models/Resident';
import Room from '@/models/Room';
import Bed from '@/models/Bed';
import Plan from '@/models/Plan';
import RentRecord from '@/models/RentRecord';
import Payment from '@/models/Payment';
import ElectricityBill from '@/models/ElectricityBill';
import Deposit from '@/models/Deposit';
import PlanHistory from '@/models/PlanHistory';
import Settings from '@/models/Settings';

// Ensure models are registered with Mongoose before populate() is used.
// The imports are referenced here to prevent tree-shaking by Turbopack.
void Room;
void Bed;
void Plan;
void RentRecord;
void Payment;
void ElectricityBill;
void Deposit;
void PlanHistory;
void Settings;

// TypeScript interfaces for dashboard calendar data
export interface PaymentDayData {
  date: string;
  count: number;
  totalAmount: number;
  payments: Array<{
    residentId: string;
    residentName: string;
    amount: number;
    method: string;
    type: string;
  }>;
}

export interface RentDueDayData {
  date: string;
  count: number;
  totalAmount: number;
  records: Array<{
    residentId: string;
    residentName: string;
    amount: number;
    status: 'pending' | 'partial' | 'paid';
    month: string;
  }>;
}

export interface CheckoutDayData {
  date: string;
  count: number;
  residents: Array<{
    residentId: string;
    residentName: string;
    roomNumber: string;
    status: 'notice' | 'left';
  }>;
}

export interface CheckinDayData {
  date: string;
  count: number;
  residents: Array<{
    residentId: string;
    residentName: string;
    roomNumber: string;
  }>;
}

export interface NoticeDayData {
  date: string;
  count: number;
  residents: Array<{
    residentId: string;
    residentName: string;
    expectedLeavingDate: string;
  }>;
}

export interface DepositRefundDayData {
  date: string;
  count: number;
  deposits: Array<{
    residentId: string;
    residentName: string;
    amount: number;
  }>;
}

export interface HeatmapDayData {
  date: string;
  score: number;
}

export interface TodaySummary {
  paymentsExpected: number;
  paymentsAmount: number;
  checkIns: number;
  checkOuts: number;
  rentDues: number;
  rentDuesAmount: number;
}

export interface DashboardCalendarData {
  paymentsData: PaymentDayData[];
  rentDueData: RentDueDayData[];
  checkoutsData: CheckoutDayData[];
  checkinsData: CheckinDayData[];
  noticesData: NoticeDayData[];
  depositRefundsData: DepositRefundDayData[];
  todaySummary: TodaySummary;
  heatmapData: HeatmapDayData[];
}

export async function getDashboardCalendarData(month: string): Promise<DashboardCalendarData> {
  await connectDB();

  // Parse month (format YYYY-MM)
  const [year, monthNum] = month.split('-').map(Number);
  const startOfMonth = new Date(year, monthNum - 1, 1);
  const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Payments Data - grouped by date
  const paymentsRaw = await Payment.find({
    paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    isReversal: { $ne: true }
  })
    .populate('resident', 'name')
    .sort({ paymentDate: 1 })
    .lean();

  const paymentsByDate = new Map<string, PaymentDayData>();
  paymentsRaw.forEach((p: any) => {
    const date = new Date(p.paymentDate);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    if (!paymentsByDate.has(dateKey)) {
      paymentsByDate.set(dateKey, {
        date: dateKey,
        count: 0,
        totalAmount: 0,
        payments: []
      });
    }

    const dayData = paymentsByDate.get(dateKey)!;
    dayData.count++;
    dayData.totalAmount += p.amount;
    dayData.payments.push({
      residentId: p.resident._id.toString(),
      residentName: p.resident.name || 'Unknown',
      amount: p.amount,
      method: p.method,
      type: p.type
    });
  });

  // 2. Rent Due Data - grouped by due date
  const rentRecordsRaw = await RentRecord.find({
    dueDate: { $gte: startOfMonth, $lte: endOfMonth }
  })
    .populate('resident', 'name')
    .sort({ dueDate: 1 })
    .lean();

  const rentDueByDate = new Map<string, RentDueDayData>();
  rentRecordsRaw.forEach((r: any) => {
    const date = new Date(r.dueDate);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    if (!rentDueByDate.has(dateKey)) {
      rentDueByDate.set(dateKey, {
        date: dateKey,
        count: 0,
        totalAmount: 0,
        records: []
      });
    }

    const dayData = rentDueByDate.get(dateKey)!;
    dayData.count++;
    dayData.totalAmount += r.amountDue;
    dayData.records.push({
      residentId: r.resident._id.toString(),
      residentName: r.resident.name || 'Unknown',
      amount: r.amountDue,
      status: r.status,
      month: r.month
    });
  });

  // 3. Checkouts Data - residents with expectedLeavingDate or leavingDate in month
  const checkoutsRaw = await Resident.find({
    $or: [
      { expectedLeavingDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { leavingDate: { $gte: startOfMonth, $lte: endOfMonth } }
    ]
  })
    .populate('room', 'roomNumber')
    .sort({ expectedLeavingDate: 1 })
    .lean();

  const checkoutsByDate = new Map<string, CheckoutDayData>();
  checkoutsRaw.forEach((r: any) => {
    const checkoutDate = r.leavingDate || r.expectedLeavingDate;
    if (!checkoutDate) return;

    const date = new Date(checkoutDate);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    if (!checkoutsByDate.has(dateKey)) {
      checkoutsByDate.set(dateKey, {
        date: dateKey,
        count: 0,
        residents: []
      });
    }

    const dayData = checkoutsByDate.get(dateKey)!;
    dayData.count++;
    dayData.residents.push({
      residentId: r._id.toString(),
      residentName: r.name,
      roomNumber: r.room?.roomNumber || 'N/A',
      status: r.status
    });
  });

  // 4. Check-ins Data - residents with joiningDate in month
  const checkinsRaw = await Resident.find({
    joiningDate: { $gte: startOfMonth, $lte: endOfMonth }
  })
    .populate('room', 'roomNumber')
    .sort({ joiningDate: 1 })
    .lean();

  const checkinsByDate = new Map<string, CheckinDayData>();
  checkinsRaw.forEach((r: any) => {
    const date = new Date(r.joiningDate);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    if (!checkinsByDate.has(dateKey)) {
      checkinsByDate.set(dateKey, {
        date: dateKey,
        count: 0,
        residents: []
      });
    }

    const dayData = checkinsByDate.get(dateKey)!;
    dayData.count++;
    dayData.residents.push({
      residentId: r._id.toString(),
      residentName: r.name,
      roomNumber: r.room?.roomNumber || 'N/A'
    });
  });

  // 5. Notices Data - residents with noticeDate in month
  const noticesRaw = await Resident.find({
    noticeDate: { $gte: startOfMonth, $lte: endOfMonth }
  })
    .sort({ noticeDate: 1 })
    .lean();

  const noticesByDate = new Map<string, NoticeDayData>();
  noticesRaw.forEach((r: any) => {
    if (!r.noticeDate) return;

    const date = new Date(r.noticeDate);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    if (!noticesByDate.has(dateKey)) {
      noticesByDate.set(dateKey, {
        date: dateKey,
        count: 0,
        residents: []
      });
    }

    const dayData = noticesByDate.get(dateKey)!;
    dayData.count++;
    dayData.residents.push({
      residentId: r._id.toString(),
      residentName: r.name,
      expectedLeavingDate: r.expectedLeavingDate ? new Date(r.expectedLeavingDate).toISOString() : 'N/A'
    });
  });

  // 6. Deposit Refunds Data - deposits with refundDate in month OR residents left with deposit held
  const depositRefundsRaw = await Deposit.find({
    $or: [
      { refundDate: { $gte: startOfMonth, $lte: endOfMonth } },
      {
        status: 'held',
        resident: {
          $in: await Resident.find({ status: 'left', leavingDate: { $gte: startOfMonth, $lte: endOfMonth } })
            .distinct('_id')
        }
      }
    ]
  })
    .populate('resident', 'name')
    .sort({ refundDate: 1 })
    .lean();

  const depositRefundsByDate = new Map<string, DepositRefundDayData>();
  depositRefundsRaw.forEach((d: any) => {
    const refundDate = d.refundDate || d.receivedDate;
    if (!refundDate) return;

    const date = new Date(refundDate);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    if (!depositRefundsByDate.has(dateKey)) {
      depositRefundsByDate.set(dateKey, {
        date: dateKey,
        count: 0,
        deposits: []
      });
    }

    const dayData = depositRefundsByDate.get(dateKey)!;
    dayData.count++;
    dayData.deposits.push({
      residentId: d.resident._id.toString(),
      residentName: d.resident.name || 'Unknown',
      amount: d.amount
    });
  });

  // 7. Today's Summary - aggregate counts and amounts for today
  const todayPayments = Array.from(paymentsByDate.values()).find(p => {
    const pDate = new Date(p.date);
    return pDate.getTime() === today.getTime();
  });

  const todayRentDues = Array.from(rentDueByDate.values()).find(r => {
    const rDate = new Date(r.date);
    return rDate.getTime() === today.getTime();
  });

  const todayCheckIns = Array.from(checkinsByDate.values()).find(c => {
    const cDate = new Date(c.date);
    return cDate.getTime() === today.getTime();
  });

  const todayCheckOuts = Array.from(checkoutsByDate.values()).find(c => {
    const cDate = new Date(c.date);
    return cDate.getTime() === today.getTime();
  });

  const todaySummary: TodaySummary = {
    paymentsExpected: todayPayments?.count || 0,
    paymentsAmount: todayPayments?.totalAmount || 0,
    checkIns: todayCheckIns?.count || 0,
    checkOuts: todayCheckOuts?.count || 0,
    rentDues: todayRentDues?.count || 0,
    rentDuesAmount: todayRentDues?.totalAmount || 0
  };

  // 8. Heatmap Data - calculate activity score per date
  const allDates = new Set<string>();
  paymentsByDate.forEach((_, date) => allDates.add(date));
  rentDueByDate.forEach((_, date) => allDates.add(date));
  checkoutsByDate.forEach((_, date) => allDates.add(date));
  checkinsByDate.forEach((_, date) => allDates.add(date));

  const heatmapData: HeatmapDayData[] = Array.from(allDates).map(dateKey => {
    const paymentCount = paymentsByDate.get(dateKey)?.count || 0;
    const checkoutCount = checkoutsByDate.get(dateKey)?.count || 0;
    const checkinCount = checkinsByDate.get(dateKey)?.count || 0;
    const rentDueCount = rentDueByDate.get(dateKey)?.count || 0;

    // Formula: (payment_count * 10) + (checkout_count * 15) + (checkin_count * 15) + (rentdue_count * 8)
    const score = (paymentCount * 10) + (checkoutCount * 15) + (checkinCount * 15) + (rentDueCount * 8);

    return {
      date: dateKey,
      score
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  return {
    paymentsData: Array.from(paymentsByDate.values()),
    rentDueData: Array.from(rentDueByDate.values()),
    checkoutsData: Array.from(checkoutsByDate.values()),
    checkinsData: Array.from(checkinsByDate.values()),
    noticesData: Array.from(noticesByDate.values()),
    depositRefundsData: Array.from(depositRefundsByDate.values()),
    todaySummary,
    heatmapData
  };
}
