import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

/**
 * Tag / Badge do design system (Figma: prancha "12 Tag", node 151:7038 — `BadgeTag`).
 *
 * Pílula `rounded-[40px]`, tipografia **Ubuntu Bold** (não Montserrat).
 *   Small   px 8  · py 4  · gap 4 · texto 10/1.7 · ícone 16
 *   Medium  px 12 · py 8  · gap 8 · texto 12/18  · ícone 16
 *   Large   px 16 · py 12 · gap 8 · texto 14/22  · ícone 20
 *
 * Cores do arquivo (fundo / texto):
 *   Blue    #E8EDF9 / #1248C1      Green  #E9F9F1 / #1FC16B
 *   Red     #FBE6E8 / #D00416      Orange #FCF8E6 / #DFB400
 *   Grey    #E5E5ED / #8A8D91      Black  #0F172A / branco
 *   Mint    #27A081 / #05D3AA      Outline borda 2px #E5E5ED / #C5C9CE
 */
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-[40px] font-label whitespace-nowrap',
  {
    variants: {
      variant: {
        info: 'bg-orbit-info-bg text-orbit-info',
        success: 'bg-orbit-success-bg text-orbit-success',
        error: 'bg-orbit-error-bg text-orbit-error',
        warning: 'bg-orbit-warning-bg text-orbit-warning',
        neutral: 'bg-orbit-light text-orbit-heavy',
        dark: 'bg-orbit-grey-dark text-white',
        mint: 'bg-[#27A081] text-[#05D3AA]',
        outline: 'border-2 border-orbit-light text-orbit-medium',
      },
      size: {
        sm: 'gap-1 px-2 py-1 text-label-xs [&_svg]:size-4',
        md: 'gap-2 px-3 py-2 text-label-m [&_svg]:size-4',
        lg: 'gap-2 px-4 py-3 text-title-s [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

/**
 * AlertDot — contador de notificação (mesma prancha, componente `AlertDot`).
 *   Default  círculo 10px, sem número
 *   Número   16px com o valor centralizado
 *   9+       24×16 quando passa de 9
 * Sempre com borda branca de 1px, para destacar sobre qualquer fundo.
 */
const ALERT_TONES = {
  urgent: 'bg-orbit-error', // #D00416
  newness: 'bg-orbit-info', // #1248C1
  updates: 'bg-orbit-success', // #1FC16B
  alerts: 'bg-orbit-warning', // #DFB400
} as const;

export function AlertDot({
  tone = 'urgent',
  count,
  className,
}: {
  tone?: keyof typeof ALERT_TONES;
  count?: number;
  className?: string;
}) {
  const hasCount = typeof count === 'number' && count > 0;
  const overflow = hasCount && count > 9;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[50px] border border-white font-label text-white',
        ALERT_TONES[tone],
        !hasCount && 'size-2.5',
        hasCount && !overflow && 'size-4 px-[3px] py-px text-[12px] leading-none',
        overflow && 'h-4 w-6 text-[10px] font-bold leading-none',
        className,
      )}
      aria-label={hasCount ? `${count} notificações` : 'Notificações'}
    >
      {overflow ? '9+' : hasCount ? count : null}
    </span>
  );
}

/** Bolinha + rótulo, para status em tabelas. */
export function StatusDot({
  variant = 'neutral',
  label,
}: {
  variant?: BadgeProps['variant'];
  label: string;
}) {
  const color =
    variant === 'success'
      ? 'bg-orbit-success'
      : variant === 'warning'
        ? 'bg-orbit-warning'
        : variant === 'error'
          ? 'bg-orbit-error'
          : variant === 'info'
            ? 'bg-orbit-info'
            : 'bg-orbit-heavy';

  return (
    <span className="inline-flex items-center gap-2 text-graphic text-white">
      <span className={cn('size-2 rounded-full', color)} />
      {label}
    </span>
  );
}

/**
 * Tag da página Design (`Badge-Tag`) — não confundir com o `Badge` acima, que é
 * a pílula da prancha "12 Tag" do design system.
 *
 * Formato: cantos **superior-esquerdo e inferior-direito** arredondados em 16,
 * os outros dois retos. px 8 · py 4 · gap 4 · texto 10/1.7 Bold.
 *
 * As cores seguem sempre o mesmo par das 14 `Graphic`: o tom escuro no fundo e o
 * tom vivo no texto (ex.: G-Golden #806B17 atrás de G-Topaz #FFD52E). Os tons
 * `*-soft` trocam o fundo por um véu translúcido da própria cor viva — é o que
 * as tags usam por cima da capa do jogo.
 *
 * A família muda conforme o lugar, e isso vem do arquivo: as tags da tabela são
 * Ubuntu, as do card de jogo e do cabeçalho são Montserrat.
 */
const tagVariants = cva(
  'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-br-2xl rounded-tl-2xl px-2 py-1 font-bold [&_svg]:size-3',
  {
    variants: {
      /** `xs` nas tabelas (Ubuntu 10/1.7); `sm` no cabeçalho do jogo (12, entrelinha normal). */
      size: {
        xs: 'text-[10px] leading-[1.7]',
        sm: 'text-[12px] leading-normal',
      },
      tone: {
        topaz: 'bg-orbit-g-golden text-orbit-g-topaz',
        amber: 'bg-orbit-g-burnt text-orbit-g-amber',
        emerald: 'bg-orbit-g-deep text-orbit-g-emerald',
        amethyst: 'bg-orbit-g-royal text-orbit-g-amethyst',
        sapphire: 'bg-orbit-g-midnight text-orbit-g-sapphire',
        ruby: 'bg-orbit-g-crimson text-orbit-g-ruby',
        jade: 'bg-orbit-g-imperial text-orbit-g-jade',
        'jade-soft': 'bg-[rgba(12,248,196,0.25)] text-orbit-g-jade',
        'ruby-soft': 'bg-[rgba(235,55,35,0.25)] text-orbit-g-ruby',
        'emerald-soft': 'bg-[rgba(0,255,120,0.25)] text-orbit-g-emerald',
        'yellow-soft': 'bg-[rgba(255,255,0,0.15)] text-[yellow]',
        veil: 'bg-black/25 text-white',
      },
      font: {
        sans: 'font-sans',
        label: 'font-label',
      },
    },
    defaultVariants: { tone: 'sapphire', font: 'label', size: 'xs' },
  },
);

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

export function Tag({ className, tone, font, size, ...props }: TagProps) {
  return <span className={cn(tagVariants({ tone, font, size }), className)} {...props} />;
}

export { badgeVariants, tagVariants };
