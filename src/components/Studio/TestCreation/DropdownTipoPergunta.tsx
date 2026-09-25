import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { caixaCampo } from '@/components/UI';
import type { QuestionType } from '@/types';
import { cn } from '@/utils/helpers';

/**
 * Menu "Tipo da pergunta" da etapa Avaliação (Novo teste).
 * Quatro opções, na ordem do arquivo: resposta curta, escolha, múltipla
 * escolha e escala linear. O item marcado fica em `g-midnight`.
 */
const TIPOS: { id: QuestionType; rotulo: string; icone: IconeTipo }[] = [
  { id: 'SHORT_TEXT', rotulo: 'Resposta curta', icone: 'linhas' },
  { id: 'MULTIPLE_CHOICE', rotulo: 'Escolha', icone: 'radio' },
  { id: 'CHECKBOXES', rotulo: 'Múltipla escolha', icone: 'radio' },
  { id: 'LINEAR_SCALE', rotulo: 'Escala linear', icone: 'escala' },
];

type IconeTipo = 'linhas' | 'radio' | 'escala';

type Props = {
  valor: QuestionType;
  onChange: (valor: QuestionType) => void;
  className?: string;
};

export function DropdownTipoPergunta({ valor, onChange, className }: Props) {
  const escolhida = TIPOS.find((tipo) => tipo.id === valor) ?? TIPOS[0];

  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      <span className="text-body-bold text-white">Tipo da pergunta*</span>

      <DropdownMenuPrimitive.Root modal={false}>
        <DropdownMenuPrimitive.Trigger
          className={cn(caixaCampo(), 'text-left outline-none data-[state=open]:border-orbit-blue')}
        >
          <span className="min-w-0 flex-1 truncate text-body">{escolhida.rotulo}</span>
          <ChevronBaixo />
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 flex w-[var(--radix-dropdown-menu-trigger-width)] flex-col gap-1 rounded-xl bg-[#ececf1] p-2"
          >
            {TIPOS.map((tipo) => {
              const marcado = tipo.id === valor;
              return (
                <DropdownMenuPrimitive.Item
                  key={tipo.id}
                  onSelect={() => onChange(tipo.id)}
                  className={cn(
                    'flex h-10 cursor-pointer select-none items-center gap-3 rounded-lg px-3 text-body outline-none',
                    marcado
                      ? 'bg-orbit-g-midnight font-bold text-white'
                      : 'text-black data-[highlighted]:bg-white/70',
                  )}
                >
                  <Icone nome={tipo.icone} marcado={marcado} />
                  <span className="min-w-0 flex-1 truncate">{tipo.rotulo}</span>
                </DropdownMenuPrimitive.Item>
              );
            })}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </div>
  );
}

function Icone({ nome, marcado }: { nome: IconeTipo; marcado: boolean }) {
  const cor = marcado ? '#ffffff' : '#248ff7';

  if (nome === 'linhas') {
    return (
      <svg viewBox="0 0 20 20" className="size-5 shrink-0" aria-hidden>
        <path d="M3 5.5h14M3 10h14M3 14.5h10" stroke={cor} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (nome === 'radio') {
    return (
      <svg viewBox="0 0 20 20" className="size-5 shrink-0" aria-hidden>
        <circle cx="10" cy="10" r="7" fill="none" stroke={cor} strokeWidth="1.8" />
        <circle cx="10" cy="10" r="3.2" fill={cor} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0" aria-hidden>
      <path
        d="M4 13.5 8.2 6.2 12 11.2 16 4.5"
        fill="none"
        stroke={cor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
