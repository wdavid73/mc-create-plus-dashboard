import { useQuery } from "@tanstack/react-query"
import { getMetrics } from "@/api/endpoints"

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: getMetrics,
    refetchInterval: 10000,
  })
}
