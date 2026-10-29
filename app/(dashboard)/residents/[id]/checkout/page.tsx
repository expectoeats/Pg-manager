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
      <Link href={`/residents/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Profile
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Check-out: {resident.name}</h1>
        <p className="text-gray-500 mt-1">Final settlement wizard</p>
      </div>
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase 7</h3>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            The check-out wizard will handle notice period verification, dues settlement, deposit refund calculation, and final settlement PDF generation.
          </p>
          <Link href={`/residents/${id}`}>
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
