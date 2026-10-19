import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { comChave, get, post } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import type { PaymentMethod, PaymentOrder, Playtest, TestDraft } from '@/types';

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

/**
 * Cria o teste do rascunho do stepper (TELAS 06-10). Ele nasce DRAFT na API e
 * só vira ACTIVE depois do pagamento (`usePagarTeste`). Título vazio a API
 * completa com "<modelo> — <jogo>"; o preço ela recalcula.
 */
export function useCreateTest() {
  return useMutation({
    mutationFn: ({ draft, chave }: { draft: TestDraft; chave: string }) =>
      post<Playtest>(
        '/tests',
        {
          gameId: draft.gameId,
          model: draft.model,
          title: draft.title,
          instructions: draft.instructions,
          questions: draft.questions,
          requiresRecording: draft.requiresRecording,
          requiresMicrophone: draft.requiresMicrophone,
          requiresWebcam: draft.requiresWebcam,
          requiresController: draft.requiresController,
          audience: draft.audience,
          budget: draft.budget,
          buildId: draft.buildId,
        },
        comChave(`${chave}:teste`),
      ),
  });
}

/**
 * "Pagar e finalizar!": o checkout do teste. No sandbox da API o pedido sai
 * pago na hora e o teste é publicado; pedir de novo devolve o mesmo pedido.
 */
export function usePagarTeste() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, method, chave }: { testId: string; method: PaymentMethod; chave: string }) =>
      post<PaymentOrder>(`/tests/${testId}/checkout`, { method }, comChave(`${chave}:pagamento`)),
    onSuccess: (pedido) => {
      client.invalidateQueries({ queryKey: ['tests'] });
      client.invalidateQueries({ queryKey: ['games'] });
      client.invalidateQueries({ queryKey: queryKeys.studioDashboard });
      client.invalidateQueries({ queryKey: queryKeys.playerCatalog });
      // O primeiro teste publicado de um jogo abre o chat da comunidade dele.
      client.invalidateQueries({ queryKey: ['community'] });
      client.invalidateQueries({ queryKey: queryKeys.test(pedido.testId) });
    },
  });
}
