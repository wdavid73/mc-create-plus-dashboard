import { useQuery } from "@tanstack/react-query"
import { Navigate, Outlet } from "react-router-dom"
import { ApiError } from "@/api/client"
import { getStatus } from "@/api/endpoints"

/**
 * Gates every dashboard route behind a valid session. There's no
 * dedicated "whoami" endpoint, so this reuses /api/status (also
 * require_session-gated) purely as an auth probe: a 401 means "not
 * logged in, go to /login". Any other failure (503 if systemctl
 * itself is unavailable, a network blip, ...) means the session is
 * still fine — let the dashboard render and individual cards show
 * their own error/empty state instead of blocking entry.
 */
export function RequireAuth() {
  const { isPending, isError, error } = useQuery({
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

  if (isError && error instanceof ApiError && error.status === 401) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
