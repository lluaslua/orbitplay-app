import { cn } from '@/utils/helpers';

/**
 * Lockup do OrbitPlug-in: as duas linhas laterais, a elipse ao fundo e a marca.
 *
 * Aparece no card recomendado da etapa 1 do novo teste, no upload da build e no
 * topo do relatório do plug-in (`427:3376`), sempre no mesmo desenho — o que
 * muda é só a largura da faixa, então ela vem por `className`.
 */
export function LockupPlugin({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex w-[395.87px] shrink-0 items-center justify-center', className)}>
      <img
        src="./icons/figma/plugin-ellipse.svg"
        alt=""
        className="pointer-events-none absolute h-[28.411px] w-[334.292px]"
      />
      <img src="./icons/figma/plugin-line-left.svg" alt="" className="relative min-w-0 flex-1" />

      <span className="relative mx-2 flex shrink-0 items-center gap-1 whitespace-nowrap">
        <MarcaPlugin />
        <span className="text-[25.92px] text-white">
          <strong className="font-bold">Orbit</strong>
          <span className="font-normal">Plug-in</span>
        </span>
      </span>

      <img src="./icons/figma/plugin-line-right.svg" alt="" className="relative min-w-0 flex-1" />
    </span>
  );
}

/** Só o símbolo (planeta + brilho), sem as linhas nem o nome. */
export function MarcaPlugin({ className }: { className?: string }) {
  return (
    <span className={cn('relative block size-[32.4px]', className)}>
      <img src="./icons/figma/plugin-mark.svg" alt="" className="size-full" />
      <img
        src="./icons/figma/plugin-sparkle.svg"
        alt=""
        className="absolute left-[58.33%] top-[9.44%] h-[46.67%] w-[50%]"
      />
    </span>
  );
}
