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
import { ArrowLeft, LogOut, Home, ClipboardList, Phone, AlertTriangle, Receipt, CreditCard, Zap, Landmark } from 'lucide-react';
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
  active: 'bg-[#34C759]/10 text-[#34C759] border-transparent',
  notice: 'bg-[#FF9500]/10 text-[#FF9500] border-transparent',
  left: 'bg-[#8E8E93]/10 text-[#8E8E93] border-transparent',
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
      <Link href="/residents" className="inline-flex items-center gap-1 text-sm text-[#8E8E93] hover:text-[#1C1C1E] mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Residents
      </Link>

      {/* Header card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-[22px] font-semibold text-[#1C1C1E]">{resident.name}</h1>
                <Badge
                  variant="outline"
                  className={cn('text-xs capitalize', STATUS_BADGE[resident.status])}
                >
                  {resident.status === 'notice' ? 'On Notice' : resident.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-[#1C1C1E]">
                {resident.room && resident.bed && (
                  <span className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-[#8E8E93]" /> Room {resident.room.roomNumber} / Bed {resident.bed.bedLabel}</span>
                )}
                {resident.currentPlan && (
                  <span className="flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5 text-[#8E8E93]" /> {resident.currentPlan.name}</span>
                )}
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#8E8E93]" /> {resident.mobile}</span>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {(resident.status === 'active' || resident.status === 'notice') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
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
                  className="text-xs text-[#FF9500] border-[#FF9500]/30 hover:bg-[#FF9500]/10"
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
                    className="text-xs text-[#FF3B30] border-[#FF3B30]/20 hover:bg-[#FF3B30]/10"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Check Out
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {resident.status === 'notice' && resident.expectedLeavingDate && (
            <div className="mt-4 p-3 bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-lg text-sm text-[#FF9500] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF9500] flex-shrink-0" />
              On notice since {formatDate(resident.noticeDate)}. Expected leaving: {formatDate(resident.expectedLeavingDate)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 bg-[#F2F2F7] rounded-xl p-1 gap-1 h-auto flex-wrap">
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
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-[15px] font-semibold text-[#1C1C1E] mb-4">Personal Details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#8E8E93] text-xs">Full Name</dt>
                    <dd className="text-[#1C1C1E] text-sm text-right">{resident.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#8E8E93] text-xs">Mobile</dt>
                    <dd className="text-[#1C1C1E] text-sm">{resident.mobile}</dd>
                  </div>
                  {resident.alternateMobile && (
                    <div className="flex justify-between">
                      <dt className="text-[#8E8E93] text-xs">Alt. Mobile</dt>
                      <dd className="text-[#1C1C1E] text-sm">{resident.alternateMobile}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-[#8E8E93] text-xs">Joining Date</dt>
                    <dd className="text-[#1C1C1E] text-sm">{formatDate(resident.joiningDate)}</dd>
                  </div>
                  {resident.leavingDate && (
                    <div className="flex justify-between">
                      <dt className="text-[#8E8E93] text-xs">Leaving Date</dt>
                      <dd className="text-[#1C1C1E] text-sm">{formatDate(resident.leavingDate)}</dd>
                    </div>
                  )}
                  {resident.notes && (
                    <div>
                      <dt className="text-[#8E8E93] text-xs mb-1">Notes</dt>
                      <dd className="text-[#1C1C1E] bg-[#F2F2F7] p-2 rounded-lg">{resident.notes}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-[15px] font-semibold text-[#1C1C1E] mb-4">ID &amp; Guardian</h3>
                <dl className="space-y-3 text-sm">
                  {resident.idProofType && (
                    <div className="flex justify-between">
                      <dt className="text-[#8E8E93] text-xs">ID Type</dt>
                      <dd className="text-[#1C1C1E] text-sm capitalize">{resident.idProofType.replace('_', ' ')}</dd>
                    </div>
                  )}
                  {resident.idProofNumber && (
                    <div className="flex justify-between">
                      <dt className="text-[#8E8E93] text-xs">ID Number</dt>
                      <dd className="text-[#1C1C1E] text-sm">{resident.idProofNumber}</dd>
                    </div>
                  )}
                  {resident.guardianName && (
                    <div className="flex justify-between">
                      <dt className="text-[#8E8E93] text-xs">Guardian</dt>
                      <dd className="text-[#1C1C1E] text-sm">{resident.guardianName}</dd>
                    </div>
                  )}
                  {resident.guardianMobile && (
                    <div className="flex justify-between">
                      <dt className="text-[#8E8E93] text-xs">Guardian Mobile</dt>
                      <dd className="text-[#1C1C1E] text-sm">{resident.guardianMobile}</dd>
                    </div>
                  )}
                  {!resident.idProofType && !resident.guardianName && (
                    <p className="text-[#8E8E93] text-sm">No ID or guardian details recorded.</p>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plan History */}
        <TabsContent value="plan-history">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-[15px] font-semibold text-[#1C1C1E] mb-4">Plan History</h3>
              {planHistory.length === 0 ? (
                <p className="text-[#8E8E93] text-sm">No plan history available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                              <Badge variant="outline" className="text-xs bg-[#34C759]/10 text-[#34C759] border-transparent">
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
          <Card>
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#FF9500]/10 rounded-2xl flex items-center justify-center mb-3">
                <Receipt className="w-6 h-6 text-[#FF9500]" />
              </div>
              <h3 className="text-base font-medium text-[#1C1C1E] mb-1">Rent Records</h3>
              <p className="text-sm text-[#8E8E93]">Phase 4 — coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments placeholder */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center mb-3">
                <CreditCard className="w-6 h-6 text-[#007AFF]" />
              </div>
              <h3 className="text-base font-medium text-[#1C1C1E] mb-1">Payment History</h3>
              <p className="text-sm text-[#8E8E93]">Phase 4 — coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Electricity placeholder */}
        <TabsContent value="electricity">
          <Card>
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#FF9500]/10 rounded-2xl flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-[#FF9500]" />
              </div>
              <h3 className="text-base font-medium text-[#1C1C1E] mb-1">Electricity Shares</h3>
              <p className="text-sm text-[#8E8E93]">Phase 6 — coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposit placeholder */}
        <TabsContent value="deposit">
          <Card>
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#5856D6]/10 rounded-2xl flex items-center justify-center mb-3">
                <Landmark className="w-6 h-6 text-[#5856D6]" />
              </div>
              <h3 className="text-base font-medium text-[#1C1C1E] mb-1">Deposit Details</h3>
              <p className="text-sm text-[#8E8E93]">Phase 5 — coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {planError && (
              <div className="bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20 px-3 py-2 rounded-lg text-sm">
                {planError}
              </div>
            )}
            <div className="space-y-2">
              <Label>New Plan</Label>
              <Select value={newPlanId} onValueChange={setNewPlanId}>
                <SelectTrigger>
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
                value={planEffectiveFrom}
                onChange={(e) => setPlanEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setChangePlanOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Give Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {noticeError && (
              <div className="bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20 px-3 py-2 rounded-lg text-sm">
                {noticeError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Notice Date</Label>
              <Input
                type="date"
                value={noticeDate}
                onChange={(e) => setNoticeDate(e.target.value)}
              />
            </div>
            <div className="p-3 bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-lg text-sm text-[#FF9500]">
              <strong>Notice period:</strong> {noticePeriodDays} days<br />
              <strong>Expected leaving:</strong> {expectedLeaving}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setNoticeOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#FF9500] hover:bg-[#E68B00] text-white"
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
