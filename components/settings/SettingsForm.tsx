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
      <TabsList className="mb-6 w-full">
        <TabsTrigger value="pg-details">PG Details</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="electricity">Electricity</TabsTrigger>
        <TabsTrigger value="receipt">Receipt</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <form onSubmit={handleSubmit(onSubmit)}>
        <TabsContent value="pg-details">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px] font-semibold text-[#1C1C1E]">PG Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>PG Name</Label>
                <Input {...register('pgName')} />
                {errors.pgName && (
                  <p className="text-[#FF3B30] text-sm">{errors.pgName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...register('address')} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
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
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px] font-semibold text-[#1C1C1E]">Billing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Deposit Amount (₹)</Label>
                  <Input
                    type="number"
                    {...register('depositAmount')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notice Period (days)</Label>
                  <Input
                    type="number"
                    {...register('noticePeriodDays')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rent Due Day (1-28)</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  {...register('rentDueDay')}
                />
              </div>
              <div className="space-y-2">
                <Label>Billing Mode</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="calendar"
                      checked={billingMode === 'calendar'}
                      onChange={() => setValue('billingMode', 'calendar')}
                      className="accent-[#007AFF]"
                    />
                    <span className="text-sm">Calendar month</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="joining_cycle"
                      checked={billingMode === 'joining_cycle'}
                      onChange={() => setValue('billingMode', 'joining_cycle')}
                      className="accent-[#007AFF]"
                    />
                    <span className="text-sm">Joining cycle</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Prorate first month&apos;s rent</Label>
                <ToggleSwitch
                  checked={prorateFirstMonth}
                  onChange={(v) => setValue('prorateFirstMonth', v)}
                  color="green"
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
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px] font-semibold text-[#1C1C1E]">Electricity Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Rate per Unit (₹)</Label>
                <Input
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
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px] font-semibold text-[#1C1C1E]">Receipt Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Receipt Footer Text</Label>
                <textarea
                  className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
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
        <Card>
          <CardHeader>
            <CardTitle className="text-[15px] font-semibold text-[#1C1C1E]">Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwError && (
                <div className="bg-[#FF3B30]/10 text-[#FF3B30] px-4 py-3 rounded-xl text-sm">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="bg-[#34C759]/10 text-[#34C759] px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> Password changed successfully
                </div>
              )}
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
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
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={pwData.newPassword}
                  onChange={(e) =>
                    setPwData((p) => ({ ...p, newPassword: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
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
                type="submit"
                disabled={pwSaving}
              >
                {pwSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
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
        <div className="bg-[#FF3B30]/10 text-[#FF3B30] px-4 py-3 rounded-xl text-sm mb-3">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="bg-[#34C759]/10 text-[#34C759] px-4 py-3 rounded-xl text-sm mb-3 flex items-center gap-2">
          <Check className="w-4 h-4" /> Settings saved successfully
        </div>
      )}
      <Button
        type="submit"
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          'Save Settings'
        )}
      </Button>
    </div>
  );
}
