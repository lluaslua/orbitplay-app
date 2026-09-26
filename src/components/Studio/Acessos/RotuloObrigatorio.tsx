import type { ReactNode } from 'react';
import { cn } from '@/utils/helpers';

/** Rótulo de campo obrigatório com o asterisco em vermelho, como os dois formulários de acesso desenham. */
export function RotuloObrigatorio({
  texto,
  className,
  children,
}: {
  texto: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-body-bold text-white">
        {texto}
        <span className="text-orbit-error-l">*</span>
      </span>
      {children}
    </div>
  );
}
