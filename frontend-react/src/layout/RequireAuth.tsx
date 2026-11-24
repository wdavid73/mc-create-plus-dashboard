import { useQuery } from "@tanstack/react-query"
import { Navigate, Outlet } from "react-router-dom"
import { getStatus } from "@/api/endpoints"

/**
 * Gates every dashboard route behind a valid session. There's no
 * dedicated "whoami" endpoint, so this reuses /api/status (also
 * require_session-gated) purely as an auth probe.
 *
 * Only a clean 2xx response counts as "logged in". A 401 obviously
 * means no session, but anything else — 503 from systemctl itself
 * being unavailable, a network error, the dev proxy returning a 500
 * because nothing is listening on the backend port — also redirects
 * to /login: none of those confirm a valid session either, and
 * showing the dashboard shell when we can't tell is exactly the gap
 * this guard exists to close.
 */
export function RequireAuth() {
  const { isPending, isError } = useQuery({
    queryKey: ["session-check"],
    queryFn: getStatus,
    retry: false,
    staleTime: 0,
  })

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted-text">
        Verificando sesión…
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
