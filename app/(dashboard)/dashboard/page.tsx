import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DoorOpen, Receipt, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  const statCards = [
    {
      title: 'Total Residents',
      icon: Users,
      color: 'text-[#007AFF]',
      bg: 'bg-[#007AFF]/10',
    },
    {
      title: 'Occupied Beds',
      icon: DoorOpen,
      color: 'text-[#34C759]',
      bg: 'bg-[#34C759]/10',
    },
    {
      title: 'Pending Rent',
      icon: Receipt,
      color: 'text-[#FF9500]',
      bg: 'bg-[#FF9500]/10',
    },
    {
      title: 'This Month Income',
      icon: TrendingUp,
      color: 'text-[#AF52DE]',
      bg: 'bg-[#AF52DE]/10',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#1C1C1E]">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Owner'}
        </h1>
        <p className="text-[#8E8E93] mt-1">Here&apos;s an overview of your PG</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                <Skeleton className="h-7 w-16 mb-1" />
                <p className="text-sm text-[#8E8E93]">{card.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Phase 2 Coming Soon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-[15px] font-semibold text-[#1C1C1E]">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-[#8E8E93] mt-4">
              Phase 2 coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[15px] font-semibold text-[#1C1C1E]">Pending Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-[#8E8E93] mt-4">
              Phase 2 coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
