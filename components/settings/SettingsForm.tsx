'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  settingsSchema,
  type SettingsFormData,
} from '@/lib/validators/settings';
import {
  updateSettings,
  changePassword,
} from '@/lib/services/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { Loader2, Check } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SettingsFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialSettings: any;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      pgName: initialSettings?.pgName || '',
      address: initialSettings?.address || '',
      phone: initialSettings?.phone || '',
      depositAmount: initialSettings?.depositAmount ?? 2000,
      noticePeriodDays: initialSettings?.noticePeriodDays ?? 20,
      rentDueDay: initialSettings?.rentDueDay ?? 1,
      defaultRatePerUnit: initialSettings?.defaultRatePerUnit ?? 8,
      billingMode: initialSettings?.billingMode || 'calendar',
      prorateFirstMonth: initialSettings?.prorateFirstMonth ?? true,
      receiptFooter: initialSettings?.receiptFooter || '',
    },
  });

  const prorateFirstMonth = watch('prorateFirstMonth');
  const billingMode = watch('billingMode');

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    const result = await updateSettings(data);
    setSaving(false);
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(result.error || 'Failed to save settings');
    }
  };

  // Password change state
  const [pwData, setPwData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    if (pwData.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    setPwError('');
    const result = await changePassword({
      currentPassword: pwData.currentPassword,
      newPassword: pwData.newPassword,
    });
    setPwSaving(false);
    if (result.success) {
      setPwSuccess(true);
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } else {
      setPwError(result.error || 'Failed to change password');
    }
  };

  return (
    <Tabs defaultValue="pg-details">
      <TabsList className="mb-6">
        <TabsTrigger value="pg-details">PG Details</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="electricity">Electricity</TabsTrigger>
        <TabsTrigger value="receipt">Receipt</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <form onSubmit={handleSubmit(onSubmit)}>
        <TabsContent value="pg-details">
          <Card className="rounded-2xl border-[#E5E5EA]">
            <CardHeader>
              <CardTitle className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">PG Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">PG Name</Label>
                <Input className="h-11" {...register('pgName')} />
                {errors.pgName && (
                  <p className="text-[#FF3B30] text-[13px]">{errors.pgName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Address</Label>
                <Input className="h-11" {...register('address')} />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Phone</Label>
                <Input
                  className="h-11"
                  type="tel"
                  {...register('phone')}
                />
              </div>
              <SaveButton
                saving={saving}
                saveSuccess={saveSuccess}
                saveError={saveError}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="rounded-2xl border-[#E5E5EA]">
            <CardHeader>
              <CardTitle className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">Billing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Deposit Amount (₹)</Label>
                  <Input
                    className="h-11"
                    type="number"
                    {...register('depositAmount')}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Notice Period (days)</Label>
                  <Input
                    className="h-11"
                    type="number"
                    {...register('noticePeriodDays')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Rent Due Day (1-28)</Label>
                <Input
                  className="h-11"
                  type="number"
                  min={1}
                  max={28}
                  {...register('rentDueDay')}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Billing Mode</Label>
                  <p className="text-[13px] text-[#8E8E93] mt-0.5">Choose how rent is calculated for new residents</p>
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-[#F9F9FB]"
                    style={{
                      borderColor: billingMode === 'calendar' ? '#007AFF' : '#E5E5EA',
                      backgroundColor: billingMode === 'calendar' ? 'rgba(0, 122, 255, 0.05)' : 'transparent'
                    }}>
                    <input
                      type="radio"
                      value="calendar"
                      checked={billingMode === 'calendar'}
                      onChange={() => setValue('billingMode', 'calendar')}
                      className="accent-[#007AFF] w-5 h-5 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <div className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">📅 Calendar Month</div>
                      <p className="text-[13px] text-[#8E8E93] mt-1">
                        All residents pay on 1st of every month. First month is prorated + advance for next month collected.
                      </p>
                      <p className="text-[12px] text-[#007AFF] mt-1.5">
                        Example: Join 29 Oct → Pay for 29-31 Oct (₹466) + full November (₹7,000) = ₹7,466 + deposit
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-[#F9F9FB]"
                    style={{
                      borderColor: billingMode === 'joining_cycle' ? '#007AFF' : '#E5E5EA',
                      backgroundColor: billingMode === 'joining_cycle' ? 'rgba(0, 122, 255, 0.05)' : 'transparent'
                    }}>
                    <input
                      type="radio"
                      value="joining_cycle"
                      checked={billingMode === 'joining_cycle'}
                      onChange={() => setValue('billingMode', 'joining_cycle')}
                      className="accent-[#007AFF] w-5 h-5 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <div className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">🔄 Joining Date Cycle</div>
                      <p className="text-[13px] text-[#8E8E93] mt-1">
                        Each resident pays 30 days from their joining date. Due date varies per resident.
                      </p>
                      <p className="text-[12px] text-[#007AFF] mt-1.5">
                        Example: Join 29 Oct → Pay for 29 Oct - 27 Nov (30 days) = ₹7,000 + deposit. Next due 28 Nov.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Prorate first month&apos;s rent</Label>
                <ToggleSwitch
                  checked={prorateFirstMonth}
                  onChange={(v) => setValue('prorateFirstMonth', v)}
                />
              </div>
              <SaveButton
                saving={saving}
                saveSuccess={saveSuccess}
                saveError={saveError}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="electricity">
          <Card className="rounded-2xl border-[#E5E5EA]">
            <CardHeader>
              <CardTitle className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">Electricity Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Default Rate per Unit (₹)</Label>
                <Input
                  className="h-11"
                  type="number"
                  step="0.01"
                  {...register('defaultRatePerUnit')}
                />
              </div>
              <SaveButton
                saving={saving}
                saveSuccess={saveSuccess}
                saveError={saveError}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt">
          <Card className="rounded-2xl border-[#E5E5EA]">
            <CardHeader>
              <CardTitle className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">Receipt Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Receipt Footer Text</Label>
                <textarea
                  className="w-full h-24 rounded-xl border border-[#E5E5EA] px-3 py-2.5 text-[15px] text-[#1C1C1E] tracking-[-0.016em] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all resize-none"
                  rows={4}
                  placeholder="Thank you for staying with us!"
                  {...register('receiptFooter')}
                />
              </div>
              <SaveButton
                saving={saving}
                saveSuccess={saveSuccess}
                saveError={saveError}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </form>

      <TabsContent value="security">
        <Card className="rounded-2xl border-[#E5E5EA]">
          <CardHeader>
            <CardTitle className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              {pwError && (
                <div className="bg-[#FF3B30]/10 text-[#FF3B30] px-4 py-3 rounded-xl text-[13px] border border-[#FF3B30]/20">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="bg-[#34C759]/10 text-[#34C759] px-4 py-3 rounded-xl text-[13px] flex items-center gap-2 border border-[#34C759]/20">
                  <Check className="w-5 h-5 strokeWidth={2}" /> Password changed successfully
                </div>
              )}
              <div className="space-y-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Current Password</Label>
                <Input
                  className="h-11"
                  type="password"
                  value={pwData.currentPassword}
                  onChange={(e) =>
                    setPwData((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">New Password</Label>
                <Input
                  className="h-11"
                  type="password"
                  value={pwData.newPassword}
                  onChange={(e) =>
                    setPwData((p) => ({ ...p, newPassword: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-[15px] text-[#1C1C1E] tracking-[-0.016em]">Confirm New Password</Label>
                <Input
                  className="h-11"
                  type="password"
                  value={pwData.confirmPassword}
                  onChange={(e) =>
                    setPwData((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                className="h-11"
                type="submit"
                disabled={pwSaving}
                variant="destructive"
              >
                {pwSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin strokeWidth={2}" />{' '}
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function SaveButton({
  saving,
  saveSuccess,
  saveError,
}: {
  saving: boolean;
  saveSuccess: boolean;
  saveError: string;
}) {
  return (
    <div>
      {saveError && (
        <div className="bg-[#FF3B30]/10 text-[#FF3B30] px-4 py-3 rounded-xl text-[13px] mb-3 border border-[#FF3B30]/20">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="bg-[#34C759]/10 text-[#34C759] px-4 py-3 rounded-xl text-[13px] mb-3 flex items-center gap-2 border border-[#34C759]/20">
          <Check className="w-5 h-5 strokeWidth={2}" /> Settings saved successfully
        </div>
      )}
      <Button
        className="h-11"
        type="submit"
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin strokeWidth={2}" /> Saving...
          </>
        ) : (
          'Save Settings'
        )}
      </Button>
    </div>
  );
}
