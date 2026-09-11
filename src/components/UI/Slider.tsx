import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/utils/helpers';

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-orbit-border">
      <SliderPrimitive.Range className="absolute h-full bg-orbit-gradient" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-orbit-blue bg-white shadow-orbit transition-transform hover:scale-110 orbit-focus-ring disabled:pointer-events-none" />
  </SliderPrimitive.Root>
));
Slider.displayName = 'Slider';

/** Escala 1-5 usada nos formularios de avaliacao (TELA 18). */
export function ScaleInput({
  value,
  onChange,
  min = 1,
  max = 5,
  minLabel,
  maxLabel,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            aria-pressed={value === step}
            className={cn(
              'h-11 flex-1 rounded-lg border text-sm font-semibold transition-all orbit-focus-ring',
              value === step
                ? 'border-orbit-blue bg-orbit-blue text-white shadow-orbit'
                : 'border-orbit-border bg-orbit-card text-orbit-muted hover:border-orbit-blue/50 hover:text-orbit-text',
            )}
          >
            {step}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-orbit-muted">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
