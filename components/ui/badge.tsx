import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-[#007AFF]/10 text-[#007AFF] border-transparent",
        secondary: "bg-[#F2F2F7] text-[#1C1C1E] border-transparent",
        destructive: "bg-[#FF3B30]/10 text-[#FF3B30] border-transparent",
        success: "bg-[#34C759]/10 text-[#34C759] border-transparent",
        warning: "bg-[#FF9500]/10 text-[#FF9500] border-transparent",
        outline: "border border-current bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
