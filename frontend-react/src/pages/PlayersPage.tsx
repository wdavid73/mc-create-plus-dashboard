import { Users } from "lucide-react"
import { Card, CardHeading } from "@/components/Card"
import { PlayersList } from "@/components/PlayersList"
import { usePlayers } from "@/hooks/usePlayers"

export function PlayersPage() {
  const { data } = usePlayers()
  const players = data?.players ?? []
  const online = data?.online ?? 0
  const max = data?.max ?? 0
  const emptySlots = Math.max(0, max - online)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeading icon={Users}>
          Jugadores conectados
          <span className="ml-auto text-xs font-medium text-muted-text">
            {online} / {max}
          </span>
        </CardHeading>
        <PlayersList players={players} showActions />
        {emptySlots > 0 && (
          <p className="mt-2 text-[12.5px] text-muted-text">{emptySlots} plazas libres</p>
        )}
      </Card>

      <Card>
        <p className="m-0 text-center text-xs text-muted-text">
          Usa el selector de la página Overview para teletransportar — esta vista es solo de consulta del roster.
        </p>
      </Card>

      <div className="rounded-lg border border-panel-border bg-panel-2 px-[18px] py-4">
        <span className="mb-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-panel text-brand-bright">
          <Users className="h-[17px] w-[17px]" />
        </span>
        <div className="mb-1 text-sm font-semibold text-text">
          Whitelist
          <span className="mt-0.5 block text-[11px] font-normal text-[#7d8694]">Próximamente</span>
        </div>
        <p className="m-0 text-[12.5px] text-muted-text">
          Agregar o quitar jugadores de la whitelist desde el panel.
        </p>
      </div>
    </div>
  )
}
