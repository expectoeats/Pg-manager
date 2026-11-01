'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { planSchema, type PlanFormData } from '@/lib/validators/plan';
import { createPlan, updatePlan, togglePlanActive } from '@/lib/services/plans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Plus, ListCheck, Pencil, Coffee, Sun, Moon, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToggleSwitch } from '@/components/ui/toggle-switch';

interface PlanData {
  _id: string;
  name: string;
  type: 'room' | 'room_food' | 'food_only';
  sharingType: 'double' | 'triple' | 'none';
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  price: number;
  isActive: boolean;
}

interface PlansClientProps {
  plans: PlanData[];
}

const TYPE_LABELS: Record<string, string> = {
  room: 'Room Only',
  room_food: 'Room + Food',
  food_only: 'Food Only',
};

export default function PlansClient({ plans }: PlansClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      type: 'room',
      sharingType: 'none',
      includesBreakfast: false,
      includesLunch: false,
      includesDinner: false,
      isActive: true,
    },
  });

  const planType = watch('type');
  const includesBreakfast = watch('includesBreakfast');
  const includesLunch = watch('includesLunch');
  const includesDinner = watch('includesDinner');
  const isActive = watch('isActive');
  const sharingType = watch('sharingType');

  function openAddDialog() {
    setSelectedPlan(null);
    reset({
      name: '',
      type: 'room',
      sharingType: 'none',
      includesBreakfast: false,
      includesLunch: false,
      includesDinner: false,
      price: 0,
      isActive: true,
    });
    setError('');
    setDialogOpen(true);
  }

  function openEditDialog(plan: PlanData) {
    setSelectedPlan(plan);
    reset({
      name: plan.name,
      type: plan.type,
      sharingType: plan.sharingType,
      includesBreakfast: plan.includesBreakfast,
      includesLunch: plan.includesLunch,
      includesDinner: plan.includesDinner,
      price: plan.price,
      isActive: plan.isActive,
    });
    setError('');
    setDialogOpen(true);
  }

  const onSubmit = async (data: PlanFormData) => {
    setError('');
    startTransition(async () => {
      let result;
      if (selectedPlan) {
        result = await updatePlan(selectedPlan._id, data);
      } else {
        result = await createPlan(data);
      }

      if (result.success) {
        setDialogOpen(false);
        router.refresh();
      } else {
        setError(result.error || 'Operation failed');
      }
    });
  };

  const handleToggleActive = (planId: string) => {
    startTransition(async () => {
      const result = await togglePlanActive(planId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to toggle plan status');
      }
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-[22px] font-semibold text-[#1C1C1E] tracking-tight">Plans</h1>
          <p className="text-xs sm:text-sm text-[#8E8E93] mt-0.5">{plans.length} plan{plans.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="h-9 sm:h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" strokeWidth={2} />
          Add Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#F2F2F7] rounded-2xl flex items-center justify-center mb-4">
            <ListCheck className="w-8 h-8 text-[#8E8E93]" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium text-[#1C1C1E] mb-2">No plans yet</h3>
          <p className="text-sm text-[#8E8E93] mb-4">Add your first plan to get started.</p>
          <Button onClick={openAddDialog} className="h-11 rounded-xl">
            <Plus className="w-5 h-5 mr-2" strokeWidth={2} /> Add Plan
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#E5E5EA]">
                    <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Name</TableHead>
                    <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Type</TableHead>
                    <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Sharing</TableHead>
                    <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Meals</TableHead>
                    <TableHead className="text-right text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Price</TableHead>
                    <TableHead className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-right text-[#8E8E93] text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan._id} className="border-b border-[#E5E5EA] hover:bg-[#F9F9FB] transition-colors">
                      <TableCell className="font-medium text-[#1C1C1E]">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[#007AFF] border-transparent bg-[#007AFF]/10">
                          {TYPE_LABELS[plan.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[#8E8E93] capitalize">
                        {plan.sharingType === 'none' ? '—' : plan.sharingType}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {plan.includesBreakfast && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#FF9500] border border-[#FF9500]/20 bg-[#FF9500]/10 px-1.5 py-0.5 rounded-full">
                              <Coffee className="w-5 h-5" strokeWidth={2} /> B
                            </span>
                          )}
                          {plan.includesLunch && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#34C759] border border-[#34C759]/20 bg-[#34C759]/10 px-1.5 py-0.5 rounded-full">
                              <Sun className="w-5 h-5" strokeWidth={2} /> L
                            </span>
                          )}
                          {plan.includesDinner && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#5856D6] border border-[#5856D6]/20 bg-[#5856D6]/10 px-1.5 py-0.5 rounded-full">
                              <Moon className="w-5 h-5" strokeWidth={2} /> D
                            </span>
                          )}
                          {!plan.includesBreakfast && !plan.includesLunch && !plan.includesDinner && (
                            <span className="text-[#8E8E93] text-sm">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#007AFF]">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs border-transparent',
                            plan.isActive
                              ? 'text-[#34C759] bg-[#34C759]/10'
                              : 'text-[#8E8E93] bg-[#8E8E93]/10'
                          )}
                        >
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs rounded-lg"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Pencil className="w-5 h-5 mr-1" strokeWidth={2} />
                            Edit
                          </Button>
                          <ToggleSwitch
                            checked={plan.isActive}
                            onChange={() => handleToggleActive(plan._id)}
                            color="blue"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {plans.map((plan) => (
              <div key={plan._id} className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[#1C1C1E]">{plan.name}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs text-[#007AFF] border-transparent bg-[#007AFF]/10">
                        {TYPE_LABELS[plan.type]}
                      </Badge>
                      {plan.sharingType !== 'none' && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {plan.sharingType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#007AFF]">₹{plan.price.toLocaleString('en-IN')}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs mt-1 border-transparent',
                        plan.isActive ? 'text-[#34C759] bg-[#34C759]/10' : 'text-[#8E8E93] bg-[#8E8E93]/10'
                      )}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {plan.includesBreakfast && <span className="inline-flex items-center gap-1 text-xs text-[#FF9500] border border-[#FF9500]/20 bg-[#FF9500]/10 px-1.5 py-0.5 rounded-full"><Coffee className="w-5 h-5" strokeWidth={2} /> Breakfast</span>}
                  {plan.includesLunch && <span className="inline-flex items-center gap-1 text-xs text-[#34C759] border border-[#34C759]/20 bg-[#34C759]/10 px-1.5 py-0.5 rounded-full"><Sun className="w-5 h-5" strokeWidth={2} /> Lunch</span>}
                  {plan.includesDinner && <span className="inline-flex items-center gap-1 text-xs text-[#5856D6] border border-[#5856D6]/20 bg-[#5856D6]/10 px-1.5 py-0.5 rounded-full"><Moon className="w-5 h-5" strokeWidth={2} /> Dinner</span>}
                </div>
                <div className="flex gap-2 items-center">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-9 rounded-lg" onClick={() => openEditDialog(plan)}>
                    <Pencil className="w-5 h-5 mr-1" strokeWidth={2} /> Edit
                  </Button>
                  <ToggleSwitch
                    checked={plan.isActive}
                    onChange={() => handleToggleActive(plan._id)}
                    color="blue"
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {error && (
              <div className="bg-[#FF3B30]/10 text-[#FF3B30] px-3 py-2 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input placeholder="e.g. Triple Sharing Room Only" {...register('name')} className="h-11 rounded-xl" />
              {errors.name && <p className="text-[#FF3B30] text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={planType}
                onValueChange={(v) => setValue('type', v as 'room' | 'room_food' | 'food_only')}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room">Room Only</SelectItem>
                  <SelectItem value="room_food">Room + Food</SelectItem>
                  <SelectItem value="food_only">Food Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {planType !== 'food_only' && (
              <div className="space-y-2">
                <Label>Sharing Type</Label>
                <Select
                  value={sharingType}
                  onValueChange={(v) => setValue('sharingType', v as 'double' | 'triple' | 'none')}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not applicable</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Price (₹/month)</Label>
              <Input type="number" min={0} {...register('price')} className="h-11 rounded-xl" />
              {errors.price && <p className="text-[#FF3B30] text-xs">{errors.price.message}</p>}
            </div>

            {(planType === 'room_food' || planType === 'food_only') && (
              <div className="space-y-3">
                <Label>Meals Included</Label>
                <div className="space-y-2">
                  {[
                    { key: 'includesBreakfast' as const, label: 'Breakfast', icon: Coffee, value: includesBreakfast },
                    { key: 'includesLunch' as const, label: 'Lunch', icon: Sun, value: includesLunch },
                    { key: 'includesDinner' as const, label: 'Dinner', icon: Moon, value: includesDinner },
                  ].map(({ key, label, icon: Icon, value }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setValue(key, e.target.checked)}
                        className="accent-[#007AFF] w-5 h-5 rounded"
                      />
                      <Icon className="w-5 h-5 text-[#8E8E93]" strokeWidth={2} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedPlan && (
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <ToggleSwitch
                  checked={isActive}
                  onChange={(v) => setValue('isActive', v)}
                  color="blue"
                  size="md"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl"
                isLoading={isPending}
                loadingText={selectedPlan ? 'Updating Plan...' : 'Adding Plan...'}
              >
                {selectedPlan ? 'Update Plan' : 'Add Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
