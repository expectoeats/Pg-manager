import { Card, CardContent } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

export default function RentPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">Rent</h1>
        <p className="text-[#8E8E93] mt-1">Generate monthly rent and track payments</p>
      </div>
      <Card className="border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-[#007AFF]" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium text-[#1C1C1E] mb-2">Coming in Phase 4</h3>
          <p className="text-sm text-[#8E8E93] max-w-xs">
            Generate monthly rent, track payments and pending dues.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
