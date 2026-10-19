import { DropdownMenu, DropdownMenuTrigger, ItemMenuCartao, MenuCartao } from '@/components/UI';

export interface AcaoDoMenu {
  rotulo: string;
  /** SVG exportado do frame, já na cor do item. */
  icone: string;
  onSelect?: () => void;
  /** "Excluir usuário" e "Excluir grupo" saem em vermelho. */
  perigo?: boolean;
}

/** O "⋮" da coluna Ações com o dropdown desenhado no Figma (`1276:5411` e `1276:6202`): 336px. */
export function MenuAcoes({ rotulo, acoes }: { rotulo: string; acoes: AcaoDoMenu[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={rotulo} className="shrink-0 orbit-focus-ring">
          <img src="./icons/figma/row-more.svg" alt="" className="size-6" />
        </button>
      </DropdownMenuTrigger>

      <MenuCartao align="end" className="w-[336px]">
        {acoes.map((acao) => (
          <ItemMenuCartao key={acao.rotulo} icone={acao.icone} perigo={acao.perigo} onSelect={acao.onSelect}>
            {acao.rotulo}
          </ItemMenuCartao>
        ))}
      </MenuCartao>
    </DropdownMenu>
  );
}
