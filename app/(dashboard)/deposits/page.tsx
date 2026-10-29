import { Card, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

export default function DepositsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deposits</h1>
        <p className="text-gray-500 mt-1">Security deposit tracking and refunds</p>
      </div>
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase 5</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Track security deposits, refund eligibility, and deductions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
