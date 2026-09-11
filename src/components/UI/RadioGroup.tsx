import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/utils/helpers';

/**
 * Radio do design system (Figma: prancha "15 Control", node `151:7737` — set
 * `Radio`, 4 variantes no eixo `State` × `Active`).
 *
 * O desenho não é borda + ponto: é um círculo **preenchido** de 24 com um miolo
 * branco por cima, e o que muda é o tamanho do miolo —
 *
 *   Active=False   fundo #C5C9CE · miolo branco 20  (sobra um anel de 2)
 *   Active=True    fundo #2563EB · miolo branco  8  (vira um ponto)
 *   Disabled+False fundo #E5E5ED
 *
 * Por isso o miolo é sempre o mesmo elemento, só encolhendo — sai de graça a
 * transição entre os dois estados.
 */
/*
 * As bases NÃO trazem cor de fundo nem tamanho de miolo: quem decide é o estado,
 * mais abaixo.
 *
 * A primeira versão punha `bg-orbit-medium` na base e sobrepunha
 * `bg-orbit-blue-deep` quando marcado, contando com o `twMerge` para remover a
 * primeira. Ele não removeu — não reconhece as duas como o mesmo grupo, por
 * serem cores próprias do projeto —, as duas classes ficavam no elemento e a
 * ordem do CSS decidia: o cinza vencia e o radio nunca pintava. Sem base
 * conflitante, não há o que deduplicar.
 */
const CIRCULO =
  'grid size-6 shrink-0 place-items-center rounded-full transition-colors orbit-focus-ring';
const MIOLO = 'rounded-full bg-white transition-all';

/**
 * Drop-in para `<input type="radio">`.
 *
 * As telas já tinham radios nativos com `name`/`checked`/`onChange`; este
 * componente mantém exatamente essa API e troca só o visual. O input continua
 * existindo (invisível) para o teclado, o leitor de tela e o agrupamento por
 * `name` seguirem funcionando de graça.
 */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, disabled, checked, ...props }, ref) => (
    <span className={cn('relative inline-grid place-items-center', className)}>
      <input
        ref={ref}
        type="radio"
        disabled={disabled}
        checked={checked}
        className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      {/*
        O estado vem da prop, não de `peer-checked:`.
        
        A primeira versão usava o seletor de irmão do CSS e não pintava: com o
        input controlado pelo React, o `:checked` não estava casando na folha de
        estilo. Ler a prop é determinístico e não depende da ordem dos nós.
      */}
      <span
        className={cn(
          CIRCULO,
          checked ? 'bg-orbit-blue-deep' : disabled ? 'bg-orbit-light' : 'bg-orbit-medium',
        )}
        aria-hidden
      >
        <span className={cn(MIOLO, checked ? 'size-2' : 'size-5')} />
      </span>
    </span>
  ),
);
Radio.displayName = 'Radio';

/** Versão Radix, para quando o grupo precisa de estado controlado por valor. */
export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2', className)} {...props} />
));
RadioGroup.displayName = 'RadioGroup';

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'group',
      CIRCULO,
      'bg-orbit-medium data-[state=checked]:bg-orbit-blue-deep disabled:cursor-not-allowed',
      className,
    )}
    {...props}
  >
    <span className={cn(MIOLO, 'size-5 group-data-[state=checked]:size-2')} />
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

/** Set `Radiobox with label`: o círculo com o rótulo ao lado, tudo clicável. */
export function RadioField({ id, value, label }: { id: string; value: string; label: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2">
      <RadioGroupItem id={id} value={value} />
      <span className="text-body text-white">{label}</span>
    </label>
  );
}
