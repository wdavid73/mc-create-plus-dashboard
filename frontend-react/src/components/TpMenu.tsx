import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Select } from "@/components/Select"
import { useTeleport } from "@/hooks/useControlActions"

type TpMenuProps = {
  players: string[]
}

export function TpMenu({ players }: TpMenuProps) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const teleport = useTeleport()

  const enoughPlayers = players.length >= 2
  const sameSelection = !!from && !!to && from === to
  const canSubmit = enoughPlayers && !!from && !!to && !sameSelection

  function handleSubmit() {
    if (!canSubmit) return
    teleport.mutate(
      { from, to },
      {
        onSuccess: () => {
          setFrom("")
          setTo("")
        },
      },
    )
  }

  const hint = !enoughPlayers
    ? "Conéctate con al menos 2 jugadores en línea para usar el TP."
    : sameSelection
      ? "Elige dos jugadores distintos."
      : teleport.isError
        ? "No se pudo teletransportar. Intenta de nuevo."
        : ""

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          wrapperClassName="min-w-[140px]"
          value={from}
          disabled={!enoughPlayers}
          onChange={(e) => setFrom(e.target.value)}
        >
          <option value="">Jugador</option>
          {players.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <ArrowRight className="h-[18px] w-[18px] shrink-0 text-muted-text" />
        <Select
          wrapperClassName="min-w-[140px]"
          value={to}
          disabled={!enoughPlayers}
          onChange={(e) => setTo(e.target.value)}
        >
          <option value="">hacia jugador</option>
          {players.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <button
          type="button"
          disabled={!canSubmit || teleport.isPending}
          onClick={handleSubmit}
          className="rounded-md bg-brand px-4 py-2 text-[13px] font-bold text-[#1a1304] disabled:opacity-40"
        >
          Teletransportar
        </button>
      </div>
      {hint && <div className="mt-2 text-xs text-muted-text">{hint}</div>}
    </div>
  )
}
