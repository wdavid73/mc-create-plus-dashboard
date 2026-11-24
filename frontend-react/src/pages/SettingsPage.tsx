import { Bell, FileClock, Settings as SettingsIcon } from "lucide-react"

const SOON_CARDS = [
  {
    icon: SettingsIcon,
    title: "Configuración del servidor",
    description: "Editar motd, dificultad, máx. jugadores y whitelist on/off (aplica con reinicio).",
  },
  {
    icon: Bell,
    title: "Notificaciones",
    description: "Aviso a Discord cuando el servidor se cae, o cuando alguien entra o sale.",
  },
  {
    icon: FileClock,
    title: "Bitácora de auditoría",
    description: "Quién hizo start/stop/restart/backup desde el panel, y cuándo.",
  },
]

export function SettingsPage() {
  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
      {SOON_CARDS.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="rounded-lg border border-panel-border bg-panel-2 px-[18px] py-4"
        >
          <span className="mb-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-panel text-brand-bright">
            <Icon className="h-[17px] w-[17px]" />
          </span>
          <div className="mb-1 text-sm font-semibold text-text">
            {title}
            <span className="mt-0.5 block text-[11px] font-normal text-[#7d8694]">Próximamente</span>
          </div>
          <p className="m-0 text-[12.5px] leading-normal text-muted-text">{description}</p>
        </div>
      ))}
    </div>
  )
}
