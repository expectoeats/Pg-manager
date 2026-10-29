'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { givePlanChange, giveNotice } from '@/lib/services/residents';
import { ArrowLeft, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResidentData {
  _id: string;
  name: string;
  mobile: string;
  alternateMobile?: string;
  guardianName?: string;
  guardianMobile?: string;
  idProofType?: string;
  idProofNumber?: string;
  joiningDate: string;
  leavingDate?: string | null;
  status: 'active' | 'notice' | 'left';
  noticeDate?: string | null;
  expectedLeavingDate?: string | null;
  notes?: string;
  room?: { roomNumber: string; sharingType: string } | null;
  bed?: { bedLabel: string } | null;
  currentPlan?: { _id: string; name: string; price: number; type: string } | null;
}

interface PlanHistoryData {
  _id: string;
  plan: { name: string; price: number } | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

interface PlanData {
  _id: string;
  name: string;
  price: number;
}

interface ResidentProfileProps {
  resident: ResidentData;
  planHistory: PlanHistoryData[];
  activePlans: PlanData[];
  noticePeriodDays: number;
}

const STATUS_BADGE: Record<string, string> = {
  active: 'text-green-600 border-green-200 bg-green-50',
  notice: 'text-yellow-600 border-yellow-200 bg-yellow-50',
  left: 'text-gray-500 border-gray-200 bg-gray-50',
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
}

export default function ResidentProfile({
  resident,
  planHistory,
  activePlans,
  noticePeriodDays,
}: ResidentProfileProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const [newPlanId, setNewPlanId] = useState('');
  const [planEffectiveFrom, setPlanEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [planError, setPlanError] = useState('');

  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]);
  const [noticeError, setNoticeError] = useState('');

  // Compute expected leaving date preview
  const expectedLeaving = noticeDate
    ? (() => {
        const d = new Date(noticeDate);
        d.setDate(d.getDate() + noticePeriodDays);
        return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      })()
    : '—';

  const handleChangePlan = () => {
    if (!newPlanId) {
      setPlanError('Please select a plan');
      return;
    }
    setPlanError('');
    startTransition(async () => {
      const result = await givePlanChange(resident._id, newPlanId, planEffectiveFrom);
      if (result.success) {
        setChangePlanOpen(false);
        router.refresh();
      } else {
        setPlanError(result.error || 'Failed to change plan');
      }
    });
  };

  const handleGiveNotice = () => {
    setNoticeError('');
    startTransition(async () => {
      const result = await giveNotice(resident._id, noticeDate);
      if (result.success) {
        setNoticeOpen(false);
        router.refresh();
      } else {
        setNoticeError(result.error || 'Failed to record notice');
      }
    });
  };

  const initials = resident.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      {/* Back link */}
      <Link href="/residents" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Residents
      </Link>

      {/* Header card */}
      <Card className="border-0 shadow-sm rounded-xl mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{resident.name}</h1>
                <Badge
                  variant="outline"
                  className={cn('text-xs capitalize', STATUS_BADGE[resident.status])}
                >
                  {resident.status === 'notice' ? 'On Notice' : resident.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                {resident.room && resident.bed && (
                  <span>🏠 Room {resident.room.roomNumber} / Bed {resident.bed.bedLabel}</span>
                )}
                {resident.currentPlan && (
                  <span>📋 {resident.currentPlan.name}</span>
                )}
                <span>📱 {resident.mobile}</span>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {(resident.status === 'active' || resident.status === 'notice') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                  onClick={() => {
                    setNewPlanId(resident.currentPlan?._id as string || '');
                    setChangePlanOpen(true);
                  }}
                >
                  Change Plan
                </Button>
              )}
              {resident.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                  onClick={() => setNoticeOpen(true)}
                >
                  Give Notice
                </Button>
              )}
              {(resident.status === 'notice' || resident.status === 'active') && (
                <Link href={`/residents/${resident._id}/checkout`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Check Out
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {resident.status === 'notice' && resident.expectedLeavingDate && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ On notice since {formatDate(resident.noticeDate)}. Expected leaving: {formatDate(resident.expectedLeavingDate)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 bg-white border border-gray-100 rounded-xl p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="plan-history" className="rounded-lg">Plan History</TabsTrigger>
          <TabsTrigger value="rent" className="rounded-lg">Rent</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg">Payments</TabsTrigger>
          <TabsTrigger value="electricity" className="rounded-lg">Electricity</TabsTrigger>
          <TabsTrigger value="deposit" className="rounded-lg">Deposit</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-800 mb-4">Personal Details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Full Name</dt>
                    <dd className="font-medium text-gray-900 text-right">{resident.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Mobile</dt>
                    <dd className="font-medium text-gray-900">{resident.mobile}</dd>
                  </div>
                  {resident.alternateMobile && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Alt. Mobile</dt>
                      <dd className="font-medium text-gray-900">{resident.alternateMobile}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Joining Date</dt>
                    <dd className="font-medium text-gray-900">{formatDate(resident.joiningDate)}</dd>
                  </div>
                  {resident.leavingDate && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Leaving Date</dt>
                      <dd className="font-medium text-gray-900">{formatDate(resident.leavingDate)}</dd>
                    </div>
                  )}
                  {resident.notes && (
                    <div>
                      <dt className="text-gray-500 mb-1">Notes</dt>
                      <dd className="text-gray-700 bg-gray-50 p-2 rounded-lg">{resident.notes}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-xl">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-800 mb-4">ID &amp; Guardian</h3>
                <dl className="space-y-3 text-sm">
                  {resident.idProofType && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">ID Type</dt>
                      <dd className="font-medium text-gray-900 capitalize">{resident.idProofType.replace('_', ' ')}</dd>
                    </div>
                  )}
                  {resident.idProofNumber && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">ID Number</dt>
                      <dd className="font-medium text-gray-900">{resident.idProofNumber}</dd>
                    </div>
                  )}
                  {resident.guardianName && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Guardian</dt>
                      <dd className="font-medium text-gray-900">{resident.guardianName}</dd>
                    </div>
                  )}
                  {resident.guardianMobile && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Guardian Mobile</dt>
                      <dd className="font-medium text-gray-900">{resident.guardianMobile}</dd>
                    </div>
                  )}
                  {!resident.idProofType && !resident.guardianName && (
                    <p className="text-gray-400 text-sm">No ID or guardian details recorded.</p>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plan History */}
        <TabsContent value="plan-history">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-800 mb-4">Plan History</h3>
              {planHistory.length === 0 ? (
                <p className="text-gray-400 text-sm">No plan history available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Plan</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Effective From</TableHead>
                        <TableHead>Effective To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planHistory.map((ph) => (
                        <TableRow key={ph._id}>
                          <TableCell className="font-medium">{ph.plan?.name || '—'}</TableCell>
                          <TableCell>₹{(ph.plan?.price ?? 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell>{formatDate(ph.effectiveFrom)}</TableCell>
                          <TableCell>
                            {ph.effectiveTo ? (
                              formatDate(ph.effectiveTo)
                            ) : (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                                Current
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rent placeholder */}
        <TabsContent value="rent">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center mb-3">
                <span className="text-2xl">🧾</span>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">Rent Records</h3>
              <p className="text-sm text-gray-500">Phase 4 — coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments placeholder */}
        <TabsContent value="payments">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">Payment History</h3>
              <p className="text-sm text-gray-500">Phase 4 — coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Electricity placeholder */}
        <TabsContent value="electricity">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">Electricity Shares</h3>
              <p className="text-sm text-gray-500">Phase 6 — coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposit placeholder */}
        <TabsContent value="deposit">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-3">
                <span className="text-2xl">🏦</span>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">Deposit Details</h3>
              <p className="text-sm text-gray-500">Phase 5 — coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {planError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {planError}
              </div>
            )}
            <div className="space-y-2">
              <Label>New Plan</Label>
              <Select value={newPlanId} onValueChange={setNewPlanId}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} — ₹{p.price.toLocaleString('en-IN')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Effective From</Label>
              <Input
                type="date"
                className="rounded-lg"
                value={planEffectiveFrom}
                onChange={(e) => setPlanEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setChangePlanOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                onClick={handleChangePlan}
                disabled={isPending}
              >
                {isPending ? 'Saving...' : 'Change Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Give Notice Dialog */}
      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Give Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {noticeError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {noticeError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Notice Date</Label>
              <Input
                type="date"
                className="rounded-lg"
                value={noticeDate}
                onChange={(e) => setNoticeDate(e.target.value)}
              />
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <strong>Notice period:</strong> {noticePeriodDays} days<br />
              <strong>Expected leaving:</strong> {expectedLeaving}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setNoticeOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                onClick={handleGiveNotice}
                disabled={isPending}
              >
                {isPending ? 'Recording...' : 'Record Notice'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
