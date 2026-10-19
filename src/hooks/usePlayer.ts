import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { comChave, get, post } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import type {
  Achievement,
  AvailableTest,
  BuildDownloadInfo,
  ConsentPayload,
  SessionEventInput,
  Participation,
  PlayerDashboard,
  PlayerGameTest,
  PlayerSessionReview,
  SessionOutcome,
  SessionResult,
  SessionSubmission,
  GameAchievement,
  PlayerGameHistory,
} from '@/types';

export function usePlayerDashboard() {
  return useQuery({
    queryKey: queryKeys.playerDashboard,
    queryFn: () => get<PlayerDashboard>('/player/dashboard'),
  });
}

export function usePlayerCatalog() {
  return useQuery({
    queryKey: queryKeys.playerCatalog,
    queryFn: () => get<AvailableTest[]>('/player/catalog'),
  });
}

export function useParticipations() {
  return useQuery({
    queryKey: queryKeys.participations,
    queryFn: () => get<Participation[]>('/player/participations'),
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.achievements,
    queryFn: () => get<Achievement[]>('/player/achievements'),
  });
}

/** Reserva a vaga do jogador no teste (TELA 16 -> TELA 17). */
export function useStartTest() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (testId: string) => post<Participation>(`/player/tests/${testId}/start`),
    onSuccess: () => {
      // A linha do teste na tela do jogo passa de "Começar!" para "Continuar!".
      client.invalidateQueries({ queryKey: ['player', 'games'] });
      client.invalidateQueries({ queryKey: queryKeys.playerCatalog });
      client.invalidateQueries({ queryKey: queryKeys.participations });
      client.invalidateQueries({ queryKey: queryKeys.playerDashboard });
      // Participar de um teste abre para o jogador o chat da comunidade do jogo.
      client.invalidateQueries({ queryKey: ['community'] });
    },
  });
}

/**
 * Envia o formulario da sessao e devolve XP, nivel e conquistas (TELA 18 -> TELA 19).
 * Um segundo envio da mesma participacao devolve o resultado do primeiro.
 */
export function useSubmitSession() {
  const client = useQueryClient();
  const applyPlayerProgress = useAuthStore((state) => state.applyPlayerProgress);

  return useMutation({
    mutationFn: ({ testId, submission }: { testId: string; submission: SessionSubmission }) =>
      post<SessionResult>(
        `/player/tests/${testId}/submit`,
        submission,
        comChave(`envio:${submission.participationId}`),
      ),
    onSuccess: (result, { testId }) => {
      // Mantem o header (XP, nivel, saldo) em sincronia com o resultado da sessao.
      applyPlayerProgress({
        xp: result.newXp,
        level: result.newLevel,
        pendingBalanceDelta: result.rewardCents,
        completedSessionsDelta: 1,
      });

      client.invalidateQueries({ queryKey: queryKeys.playerDashboard });
      client.invalidateQueries({ queryKey: queryKeys.participations });
      client.invalidateQueries({ queryKey: queryKeys.playerCatalog });
      client.invalidateQueries({ queryKey: queryKeys.achievements });
      client.invalidateQueries({ queryKey: ['player', 'games'] });
      client.invalidateQueries({ queryKey: queryKeys.sessionReview(testId) });
      client.invalidateQueries({ queryKey: queryKeys.sessionOutcome(testId) });
    },
  });
}

/** A build do teste em que o jogador entrou: nome, tamanho, hash e o caminho do download (TELA 16). */
export function useBuildDoTeste(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.buildDoTeste(testId ?? ''),
    queryFn: () => get<BuildDownloadInfo>(`/player/tests/${testId}/build`),
    enabled: !!testId,
    retry: false,
  });
}

/** "Iniciar Jogo!" aceita o que o teste exige (gravação, microfone, webcam) antes da sessão. */
export function useConsentimento() {
  return useMutation({
    mutationFn: ({ participationId, consentimento }: { participationId: string; consentimento: ConsentPayload }) =>
      post<{ consentAt: string }>(`/player/participations/${participationId}/consent`, consentimento),
  });
}

/** Eventos da sessão com o segundo em que aconteceram: microfone, webcam, bugs (TELA 17). */
export function useEventosDaSessao() {
  return useMutation({
    mutationFn: ({ participationId, events }: { participationId: string; events: SessionEventInput[] }) =>
      post<{ received: number }>(`/player/participations/${participationId}/events`, { events }),
  });
}

/** Testes de um jogo na visão do jogador (TELA 15). */
export function usePlayerGameTests(gameId: string | undefined) {
  return useQuery({
    queryKey: ['player', 'games', gameId, 'tests'],
    queryFn: () => get<PlayerGameTest[]>(`/player/games/${gameId}/tests`),
    enabled: !!gameId,
  });
}

/** A sessão do teste que o jogador vai avaliar, com as perguntas do estúdio (TELA 18). */
export function useSessionReview(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessionReview(testId ?? ''),
    queryFn: () => get<PlayerSessionReview>('/player/session-review', { testId }),
    enabled: !!testId,
  });
}

/** O que a sessão do teste rendeu, para a tela de conclusão (TELA 19). */
export function useSessionOutcome(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessionOutcome(testId ?? ''),
    queryFn: () => get<SessionOutcome>('/player/session-outcome', { testId }),
    enabled: !!testId,
  });
}

/** Aba "Conquistas" da tela do jogo (Figma `224:6222`). */
export function useGameAchievements(gameId: string | undefined) {
  return useQuery({
    queryKey: ['player', 'games', gameId, 'achievements'],
    queryFn: () => get<GameAchievement[]>(`/player/games/${gameId}/achievements`),
    enabled: !!gameId,
  });
}

/** Aba "Meus testes" da tela do jogo (Figma `224:5627`). */
export function useGameHistory(gameId: string | undefined) {
  return useQuery({
    queryKey: ['player', 'games', gameId, 'history'],
    queryFn: () => get<PlayerGameHistory[]>(`/player/games/${gameId}/history`),
    enabled: !!gameId,
  });
}
