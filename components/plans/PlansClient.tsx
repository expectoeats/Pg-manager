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
import { Plus, ListCheck, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-500 mt-1">{plans.length} plan{plans.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <ListCheck className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No plans yet</h3>
          <p className="text-sm text-gray-500 mb-4">Add your first plan to get started.</p>
          <Button onClick={openAddDialog} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Add Plan
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Sharing</TableHead>
                    <TableHead className="font-semibold text-gray-700">Meals</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Price</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                          {TYPE_LABELS[plan.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 capitalize">
                        {plan.sharingType === 'none' ? '—' : plan.sharingType}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {plan.includesBreakfast && (
                            <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                              🍳 B
                            </span>
                          )}
                          {plan.includesLunch && (
                            <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">
                              🍽 L
                            </span>
                          )}
                          {plan.includesDinner && (
                            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                              🌙 D
                            </span>
                          )}
                          {!plan.includesBreakfast && !plan.includesLunch && !plan.includesDinner && (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            plan.isActive
                              ? 'text-green-600 border-green-200 bg-green-50'
                              : 'text-gray-500 border-gray-200 bg-gray-50'
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
                            className="h-7 px-2 text-xs rounded-lg"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              'h-7 px-2 text-xs rounded-lg',
                              plan.isActive
                                ? 'text-red-600 border-red-200 hover:bg-red-50'
                                : 'text-green-600 border-green-200 hover:bg-green-50'
                            )}
                            onClick={() => handleToggleActive(plan._id)}
                            disabled={isPending}
                          >
                            {plan.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
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
              <div key={plan._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
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
                    <p className="font-bold text-gray-900">₹{plan.price.toLocaleString('en-IN')}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs mt-1',
                        plan.isActive ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500'
                      )}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {plan.includesBreakfast && <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full">🍳 Breakfast</span>}
                  {plan.includesLunch && <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">🍽 Lunch</span>}
                  {plan.includesDinner && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full">🌙 Dinner</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs rounded-lg" onClick={() => openEditDialog(plan)}>
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('flex-1 text-xs rounded-lg', plan.isActive ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200')}
                    onClick={() => handleToggleActive(plan._id)}
                    disabled={isPending}
                  >
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input className="rounded-lg" placeholder="e.g. Triple Sharing Room Only" {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={planType}
                onValueChange={(v) => setValue('type', v as 'room' | 'room_food' | 'food_only')}
              >
                <SelectTrigger className="rounded-lg">
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
                  <SelectTrigger className="rounded-lg">
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
              <Input type="number" min={0} className="rounded-lg" {...register('price')} />
              {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
            </div>

            {(planType === 'room_food' || planType === 'food_only') && (
              <div className="space-y-3">
                <Label>Meals Included</Label>
                <div className="space-y-2">
                  {[
                    { key: 'includesBreakfast' as const, label: '🍳 Breakfast', value: includesBreakfast },
                    { key: 'includesLunch' as const, label: '🍽 Lunch', value: includesLunch },
                    { key: 'includesDinner' as const, label: '🌙 Dinner', value: includesDinner },
                  ].map(({ key, label, value }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setValue(key, e.target.checked)}
                        className="accent-green-500 w-4 h-4"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedPlan && (
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <button
                  type="button"
                  onClick={() => setValue('isActive', !isActive)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative',
                    isActive ? 'bg-green-500' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      isActive ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-lg" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                disabled={isPending}
              >
                {isPending ? 'Saving...' : selectedPlan ? 'Update Plan' : 'Add Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
