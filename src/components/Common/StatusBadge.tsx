import { Badge, type BadgeProps } from '@/components/UI';
import type { GameStatus, ParticipationStatus, RewardStatus, TestStatus } from '@/types';
import {
  GAME_STATUS_LABELS,
  PARTICIPATION_STATUS_LABELS,
  REWARD_STATUS_LABELS,
  TEST_STATUS_LABELS,
} from '@/utils/constants';

type Variant = BadgeProps['variant'];

const GAME_VARIANTS: Record<GameStatus, Variant> = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  PAUSED: 'outline',
  ARCHIVED: 'neutral',
};

const TEST_VARIANTS: Record<TestStatus, Variant> = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  FULL: 'info',
  PROCESSING: 'info',
  FINISHED: 'neutral',
  PAUSED: 'outline',
};

const PARTICIPATION_VARIANTS: Record<ParticipationStatus, Variant> = {
  AVAILABLE: 'info',
  IN_PROGRESS: 'dark',
  PENDING_REVIEW: 'warning',
  COMPLETED: 'success',
  UNAVAILABLE: 'neutral',
  REJECTED: 'error',
};

const REWARD_VARIANTS: Record<RewardStatus, Variant> = {
  PENDING: 'warning',
  VALIDATED: 'dark',
  PAID: 'success',
  REJECTED: 'error',
};


export const GameStatusBadge = ({ status }: { status: GameStatus }) => (
  <Badge variant={GAME_VARIANTS[status]}>{GAME_STATUS_LABELS[status]}</Badge>
);

export const TestStatusBadge = ({ status }: { status: TestStatus }) => (
  <Badge variant={TEST_VARIANTS[status]}>{TEST_STATUS_LABELS[status]}</Badge>
);

export const ParticipationStatusBadge = ({ status }: { status: ParticipationStatus }) => (
  <Badge variant={PARTICIPATION_VARIANTS[status]}>{PARTICIPATION_STATUS_LABELS[status]}</Badge>
);

export const RewardStatusBadge = ({ status }: { status: RewardStatus }) => (
  <Badge variant={REWARD_VARIANTS[status]}>{REWARD_STATUS_LABELS[status]}</Badge>
);

