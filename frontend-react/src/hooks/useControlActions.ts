import { useMutation, useQueryClient } from "@tanstack/react-query"
import { runControlAction, runGameCommand, teleportPlayer } from "@/api/endpoints"
import type { ControlAction, GameCommandAction } from "@/api/types"

export function useControlAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: ControlAction) => runControlAction(action),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["status"] }),
  })
}

export function useGameCommand() {
  return useMutation({
    mutationFn: (action: GameCommandAction) => runGameCommand(action),
  })
}

export function useTeleport() {
  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => teleportPlayer(from, to),
  })
}
