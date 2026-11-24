import { Button } from "@/components/ui/button"

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm rounded-xl border border-panel-border bg-panel p-6 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_20px_36px_-16px_rgba(0,0,0,0.7)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-bright to-[#b4780f] text-[#1a1304]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M4 7l8-4 8 4v10l-8 4-8-4z" />
            </svg>
          </span>
          <div>
            <p className="text-[15px] font-bold text-text">Create+</p>
            <p className="text-[11px] text-muted-text">Fase 0 — Tailwind + shadcn OK</p>
          </div>
        </div>
        <p className="mb-4 font-mono text-sm text-online">
          Tokens del tema cargando correctamente.
        </p>
        <Button>Botón de shadcn/ui</Button>
      </div>
    </main>
  )
}

export default App
