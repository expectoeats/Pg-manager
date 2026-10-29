import { Card, CardContent } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

export default function RentPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rent</h1>
        <p className="text-gray-500 mt-1">Generate monthly rent and track payments</p>
      </div>
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase 4</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Generate monthly rent, track payments and pending dues.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
