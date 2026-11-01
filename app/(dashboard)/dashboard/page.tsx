import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DoorOpen, 
  Receipt, 
  TrendingUp, 
  BedDouble,
  TrendingDown,
  Calendar,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { 
  getDashboardStats, 
  getRecentPayments, 
  getPendingDues,
  getIncomeExpenseData,
  getPlanDistribution,
  getOccupancyTrend,
} from '@/lib/services/dashboard';
import { getDashboardCalendarData } from '@/lib/services/dashboard-calendar';
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
import { PlanDistributionChart } from '@/components/dashboard/PlanDistributionChart';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';

export default async function DashboardPage() {
  const session = await auth();
  
  // Get current month for calendar
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [stats, recentPayments, pendingDues, incomeExpenseData, planDistribution, occupancy, calendarData] = await Promise.all([
    getDashboardStats(),
    getRecentPayments(5),
    getPendingDues(5),
    getIncomeExpenseData(),
    getPlanDistribution(),
    getOccupancyTrend(),
    getDashboardCalendarData(currentMonth),
  ]);

  const statCards = [
    {
      title: 'Total Residents',
      value: stats.totalResidents,
      icon: Users,
      color: 'text-[#007AFF]',
      bg: 'bg-[#007AFF]/10',
      change: null,
    },
    {
      title: 'Occupied Beds',
      value: stats.occupiedBeds,
      subtitle: `${stats.vacantBeds} vacant`,
      icon: DoorOpen,
      color: 'text-[#34C759]',
      bg: 'bg-[#34C759]/10',
      change: `${occupancy.occupancyRate}% occupied`,
    },
    {
      title: 'Pending Rent',
      value: `₹${stats.pendingRent.toLocaleString('en-IN')}`,
      icon: Receipt,
      color: 'text-[#FF9500]',
      bg: 'bg-[#FF9500]/10',
      change: null,
    },
    {
      title: 'This Month',
      value: `₹${stats.monthIncome.toLocaleString('en-IN')}`,
      subtitle: `Profit: ₹${stats.monthProfit.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-[#AF52DE]',
      bg: 'bg-[#AF52DE]/10',
      change: stats.monthProfit >= 0 ? 'positive' : 'negative',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-2xl sm:text-[28px] tracking-tight text-[#1C1C1E]">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Owner'}
        </h1>
        <p className="text-[#8E8E93] text-xs sm:text-[15px] mt-0.5 sm:mt-1">
          Here&apos;s an overview of your PG
        </p>
      </div>

      {/* Dashboard Calendar */}
      <DashboardCalendar initialData={calendarData} initialMonth={currentMonth} />

      {/* Stat Cards - 2x2 on mobile for quick glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const cardHref =
            card.title === 'Total Residents'
              ? '/residents'
              : card.title === 'Occupied Beds'
              ? '/rooms'
              : card.title === 'Pending Rent'
              ? '/rent'
              : '/reports';
          return (
            <Link href={cardHref} key={card.title}>
              <Card
                className="border border-[#E5E5EA] shadow-xs rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer h-full"
              >
                <CardContent className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-2 sm:mb-4">
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} strokeWidth={2.2} />
                  </div>
                  {card.change && (
                    <Badge 
                      variant="secondary" 
                      className={`text-[10px] sm:text-xs font-medium px-1.5 py-0.5 ${
                        card.change === 'positive' 
                          ? 'bg-[#34C759]/10 text-[#34C759]' 
                          : card.change === 'negative'
                          ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                          : 'bg-[#F2F2F7] text-[#8E8E93]'
                      }`}
                    >
                      {card.change === 'positive' || card.change === 'negative' ? '' : card.change}
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#1C1C1E] tracking-tight mb-0.5">
                    {card.value}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#8E8E93] font-medium leading-tight">{card.title}</p>
                  {card.subtitle && (
                    <p className="text-[11px] text-[#8E8E93] mt-0.5 hidden sm:block">{card.subtitle}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Income vs Expense Chart */}
        <Card className="lg:col-span-2 border border-[#E5E5EA] shadow-sm rounded-2xl">
          <CardHeader className="border-b border-[#E5E5EA]">
            <CardTitle className="font-semibold text-[17px] tracking-[-0.022em] text-[#1C1C1E] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#007AFF]" strokeWidth={2} />
              Income vs Expenses
            </CardTitle>
            <p className="text-[13px] text-[#8E8E93] mt-1">Last 6 months financial overview</p>
          </CardHeader>
          <CardContent className="pt-6">
            <IncomeExpenseChart data={incomeExpenseData} />
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="border border-[#E5E5EA] shadow-sm rounded-2xl">
          <CardHeader className="border-b border-[#E5E5EA]">
            <CardTitle className="font-semibold text-[17px] tracking-[-0.022em] text-[#1C1C1E] flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-[#007AFF]" strokeWidth={2} />
              Plan Distribution
            </CardTitle>
            <p className="text-[13px] text-[#8E8E93] mt-1">Residents by plan type</p>
          </CardHeader>
          <CardContent className="pt-6">
            {planDistribution.length > 0 ? (
              <PlanDistributionChart data={planDistribution} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-[#8E8E93]">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <Card className="border border-[#E5E5EA] shadow-sm rounded-2xl">
          <CardHeader className="border-b border-[#E5E5EA]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-semibold text-[17px] tracking-[-0.022em] text-[#1C1C1E] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#34C759]" strokeWidth={2} />
                  Recent Payments
                </CardTitle>
                <p className="text-[13px] text-[#8E8E93] mt-1">Latest transactions</p>
              </div>
              <Link 
                href="/payments" 
                className="text-[#007AFF] text-[13px] font-semibold hover:text-[#0071EB] transition-colors flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div 
                    key={payment._id} 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2F2F7] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-[#34C759]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-[#1C1C1E] truncate">
                        {payment.residentName}
                      </p>
                      <p className="text-[13px] text-[#8E8E93]">
                        {payment.method.toUpperCase()} • {new Date(payment.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <p className="text-[15px] font-bold text-[#34C759]">
                      +₹{payment.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#8E8E93]">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" strokeWidth={2} />
                <p className="font-medium">No payments yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Dues */}
        <Card className="border border-[#E5E5EA] shadow-sm rounded-2xl">
          <CardHeader className="border-b border-[#E5E5EA]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-semibold text-[17px] tracking-[-0.022em] text-[#1C1C1E] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#FF9500]" strokeWidth={2} />
                  Pending Dues
                </CardTitle>
                <p className="text-[13px] text-[#8E8E93] mt-1">Upcoming rent collections</p>
              </div>
              <Link 
                href="/rent" 
                className="text-[#007AFF] text-[13px] font-semibold hover:text-[#0071EB] transition-colors flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {pendingDues.length > 0 ? (
              <div className="space-y-3">
                {pendingDues.map((due) => (
                  <Link
                    key={due._id}
                    href={`/residents/${due.residentId}`}
                    className="block"
                  >
                    <div
                      key={due._id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2F2F7] transition-colors cursor-pointer"
                    >
                    <div className="w-10 h-10 rounded-full bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-[#FF9500]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-[#1C1C1E] truncate">
                        {due.residentName}
                      </p>
                      <p className="text-[13px] text-[#8E8E93]">
                        Due: {new Date(due.dueDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-bold text-[#FF9500]">
                        ₹{due.amountDue.toLocaleString('en-IN')}
                      </p>
                      <Badge 
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${
                          due.status === 'pending' 
                            ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                            : 'bg-[#FF9500]/10 text-[#FF9500]'
                        }`}
                      >
                        {due.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#8E8E93]">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" strokeWidth={2} />
                <p className="font-medium">No pending dues</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
