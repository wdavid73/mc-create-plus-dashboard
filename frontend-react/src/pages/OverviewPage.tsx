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
import { PlayersList } from "@/components/PlayersList"
import { ScheduleSwitch } from "@/components/ScheduleSwitch"
import { TpMenu } from "@/components/TpMenu"
import { UsageChart } from "@/components/UsageChart"
import { useLogs } from "@/contexts/LogsContext"
import { useControlAction, useGameCommand } from "@/hooks/useControlActions"
import { useMetrics } from "@/hooks/useMetrics"
import { usePlayers } from "@/hooks/usePlayers"
import { useStatus } from "@/hooks/useStatus"

export function OverviewPage() {
  const statusQuery = useStatus()
  const metricsQuery = useMetrics()
  const playersQuery = usePlayers()
  const controlAction = useControlAction()
  const gameCommand = useGameCommand()
  const { lines } = useLogs()
  const recentLines = lines.slice(-6)

  const isActive = statusQuery.data?.status === "active"
  const players = playersQuery.data?.players ?? []
  const online = playersQuery.data?.online ?? 0
  const max = playersQuery.data?.max ?? 0

  const labels = metricsQuery.data?.labels ?? []
  const cpu = metricsQuery.data?.cpu ?? []
  const ramJava = metricsQuery.data?.ram_java_gb ?? []
  const ramVm = metricsQuery.data?.ram_vm_gb ?? []
  const cpuLast = cpu.at(-1)
  const ramJavaLast = ramJava.at(-1)
  const ramVmLast = ramVm.at(-1)

  return (
    <div className="flex flex-col gap-[18px] lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Status + actions */}
        <div className="flex flex-wrap gap-4">
          <Card className="min-w-[280px] flex-[1.4_1.4_0%]">
            <div className="mb-3.5 flex flex-wrap items-center gap-[18px]">
              <span
                className={
                  isActive
                    ? "inline-flex items-center gap-1.5 rounded-full bg-online-dim px-3.5 py-1.5 text-sm font-semibold text-online"
                    : "inline-flex items-center gap-1.5 rounded-full bg-danger-dim px-3.5 py-1.5 text-sm font-semibold text-danger"
                }
              >
                <span className={cnDot(isActive)} />
                {isActive ? "Online" : "Offline"}
              </span>
              <span className="text-[12.5px] text-muted-text">
                Servicio: <b className="font-semibold text-text">{statusQuery.data?.status ?? "—"}</b>
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
                  {online} / {max}
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
                disabled={!isActive || controlAction.isPending}
                onClick={() => controlAction.mutate("restart")}
                className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#6b5420] bg-brand-dim px-4 text-[13px] font-bold text-brand-bright disabled:opacity-40"
              >
                <RotateCcw className="h-[15px] w-[15px]" />
                Restart
              </button>
              <button
                type="button"
                disabled={!isActive || controlAction.isPending}
                onClick={() => controlAction.mutate("stop")}
                className="flex min-h-11 items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 text-[13px] font-semibold text-text disabled:opacity-40"
              >
                <Square className="h-[15px] w-[15px]" />
                Stop
              </button>
              <button
                type="button"
                disabled={isActive || controlAction.isPending}
                onClick={() => controlAction.mutate("start")}
                className="flex min-h-11 items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 text-[13px] font-semibold text-text disabled:opacity-40"
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
                {cpuLast !== undefined ? Math.round(cpuLast) : 0}
                <span className="text-sm">%</span>
              </span>
            </div>
            <UsageChart labels={labels} data={cpu} color="#eab53d" />
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
                {ramJavaLast !== undefined ? ramJavaLast.toFixed(1) : "0.0"}
                <span className="text-sm">GB</span>
              </span>
            </div>
            <UsageChart labels={labels} data={ramJava} color="#eab53d" />
          </Card>
        </div>

        {/* Control groups */}
        <Card>
          <div className="flex flex-wrap gap-7">
            <div className="flex flex-col gap-2.5">
              <div className="text-xs uppercase tracking-wide text-muted-text">Respaldos</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => controlAction.mutate("backup-now")}
                  className="flex items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 py-2.5 text-[13px] text-text"
                >
                  <Upload className="h-[15px] w-[15px]" />
                  Backup ahora
                </button>
                <button
                  type="button"
                  onClick={() => controlAction.mutate("backup-offsite")}
                  className="flex items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 py-2.5 text-[13px] text-text"
                >
                  <Cloud className="h-[15px] w-[15px]" />
                  Backup offsite
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 border-l border-panel-border pl-7">
              <div className="text-xs uppercase tracking-wide text-muted-text">Automatización</div>
              <ScheduleSwitch />
            </div>
            <div className="flex flex-col gap-2.5 border-l border-panel-border pl-7">
              <div className="text-xs uppercase tracking-wide text-muted-text">Mundo</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => gameCommand.mutate("time-day")}
                  className="flex items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 py-2.5 text-[13px] text-text"
                >
                  <Sun className="h-[15px] w-[15px]" />
                  Hacer de día
                </button>
                <button
                  type="button"
                  onClick={() => gameCommand.mutate("time-night")}
                  className="flex items-center gap-1.5 rounded-md border border-panel-border bg-panel-2 px-4 py-2.5 text-[13px] text-text"
                >
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
          <TpMenu players={players} />
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
          <div className="h-[150px] overflow-y-auto rounded-lg border border-panel-border bg-[#080a0f] px-3.5 py-3 font-mono text-[12.5px] leading-[1.7] text-[#b7bec7]">
            {recentLines.length === 0 ? (
              <div className="py-5 text-center text-muted-text">Sin actividad reciente</div>
            ) : (
              recentLines.map((line) => (
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
              {online} / {max}
            </span>
          </CardHeading>
          <PlayersList players={players} limit={4} />
        </Card>

        <Card>
          <CardHeading icon={Database}>Server Info</CardHeading>
          <div className="flex flex-col gap-3.5">
            {[
              { icon: Cpu, label: "CPU", value: "Próximamente" },
              {
                icon: Layers,
                label: "RAM",
                value: ramVmLast !== undefined ? `${ramVmLast.toFixed(1)} GB` : "—",
              },
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

function cnDot(isActive: boolean) {
  return isActive ? "h-2 w-2 rounded-full bg-online" : "h-2 w-2 rounded-full bg-danger"
}
