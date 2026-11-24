import type { LogLevel } from "@/api/types"

const LOG_LINE_PATTERN = /^\[(\d{2}:\d{2}:\d{2})\]\s*\[[^\]]*\/(INFO|WARN|ERROR)\]:\s*(.*)$/

export function parseLogLine(raw: string): { ts: string; level: LogLevel; message: string } {
  const match = raw.match(LOG_LINE_PATTERN)
  if (match) {
    const rawLevel = match[2].toLowerCase()
    const level: LogLevel = rawLevel === "warn" || rawLevel === "error" ? "warn" : "info"
    return { ts: match[1], level, message: match[3] }
  }
  const now = new Date()
  return { ts: now.toTimeString().slice(0, 8), level: "info", message: raw }
}
