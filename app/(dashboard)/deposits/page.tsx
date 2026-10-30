import { Card, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

export default function DepositsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#1D1D1F] tracking-tight">Deposits</h1>
        <p className="text-[#86868B] mt-1 text-[15px]">Security deposit tracking and refunds</p>
      </div>
      <Card className="border border-[#E5E5EA] shadow-none rounded-2xl">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#34C759]/10 rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-[#34C759] strokeWidth={2}" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-2">Coming in Phase 5</h3>
          <p className="text-[14px] text-[#86868B] max-w-xs">
            Track security deposits, refund eligibility, and deductions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
