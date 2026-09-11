import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import type { PluginReport, Session, SessionDetail, StudioDashboard, TestReport } from '@/types';

export function useStudioDashboard() {
  return useQuery({
    queryKey: queryKeys.studioDashboard,
    queryFn: () => get<StudioDashboard>('/studio/dashboard'),
  });
}

export function useReport(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.report(testId ?? ''),
    queryFn: () => get<TestReport>(`/reports/${testId}`),
    enabled: !!testId,
  });
}

/** Relatório do plug-in de telemetria (TELA 13). */
export function usePluginReport(testId: string | undefined) {
  return useQuery({
    queryKey: ['reports', testId, 'plugin'],
    queryFn: () => get<PluginReport>(`/reports/${testId}/plugin`),
    enabled: !!testId,
  });
}

export function useSessions(testId?: string) {
  return useQuery({
    queryKey: queryKeys.sessions(testId),
    queryFn: () => get<Session[]>('/sessions', testId ? { testId } : undefined),
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.session(sessionId ?? ''),
    queryFn: () => get<Session>(`/sessions/${sessionId}`),
    enabled: !!sessionId,
  });
}

/** Detalhamento de uma sessão dentro do relatório (TELA 12). */
export function useSessionDetail(testId: string | undefined, sessionId: string | undefined) {
  return useQuery({
    queryKey: ['reports', testId, 'sessions', sessionId],
    queryFn: () => get<SessionDetail>(`/reports/${testId}/sessions/${sessionId}`),
    enabled: !!testId && !!sessionId,
  });
}
