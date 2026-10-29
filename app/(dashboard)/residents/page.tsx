import { Suspense } from 'react';
import { getResidents } from '@/lib/services/residents';
import { getPlans } from '@/lib/services/plans';
import { getRooms } from '@/lib/services/rooms';
import ResidentsList from '@/components/residents/ResidentsList';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchParams {
  status?: string;
  planId?: string;
  roomId?: string;
}

export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = {
    status: params.status,
    planId: params.planId,
    roomId: params.roomId,
  };

  const [residents, plans, rooms] = await Promise.all([
    getResidents(filters),
    getPlans(),
    getRooms(),
  ]);

  const data = JSON.parse(JSON.stringify({ residents, plans, rooms }));

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <ResidentsList
        residents={data.residents}
        plans={data.plans}
        rooms={data.rooms}
        initialFilters={filters}
      />
    </Suspense>
  );
}
