import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils/helpers';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[10rem] overflow-hidden rounded-lg border border-orbit-border bg-orbit-card p-1 shadow-orbit-lg',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { destructive?: boolean }
>(({ className, destructive, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition-colors',
      'focus:bg-orbit-blue/20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4',
      destructive ? 'text-orbit-error focus:bg-orbit-error/15' : 'text-orbit-dim focus:text-orbit-text',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

/**
 * O cartão branco de ações (Figma: frames `Dropdown` do menu do perfil,
 * `1273:4354`, e das linhas de "Gerenciamento de acessos", `1276:5411` e
 * `1276:6202`).
 *
 * Borda `#E5E5ED`, raio 12, padding 12 e itens com gap 4. A largura é de cada
 * frame, então fica no `className` de quem usa.
 */
export const MenuCartao = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DropdownMenuContent
    ref={ref}
    className={cn('flex flex-col gap-1 rounded-xl border-orbit-light bg-white p-3 shadow-none', className)}
    {...props}
  />
));
MenuCartao.displayName = 'MenuCartao';

/**
 * Item do `MenuCartao`: 40px, padding 8/12, gap 12, ícone 24 e Montserrat 16
 * em preto. `perigo` é o vermelho das exclusões; o ícone já vem colorido do
 * SVG exportado. Item sem `onSelect` está desenhado mas não tem tela, e avisa
 * isso no `title`.
 */
export const ItemMenuCartao = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    icone: string;
    perigo?: boolean;
  }
>(({ icone, perigo, className, children, title, onSelect, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    onSelect={onSelect}
    title={title ?? (onSelect ? undefined : 'Ainda não disponível')}
    className={cn(
      'flex h-10 cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-[16px] outline-none transition-colors data-[highlighted]:bg-orbit-light',
      perigo ? 'text-orbit-error-l' : 'text-black',
      className,
    )}
    {...props}
  >
    <img src={icone} alt="" className="size-6 shrink-0" />
    <span className="truncate">{children}</span>
  </DropdownMenuPrimitive.Item>
));
ItemMenuCartao.displayName = 'ItemMenuCartao';

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-orbit-muted', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-orbit-border', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
