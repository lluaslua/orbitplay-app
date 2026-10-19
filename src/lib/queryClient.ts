import { QueryClient } from '@tanstack/react-query';

/** Chaves centralizadas: evita string solta e facilita invalidar o cache certo. */
export const queryKeys = {
  auth: ['auth'] as const,
  studioDashboard: ['studio', 'dashboard'] as const,
  studioTeam: ['studio', 'team'] as const,
  studioAccess: ['studio', 'access'] as const,
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
  /** Sessão do teste: a revisão antes do formulário e o resultado depois do envio. */
  sessionReview: (testId: string) => ['player', 'session-review', testId] as const,
  sessionOutcome: (testId: string) => ['player', 'session-outcome', testId] as const,
  /** A build do teste que o tester baixa no tutorial. */
  buildDoTeste: (testId: string) => ['player', 'build', testId] as const,
  /** A build enviada na etapa 3 do Novo teste. */
  build: (gameId: string, buildId: string) => ['builds', gameId, buildId] as const,
  /** Chat do jogo. Quem vê entra na chave: `own` e `reacted` mudam de pessoa para pessoa. */
  community: (gameId: string, viewerId: string) => ['community', gameId, viewerId] as const,
  communityMessages: (gameId: string, viewerId: string, channelId: string) =>
    ['community', gameId, viewerId, channelId] as const,
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
