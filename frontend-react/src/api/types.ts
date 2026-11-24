export type ServerStatus = {
  status: string
}

export type LoginRequest = {
  username: string
  password: string
}

export type ControlActionResult = {
  ok: boolean
  output: string
}

export type PlayersResponse = {
  online: number
  max: number
  players: string[]
}

export type MetricsResponse = {
  labels: string[]
  cpu: number[]
  ram_vm_gb: number[]
  ram_java_gb: number[]
}

export type ControlAction =
  | "start"
  | "stop"
  | "restart"
  | "backup-now"
  | "backup-offsite"
  | "schedule-on"
  | "schedule-off"

export type LogLevel = "info" | "warn"

export type LogLine = {
  id: number
  ts: string
  level: LogLevel
  message: string
}

export type GameCommandAction =
  | "time-day"
  | "time-night"
  | "weather-clear"
  | "weather-rain"
  | "difficulty-peaceful"
  | "difficulty-easy"
  | "difficulty-normal"
  | "difficulty-hard"
  | "gamemode-survival-all"
  | "gamemode-creative-all"
  | "keepinventory-on"
  | "keepinventory-off"
  | "mobgriefing-on"
  | "mobgriefing-off"
  | "daylightcycle-on"
  | "daylightcycle-off"
  | "weathercycle-on"
  | "weathercycle-off"
