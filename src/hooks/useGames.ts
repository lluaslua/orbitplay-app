import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EntradaDeAcesso } from '@/components/Studio/GameCreation/useNovoJogoDraft';
import { get, patch, post, put } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import type { CatalogTab, CreateGamePayload, Game } from '@/types';

/**
 * Lista de jogos. O estúdio passa `studioId` e vê só os seus. O catálogo do
 * tester passa `aba` e `busca`, que a API já filtra (`?tab=` e `?search=`).
 */
export function useGames(studioId?: string, filtros?: { aba?: CatalogTab; busca?: string }) {
  const params = {
    ...(studioId ? { studioId } : {}),
    ...(filtros?.aba ? { tab: filtros.aba } : {}),
    ...(filtros?.busca ? { search: filtros.busca } : {}),
  };
  const comFiltro = !!(filtros?.aba || filtros?.busca);

  return useQuery({
    queryKey: comFiltro
      ? ([...queryKeys.games(studioId), filtros?.aba ?? null, filtros?.busca ?? ''] as const)
      : queryKeys.games(studioId),
    queryFn: () => get<Game[]>('/games', Object.keys(params).length ? params : undefined),
  });
}

export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.game(gameId ?? ''),
    queryFn: () => get<Game>(`/games/${gameId}`),
    enabled: !!gameId,
  });
}

/**
 * "Finalizar" do Novo jogo: cria o jogo (com as imagens em data URL, que a API
 * grava), troca a tabela de permissões e confere os campos obrigatórios
 * (`finish-setup`) — só então o jogo recebe testes. Se um passo falhar, a nova
 * tentativa recebe o `gameId` já criado e atualiza em vez de criar outro.
 */
export function useFinalizarNovoJogo() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payload,
      acesso,
      gameId,
      aoCriar,
    }: {
      payload: CreateGamePayload;
      acesso: EntradaDeAcesso[];
      gameId: string | null;
      aoCriar: (gameId: string) => void;
    }) => {
      const jogo = gameId ? await patch<Game>(`/games/${gameId}`, payload) : await post<Game>('/games', payload);
      aoCriar(jogo.id);
      await put(`/games/${jogo.id}/access`, { entries: acesso });
      return post<Game>(`/games/${jogo.id}/finish-setup`);
    },
    onSuccess: (game) => {
      client.invalidateQueries({ queryKey: ['games'] });
      client.invalidateQueries({ queryKey: queryKeys.studioDashboard });
      client.setQueryData(queryKeys.game(game.id), game);
    },
  });
}
