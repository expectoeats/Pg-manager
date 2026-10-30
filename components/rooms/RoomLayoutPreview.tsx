'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Bed {
  _id: string
  bedLabel: string
  status: 'vacant' | 'occupied'
  residentName?: string
}

interface RoomLayoutPreviewProps {
  roomNumber: string
  sharingType: 'double' | 'triple'
  beds: Bed[]
  currentElectricityBill?: number
}

export function RoomLayoutPreview({ roomNumber, sharingType, beds, currentElectricityBill }: RoomLayoutPreviewProps) {
  const gridCols = sharingType === 'double' ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <Card className="rounded-2xl border-[#E5E5EA]">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-[15px] font-semibold text-[#1C1C1E] flex items-center justify-between">
          <span>Room {roomNumber} Layout</span>
          <Badge variant="outline" className="text-xs capitalize bg-[#007AFF]/10 text-[#007AFF] border-transparent">
            {sharingType}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        <div className={cn('grid gap-2', gridCols)}>
          {beds.map((bed) => (
            <div
              key={bed._id}
              className={cn(
                'rounded-xl p-3 border-2 transition-all',
                bed.status === 'vacant'
                  ? 'border-[#34C759] bg-[#34C759]/5'
                  : 'border-[#FF3B30] bg-[#FF3B30]/5'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm text-[#1C1C1E]">Bed {bed.bedLabel}</span>
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  bed.status === 'vacant' ? 'bg-[#34C759]' : 'bg-[#FF3B30]'
                )} />
              </div>
              {bed.status === 'occupied' && bed.residentName ? (
                <div className="flex items-center gap-1.5 text-xs text-[#8E8E93]">
                  <User className="w-3 h-3" />
                  <span className="truncate">{bed.residentName}</span>
                </div>
              ) : (
                <span className="text-xs text-[#34C759] font-medium">Available</span>
              )}
            </div>
          ))}
        </div>

        {currentElectricityBill !== undefined && currentElectricityBill > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FF9500]/10 border border-[#FF9500]/20">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FF9500]" />
              <span className="text-sm text-[#FF9500] font-medium">Current month bill</span>
            </div>
            <span className="font-semibold text-[#FF9500]">
              ₹{currentElectricityBill.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
