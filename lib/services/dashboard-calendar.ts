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

// Ensure models are registered with Mongoose before populate() is used
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
export interface PaymentItemInfo {
  paymentId: string;
  residentId: string;
  residentName: string;
  roomNumber?: string;
  bedLabel?: string;
  amount: number;
  method: string;
  type: string;
  receiptNumber?: string;
}

export interface PaymentDayData {
  date: string;
  count: number;
  totalAmount: number;
  payments: PaymentItemInfo[];
}

export interface RentDueRecordInfo {
  recordId: string;
  residentId: string;
  residentName: string;
  mobile?: string;
  roomNumber: string;
  bedLabel: string;
  amountDue: number;
  amountPaid: number;
  balanceDue: number;
  status: 'pending' | 'partial' | 'paid';
  month: string;
  planName?: string;
}

export interface RentDueDayData {
  date: string;
  count: number;
  totalAmount: number;
  records: RentDueRecordInfo[];
}

export interface CheckoutResidentInfo {
  residentId: string;
  residentName: string;
  mobile?: string;
  roomNumber: string;
  bedLabel: string;
  status: 'notice' | 'left';
  leavingDate?: string;
  expectedLeavingDate?: string;
}

export interface CheckoutDayData {
  date: string;
  count: number;
  residents: CheckoutResidentInfo[];
}

export interface CheckinResidentInfo {
  residentId: string;
  residentName: string;
  mobile?: string;
  roomNumber: string;
  bedLabel: string;
  planName?: string;
  planPrice?: number;
  depositAmount?: number;
  depositStatus?: 'pending' | 'held' | 'refunded' | 'forfeited' | 'adjusted';
  rentDueAmount?: number;
  rentStatus?: 'pending' | 'partial' | 'paid';
}

export interface CheckinDayData {
  date: string;
  count: number;
  residents: CheckinResidentInfo[];
}

export interface NoticeResidentInfo {
  residentId: string;
  residentName: string;
  mobile?: string;
  roomNumber: string;
  bedLabel: string;
  noticeDate: string;
  expectedLeavingDate: string;
}

export interface NoticeDayData {
  date: string;
  count: number;
  residents: NoticeResidentInfo[];
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
  const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Payments Data - grouped by date
  const paymentsRaw = await Payment.find({
    paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    isReversal: { $ne: true }
  })
    .populate({
      path: 'resident',
      select: 'name room bed',
      populate: [
        { path: 'room', select: 'roomNumber' },
        { path: 'bed', select: 'bedLabel' }
      ]
    })
    .sort({ paymentDate: 1 })
    .lean();

  const paymentsByDate = new Map<string, PaymentDayData>();
  paymentsRaw.forEach((p: any) => {
    if (!p.paymentDate) return;
    const date = new Date(p.paymentDate);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
      paymentId: p._id.toString(),
      residentId: p.resident?._id ? p.resident._id.toString() : '',
      residentName: p.resident?.name || 'Resident',
      roomNumber: p.resident?.room?.roomNumber || '—',
      bedLabel: p.resident?.bed?.bedLabel || '',
      amount: p.amount,
      method: p.method,
      type: p.type,
      receiptNumber: p.receiptNumber
    });
  });

  // 2. Rent Due Data - grouped by due date with populated room, bed, mobile
  const rentRecordsRaw = await RentRecord.find({
    dueDate: { $gte: startOfMonth, $lte: endOfMonth }
  })
    .populate({
      path: 'resident',
      select: 'name mobile room bed',
      populate: [
        { path: 'room', select: 'roomNumber' },
        { path: 'bed', select: 'bedLabel' }
      ]
    })
    .sort({ dueDate: 1 })
    .lean();

  const rentDueByDate = new Map<string, RentDueDayData>();
  rentRecordsRaw.forEach((r: any) => {
    if (!r.dueDate) return;
    const date = new Date(r.dueDate);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!rentDueByDate.has(dateKey)) {
      rentDueByDate.set(dateKey, {
        date: dateKey,
        count: 0,
        totalAmount: 0,
        records: []
      });
    }

    const balanceDue = Math.max(0, (r.amountDue || 0) - (r.amountPaid || 0));
    const dayData = rentDueByDate.get(dateKey)!;
    dayData.count++;
    dayData.totalAmount += balanceDue;
    dayData.records.push({
      recordId: r._id.toString(),
      residentId: r.resident?._id ? r.resident._id.toString() : '',
      residentName: r.resident?.name || 'Resident',
      mobile: r.resident?.mobile || '',
      roomNumber: r.resident?.room?.roomNumber || '—',
      bedLabel: r.resident?.bed?.bedLabel || '',
      amountDue: r.amountDue,
      amountPaid: r.amountPaid || 0,
      balanceDue,
      status: r.status,
      month: r.month,
      planName: r.planSnapshot?.name
    });
  });

  // 3. Check-ins Data - residents with joiningDate in month
  const checkinsRaw = await Resident.find({
    joiningDate: { $gte: startOfMonth, $lte: endOfMonth }
  })
    .populate('room', 'roomNumber')
    .populate('bed', 'bedLabel')
    .populate('currentPlan', 'name price')
    .sort({ joiningDate: 1 })
    .lean();

  const residentIds = checkinsRaw.map((r: any) => r._id);

  // Fetch deposits for these residents
  const depositsRaw = await Deposit.find({ resident: { $in: residentIds } }).lean();
  const depositsByResident = new Map<string, any>();
  depositsRaw.forEach((d: any) => {
    depositsByResident.set(d.resident.toString(), d);
  });

  // Fetch first rent records for these residents
  const firstRentRecordsRaw = await RentRecord.find({ resident: { $in: residentIds } }).lean();
  const rentByResident = new Map<string, any>();
  firstRentRecordsRaw.forEach((rec: any) => {
    rentByResident.set(rec.resident.toString(), rec);
  });

  const checkinsByDate = new Map<string, CheckinDayData>();
  checkinsRaw.forEach((r: any) => {
    if (!r.joiningDate) return;
    const date = new Date(r.joiningDate);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!checkinsByDate.has(dateKey)) {
      checkinsByDate.set(dateKey, {
        date: dateKey,
        count: 0,
        residents: []
      });
    }

    const rId = r._id.toString();
    const deposit = depositsByResident.get(rId);
    const rentRec = rentByResident.get(rId);

    const dayData = checkinsByDate.get(dateKey)!;
    dayData.count++;
    dayData.residents.push({
      residentId: rId,
      residentName: r.name,
      mobile: r.mobile,
      roomNumber: r.room?.roomNumber || '—',
      bedLabel: r.bed?.bedLabel || '',
      planName: r.currentPlan?.name,
      planPrice: r.currentPlan?.price,
      depositAmount: deposit?.amount,
      depositStatus: deposit?.status,
      rentDueAmount: rentRec?.amountDue,
      rentStatus: rentRec?.status
    });
  });

  // 4. Checkouts Data - residents with expectedLeavingDate or leavingDate in month
  const checkoutsRaw = await Resident.find({
    $or: [
      { expectedLeavingDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { leavingDate: { $gte: startOfMonth, $lte: endOfMonth } }
    ]
  })
    .populate('room', 'roomNumber')
    .populate('bed', 'bedLabel')
    .sort({ expectedLeavingDate: 1 })
    .lean();

  const checkoutsByDate = new Map<string, CheckoutDayData>();
  checkoutsRaw.forEach((r: any) => {
    const checkoutDate = r.leavingDate || r.expectedLeavingDate;
    if (!checkoutDate) return;

    const date = new Date(checkoutDate);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
      mobile: r.mobile,
      roomNumber: r.room?.roomNumber || '—',
      bedLabel: r.bed?.bedLabel || '',
      status: r.status,
      leavingDate: r.leavingDate ? new Date(r.leavingDate).toISOString() : undefined,
      expectedLeavingDate: r.expectedLeavingDate ? new Date(r.expectedLeavingDate).toISOString() : undefined
    });
  });

  // 5. Notices Data - residents with noticeDate in month
  const noticesRaw = await Resident.find({
    noticeDate: { $gte: startOfMonth, $lte: endOfMonth }
  })
    .populate('room', 'roomNumber')
    .populate('bed', 'bedLabel')
    .sort({ noticeDate: 1 })
    .lean();

  const noticesByDate = new Map<string, NoticeDayData>();
  noticesRaw.forEach((r: any) => {
    if (!r.noticeDate) return;

    const date = new Date(r.noticeDate);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
      mobile: r.mobile,
      roomNumber: r.room?.roomNumber || '—',
      bedLabel: r.bed?.bedLabel || '',
      noticeDate: new Date(r.noticeDate).toISOString(),
      expectedLeavingDate: r.expectedLeavingDate ? new Date(r.expectedLeavingDate).toISOString() : ''
    });
  });

  // 6. Deposit Refunds Data
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
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
      residentId: d.resident?._id ? d.resident._id.toString() : '',
      residentName: d.resident?.name || 'Resident',
      amount: d.amount
    });
  });

  // 7. Today's Summary
  const todayPayments = paymentsByDate.get(todayKey);
  const todayRentDues = rentDueByDate.get(todayKey);
  const todayCheckIns = checkinsByDate.get(todayKey);
  const todayCheckOuts = checkoutsByDate.get(todayKey);

  const todaySummary: TodaySummary = {
    paymentsExpected: todayPayments?.count || 0,
    paymentsAmount: todayPayments?.totalAmount || 0,
    checkIns: todayCheckIns?.count || 0,
    checkOuts: todayCheckOuts?.count || 0,
    rentDues: todayRentDues?.count || 0,
    rentDuesAmount: todayRentDues?.totalAmount || 0
  };

  // 8. Heatmap Data
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
