'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { residentSchema, type ResidentFormData } from '@/lib/validators/resident';
import { checkInResident, getVacantBedsByRoom } from '@/lib/services/checkin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface PlanData {
  _id: string;
  name: string;
  price: number;
  type: string;
}

interface RoomData {
  _id: string;
  roomNumber: string;
  sharingType: string;
}

interface BedData {
  _id: string;
  bedLabel: string;
  status: string;
}

interface AddResidentFormProps {
  plans: PlanData[];
  rooms: RoomData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any;
}

const STEPS = ['Personal Info', 'Stay Details', 'ID Proof', 'Deposit & Rent'];

export default function AddResidentForm({ plans, rooms, settings }: AddResidentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [vacantBeds, setVacantBeds] = useState<BedData[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  const depositDefault = settings?.depositAmount ?? 2000;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ResidentFormData>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      joiningDate: new Date().toISOString().split('T')[0],
      depositAmount: depositDefault,
      depositReceived: false,
      recordFirstPayment: false,
    },
  });

  const selectedRoom = watch('room');
  const selectedPlan = watch('currentPlan');
  const depositReceived = watch('depositReceived');
  const depositMethod = watch('depositMethod');
  const recordFirstPayment = watch('recordFirstPayment');
  const firstPaymentMethod = watch('firstPaymentMethod');
  const joiningDate = watch('joiningDate');

  // Load vacant beds when room changes
  useEffect(() => {
    if (!selectedRoom) {
      setVacantBeds([]);
      return;
    }
    setLoadingBeds(true);
    setValue('bed', '');
    startTransition(async () => {
      const beds = await getVacantBedsByRoom(selectedRoom);
      setVacantBeds(JSON.parse(JSON.stringify(beds)));
      setLoadingBeds(false);
    });
  }, [selectedRoom, setValue]);

  // Compute first month rent preview
  const selectedPlanData = plans.find((p) => p._id === selectedPlan);
  const planPrice = selectedPlanData?.price ?? 0;

  let firstMonthRent = planPrice;
  if (joiningDate && settings?.prorateFirstMonth && settings?.billingMode === 'calendar') {
    const d = new Date(joiningDate);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const daysRemaining = daysInMonth - day + 1;
    firstMonthRent = Math.round((planPrice * daysRemaining) / daysInMonth);
  }

  const stepFields: Record<number, (keyof ResidentFormData)[]> = {
    0: ['name', 'mobile'],
    1: ['room', 'bed', 'currentPlan', 'joiningDate'],
    2: [],
    3: ['depositAmount'],
  };

  async function handleNext() {
    const fields = stepFields[currentStep];
    const valid = await trigger(fields);
    if (valid) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  const onSubmit = async (data: ResidentFormData) => {
    setSubmitError('');
    startTransition(async () => {
      const result = await checkInResident(data);
      if (result.success && result.residentId) {
        router.push(`/residents/${result.residentId}`);
      } else {
        setSubmitError(result.error || 'Check-in failed. Please try again.');
        setCurrentStep(0);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  i < currentStep
                    ? 'bg-green-600 text-white'
                    : i === currentStep
                    ? 'bg-green-600 text-white ring-4 ring-green-100'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 font-medium whitespace-nowrap hidden sm:block',
                  i === currentStep ? 'text-green-700' : 'text-gray-400'
                )}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mb-4',
                  i < currentStep ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="pt-6 space-y-5">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {submitError}
              </div>
            )}

            {/* Step 0: Personal Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name <span className="text-red-500">*</span></Label>
                    <Input className="rounded-lg" placeholder="e.g. Rahul Sharma" {...register('name')} />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number <span className="text-red-500">*</span></Label>
                    <Input className="rounded-lg" placeholder="10-digit Indian number" {...register('mobile')} />
                    {errors.mobile && <p className="text-red-500 text-xs">{errors.mobile.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alternate Mobile</Label>
                    <Input className="rounded-lg" placeholder="Optional" {...register('alternateMobile')} />
                    {errors.alternateMobile && <p className="text-red-500 text-xs">{errors.alternateMobile.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Guardian Name</Label>
                    <Input className="rounded-lg" placeholder="Parent or guardian" {...register('guardianName')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Guardian Mobile</Label>
                    <Input className="rounded-lg" placeholder="10-digit Indian number" {...register('guardianMobile')} />
                    {errors.guardianMobile && <p className="text-red-500 text-xs">{errors.guardianMobile.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input className="rounded-lg" placeholder="Any additional notes" {...register('notes')} />
                </div>
              </div>
            )}

            {/* Step 1: Stay Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Room <span className="text-red-500">*</span></Label>
                  <Select value={selectedRoom || ''} onValueChange={(v) => setValue('room', v)}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          Room {r.roomNumber} ({r.sharingType} sharing)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.room && <p className="text-red-500 text-xs">{errors.room.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Bed <span className="text-red-500">*</span></Label>
                  <Select
                    value={watch('bed') || ''}
                    onValueChange={(v) => setValue('bed', v)}
                    disabled={!selectedRoom || loadingBeds}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder={loadingBeds ? 'Loading...' : 'Select a bed'} />
                    </SelectTrigger>
                    <SelectContent>
                      {vacantBeds.length === 0 && !loadingBeds && (
                        <SelectItem value="none" disabled>No vacant beds</SelectItem>
                      )}
                      {vacantBeds.map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          Bed {b.bedLabel} (Vacant)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bed && <p className="text-red-500 text-xs">{errors.bed.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Plan <span className="text-red-500">*</span></Label>
                  <Select value={selectedPlan || ''} onValueChange={(v) => setValue('currentPlan', v)}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name} — ₹{p.price.toLocaleString('en-IN')}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currentPlan && <p className="text-red-500 text-xs">{errors.currentPlan.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Joining Date <span className="text-red-500">*</span></Label>
                  <Input type="date" className="rounded-lg" {...register('joiningDate')} />
                  {errors.joiningDate && <p className="text-red-500 text-xs">{errors.joiningDate.message}</p>}
                </div>
              </div>
            )}

            {/* Step 2: ID Proof */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ID Proof Type</Label>
                  <Select value={watch('idProofType') || ''} onValueChange={(v) => setValue('idProofType', v)}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aadhar">Aadhar Card</SelectItem>
                      <SelectItem value="pan">PAN Card</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="voter_id">Voter ID</SelectItem>
                      <SelectItem value="driving_license">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ID Proof Number</Label>
                  <Input className="rounded-lg" placeholder="Enter ID number" {...register('idProofNumber')} />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  📎 File upload feature coming soon. You can record the ID number for now.
                </div>
              </div>
            )}

            {/* Step 3: Deposit & First Rent */}
            {currentStep === 3 && (
              <div className="space-y-5">
                {/* Deposit */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Security Deposit</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Deposit Amount (₹)</Label>
                      <Input type="number" min={0} className="rounded-lg" {...register('depositAmount')} />
                      {errors.depositAmount && <p className="text-red-500 text-xs">{errors.depositAmount.message}</p>}
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Deposit received now?</Label>
                      <button
                        type="button"
                        onClick={() => setValue('depositReceived', !depositReceived)}
                        className={cn(
                          'w-11 h-6 rounded-full transition-colors relative',
                          depositReceived ? 'bg-green-500' : 'bg-gray-300'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                            depositReceived ? 'translate-x-5' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>
                    {depositReceived && (
                      <div className="space-y-2 pl-4 border-l-2 border-green-200">
                        <Label>Payment Method</Label>
                        <Select value={depositMethod || ''} onValueChange={(v) => setValue('depositMethod', v as 'cash' | 'upi' | 'bank')}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Label>Transaction Reference (optional)</Label>
                        <Input className="rounded-lg" placeholder="UPI / NEFT ref" {...register('depositTransactionRef')} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">First Month Rent</h3>
                  {selectedPlanData ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 mb-3">
                      Plan: {selectedPlanData.name} — ₹{planPrice.toLocaleString('en-IN')}/month
                      {settings?.prorateFirstMonth && settings?.billingMode === 'calendar' && firstMonthRent !== planPrice && (
                        <span className="block mt-1">
                          First month (prorated): <strong>₹{firstMonthRent.toLocaleString('en-IN')}</strong>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 mb-3">
                      Select a plan in Step 2 to see rent preview.
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <Label>Record first payment now?</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('recordFirstPayment', !recordFirstPayment);
                        if (!recordFirstPayment) {
                          setValue('firstPaymentAmount', firstMonthRent);
                        }
                      }}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative',
                        recordFirstPayment ? 'bg-green-500' : 'bg-gray-300'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                          recordFirstPayment ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>

                  {recordFirstPayment && (
                    <div className="space-y-2 pl-4 border-l-2 border-green-200">
                      <div className="space-y-1">
                        <Label>Amount (₹)</Label>
                        <Input type="number" min={0} defaultValue={firstMonthRent} className="rounded-lg" {...register('firstPaymentAmount')} />
                      </div>
                      <div className="space-y-1">
                        <Label>Payment Method</Label>
                        <Select value={firstPaymentMethod || ''} onValueChange={(v) => setValue('firstPaymentMethod', v as 'cash' | 'upi' | 'bank')}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-amber-600">
                        Note: Payment recording (Phase 4) is coming soon. The rent record will be created but payment allocation requires Phase 4.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl px-6"
            onClick={() => {
              if (currentStep === 0) {
                router.push('/residents');
              } else {
                setCurrentStep((s) => s - 1);
              }
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6"
              onClick={handleNext}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6"
              disabled={isPending}
            >
              {isPending ? 'Checking in...' : 'Complete Check-in'}
              {!isPending && <Check className="w-4 h-4 ml-1" />}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
