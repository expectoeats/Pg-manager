import { getPlans } from '@/lib/services/plans';
import PlansClient from '@/components/plans/PlansClient';

export default async function PlansPage() {
  const plans = await getPlans();
  const data = JSON.parse(JSON.stringify(plans));

  return (
    <div>
      <PlansClient plans={data} />
    </div>
  );
}
