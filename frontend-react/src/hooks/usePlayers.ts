import { useQuery } from "@tanstack/react-query"
import { getPlayers } from "@/api/endpoints"

export function usePlayers() {
  return useQuery({
    queryKey: ["players"],
    queryFn: getPlayers,
    refetchInterval: 10000,
  })
}
