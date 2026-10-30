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

  // Properly serialize Mongoose data for client components
  const data = {
    activePlans: activePlans.map(p => ({
      _id: p._id.toString(),
      name: p.name,
      price: p.price,
      type: p.type,
      sharingType: p.sharingType,
      includesBreakfast: p.includesBreakfast,
      includesLunch: p.includesLunch,
      includesDinner: p.includesDinner,
    })),
    activeRooms: activeRooms.map(r => ({
      _id: r._id.toString(),
      roomNumber: r.roomNumber,
      sharingType: r.sharingType,
    })),
    settings: {
      depositAmount: settings?.depositAmount ?? 2000,
      prorateFirstMonth: settings?.prorateFirstMonth ?? true,
      billingMode: settings?.billingMode ?? 'calendar',
    }
  };

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
