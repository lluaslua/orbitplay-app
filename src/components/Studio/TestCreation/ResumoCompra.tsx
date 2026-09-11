import { Plus } from 'lucide-react';
import { useTestStore } from '@/stores/testStore';
import { PAYMENT_METHODS, PLAYER_TYPES, TEST_MODELS } from '@/utils/constants';
import { formatAmount } from '@/utils/helpers';

/**
 * "Resumo da compra" — Figma `319:9516` (coluna direita) e `757:6564` (centro).
 *
 * A mesma peça aparece nas duas telas, com e sem o rodapé de pagamento, por
 * isso ela vive à parte das etapas.
 */
export function ResumoCompra({ children }: { children?: React.ReactNode }) {
  const draft = useTestStore((state) => state.draft);
  const { budget, audience } = draft;

  const modelo = TEST_MODELS.find((item) => item.id === draft.model);
  const perfil = PLAYER_TYPES.find((item) => item.id === audience.playerType);

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-orbit-border bg-orbit-card p-6">
      <h2 className="text-headline-mobile text-white">Resumo da compra</h2>

      <hr className="border-orbit-border" />

      <p className="flex flex-wrap items-baseline gap-2">
        <span className="text-body-bold text-white">
          R$ {formatAmount(budget.basePriceCents)}/teste
        </span>
        <span className="text-body text-orbit-dim">Modelo base {modelo?.name ?? '—'}</span>
      </p>

      <p className="flex flex-wrap items-baseline gap-2">
        <span className="text-body-bold text-white">
          {budget.untilDisabled ? 'Sem limite' : budget.slots}
        </span>
        <span className="text-body text-orbit-dim">Testes</span>
      </p>

      {budget.audienceCents > 0 && perfil && (
        <LinhaAdicional cents={budget.audienceCents} rotulo={`Tester ${perfil.name}`} />
      )}

      {budget.boostCents > 0 && (
        <LinhaAdicional cents={budget.boostCents} rotulo="Impulsionar teste" />
      )}

      <hr className="border-t border-dashed border-orbit-orange" />

      <p className="text-right text-body-bold text-white">
        R$ {formatAmount(budget.pricePerTestCents)}/teste
      </p>

      <p className="flex items-baseline justify-end gap-1 whitespace-nowrap text-white">
        <span className="font-label text-[16px] font-normal">R$</span>
        <span className="font-label text-[34px] font-bold">{formatAmount(budget.totalCents)}</span>
        <span className="text-caption text-orbit-dim">Total</span>
      </p>

      {children}
    </section>
  );
}

function LinhaAdicional({ cents, rotulo }: { cents: number; rotulo: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-2">
      <Plus className="size-4 shrink-0 self-center text-orbit-blue" />
      <span className="text-body-bold text-white">R$ {formatAmount(cents)}/teste</span>
      <span className="text-body text-orbit-dim">{rotulo}</span>
    </p>
  );
}

/** Fileira de formas de pagamento, só ilustrativa como no arquivo. */
export function FormasDePagamento() {
  return (
    <p className="flex flex-wrap items-center justify-end gap-3 text-caption text-orbit-dim">
      {PAYMENT_METHODS.map((forma) => (
        <span key={forma} className="whitespace-nowrap">
          {forma}
        </span>
      ))}
    </p>
  );
}
