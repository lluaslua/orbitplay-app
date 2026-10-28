import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { caixaCampo } from '@/components/UI';
import type { QuestionType } from '@/types';
import { QUESTION_TYPES } from '@/utils/constants';
import { cn } from '@/utils/helpers';

/**
 * Menu "Tipo da pergunta" da etapa Avaliação do Novo teste — Figma `1192:11096`.
 *
 * As quatro opções do arquivo, na mesma ordem, cada uma com o seu ícone
 * (`align_left_fill`, `round_fill`, `square_fill`, `line_fill`), sempre em
 * #248FF7. Painel branco com borda #E5E5ED, raio 12 e respiro 12; itens de 40
 * com raio 8 e gap 4. O marcado fica em `g-midnight` (#014580) com o texto
 * branco em negrito. O arquivo escreve "Resposta curto"; aqui vai "Resposta
 * curta", que é o rótulo do campo fechado no mesmo frame (`319:7777`).
 *
 * Construído sobre a versão da branch `fix/novo-teste/avaliacao-dropdown`.
 */
export function DropdownTipoPergunta({
  valor,
  onChange,
  className,
}: {
  valor: QuestionType;
  onChange: (valor: QuestionType) => void;
  className?: string;
}) {
  const escolhida = QUESTION_TYPES.find((tipo) => tipo.id === valor) ?? QUESTION_TYPES[0];

  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      <span className="text-body-bold text-white">Tipo da pergunta*</span>

      <DropdownMenuPrimitive.Root modal={false}>
        <DropdownMenuPrimitive.Trigger
          className={cn(caixaCampo(), 'text-left outline-none data-[state=open]:border-orbit-blue')}
        >
          <span className="min-w-0 flex-1 truncate text-body">{escolhida.label}</span>
          <ChevronBaixo />
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 flex w-[var(--radix-dropdown-menu-trigger-width)] flex-col gap-1 rounded-xl border border-orbit-light bg-white p-3"
          >
            {QUESTION_TYPES.map((tipo) => {
              const marcado = tipo.id === valor;
              return (
                <DropdownMenuPrimitive.Item
                  key={tipo.id}
                  onSelect={() => onChange(tipo.id)}
                  className={cn(
                    'flex h-10 cursor-pointer select-none items-center gap-3 rounded-lg px-3 text-body outline-none',
                    marcado
                      ? 'bg-orbit-g-midnight font-bold text-white'
                      : 'text-black data-[highlighted]:bg-orbit-light',
                  )}
                >
                  <img src={`./icons/figma/${tipo.icone}.svg`} alt="" className="size-6 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{tipo.label}</span>
                </DropdownMenuPrimitive.Item>
              );
            })}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </div>
  );
}

/** O `vuesax/linear/arrow-down` de 20 do campo fechado. */
function ChevronBaixo() {
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0" fill="none" aria-hidden>
      <path
        d="m5 7.5 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
