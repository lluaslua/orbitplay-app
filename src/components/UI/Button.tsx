import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

/**
 * Botão do design system (Figma: prancha "03 Button", node `151:6206` — sets
 * `Button`, `IconButton` e `Link`).
 *
 * Os eixos do arquivo viram props: `Size` → `size`, `Style` → `variant`. O eixo
 * `State` não vira prop — `Hover` é `hover:` e `Disabled` é o atributo.
 *
 * Medidas exatas dos sets:
 *
 *   Button      Large  h48 · px 28 · py 12 · raio 12 · gap 8
 *               Small  h36 · px 12 · py  7 · raio  8 · gap 8
 *   IconButton  Large 48/raio 12 · Medium 40/raio 8 · Small 36/raio 8 · pad 8
 *   Link        texto #2563EB · gap 4 (hover 8) · disabled #C5C9CE
 *
 *   Primary    #2563EB → hover #0D3388
 *   Secundary  borda #111827 → hover borda e texto #8A8D91
 *   Tertiary   #F1F5F9   ·  Colored #FBE6E8
 *   Disabled   fundo #E5E5ED · texto #C5C9CE (vale para todos os estilos)
 *
 * **Onde a prancha e as telas divergem.** A prancha é de fundo claro e só tem
 * azul chapado; as telas do app são escuras e usam os CTAs de marca em degradê.
 * Os dois convivem aqui: `primary`/`secondary` são a prancha, e `flame`,
 * `nightfall` e `action` são os preenchimentos que os frames das telas usam,
 * sempre com `shadow-bevel` (o `inset -2px -2px 1px` do arquivo).
 *
 * O raio do tamanho `lg` segue as telas (8), não a prancha (12) — os CTAs do
 * app são desenhados assim em todos os frames.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-bold transition-colors duration-150 orbit-focus-ring',
    // Disabled é um estado próprio no arquivo: fundo e texto fixos, sem borda.
    'disabled:pointer-events-none disabled:border-transparent disabled:bg-orbit-light disabled:text-orbit-medium',
  ],
  {
    variants: {
      variant: {
        /** Prancha, `Style=Primary`. */
        primary: 'bg-orbit-blue-deep text-white hover:bg-orbit-blue-dark',
        /** Prancha, `Style=Secundary` — no escuro a borda é branca, não #111827. */
        secondary:
          'border-2 border-white text-white hover:border-orbit-heavy hover:text-orbit-heavy',
        /** Prancha, `Style=Tertiary`: sem caixa até o hover. */
        tertiary: 'text-white hover:bg-white/10',
        /** Chip claro dos botões de ação das tabelas e da exportação. */
        dim: 'bg-orbit-dim text-orbit-dark shadow-bevel',
        /** Só contorno, como os botões de exportar do relatório. */
        outline: 'border border-orbit-border text-white',

        // --- Preenchimentos de marca, vindos dos frames das telas ------------
        /** Laranja: "Novo teste", "Baixar plug-in". */
        flame: 'bg-orbit-flame text-white shadow-bevel',
        /** Azul→roxo: "Relatório", "Configurar Orbit Plug-in". */
        nightfall: 'bg-orbit-nightfall text-white shadow-bevel',
        /** Roxo→azul deitado: botões de linha de tabela. */
        action: 'bg-orbit-action-wide text-white shadow-bevel',

        /** Set `Link`: sem caixa. */
        link: 'text-orbit-blue hover:underline',
      },
      size: {
        lg: 'h-12 rounded-lg px-8 text-button [&_svg]:size-6',
        md: 'h-10 rounded-lg px-5 text-button [&_svg]:size-5',
        sm: 'h-9 rounded-lg px-3 text-button [&_svg]:size-5',
      },
      /** Set `IconButton`: quadrado, sem padding lateral. */
      iconOnly: { true: 'aspect-square px-0', false: '' },
      block: { true: 'w-full', false: '' },
    },
    compoundVariants: [
      // O link não tem caixa: ignora altura, padding e raio do tamanho.
      { variant: 'link', class: 'h-auto gap-1 rounded-none px-0 disabled:bg-transparent' },
      { variant: 'link', iconOnly: true, class: 'aspect-auto' },
    ],
    defaultVariants: { variant: 'primary', size: 'lg', iconOnly: false, block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      iconOnly,
      block,
      asChild = false,
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, iconOnly, block }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

/**
 * Set `IconButton` da mesma prancha: quadrado, só o ícone.
 *
 * Existe como componente próprio porque o par "quadrado + `aria-label`" se
 * repete dezenas de vezes nas telas (o `⋮` das tabelas, os botões de exportar),
 * e sem rótulo visível o `aria-label` deixa de ser opcional — aqui ele é
 * obrigatório pelo tipo.
 */
export interface IconButtonProps extends Omit<ButtonProps, 'iconOnly' | 'block' | 'children'> {
  'aria-label': string;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'dim', size = 'sm', ...props }, ref) => (
    <Button ref={ref} variant={variant} size={size} iconOnly {...props} />
  ),
);
IconButton.displayName = 'IconButton';

export { buttonVariants };
