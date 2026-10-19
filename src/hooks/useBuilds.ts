import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enviarArquivo, get, patch } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import type { BuildInfo } from '@/types';

/**
 * Etapa 3 do Novo teste: a build sobe de verdade (`POST /games/:gameId/builds`)
 * e a API responde PROCESSING enquanto calcula o hash e procura o plug-in.
 */
export function useEnviarBuild(gameId: string | null) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ arquivo, onProgresso }: { arquivo: File; onProgresso?: (fracao: number) => void }) => {
      const form = new FormData();
      form.append('file', arquivo);
      return enviarArquivo<BuildInfo>(`/games/${gameId}/builds`, form, onProgresso);
    },
    onSuccess: (build) => client.setQueryData(queryKeys.build(build.gameId, build.id), build),
  });
}

/** A build enviada; consulta a cada segundo enquanto a API processa. */
export function useBuild(gameId: string | null, buildId: string | null) {
  return useQuery({
    queryKey: queryKeys.build(gameId ?? '', buildId ?? ''),
    queryFn: () => get<BuildInfo>(`/games/${gameId}/builds/${buildId}`),
    enabled: !!gameId && !!buildId,
    refetchInterval: (query) => (query.state.data?.status === 'PROCESSING' ? 1000 : false),
  });
}

/** "Remover Plug-in" (e religar): o modelo sem telemetria não aceita build com o plug-in ligado. */
export function useLigarPlugin(gameId: string | null, buildId: string | null) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) => patch<BuildInfo>(`/games/${gameId}/builds/${buildId}/plugin`, { enabled }),
    onSuccess: (build) => client.setQueryData(queryKeys.build(build.gameId, build.id), build),
  });
}
