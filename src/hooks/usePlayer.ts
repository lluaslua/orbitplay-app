import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import type {
  Achievement,
  AvailableTest,
  Participation,
  PlayerDashboard,
  PlayerGameTest,
  PlayerSessionReview,
  SessionOutcome,
  SessionResult,
  SessionSubmission,
  GameAchievement,
  GameCommunity,
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
      client.invalidateQueries({ queryKey: queryKeys.playerCatalog });
      client.invalidateQueries({ queryKey: queryKeys.participations });
      client.invalidateQueries({ queryKey: queryKeys.playerDashboard });
    },
  });
}

/** Envia o formulario da sessao e devolve XP, nivel e conquistas (TELA 18 -> TELA 19). */
export function useSubmitSession() {
  const client = useQueryClient();
  const applyPlayerProgress = useAuthStore((state) => state.applyPlayerProgress);

  return useMutation({
    mutationFn: ({ testId, submission }: { testId: string; submission: SessionSubmission }) =>
      post<SessionResult>(`/player/tests/${testId}/submit`, submission),
    onSuccess: (result) => {
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
    },
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

/** Sessão gravada que o jogador vai avaliar (TELA 18). */
export function useSessionReview() {
  return useQuery({
    queryKey: ['player', 'session-review'],
    queryFn: () => get<PlayerSessionReview>('/player/session-review'),
  });
}

/** O que a sessão rendeu, para a tela de conclusão (TELA 19). */
export function useSessionOutcome() {
  return useQuery({
    queryKey: ['player', 'session-outcome'],
    queryFn: () => get<SessionOutcome>('/player/session-outcome'),
  });
}

/** Chat da aba "Comunidade" na tela do jogo (Figma `395:2656`). */
export function useGameCommunity(gameId: string | undefined) {
  return useQuery({
    queryKey: ['player', 'games', gameId, 'community'],
    queryFn: () => get<GameCommunity>(`/player/games/${gameId}/community`),
    enabled: !!gameId,
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
