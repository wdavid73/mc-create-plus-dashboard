import {
  Archive,
  Globe2,
  Home,
  Package,
  Settings as SettingsIcon,
  SquareTerminal,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  soon?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", path: "/", icon: Home },
  { label: "Console", path: "/console", icon: SquareTerminal },
  { label: "Players", path: "/players", icon: Users },
  { label: "Mods", path: "/mods", icon: Package, soon: true },
  { label: "Worlds", path: "/worlds", icon: Globe2, soon: true },
  { label: "Backups", path: "/backups", icon: Archive, soon: true },
  { label: "Settings", path: "/settings", icon: SettingsIcon, soon: true },
]
