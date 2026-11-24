import { api } from "@/api/client"
import type {
  ControlAction,
  ControlActionResult,
  GameCommandAction,
  LoginRequest,
  MetricsResponse,
  PlayersResponse,
  ServerStatus,
} from "@/api/types"

export const login = (body: LoginRequest) => api.post<{ status: string }>("/api/login", body)

export const logout = () => api.post<{ status: string }>("/api/logout")

export const getStatus = () => api.get<ServerStatus>("/api/status")

export const getPlayers = () => api.get<PlayersResponse>("/api/players")

export const getMetrics = () => api.get<MetricsResponse>("/api/metrics")

export const runControlAction = (action: ControlAction) =>
  api.post<ControlActionResult>(`/api/control/${action}`)

export const runGameCommand = (action: GameCommandAction) =>
  api.post<ControlActionResult>(`/api/game/command/${action}`)

export const teleportPlayer = (fromPlayer: string, toPlayer: string) =>
  api.post<ControlActionResult>("/api/game/tp", { from_player: fromPlayer, to_player: toPlayer })

export const getRecentLogs = () => api.get<{ lines: string[] }>("/api/logs/recent")
