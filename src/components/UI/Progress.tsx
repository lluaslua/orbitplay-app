import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/utils/helpers';

/**
 * Barra de progresso (Figma: prancha "11 Stepper", componente `TimelineStepper`,
 * node 151:7315).
 *
 * Valores do arquivo: altura **6px**, trilho #585D68, preenchimento #248FF7.
 * O componente foi desenhado sobre fundo escuro; `surface="light"` mantém a
 * altura e troca o trilho pela rampa clara do app, para não pesar sobre o branco.
 */
export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
    surface?: 'light' | 'dark';
  }
>(({ className, value, indicatorClassName, surface = 'dark', ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-1.5 w-full overflow-hidden',
      surface === 'dark' ? 'bg-white/15' : 'bg-orbit-light',
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn('h-full w-full flex-1 bg-orbit-blue transition-transform duration-500', indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = 'Progress';

/** Barra com rótulo e valor — usada em XP, vagas e download da build. */
export function LabeledProgress({
  label,
  value,
  hint,
  indicatorClassName,
  surface,
}: {
  label: string;
  value: number;
  hint?: string;
  indicatorClassName?: string;
  surface?: 'light' | 'dark';
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-caption text-orbit-heavy">{label}</span>
        {hint && <span className="text-caption-bold text-white">{hint}</span>}
      </div>
      <Progress value={value} indicatorClassName={indicatorClassName} surface={surface} />
    </div>
  );
}
