import { Users } from "lucide-react"
import { PlayerAvatar } from "@/components/PlayerAvatar"

type PlayersListProps = {
  players: string[]
  limit?: number
  showActions?: boolean
}

export function PlayersList({ players, limit, showActions }: PlayersListProps) {
  const shown = limit ? players.slice(0, limit) : players

  if (shown.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-[22px] text-center text-[12.5px] text-muted-text">
        <Users className="h-[22px] w-[22px] text-[#4a5468]" />
        <span>No hay jugadores conectados</span>
      </div>
    )
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {shown.map((name, i) => (
        <li key={name} className="flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-[13.5px]">
          <PlayerAvatar index={i} />
          <div className="min-w-0 flex-1">
            <span className="block font-semibold text-text">{name}</span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted-text">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-online" />
              Online
            </span>
          </div>
          {showActions && (
            <button
              type="button"
              disabled
              title="Próximamente"
              className="p-1 text-muted-text opacity-40"
            >
              ✕
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
