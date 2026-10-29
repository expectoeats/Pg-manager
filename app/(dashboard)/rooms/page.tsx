import { getRoomsWithBeds } from '@/lib/services/rooms';
import RoomsClient from '@/components/rooms/RoomsClient';

export default async function RoomsPage() {
  const roomsWithBeds = await getRoomsWithBeds();
  // Serialize to plain objects for client component
  const data = JSON.parse(JSON.stringify(roomsWithBeds));

  return (
    <div>
      <RoomsClient roomsWithBeds={data} />
    </div>
  );
}
