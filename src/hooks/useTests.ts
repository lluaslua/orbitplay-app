import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import type { Playtest, TestDraft } from '@/types';

export function useTests(gameId?: string) {
  return useQuery({
    queryKey: queryKeys.tests(gameId),
    queryFn: () => get<Playtest[]>('/tests', gameId ? { gameId } : undefined),
  });
}

export function useTest(testId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.test(testId ?? ''),
    queryFn: () => get<Playtest>(`/tests/${testId}`),
    enabled: !!testId,
  });
}

/** Publica o rascunho do stepper (TELAS 06-10) como um teste ativo. */
export function useCreateTest() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (draft: TestDraft) =>
      post<Playtest>('/tests', {
        gameId: draft.gameId,
        model: draft.model,
        title: draft.title,
        instructions: draft.instructions,
        questions: draft.questions,
        requiresRecording: draft.requiresRecording,
        requiresMicrophone: draft.requiresMicrophone,
        requiresWebcam: draft.requiresWebcam,
        audience: draft.audience,
        budget: draft.budget,
        buildFileName: draft.buildFileName,
        buildSizeMb: draft.buildSizeMb,
      }),
    onSuccess: (test) => {
      client.invalidateQueries({ queryKey: ['tests'] });
      client.invalidateQueries({ queryKey: ['games'] });
      client.invalidateQueries({ queryKey: queryKeys.studioDashboard });
      client.invalidateQueries({ queryKey: queryKeys.playerCatalog });
      // A primeira build de um jogo abre o chat da comunidade dele.
      client.invalidateQueries({ queryKey: ['community'] });
      client.setQueryData(queryKeys.test(test.id), test);
    },
  });
}
