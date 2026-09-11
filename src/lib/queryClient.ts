import { QueryClient } from '@tanstack/react-query';

/** Chaves centralizadas: evita string solta e facilita invalidar o cache certo. */
export const queryKeys = {
  auth: ['auth'] as const,
  studioDashboard: ['studio', 'dashboard'] as const,
  games: (studioId?: string) => ['games', studioId ?? 'all'] as const,
  game: (id: string) => ['games', id] as const,
  tests: (gameId?: string) => ['tests', gameId ?? 'all'] as const,
  test: (id: string) => ['tests', id] as const,
  report: (testId: string) => ['reports', testId] as const,
  sessions: (testId?: string) => ['sessions', testId ?? 'all'] as const,
  session: (id: string) => ['sessions', 'detail', id] as const,
  playerDashboard: ['player', 'dashboard'] as const,
  playerCatalog: ['player', 'catalog'] as const,
  participations: ['player', 'participations'] as const,
  achievements: ['player', 'achievements'] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
