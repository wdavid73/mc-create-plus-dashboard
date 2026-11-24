import type { ComponentProps, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-panel-border bg-panel p-4 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_20px_36px_-16px_rgba(0,0,0,0.7),0_4px_10px_-2px_rgba(0,0,0,0.45)]",
        className,
      )}
      {...props}
    />
  )
}

type CardHeadingProps = {
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

export function CardHeading({ icon: Icon, children, className }: CardHeadingProps) {
  return (
    <h2 className={cn("mb-3 flex items-center gap-2 text-base font-bold text-text", className)}>
      {Icon && <Icon className="h-[17px] w-[17px] shrink-0 text-muted-text" />}
      {children}
    </h2>
  )
}
