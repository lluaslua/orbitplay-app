export type ParticipationStatus =
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'UNAVAILABLE'
  | 'REJECTED';

export type RewardStatus = 'PENDING' | 'VALIDATED' | 'PAID' | 'REJECTED';

/** Card do catalogo de testes do jogador (TELA 14). */
export interface AvailableTest {
  id: string;
  testId: string;
  gameId: string;
  gameName: string;
  studioName: string;
  thumbnailUrl: string;
  genres: string[];
  modelLabel: string;
  estimatedMinutes: number;
  rewardCents: number;
  slotsTotal: number;
  slotsTaken: number;
  expiresAt: string;
  status: ParticipationStatus;
  requiresRecording: boolean;
}

export interface Participation {
  id: string;
  testId: string;
  gameId: string;
  gameName: string;
  thumbnailUrl: string;
  status: ParticipationStatus;
  rewardCents: number;
  rewardStatus: RewardStatus;
  xpEarned: number;
  startedAt?: string;
  finishedAt?: string;
  durationSeconds?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  unlockedAt?: string;
}

export interface PlayerEarningPoint {
  label: string;
  amountCents: number;
  sessions: number;
}

/**
 * O que a sessão rendeu — Figma `287:5085`.
 *
 * Cada bloco vira um dos quatro cards da tela de conclusão, e as `lines` são a
 * memória de cálculo que o arquivo mostra acima do número.
 */
export interface SessionOutcome {
  gameId: string;
  gameName: string;
  achievements: { id: string; name: string; description: string }[];
  feedbackQuality: { total: number; lines: string[] };
  level: { from: number; to: number; gainedXp: number; progress: number; lines: string[] };
  reward: { totalCents: number; lines: string[] };
}

/**
 * Sessão gravada que o jogador avalia — Figma `235:7874`.
 *
 * A transcrição vem com o minuto de cada fala, como o arquivo desenha.
 */
export interface PlayerSessionReview {
  id: string;
  gameId: string;
  testName: string;
  testKind: string;
  rewardCents: number;
  testsDone: number;
  transcript: { at: string; text: string }[];
}

/**
 * Estado da coluna "Ações" na tela de detalhes do jogo (Figma `199:1291`).
 *
 * Só `START` e `CONTINUE` viram botão; os outros três são texto, porque não há
 * nada para o jogador clicar naquele momento.
 */
export type PlayerTestAction = 'START' | 'CONTINUE' | 'REVIEW' | 'DOWNLOADING' | 'UNAVAILABLE';

/** Linha da tabela "Testes disponíveis" de um jogo. */
export interface PlayerGameTest {
  id: string;
  name: string;
  /** Texto da tag de tipo: "DEMO ABERTA", "A/B", "Qualitativo". */
  kind: string;
  kindTone: 'topaz' | 'amethyst' | 'sapphire';
  expiresAt: string;
  estimatedMinutes: number;
  slotsTaken: number;
  slotsTotal: number;
  /** 0 a 1. */
  progress: number;
  rewardCents: number;
  /** Recompensa em destaque, com seta — o teste paga acima da média. */
  boosted?: boolean;
  action: PlayerTestAction;
}

/** Uma pista do teste em andamento, com progresso e recompensa. */
export interface PlayerTrack {
  id: string;
  name: string;
  /** 0 a 1. */
  progress: number;
  rewardCents: number;
}

/**
 * Home do jogador — Figma `197:496`.
 *
 * Cada bloco corresponde a uma seção desenhada: o teste em andamento, os jogos
 * em destaque, o resumo de ganhos, o card de missões e ranking, e "Meus testes".
 */
export interface PlayerDashboard {
  ongoing: { gameId: string; tracks: PlayerTrack[] } | null;
  featuredGameIds: string[];
  earnings: {
    last7DaysCents: number;
    totalCents: number;
    nextPayoutDays: number;
    series: { label: string; cents: number }[];
  };
  missions: {
    rankPosition: number;
    /** Quantas posições subiu — a setinha verde ao lado do ranking. */
    rankDelta: number;
    pending: number;
    nextGoalCents: number;
    /** Fatias da rosca, por gênero. */
    genres: { label: string; value: number }[];
  };
  /** "Meus testes" — mesmo formato das linhas do benchmark do estúdio. */
  myTests: { id: string; name: string; progress: number; rewardCents: number }[];
}

/** Payload enviado ao concluir a sessao (TELA 18 -> TELA 19). */
export interface SessionSubmission {
  participationId: string;
  answers: Record<string, string | number | string[] | boolean>;
  bugsReported: number;
  durationSeconds: number;
}

export interface SessionResult {
  participationId: string;
  xpEarned: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  rewardCents: number;
  rewardStatus: RewardStatus;
  unlockedAchievements: Achievement[];
  feedbackQuality: number;
}

/**
 * Chat da aba "Comunidade" na tela do jogo — Figma `395:2656`.
 *
 * A cor do anel do avatar e a do selo vêm do papel de quem fala: verde para o
 * desenvolvedor do jogo, vermelho para QA, roxo para o próprio jogador.
 */
export type ChatRole = 'DEV' | 'QA' | 'ELITE';

export interface ChatMessage {
  id: string;
  author: string;
  role: ChatRole;
  avatarUrl: string;
  text: string;
  sentAt: string;
  /** `true` no que o próprio jogador escreveu: balão azul, alinhado à direita. */
  own: boolean;
}

export interface GameCommunity {
  channels: string[];
  /** Canal aberto no desenho. */
  selected: string;
  messages: ChatMessage[];
}

/**
 * Linha da aba "Meus testes" — Figma `224:5627`.
 *
 * Mesma tabela dos testes disponíveis, mas olhando para trás: a coluna de ação
 * deixa de ser botão e vira o estado do que já foi entregue, e o prazo pode ter
 * vencido.
 */
export interface PlayerGameHistory {
  id: string;
  name: string;
  kind: string;
  kindTone: 'topaz' | 'amethyst' | 'sapphire';
  /** `null` quando já venceu — a tabela mostra "EXPIRADO". */
  expiresAt: string | null;
  estimatedMinutes: number;
  slotsTaken: number;
  slotsTotal: number;
  /** 0 a 1. */
  progress: number;
  rewardCents: number;
  /** Texto da coluna Ações: "Completo!" ou "Completo! (Em análise)". */
  status: string;
}

/** Um item da aba "Conquistas" na tela do jogo — Figma `224:6222`. */
export interface GameAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Bloqueada: ladrilho escuro com cadeado, em vez do degradê. */
  locked: boolean;
}
