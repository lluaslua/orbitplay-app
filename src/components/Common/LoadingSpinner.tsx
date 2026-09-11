import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

export function LoadingSpinner({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Loader2
      className={cn('animate-spin text-orbit-blue', className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

/** Ocupa a area util enquanto a rota carrega. */
export function PageLoader({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <LoadingSpinner size={32} />
      <p className="text-small text-orbit-muted">{label}</p>
    </div>
  );
}

/** Tela cheia - usada no boot do app, antes do router montar. */
export function FullScreenLoader() {
  return (
    <div className="grid min-h-full place-items-center bg-orbit-bg bg-orbit-radial">
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid size-16 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-orbit-blue/30" />
          <span className="relative grid size-12 place-items-center rounded-full bg-orbit-gradient text-xl font-bold text-white">
            O
          </span>
        </div>
        <p className="text-small text-orbit-muted">Iniciando OrbitPlay...</p>
      </div>
    </div>
  );
}
