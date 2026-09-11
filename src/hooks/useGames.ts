import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import type { CreateGamePayload, Game } from '@/types';

export function useGames(studioId?: string) {
  return useQuery({
    queryKey: queryKeys.games(studioId),
    queryFn: () => get<Game[]>('/games', studioId ? { studioId } : undefined),
  });
}

export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.game(gameId ?? ''),
    queryFn: () => get<Game>(`/games/${gameId}`),
    enabled: !!gameId,
  });
}

export function useCreateGame() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGamePayload) => post<Game>('/games', payload),
    onSuccess: (game) => {
      client.invalidateQueries({ queryKey: ['games'] });
      client.invalidateQueries({ queryKey: queryKeys.studioDashboard });
      client.setQueryData(queryKeys.game(game.id), game);
    },
  });
}
