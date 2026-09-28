import type { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/UI';
import { cn } from '@/utils/helpers';

export interface AcaoDoMenu {
  rotulo: string;
  icone: ReactNode;
  onSelect?: () => void;
  /** "Excluir usuário" e "Excluir grupo" saem em vermelho. */
  perigo?: boolean;
}

/**
 * O "⋮" da coluna Ações com o dropdown desenhado no Figma: 336px, fundo
 * branco, itens de 44px com ícone 20 e texto 14.
 */
export function MenuAcoes({ rotulo, acoes }: { rotulo: string; acoes: AcaoDoMenu[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={rotulo} className="shrink-0 orbit-focus-ring">
          <img src="./icons/figma/row-more.svg" alt="" className="size-6" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[336px] rounded-xl border-orbit-light bg-white p-2">
        {acoes.map((acao) => (
          <DropdownMenuItem
            key={acao.rotulo}
            onSelect={acao.onSelect}
            title={acao.onSelect ? undefined : 'Ainda não disponível'}
            className={cn(
              'h-11 gap-4 rounded-lg px-4 text-[16px] leading-none focus:bg-orbit-light [&_svg]:size-5',
              acao.perigo
                ? 'text-orbit-error-l focus:text-orbit-error-l [&_svg]:text-orbit-error-l'
                : 'text-orbit-dark focus:text-orbit-dark [&_svg]:text-orbit-blue',
            )}
          >
            <span className="grid size-5 shrink-0 place-items-center">{acao.icone}</span>
            {acao.rotulo}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
