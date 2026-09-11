import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Button } from './Button';

/** Estado vazio padrao das listas (jogos, testes, sessoes, usuarios). */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-orbit-border bg-orbit-card px-6 py-14 text-center',
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-white/10 text-orbit-blue">
        <Icon className="size-7" />
      </span>
      <h3 className="text-h4 text-white">{title}</h3>
      {description && <p className="max-w-md text-small text-orbit-muted">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/** Erro de carregamento com opcao de tentar de novo. */
export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-orbit-error/40 bg-orbit-error/5 px-6 py-12 text-center">
      <h3 className="text-h4 text-orbit-error">{title}</h3>
      {description && <p className="max-w-md text-small text-orbit-muted">{description}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-2" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
