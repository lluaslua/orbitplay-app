import { Link } from 'react-router-dom';
import { Clock, Coins, Users, Video } from 'lucide-react';
import { Badge, Button, Card } from '@/components/UI';
import { ParticipationStatusBadge } from '@/components/Common/StatusBadge';
import type { AvailableTest } from '@/types';
import { PARTICIPATION_STATUS_LABELS, ROUTES } from '@/utils/constants';
import { daysUntil, formatCurrency, percent } from '@/utils/helpers';

/** Card de teste do catálogo do jogador (TELAS 13 e 14). */
export function TestCard({ test }: { test: AvailableTest }) {
  const slotsLeft = Math.max(0, test.slotsTotal - test.slotsTaken);
  const unavailable = test.status === 'UNAVAILABLE' || test.status === 'REJECTED';
  const done = test.status === 'COMPLETED' || test.status === 'PENDING_REVIEW';

  return (
    <Card className="h-full justify-between">
      <div className="space-y-3">
        {/* Capa */}
        <div className="relative h-32 overflow-hidden rounded-xl bg-orbit-grey-dark">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.5),transparent_60%)]" />
          <span className="absolute bottom-2 right-3 font-label text-[24px] font-bold text-white/30">
            {test.gameName
              .split(' ')
              .slice(0, 2)
              .map((word) => word[0])
              .join('')}
          </span>
          <span className="absolute left-3 top-3">
            <ParticipationStatusBadge status={test.status} />
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="truncate text-subtitle text-white">{test.gameName}</h3>
          <p className="text-caption text-orbit-muted">
            {test.studioName} · {test.modelLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {test.genres.map((genre) => (
            <Badge key={genre} variant="outline" size="sm">
              {genre}
            </Badge>
          ))}
          {test.requiresRecording && (
            <Badge variant="info" size="sm">
              <Video className="size-4" />
              Grava a tela
            </Badge>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-2 border-t border-orbit-border pt-3 text-center">
          <div>
            <dt className="text-caption text-orbit-muted">Duração</dt>
            <dd className="inline-flex items-center gap-1 font-label text-[14px] font-bold text-white">
              <Clock className="size-3.5" />
              {test.estimatedMinutes}m
            </dd>
          </div>
          <div>
            <dt className="text-caption text-orbit-muted">Recompensa</dt>
            <dd className="inline-flex items-center gap-1 font-label text-[14px] font-bold text-orbit-success">
              <Coins className="size-3.5" />
              {formatCurrency(test.rewardCents)}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-orbit-muted">Vagas</dt>
            <dd className="inline-flex items-center gap-1 font-label text-[14px] font-bold text-white">
              <Users className="size-3.5" />
              {slotsLeft}
            </dd>
          </div>
        </dl>

        {/* Ocupação das vagas */}
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-orbit-light">
            <div
              className="h-full rounded-full bg-orbit-blue transition-all"
              style={{ width: `${percent(test.slotsTaken, test.slotsTotal)}%` }}
            />
          </div>
          <p className="text-caption text-orbit-muted">
            {test.slotsTaken} de {test.slotsTotal} vagas preenchidas · expira em{' '}
            {daysUntil(test.expiresAt)} dias
          </p>
        </div>
      </div>

      <Button asChild={!unavailable} disabled={unavailable} block className="mt-2">
        {unavailable ? (
          <span>Indisponível</span>
        ) : (
          <Link to={done ? ROUTES.player.game(test.gameId) : ROUTES.player.tutorial(test.testId)}>
            {PARTICIPATION_STATUS_LABELS[test.status]}
          </Link>
        )}
      </Button>
    </Card>
  );
}
