import { Box } from "lucide-react"
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/nav"

type SidebarProps = {
  open: boolean
  onNavigate: () => void
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[9] bg-black/50 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onNavigate}
      />

      <aside
        className={cn(
          "fixed z-10 flex h-screen w-[250px] shrink-0 flex-col border-r border-panel-border bg-sidebar-bg p-3.5 transition-transform duration-200 ease-out md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-1 flex items-center gap-2.5 border-b border-panel-border px-1.5 pb-[18px]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-bright to-[#b4780f] text-[#1a1304]">
            <Box className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="text-[15px] font-bold leading-tight text-text">Create+</div>
            <div className="text-[11px] text-muted-text">Dashboard</div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 border-b border-panel-border pb-3.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex select-none items-center gap-2.5 rounded-lg border border-transparent px-3 py-2.5 text-[13.5px] font-medium text-muted-text transition-colors hover:bg-panel hover:text-text",
                  isActive && "border-[#4a3a1c] bg-brand-dim text-brand-bright hover:bg-brand-dim hover:text-brand-bright",
                )
              }
            >
              <item.icon className="h-[17px] w-[17px] shrink-0" />
              {item.label}
              {item.soon && (
                <span className="ml-auto rounded-full border border-panel-border px-1.5 py-px text-[11px] text-muted-text">
                  Soon
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2.5">
          <div className="relative h-[92px] overflow-hidden rounded-[10px]">
            <img
              src="/images/sidebar-thumb.webp"
              alt="Create+ build"
              className="h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(13,17,26,0) 35%, var(--color-sidebar-bg) 100%), linear-gradient(90deg, var(--color-sidebar-bg), rgba(13,17,26,0) 20%, rgba(13,17,26,0) 80%, var(--color-sidebar-bg))",
              }}
            />
          </div>
          <div className="flex items-center gap-2 rounded-[10px] border border-panel-border bg-panel px-[11px] py-2.5">
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-online" />
            <div>
              <div className="text-[12.5px] font-semibold text-text">Minecraft Forge</div>
              <div className="text-[11px] text-muted-text">Create+ Modpack</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
