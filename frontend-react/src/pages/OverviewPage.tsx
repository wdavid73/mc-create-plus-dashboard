import {
  Cpu,
  HardDrive,
  Layers,
  MoonStar,
  Play,
  RotateCcw,
  Square,
  SquareTerminal,
  Sun,
  Upload,
  Users,
  Wifi,
  Cloud,
  Database,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardHeading } from "@/components/Card"
import { PlayerAvatar } from "@/components/PlayerAvatar"
import { Select } from "@/components/Select"
import { MOCK_MAX_PLAYERS, MOCK_PLAYERS } from "@/lib/mockData"

function ChartPlaceholder() {
  return (
    <div className="flex h-[150px] items-center justify-center rounded-md border border-dashed border-panel-border text-xs text-muted-text">
      Gráfica (Chart.js — Fase 2)
    </div>
  )
}

export function OverviewPage() {
  return (
    <div className="flex flex-col gap-[18px] lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Status + actions */}
        <div className="flex flex-wrap gap-4">
          <Card className="min-w-[280px] flex-[1.4_1.4_0%]">
            <div className="mb-3.5 flex flex-wrap items-center gap-[18px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-online-dim px-3.5 py-1.5 text-sm font-semibold text-online">
                <span className="h-2 w-2 rounded-full bg-online" />
                Online
              </span>
              <span className="text-[12.5px] text-muted-text">
                Servicio: <b className="font-semibold text-text">active</b>
              </span>
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="mb-0.5 text-[11.5px] text-muted-text">Versión</div>
                <div className="text-[14.5px] font-semibold text-text">Forge 1.20.1</div>
              </div>
              <div>
                <div className="mb-0.5 text-[11.5px] text-muted-text">Jugadores</div>
                <div className="text-[14.5px] font-semibold text-text">
                  {MOCK_PLAYERS.length} / {MOCK_MAX_PLAYERS}
                </div>
              </div>
              <div>
                <div className="mb-0.5 text-[11.5px] text-muted-text">Mundo</div>
                <div className="text-[14.5px] font-semibold text-text">Create+</div>
              </div>
            </div>
          </Card>

          <Card className="flex min-w-[220px] flex-1 items-center">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#6b5420] bg-brand-dim px-4 text-[13px] font-bold text-brand-bright"
              >
                <RotateCcw className="h-[15px] w-[15px]" />
                Restart
              </button>
              <button
                type="button"
                className="flex min-h-11 items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 text-[13px] font-semibold text-text"
              >
                <Square className="h-[15px] w-[15px]" />
                Stop
              </button>
              <button
                type="button"
                disabled
                className="flex min-h-11 items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 text-[13px] font-semibold text-text opacity-40"
              >
                <Play className="h-[15px] w-[15px]" />
                Start
              </button>
            </div>
          </Card>
        </div>

        {/* Usage charts */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="m-0 flex items-center gap-2.5 text-base font-bold text-text">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#6b5420] bg-brand-dim text-brand-bright">
                  <Cpu className="h-4 w-4" />
                </span>
                CPU Usage
              </h2>
              <span className="text-[26px] font-bold text-brand-bright">
                34<span className="text-sm">%</span>
              </span>
            </div>
            <ChartPlaceholder />
          </Card>
          <Card>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="m-0 flex items-center gap-2.5 text-base font-bold text-text">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#6b5420] bg-brand-dim text-brand-bright">
                  <Layers className="h-4 w-4" />
                </span>
                RAM (Java)
              </h2>
              <span className="text-[26px] font-bold text-brand-bright">
                7.8<span className="text-sm">GB</span>
              </span>
            </div>
            <ChartPlaceholder />
          </Card>
        </div>

        {/* Control groups */}
        <Card>
          <div className="flex flex-wrap gap-7">
            <div className="flex flex-col gap-2.5">
              <div className="text-xs uppercase tracking-wide text-muted-text">Respaldos</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="flex items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 py-2.5 text-[13px] text-text">
                  <Upload className="h-[15px] w-[15px]" />
                  Backup ahora
                </button>
                <button type="button" className="flex items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 py-2.5 text-[13px] text-text">
                  <Cloud className="h-[15px] w-[15px]" />
                  Backup offsite
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 border-l border-panel-border pl-7">
              <div className="text-xs uppercase tracking-wide text-muted-text">Automatización</div>
              <div className="flex items-center gap-2.5">
                <span className="relative h-[22px] w-10 shrink-0 rounded-full border border-panel-border bg-panel-border">
                  <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-muted-text" />
                </span>
                <span className="text-[13px] text-text">
                  Horario automático
                  <span className="block text-xs text-muted-text">Desactivado</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 border-l border-panel-border pl-7">
              <div className="text-xs uppercase tracking-wide text-muted-text">Mundo</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="flex items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 py-2.5 text-[13px] text-text">
                  <Sun className="h-[15px] w-[15px]" />
                  Hacer de día
                </button>
                <button type="button" className="flex items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 py-2.5 text-[13px] text-text">
                  <MoonStar className="h-[15px] w-[15px]" />
                  Hacer de noche
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* TP menu */}
        <Card>
          <div className="mb-2.5 text-xs uppercase tracking-wide text-muted-text">Teletransportar jugador</div>
          <div className="flex flex-wrap items-center gap-2">
            <Select wrapperClassName="min-w-[140px]">
              <option>Jugador</option>
            </Select>
            <span className="text-muted-text">→</span>
            <Select wrapperClassName="min-w-[140px]">
              <option>hacia jugador</option>
            </Select>
            <button type="button" className="rounded-md bg-brand px-4 py-2 text-[13px] font-bold text-[#1a1304]">
              Teletransportar
            </button>
          </div>
        </Card>

        {/* Console preview */}
        <Card>
          <div className="mb-3 flex items-center gap-2.5">
            <h2 className="m-0 flex items-center gap-2 text-base font-bold text-text">
              <SquareTerminal className="h-[17px] w-[17px] text-muted-text" />
              Console
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-online">
              <span className="h-1.5 w-1.5 rounded-full bg-online" />
              Live
            </span>
          </div>
          <div className="h-[150px] overflow-y-auto rounded-lg border border-panel-border bg-[#080a0f]" />
          <div className="mt-2 text-right">
            <Link to="/console" className="text-xs text-brand-bright hover:underline">
              Ver consola completa →
            </Link>
          </div>
        </Card>
      </div>

      {/* Right column */}
      <div className="flex w-full flex-col gap-4 lg:w-[320px] lg:shrink-0">
        <Card>
          <CardHeading icon={Users}>
            Connected Players
            <span className="ml-auto text-xs font-medium text-muted-text">
              {MOCK_PLAYERS.length} / {MOCK_MAX_PLAYERS}
            </span>
          </CardHeading>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {MOCK_PLAYERS.slice(0, 4).map((name, i) => (
              <li key={name} className="flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-[13.5px]">
                <PlayerAvatar index={i} />
                <div className="min-w-0 flex-1">
                  <span className="block font-semibold text-text">{name}</span>
                  <span className="flex items-center gap-1.5 text-[11.5px] text-muted-text">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-online" />
                    Online
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeading icon={Database}>Server Info</CardHeading>
          <div className="flex flex-col gap-3.5">
            {[
              { icon: Cpu, label: "CPU", value: "Próximamente" },
              { icon: Layers, label: "RAM", value: "7.8 / 12.0 GB" },
              { icon: HardDrive, label: "Storage", value: "Próximamente" },
              { icon: Wifi, label: "Network", value: "Próximamente" },
            ].map(({ icon: Icon, label, value }, i, arr) => (
              <div
                key={label}
                className={
                  i < arr.length - 1
                    ? "flex items-center gap-3 border-b border-panel-border pb-3.5"
                    : "flex items-center gap-3"
                }
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-text" />
                <div className="flex flex-1 items-center justify-between gap-2">
                  <span className="text-[13px] text-muted-text">{label}</span>
                  <span className="text-[13px] font-semibold text-text">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
