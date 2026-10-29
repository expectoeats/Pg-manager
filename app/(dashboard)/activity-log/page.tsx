import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function ActivityLogPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-500 mt-1">Track all actions performed in the system</p>
      </div>
      <Card className="border-0 shadow-sm rounded-xl">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase 8</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Read-only audit trail showing who did what and when, filterable by entity type.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
