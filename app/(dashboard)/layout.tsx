import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  let pgName = 'PG Manager';
  try {
    await connectDB();
    const settings = await Settings.findOne().lean();
    if (settings?.pgName) pgName = settings.pgName;
  } catch {
    // Use default
  }

  const userName = session.user.name ?? 'Owner';
  const userEmail = session.user.email ?? '';

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans antialiased overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar userName={userName} userEmail={userEmail} />
      </div>

      {/* Main Content Area */}
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar pgName={pgName} userName={userName} userEmail={userEmail} />
        {/* pb-24 ensures comfortable clearance above mobile bottom bar */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-24 md:pb-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar with Menu Drawer */}
      <BottomNav pgName={pgName} userName={userName} userEmail={userEmail} />
    </div>
  );
}
