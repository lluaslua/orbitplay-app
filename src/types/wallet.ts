/** Espelho de `orbitplay-api/src/contracts/wallet.ts`: a carteira do tester e o saque simulado. */
export type LedgerType = 'REWARD' | 'WITHDRAWAL' | 'ADJUSTMENT';

/** PENDING ainda não conta no saldo; AVAILABLE conta; CANCELED não conta mais. */
export type LedgerStatus = 'PENDING' | 'AVAILABLE' | 'CANCELED';

export type WithdrawalStatus = 'REQUESTED' | 'PAID' | 'REJECTED';

export interface WalletTransaction {
  id: string;
  type: LedgerType;
  status: LedgerStatus;
  /** Positivo entra, negativo sai. */
  amountCents: number;
  description: string;
  createdAt: string;
}

export interface WithdrawalInfo {
  id: string;
  amountCents: number;
  status: WithdrawalStatus;
  /** Mascarada pela API: só os últimos caracteres. */
  pixKey: string;
  note: string | null;
  createdAt: string;
  processedAt: string | null;
}

/** Se o saque pode ser pedido — e por que não — vem pronto da API: o app só habilita ou desabilita. */
export interface Wallet {
  balanceCents: number;
  pendingBalanceCents: number;
  minWithdrawalCents: number;
  /** Teto de saque em 24 h; a API é quem barra. */
  dailyLimitCents: number;
  canWithdraw: boolean;
  withdrawBlockedReason: string | null;
  transactions: WalletTransaction[];
  withdrawals: WithdrawalInfo[];
}

export interface WithdrawalRequest {
  amountCents: number;
  pixKey: string;
}
