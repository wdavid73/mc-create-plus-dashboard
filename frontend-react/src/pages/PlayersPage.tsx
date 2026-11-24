import { Users } from "lucide-react"
import { Card, CardHeading } from "@/components/Card"
import { PlayerAvatar } from "@/components/PlayerAvatar"
import { MOCK_MAX_PLAYERS, MOCK_PLAYERS } from "@/lib/mockData"

export function PlayersPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeading icon={Users}>
          Jugadores conectados
          <span className="ml-auto text-xs font-medium text-muted-text">
            {MOCK_PLAYERS.length} / {MOCK_MAX_PLAYERS}
          </span>
        </CardHeading>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {MOCK_PLAYERS.map((name, i) => (
            <li key={name} className="flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-[13.5px]">
              <PlayerAvatar index={i} />
              <div className="min-w-0 flex-1">
                <span className="block font-semibold text-text">{name}</span>
                <span className="flex items-center gap-1.5 text-[11.5px] text-muted-text">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-online" />
                  Online
                </span>
              </div>
              <span className="flex items-center gap-1.5 opacity-40">
                <button type="button" disabled title="Próximamente" className="cursor-not-allowed p-1 text-muted-text">
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12.5px] text-muted-text">
          {MOCK_MAX_PLAYERS - MOCK_PLAYERS.length} plazas libres
        </p>
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
