import { Check, Pencil } from 'lucide-react';
import { cn } from '@/utils/helpers';

/**
 * Stepper do design system (Figma: prancha "11 Stepper", node 151:7310 —
 * componentes `Step` / `StepperOrder`).
 *
 * Valores do arquivo:
 *   Passo    coluna gap 4 · largura 141 (ou flex-1) · rótulo Montserrat 16 centrado, largura 132
 *   Linha    gap 12 entre separadores e círculo · separadores flex-1 com 3px de altura
 *   Círculo  32px · raio 100 · padding 2
 *     concluído  fundo #1FC16B + tick de 28px   · rótulo Bold #1FC16B
 *     atual      fundo #248FF7 + edit de 19.6px · rótulo Bold #248FF7
 *     pendente   borda 2px **tracejada** #E7E8E9, vazio · rótulo Regular #E7E8E9
 *
 * Nota: o arquivo usa aqui a coleção en (#248FF7 / #E7E8E9), não a do app
 * (#2563EB / #E5E5ED). Mantido como está desenhado.
 */
export type StepState = 'done' | 'current' | 'pending';

export interface StepItem {
  id: string | number;
  label: string;
}

function StepCircle({ state }: { state: StepState }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full p-0.5',
        state === 'done' && 'bg-orbit-success text-white',
        state === 'current' && 'bg-orbit-blue text-white',
        state === 'pending' && 'border-2 border-dashed border-orbit-dim',
      )}
    >
      {state === 'done' && <Check className="size-7" strokeWidth={2.5} />}
      {state === 'current' && <Pencil className="size-[19.6px]" />}
    </span>
  );
}

function StepSeparator({ filled, hidden }: { filled: boolean; hidden?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'h-[3px] min-w-px flex-1',
        hidden ? 'bg-transparent' : filled ? 'bg-orbit-success' : 'bg-orbit-dim',
      )}
    />
  );
}

export function Stepper({
  steps,
  current,
  className,
  onStepClick,
}: {
  steps: StepItem[];
  /** Índice do passo atual (base 0). */
  current: number;
  className?: string;
  onStepClick?: (index: number) => void;
}) {
  return (
    <ol className={cn('flex w-full items-start justify-center', className)}>
      {steps.map((step, index) => {
        const state: StepState =
          index < current ? 'done' : index === current ? 'current' : 'pending';
        const clickable = !!onStepClick && index <= current;

        return (
          <li
            key={step.id}
            className="flex min-w-px flex-1 flex-col items-center justify-center gap-1"
          >
            <div className="flex w-full items-center justify-center gap-3">
              <StepSeparator filled={index <= current} hidden={index === 0} />

              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className="rounded-full orbit-focus-ring"
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  <StepCircle state={state} />
                </button>
              ) : (
                <StepCircle state={state} />
              )}

              <StepSeparator filled={index < current} hidden={index === steps.length - 1} />
            </div>

            <span
              className={cn(
                'w-[132px] text-center text-[16px] leading-none',
                state === 'done' && 'font-bold text-orbit-success',
                state === 'current' && 'font-bold text-orbit-blue',
                state === 'pending' && 'font-normal text-orbit-dim',
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
