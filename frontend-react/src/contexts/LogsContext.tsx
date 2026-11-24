import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { LogLine } from "@/api/types"
import { getRecentLogs } from "@/api/endpoints"
import { parseLogLine } from "@/lib/parseLogLine"

type LogsContextValue = {
  lines: LogLine[]
  clear: () => void
}

const LogsContext = createContext<LogsContextValue | null>(null)

/**
 * Fetches recent logs once and keeps a single /ws/logs connection open
 * for as long as the authenticated shell is mounted, mirroring the
 * vanilla app's single-socket-many-DOM-nodes behavior: both the
 * Overview preview and the full Console page read from this same
 * context instead of each opening their own WebSocket.
 */
export function LogsProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<LogLine[]>([])
  const nextId = useRef(0)

  const appendLine = useCallback((raw: string) => {
    if (raw === "") return
    const parsed = parseLogLine(raw)
    setLines((prev) => [...prev, { id: nextId.current++, ...parsed }])
  }, [])

  useEffect(() => {
    let cancelled = false

    getRecentLogs()
      .then((data) => {
        if (cancelled) return
        data.lines.forEach(appendLine)
      })
      .catch(() => {})

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const socket = new WebSocket(`${wsProtocol}//${window.location.host}/ws/logs`)
    socket.addEventListener("message", (event) => appendLine(event.data))

    return () => {
      cancelled = true
      socket.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clear = useCallback(() => setLines([]), [])

  return <LogsContext.Provider value={{ lines, clear }}>{children}</LogsContext.Provider>
}

export function useLogs() {
  const ctx = useContext(LogsContext)
  if (!ctx) throw new Error("useLogs must be used inside LogsProvider")
  return ctx
}
