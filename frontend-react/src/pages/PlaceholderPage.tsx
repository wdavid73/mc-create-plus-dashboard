import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/Card"

type PlaceholderPageProps = {
  icon: LucideIcon
  title: string
  description: string
  note?: string
}

export function PlaceholderPage({ icon: Icon, title, description, note }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-4">
      {note && (
        <Card>
          <p className="text-center text-xs text-muted-text">{note}</p>
        </Card>
      )}
      <Card className="flex flex-row items-start gap-4 p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-panel-2 text-brand-bright">
          <Icon className="h-[21px] w-[21px]" />
        </span>
        <div className="flex flex-col gap-1.5 pt-1">
          <h2 className="m-0 text-base font-normal text-text">{title}</h2>
          <p className="m-0 max-w-[460px] text-[13px] text-muted-text">{description}</p>
        </div>
      </Card>
    </div>
  )
}
