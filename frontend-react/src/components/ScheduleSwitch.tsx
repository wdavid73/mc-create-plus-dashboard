import { useState } from "react"
import { cn } from "@/lib/utils"
import { useControlAction } from "@/hooks/useControlActions"

export function ScheduleSwitch() {
  const [on, setOn] = useState(false)
  const { mutate, isPending } = useControlAction()

  function toggle() {
    const turningOn = !on
    setOn(turningOn)
    mutate(turningOn ? "schedule-on" : "schedule-off", {
      onError: () => setOn(!turningOn),
    })
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={isPending}
        onClick={toggle}
        className={cn(
          "relative h-[22px] w-10 shrink-0 rounded-full border transition-colors",
          on ? "border-brand bg-brand-dim" : "border-panel-border bg-panel-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform",
            on ? "translate-x-[18px] bg-brand-bright" : "bg-muted-text",
          )}
        />
      </button>
      <span className="text-[13px] text-text">
        Horario automático
        <span className="block text-xs text-muted-text">
          {on ? "Activado (8am - medianoche)" : "Desactivado"}
        </span>
      </span>
    </div>
  )
}
