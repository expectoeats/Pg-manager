import { getResident, getPlanHistory, getResidentCalendarData } from '@/lib/services/residents';
import { getPlans } from '@/lib/services/plans';
import { getSettings } from '@/lib/services/settings';
import ResidentProfile from '@/components/residents/ResidentProfile';

export default async function ResidentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [resident, planHistory, plans, settings, calendarData] = await Promise.all([
    getResident(id),
    getPlanHistory(id),
    getPlans(),
    getSettings(),
    getResidentCalendarData(id),
  ]);

  const activePlans = plans.filter((p) => p.isActive);
  const noticePeriodDays = settings?.noticePeriodDays ?? 20;

  const data = JSON.parse(JSON.stringify({ resident, planHistory, activePlans, noticePeriodDays, calendarData }));

  return <ResidentProfile {...data} />;
}
