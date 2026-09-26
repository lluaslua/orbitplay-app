import { ChevronDown } from 'lucide-react';
import { caixaCampo, TableFooter } from '@/components/UI';
import { cn } from '@/utils/helpers';

/**
 * Rodapé das duas tabelas: "Mostrar", a contagem e a paginação desenhada
 * (1 2 3 … 9, todos em círculos de 32px, a seta de avançar em azul).
 */
export function RodapeTabela({ exibidos, total }: { exibidos: number; total: number }) {
  return (
    <TableFooter className="pb-[15px] pt-[22px]">
      <div className="flex flex-1 items-center gap-2">
        <span className="text-caption text-white">Mostrar:</span>
        <span className={cn(caixaCampo(), 'w-20 justify-between text-body')}>
          {exibidos}
          <ChevronDown className="size-5" />
        </span>
        <span className="text-caption text-white">
          Mostrando 1-{exibidos} de {total} registros.
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3 text-white">
        <Seta direcao="anterior" />
        <span className="grid size-8 place-items-center rounded-full bg-orbit-blue text-button text-orbit-dim">
          1
        </span>
        {['2', '3', '…', '9'].map((pagina) => (
          <span
            key={pagina}
            className="grid size-8 place-items-center rounded-full border-2 border-orbit-dim text-graphic"
          >
            {pagina}
          </span>
        ))}
        <Seta direcao="proxima" />
      </div>
    </TableFooter>
  );
}

function Seta({ direcao }: { direcao: 'anterior' | 'proxima' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6', direcao === 'anterior' ? 'rotate-180 text-orbit-dim' : 'text-orbit-blue')}
      fill="none"
      aria-hidden
    >
      <path
        d="M4 12h16m0 0-6-6m6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
