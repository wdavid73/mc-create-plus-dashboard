import { useState } from "react"
import { Outlet } from "react-router-dom"
import { LogsProvider } from "@/contexts/LogsContext"
import { Sidebar } from "@/layout/Sidebar"
import { Topbar } from "@/layout/Topbar"

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <LogsProvider>
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />
          <section className="flex-1 px-7 pt-[22px] pb-10">
            <Outlet />
          </section>
        </div>
      </div>
    </LogsProvider>
  )
}
