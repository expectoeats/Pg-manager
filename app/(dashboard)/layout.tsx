import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';

// ── DEMO MODE: Auth disabled ──────────────────────────────────────────────────
// Login is commented out for demo. Re-enable by uncommenting the auth() block
// and the redirect below, and removing the mock session.
// import { auth } from '@/lib/auth';
// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Demo mock session — replace with real auth when needed:
  // const session = await auth();
  // if (!session?.user) { redirect('/login'); }
  const userName = 'Owner';
  const userEmail = 'admin@pg.com';

  let pgName = 'My PG';
  try {
    await connectDB();
    const settings = await Settings.findOne().lean();
    if (settings?.pgName) pgName = settings.pgName;
  } catch {
    // Use default
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans antialiased overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar userName={userName} userEmail={userEmail} />
      </div>

      {/* Main Content Area */}
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar pgName={pgName} userName={userName} userEmail={userEmail} />
        {/* pb-[calc(5rem+env(safe-area-inset-bottom))] ensures comfortable clearance above mobile bottom bar */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar with Menu Drawer */}
      <BottomNav pgName={pgName} userName={userName} userEmail={userEmail} />
    </div>
  );
}
