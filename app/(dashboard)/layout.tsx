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

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          userName={session.user.name ?? ''}
          userEmail={session.user.email ?? ''}
        />
      </div>

      {/* Main content */}
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar pgName={pgName} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
