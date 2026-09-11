import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/helpers';

/**
 * Card do design system (Figma: prancha "20 Cards", node 151:8369 — componente `Card`).
 *
 * Base do arquivo: fundo branco · borda 1px #E5E5ED · **raio 24** · padding 24 · gap 16.
 * Três estilos:
 *   Quick Access  152×128, centralizado, ícone 36 + título 16
 *   Simple        421×256, cabeçalho + área livre + link
 *   Complex       421×384, cabeçalho + trio de big-numbers + área livre + link
 *
 * Cabeçalho: título Montserrat **Medium 20** #111827 · subtítulo Regular 12 #8A8D91 · ícone 24
 */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-4 rounded-3xl border border-orbit-border bg-orbit-card p-6',
      interactive && 'cursor-pointer transition-colors hover:border-orbit-blue hover:bg-orbit-card-hover',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

/** Linha de cabeçalho: título + subtítulo à esquerda, ícone/ação à direita. */
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { action?: React.ReactNode }
>(({ className, children, action, ...props }, ref) => (
  <div ref={ref} className={cn('flex w-full items-center gap-4', className)} {...props}>
    <div className="flex min-w-0 flex-1 flex-col justify-center">{children}</div>
    {action && <span className="shrink-0 [&_svg]:size-6">{action}</span>}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-subtitle text-white', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-caption text-orbit-muted', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('w-full', className)} {...props} />,
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

/**
 * "big-number" do card Complex.
 * Rótulo Ubuntu Regular 12 · valor Ubuntu Bold 16 · variação 12 com seta de 12px,
 * verde #1FC16B para alta e vermelho #D00416 para queda.
 */
export function CardStat({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: number;
}) {
  const up = (trend ?? 0) >= 0;

  return (
    <div className="flex flex-1 flex-col gap-1">
      <span className="font-label text-[12px] font-normal text-orbit-muted">{label}</span>
      <div className="flex items-center gap-0.5">
        <span className="font-label text-[16px] font-bold text-white">{value}</span>
        {trend !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 font-label text-[12px] font-normal',
              up ? 'text-orbit-success' : 'text-orbit-error',
            )}
          >
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * "Link to click" do rodapé dos cards: Montserrat Bold 16 azul + seta de 20px.
 *
 * Com `asChild`, envolve um `<Link>` do router em vez de emitir um `<a>` — a
 * seta continua sendo responsabilidade daqui, então quem chama só passa o texto.
 */
export function CardLink({
  children,
  className,
  asChild,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'a';
  const classes = cn(
    'inline-flex items-center gap-1 text-button text-orbit-blue hover:underline',
    className,
  );

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<{
      children?: React.ReactNode;
    }>;

    return (
      <Comp className={classes} {...props}>
        {React.cloneElement(child, undefined, child.props.children, <ArrowRight className="size-5" />)}
      </Comp>
    );
  }

  return (
    <Comp className={classes} {...props}>
      {children}
      <ArrowRight className="size-5" />
    </Comp>
  );
}
