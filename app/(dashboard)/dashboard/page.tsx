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
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Occupied Beds',
      icon: DoorOpen,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Pending Rent',
      icon: Receipt,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'This Month Income',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Owner'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your PG</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-0 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                <Skeleton className="h-7 w-16 mb-1" />
                <p className="text-sm text-gray-500">{card.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Phase 2 Coming Soon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Recent Payments</CardTitle>
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
            <p className="text-center text-sm text-gray-400 mt-4">
              Phase 2 coming soon
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Pending Dues</CardTitle>
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
            <p className="text-center text-sm text-gray-400 mt-4">
              Phase 2 coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
