import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/UI';
import { cn } from '@/utils/helpers';

/**
 * KPI do topo das dashboards.
 *
 * Segue o card e o "big-number" da prancha "20 Cards" (node 151:8369):
 *   card    branco · borda 1px #E5E5ED · raio 24 · padding 24 · gap 16
 *   rótulo  Ubuntu Regular 12 #111827
 *   valor   Ubuntu Bold 16 #111827
 *   variação seta 12px + Ubuntu Regular 12 — #1FC16B na alta, #D00416 na queda
 *   ícone do cabeçalho 24px, como o info-circle do arquivo
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = 'info',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: number;
  accent?: 'info' | 'success' | 'warning' | 'neutral';
}) {
  const accentClass = {
    info: 'text-orbit-info',
    success: 'text-orbit-success',
    warning: 'text-orbit-warning',
    neutral: 'text-orbit-heavy',
  }[accent];

  const up = (trend ?? 0) >= 0;

  return (
    <Card>
      <div className="flex w-full items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate font-label text-[12px] font-normal text-orbit-muted">
            {label}
          </span>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-label text-[16px] font-bold text-white">{value}</span>

            {trend !== undefined && (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-label text-[12px] font-normal',
                  up ? 'text-orbit-success' : 'text-orbit-error',
                )}
              >
                {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>

        <Icon className={cn('size-6 shrink-0', accentClass)} />
      </div>

      {hint && <p className="text-caption text-orbit-muted">{hint}</p>}
    </Card>
  );
}
