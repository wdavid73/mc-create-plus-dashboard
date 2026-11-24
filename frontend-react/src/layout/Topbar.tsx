import { LogOut, Menu } from "lucide-react"

type TopbarProps = {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header
      className="relative flex min-h-[108px] items-end justify-between border-b border-panel-border bg-cover bg-[center_60%] px-7 py-[26px]"
      style={{
        backgroundImage:
          "linear-gradient(100deg, rgba(10,13,19,0.97) 0%, rgba(10,13,19,0.94) 55%, rgba(10,13,19,0.5) 85%, rgba(10,13,19,0.15) 100%), url('/images/banner.webp')",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          title="Menú"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-panel-border bg-panel/80 text-muted-text md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="m-0 text-[21px] font-bold text-text">Create+ Dashboard</h1>
          <p className="m-0 mt-0.5 text-[12.5px] text-muted-text">Minecraft Server Control Panel</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          title="Cerrar sesión"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-panel-border bg-panel/80 text-muted-text"
        >
          <LogOut className="h-4 w-4" />
        </button>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-panel-border bg-gradient-to-br from-[#4a5262] to-[#272c37] text-[13px] font-bold text-text">
          A
        </span>
      </div>
    </header>
  )
}
