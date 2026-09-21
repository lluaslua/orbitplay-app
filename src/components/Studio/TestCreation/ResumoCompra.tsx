import { useTestStore } from '@/stores/testStore';
import { PAYMENT_METHODS, PLAYER_TYPES, TEST_MODELS } from '@/utils/constants';
import { cn, formatAmount, formatNumber } from '@/utils/helpers';

/**
 * "Resumo da compra" — Figma `319:9516` (coluna direita, `438:3851`) e
 * `757:6564` (centro, `757:6719`).
 *
 * A mesma peça aparece nas duas telas, com e sem o rodapé de pagamento, por
 * isso ela vive à parte das etapas. A caixa muda entre elas: no Orçamento tem
 * fundo translúcido, borda #E7E8E9 e 32 de respiro; na confirmação, sem fundo,
 * borda branca e 24 — quem chama ajusta pelo `className`.
 */
export function ResumoCompra({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const draft = useTestStore((state) => state.draft);
  const { budget, audience } = draft;

  const modelo = TEST_MODELS.find((item) => item.id === draft.model);
  const perfil = PLAYER_TYPES.find((item) => item.id === audience.playerType);

  return (
    <section
      className={cn(
        'flex flex-col gap-6 rounded-3xl border border-orbit-dim bg-orbit-card p-8',
        className,
      )}
    >
      <h2 className="text-headline leading-[normal] text-white">Resumo da compra</h2>

      <hr className="border-orbit-dim" />

      <Linha
        valor={`R$ ${formatAmount(budget.basePriceCents)}/teste`}
        rotulo={`Modelo base ${modelo?.name ?? '—'}`}
      />

      <Linha
        valor={budget.untilDisabled ? 'Sem limite' : formatNumber(budget.slots)}
        rotulo="Testes"
      />

      {budget.audienceCents > 0 && perfil && (
        <LinhaAdicional cents={budget.audienceCents} rotulo={`Tester ${perfil.name}`} />
      )}

      {budget.boostCents > 0 && (
        <LinhaAdicional cents={budget.boostCents} rotulo="Impulsionar teste" />
      )}

      {/* Tracejado do arquivo: traços de 12 com vãos de 12 (`Line 189`). */}
      <hr
        className="h-px border-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #E7E8E9 0 12px, transparent 12px 24px)',
        }}
      />

      <p className="text-right text-headline-mobile leading-[normal] text-white">
        R$ {formatAmount(budget.pricePerTestCents)}/teste
      </p>

      <Total cents={budget.totalCents} />

      {children}
    </section>
  );
}

/** Valor em Bold 24 seguido do rótulo em 16. */
function Linha({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-white">
      <span className="text-headline-mobile leading-[normal]">{valor}</span>
      <span className="text-body leading-[normal]">{rotulo}</span>
    </p>
  );
}

/** Adicional por teste, com o `add_fill` azul do arquivo. */
function LinhaAdicional({ cents, rotulo }: { cents: number; rotulo: string }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-white">
      <img src="./icons/figma/resumo/adicional.svg" alt="+" className="size-6 shrink-0" />
      <span className="text-body-bold leading-[normal]">R$ {formatAmount(cents)}/teste</span>
      <span className="text-body leading-[normal]">{rotulo}</span>
    </p>
  );
}

/**
 * "R$705,00 Total" — Figma `438:4163`. Ubuntu: "R$" Light 24, valor Bold 48,
 * branco, com contorno de 2px em degradê azul→roxo por fora e sombra de 25%.
 *
 * CSS não pinta contorno de texto em degradê. O que funciona é recortar o
 * degradê no texto com um traço transparente de 4px: o preenchimento branco
 * cobre a metade de dentro do traço e o degradê aparece só na metade de fora.
 * A sombra vai no `filter`, porque um `text-shadow` cobriria o contorno.
 */
function Total({ cents }: { cents: number }) {
  return (
    <p className="flex items-center justify-end gap-1 whitespace-nowrap font-label leading-[normal] text-white">
      <span
        className="bg-clip-text [-webkit-text-stroke:4px_transparent]"
        style={{
          backgroundImage: 'linear-gradient(90deg, #248FF7, #875AF2)',
          filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        }}
      >
        <span className="text-[24px] font-light">R$</span>
        <span className="text-[48px] font-bold">{formatAmount(cents)}</span>
      </span>
      <span className="text-[16px] font-light">Total</span>
    </p>
  );
}

/** Ícones das formas de pagamento, exportados do arquivo (`438:4166`). */
const ICONE_PAGAMENTO: Record<string, string> = {
  'Pix BR$': 'resumo/pix',
  Boleto: 'resumo/boleto',
  'Cartão de crédito': 'resumo/cartao',
  PayPal: 'resumo/paypal',
};

/** Fileira de formas de pagamento, só ilustrativa como no arquivo. */
export function FormasDePagamento() {
  return (
    <p className="flex flex-wrap items-center justify-end gap-2 text-body leading-[normal] text-white">
      {PAYMENT_METHODS.map((forma) => (
        <span key={forma} className="flex items-center gap-1 whitespace-nowrap">
          {ICONE_PAGAMENTO[forma] && (
            <img
              src={`./icons/figma/${ICONE_PAGAMENTO[forma]}.svg`}
              alt=""
              className="size-6 shrink-0"
            />
          )}
          {forma}
        </span>
      ))}
    </p>
  );
}
