import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/utils/helpers';

/**
 * Checkbox do design system (Figma: prancha "16 Control", node 151:7737;
 * o mesmo componente aparece na prancha Table, node 151:7789/151:7791).
 *
 * Valores do arquivo:
 *   Caixa 24px · raio **8px** (não é circular nem 4px)
 *   Desmarcado  fundo branco · borda 2px #C5C9CE
 *   Marcado     fundo #2563EB · tick branco
 *   Desabilitado usa a rampa Claro/Médio
 */
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex size-6 shrink-0 items-center justify-center rounded-lg border-2 border-white/25 bg-white/5 transition-colors orbit-focus-ring',
      'disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5',
      'data-[state=checked]:border-orbit-blue data-[state=checked]:bg-orbit-blue data-[state=checked]:text-white',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="size-4" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';

/** Checkbox + texto clicável, com área de toque grande. */
export function CheckboxField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border-2 border-orbit-border bg-white/5 p-3 transition-colors',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-white/30',
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <span className="space-y-0.5">
        <span className="block text-graphic font-bold text-white">{label}</span>
        {description && <span className="block text-caption text-orbit-heavy">{description}</span>}
      </span>
    </label>
  );
}
