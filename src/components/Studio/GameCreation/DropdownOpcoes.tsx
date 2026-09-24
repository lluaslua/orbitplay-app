import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import { caixaCampo } from '@/components/UI';
import { cn } from '@/utils/helpers';

export interface OpcaoDropdown {
  valor: string;
  rotulo: string;
  /** Bandeira do idioma (`Flag` do arquivo), quando houver. */
  icone?: string;
}

type Props = {
  label: string;
  required?: boolean;
  opcoes: readonly OpcaoDropdown[];
} & (
  | { multiplo: true; valor: string[]; onChange: (valor: string[]) => void }
  | { multiplo?: false; valor: string; onChange: (valor: string) => void }
);

/**
 * Seletor dos campos da etapa "Informações" de Novo jogo — frames `Dropdown`
 * abaixo do fluxo no Figma (`1186:8388`, `1186:8497`, `1186:8554`,
 * `1186:8611`, `1186:8640`, `1187:8677`).
 *
 * Painel branco, raio 12, padding 12, itens de 40px com gap 4. Plataformas e
 * Idiomas usam checkbox (vários); os outros usam radio (um só). O item
 * marcado fica em `g-midnight` com texto branco em negrito.
 */
export function DropdownOpcoes(props: Props) {
  const { label, required, opcoes, multiplo } = props;
  const marcados = multiplo ? props.valor : props.valor ? [props.valor] : [];
  const escolhidas = opcoes.filter((opcao) => marcados.includes(opcao.valor));

  function alternar(valor: string) {
    if (props.multiplo) {
      props.onChange(
        props.valor.includes(valor)
          ? props.valor.filter((item) => item !== valor)
          : [...props.valor, valor],
      );
    } else {
      props.onChange(valor);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <span className="text-body-bold text-white">
        {label}
        {required && '*'}
      </span>

      <DropdownMenuPrimitive.Root modal={false}>
        <DropdownMenuPrimitive.Trigger
          className={cn(caixaCampo(), 'text-left outline-none data-[state=open]:border-orbit-blue')}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-body">
            {escolhidas.length === 0
              ? 'Selecione...'
              : escolhidas.map((opcao, indice) => (
                  <span key={opcao.valor} className="inline-flex items-center gap-2">
                    {opcao.icone && <img src={opcao.icone} alt="" className="size-5" />}
                    {opcao.rotulo}
                    {indice < escolhidas.length - 1 && ','}
                  </span>
                ))}
          </span>
          <ChevronBaixo />
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 flex w-[var(--radix-dropdown-menu-trigger-width)] flex-col gap-1 rounded-xl border border-orbit-light bg-white p-3"
          >
            {opcoes.map((opcao) => {
              const marcado = marcados.includes(opcao.valor);
              return (
                <DropdownMenuPrimitive.CheckboxItem
                  key={opcao.valor}
                  checked={marcado}
                  onSelect={(event) => {
                    // Com vários, o painel fica aberto para marcar o próximo.
                    if (multiplo) event.preventDefault();
                    alternar(opcao.valor);
                  }}
                  className={cn(
                    'flex h-10 cursor-pointer select-none items-center gap-3 rounded-lg px-3 text-body outline-none',
                    marcado
                      ? 'bg-orbit-g-midnight font-bold text-white'
                      : 'text-black data-[highlighted]:bg-orbit-light',
                  )}
                >
                  {multiplo ? <Caixa marcado={marcado} /> : <Radio marcado={marcado} />}
                  {opcao.icone && <img src={opcao.icone} alt="" className="size-6" />}
                  {opcao.rotulo}
                </DropdownMenuPrimitive.CheckboxItem>
              );
            })}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </div>
  );
}

/** `Checkbox` do arquivo: 24px, raio 8, borda 2 `muted` ou cheio em `blue`. */
function Caixa({ marcado }: { marcado: boolean }) {
  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-lg',
        marcado ? 'bg-orbit-blue text-white' : 'border-2 border-orbit-muted bg-white',
      )}
    >
      {marcado && <Check className="size-4" strokeWidth={2.5} />}
    </span>
  );
}

/** `Radio` do arquivo: 24px, miolo branco de 8px (marcado) ou 20px (vazio). */
function Radio({ marcado }: { marcado: boolean }) {
  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full',
        marcado ? 'bg-orbit-blue-deep' : 'bg-orbit-medium',
      )}
    >
      <span className={cn('rounded-full bg-white', marcado ? 'size-2' : 'size-5')} />
    </span>
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
