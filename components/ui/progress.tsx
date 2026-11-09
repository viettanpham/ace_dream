"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    const validMax = max && max > 0 ? max : 100
    const clampedValue = Math.min(Math.max(value || 0, 0), validMax)
    const percentage = Math.round((clampedValue / validMax) * 100)

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={validMax}
        aria-valuenow={clampedValue}
        data-slot="progress"
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-slate-800/80 border border-slate-700/50",
          className
        )}
        {...props}
      >
        <div
          data-slot="progress-indicator"
          className={cn(
            "h-full w-full flex-1 bg-cyan-400 transition-all duration-300 ease-out",
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
