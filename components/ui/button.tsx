import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[15px] font-medium ring-offset-background transition-all duration-200 cubic-bezier(0.4,0,0.2,1) hover:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#007AFF] text-white hover:shadow-[0_2px_8px_rgba(0,122,255,0.15)]",
        destructive: "bg-[#FF3B30] text-white hover:shadow-[0_2px_8px_rgba(255,59,48,0.15)]",
        outline:
          "border border-[#E5E5EA] bg-white text-[#1C1C1E] hover:bg-[#F2F2F7]",
        secondary: "bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]",
        ghost: "text-[#007AFF] hover:bg-[#F2F2F7]",
        link: "text-[#007AFF] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4",
        lg: "h-12 px-7",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
