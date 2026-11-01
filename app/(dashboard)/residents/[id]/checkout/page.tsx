import { getResident } from '@/lib/services/residents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resident = await getResident(id);

  return (
    <div>
      <Link href={`/residents/${id}`} prefetch={false} className="inline-flex items-center gap-1 text-[15px] text-[#8E8E93] hover:text-[#1C1C1E] mb-4 transition-colors">
        <ArrowLeft className="w-5 h-5" strokeWidth={2} /> Back to Profile
      </Link>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">Check-out: {resident.name}</h1>
        <p className="text-[15px] text-[#8E8E93] mt-1">Final settlement wizard</p>
      </div>
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-[#007AFF]" strokeWidth={2} />
          </div>
          <h3 className="text-[19px] font-semibold text-[#1C1C1E] tracking-[-0.022em] mb-2">Coming in Phase 7</h3>
          <p className="text-[15px] text-[#8E8E93] max-w-xs mb-6">
            The check-out wizard will handle notice period verification, dues settlement, deposit refund calculation, and final settlement PDF generation.
          </p>
          <Link href={`/residents/${id}`} prefetch={false}>
            <Button variant="outline" className="rounded-xl h-11">
              <ArrowLeft className="w-5 h-5 mr-2" strokeWidth={2} />
              Back to Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
