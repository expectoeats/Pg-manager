'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { residentSchema, type ResidentFormData } from '@/lib/validators/resident';
import { checkInResident, getVacantBedsByRoom } from '@/lib/services/checkin';
import { getRoomLayoutWithBills } from '@/lib/services/rooms';
import { RoomLayoutPreview } from '@/components/rooms/RoomLayoutPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Home,
  ShieldCheck,
  Wallet,
  BedDouble,
  Bed,
  UtensilsCrossed,
  Utensils,
  Coffee,
  Moon,
  Sun,
  Building2,
  Info,
  Banknote,
  Smartphone,
  Landmark,
} from 'lucide-react';

interface PlanData {
  _id: string;
  name: string;
  price: number;
  type: string;
  sharingType: string;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
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

const STEPS = [
  { label: 'Personal Info', icon: User },
  { label: 'Stay & Plan', icon: Home },
  { label: 'ID Proof', icon: ShieldCheck },
  { label: 'Deposit & Rent', icon: Wallet },
];

function getMealLabel(plan: PlanData) {
  const meals = [];
  if (plan.includesBreakfast) meals.push('Breakfast');
  if (plan.includesLunch) meals.push('Lunch');
  if (plan.includesDinner) meals.push('Dinner');
  return meals.length > 0 ? meals.join(' + ') : 'No meals';
}

function getMealIcon(plan: PlanData) {
  if (plan.includesBreakfast && plan.includesLunch && plan.includesDinner)
    return <Utensils className="w-5 h-5" />;
  if (plan.includesBreakfast && plan.includesDinner)
    return <UtensilsCrossed className="w-5 h-5" />;
  if (plan.includesBreakfast)
    return <Coffee className="w-5 h-5" />;
  if (plan.includesDinner)
    return <Moon className="w-5 h-5" />;
  if (plan.includesLunch)
    return <Sun className="w-5 h-5" />;
  return <UtensilsCrossed className="w-5 h-5" />;
}

export default function AddResidentForm({ plans, rooms, settings }: AddResidentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [vacantBeds, setVacantBeds] = useState<BedData[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [selectedFoodPlanId, setSelectedFoodPlanId] = useState<string>('');
  const [wantsFood, setWantsFood] = useState(false);
  const [selectedSharing, setSelectedSharing] = useState<'double' | 'triple' | ''>('');
  const [roomLayoutData, setRoomLayoutData] = useState<{
    roomNumber: string;
    sharingType: 'double' | 'triple';
    beds: Array<{ _id: string; bedLabel: string; status: 'vacant' | 'occupied'; residentName?: string }>;
    currentElectricityBill?: number;
  } | null>(null);

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
  const selectedPlanId = watch('currentPlan');
  const depositReceived = watch('depositReceived');
  const depositMethod = watch('depositMethod');
  const recordFirstPayment = watch('recordFirstPayment');
  const firstPaymentMethod = watch('firstPaymentMethod');
  const joiningDate = watch('joiningDate');

  // Get selected room's sharing type for filtering plans
  const selectedRoomData = rooms.find((r) => r._id === selectedRoom);
  const roomSharingType = selectedRoomData?.sharingType ?? '';

  // Separate room plans and food plans
  // Room plans filter: must match the selected room's sharing type exactly (or sharingType=none for food_only)
  const roomPlans = plans.filter(
    (p) => (p.type === 'room' || p.type === 'room_food') &&
    (!selectedSharing || p.sharingType === selectedSharing)
  );

  const foodPlans = plans.filter((p) => p.type === 'food_only');

  // Selected plan objects
  const selectedRoomPlan = plans.find((p) => p._id === selectedPlanId);
  const selectedFoodPlan = foodPlans.find((p) => p._id === selectedFoodPlanId);

  // Total monthly amount
  const roomPlanPrice = selectedRoomPlan?.price ?? 0;
  const foodPlanPrice = wantsFood && selectedFoodPlan ? selectedFoodPlan.price : 0;
  const totalMonthlyPrice = roomPlanPrice + foodPlanPrice;

  // The plan we actually submit is: if wantsFood and food plan selected → use food plan id as addon
  // For now, we submit the room plan. Food plan is additive — both are stored.
  // Business decision: store only room plan as currentPlan; food plan stored separately.
  // For simplicity in this form: combine into a note on room plan selection.

  // Prorated first month rent
  let firstMonthRent = totalMonthlyPrice;
  if (joiningDate && settings?.prorateFirstMonth && settings?.billingMode === 'calendar') {
    const d = new Date(joiningDate);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const daysRemaining = daysInMonth - day + 1;
    firstMonthRent = Math.round((totalMonthlyPrice * daysRemaining) / daysInMonth);
  }

  // Load vacant beds when room changes
  useEffect(() => {
    if (!selectedRoom) {
      setVacantBeds([]);
      setRoomLayoutData(null);
      return;
    }
    setLoadingBeds(true);
    setValue('bed', '');
    // Clear plan when room changes (sharing type may differ)
    setValue('currentPlan', '');
    setSelectedFoodPlanId('');
    setWantsFood(false);
    startTransition(async () => {
      const [beds, layout] = await Promise.all([
        getVacantBedsByRoom(selectedRoom),
        getRoomLayoutWithBills(selectedRoom),
      ]);
      setVacantBeds(beds); // Already plain objects from server action
      setRoomLayoutData(layout);
      setLoadingBeds(false);
    });
  }, [selectedRoom, setValue]);

  const stepFields: Record<number, (keyof ResidentFormData)[]> = {
    0: ['name', 'mobile'],
    1: ['room', 'bed', 'currentPlan', 'joiningDate'],
    2: [],
    3: ['depositAmount'],
  };

  async function handleNext() {
    const fields = stepFields[currentStep];
    const valid = await trigger(fields);
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  const onSubmit = async (data: ResidentFormData) => {
    setSubmitError('');
    // Attach food plan info to notes if selected
    const submissionData = {
      ...data,
      notes: [
        data.notes,
        wantsFood && selectedFoodPlan
          ? `Food Plan: ${selectedFoodPlan.name} (₹${selectedFoodPlan.price}/month)`
          : '',
      ]
        .filter(Boolean)
        .join(' | '),
    };
    startTransition(async () => {
      const result = await checkInResident(submissionData);
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
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                    i < currentStep
                      ? 'bg-[#007AFF] text-white'
                      : i === currentStep
                      ? 'bg-[#007AFF] text-white ring-4 ring-[#007AFF]/20'
                      : 'bg-[#F2F2F7] text-[#8E8E93]'
                  )}
                >
                  {i < currentStep ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1.5 font-medium whitespace-nowrap hidden sm:block',
                    i === currentStep ? 'text-[#007AFF]' : i < currentStep ? 'text-[#1C1C1E]' : 'text-[#8E8E93]'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mb-4 transition-colors',
                    i < currentStep ? 'bg-[#007AFF]' : 'bg-[#E5E5EA]'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              {(() => { const Icon = STEPS[currentStep].icon; return <Icon className="w-4 h-4 text-[#007AFF]" />; })()}
              {STEPS[currentStep].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-5">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {submitError}
              </div>
            )}

            {/* ── Step 0: Personal Info ── */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name <span className="text-red-500">*</span></Label>
                    <Input className="rounded-xl h-10" placeholder="e.g. Rahul Sharma" {...register('name')} />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mobile Number <span className="text-red-500">*</span></Label>
                    <Input className="rounded-xl h-10" placeholder="10-digit mobile" {...register('mobile')} />
                    {errors.mobile && <p className="text-red-500 text-xs">{errors.mobile.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Alternate Mobile <span className="text-gray-400 text-xs">(optional)</span></Label>
                    <Input className="rounded-xl h-10" placeholder="Optional" {...register('alternateMobile')} />
                    {errors.alternateMobile && <p className="text-red-500 text-xs">{errors.alternateMobile.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Guardian Name</Label>
                    <Input className="rounded-xl h-10" placeholder="Parent or guardian" {...register('guardianName')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Guardian Mobile</Label>
                    <Input className="rounded-xl h-10" placeholder="10-digit mobile" {...register('guardianMobile')} />
                    {errors.guardianMobile && <p className="text-red-500 text-xs">{errors.guardianMobile.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes <span className="text-gray-400 text-xs">(optional)</span></Label>
                  <Input className="rounded-xl h-10" placeholder="Any additional notes" {...register('notes')} />
                </div>
              </div>
            )}

            {/* ── Step 1: Stay & Plan ── */}
            {currentStep === 1 && (
              <div className="space-y-5">
                {/* Room + Bed row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Room <span className="text-red-500">*</span></Label>
                    <Select value={selectedRoom || ''} onValueChange={(v) => setValue('room', v)}>
                      <SelectTrigger className="rounded-xl h-10">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((r) => (
                          <SelectItem key={r._id} value={r._id}>
                            Room {r.roomNumber}
                            <span className="ml-1 text-gray-400 text-xs capitalize">({r.sharingType})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.room && <p className="text-red-500 text-xs">{errors.room.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bed <span className="text-red-500">*</span></Label>
                    <Select
                      value={watch('bed') || ''}
                      onValueChange={(v) => setValue('bed', v)}
                      disabled={!selectedRoom || loadingBeds}
                    >
                      <SelectTrigger className="rounded-xl h-10">
                        <SelectValue placeholder={loadingBeds ? 'Loading…' : !selectedRoom ? 'Select room first' : 'Select bed'} />
                      </SelectTrigger>
                      <SelectContent>
                        {vacantBeds.length === 0 && !loadingBeds && (
                          <SelectItem value="none" disabled>No vacant beds</SelectItem>
                        )}
                        {vacantBeds.map((b) => (
                          <SelectItem key={b._id} value={b._id}>
                            Bed {b.bedLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bed && <p className="text-red-500 text-xs">{errors.bed.message}</p>}
                  </div>
                </div>

                {/* Room Layout Preview */}
                {selectedRoom && roomLayoutData && !loadingBeds && (
                  <div className="mt-1">
                    <RoomLayoutPreview
                      roomNumber={roomLayoutData.roomNumber}
                      sharingType={roomLayoutData.sharingType}
                      beds={roomLayoutData.beds}
                      currentElectricityBill={roomLayoutData.currentElectricityBill}
                    />
                  </div>
                )}

                {/* Joining date */}
                <div className="space-y-1.5">
                  <Label>Joining Date <span className="text-red-500">*</span></Label>
                  <Input type="date" className="rounded-xl h-10" {...register('joiningDate')} />
                  {errors.joiningDate && <p className="text-red-500 text-xs">{errors.joiningDate.message}</p>}
                </div>

                {/* ── Room Plan (mandatory) ── */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-green-600" />
                    <Label className="text-sm font-semibold text-gray-800">
                      Room Plan <span className="text-red-500">*</span>
                    </Label>
                    <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50 ml-auto">
                      Mandatory
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">Room charge is always included.</p>

                  {!selectedRoom && (
                    <div className="p-3 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 text-center">
                      Select a room above to see available plans
                    </div>
                  )}

                  {selectedRoom && roomPlans.length === 0 && (
                    <div className="p-3 rounded-xl border border-dashed border-amber-200 bg-amber-50 text-sm text-amber-700 text-center">
                      No room plans found for {roomSharingType} sharing
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2.5">
                    {roomPlans.map((plan) => {
                      const isSelected = selectedPlanId === plan._id;
                      return (
                        <button
                          key={plan._id}
                          type="button"
                          onClick={() => setValue('currentPlan', plan._id)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3',
                            isSelected
                              ? 'border-[#007AFF] bg-[#007AFF]/5'
                              : 'border-[#E5E5EA] bg-white hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                              isSelected ? 'bg-[#007AFF] text-white' : 'bg-gray-100 text-gray-500'
                            )}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={cn('font-medium text-sm', isSelected ? 'text-[#007AFF]' : 'text-gray-800')}>
                                {plan.name}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {plan.sharingType !== 'none' ? `${plan.sharingType} sharing` : 'Any sharing'}
                                {plan.type === 'room_food' && ' · All meals included'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 flex items-center gap-2">
                            <span className={cn('font-semibold text-sm', isSelected ? 'text-[#007AFF]' : 'text-gray-700')}>
                              ₹{plan.price.toLocaleString('en-IN')}
                              <span className="text-xs font-normal text-gray-400">/mo</span>
                            </span>
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                              isSelected ? 'border-[#007AFF] bg-[#007AFF]' : 'border-gray-300'
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.currentPlan && <p className="text-red-500 text-xs">{errors.currentPlan.message}</p>}
                </div>

                {/* ── Food Plan (optional) ── */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-orange-500" />
                    <Label className="text-sm font-semibold text-gray-800">Food Plan</Label>
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50 ml-auto">
                      Optional
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">Add meals if the resident wants food service.</p>

                  {/* Toggle */}
                  <div
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer',
                      wantsFood
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-dashed border-[#E5E5EA] text-[#8E8E93] hover:border-orange-300 hover:bg-orange-50/40'
                    )}
                    onClick={() => {
                      setWantsFood((prev) => {
                        if (prev) setSelectedFoodPlanId('');
                        return !prev;
                      });
                    }}
                  >
                    <span className="flex items-center gap-2 font-medium text-sm">
                      <UtensilsCrossed className="w-4 h-4" />
                      {wantsFood ? 'Food plan selected — tap to remove' : 'Add food plan for this resident'}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ToggleSwitch
                        checked={wantsFood}
                        onChange={(v) => {
                          setWantsFood(v);
                          if (!v) setSelectedFoodPlanId('');
                        }}
                        color="orange"
                      />
                    </div>
                  </div>

                  {/* Food plan cards */}
                  {wantsFood && (
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {foodPlans.map((plan) => {
                        const isSelected = selectedFoodPlanId === plan._id;
                        return (
                          <button
                            key={plan._id}
                            type="button"
                            onClick={() => setSelectedFoodPlanId(plan._id)}
                            className={cn(
                              'w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3',
                              isSelected
                                ? 'border-orange-400 bg-orange-50'
                                : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                isSelected ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'
                              )}>
                                {getMealIcon(plan)}
                              </div>
                              <div>
                                <p className={cn('font-medium text-sm', isSelected ? 'text-orange-800' : 'text-gray-800')}>
                                  {plan.name}
                                </p>
                                <p className="text-xs text-gray-500">{getMealLabel(plan)}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex items-center gap-2">
                              <span className={cn('font-semibold text-sm', isSelected ? 'text-orange-700' : 'text-gray-700')}>
                                ₹{plan.price.toLocaleString('en-IN')}
                                <span className="text-xs font-normal text-gray-400">/mo</span>
                              </span>
                              <div className={cn(
                                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                isSelected ? 'border-orange-400 bg-orange-400' : 'border-gray-300'
                              )}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Price Summary ── */}
                {selectedPlanId && (
                  <div className="rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Room</span>
                      <span className="font-medium">₹{roomPlanPrice.toLocaleString('en-IN')}</span>
                    </div>
                    {wantsFood && selectedFoodPlan && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Food ({selectedFoodPlan.name})</span>
                        <span className="font-medium">₹{foodPlanPrice.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {wantsFood && !selectedFoodPlan && (
                      <div className="flex justify-between text-sm text-amber-600">
                        <span>Food plan</span>
                        <span>Select a food plan above</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-semibold text-gray-800">Total / month</span>
                      <span className="font-bold text-[#007AFF] text-base">
                        ₹{totalMonthlyPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: ID Proof ── */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>ID Proof Type</Label>
                  <Select value={watch('idProofType') || ''} onValueChange={(v) => setValue('idProofType', v)}>
                    <SelectTrigger className="rounded-xl h-10">
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
                <div className="space-y-1.5">
                  <Label>ID Proof Number</Label>
                  <Input className="rounded-xl h-10" placeholder="Enter ID number" {...register('idProofNumber')} />
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex gap-3 items-start">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>File upload feature coming soon. You can record the ID number for now.</span>
                </div>
              </div>
            )}

            {/* ── Step 3: Deposit & First Rent ── */}
            {currentStep === 3 && (
              <div className="space-y-5">

                {/* Security Deposit */}
                <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">Security Deposit</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Deposit Amount (₹)</Label>
                    <Input type="number" min={0} className="rounded-xl h-10" {...register('depositAmount', { valueAsNumber: true })} />
                    {errors.depositAmount && <p className="text-red-500 text-xs">{errors.depositAmount.message}</p>}
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Deposit received now?</p>
                      <p className="text-xs text-gray-400">Record the receipt immediately</p>
                    </div>
                    <ToggleSwitch
                      checked={depositReceived}
                      onChange={(v) => setValue('depositReceived', v)}
                      color="green"
                    />
                  </div>

                  {depositReceived && (
                    <div className="space-y-3 pl-4 border-l-2 border-green-200">
                      <div className="space-y-1.5">
                        <Label>Payment Method</Label>
                        <Select value={depositMethod || ''} onValueChange={(v) => setValue('depositMethod', v as 'cash' | 'upi' | 'bank')}>
                          <SelectTrigger className="rounded-xl h-10">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash"><span className="flex items-center gap-2"><Banknote className="w-3.5 h-3.5 inline" /> Cash</span></SelectItem>
                            <SelectItem value="upi"><span className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 inline" /> UPI</span></SelectItem>
                            <SelectItem value="bank"><span className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5 inline" /> Bank Transfer</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Transaction Reference <span className="text-gray-400 text-xs">(optional)</span></Label>
                        <Input className="rounded-xl h-10" placeholder="UPI / NEFT reference" {...register('depositTransactionRef')} />
                      </div>
                    </div>
                  )}
                </div>

                {/* First Month Rent */}
                <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Home className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">First Month Rent</p>
                  </div>

                  {selectedPlanId ? (
                    <div className="rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] p-4 space-y-2.5 text-sm">
                      {/* Room Plan */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#8E8E93]">Room ({selectedRoomPlan?.name})</span>
                        <span className="font-medium text-[#1C1C1E]">₹{roomPlanPrice.toLocaleString('en-IN')}/mo</span>
                      </div>

                      {/* Food Plan */}
                      {wantsFood && selectedFoodPlan && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#8E8E93]">Food ({selectedFoodPlan.name})</span>
                          <span className="font-medium text-[#1C1C1E]">₹{foodPlanPrice.toLocaleString('en-IN')}/mo</span>
                        </div>
                      )}

                      {/* Monthly Total */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
                        <span className="text-[#1C1C1E] font-medium">Monthly rent</span>
                        <span className="font-semibold text-[#1C1C1E]">₹{totalMonthlyPrice.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Prorated First Month */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[#8E8E93]">First month </span>
                          {settings?.prorateFirstMonth && firstMonthRent !== totalMonthlyPrice && (
                            <span className="text-[#8E8E93] text-xs">
                              ({(() => {
                                const d = new Date(joiningDate);
                                const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
                                const daysRemaining = daysInMonth - d.getUTCDate() + 1;
                                return `${daysRemaining} days`;
                              })()})
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-[#1C1C1E]">₹{firstMonthRent.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Deposit */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
                        <span className="text-[#007AFF] font-medium">Security deposit</span>
                        <span className="font-semibold text-[#007AFF]">₹{(watch('depositAmount') || depositDefault).toLocaleString('en-IN')}</span>
                      </div>

                      {/* TOTAL DUE ON JOINING */}
                      <div className="flex items-center justify-between pt-2.5 border-t-2 border-[#1C1C1E]">
                        <span className="text-[#1C1C1E] font-bold text-base">Total due on joining</span>
                        <span className="font-bold text-[#1C1C1E] text-lg">
                          ₹{(firstMonthRent + (watch('depositAmount') || depositDefault)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#F2F2F7] border border-[#E5E5EA] rounded-xl text-sm text-[#8E8E93]">
                      Select a plan in Step 2 to see the rent preview.
                    </div>
                  )}

                  {selectedPlanId && (
                    <p className="text-xs text-[#8E8E93] mt-2 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        One-time payment. From next month onwards, only ₹{totalMonthlyPrice.toLocaleString('en-IN')}/month will be charged.
                        {settings?.prorateFirstMonth && firstMonthRent !== totalMonthlyPrice &&
                          ' First month is prorated based on joining date.'}
                      </span>
                    </p>
                  )}

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Record first payment now?</p>
                      <p className="text-xs text-gray-400">Mark rent as paid immediately</p>
                    </div>
                    <ToggleSwitch
                      checked={recordFirstPayment}
                      onChange={(v) => {
                        setValue('recordFirstPayment', v);
                        if (v) setValue('firstPaymentAmount', firstMonthRent);
                      }}
                      color="green"
                    />
                  </div>

                  {recordFirstPayment && (
                    <div className="space-y-3 pl-4 border-l-2 border-green-200">
                      <div className="space-y-1.5">
                        <Label>Amount (₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          defaultValue={firstMonthRent}
                          className="rounded-xl h-10"
                          {...register('firstPaymentAmount', { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Payment Method</Label>
                        <Select value={firstPaymentMethod || ''} onValueChange={(v) => setValue('firstPaymentMethod', v as 'cash' | 'upi' | 'bank')}>
                          <SelectTrigger className="rounded-xl h-10">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash"><span className="flex items-center gap-2"><Banknote className="w-3.5 h-3.5 inline" /> Cash</span></SelectItem>
                            <SelectItem value="upi"><span className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 inline" /> UPI</span></SelectItem>
                            <SelectItem value="bank"><span className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5 inline" /> Bank Transfer</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-5">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl px-6 h-10"
            onClick={() => {
              if (currentStep === 0) router.push('/residents');
              else setCurrentStep((s) => s - 1);
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              className="bg-[#007AFF] hover:bg-[#0071EB] text-white rounded-xl px-6 h-10"
              onClick={handleNext}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-[#007AFF] hover:bg-[#0071EB] text-white rounded-xl px-6 h-10"
              disabled={isPending}
            >
              {isPending ? 'Checking in…' : 'Complete Check-in'}
              {!isPending && <Check className="w-4 h-4 ml-1" />}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
