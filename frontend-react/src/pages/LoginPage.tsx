import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ArrowRight,
  Box,
  Eye,
  EyeOff,
  Grid2x2,
  KeyRound,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from "lucide-react"
import { ApiError } from "@/api/client"
import { login } from "@/api/endpoints"

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login({ username, password })
      navigate("/", { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Demasiados intentos, espera 15 minutos.")
      } else if (err instanceof ApiError && err.status === 401) {
        setError("Usuario o contraseña incorrectos")
      } else {
        setError("Error de conexión, intenta de nuevo.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_50%_-10%,rgba(234,181,61,0.08),transparent_45%)] text-text">
      <header className="flex items-center justify-between px-7 py-[22px]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-brand-bright to-[#b4780f] text-[#1a1304]">
            <Box className="h-[19px] w-[19px]" />
          </span>
          <div>
            <div className="text-[15px] font-bold tracking-wide">CREATE+</div>
            <div className="font-mono text-[11px] text-muted-text">SYS-KERNEL v4.12</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-panel-border bg-panel px-3 py-1.5 font-mono text-[11.5px] tracking-wide text-muted-text">
          <span className="h-1.5 w-1.5 rounded-full bg-online" />
          NODE: ONLINE
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pt-5 pb-[60px]">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[420px] rounded-2xl border border-panel-border bg-panel px-8 pt-[34px] pb-7 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_24px_48px_-20px_rgba(0,0,0,0.7)]"
        >
          <div className="relative mx-auto mb-[18px] h-16 w-16">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#6b5420] bg-brand-dim text-brand-bright shadow-[0_0_16px_-2px_rgba(234,181,61,0.35)]">
              <Settings className="h-[30px] w-[30px]" />
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-panel bg-online" />
          </div>

          <h1 className="m-0 mb-1 text-center text-2xl font-extrabold">
            Create<span className="text-brand">+</span> Control
          </h1>
          <p className="m-0 mb-3 text-center text-[13px] text-muted-text">
            Minecraft Server Control Panel · Autenticación de nodo
          </p>
          <div className="mb-6 flex items-center justify-center gap-2 font-mono text-xs text-muted-text">
            <span className="h-1.5 w-1.5 rounded-full bg-online" />
            Forge 1.20.1 <span className="text-panel-border">·</span> Servidor Create+
          </div>

          <div className="mt-4 mb-2 flex flex-wrap items-center justify-between gap-1.5">
            <label htmlFor="username" className="font-mono text-[11px] tracking-wide text-muted-text uppercase">
              Usuario / IGN de operador
            </label>
            <span className="font-mono text-[11px] text-brand-bright">OP LEVEL ≥ 3</span>
          </div>
          <div className="relative flex items-center">
            <User className="pointer-events-none absolute left-3 h-4 w-4 text-muted-text" />
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin o IGN del operador"
              className="w-full rounded-lg border border-panel-border bg-[#080a0f] py-2.5 pr-3 pl-[38px] text-sm text-text placeholder:text-muted-text focus:border-brand focus:ring-[3px] focus:ring-brand-dim focus:outline-none"
            />
          </div>

          <div className="mt-4 mb-2 flex flex-wrap items-center justify-between gap-1.5">
            <label htmlFor="password" className="font-mono text-[11px] tracking-wide text-muted-text uppercase">
              Contraseña / Clave
            </label>
            <span className="flex cursor-not-allowed items-center gap-1.5 font-mono text-[11px] text-muted-text">
              Token de recuperación
              <span className="rounded-full border border-panel-border px-1.5 py-px text-[11px]">Próximamente</span>
            </span>
          </div>
          <div className="relative flex items-center">
            <KeyRound className="pointer-events-none absolute left-3 h-4 w-4 text-muted-text" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña del panel o clave RCON"
              className="w-full rounded-lg border border-panel-border bg-[#080a0f] py-2.5 pr-9 pl-[38px] text-sm text-text placeholder:text-muted-text focus:border-brand focus:ring-[3px] focus:ring-brand-dim focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              title="Mostrar/ocultar contraseña"
              className="absolute right-2.5 flex items-center justify-center p-1 text-muted-text"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <label className="mt-[18px] flex items-center gap-2.5 text-[13px] text-muted-text">
            <input type="checkbox" disabled className="sr-only" />
            <span className="h-[18px] w-[18px] shrink-0 rounded-[5px] border border-panel-border bg-[#080a0f]" />
            Mantener sesión iniciada (30 días)
            <span className="rounded-full border border-panel-border px-1.5 py-px text-[11px]">Próximamente</span>
          </label>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#5a2e28] bg-danger-dim px-3 py-2.5 text-sm text-[#f0a99a]">
              <AlertCircle className="h-[15px] w-[15px] shrink-0 text-danger" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-[22px] flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-[9px] bg-brand text-[14.5px] font-bold text-[#1a1304] disabled:opacity-60"
          >
            <SlidersHorizontal className="h-[17px] w-[17px]" />
            {submitting ? "Accediendo…" : "Acceder a la consola"}
            <ArrowRight className="h-[17px] w-[17px]" />
          </button>

          <div className="my-6 flex items-center gap-3 font-mono text-[10.5px] tracking-wide text-muted-text uppercase before:h-px before:flex-1 before:bg-panel-border after:h-px after:flex-1 after:bg-panel-border">
            Federación de operadores
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled
              title="Próximamente"
              className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-[9px] border border-panel-border bg-panel-2 px-2.5 py-3 text-[12.5px] text-text opacity-55"
            >
              <Grid2x2 className="h-[17px] w-[17px]" />
              Xbox Live / MS
              <span className="rounded-full border border-panel-border px-1.5 py-px text-[11px]">Próximamente</span>
            </button>
            <button
              type="button"
              disabled
              title="Próximamente"
              className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-[9px] border border-panel-border bg-panel-2 px-2.5 py-3 text-[12.5px] text-text opacity-55"
            >
              <KeyRound className="h-[17px] w-[17px]" />
              YubiKey física
              <span className="rounded-full border border-panel-border px-1.5 py-px text-[11px]">Próximamente</span>
            </button>
          </div>

          <div className="mt-[18px] flex items-center gap-2.5 rounded-[9px] border border-panel-border bg-panel-2 px-3.5 py-3">
            <ShieldCheck className="h-[17px] w-[17px] shrink-0 text-online" />
            <div className="flex-1">
              <div className="text-[12.5px] font-semibold">Túnel cifrado activo</div>
              <div className="font-mono text-[11px] text-muted-text">TLS 1.3 · Huella de nodo SHA-384</div>
            </div>
            <span className="font-mono text-[11px] text-online">● ONLINE</span>
          </div>
        </form>
      </main>

      <footer className="flex flex-wrap justify-between gap-3 px-7 pt-4 pb-[22px] font-mono text-[11px] text-muted-text">
        <span>create.net.internal:25565 · v0.5.1e</span>
        <span>Zona restringida · Contactar al SysAdmin</span>
      </footer>
    </div>
  )
}
