import { getPlans } from '@/lib/services/plans';
import { getRooms } from '@/lib/services/rooms';
import { getSettings } from '@/lib/services/settings';
import AddResidentForm from '@/components/residents/AddResidentForm';

export default async function AddResidentPage() {
  const [plans, rooms, settings] = await Promise.all([
    getPlans(),
    getRooms(),
    getSettings(),
  ]);

  const activePlans = plans.filter((p) => p.isActive);
  const activeRooms = rooms.filter((r) => r.isActive);

  const data = JSON.parse(JSON.stringify({ activePlans, activeRooms, settings }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Resident</h1>
        <p className="text-gray-500 mt-1">Check in a new resident to a room</p>
      </div>
      <AddResidentForm
        plans={data.activePlans}
        rooms={data.activeRooms}
        settings={data.settings}
      />
    </div>
  );
}
