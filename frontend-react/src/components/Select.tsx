import type { ComponentProps } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type SelectProps = ComponentProps<"select"> & { wrapperClassName?: string }

export function Select({ className, wrapperClassName, ...props }: SelectProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        className={cn(
          "w-full cursor-pointer appearance-none rounded-md border border-panel-border bg-[#0b0e14] py-2 pl-3 pr-8 text-[13px] text-text disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-text" />
    </div>
  )
}
