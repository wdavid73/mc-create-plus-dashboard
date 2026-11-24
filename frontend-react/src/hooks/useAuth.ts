import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { logout as logoutRequest } from "@/api/endpoints"

export function useLogout() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => navigate("/login", { replace: true }),
  })
}
