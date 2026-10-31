import connectDB from '@/lib/db';
import Resident from '@/models/Resident';
import Bed from '@/models/Bed';
import RentRecord from '@/models/RentRecord';
import Payment from '@/models/Payment';
import Expense from '@/models/Expense';
import Plan from '@/models/Plan';

// Ensure the Plan model is registered with Mongoose before populate() is used.
// The import is referenced here to prevent tree-shaking by Turbopack, since
// Plan is only needed indirectly via .populate('currentPlan') and never used
// as a direct variable in this file.
void Plan;

export async function getDashboardStats() {
  await connectDB();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Total active residents
  const totalResidents = await Resident.countDocuments({ status: { $in: ['active', 'notice'] } });

  // Occupied beds
  const occupiedBeds = await Bed.countDocuments({ status: 'occupied' });

  // Total beds
  const totalBeds = await Bed.countDocuments();

  // Pending rent for current month
  const pendingRentRecords = await RentRecord.find({
    month: currentMonth,
    status: { $in: ['pending', 'partial'] },
  }).lean();
  
  const pendingRent = pendingRentRecords.reduce((sum, record) => {
    return sum + (record.amountDue - record.amountPaid);
  }, 0);

  // This month's income (payments)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paymentsThisMonth = await Payment.find({
    paymentDate: { $gte: startOfMonth },
    isReversal: { $ne: true },
  }).lean();
  
  const monthIncome = paymentsThisMonth.reduce((sum, payment) => sum + payment.amount, 0);

  // This month's expenses
  const expensesThisMonth = await Expense.find({
    date: { $gte: startOfMonth },
  }).lean();
  
  const monthExpenses = expensesThisMonth.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    totalResidents,
    occupiedBeds,
    totalBeds,
    vacantBeds: totalBeds - occupiedBeds,
    pendingRent,
    monthIncome,
    monthExpenses,
    monthProfit: monthIncome - monthExpenses,
  };
}

export async function getRecentPayments(limit = 5) {
  await connectDB();
  
  const payments = await Payment.find({ isReversal: { $ne: true } })
    .sort({ paymentDate: -1 })
    .limit(limit)
    .populate('resident', 'name')
    .lean();

  return payments.map(p => ({
    _id: p._id.toString(),
    residentName: (p.resident as any)?.name || 'Unknown',
    amount: p.amount,
    method: p.method,
    date: p.paymentDate,
    type: p.type,
  }));
}

export async function getPendingDues(limit = 5) {
  await connectDB();
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const pendingRecords = await RentRecord.find({
    month: currentMonth,
    status: { $in: ['pending', 'partial'] },
  })
    .sort({ dueDate: 1 })
    .limit(limit)
    .populate('resident', 'name mobile')
    .lean();

  return pendingRecords.map(r => ({
    _id: r._id.toString(),
    residentId: (r.resident as any)?._id?.toString() || '',
    residentName: (r.resident as any)?.name || 'Unknown',
    residentMobile: (r.resident as any)?.mobile || '',
    amountDue: r.amountDue - r.amountPaid,
    dueDate: r.dueDate,
    status: r.status,
  }));
}

export async function getIncomeExpenseData() {
  await connectDB();
  
  const now = new Date();
  const months = [];
  
  // Get last 6 months data
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short' });
    
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Income
    const payments = await Payment.find({
      paymentDate: { $gte: startDate, $lte: endDate },
      isReversal: { $ne: true },
    }).lean();
    
    const income = payments.reduce((sum, p) => sum + p.amount, 0);

    // Expenses
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    }).lean();
    
    const expense = expenses.reduce((sum, e) => sum + e.amount, 0);

    months.push({
      month: monthName,
      income,
      expense,
      profit: income - expense,
    });
  }

  return months;
}

export async function getPlanDistribution() {
  await connectDB();
  
  const residents = await Resident.find({ 
    status: { $in: ['active', 'notice'] } 
  }).populate('currentPlan', 'name').lean();

  const planCounts: Record<string, number> = {};
  
  residents.forEach(r => {
    const planName = (r.currentPlan as any)?.name || 'No Plan';
    planCounts[planName] = (planCounts[planName] || 0) + 1;
  });

  return Object.entries(planCounts).map(([name, count]) => ({
    name,
    count,
  }));
}

export async function getOccupancyTrend() {
  await connectDB();
  
  const totalBeds = await Bed.countDocuments();
  const occupiedBeds = await Bed.countDocuments({ status: 'occupied' });
  
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return {
    totalBeds,
    occupiedBeds,
    vacantBeds: totalBeds - occupiedBeds,
    occupancyRate,
  };
}
