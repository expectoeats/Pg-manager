import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[#E5E5EA] bg-[#FBFBFD] px-3 py-2 text-[15px] text-[#1C1C1E] tracking-[-0.016em] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#8E8E93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-0 focus-visible:border-[#007AFF] focus-visible:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
