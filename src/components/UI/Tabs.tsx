import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/utils/helpers';

/**
 * Tabs do design system (Figma: prancha "12 Tab", node 151:7469 — `FixedTabs`).
 *
 * Geometria do arquivo (idêntica nas duas superfícies):
 *   coluna centralizada · pt 12 · gap 16 · rótulo 16px centrado com px 12
 *   barra inferior ocupando a largura toda: 2px nos estados com ênfase, 1px no inativo
 *   a régua da linha de tabs é o Separator/Light (inset 0 -1px #CBD5E1)
 *
 * Cores — o componente foi desenhado sobre fundo ESCURO (é o tab da landing page):
 *   Inativo  Montserrat Regular, branco       · barra branca 1px
 *   Hover    Montserrat Bold, #875AF2         · barra #875AF2
 *   Ativo    Montserrat Bold, #248FF7         · barra #248FF7
 *   Disabled Montserrat Bold, #A0A3A9         · barra #A0A3A9
 *
 * O app é escuro, então `dark` é o padrão. `surface="light"` existe para o caso
 * de um bloco claro isolado e mantém a mesma geometria com a rampa neutra.
 */
type Surface = 'light' | 'dark';

const SurfaceContext = React.createContext<Surface>('light');

export const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & { surface?: Surface }
>(({ surface = 'dark', ...props }, ref) => (
  <SurfaceContext.Provider value={surface}>
    <TabsPrimitive.Root ref={ref} {...props} />
  </SurfaceContext.Provider>
));
Tabs.displayName = 'Tabs';

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const surface = React.useContext(SurfaceContext);
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'flex items-stretch gap-8',
        // Separator/Light: régua de 1px sob a linha inteira de tabs
        surface === 'dark'
          ? 'shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.25)]'
          : 'shadow-[inset_0_-1px_0_0_#CBD5E1]',
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const surface = React.useContext(SurfaceContext);
  const dark = surface === 'dark';

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'group flex flex-col items-center gap-4 pt-3 transition-colors orbit-focus-ring',
        'disabled:pointer-events-none',
        dark
          ? [
              'font-normal text-white',
              'hover:font-bold hover:text-orbit-purple',
              'data-[state=active]:font-bold data-[state=active]:text-orbit-blue',
              'disabled:font-bold disabled:text-orbit-muted',
            ]
          : [
              'font-normal text-orbit-heavy',
              'hover:font-bold hover:text-orbit-dark',
              'data-[state=active]:font-bold data-[state=active]:text-orbit-blue',
              'disabled:font-bold disabled:text-orbit-medium',
            ],
        className,
      )}
      {...props}
    >
      <span className="whitespace-nowrap px-3 text-center text-[16px] leading-none">{children}</span>

      {/* Barra inferior: 1px no inativo, 2px quando há ênfase */}
      <span
        aria-hidden
        className={cn(
          'h-px w-full transition-all',
          dark
            ? [
                'bg-white',
                'group-hover:h-0.5 group-hover:bg-orbit-purple',
                'group-data-[state=active]:h-0.5 group-data-[state=active]:bg-orbit-blue',
                'group-disabled:h-0.5 group-disabled:bg-orbit-muted',
              ]
            : [
                'bg-transparent',
                'group-hover:h-0.5 group-hover:bg-orbit-dark',
                'group-data-[state=active]:h-0.5 group-data-[state=active]:bg-orbit-blue',
                'group-disabled:h-0.5 group-disabled:bg-orbit-medium',
              ],
        )}
      />
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-5 animate-fade-in orbit-focus-ring', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
