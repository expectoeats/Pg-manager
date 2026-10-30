import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function ActivityLogPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">Activity Log</h1>
        <p className="text-[#8E8E93] text-[15px] mt-1 tracking-[-0.016em]">Track all actions performed in the system</p>
      </div>
      <Card className="rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)]">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#8E8E93]/10 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-[#8E8E93] strokeWidth={2}" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.022em] mb-2">Coming in Phase 8</h3>
          <p className="text-[14px] text-[#8E8E93] max-w-xs tracking-[-0.016em]">
            Read-only audit trail showing who did what and when, filterable by entity type.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
