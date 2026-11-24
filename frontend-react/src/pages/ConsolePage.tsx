import { useEffect, useMemo, useRef, useState } from "react"
import { Copy, ExternalLink, SquareTerminal, Trash2 } from "lucide-react"
import { Card } from "@/components/Card"
import { Select } from "@/components/Select"
import { useLogs } from "@/contexts/LogsContext"
import { useGameCommand } from "@/hooks/useControlActions"
import type { GameCommandAction } from "@/api/types"

const QUICK_COMMANDS: { group: string; options: { value: GameCommandAction; label: string }[] }[] = [
  {
    group: "Tiempo",
    options: [
      { value: "time-day", label: "Hacer de día" },
      { value: "time-night", label: "Hacer de noche" },
    ],
  },
  {
    group: "Clima",
    options: [
      { value: "weather-clear", label: "Limpiar clima" },
      { value: "weather-rain", label: "Hacer llover" },
    ],
  },
  {
    group: "Dificultad",
    options: [
      { value: "difficulty-peaceful", label: "Pacífico" },
      { value: "difficulty-easy", label: "Fácil" },
      { value: "difficulty-normal", label: "Normal" },
      { value: "difficulty-hard", label: "Difícil" },
    ],
  },
  {
    group: "Modo de juego (todos)",
    options: [
      { value: "gamemode-survival-all", label: "Supervivencia" },
      { value: "gamemode-creative-all", label: "Creativo" },
    ],
  },
  {
    group: "Reglas del mundo",
    options: [
      { value: "keepinventory-on", label: "Mantener inventario: ON" },
      { value: "keepinventory-off", label: "Mantener inventario: OFF" },
      { value: "mobgriefing-on", label: "Mobs destruyen bloques: ON" },
      { value: "mobgriefing-off", label: "Mobs destruyen bloques: OFF" },
      { value: "daylightcycle-on", label: "Ciclo día/noche: ON" },
      { value: "daylightcycle-off", label: "Ciclo día/noche: OFF" },
      { value: "weathercycle-on", label: "Ciclo de clima: ON" },
      { value: "weathercycle-off", label: "Ciclo de clima: OFF" },
    ],
  },
]

type Filter = "all" | "info" | "warn"

export function ConsolePage() {
  const { lines, clear } = useLogs()
  const [filter, setFilter] = useState<Filter>("all")
  const [command, setCommand] = useState("")
  const gameCommand = useGameCommand()
  const logBoxRef = useRef<HTMLDivElement>(null)

  const visibleLines = useMemo(
    () => (filter === "all" ? lines : lines.filter((l) => l.level === filter)),
    [lines, filter],
  )

  useEffect(() => {
    const box = logBoxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [visibleLines])

  function handleCopy() {
    const text = visibleLines.map((l) => `[${l.ts}] [${l.level.toUpperCase()}] ${l.message}`).join("\n")
    if (navigator.clipboard && text) navigator.clipboard.writeText(text).catch(() => {})
  }

  function handleSubmitCommand() {
    if (!command) return
    gameCommand.mutate(command as GameCommandAction, {
      onSettled: () => setCommand(""),
    })
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <h2 className="m-0 flex items-center gap-2 text-base font-bold text-text">
            <SquareTerminal className="h-[17px] w-[17px] text-muted-text" />
            Log en vivo
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-online">
            <span className="h-1.5 w-1.5 rounded-full bg-online" />
            Live
          </span>
        </div>
        <div className="flex gap-1.5">
          {(["all", "info", "warn"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "rounded-full border border-[#3a4254] bg-panel-2 px-2.5 py-1 text-xs text-text"
                  : "rounded-full border border-panel-border px-2.5 py-1 text-xs text-muted-text"
              }
            >
              {f === "all" ? "Todo" : f === "info" ? "Info" : "Warn"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Limpiar"
            onClick={clear}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-text hover:bg-panel-2 hover:text-text"
          >
            <Trash2 className="h-[15px] w-[15px]" />
          </button>
          <button
            type="button"
            title="Copiar"
            onClick={handleCopy}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-text hover:bg-panel-2 hover:text-text"
          >
            <Copy className="h-[15px] w-[15px]" />
          </button>
          <button
            type="button"
            disabled
            title="Ya estás en la vista completa"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-text opacity-40"
          >
            <ExternalLink className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>

      <div
        ref={logBoxRef}
        className="h-[230px] overflow-y-auto rounded-lg border border-panel-border bg-[#080a0f] px-3.5 py-3 font-mono text-[12.5px] leading-[1.7] text-[#b7bec7]"
      >
        {visibleLines.length === 0 ? (
          <div className="py-5 text-center text-muted-text">Sin actividad reciente</div>
        ) : (
          visibleLines.map((line) => (
            <div key={line.id}>
              <span className="mr-1.5 text-[#7d8694]">{line.ts}</span>
              <span className={line.level === "warn" ? "text-warn" : "text-online"}>
                {line.level === "warn" ? "[WARN]" : "[INFO]"}
              </span>{" "}
              {line.message}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          disabled
          placeholder="Mensaje al chat del juego"
          className="flex-1 rounded-lg border border-panel-border bg-[#080a0f] px-3.5 py-2.5 font-mono text-[12.5px] text-muted-text placeholder:text-[#5a6270]"
        />
        <button type="button" disabled className="rounded-md border border-panel-border bg-panel-2 px-3.5 text-[12.5px] text-[#7d8694]">
          Chat <span className="ml-1.5 rounded-full border border-panel-border px-1.5 py-px text-[11px]">Próximamente</span>
        </button>
      </div>

      <div className="mt-2 flex gap-2">
        <Select wrapperClassName="flex-1" className="bg-[#080a0f]" value={command} onChange={(e) => setCommand(e.target.value)}>
          <option value="">Comando rápido…</option>
          {QUICK_COMMANDS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <button
          type="button"
          disabled={!command || gameCommand.isPending}
          onClick={handleSubmitCommand}
          className="rounded-md bg-panel-2 px-4 py-2 text-[13px] text-text disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </Card>
  )
}
