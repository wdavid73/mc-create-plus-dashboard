import { Route, Routes } from "react-router-dom"
import { Archive, Globe2, Package } from "lucide-react"
import { AppShell } from "@/layout/AppShell"
import { RequireAuth } from "@/layout/RequireAuth"
import { LoginPage } from "@/pages/LoginPage"
import { OverviewPage } from "@/pages/OverviewPage"
import { ConsolePage } from "@/pages/ConsolePage"
import { PlayersPage } from "@/pages/PlayersPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { SettingsPage } from "@/pages/SettingsPage"

function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="console" element={<ConsolePage />} />
          <Route path="players" element={<PlayersPage />} />
          <Route
            path="mods"
            element={
              <PlaceholderPage
                icon={Package}
                title="Mods instalados"
                description="Próximamente: ver la lista completa de mods y subir/quitar archivos .jar desde la web."
              />
            }
          />
          <Route
            path="worlds"
            element={
              <PlaceholderPage
                icon={Globe2}
                title="Gestión de mundos"
                description="Próximamente: cambiar de mundo, ver tamaño y crear nuevos mundos desde el panel."
              />
            }
          />
          <Route
            path="backups"
            element={
              <PlaceholderPage
                icon={Archive}
                title="Historial de backups"
                description="Próximamente: ver y restaurar backups locales y de Object Storage desde la web."
                note="Las acciones de backup (ahora / offsite) están en Overview → Respaldos. Esta vista es solo para ver el historial."
              />
            }
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
