"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface ToggleSwitchProps {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  size?: "sm" | "md"
  color?: "blue" | "green" | "orange"
}

const onColorMap: Record<NonNullable<ToggleSwitchProps["color"]>, string> = {
  blue: "bg-[#007AFF]",
  green: "bg-[#34C759]",
  orange: "bg-[#FF9500]",
}

const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  size = "md",
  color = "blue",
}: ToggleSwitchProps) => {
  const trackSize =
    size === "md" ? "h-[31px] w-[51px]" : "h-[22px] w-[38px]"
  const knobSize = size === "md" ? "h-[27px] w-[27px]" : "h-[18px] w-[18px]"
  const knobTranslate = checked
    ? size === "md"
      ? "translate-x-[22px]"
      : "translate-x-[18px]"
    : "translate-x-[2px]"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50",
        trackSize,
        checked ? onColorMap[color] : "bg-[#E5E5EA]"
      )}
    >
      <span
        className={cn(
          "inline-block transform rounded-full bg-white shadow-sm transition-all duration-200",
          knobSize,
          knobTranslate
        )}
      />
    </button>
  )
}

ToggleSwitch.displayName = "ToggleSwitch"

export { ToggleSwitch }
export default ToggleSwitch
