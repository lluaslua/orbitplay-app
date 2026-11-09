import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { comChave, get, post } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import type { Wallet, WithdrawalInfo, WithdrawalRequest } from '@/types';

/** Enquanto há saque em análise a tela pergunta de novo a cada poucos segundos: o Pix simulado confirma sozinho. */
const INTERVALO_SAQUE_MS = 3000;

/** A carteira do tester (TELA 13): saldo, saques e extrato. */
export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: () => get<Wallet>('/player/wallet'),
    refetchInterval: (query) =>
      query.state.data?.withdrawals.some((saque) => saque.status === 'REQUESTED') ? INTERVALO_SAQUE_MS : false,
  });
}

/**
 * Pede o saque. A `chave` é a `Idempotency-Key`: repetir o pedido com a mesma
 * chave (rede que falhou, duplo clique) devolve o mesmo saque em vez de sacar duas vezes.
 */
export function useRequestWithdrawal() {
  const client = useQueryClient();
  const applyPlayerProgress = useAuthStore((state) => state.applyPlayerProgress);

  return useMutation({
    mutationFn: ({ amountCents, pixKey, chave }: WithdrawalRequest & { chave: string }) =>
      post<WithdrawalInfo>('/player/withdrawals', { amountCents, pixKey }, comChave(`saque:${chave}`)),
    onSuccess: (saque) => {
      // O valor sai do saldo no pedido: o header acompanha sem esperar a próxima consulta.
      applyPlayerProgress({ balanceDelta: -saque.amountCents });
      client.invalidateQueries({ queryKey: queryKeys.wallet });
      client.invalidateQueries({ queryKey: queryKeys.playerDashboard });
    },
  });
}
