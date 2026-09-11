import { cn } from '@/utils/helpers';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('orbit-skeleton', className)} {...props} />;
}

/** Placeholder de card usado nas listas de jogos/testes enquanto carrega. */
export function SkeletonCard() {
  return (
    <div className="orbit-card space-y-4 p-5">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="orbit-card space-y-3 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}
