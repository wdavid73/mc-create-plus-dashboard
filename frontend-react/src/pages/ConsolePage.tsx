import { Copy, ExternalLink, SquareTerminal, Trash2 } from "lucide-react"
import { Card } from "@/components/Card"

const MOCK_LOG_LINES = [
  { ts: "12:10:01", level: "info", message: "Starting server..." },
  { ts: "12:10:08", level: "info", message: "Server is now online" },
  { ts: "12:11:18", level: "info", message: 'Saved the world (23.4 MB)' },
  { ts: "12:11:58", level: "warn", message: "Running scheduled task: backup" },
] as const

export function ConsolePage() {
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
          {["Todo", "Info", "Warn"].map((label, i) => (
            <button
              key={label}
              type="button"
              className={
                i === 0
                  ? "rounded-full border border-[#3a4254] bg-panel-2 px-2.5 py-1 text-xs text-text"
                  : "rounded-full border border-panel-border px-2.5 py-1 text-xs text-muted-text"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" title="Limpiar" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-text hover:bg-panel-2 hover:text-text">
            <Trash2 className="h-[15px] w-[15px]" />
          </button>
          <button type="button" title="Copiar" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-text hover:bg-panel-2 hover:text-text">
            <Copy className="h-[15px] w-[15px]" />
          </button>
          <button type="button" disabled title="Ya estás en la vista completa" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-text opacity-40">
            <ExternalLink className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>

      <div className="h-[230px] overflow-y-auto rounded-lg border border-panel-border bg-[#080a0f] px-3.5 py-3 font-mono text-[12.5px] leading-[1.7] text-[#b7bec7]">
        {MOCK_LOG_LINES.map((line, i) => (
          <div key={i}>
            <span className="mr-1.5 text-[#7d8694]">{line.ts}</span>
            <span className={line.level === "warn" ? "text-warn" : "text-online"}>
              {line.level === "warn" ? "[WARN]" : "[INFO]"}
            </span>{" "}
            {line.message}
          </div>
        ))}
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
        <select className="flex-1 rounded-md border border-panel-border bg-[#080a0f] px-3 py-2 text-[13px] text-text">
          <option>Comando rápido…</option>
        </select>
        <button type="button" disabled className="rounded-md bg-panel-2 px-4 py-2 text-[13px] text-text opacity-40">
          Enviar
        </button>
      </div>
    </Card>
  )
}
